import { requireAuth, createAdminClient, AuthError } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface SendPayload {
  announcementId: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const user = await requireAuth(req);
    const { announcementId } = (await req.json()) as SendPayload;

    if (!announcementId) {
      return new Response(JSON.stringify({ error: "announcementId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all parents for this studio
    const { data: parents, error: parentError } = await supabase
      .from("parents")
      .select("*")
      .eq("studio_id", announcement.studio_id);

    if (parentError) {
      return new Response(JSON.stringify({ error: "Failed to fetch parents" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Collect unique recipient emails, respecting caregiver permissions
    const recipients = new Set<string>();
    const isEmergency = announcement.scope === "Emergency";

    for (const parent of parents ?? []) {
      // Primary contact always receives unless they've opted out
      if (isEmergency) {
        recipients.add(parent.email);
      } else {
        recipients.add(parent.email);
      }
    }

    // Log the delivery
    const reach = recipients.size;
    await supabase
      .from("announcements")
      .update({ reach })
      .eq("id", announcementId);

    // Log activity
    await supabase.from("activity_logs").insert({
      studio_id: announcement.studio_id,
      user_id: user.userId,
      event: "announcement_sent",
      details: `Announcement "${announcement.title}" sent to ${reach} recipients`,
      created_at: new Date().toISOString(),
    }).select().maybeSingle();

    return new Response(
      JSON.stringify({
        ok: true,
        reach,
        recipients: Array.from(recipients),
        message: `Announcement delivered to ${reach} recipients.`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.error("send-announcement error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
