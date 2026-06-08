/**
 * Edge Function: stripe-create-invoice
 *
 * Creates a draft invoice record in the invoices table for a studio.
 * No money moves here — this is the first step (draft) before a caregiver
 * pays via stripe-create-checkout. Returns the created invoice row.
 *
 * POST /functions/v1/stripe-create-invoice
 * Body: {
 *   studioId, studentName, caregiverName, caregiverId, caregiverEmail,
 *   description, amountCents, currency, dueDate
 * }
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

    const {
      studioId,
      studentName,
      caregiverName,
      caregiverId,
      caregiverEmail,
      description,
      amountCents,
      currency,
      dueDate,
    } = await req.json();

    if (!studioId || !studentName || typeof amountCents !== "number") {
      return new Response(
        JSON.stringify({
          error: "studioId, studentName and amountCents are required",
        }),
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

    const { data: invoice, error: insertErr } = await admin
      .from("invoices")
      .insert({
        studio_id: studioId,
        student_name: studentName,
        parent_name: caregiverName ?? null,
        parent_email: caregiverEmail ?? null,
        description: description ?? null,
        amount_cents: amountCents,
        currency: currency ?? "usd",
        status: "draft",
        due_date: dueDate ?? null,
        caregiver_id: caregiverId ?? null,
      })
      .select("*")
      .single();

    if (insertErr || !invoice) {
      console.error("Invoice creation failed:", insertErr);
      return new Response(
        JSON.stringify({
          error: `Failed to create invoice: ${insertErr?.message ?? "unknown"}`,
        }),
        { status: 500, headers: corsHeaders() },
      );
    }

    return new Response(JSON.stringify({ invoice }), { headers: corsHeaders() });
  } catch (err) {
    console.error("stripe-create-invoice error:", err);
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
