import { requireAuth, createAdminClient, AuthError } from "../_shared/auth.ts";
import { handlePreflight, jsonCorsHeaders } from "../_shared/cors.ts";

interface CreateInvitePayload {
  email?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonCorsHeaders(req),
    });
  }

  try {
    const user = await requireAuth(req);
    const { email } = (await req.json()) as CreateInvitePayload;

    const supabase = createAdminClient();

    // Find the studio owned by this user
    const { data: studio, error: studioError } = await supabase
      .from("studios")
      .select("id, name")
      .eq("owner_id", user.userId)
      .single();

    if (studioError || !studio) {
      return new Response(JSON.stringify({ error: "Studio not found. Complete setup first." }), {
        status: 404,
        headers: jsonCorsHeaders(req),
      });
    }

    // Create the invite
    const { data: invite, error: inviteError } = await supabase
      .from("invites")
      .insert({
        studio_id: studio.id,
        email: email?.trim() || null,
        status: "pending",
      })
      .select("token, email, created_at, expires_at")
      .single();

    if (inviteError || !invite) {
      console.error("create-invite insert error:", inviteError);
      return new Response(JSON.stringify({ error: "Failed to create invite" }), {
        status: 500,
        headers: jsonCorsHeaders(req),
      });
    }

    // Build the full registration URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const functionBase = supabaseUrl.replace(/\/rest\/v1$/i, "").replace(/\/+$/, "");
    const registerUrl = `${functionBase}/functions/v1/get-invite?token=${invite.token}`;

    // Also build the frontend URL for convenience
    const frontendOrigin = req.headers.get("Origin") || req.headers.get("Referer")?.split("/").slice(0, 3).join("/") || "";

    return new Response(
      JSON.stringify({
        ok: true,
        token: invite.token,
        email: invite.email,
        created_at: invite.created_at,
        expires_at: invite.expires_at,
        /** The frontend registration URL parents should visit */
        register_url: frontendOrigin
          ? `${frontendOrigin}/parent/register?invite=${invite.token}`
          : `/parent/register?invite=${invite.token}`,
        studio_name: studio.name,
      }),
      { headers: jsonCorsHeaders(req) },
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: jsonCorsHeaders(req),
      });
    }
    console.error("create-invite error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: jsonCorsHeaders(req),
    });
  }
});
