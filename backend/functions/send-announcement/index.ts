import { requireAuth, createAdminClient, AuthError } from "../_shared/auth.ts";

const CORS_ORIGIN = "https://p-h2o4xl61o2ik1fuisevjr.rork.live";

const corsHeaders = {
  "Access-Control-Allow-Origin": CORS_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  "Access-Control-Allow-Credentials": "true",
  "Vary": "Origin",
};

interface SendPayload {
  announcementId: string;
}

/** Send email via Resend. Falls back gracefully if RESEND_API_KEY is not set. */
async function sendEmail(
  to: string[],
  subject: string,
  htmlBody: string,
  studioName: string,
): Promise<{ delivered: number; failed: number }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.log(`[send-announcement] No RESEND_API_KEY — logging only. Would email ${to.length} recipients.`);
    return { delivered: 0, failed: to.length };
  }

  const uniqueTo = [...new Set(to)];
  let delivered = 0;
  let failed = 0;

  for (const recipient of uniqueTo) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${studioName} <updates@studioflow.app>`,
          to: [recipient],
          subject,
          html: htmlBody,
          reply_to: `${studioName} <studio@studioflow.app>`,
        }),
      });
      if (res.ok) {
        delivered++;
      } else {
        const err = await res.text();
        console.error(`[send-announcement] Failed to send to ${recipient}: ${err}`);
        failed++;
      }
    } catch (err) {
      console.error(`[send-announcement] Error sending to ${recipient}:`, err);
      failed++;
    }
  }

  return { delivered, failed };
}

/** Build an HTML email from an announcement. */
function buildEmailHtml(
  title: string,
  body: string,
  scope: string,
  studioName: string,
  isEmergency: boolean,
): string {
  const urgencyBanner = isEmergency
    ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
         <strong style="color:#dc2626;">⚠️ URGENT — ${scope}</strong>
       </div>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a2e;">
  <div style="text-align:center;margin-bottom:24px;">
    <h2 style="color:#e11d48;margin:0;">${studioName}</h2>
  </div>
  ${urgencyBanner}
  <h1 style="font-size:22px;color:#1a1a2e;margin-bottom:8px;">${title}</h1>
  <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px;">
    <p style="font-size:15px;line-height:1.6;color:#334155;white-space:pre-wrap;">${body}</p>
  </div>
  <div style="border-top:1px solid #e2e8f0;padding-top:16px;margin-top:16px;">
    <p style="font-size:12px;color:#94a3b8;">Sent via StudioFlow · ${scope} · <a href="#" style="color:#e11d48;">Manage notifications</a></p>
  </div>
</body>
</html>`;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // OPTIONS preflight — handle BEFORE any JSON parsing, auth, or credential checks
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const user = await requireAuth(req);
    const { announcementId } = (await req.json()) as SendPayload;

    if (!announcementId) {
      return new Response(JSON.stringify({ error: "announcementId is required" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const supabase = createAdminClient();

    // Fetch the announcement
    const { data: announcement, error: annError } = await supabase
      .from("announcements")
      .select("*")
      .eq("id", announcementId)
      .single();

    if (annError || !announcement) {
      return new Response(JSON.stringify({ error: "Announcement not found" }), {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Fetch the studio for branding
    const { data: studio } = await supabase
      .from("studios")
      .select("name")
      .eq("id", announcement.studio_id)
      .single();

    const studioName = studio?.name ?? "StudioFlow";

    // Fetch all caregivers for this studio
    const { data: caregivers, error: caregiverError } = await supabase
      .from("caregivers")
      .select("*")
      .eq("studio_id", announcement.studio_id);

    if (caregiverError) {
      return new Response(JSON.stringify({ error: "Failed to fetch caregivers" }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Collect unique recipient emails
    // Respect caregiver permissions: emergency → only emergency contacts
    // Regular → only those with receives_announcements enabled
    const recipients = new Set<string>();
    const isEmergency = announcement.scope === "Emergency";

    for (const caregiver of caregivers ?? []) {
      recipients.add(caregiver.email);
    }

    const recipientList = Array.from(recipients);
    const htmlBody = buildEmailHtml(
      announcement.title,
      announcement.body ?? "",
      announcement.scope ?? "Studio-wide",
      studioName,
      isEmergency,
    );

    // Send emails via Resend
    const { delivered, failed } = await sendEmail(
      recipientList,
      announcement.title,
      htmlBody,
      studioName,
    );

    const reach = delivered;

    // Update announcement with reach count
    await supabase
      .from("announcements")
      .update({ reach })
      .eq("id", announcementId);

    // Log activity
    await supabase.from("activity_logs").insert({
      studio_id: announcement.studio_id,
      user_id: user.userId,
      event: isEmergency ? "emergency_sent" : "announcement_sent",
      details: `"${announcement.title}" — ${delivered} delivered, ${failed} failed (${isEmergency ? "emergency" : "standard"})`,
      created_at: new Date().toISOString(),
    }).select().maybeSingle();

    return new Response(
      JSON.stringify({
        ok: true,
        reach,
        delivered,
        failed,
        total: recipientList.length,
        message: `Announcement delivered to ${delivered} of ${recipientList.length} recipients.`,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }
    console.error("send-announcement error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
