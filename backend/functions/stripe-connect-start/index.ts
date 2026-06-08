/**
 * Edge Function: stripe-connect-start
 *
 * Starts Stripe Connect onboarding for a studio. Creates a Stripe Connect
 * (Express) account for the studio if one doesn't already exist, persists the
 * account id on the studio, generates an onboarding (account) link, and
 * returns its URL for the studio owner to complete onboarding.
 *
 * POST /functions/v1/stripe-connect-start
 * Body: { studioId, studioName }
 * Returns: { url }
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
    const user = await requireAuth(req);

    const { studioId, studioName } = await req.json();
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

    // Fetch the studio and any existing Connect account
    const { data: studio, error: studioErr } = await admin
      .from("studios")
      .select("id, name, stripe_account_id")
      .eq("id", studioId)
      .single();

    if (studioErr || !studio) {
      return new Response(
        JSON.stringify({ error: "Studio not found" }),
        { status: 404, headers: corsHeaders() },
      );
    }

    let accountId: string | null = studio.stripe_account_id ?? null;

    // Create a Connect account if none exists yet
    if (!accountId) {
      const acctRes = await fetch("https://api.stripe.com/v1/accounts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          type: "express",
          email: user.email ?? "",
          "business_profile[name]": studioName ?? studio.name ?? "StudioFlow Studio",
          "capabilities[card_payments][requested]": "true",
          "capabilities[transfers][requested]": "true",
          "metadata[studio_id]": studioId,
        }).toString(),
      });

      if (!acctRes.ok) {
        const err = await acctRes.json();
        console.error("Stripe Connect account creation failed:", err);
        return new Response(
          JSON.stringify({
            error: `Stripe error: ${err.error?.message ?? "Failed to create account"}`,
          }),
          { status: 502, headers: corsHeaders() },
        );
      }

      const account = await acctRes.json();
      accountId = account.id as string;

      await admin
        .from("studios")
        .update({ stripe_account_id: accountId })
        .eq("id", studioId);
    }

    // Generate an onboarding link
    const origin = req.headers.get("origin") ?? "";
    const linkRes = await fetch("https://api.stripe.com/v1/account_links", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        account: accountId!,
        refresh_url: `${origin}/settings?stripe_connect=refresh`,
        return_url: `${origin}/settings?stripe_connect=return`,
        type: "account_onboarding",
      }).toString(),
    });

    if (!linkRes.ok) {
      const err = await linkRes.json();
      console.error("Stripe account link creation failed:", err);
      return new Response(
        JSON.stringify({
          error: `Stripe error: ${err.error?.message ?? "Failed to create onboarding link"}`,
        }),
        { status: 502, headers: corsHeaders() },
      );
    }

    const link = await linkRes.json();

    return new Response(
      JSON.stringify({ url: link.url as string }),
      { headers: corsHeaders() },
    );
  } catch (err) {
    console.error("stripe-connect-start error:", err);
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
