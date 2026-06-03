import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Loader2,
  Mail,
  RefreshCcw,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";

import StatCard from "@/components/StatCard";
import { supabase } from "@/lib/supabase";
import { useStudioData, useStudio } from "@/data/store";
import {
  createInvoice,
  sendInvoice,
  payInvoice,
  markOverdue,
  getStripeConnectState,
  type StudioFlowInvoice,
  type InvoiceStatus,
} from "@/lib/stripe";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────────────────── */

interface InvoiceRow {
  id: string;
  studio_id: string;
  student_name: string;
  parent_name: string;
  description: string | null;
  amount_cents: number | null;
  status: string | null;
  due_date: string | null;
  paid_at?: string | null;
}

const statusMeta: Record<string, { chip: string; label: string; icon: typeof CheckCircle2 }> = {
  paid: { chip: "bg-success/10 text-success", label: "Paid", icon: CheckCircle2 },
  draft: { chip: "bg-muted text-muted-foreground", label: "Draft", icon: FileText },
  sent: { chip: "bg-blue-100 text-blue-700", label: "Sent", icon: Mail },
  due: { chip: "bg-amber-100 text-amber-700", label: "Due", icon: Clock },
  overdue: { chip: "bg-destructive/10 text-destructive", label: "Overdue", icon: AlertTriangle },
  failed: { chip: "bg-destructive/10 text-destructive", label: "Failed", icon: X },
  refunded: { chip: "bg-plum/10 text-plum", label: "Refunded", icon: RefreshCcw },
};

/* ── Create invoice modal ──────────────────────────────────────────── */

function CreateInvoiceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { students } = useStudioData();
  const { studio } = useStudio();
  const qc = useQueryClient();
  const [studentId, setStudentId] = useState("");
  const [description, setDescription] = useState("");
  const [amountCents, setAmountCents] = useState("9500");
  const [dueDays, setDueDays] = useState("14");

  const create = useMutation({
    mutationFn: () => {
      const student = students.find((s) => s.id === studentId);
      const due = new Date();
      due.setDate(due.getDate() + Number(dueDays));
      return createInvoice({
        studioId: studio.id,
        studentName: student?.name ?? "",
        parentName: student?.parentName ?? "",
        parentEmail: student?.parentEmail,
        description,
        amountCents: Math.round(Number(amountCents)),
        dueDate: due.toISOString(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices", studio.id] });
      toast.success("Draft invoice created");
      onClose();
      setDescription("");
      setAmountCents("9500");
      setStudentId("");
    },
    onError: () => toast.error("Failed to create invoice"),
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-lift">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl font-semibold">Create invoice</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Student</span>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
            >
              <option value="">Select student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {s.parentName}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. June tuition"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount ($)</span>
              <input
                type="number"
                value={(Number(amountCents) / 100).toFixed(2)}
                onChange={(e) => setAmountCents(String(Math.round(Number(e.target.value) * 100)))}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Due in (days)</span>
              <input
                type="number"
                value={dueDays}
                onChange={(e) => setDueDays(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
              />
            </label>
          </div>
          <button
            onClick={() => create.mutate()}
            disabled={!studentId || !description || create.isPending}
            className="w-full rounded-full bg-rose px-5 py-2.5 text-sm font-semibold text-rose-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            {create.isPending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Create draft invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────────── */

export default function Payments() {
  const { studio } = useStudio();
  const { invoices: demoInvoices, revenueSeries } = useStudioData();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: connectState } = useQuery({
    queryKey: ["stripe-connect", studio.id],
    queryFn: () => getStripeConnectState(studio.id),
  });

  const { data: dbInvoices, isLoading } = useQuery<InvoiceRow[]>({
    queryKey: ["invoices", studio.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("studio_id", studio.id)
        .order("created_at", { ascending: false });
      if (error) return [];
      return data as InvoiceRow[];
    },
  });

  // Merge: DB invoices take precedence, fallback to demo data
  const allInvoices = dbInvoices && dbInvoices.length > 0
    ? dbInvoices.map((i) => ({
        id: i.id,
        studioId: i.studio_id,
        studentName: i.student_name,
        parentName: i.parent_name,
        description: i.description ?? "",
        amountCents: i.amount_cents ?? 0,
        status: (i.status as InvoiceStatus) ?? "draft",
        dueDate: i.due_date ?? "",
        paidAt: i.paid_at,
      }))
    : demoInvoices.map((d) => ({
        id: d.id,
        studioId: d.studioId,
        studentName: d.studentName,
        parentName: d.parentName,
        description: d.description,
        amountCents: d.amountCents,
        status: d.status as InvoiceStatus,
        dueDate: d.dueDate,
      }));

  const monthRevenue = revenueSeries[revenueSeries.length - 1].revenueCents;
  const overdue = allInvoices.filter((i) => i.status === "overdue");
  const totalOutstanding = allInvoices
    .filter((i) => i.status !== "paid" && i.status !== "refunded")
    .reduce((a, i) => a + i.amountCents, 0);
  const totalPaid = allInvoices
    .filter((i) => i.status === "paid")
    .reduce((a, i) => a + i.amountCents, 0);

  const sendMut = useMutation({
    mutationFn: (id: string) => sendInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices", studio.id] });
      toast.success("Invoice sent to parent");
    },
    onError: () => toast.error("Failed to send invoice"),
  });

  const payMut = useMutation({
    mutationFn: (id: string) => payInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices", studio.id] });
      toast.success("Payment recorded");
    },
    onError: () => toast.error("Payment failed"),
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Payments & Billing</h2>
          <p className="text-sm text-muted-foreground">
            {connectState?.status === "connected"
              ? "Stripe Connect active — direct payouts to your bank"
              : "Powered by Stripe — connect to accept payments"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-full bg-rose px-4 py-2.5 text-sm font-semibold text-rose-foreground shadow-soft transition hover:opacity-90"
          >
            <FileText className="h-4 w-4" /> Create invoice
          </button>
          {connectState?.status !== "connected" && (
            <a
              href="/settings"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold shadow-soft transition hover:bg-secondary"
            >
              <CreditCard className="h-4 w-4" /> Connect Stripe
            </a>
          )}
        </div>
      </div>

      {/* Connect banner */}
      {connectState?.status !== "connected" && (
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-5 flex flex-wrap items-center gap-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-amber-900">Connect your Stripe account</p>
            <p className="text-sm text-amber-700/80">Enable real payments from families. It takes less than 5 minutes to onboard.</p>
          </div>
          <a
            href="/settings"
            className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-amber-900 shadow-soft transition hover:opacity-90"
          >
            Set up Stripe
          </a>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} label="Collected this month" value={formatCurrency(monthRevenue, true)} delta={12} icon={DollarSign} accent="gold" />
        <StatCard index={1} label="Outstanding" value={formatCurrency(totalOutstanding, true)} hint={`${allInvoices.length} invoices`} icon={Clock} accent="rose" />
        <StatCard index={2} label="Overdue" value={String(overdue.length)} hint="needs follow-up" icon={AlertTriangle} accent="plum" />
        <StatCard index={3} label="Paid to date" value={formatCurrency(totalPaid, true)} hint={`${allInvoices.filter((i) => i.status === "paid").length} invoices`} icon={CheckCircle2} accent="teal" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <h3 className="font-display text-lg font-semibold">Invoices</h3>
          <button
            onClick={() => toast.info("Export coming soon")}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose transition hover:opacity-80"
          >
            Export <Download className="h-4 w-4" />
          </button>
        </div>
        {isLoading ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto h-5 w-5 animate-spin mb-2" />
            Loading invoices…
          </div>
        ) : allInvoices.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-display text-lg font-semibold">No invoices yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first invoice to start billing families.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 rounded-full bg-rose px-5 py-2 text-sm font-semibold text-rose-foreground"
            >
              Create invoice
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {allInvoices.map((inv) => {
              const meta = statusMeta[inv.status] ?? statusMeta.draft;
              const Icon = meta.icon;
              return (
                <div key={inv.id} className="flex items-center gap-4 px-5 py-4 transition hover:bg-secondary/40">
                  <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", meta.chip)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{inv.studentName}</p>
                    <p className="truncate text-xs text-muted-foreground">{inv.description} · {inv.parentName}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-xs text-muted-foreground">Due</p>
                    <p className="text-sm font-medium">{formatDate(inv.dueDate)}</p>
                  </div>
                  <p className="w-20 text-right font-display text-base font-semibold tabular-nums">{formatCurrency(inv.amountCents)}</p>
                  <span className={cn("w-24 shrink-0 rounded-full px-2.5 py-1 text-center text-xs font-semibold", meta.chip)}>
                    {meta.label}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {inv.status === "draft" && (
                      <button
                        onClick={() => sendMut.mutate(inv.id)}
                        disabled={sendMut.isPending}
                        className="rounded-full bg-rose/10 p-1.5 text-rose transition hover:bg-rose/20"
                        title="Send to parent"
                      >
                        {sendMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    {(inv.status === "sent" || inv.status === "overdue") && (
                      <button
                        onClick={() => payMut.mutate(inv.id)}
                        disabled={payMut.isPending}
                        className="rounded-full bg-success/10 p-1.5 text-success transition hover:bg-success/20"
                        title="Mark as paid"
                      >
                        {payMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Auto-recover banner */}
      <div className="rounded-2xl border border-border/70 bg-gradient-to-r from-gold/10 to-rose/10 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold/15 text-gold">
            <RefreshCcw className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold">Auto-recover failed payments</p>
            <p className="text-sm text-muted-foreground">Smart retries and email reminders recover up to 70% of failed charges. Requires Stripe Connect.</p>
          </div>
          <button
            disabled={connectState?.status !== "connected"}
            onClick={() => toast.info("Auto-pay setup coming soon")}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            Enable
          </button>
        </div>
      </div>

      <CreateInvoiceModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
