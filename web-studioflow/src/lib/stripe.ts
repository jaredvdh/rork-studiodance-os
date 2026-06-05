/**
 * Stripe integration layer for StudioFlow.
 *
 * Manages Stripe Connect (studio onboarding), invoice lifecycle,
 * payment intents, and parent payment methods.
 *
 * In development/staging without a real Stripe key, operations
 * use simulated responses so the full flow can be tested.
 */

import { supabase, getAccessToken } from "./supabase";

const EDGE_FUNCTION = `${(import.meta.env.EXPO_PUBLIC_SUPABASE_URL as string) || "https://placeholder.supabase.co"}/functions/v1`;

/** Placeholder key — replace with real publishable key for production. */
const STRIPE_PK = "pk_test_placeholder";

/** Whether we're in simulated payment mode (no real Stripe key). */
export const IS_STRIPE_SIMULATED = true;

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

/* ── Invoice Lifecycle ────────────────────────────────────────────── */

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "paid"
  | "overdue"
  | "failed"
  | "refunded";

export interface StudioFlowInvoice {
  id: string;
  studioId: string;
  studentName: string;
  parentName: string;
  parentEmail?: string;
  description: string;
  amountCents: number;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
  receiptUrl?: string;
}

/** Create a draft invoice. */
export async function createInvoice(
  invoice: Omit<StudioFlowInvoice, "id" | "status" | "stripeInvoiceId" | "stripePaymentIntentId" | "receiptUrl" | "paidAt">,
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
      parent_name: record.parentName,
      description: record.description,
      amount_cents: record.amountCents,
      status: record.status,
      due_date: record.dueDate,
    });
    if (error) throw new Error(error.message);
    return record;
  }
  const token = getAccessToken();
  const res = await fetch(`${EDGE_FUNCTION}/stripe-invoice-create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(invoice),
  });
  if (!res.ok) throw new Error("Failed to create invoice");
  return res.json();
}

/** Send a draft invoice to the parent. */
export async function sendInvoice(invoiceId: string): Promise<StudioFlowInvoice> {
  if (IS_STRIPE_SIMULATED) {
    const { error } = await supabase
      .from("invoices")
      .update({ status: "sent" })
      .eq("id", invoiceId);
    if (error) throw new Error(error.message);
    return { id: invoiceId, status: "sent" } as StudioFlowInvoice;
  }
  const token = getAccessToken();
  const res = await fetch(`${EDGE_FUNCTION}/stripe-invoice-send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ invoiceId }),
  });
  if (!res.ok) throw new Error("Failed to send invoice");
  return res.json();
}

/** Pay an invoice. */
export async function payInvoice(invoiceId: string): Promise<StudioFlowInvoice> {
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
  const res = await fetch(`${EDGE_FUNCTION}/stripe-invoice-pay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ invoiceId }),
  });
  if (!res.ok) throw new Error("Failed to pay invoice");
  return res.json();
}

/** Mark an invoice as overdue (called by scheduled job). */
export async function markOverdue(invoiceId: string): Promise<void> {
  await supabase.from("invoices").update({ status: "overdue" }).eq("id", invoiceId);
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

/** Fetch saved payment methods for a parent. */
export async function getPaymentMethods(
  parentId: string,
): Promise<PaymentMethod[]> {
  if (IS_STRIPE_SIMULATED) {
    const { data } = await supabase
      .from("studio_settings")
      .select("settings")
      .eq("id", `pm_${parentId}`)
      .maybeSingle();
    const stored = (data?.settings as { paymentMethods?: PaymentMethod[] } | null)?.paymentMethods;
    return stored ?? [];
  }
  const token = getAccessToken();
  const res = await fetch(`${EDGE_FUNCTION}/stripe-payment-methods?parentId=${parentId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to fetch payment methods");
  return res.json();
}

/** Create a SetupIntent for adding a new payment method. */
export async function createSetupIntent(
  parentId: string,
): Promise<{ clientSecret: string }> {
  if (IS_STRIPE_SIMULATED) {
    return { clientSecret: `seti_sim_${Date.now()}_secret_${Math.random().toString(36).slice(2)}` };
  }
  const token = getAccessToken();
  const res = await fetch(`${EDGE_FUNCTION}/stripe-setup-intent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ parentId }),
  });
  if (!res.ok) throw new Error("Failed to create setup intent");
  return res.json();
}

/** Save a payment method after setup intent completes. */
export async function savePaymentMethod(
  parentId: string,
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
      .eq("id", `pm_${parentId}`)
      .maybeSingle();
    const current = ((existing?.settings as { paymentMethods?: PaymentMethod[] } | null)?.paymentMethods ?? []) as PaymentMethod[];
    await supabase.from("studio_settings").upsert({
      id: `pm_${parentId}`,
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
    body: JSON.stringify({ parentId, setupIntentId }),
  });
  if (!res.ok) throw new Error("Failed to save payment method");
  return res.json();
}

/** Remove a saved payment method. */
export async function removePaymentMethod(
  parentId: string,
  paymentMethodId: string,
): Promise<void> {
  if (IS_STRIPE_SIMULATED) {
    const { data: existing } = await supabase
      .from("studio_settings")
      .select("settings")
      .eq("id", `pm_${parentId}`)
      .maybeSingle();
    const current = ((existing?.settings as { paymentMethods?: PaymentMethod[] } | null)?.paymentMethods ?? []) as PaymentMethod[];
    await supabase.from("studio_settings").upsert({
      id: `pm_${parentId}`,
      studio_id: "",
      settings: { paymentMethods: current.filter((pm: PaymentMethod) => pm.id !== paymentMethodId) },
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
    body: JSON.stringify({ parentId, paymentMethodId }),
  });
}
