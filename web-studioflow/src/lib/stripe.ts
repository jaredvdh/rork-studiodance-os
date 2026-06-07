/**
 * Stripe integration layer for StudioFlow.
 *
 * Manages Stripe Connect (studio onboarding), customer creation,
 * checkout sessions, invoice lifecycle, payment intents, and
 * parent payment methods.
 *
 * MODE CONTROL
 * ------------
 * IS_STRIPE_SIMULATED is derived at runtime from the environment.
 *
 *   • Simulated  — No publishable key configured, or the key is a
 *     placeholder. All operations use simulated responses so the
 *     full flow can be tested without a real Stripe account.
 *
 *   • Live       — A valid EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY is set.
 *     All operations call the Supabase Edge Functions which interface
 *     with the real Stripe API via the secret key (server-side only).
 *
 * NO Stripe secret keys are ever exposed to the client.
 */

import { supabase, getAccessToken } from "./supabase";
import { getFunctionUrl } from "./supabaseFunctions";

/** Base Edge Functions URL, normalised against misconfigured env values. */
const EDGE_FUNCTION =
  (getFunctionUrl("")?.replace(/\/$/, "")) ?? "https://placeholder.supabase.co/functions/v1";

/** Publishable key — safe for client. If unset or placeholder, simulated mode is active. */
function getStripePk(): string {
  try {
    const env = (import.meta as Record<string, Record<string, string>>).env;
    return env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  } catch {
    return "";
  }
}

/** Whether we're in simulated payment mode (no real Stripe key configured). */
function computeSimulated(): boolean {
  const pk = getStripePk();
  if (!pk || pk === "") return true;
  if (pk.startsWith("pk_test_placeholder")) return true;
  if (pk.startsWith("pk_placeholder")) return true;
  return false;
}

export const IS_STRIPE_SIMULATED: boolean = computeSimulated();

/* ── Studio Connect ───────────────────────────────────────────────── */

export type ConnectStatus =
  | "not_connected"
  | "pending"
  | "connected"
  | "restricted";

export interface StripeConnectState {
  status: ConnectStatus;
  accountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  onboardingUrl?: string;
}

/** Fetch the studio's Stripe Connect state. */
export async function getStripeConnectState(
  studioId: string,
): Promise<StripeConnectState> {
  if (IS_STRIPE_SIMULATED) {
    return { status: "not_connected" };
  }
  const token = getAccessToken();
  const res = await fetch(`${EDGE_FUNCTION}/stripe-connect-status`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    method: "POST",
    body: JSON.stringify({ studioId }),
  });
  if (!res.ok) throw new Error("Failed to fetch Stripe status");
  return res.json();
}

/** Start or resume Stripe Connect onboarding. Returns an onboarding URL. */
export async function startStripeConnect(
  studioId: string,
  studioName: string,
): Promise<{ url: string }> {
  if (IS_STRIPE_SIMULATED) {
    return { url: "#" };
  }
  const token = getAccessToken();
  const res = await fetch(`${EDGE_FUNCTION}/stripe-connect-start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ studioId, studioName }),
  });
  if (!res.ok) throw new Error("Failed to start Stripe Connect");
  return res.json();
}

/* ── Customer Management ──────────────────────────────────────────── */

export interface StripeCustomer {
  id: string;
  stripeCustomerId: string;
  email: string;
  name?: string;
}

/** Create or retrieve a Stripe customer for a caregiver. */
export async function getOrCreateCustomer(
  caregiverId: string,
  email: string,
  name?: string,
): Promise<StripeCustomer> {
  if (IS_STRIPE_SIMULATED) {
    return {
      id: caregiverId,
      stripeCustomerId: `cus_sim_${caregiverId.slice(0, 8)}`,
      email,
      name,
    };
  }
  const token = getAccessToken();
  const res = await fetch(`${EDGE_FUNCTION}/stripe-create-customer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ caregiverId, email, name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create Stripe customer");
  }
  return res.json();
}

/* ── Invoice Lifecycle ────────────────────────────────────────────── */

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "paid"
  | "overdue"
  | "failed"
  | "refunded"
  | "processing";

export interface StudioFlowInvoice {
  id: string;
  studioId: string;
  studentName: string;
  caregiverName: string;
  caregiverId?: string;
  caregiverEmail?: string;
  description: string;
  amountCents: number;
  currency?: string;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  stripeCustomerId?: string;
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
  receiptUrl?: string;
}

