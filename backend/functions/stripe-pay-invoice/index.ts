/**
 * Edge Function: stripe-pay-invoice
 *
 * Marks an invoice as paid and stamps paid_at. Used to record a payment that
 * was completed (e.g. in simulated/test mode or reconciled out-of-band).
 * Returns the updated invoice row.
 *
 * POST /functions/v1/stripe-pay-invoice
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

    const { data: invoice, error: updateErr } = await admin
      .from("invoices")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", invoiceId)
      .select("*")
      .single();

    if (updateErr || !invoice) {
      console.error("Invoice update failed:", updateErr);
      return new Response(
        JSON.stringify({ error: "Invoice not found" }),
        { status: 404, headers: corsHeaders() },
      );
    }

    return new Response(JSON.stringify({ invoice }), { headers: corsHeaders() });
  } catch (err) {
    console.error("stripe-pay-invoice error:", err);
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
