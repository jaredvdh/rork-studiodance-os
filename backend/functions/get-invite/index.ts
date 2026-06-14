import { createAdminClient } from "../_shared/auth.ts";
import { handlePreflight, jsonCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonCorsHeaders(req),
    });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing invite token" }), {
        status: 400,
        headers: jsonCorsHeaders(req),
      });
    }

    const supabase = createAdminClient();

    // Look up the invite by token
    const { data: invite, error: inviteError } = await supabase
      .from("invites")
      .select("id, token, studio_id, email, status, created_at, expires_at")
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      return new Response(JSON.stringify({ error: "Invalid or expired invite link" }), {
        status: 404,
        headers: jsonCorsHeaders(req),
      });
    }

    // Check expiration
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from("invites")
        .update({ status: "expired" })
        .eq("id", invite.id);

      return new Response(JSON.stringify({ error: "This invite link has expired. Please ask your studio for a new one." }), {
        status: 410,
        headers: jsonCorsHeaders(req),
      });
    }

    // Check if already used
    if (invite.status === "accepted") {
      return new Response(JSON.stringify({ error: "This invite has already been used. Please sign in or ask for a new invite." }), {
        status: 409,
        headers: jsonCorsHeaders(req),
      });
    }

    // Fetch studio details for the registration page
    const { data: studio, error: studioError } = await supabase
      .from("studios")
      .select("id, name, city, vertical, logo_url, settings")
      .eq("id", invite.studio_id)
      .single();

    if (studioError || !studio) {
      return new Response(JSON.stringify({ error: "Studio not found" }), {
        status: 404,
        headers: jsonCorsHeaders(req),
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        invite: {
          token: invite.token,
          email: invite.email,
          status: invite.status,
        },
        studio: {
          id: studio.id,
          name: studio.name,
          city: studio.city,
          vertical: studio.vertical,
          logo_url: studio.logo_url,
          settings: studio.settings,
        },
      }),
      { headers: jsonCorsHeaders(req) },
    );
  } catch (err) {
    console.error("get-invite error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: jsonCorsHeaders(req),
    });
  }
});
