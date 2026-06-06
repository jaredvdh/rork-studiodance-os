import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Plus,
  Shield,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { useStudioData } from "@/data/store";
import { useParent } from "@/data/parentStore";
import {
  getPaymentMethods,
  removePaymentMethod,
  savePaymentMethod,
  createSetupIntent,
  IS_STRIPE_SIMULATED,
  type PaymentMethod,
} from "@/lib/stripe";
import {
  payInvoice,
  type StudioFlowInvoice,
  type InvoiceStatus,
} from "@/lib/stripe";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────────────────── */

type InvoiceFilter = InvoiceStatus | "all";

/* ── Billing permission gate ───────────────────────────────────────── */

function NoBillingAccess() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose/10 text-rose">
        <Lock className="h-7 w-7" />
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold">Billing access restricted</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Your caregiver permissions don't include billing access. Contact the primary caregiver to update your permissions.
      </p>
    </div>
  );
}

/* ── Add card component ────────────────────────────────────────────── */

function AddCardForm({ caregiverId, onClose }: { caregiverId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!cardNumber || !expiry || !cvc) {
      toast.error("Please fill in all card details");
      return;
    }
    setSaving(true);
    try {
      if (IS_STRIPE_SIMULATED) {
        // Simulate card save
        const card: PaymentMethod = {
          id: `pm_${Date.now()}`,
          brand: cardNumber.startsWith("4") ? "visa" : cardNumber.startsWith("5") ? "mastercard" : "visa",
          last4: cardNumber.slice(-4),
          expMonth: Number(expiry.split("/")[0]),
          expYear: 2000 + Number(expiry.split("/")[1]),
          isDefault: true,
        };
        await savePaymentMethod(caregiverId, `seti_sim_${Date.now()}`);
        toast.success(`${card.brand === "visa" ? "Visa" : "Mastercard"} ending in ${card.last4} added`);
      } else {
        const { clientSecret } = await createSetupIntent(caregiverId);
        // In production, Stripe Elements would handle this
        toast.info("Payment method flow requires Stripe Elements — simulated");
      }
      qc.invalidateQueries({ queryKey: ["payment-methods", caregiverId] });
      onClose();
    } catch {
      toast.error("Failed to add payment method");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-white p-6 shadow-lift">
      <h3 className="font-display text-lg font-semibold mb-4">Add payment method</h3>
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Card number</span>
          <input
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
            placeholder="4242 4242 4242 4242"
            className="w-full rounded-xl border border-amber-200 bg-white px-3.5 py-2.5 text-sm font-mono"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expiry (MM/YY)</span>
            <input
              value={expiry}
              onChange={(e) => {
                let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                setExpiry(v);
              }}
              placeholder="MM/YY"
              className="w-full rounded-xl border border-amber-200 bg-white px-3.5 py-2.5 text-sm font-mono"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">CVC</span>
            <input
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="123"
              className="w-full rounded-xl border border-amber-200 bg-white px-3.5 py-2.5 text-sm font-mono"
            />
          </label>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-amber-200 bg-white py-2.5 text-sm font-medium text-muted-foreground hover:bg-amber-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !cardNumber || cardNumber.length < 15 || !expiry || expiry.length < 4 || !cvc || cvc.length < 3}
            className={cn(
              "flex-1 rounded-full py-2.5 text-sm font-semibold transition inline-flex items-center justify-center gap-2",
              cardNumber && cardNumber.length >= 15 && expiry && cvc
                ? "bg-amber-400 text-amber-900 hover:opacity-90"
                : "bg-amber-100 text-amber-400 cursor-not-allowed",
            )}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? "Saving…" : "Add card"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Lock className="h-3 w-3" />
          Card details are encrypted and stored securely with Stripe. StudioFlow never sees your full card number.
        </p>
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────────── */

export default function ParentPayments() {
  const { invoices: allInvoices } = useStudioData();
  const { account: parent, children: myStudents, primaryCaregiver, additionalCaregivers } = useParent();
  const [filter, setFilter] = useState<InvoiceFilter>("all");
  const [showAddCard, setShowAddCard] = useState(false);
  const qc = useQueryClient();

  // Check billing permission
  const caregiver = [primaryCaregiver, ...additionalCaregivers].find(
    (c) => c.email === parent?.primaryContact?.email,
  );
  const canViewBilling = caregiver?.can_view_billing ?? true;
  const canPayInvoices = caregiver?.can_pay_invoices ?? true;

  if (!canViewBilling) return <NoBillingAccess />;

  // Payment methods
  const { data: paymentMethods, isLoading: pmLoading } = useQuery({
    queryKey: ["payment-methods", parent?.id],
    queryFn: () => getPaymentMethods(parent?.id ?? ""),
    enabled: !!parent?.id,
  });

  const removeMut = useMutation({
    mutationFn: (pmId: string) => removePaymentMethod(parent?.id ?? "", pmId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-methods", parent?.id] });
      toast.success("Payment method removed");
    },
    onError: () => toast.error("Failed to remove payment method"),
  });

  // Filter invoices for this family
  const myInvoices = allInvoices.filter((i) =>
    myStudents.some((s) => s.name === i.studentName) ||
    myStudents.some((s) => `${s.caregiverName}` === i.caregiverName),
  );

  const filtered = filter === "all" ? myInvoices : myInvoices.filter((i) => i.status === filter);

  const totalOutstanding = myInvoices
    .filter((i) => i.status !== "paid")
    .reduce((a, i) => a + i.amountCents, 0);

  const payMut = useMutation({
    mutationFn: (invId: string) => payInvoice(invId),
    onSuccess: () => {
      toast.success("Payment successful");
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: () => toast.error("Payment failed"),
  });

  const statusBadge: Record<string, { label: string; className: string }> = {
    paid: { label: "Paid", className: "bg-success/10 text-success" },
    draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
    sent: { label: "Due", className: "bg-amber-100 text-amber-700" },
    due: { label: "Due", className: "bg-amber-100 text-amber-700" },
    overdue: { label: "Overdue", className: "bg-rose/10 text-rose" },
    failed: { label: "Failed", className: "bg-rose/10 text-rose" },
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="animate-float-up">
          <p className="text-sm text-muted-foreground">Billing & payments</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Payments</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage invoices and payment methods</p>
        </div>
        {canPayInvoices && (
          <button
            onClick={() => setShowAddCard(!showAddCard)}
            className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-amber-900 shadow-soft transition hover:opacity-90"
          >
            <CreditCard className="h-4 w-4" />
            Add payment method
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-200/70 bg-white p-5 shadow-soft animate-float-up">
          <CreditCard className="h-5 w-5 text-muted-foreground mb-3" />
          <p className="font-display text-2xl font-semibold">{myInvoices.length}</p>
          <p className="text-sm text-muted-foreground">Total invoices</p>
        </div>
        <div className="rounded-2xl border border-success/20 bg-success/5 p-5 shadow-soft animate-float-up [animation-delay:60ms]">
          <CheckCircle2 className="h-5 w-5 text-success mb-3" />
          <p className="font-display text-2xl font-semibold text-success">
            {formatCurrency(myInvoices.filter((i) => i.status === "paid").reduce((a, i) => a + i.amountCents, 0))}
          </p>
          <p className="text-sm text-muted-foreground">Paid to date</p>
        </div>
        <div className={cn(
          "rounded-2xl border p-5 shadow-soft animate-float-up [animation-delay:120ms]",
          totalOutstanding > 0 ? "border-rose/20 bg-rose/5" : "border-amber-200/70 bg-white",
        )}>
          <AlertTriangle className={cn("h-5 w-5 mb-3", totalOutstanding > 0 ? "text-rose" : "text-muted-foreground")} />
          <p className="font-display text-2xl font-semibold">{formatCurrency(totalOutstanding)}</p>
          <p className="text-sm text-muted-foreground">Outstanding</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { key: "all" as const, label: "All" },
          { key: "paid" as const, label: "Paid" },
          { key: "sent" as const, label: "Due" },
          { key: "overdue" as const, label: "Overdue" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all shrink-0",
              filter === key
                ? "bg-amber-400 text-amber-900"
                : "border border-amber-200 bg-white text-muted-foreground hover:bg-amber-50",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Invoices */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((inv, i) => {
            const s = statusBadge[inv.status] ?? statusBadge.draft;
            return (
              <div
                key={inv.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-amber-200/70 bg-white p-4 animate-float-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-100 text-amber-700">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{inv.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {inv.studentName} · Due {formatDate(inv.dueDate, { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg font-semibold tabular-nums">
                    {formatCurrency(inv.amountCents)}
                  </span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", s.className)}>
                    {s.label}
                  </span>
                  {(inv.status === "sent" || inv.status === "due" || inv.status === "overdue") && canPayInvoices && (
                    <button
                      onClick={() => payMut.mutate(inv.id)}
                      disabled={payMut.isPending}
                      className="rounded-full bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-amber-900 transition hover:opacity-90"
                    >
                      {payMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Pay now"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-success/40" />
          <h3 className="mt-4 font-display text-xl font-semibold">All caught up!</h3>
          <p className="mt-1 text-sm text-muted-foreground">No invoices match this filter.</p>
        </div>
      )}

      {/* Add card form */}
      {showAddCard && (
        <AddCardForm caregiverId={parent?.id ?? ""} onClose={() => setShowAddCard(false)} />
      )}

      {/* Payment methods */}
      <div className="rounded-2xl border border-amber-200/70 bg-white p-6 shadow-soft">
        <h3 className="font-display text-lg font-semibold mb-4">Payment methods</h3>
        {pmLoading ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (paymentMethods && paymentMethods.length > 0) ? (
          <div className="space-y-3">
            {paymentMethods.map((pm) => (
              <div key={pm.id} className="flex items-center gap-4 rounded-xl bg-amber-50/60 p-4">
                <CreditCard className="h-6 w-6 text-amber-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize">{pm.brand} ending in {pm.last4}</p>
                  <p className="text-xs text-muted-foreground">Expires {String(pm.expMonth).padStart(2, "0")}/{pm.expYear}</p>
                </div>
                {pm.isDefault && (
                  <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                    Default
                  </span>
                )}
                <button
                  onClick={() => removeMut.mutate(pm.id)}
                  disabled={removeMut.isPending}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-rose/10 hover:text-rose transition"
                  title="Remove card"
                >
                  {removeMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-8 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium">No payment methods saved</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Add a card to pay invoices quickly.</p>
            {canPayInvoices && (
              <button
                onClick={() => setShowAddCard(true)}
                className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
              >
                <Plus className="h-4 w-4 inline mr-1.5" />
                Add payment method
              </button>
            )}
          </div>
        )}
      </div>

      {/* Auto-pay info */}
      {canPayInvoices && (
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-5 flex items-start gap-3">
          <Shield className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Auto-pay available</p>
            <p className="text-xs text-amber-700/80 mt-0.5">Enable auto-pay to automatically charge your default card when invoices are due. Contact your studio to enroll.</p>
          </div>
        </div>
      )}
    </div>
  );
}
