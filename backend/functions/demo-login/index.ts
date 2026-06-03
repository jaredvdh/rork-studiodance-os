import { createAdminClient } from "../_shared/auth.ts";

const CORS_ORIGIN = "https://p-h2o4xl61o2ik1fuisevjr.rork.live";

const corsHeaders = {
  "Access-Control-Allow-Origin": CORS_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

/* ── Demo credentials ─────────────────────────────────────────────── */

interface DemoAccount {
  email: string;
  password: string;
  userId: string;
  name: string;
  role: string;
  studioId: string;
  isDemo: true;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "demo.admin@studioflow.app",
    password: "StudioFlowDemo123!",
    userId: "demo_user_admin_dance",
    name: "Aurora Admin",
    role: "studio_admin",
    studioId: "demo_studio_aurora",
    isDemo: true,
  },
  {
    email: "demo.parent@studioflow.app",
    password: "StudioFlowDemo123!",
    userId: "demo_user_parent_dance",
    name: "Diane Walsh",
    role: "parent",
    studioId: "demo_studio_aurora",
    isDemo: true,
  },
  {
    email: "demo.crossfit@studioflow.app",
    password: "StudioFlowDemo123!",
    userId: "demo_user_admin_crossfit",
    name: "Northside Admin",
    role: "studio_admin",
    studioId: "demo_studio_crossfit",
    isDemo: true,
  },
];

/* ── JWT helpers ──────────────────────────────────────────────────── */

function base64url(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function textEncode(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/** Create an unsigned JWT that the frontend `userFromToken` can decode.
 * The frontend does NOT verify signatures — it only decodes the payload
 * and checks expiration, so we can use a dummy signature. */
function createDemoToken(payload: Record<string, unknown>): string {
  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = base64url(textEncode(JSON.stringify(header)));
  const payloadB64 = base64url(textEncode(JSON.stringify(payload)));
  // Dummy signature — 32 random bytes base64url-encoded
  const sig = base64url(crypto.getRandomValues(new Uint8Array(32)));
  return `${headerB64}.${payloadB64}.${sig}`;
}

/* ── Handler ──────────────────────────────────────────────────────── */

interface LoginBody {
  email: string;
  password: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { email, password } = (await req.json()) as LoginBody;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const account = DEMO_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.toLowerCase(),
    );

    if (!account || account.password !== password) {
      return new Response(JSON.stringify({ error: "Invalid demo credentials" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure demo profiles exist in Supabase (upsert so repeated logins are safe)
    const supabase = createAdminClient();

    await supabase.from("profiles").upsert({
      id: account.userId,
      email: account.email,
      name: account.name,
      role: account.role,
      studio_id: account.studioId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

    // Upsert the studio if it doesn't exist
    if (account.studioId === "demo_studio_aurora") {
      await supabase.from("studios").upsert({
        id: "demo_studio_aurora",
        name: "Aurora Dance Academy",
        tagline: "Where every dancer finds their light",
        city: "Portland, OR",
        brand_color: "350 74% 60%",
        initials: "AD",
        vertical: "dance",
        owner_id: "demo_user_admin_dance",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
    } else if (account.studioId === "demo_studio_crossfit") {
      await supabase.from("studios").upsert({
        id: "demo_studio_crossfit",
        name: "Northside CrossFit",
        tagline: "Forged by community. Driven by results.",
        city: "Portland, OR",
        brand_color: "32 82% 48%",
        initials: "NC",
        vertical: "crossfit",
        owner_id: "demo_user_admin_crossfit",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
    }

    // Create demo token with 24-hour expiry
    const exp = Math.floor(Date.now() / 1000) + 86400;
    const token = createDemoToken({
      sub: account.userId,
      email: account.email,
      name: account.name,
      role: account.role,
      studio_id: account.studioId,
      is_demo: true,
      exp,
      iat: Math.floor(Date.now() / 1000),
    });

    return new Response(JSON.stringify({
      access_token: token,
      refresh_token: token, // demos don't refresh — same token reused
      user: {
        id: account.userId,
        email: account.email,
        name: account.name,
        role: account.role,
        studio_id: account.studioId,
        is_demo: true,
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("demo-login error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
