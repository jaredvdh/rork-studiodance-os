import { ArrowUpRight, CheckCircle2, Clock, CreditCard, DollarSign, RefreshCcw } from "lucide-react";

import StatCard from "@/components/StatCard";
import { useStudioData } from "@/data/store";
import type { PaymentStatus } from "@/data/types";
import { formatCurrency, formatDate, initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusMeta: Record<PaymentStatus, { chip: string; label: string }> = {
  paid: { chip: "bg-success/10 text-success", label: "Paid" },
  due: { chip: "bg-gold/15 text-gold", label: "Due soon" },
  overdue: { chip: "bg-destructive/10 text-destructive", label: "Overdue" },
};

export default function Payments() {
  const { invoices, revenueSeries } = useStudioData();
  const monthRevenue = revenueSeries[revenueSeries.length - 1].revenueCents;
  const outstanding = invoices.reduce((a, i) => a + i.amountCents, 0);
  const overdue = invoices.filter((i) => i.status === "overdue");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Payments &amp; Billing</h2>
          <p className="text-sm text-muted-foreground">Powered by Stripe Connect · direct payouts to your bank</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-4 py-2 text-sm font-semibold text-success">
          <CheckCircle2 className="h-4 w-4" /> Stripe connected
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} label="Collected this month" value={formatCurrency(monthRevenue, true)} delta={12} icon={DollarSign} accent="gold" />
        <StatCard index={1} label="Outstanding" value={formatCurrency(outstanding, true)} hint={`${invoices.length} invoices`} icon={Clock} accent="rose" />
        <StatCard index={2} label="Overdue" value={String(overdue.length)} hint="needs follow-up" icon={RefreshCcw} accent="plum" />
        <StatCard index={3} label="Next payout" value={formatCurrency(monthRevenue * 0.32, true)} hint="in 2 days" icon={CreditCard} accent="teal" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <h3 className="font-display text-lg font-semibold">Invoices</h3>
          <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose transition hover:opacity-80">
            Export <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
        <div className="divide-y divide-border/60">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center gap-4 px-5 py-4 transition hover:bg-secondary/40">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-foreground/70">{initials(inv.studentName)}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{inv.studentName}</p>
                <p className="truncate text-xs text-muted-foreground">{inv.description} · {inv.parentName}</p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-xs text-muted-foreground">Due</p>
                <p className="text-sm font-medium">{formatDate(inv.dueDate)}</p>
              </div>
              <p className="w-20 text-right font-display text-base font-semibold tabular-nums">{formatCurrency(inv.amountCents)}</p>
              <span className={cn("w-24 shrink-0 rounded-full px-2.5 py-1 text-center text-xs font-semibold", statusMeta[inv.status].chip)}>
                {statusMeta[inv.status].label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-gradient-to-r from-gold/10 to-rose/10 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold/15 text-gold">
            <RefreshCcw className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold">Auto-recover failed payments</p>
            <p className="text-sm text-muted-foreground">Smart retries and friendly email reminders recover up to 70% of failed charges automatically.</p>
          </div>
          <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90">Enable</button>
        </div>
      </div>
    </div>
  );
}
