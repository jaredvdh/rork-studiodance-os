/**
 * Edge Function: stripe-webhook
 *
 * Handles Stripe webhook events for payment status updates.
 * Verifies the webhook signature using STRIPE_WEBHOOK_SECRET.
 * Updates Supabase invoice records with payment outcomes.
 *
 * POST /functions/v1/stripe-webhook
 * Headers: stripe-signature (from Stripe)
 * Body: raw JSON from Stripe webhook
 *
 * Events handled:
 *   - checkout.session.completed  → invoice marked paid
 *   - checkout.session.expired     → invoice reverted to sent
 *   - payment_intent.payment_failed → invoice marked failed
 *   - payment_intent.succeeded     → invoice marked paid (if not already)
 *
 * This function uses the service_role key to bypass RLS — webhook
 * events must never be processable by client-side auth.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createAdminClient } from "../_shared/auth.ts";
import { handlePreflight, jsonCorsHeaders } from "../_shared/cors.ts";

const STRIPE_SECRET = Deno.env.get("SUPABASE_STRIPE_SECRET_KEY") ?? "";
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

serve(async (req: Request) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  const corsHeaders = (): Record<string, string> => jsonCorsHeaders(req);

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders(),
    });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    if (!signature || !WEBHOOK_SECRET) {
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        { status: 400, headers: corsHeaders() },
      );
    }

    // Verify webhook signature
    let event;
    try {
      // Use Stripe's library or manual HMAC verification
      event = await verifyStripeSignature(body, signature, WEBHOOK_SECRET);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid webhook signature" }),
        { status: 400, headers: corsHeaders() },
      );
    }

    const admin = createAdminClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const invoiceId = session.client_reference_id || session.metadata?.invoice_id;
        const paymentIntentId = session.payment_intent;

        if (!invoiceId) {
          console.warn("checkout.session.completed without invoice reference");
          break;
        }

        // Mark invoice as paid
        const { error } = await admin
          .from("invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: paymentIntentId,
          })
          .eq("id", invoiceId);

        if (error) {
          console.error("Failed to update invoice to paid:", error);
        } else {
          console.log(`Invoice ${invoiceId} marked paid via webhook`);
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const invoiceId = session.client_reference_id || session.metadata?.invoice_id;

        if (!invoiceId) break;

        await admin
          .from("invoices")
          .update({ status: "sent" })
          .eq("id", invoiceId);

        console.log(`Invoice ${invoiceId} reverted to sent (session expired)`);
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const invoiceId = pi.metadata?.invoice_id;

        if (!invoiceId) break;

        // Only update if not already paid (prevents duplicate events)
        const { data: existing } = await admin
          .from("invoices")
          .select("status")
          .eq("id", invoiceId)
          .maybeSingle();

        if (existing?.status !== "paid") {
          await admin
            .from("invoices")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id: pi.id,
            })
            .eq("id", invoiceId);

          console.log(`Invoice ${invoiceId} marked paid via payment_intent.succeeded`);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        const invoiceId = pi.metadata?.invoice_id;

        if (!invoiceId) break;

        await admin
          .from("invoices")
          .update({ status: "failed" })
          .eq("id", invoiceId);

        console.log(
          `Invoice ${invoiceId} marked failed: ${pi.last_payment_error?.message ?? "unknown"}`,
        );
        break;
      }

      default:
        // Unhandled event type — log for observability
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: corsHeaders(),
    });
  } catch (err) {
    console.error("stripe-webhook error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders() },
    );
  }
});

/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Verify the Stripe webhook signature using HMAC-SHA256.
 * This avoids depending on the Stripe Node.js SDK in Deno.
 */
async function verifyStripeSignature(
  body: string,
  signature: string,
  secret: string,
): Promise<{ type: string; data: { object: Record<string, unknown> } }> {
  // Parse the signature header: "t=TIMESTAMP,v1=SIGNATURE"
  const parts = signature.split(",").reduce(
    (acc, part) => {
      const [k, v] = part.split("=");
      if (k && v) acc[k] = v;
      return acc;
    },
    {} as Record<string, string>,
  );

  const timestamp = parts["t"];
  const sigV1 = parts["v1"];

  if (!timestamp || !sigV1) {
    throw new Error("Invalid signature header format");
  }

  // Verify timestamp is within tolerance (5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > 300) {
    throw new Error("Webhook timestamp outside tolerance");
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload),
  );
  const expectedSig = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expectedSig !== sigV1) {
    throw new Error("Signature mismatch");
  }

  return JSON.parse(body);
}
