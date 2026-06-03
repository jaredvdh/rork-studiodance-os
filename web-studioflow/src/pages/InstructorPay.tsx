import { useCallback, useMemo, useState } from "react";
import {
  ChevronDown,
  DollarSign,
  Download,
  Pencil,
  UserRound,
} from "lucide-react";

import { useStudioData, useTeachers } from "@/data/store";
import type { PayType, Teacher } from "@/data/types";
import { cn } from "@/lib/utils";

type Period = "weekly" | "biweekly" | "monthly";

const PERIOD_LABELS: Record<Period, string> = {
  weekly: "This week",
  biweekly: "Bi-weekly",
  monthly: "This month",
};

const PERIOD_MULTIPLIER: Record<Period, number> = {
  weekly: 1,
  biweekly: 2,
  monthly: 4.33,
};

function weeklyHours(teacherId: string, classes: { teacherId: string; durationMins: number }[]): number {
  const mins = classes
    .filter((c) => c.teacherId === teacherId)
    .reduce((sum, c) => sum + c.durationMins, 0);
  return mins / 60;
}

function grossPay(hours: number, rateCents: number, multiplier: number): number {
  return Math.round(hours * (rateCents / 100) * multiplier * 100);
}

function formatHours(h: number): string {
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  if (mins === 0) return `${whole}h`;
  return `${whole}h ${mins}m`;
}

/**
 * Builds a CSV string compatible with Gusto, ADP Run, and QuickBooks Payroll import.
 * Columns: Name, Email, Pay Type, Period Hours, Hourly Rate, Gross Pay, Period Start, Period End
 */
function buildCsv(
  rows: InstructorRow[],
  period: Period,
  periodLabel: string,
): string {
  const header = "Name,Email,Pay Type,Period Hours,Hourly Rate,Gross Pay,Period Start,Period End";
  const today = new Date();
  const start = new Date(today);
  // Align start to Monday
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);

  const end = new Date(start);
  if (period === "weekly") end.setDate(end.getDate() + 6);
  else if (period === "biweekly") end.setDate(end.getDate() + 13);
  else end.setMonth(end.getMonth() + 1);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const lines = rows.map((r) => {
    const hours = formatHours(r.weeklyHrs * PERIOD_MULTIPLIER[period]).replace("h ", ".");
    const rate = (r.rateCents / 100).toFixed(2);
    const pay = (r.grossPayCents / 100).toFixed(2);
    return [
      r.name,
      r.email,
      r.payType === "employee" ? "Employee" : "1099 Contractor",
      hours,
      rate,
      pay,
      fmt(start),
      fmt(end),
    ].join(",");
  });

  return [header, ...lines].join("\n");
}

interface InstructorRow {
  id: string;
  name: string;
  email: string;
  rateCents: number;
  payType: PayType;
  weeklyHrs: number;
  classCount: number;
  grossPayCents: number;
}