/** Create a draft invoice. */
export async function createInvoice(
  invoice: Omit<
    StudioFlowInvoice,
    "id" | "status" | "stripeCustomerId" | "stripeInvoiceId" | "stripePaymentIntentId" | "receiptUrl" | "paidAt"
  >,
): Promise<StudioFlowInvoice> {
  if (IS_STRIPE_SIMULATED) {
    const id = `inv_${Date.now()}`;
    const record: StudioFlowInvoice = {
      id,
      ...invoice,
      status: "draft",
    };
    const { error } = await supabase.from("invoices").insert({
      id: record.id,
      studio_id: record.studioId,
      student_name: record.studentName,
      parent_name: record.caregiverName,
      parent_email: record.caregiverEmail,
      caregiver_id: record.caregiverId,
      description: record.description,
      amount_cents: record.amountCents,
      currency: record.currency ?? "usd",
      status: record.status,
      due_date: record.dueDate,
    });
    if (error) throw new Error(error.message);
    return record;
  }
  const token = getAccessToken();
  const res = await fetch(`${EDGE_FUNCTION}/stripe-create-invoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(invoice),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create invoice");
  }
  return res.json();
}

/** Send a draft invoice to the caregiver — creates a Stripe checkout session. */
export async function sendInvoice(
  invoiceId: string,
): Promise<{ invoice: StudioFlowInvoice; checkoutUrl?: string }> {
  if (IS_STRIPE_SIMULATED) {
    const { error } = await supabase
      .from("invoices")
      .update({ status: "sent" })
      .eq("id", invoiceId);
    if (error) throw new Error(error.message);
    return { invoice: { id: invoiceId, status: "sent" } as StudioFlowInvoice };
  }
  const token = getAccessToken();
  const res = await fetch(`${EDGE_FUNCTION}/stripe-create-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ invoiceId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create checkout session");
  }
  return res.json();
}

/** Pay an invoice (manual / admin override). */
export async function payInvoice(
  invoiceId: string,
): Promise<StudioFlowInvoice> {
  if (IS_STRIPE_SIMULATED) {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("invoices")
      .update({ status: "paid", paid_at: now })
      .eq("id", invoiceId);
    if (error) throw new Error(error.message);
    return { id: invoiceId, status: "paid", paidAt: now } as StudioFlowInvoice;
  }
  const token = getAccessToken();
  const res = await fetch(`${EDGE_FUNCTION}/stripe-pay-invoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ invoiceId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to pay invoice");
  }
  return res.json();
}

/** Mark an invoice as overdue (called by scheduled job / admin). */
export async function markOverdue(invoiceId: string): Promise<void> {
  await supabase
    .from("invoices")
    .update({ status: "overdue" })
    .eq("id", invoiceId);
}

/* ── Payment Methods ──────────────────────────────────────────────── */

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

/** Fetch saved payment methods for a caregiver. */
export async function getPaymentMethods(
  caregiverId: string,
): Promise<PaymentMethod[]> {
  if (IS_STRIPE_SIMULATED) {
    const { data } = await supabase
      .from("studio_settings")
      .select("settings")
      .eq("id", `pm_${caregiverId}`)
      .maybeSingle();
    const stored = (
      data?.settings as { paymentMethods?: PaymentMethod[] } | null
    )?.paymentMethods;
    return stored ?? [];
  }
  const token = getAccessToken();
  const queryParams = new URLSearchParams({ caregiverId }).toString();
  const res = await fetch(
    `${EDGE_FUNCTION}/stripe-payment-methods?${queryParams}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );
  if (!res.ok) return [];
  return res.json();
}

/** Create a SetupIntent for adding a new payment method. */
export async function createSetupIntent(
  caregiverId: string,
): Promise<{ clientSecret: string }> {
  if (IS_STRIPE_SIMULATED) {
    return {
      clientSecret: `seti_sim_${Date.now()}_secret_${Math.random().toString(36).slice(2)}`,
    };
  }
  const token = getAccessToken();
  const res = await fetch(`${EDGE_FUNCTION}/stripe-setup-intent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ caregiverId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create setup intent");
  }
  return res.json();
}

/** Save a payment method after setup intent completes. */
export async function savePaymentMethod(
  caregiverId: string,
  setupIntentId: string,
): Promise<PaymentMethod> {
  if (IS_STRIPE_SIMULATED) {
    const card: PaymentMethod = {
      id: `pm_${Date.now()}`,
      brand: "visa",
      last4: "4242",
      expMonth: 12,
      expYear: 2027,
      isDefault: true,
    };
    const { data: existing } = await supabase
      .from("studio_settings")
      .select("settings")
      .eq("id", `pm_${caregiverId}`)
      .maybeSingle();
    const current = (
      (existing?.settings as { paymentMethods?: PaymentMethod[] } | null)
        ?.paymentMethods ?? []
    ) as PaymentMethod[];
    await supabase.from("studio_settings").upsert({
      id: `pm_${caregiverId}`,
      studio_id: "",
      settings: { paymentMethods: [...current, card] },
    });
    return card;
  }
  const token = getAccessToken();
  const res = await fetch(`${EDGE_FUNCTION}/stripe-save-payment-method`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ caregiverId, setupIntentId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to save payment method");
  }
  return res.json();
}

/** Remove a saved payment method. */
export async function removePaymentMethod(
  caregiverId: string,
  paymentMethodId: string,
): Promise<void> {
  if (IS_STRIPE_SIMULATED) {
    const { data: existing } = await supabase
      .from("studio_settings")
      .select("settings")
      .eq("id", `pm_${caregiverId}`)
      .maybeSingle();
    const current = (
      (existing?.settings as { paymentMethods?: PaymentMethod[] } | null)
        ?.paymentMethods ?? []
    ) as PaymentMethod[];
    await supabase.from("studio_settings").upsert({
      id: `pm_${caregiverId}`,
      studio_id: "",
      settings: {
        paymentMethods: current.filter(
          (pm: PaymentMethod) => pm.id !== paymentMethodId,
        ),
      },
    });
    return;
  }
  const token = getAccessToken();
  await fetch(`${EDGE_FUNCTION}/stripe-remove-payment-method`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ caregiverId, paymentMethodId }),
  });
}
