/**
 * Edge Function: stripe-create-checkout
 *
 * Creates a Stripe Checkout Session for a StudioFlow invoice.
 * Updates the invoice with stripe_invoice_id and stripe_payment_intent_id.
 * Returns the checkout URL for the caregiver to complete payment.
 *
 * POST /functions/v1/stripe-create-checkout
 * Body: { invoiceId }
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

    const { invoiceId } = await req.json();
    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: "invoiceId is required" }),
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

    // Fetch the invoice
    const { data: invoice, error: invErr } = await admin
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (invErr || !invoice) {
      return new Response(
        JSON.stringify({ error: "Invoice not found" }),
        { status: 404, headers: corsHeaders() },
      );
    }

    if (invoice.status === "paid" || invoice.status === "processing") {
      return new Response(
        JSON.stringify({ error: `Invoice is already ${invoice.status}` }),
        { status: 409, headers: corsHeaders() },
      );
    }

    // Update status to processing to prevent duplicate payments
    await admin
      .from("invoices")
      .update({ status: "processing" })
      .eq("id", invoiceId);

    // Get the caregiver's Stripe customer ID
    let stripeCustomerId = invoice.stripe_customer_id;
    if (!stripeCustomerId && invoice.parent_email) {
      const { data: cg } = await admin
        .from("caregivers")
        .select("stripe_customer_id")
        .eq("email", invoice.parent_email)
        .maybeSingle();
      stripeCustomerId = cg?.stripe_customer_id;
    }

    // Build line item
    const lineItem = new URLSearchParams({
      "line_items[0][price_data][currency]": (invoice.currency as string) || "usd",
      "line_items[0][price_data][product_data][name]":
        (invoice.description as string) || "StudioFlow Invoice",
      "line_items[0][price_data][unit_amount]": String(
        invoice.amount_cents ?? 0,
      ),
      "line_items[0][quantity]": "1",
      "mode": "payment",
      "success_url": `${req.headers.get("origin") ?? ""}/parent/payments?session_id={CHECKOUT_SESSION_ID}&status=success`,
      "cancel_url": `${req.headers.get("origin") ?? ""}/parent/payments?status=cancelled`,
      "client_reference_id": invoiceId,
      "metadata[invoice_id]": invoiceId,
      "metadata[studio_id]": invoice.studio_id,
    });

    // Attach customer if available (creates a payment page tied to the customer)
    if (stripeCustomerId) {
      lineItem.set("customer", stripeCustomerId);
    } else if (invoice.parent_email) {
      lineItem.set("customer_email", invoice.parent_email);
    }

    // Also set customer_creation if no customer exists — Stripe will create one
    if (!stripeCustomerId && invoice.parent_email) {
      lineItem.set("customer_creation", "always");
    }

    const stripeRes = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: lineItem.toString(),
      },
    );

    if (!stripeRes.ok) {
      const err = await stripeRes.json();
      console.error("Stripe checkout creation failed:", err);

      // Revert to sent status on failure
      await admin
        .from("invoices")
        .update({ status: "sent" })
        .eq("id", invoiceId);

      return new Response(
        JSON.stringify({
          error: `Stripe error: ${err.error?.message ?? "Failed to create checkout"}`,
        }),
        { status: 502, headers: corsHeaders() },
      );
    }

    const session = await stripeRes.json();

    // Update invoice with Stripe IDs and status
    await admin
      .from("invoices")
      .update({
        status: "processing",
        stripe_payment_intent_id: session.payment_intent as string,
        stripe_customer_id:
          stripeCustomerId || (session.customer as string) || null,
      })
      .eq("id", invoiceId);

    return new Response(
      JSON.stringify({
        invoice: {
          id: invoiceId,
          status: "processing",
        },
        checkoutUrl: session.url as string,
      }),
      { headers: corsHeaders() },
    );
  } catch (err) {
    console.error("stripe-create-checkout error:", err);
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
