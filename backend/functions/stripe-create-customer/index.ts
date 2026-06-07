/**
 * Edge Function: stripe-create-customer
 *
 * Creates or retrieves a Stripe customer for a caregiver.
 * The Stripe secret key lives in the SUPABASE_STRIPE_SECRET_KEY env var
 * on the Supabase project — never exposed to the client.
 *
 * POST /functions/v1/stripe-create-customer
 * Body: { caregiverId, email, name }
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { requireAuth, createAdminClient } from "../_shared/auth.ts";

const STRIPE_SECRET = Deno.env.get("SUPABASE_STRIPE_SECRET_KEY") ?? "";

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  try {
    await requireAuth(req);

    const { caregiverId, email, name } = await req.json();
    if (!caregiverId || !email) {
      return new Response(
        JSON.stringify({ error: "caregiverId and email are required" }),
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

    // Check if the caregiver already has a stripe_customer_id stored
    const { data: existing } = await admin
      .from("caregivers")
      .select("stripe_customer_id")
      .eq("id", caregiverId)
      .maybeSingle();

    if (existing?.stripe_customer_id) {
      return new Response(
        JSON.stringify({
          id: caregiverId,
          stripeCustomerId: existing.stripe_customer_id,
          email,
          name,
        }),
        { headers: corsHeaders() },
      );
    }

    // Create customer in Stripe
    const stripeRes = await fetch("https://api.stripe.com/v1/customers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        email,
        name: name ?? email,
        "metadata[caregiver_id]": caregiverId,
      }).toString(),
    });

    if (!stripeRes.ok) {
      const err = await stripeRes.json();
      console.error("Stripe customer creation failed:", err);
      return new Response(
        JSON.stringify({ error: `Stripe error: ${err.error?.message ?? "Unknown"}` }),
        { status: 502, headers: corsHeaders() },
      );
    }

    const customer = await stripeRes.json();

    // Save stripe_customer_id to caregivers table
    await admin
      .from("caregivers")
      .update({ stripe_customer_id: customer.id })
      .eq("id", caregiverId);

    return new Response(
      JSON.stringify({
        id: caregiverId,
        stripeCustomerId: customer.id,
        email,
        name,
      }),
      { headers: corsHeaders() },
    );
  } catch (err) {
    console.error("stripe-create-customer error:", err);
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

function corsHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };
}