export default function InstructorPay() {
  const { classes } = useStudioData();
  const { teachers, updateTeacher } = useTeachers();
  const [period, setPeriod] = useState<Period>("biweekly");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState<string>("");
  const [editPayType, setEditPayType] = useState<PayType>("employee");
  const [periodMenuOpen, setPeriodMenuOpen] = useState<boolean>(false);

  const multiplier = PERIOD_MULTIPLIER[period];

  const rows = useMemo<InstructorRow[]>(() => {
    return teachers.map((t) => {
      const wh = weeklyHours(t.id, classes);
      const rate = t.hourlyRateCents ?? 0;
      return {
        id: t.id,
        name: t.name,
        email: t.email,
        rateCents: rate,
        payType: t.payType ?? "employee",
        weeklyHrs: wh,
        classCount: classes.filter((c) => c.teacherId === t.id).length,
        grossPayCents: grossPay(wh, rate, multiplier),
      };
    });
  }, [teachers, classes, multiplier]);

  const totalGross = useMemo(() => rows.reduce((s, r) => s + r.grossPayCents, 0), [rows]);
  const totalHours = useMemo(() => rows.reduce((s, r) => s + r.weeklyHrs, 0), [rows]);

  const setForPeriod = useCallback((p: Period) => {
    setPeriod(p);
    setPeriodMenuOpen(false);
  }, []);

  const startEdit = useCallback(
    (t: Teacher) => {
      setEditingId(t.id);
      setEditRate(((t.hourlyRateCents ?? 0) / 100).toFixed(2));
      setEditPayType(t.payType ?? "employee");
    },
    [],
  );

  const saveEdit = useCallback(() => {
    if (!editingId) return;
    const rate = Math.round(parseFloat(editRate) * 100);
    if (isNaN(rate) || rate < 0) return;
    updateTeacher(editingId, { hourlyRateCents: rate, payType: editPayType });
    setEditingId(null);
  }, [editingId, editRate, editPayType, updateTeacher]);

  const cancelEdit = useCallback(() => setEditingId(null), []);

  const exportCsv = useCallback(() => {
    const csv = buildCsv(rows, period, PERIOD_LABELS[period]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `instructor-pay-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rows, period]);

  const formatCents = (c: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Instructor Pay
          </h2>
          <p className="text-sm text-muted-foreground">
            Schedule-to-payroll bridge · Export ready for Gusto, ADP, or QuickBooks
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="relative">
            <button
              onClick={() => setPeriodMenuOpen(!periodMenuOpen)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold shadow-soft transition hover:bg-secondary"
            >
              <span>{PERIOD_LABELS[period]}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {periodMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setPeriodMenuOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-44 rounded-2xl border border-border/70 bg-card p-1.5 shadow-lift">
                  {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setForPeriod(k)}
                      className={cn(
                        "w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition",
                        period === k
                          ? "bg-rose/10 text-rose"
                          : "hover:bg-secondary",
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Export CSV */}
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-full bg-rose px-4 py-2.5 text-sm font-semibold text-rose-foreground shadow-soft transition hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label={`${PERIOD_LABELS[period]} gross pay`}
          value={formatCents(totalGross)}
          icon={DollarSign}
          variant="rose"
        />
        <SummaryCard
          label="Total weekly hours"
          value={`${formatHours(totalHours)}`}
          icon={UserRound}
          variant="plum"
        />
        <SummaryCard
          label="Active instructors"
          value={`${teachers.length}`}
          icon={UserRound}
          variant="teal"
        />
      </div>

      {/* Instructor table */}
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
        {/* Table header — visible on md+ */}
        <div className="hidden border-b border-border/60 bg-secondary/40 px-6 py-3 md:grid md:grid-cols-[1.4fr_0.8fr_120px_90px_140px]">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Instructor</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pay type</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Hours</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Rate</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Gross pay</span>
        </div>

        <div className="divide-y divide-border/40">
          {rows.map((row) => {
            const isEditing = editingId === row.id;
            return (
              <div
                key={row.id}
                className={cn(
                  "group px-6 py-4 transition hover:bg-secondary/20",
                  "md:grid md:grid-cols-[1.4fr_0.8fr_120px_90px_140px] md:items-center md:gap-0",
                  "flex flex-col gap-2",
                )}
              >
                {/* Instructor name + classes */}
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-plum/10 font-display text-sm font-semibold text-plum">
                    {row.name.split(" ").map((w) => w[0]).join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold">
                      {row.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.classCount} class{row.classCount !== 1 ? "es" : ""} · {formatHours(row.weeklyHrs)}/wk
                    </p>
                  </div>
                </div>

                {/* Pay type — editable */}
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={editPayType}
                      onChange={(e) => setEditPayType(e.target.value as PayType)}
                      className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-medium outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
                    >
                      <option value="employee">Employee</option>
                      <option value="1099">1099 Contractor</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        row.payType === "1099"
                          ? "bg-gold/15 text-gold"
                          : "bg-teal/10 text-teal",
                      )}
                    >
                      {row.payType === "1099" ? "1099" : "Employee"}
                    </span>
                  </div>
                )}

                {/* Hours */}
                <div className="text-sm md:text-right">
                  <span className="font-semibold tabular-nums">
                    {formatHours(row.weeklyHrs * multiplier)}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground md:hidden">
                    / {PERIOD_LABELS[period].toLowerCase()}
                  </span>
                </div>

                {/* Rate — editable */}
                {isEditing ? (
                  <div className="flex items-center gap-1 md:justify-end">
                    <span className="text-sm text-muted-foreground">$</span>
                    <input
                      type="number"
                      value={editRate}
                      onChange={(e) => setEditRate(e.target.value)}
                      step="0.25"
                      min="0"
                      className="w-20 rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm font-semibold tabular-nums outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                      autoFocus
                    />
                    <span className="text-xs text-muted-foreground">/hr</span>
                  </div>
                ) : (
                  <div className="text-sm font-semibold tabular-nums md:text-right">
                    {row.rateCents > 0
                      ? formatCents(row.rateCents)
                      : (
                        <span className="text-muted-foreground font-normal">
                          Not set
                        </span>
                      )}
                  </div>
                )}

                {/* Gross pay */}
                <div className="flex items-center justify-between md:justify-end md:gap-2">
                  <span className="text-sm font-display font-semibold tabular-nums md:text-right">
                    {formatCents(row.grossPayCents)}
                  </span>

                  {/* Edit / Save / Cancel */}
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={saveEdit}
                          className="rounded-lg bg-rose px-2.5 py-1 text-xs font-semibold text-rose-foreground transition hover:opacity-90"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium transition hover:bg-secondary"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          const t = teachers.find((x) => x.id === row.id);
                          if (t) startEdit(t);
                        }}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-secondary hover:text-foreground"
                        aria-label={`Edit rate for ${row.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile: period label */}
                <p className="text-xs text-muted-foreground md:hidden">
                  {PERIOD_LABELS[period]} · {row.payType === "1099" ? "1099 Contractor" : "Employee"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer note */}
      <div className="rounded-2xl border border-plum/20 bg-plum/5 p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-plum/10 text-plum">
            <Download className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">CSV ready for payroll import</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              The CSV export includes all columns needed for{" "}
              <strong>Gusto</strong>, <strong>ADP Run</strong>, and{" "}
              <strong>QuickBooks Payroll</strong>. Hours are calculated from your
              live schedule — update rates here, export, and upload directly to
              your payroll provider. StudioFlow never touches tax filings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  variant,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: "rose" | "plum" | "teal";
}) {
  const colors: Record<string, { bg: string; text: string; iconBg: string }> = {
    rose: { bg: "bg-rose/5 border-rose/20", text: "text-rose", iconBg: "bg-rose/10" },
    plum: { bg: "bg-plum/5 border-plum/20", text: "text-plum", iconBg: "bg-plum/10" },
    teal: { bg: "bg-teal/5 border-teal/20", text: "text-teal", iconBg: "bg-teal/10" },
  };
  const c = colors[variant];

  return (
    <div className={cn("rounded-2xl border p-5 shadow-soft", c.bg)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className={cn("grid h-8 w-8 place-items-center rounded-lg", c.iconBg, c.text)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={cn("mt-2 font-display text-2xl font-bold tracking-tight", c.text)}>
        {value}
      </p>
    </div>
  );
}
