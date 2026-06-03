import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Receipt,
} from "lucide-react";

import { useStudioData } from "@/data/store";
import { useParent } from "@/data/parentStore";
import type { PaymentStatus } from "@/data/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusBadge: Record<PaymentStatus, { label: string; className: string }> =
  {
    paid: { label: "Paid", className: "bg-success/10 text-success" },
    due: { label: "Due", className: "bg-amber-100 text-amber-700" },
    overdue: {
      label: "Overdue",
      className: "bg-rose/10 text-rose",
    },
  };

export default function ParentPayments() {
  const { invoices } = useStudioData();
  const { children: myStudents } = useParent();
  const [filter, setFilter] = useState<PaymentStatus | "all">("all");

  const myInvoices = useMemo(
    () =>
      invoices.filter((i) =>
        myStudents.some((s) => s.name === i.studentName),
      ),
    [invoices, myStudents],
  );

  const filtered =
    filter === "all"
      ? myInvoices
      : myInvoices.filter((i) => i.status === filter);

  const totalOutstanding = useMemo(
    () =>
      myInvoices
        .filter((i) => i.status !== "paid")
        .reduce((a, i) => a + i.amountCents, 0),
    [myInvoices],
  );

  const paidTotal = useMemo(
    () =>
      myInvoices
        .filter((i) => i.status === "paid")
        .reduce((a, i) => a + i.amountCents, 0),
    [myInvoices],
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="animate-float-up">
          <p className="text-sm text-muted-foreground">Billing & payments</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Payments
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage invoices and payment methods
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-amber-900 shadow-soft transition hover:opacity-90">
          <CreditCard className="h-4 w-4" />
          Add payment method
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-200/70 bg-white p-5 shadow-soft animate-float-up">
          <Receipt className="h-5 w-5 text-muted-foreground mb-3" />
          <p className="font-display text-2xl font-semibold">
            {myInvoices.length}
          </p>
          <p className="text-sm text-muted-foreground">Total invoices</p>
        </div>
        <div className="rounded-2xl border border-success/20 bg-success/5 p-5 shadow-soft animate-float-up [animation-delay:60ms]">
          <CheckCircle2 className="h-5 w-5 text-success mb-3" />
          <p className="font-display text-2xl font-semibold text-success">
            {formatCurrency(paidTotal)}
          </p>
          <p className="text-sm text-muted-foreground">Paid to date</p>
        </div>
        <div
          className={cn(
            "rounded-2xl border p-5 shadow-soft animate-float-up [animation-delay:120ms]",
            totalOutstanding > 0
              ? "border-rose/20 bg-rose/5"
              : "border-amber-200/70 bg-white",
          )}
        >
          <AlertTriangle
            className={cn(
              "h-5 w-5 mb-3",
              totalOutstanding > 0 ? "text-rose" : "text-muted-foreground",
            )}
          />
          <p className="font-display text-2xl font-semibold">
            {formatCurrency(totalOutstanding)}
          </p>
          <p className="text-sm text-muted-foreground">Outstanding</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: "all" as const, label: "All" },
          { key: "paid" as PaymentStatus, label: "Paid" },
          { key: "due" as PaymentStatus, label: "Due" },
          { key: "overdue" as PaymentStatus, label: "Overdue" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
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
            const status = statusBadge[inv.status];
            return (
              <div
                key={inv.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-amber-200/70 bg-white p-4 animate-float-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-100 text-amber-700">
                  <Receipt className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{inv.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {inv.studentName} · Due{" "}
                    {formatDate(inv.dueDate, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg font-semibold tabular-nums">
                    {formatCurrency(inv.amountCents)}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      status.className,
                    )}
                  >
                    {status.label}
                  </span>
                  {inv.status !== "paid" && (
                    <button className="rounded-full bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-amber-900 transition hover:opacity-90">
                      Pay now
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
          <h3 className="mt-4 font-display text-xl font-semibold">
            All caught up!
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No invoices match this filter.
          </p>
        </div>
      )}

      {/* Payment methods */}
      <div className="rounded-2xl border border-amber-200/70 bg-white p-6 shadow-soft">
        <h3 className="font-display text-lg font-semibold mb-4">
          Payment methods
        </h3>
        <div className="flex items-center gap-4 rounded-xl bg-amber-50/60 p-4">
          <CreditCard className="h-6 w-6 text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">Visa ending in 4242</p>
            <p className="text-xs text-muted-foreground">Expires 12/2027</p>
          </div>
          <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
            Default
          </span>
        </div>
      </div>
    </div>
  );
}
