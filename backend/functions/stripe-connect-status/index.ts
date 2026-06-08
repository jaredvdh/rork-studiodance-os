/**
 * Edge Function: stripe-connect-status
 *
 * Retrieves the current Stripe Connect account status for a studio so the UI
 * can show whether the studio can accept charges and receive payouts.
 *
 * POST /functions/v1/stripe-connect-status
 * Body: { studioId }
 * Returns: { status, accountId, chargesEnabled, payoutsEnabled }
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { requireAuth, createAdminClient } from "../_shared/auth.ts";
import { handlePreflight, jsonCorsHeaders } from "../_shared/cors.ts";

const STRIPE_SECRET = Deno.env.get("SUPABASE_STRIPE_SECRET_KEY") ?? "";

serve(async (req: Request) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  const corsHeaders = (): Record<string, string> => jsonCorsHeaders(req);

  try {
    await requireAuth(req);

    const { studioId } = await req.json();
    if (!studioId) {
      return new Response(
        JSON.stringify({ error: "studioId is required" }),
        { status: 400, headers: corsHeaders() },
      );
    }

    if (!STRIPE_SECRET) {
      return new Response(
        JSON.stringify({ error: "Stripe is not configured for this project" }),
        { status: 503, headers: corsHeaders() },
      );
    }

    const admin = createAdminClient();

    const { data: studio, error: studioErr } = await admin
      .from("studios")
      .select("id, stripe_account_id")
      .eq("id", studioId)
      .single();

    if (studioErr || !studio) {
      return new Response(
        JSON.stringify({ error: "Studio not found" }),
        { status: 404, headers: corsHeaders() },
      );
    }

    const accountId: string | null = studio.stripe_account_id ?? null;

    // No Connect account yet — studio hasn't started onboarding
    if (!accountId) {
      return new Response(
        JSON.stringify({
          status: "not_connected",
          accountId: null,
          chargesEnabled: false,
          payoutsEnabled: false,
        }),
        { headers: corsHeaders() },
      );
    }

    const acctRes = await fetch(
      `https://api.stripe.com/v1/accounts/${accountId}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${STRIPE_SECRET}` },
      },
    );

    if (!acctRes.ok) {
      const err = await acctRes.json();
      console.error("Stripe account retrieval failed:", err);
      return new Response(
        JSON.stringify({
          error: `Stripe error: ${err.error?.message ?? "Failed to retrieve account"}`,
        }),
        { status: 502, headers: corsHeaders() },
      );
    }

    const account = await acctRes.json();
    const chargesEnabled = Boolean(account.charges_enabled);
    const payoutsEnabled = Boolean(account.payouts_enabled);
    const status = chargesEnabled && payoutsEnabled
      ? "active"
      : account.details_submitted
        ? "pending"
        : "onboarding";

    return new Response(
      JSON.stringify({
        status,
        accountId,
        chargesEnabled,
        payoutsEnabled,
      }),
      { headers: corsHeaders() },
    );
  } catch (err) {
    console.error("stripe-connect-status error:", err);
    if (err.name === "AuthError") {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 401,
        headers: corsHeaders(),
      });
    }
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders() },
    );
  }
});
