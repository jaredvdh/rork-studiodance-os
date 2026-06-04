import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  Box,
  CalendarClock,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Hash,
  Package,
  Palette,
  PencilRuler,
  Ruler,
  Scissors,
  Search,
  Shirt,
  Sparkles,
  Store,
  Ticket,
  TrendingUp,
  Truck,
  Users,
  Warehouse,
  XCircle,
} from "lucide-react";

import { useStudio, useStudents, useEnrichedClasses, useTeachers, useTerminology, useCostumes } from "@/data/store";
import {
  COSTUME_CATEGORY_LABELS,
  COSTUME_FEE_TYPE_LABELS,
  ALTERATION_STATUS_LABELS,
  VENDOR_ORDER_STATUS_LABELS,
  INVENTORY_CONDITION_LABELS,
  RENTAL_STATUS_LABELS,
} from "@/data/types";
import type {
  Alteration,
  Costume,
  CostumeAssignment,
  CostumeCategory,
  CostumeFee,
  CostumeRental,
  QuickChangeConflict,
  ReusableCostume,
  SizeRecommendation,
  StudentMeasurement,
  VendorOrder,
} from "@/data/types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tab = "dashboard" | "library" | "measurements" | "orders" | "alterations" | "distribution" | "inventory" | "quickchange";

const TABS: { key: Tab; label: string; icon: typeof Shirt }[] = [
  { key: "dashboard", label: "Overview", icon: TrendingUp },
  { key: "library", label: "Library", icon: Shirt },
  { key: "measurements", label: "Measurements", icon: Ruler },
  { key: "orders", label: "Orders", icon: Truck },
  { key: "alterations", label: "Alterations", icon: Scissors },
  { key: "distribution", label: "Distribution", icon: ClipboardCheck },
  { key: "inventory", label: "Inventory", icon: Warehouse },
  { key: "quickchange", label: "Quick Change", icon: Clock },
];

export default function Costumes() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [search, setSearch] = useState("");
  const { studio } = useStudio();
  const term = useTerminology();
  const { students } = useStudents();
  const classes = useEnrichedClasses();
  const { teachers } = useTeachers();
  const ctx = useCostumes();

  const filteredCostumes = useMemo(() => {
    if (!search.trim()) return ctx.costumes;
    const q = search.toLowerCase();
    return ctx.costumes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.vendor?.toLowerCase().includes(q)) ||
        (c.sku?.toLowerCase().includes(q)) ||
        COSTUME_CATEGORY_LABELS[c.category].toLowerCase().includes(q),
    );
  }, [ctx.costumes, search]);

  // Computed summary metrics
  const summary = useMemo(() => {
    const missingMeasurements = ctx.studentsMissingMeasurements(students.map((s) => s.id));
    const outstandingFees = ctx.outstandingFeeTotal();
    const overdueAlterations = ctx.alterations.filter(
      (a) => a.dueDate && new Date(a.dueDate) < new Date() && a.status !== "complete" && a.status !== "delivered",
    ).length;
    const conflicts = ctx.quickChangeConflictCount();
    const inTransit = ctx.ordersByStatus("shipped").length + ctx.ordersByStatus("ordered").length;
    const readyDist = ctx.ordersByStatus("ready").length;
    const totalCostumes = ctx.costumes.length;
    const totalAssignments = ctx.assignments.length;
    const totalMeasurements = ctx.measurements.filter((m) => m.status === "approved").length;
    const totalFees = ctx.costumeFees.reduce((a, f) => a + f.totalCents, 0);
    const totalPaid = ctx.costumeFees.reduce((a, f) => a + f.paidCents, 0);

    return {
      totalCostumes,
      totalAssignments,
      missingMeasurements: missingMeasurements.length,
      totalMeasurements,
      outstandingFees,
      overdueAlterations,
      conflicts,
      inTransit,
      readyDist,
      totalFees,
      totalPaid,
      feeCollectionPct: totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 100,
    };
  }, [ctx, students]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Costumes & Recitals</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Costume Management</h2>
        </div>
        <Link
          to="/recitals"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-secondary"
        >
          <Ticket className="h-4 w-4" /> Manage {term.eventPlural}
        </Link>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-border/70 bg-card p-1.5 shadow-soft">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
              tab === key
                ? "bg-rose text-rose-foreground shadow-lift"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Search bar (library + inventory tabs) */}
      {(tab === "library" || tab === "inventory") && (
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder={tab === "library" ? "Search costumes by name, vendor, SKU…" : "Search inventory…"}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* ── Tab: Dashboard (Overview) ──────────────────────────── */}
      {tab === "dashboard" && <CostumeDashboard summary={summary} ctx={ctx} students={students} term={term} />}

      {/* ── Tab: Costume Library ───────────────────────────────── */}
      {tab === "library" && <CostumeLibrary costumes={filteredCostumes} assignments={ctx.assignments} classes={classes} ctx={ctx} />}

      {/* ── Tab: Measurements ──────────────────────────────────── */}
      {tab === "measurements" && <MeasurementsTab measurements={ctx.measurements} students={students} sizingCharts={ctx.sizingCharts} recommendations={ctx.sizeRecommendations} costumes={ctx.costumes} />}

      {/* ── Tab: Vendor Orders ─────────────────────────────────── */}
      {tab === "orders" && <OrdersTab orders={ctx.vendorOrders} costumes={ctx.costumes} />}

      {/* ── Tab: Alterations ───────────────────────────────────── */}
      {tab === "alterations" && <AlterationsTab alterations={ctx.alterations} students={students} costumes={ctx.costumes} />}

      {/* ── Tab: Distribution ──────────────────────────────────── */}
      {tab === "distribution" && <DistributionTab distributions={ctx.distributions} students={students} costumes={ctx.costumes} />}

      {/* ── Tab: Reusable Inventory ────────────────────────────── */}
      {tab === "inventory" && <InventoryTab inventory={ctx.reusableInventory} costumes={ctx.costumes} rentals={ctx.rentals} students={students} search={search} />}

      {/* ── Tab: Quick Change Analysis ─────────────────────────── */}
      {tab === "quickchange" && <QuickChangeTab conflicts={ctx.quickChangeConflicts} students={students} />}

      <p className="pb-2 text-center text-xs text-muted-foreground">
        StudioFlow Costume Management · {studio.name}
      </p>
    </div>
  );
}

/* ── Dashboard Sub-Component ──────────────────────────────────────────── */

function CostumeDashboard({ summary, ctx, students, term }: {
  summary: ReturnType<typeof useMemo>;
  ctx: ReturnType<typeof useCostumes>;
  students: ReturnType<typeof useStudents>["students"];
  term: ReturnType<typeof useTerminology>;
}) {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total Costumes" value={summary.totalCostumes} icon={Shirt} accent="rose" />
        <SummaryCard label={`${term.participantPlural} Missing Measurements`} value={summary.missingMeasurements} icon={Ruler} accent={summary.missingMeasurements > 0 ? "gold" : "teal"} />
        <SummaryCard label="Outstanding Fees" value={formatCurrency(summary.outstandingFees, true)} icon={DollarSign} accent={summary.outstandingFees > 0 ? "gold" : "teal"} />
        <SummaryCard label="Quick-Change Conflicts" value={summary.conflicts} icon={Clock} accent={summary.conflicts > 0 ? "rose" : "teal"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Orders In Transit" value={summary.inTransit} icon={Truck} accent="plum" />
        <SummaryCard label="Ready for Distribution" value={summary.readyDist} icon={Package} accent="teal" />
        <SummaryCard label="Alterations Overdue" value={summary.overdueAlterations} icon={Scissors} accent={summary.overdueAlterations > 0 ? "rose" : "teal"} />
        <SummaryCard label="Fee Collection" value={`${summary.feeCollectionPct}%`} icon={TrendingUp} accent={summary.feeCollectionPct >= 75 ? "teal" : "gold"} />
      </div>

      {/* Deadlines + activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Deadlines */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft lg:col-span-2">
          <h3 className="font-display text-lg font-semibold">Upcoming Deadlines</h3>
          <div className="mt-4 space-y-3">
            <DeadlineRow icon={Ruler} label="Measurement Deadline" date="June 1, 2026" status={summary.missingMeasurements > 0 ? `${summary.missingMeasurements} still needed` : "Complete!"} urgent={summary.missingMeasurements > 0} />
            <DeadlineRow icon={Truck} label="Ordering Deadline" date="June 10, 2026" status="2 orders pending" urgent />
            <DeadlineRow icon={Package} label="Distribution Date" date="June 14, 2026" status="Evening before recital" urgent={false} />
            <DeadlineRow icon={Ticket} label="Recital Date" date="June 15, 2026" status="Benson Theatre · 7:00 PM" urgent={false} />
          </div>
        </div>

        {/* AI Insights */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft bg-gradient-to-br from-rose/5 to-plum/5">
          <div className="flex items-center gap-2 text-rose mb-3">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">AI Insights</span>
          </div>
          <div className="space-y-3 text-sm">
            {summary.missingMeasurements > 0 && (
              <InsightItem icon={AlertTriangle} tone="text-gold">
                {summary.missingMeasurements} {term.participantPlural.toLowerCase()} still require measurements.
              </InsightItem>
            )}
            {summary.outstandingFees > 0 && (
              <InsightItem icon={DollarSign} tone="text-rose">
                {formatCurrency(summary.outstandingFees, true)} in unpaid costume fees.
              </InsightItem>
            )}
            {summary.conflicts > 0 && (
              <InsightItem icon={Clock} tone="text-plum">
                {summary.conflicts} {term.participant.toLowerCase()}{summary.conflicts !== 1 ? "s have" : " has"} quick-change conflicts.
              </InsightItem>
            )}
            {ctx.reusableInventory.filter((r) => r.status === "available").length > 0 && (
              <InsightItem icon={Warehouse} tone="text-teal">
                {ctx.reusableInventory.filter((r) => r.status === "available").length} costumes available from previous seasons could save approx. {formatCurrency(ctx.reusableInventory.filter((r) => r.status === "available").length * 3500)}.
              </InsightItem>
            )}
            <InsightItem icon={Truck} tone="text-plum">
              Ordering before June 1 saves approximately $180 in shipping.
            </InsightItem>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
        <h3 className="font-display text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {ctx.measurements.filter((m) => m.status === "approved").slice(0, 3).map((m) => {
            const s = students.find((st) => st.id === m.studentId);
            return (
              <ActivityItem
                key={m.id}
                icon={CheckCircle2}
                tone="text-teal"
                text={`${s?.name ?? "Student"} — measurements approved`}
                time={m.createdAt}
              />
            );
          })}
          {ctx.distributions.slice(0, 2).map((d) => {
            const s = students.find((st) => st.id === d.studentId);
            return (
              <ActivityItem
                key={d.id}
                icon={Package}
                tone="text-plum"
                text={`${s?.name ?? "Student"} — costume distributed`}
                time={d.createdAt}
              />
            );
          })}
          {ctx.costumeFees.filter((f) => f.status === "paid").slice(0, 2).map((f) => {
            const s = students.find((st) => st.id === f.studentId);
            return (
              <ActivityItem
                key={f.id}
                icon={DollarSign}
                tone="text-teal"
                text={`${s?.name ?? "Student"} — costume fee paid`}
                time={f.updatedAt}
              />
            );
          })}
          {ctx.sizeRecommendations.filter((r) => !r.parentApproved).slice(0, 2).map((r) => {
            const s = students.find((st) => st.id === r.studentId);
            return (
              <ActivityItem
                key={r.id}
                icon={Clock}
                tone="text-gold"
                text={`${s?.name ?? "Student"} — size recommendation pending parent approval`}
                time={r.createdAt}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Costume Library Sub-Component ──────────────────────────────────────── */

function CostumeLibrary({ costumes, assignments, classes, ctx }: {
  costumes: Costume[];
  assignments: CostumeAssignment[];
  classes: ReturnType<typeof useEnrichedClasses>;
  ctx: ReturnType<typeof useCostumes>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {costumes.length === 0 ? (
        <div className="col-span-full rounded-2xl border border-border/70 bg-card p-12 text-center">
          <Shirt className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-semibold">No costumes yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your first costume to the library to get started.</p>
        </div>
      ) : (
        costumes.map((c) => {
          const relatedAssignments = assignments.filter((a) => a.costumeId === c.id);
          const assignedClasses = relatedAssignments
            .filter((a) => a.classId)
            .map((a) => classes.find((cl) => cl.id === a.classId))
            .filter(Boolean);
          const totalAssigned = relatedAssignments.reduce((sum, a) => sum + a.assignedCount, 0);
          const margin = c.retailCostCents - c.wholesaleCostCents - c.shippingAllocationCents;
          return (
            <div
              key={c.id}
              className="group rounded-2xl border border-border/70 bg-card p-5 shadow-soft transition-all hover:shadow-md hover:border-rose/30"
            >
              {/* Category + vendor badges */}
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-full bg-rose/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose">
                  {COSTUME_CATEGORY_LABELS[c.category]}
                </span>
                {c.vendor && (
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground">
                    {c.vendor}
                  </span>
                )}
              </div>

              {/* Name + description */}
              <h4 className="font-display text-base font-semibold">{c.name}</h4>
              {c.colour && <p className="text-sm text-muted-foreground">{c.colour}</p>}
              {c.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.description}</p>
              )}

              {/* Pricing */}
              <div className="mt-3 rounded-xl bg-secondary/40 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Wholesale</span>
                  <span className="font-medium">{formatCurrency(c.wholesaleCostCents)}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">{formatCurrency(c.shippingAllocationCents)}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-muted-foreground">Markup</span>
                  <span className="font-medium">{c.markupPct}%</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm">
                  <span className="font-semibold">Retail</span>
                  <span className="font-display font-semibold text-rose">{formatCurrency(c.retailCostCents)}</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Margin</span>
                  <span className={cn("font-medium", margin > 0 ? "text-teal" : "text-rose")}>
                    {formatCurrency(margin)}
                  </span>
                </div>
              </div>

              {/* Skills + assigned classes */}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Hash className="h-3 w-3" />
                  <span>SKU: {c.sku ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{totalAssigned} assigned across {relatedAssignments.length} {relatedAssignments.length === 1 ? "entry" : "entries"}</span>
                </div>
                {assignedClasses.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {assignedClasses.slice(0, 3).map((cls) => (
                      <span key={cls!.id} className="rounded-full bg-plum/10 px-2 py-0.5 text-[10px] font-medium text-plum">
                        {cls!.name}
                      </span>
                    ))}
                    {assignedClasses.length > 3 && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                        +{assignedClasses.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ── Measurements Tab ───────────────────────────────────────────────────── */

function MeasurementsTab({ measurements, students, sizingCharts, recommendations, costumes }: {
  measurements: StudentMeasurement[];
  students: ReturnType<typeof useStudents>["students"];
  sizingCharts: ReturnType<typeof useCostumes>["sizingCharts"];
  recommendations: SizeRecommendation[];
  costumes: Costume[];
}) {
  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatPill label="Approved" value={measurements.filter((m) => m.status === "approved").length} tone="bg-teal" />
        <StatPill label="Pending" value={measurements.filter((m) => m.status === "pending").length} tone="bg-gold" />
        <StatPill label="Draft" value={measurements.filter((m) => m.status === "draft").length} tone="bg-secondary" />
      </div>

      {/* Student measurement cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {measurements.map((m) => {
          const student = students.find((s) => s.id === m.studentId);
          const recs = recommendations.filter((r) => r.studentId === m.studentId);
          return (
            <div key={m.id} className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold">{student?.name ?? "Unknown Student"}</p>
                  <p className="text-xs text-muted-foreground">Last updated: {new Date(m.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                  m.status === "approved" ? "bg-teal/10 text-teal" :
                  m.status === "pending" ? "bg-gold/10 text-gold" :
                  "bg-secondary text-muted-foreground",
                )}>
                  {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                </span>
              </div>

              {/* Measurements grid */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                {m.heightCm && <MeasField label="Height" value={`${m.heightCm} cm`} />}
                {m.weightKg && <MeasField label="Weight" value={`${m.weightKg} kg`} />}
                {m.chestCm && <MeasField label="Chest" value={`${m.chestCm} cm`} />}
                {m.waistCm && <MeasField label="Waist" value={`${m.waistCm} cm`} />}
                {m.hipsCm && <MeasField label="Hips" value={`${m.hipsCm} cm`} />}
                {m.girthCm && <MeasField label="Girth" value={`${m.girthCm} cm`} />}
                {m.inseamCm && <MeasField label="Inseam" value={`${m.inseamCm} cm`} />}
                {m.shoeSize && <MeasField label="Shoe" value={m.shoeSize} />}
              </div>

              {/* Size recommendations */}
              {recs.length > 0 && (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">AI Size Recommendations</p>
                  {recs.map((r) => {
                    const costume = costumes.find((c) => c.id === r.costumeId);
                    return (
                      <div key={r.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground truncate">{costume?.name ?? "Costume"}</span>
                        <span className="flex items-center gap-2">
                          <span className="font-semibold">{r.recommendedSize ?? "—"}</span>
                          {r.confidencePct != null && (
                            <span className={cn(
                              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                              r.confidencePct >= 90 ? "bg-teal/10 text-teal" :
                              r.confidencePct >= 75 ? "bg-gold/10 text-gold" : "bg-rose/10 text-rose",
                            )}>
                              {r.confidencePct}%
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sizing Charts */}
      {sizingCharts.length > 0 && (
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
          <h3 className="font-display text-lg font-semibold mb-4">Vendor Sizing Charts</h3>
          <div className="space-y-4">
            {sizingCharts.map((chart) => (
              <div key={chart.id} className="rounded-xl border border-border/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold">{chart.chartName}</p>
                    <p className="text-xs text-muted-foreground">{chart.vendor}</p>
                  </div>
                  {chart.fileType && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground uppercase">
                      {chart.fileType}
                    </span>
                  )}
                </div>
                {chart.chartData.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-1.5 pr-2 text-left font-semibold">Size</th>
                          <th className="py-1.5 px-2 text-center font-semibold">Chest</th>
                          <th className="py-1.5 px-2 text-center font-semibold">Waist</th>
                          <th className="py-1.5 px-2 text-center font-semibold">Girth</th>
                          <th className="py-1.5 pl-2 text-center font-semibold">Height</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chart.chartData.map((row, i) => (
                          <tr key={i} className="border-b border-border/40">
                            <td className="py-1.5 pr-2 font-medium">{row.size}</td>
                            <td className="py-1.5 px-2 text-center text-muted-foreground">
                              {row.chestMin != null && row.chestMax != null ? `${row.chestMin}–${row.chestMax}` : "—"}
                            </td>
                            <td className="py-1.5 px-2 text-center text-muted-foreground">
                              {row.waistMin != null && row.waistMax != null ? `${row.waistMin}–${row.waistMax}` : "—"}
                            </td>
                            <td className="py-1.5 px-2 text-center text-muted-foreground">
                              {row.girthMin != null && row.girthMax != null ? `${row.girthMin}–${row.girthMax}` : "—"}
                            </td>
                            <td className="py-1.5 pl-2 text-center text-muted-foreground">
                              {row.heightMin != null && row.heightMax != null ? `${row.heightMin}–${row.heightMax}` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Vendor Orders Tab ──────────────────────────────────────────────────── */

function OrdersTab({ orders, costumes }: { orders: VendorOrder[]; costumes: Costume[] }) {
  return (
    <div className="space-y-6">
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-border/70 bg-card p-12 text-center">
          <Truck className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-semibold">No vendor orders yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create purchase orders grouped by vendor from the costume library.</p>
        </div>
      ) : (
        orders.map((order) => {
          const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
          const totalCost = order.items.reduce((s, i) => s + i.quantity * i.unitCostCents, 0) + order.shippingCostCents;
          return (
            <div key={order.id} className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-lg font-semibold">{order.vendor}</h3>
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                      order.status === "delivered" || order.status === "quality_checked" || order.status === "ready" || order.status === "distributed"
                        ? "bg-teal/10 text-teal"
                        : order.status === "shipped" ? "bg-plum/10 text-plum"
                        : order.status === "ordered" ? "bg-gold/10 text-gold"
                        : order.status === "cancelled" ? "bg-rose/10 text-rose"
                        : "bg-secondary text-muted-foreground",
                    )}>
                      {VENDOR_ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  {order.poNumber && <p className="text-sm text-muted-foreground">PO #{order.poNumber}</p>}
                </div>
                <div className="text-right text-sm">
                  <p className="text-muted-foreground">Total: {formatCurrency(totalCost)}</p>
                  <p className="text-xs text-muted-foreground">{totalItems} items · {order.items.length} line items</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
                {(["draft", "ordered", "shipped", "delivered", "quality_checked", "ready", "distributed"] as const).map((s, i, arr) => {
                  const done = arr.indexOf(order.status) >= i && order.status !== "cancelled";
                  return (
                    <div key={s} className="flex items-center gap-1 shrink-0">
                      <div className={cn(
                        "grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold",
                        done ? "bg-teal text-white" : "bg-secondary text-muted-foreground",
                      )}>
                        {done ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                      </div>
                      {i < arr.length - 1 && <div className={cn("h-0.5 w-6 rounded", done ? "bg-teal" : "bg-secondary")} />}
                    </div>
                  );
                })}
              </div>

              {/* Dates */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-4">
                {order.orderDate && <span>Ordered: {new Date(order.orderDate).toLocaleDateString()}</span>}
                {order.expectedDelivery && <span>Expected: {new Date(order.expectedDelivery).toLocaleDateString()}</span>}
                {order.actualDelivery && <span>Delivered: {new Date(order.actualDelivery).toLocaleDateString()}</span>}
              </div>

              {/* Line items */}
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-secondary/40">
                      <th className="py-2 px-3 text-left font-semibold">Costume</th>
                      <th className="py-2 px-3 text-center font-semibold">Size</th>
                      <th className="py-2 px-3 text-center font-semibold">Qty</th>
                      <th className="py-2 px-3 text-right font-semibold">Unit</th>
                      <th className="py-2 px-3 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => {
                      const costume = costumes.find((c) => c.id === item.costumeId);
                      return (
                        <tr key={item.id} className="border-t border-border/40">
                          <td className="py-2 px-3 font-medium">{costume?.name ?? "Unknown"}</td>
                          <td className="py-2 px-3 text-center">{item.size}</td>
                          <td className="py-2 px-3 text-center">{item.quantity}</td>
                          <td className="py-2 px-3 text-right text-muted-foreground">{formatCurrency(item.unitCostCents)}</td>
                          <td className="py-2 px-3 text-right font-medium">{formatCurrency(item.quantity * item.unitCostCents)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {order.vendorNotes && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-secondary/30 p-3 text-xs">
                  <FileText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{order.vendorNotes}</span>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

/* ── Alterations Tab ────────────────────────────────────────────────────── */

function AlterationsTab({ alterations, students, costumes }: {
  alterations: Alteration[];
  students: ReturnType<typeof useStudents>["students"];
  costumes: Costume[];
}) {
  const overdue = alterations.filter(
    (a) => a.dueDate && new Date(a.dueDate) < new Date() && a.status !== "complete" && a.status !== "delivered",
  );
  return (
    <div className="space-y-6">
      {overdue.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose/30 bg-rose/5 p-4">
          <AlertTriangle className="h-5 w-5 text-rose shrink-0" />
          <p className="text-sm font-semibold text-rose">
            {overdue.length} alteration{overdue.length !== 1 ? "s" : ""} overdue — action required
          </p>
        </div>
      )}

      {alterations.length === 0 ? (
        <div className="rounded-2xl border border-border/70 bg-card p-12 text-center">
          <Scissors className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-semibold">No alterations yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add alteration tasks as costumes arrive.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {alterations.map((a) => {
            const student = students.find((s) => s.id === a.studentId);
            const costume = costumes.find((c) => c.id === a.costumeId);
            const isOverdue = a.dueDate && new Date(a.dueDate) < new Date() && a.status !== "complete" && a.status !== "delivered";
            return (
              <div key={a.id} className={cn(
                "rounded-2xl border p-5 shadow-soft transition",
                isOverdue ? "border-rose/30 bg-rose/5" : "border-border/70 bg-card",
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      a.status === "complete" || a.status === "delivered" ? "bg-teal" :
                      a.status === "in_progress" ? "bg-gold" : "bg-secondary",
                    )} />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {ALTERATION_STATUS_LABELS[a.status]}
                    </span>
                  </div>
                  {a.assignedTo && (
                    <span className="text-xs text-muted-foreground">{a.assignedTo}</span>
                  )}
                </div>
                <p className="text-sm font-semibold">{student?.name ?? "Unknown Student"}</p>
                <p className="text-sm text-muted-foreground">{costume?.name ?? "Unknown Costume"} — {a.alterationType}</p>
                {a.dueDate && (
                  <p className={cn("text-xs mt-1", isOverdue ? "text-rose font-semibold" : "text-muted-foreground")}>
                    Due: {new Date(a.dueDate).toLocaleDateString()}
                  </p>
                )}
                {a.notes && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{a.notes}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Distribution Tab ───────────────────────────────────────────────────── */

function DistributionTab({ distributions, students, costumes }: {
  distributions: ReturnType<typeof useCostumes>["distributions"];
  students: ReturnType<typeof useStudents>["students"];
  costumes: Costume[];
}) {
  return (
    <div className="space-y-6">
      {distributions.length === 0 ? (
        <div className="rounded-2xl border border-border/70 bg-card p-12 text-center">
          <ClipboardCheck className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-semibold">No distributions recorded yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Distributions appear here once costumes are handed out to {students.length > 0 ? students[0]?.name?.split(" ")[0] ?? "students" : "students"}.</p>
        </div>
      ) : (
        distributions.map((d) => {
          const student = students.find((s) => s.id === d.studentId);
          const costume = costumes.find((c) => c.id === d.costumeId);
          return (
            <div key={d.id} className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-display text-lg font-semibold">{student?.name ?? "Unknown Student"}</h3>
                  <p className="text-sm text-muted-foreground">{costume?.name ?? "Unknown Costume"}</p>
                </div>
                {d.signedBy && (
                  <div className="rounded-xl bg-teal/10 px-4 py-2 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-teal">Digitally Signed</p>
                    <p className="text-xs font-medium text-teal">{d.signedBy}</p>
                    {d.signedAt && <p className="text-[10px] text-teal/70">{new Date(d.signedAt).toLocaleDateString()}</p>}
                  </div>
                )}
              </div>

              {/* Checklist */}
              <div className="space-y-2">
                {d.itemsChecklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-secondary/30 px-3 py-2">
                    {item.checked ? (
                      <CheckCircle2 className="h-4 w-4 text-teal shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={cn("text-sm", item.checked ? "text-foreground" : "text-muted-foreground line-through")}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {d.missingItems.length > 0 && (
                <div className="mt-3 rounded-lg bg-gold/5 border border-gold/20 p-3">
                  <p className="text-xs font-semibold text-gold">Missing items:</p>
                  <ul className="mt-1 text-xs text-muted-foreground list-disc list-inside">
                    {d.missingItems.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}

              {d.notes && <p className="mt-3 text-xs text-muted-foreground">{d.notes}</p>}
            </div>
          );
        })
      )}
    </div>
  );
}

/* ── Inventory Tab ──────────────────────────────────────────────────────── */

function InventoryTab({ inventory, costumes, rentals, students, search }: {
  inventory: ReusableCostume[];
  costumes: Costume[];
  rentals: CostumeRental[];
  students: ReturnType<typeof useStudents>["students"];
  search: string;
}) {
  const filtered = useMemo(() => {
    if (!search.trim()) return inventory;
    const q = search.toLowerCase();
    return inventory.filter((r) => {
      const costume = costumes.find((c) => c.id === r.costumeId);
      return (
        r.size.toLowerCase().includes(q) ||
        (costume?.name?.toLowerCase().includes(q)) ||
        (r.storageBin?.toLowerCase().includes(q)) ||
        (r.rackNumber?.toLowerCase().includes(q))
      );
    });
  }, [inventory, search, costumes]);

  const activeRentals = rentals.filter((r) => r.status === "active" || r.status === "overdue");

  return (
    <div className="space-y-6">
      {/* Status summary */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatPill label="Available" value={inventory.filter((r) => r.status === "available").length} tone="bg-teal" />
        <StatPill label="Reserved" value={inventory.filter((r) => r.status === "reserved").length} tone="bg-gold" />
        <StatPill label="Damaged" value={inventory.filter((r) => r.status === "damaged").length} tone="bg-rose" />
        <StatPill label="Active Rentals" value={activeRentals.length} tone="bg-plum" />
      </div>

      {/* Inventory grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-border/70 bg-card p-12 text-center">
            <Warehouse className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-semibold">No inventory items found</p>
            <p className="mt-1 text-sm text-muted-foreground">Add reusable costumes to track them across seasons.</p>
          </div>
        ) : (
          filtered.map((r) => {
            const costume = costumes.find((c) => c.id === r.costumeId);
            return (
              <div key={r.id} className={cn(
                "rounded-2xl border p-5 shadow-soft transition",
                r.status === "available" ? "border-border/70 bg-card" :
                r.status === "reserved" ? "border-gold/30 bg-gold/5" :
                r.status === "damaged" ? "border-rose/30 bg-rose/5" :
                "border-border/70 bg-secondary/30",
              )}>
                <div className="flex items-center justify-between mb-3">
                  <span className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                    r.status === "available" ? "bg-teal/10 text-teal" :
                    r.status === "reserved" ? "bg-gold/10 text-gold" :
                    r.status === "damaged" ? "bg-rose/10 text-rose" :
                    "bg-secondary text-muted-foreground",
                  )}>
                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  </span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                    {INVENTORY_CONDITION_LABELS[r.condition]}
                  </span>
                </div>
                <p className="text-sm font-semibold">{costume?.name ?? "Unknown"}</p>
                <p className="text-sm text-muted-foreground">Size: {r.size}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {r.storageBin && <span className="rounded bg-secondary px-2 py-0.5">Bin {r.storageBin}</span>}
                  {r.rackNumber && <span className="rounded bg-secondary px-2 py-0.5">Rack {r.rackNumber}</span>}
                </div>
                {r.lastUsed && (
                  <p className="mt-2 text-xs text-muted-foreground">Last used: {new Date(r.lastUsed).toLocaleDateString()}</p>
                )}
                {r.notes && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{r.notes}</p>}
              </div>
            );
          })
        )}
      </div>

      {/* Active Rentals */}
      {activeRentals.length > 0 && (
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
          <h3 className="font-display text-lg font-semibold mb-4">Active Rentals</h3>
          <div className="space-y-3">
            {activeRentals.map((r) => {
              const student = students.find((s) => s.id === r.studentId);
              const costume = costumes.find((c) => c.id === r.costumeId);
              return (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-border/60 p-3">
                  <div>
                    <p className="text-sm font-semibold">{student?.name ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{costume?.name ?? "Unknown"} · Fee: {formatCurrency(r.rentalFeeCents)}</p>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                      r.status === "overdue" ? "bg-rose/10 text-rose" : "bg-plum/10 text-plum",
                    )}>
                      {RENTAL_STATUS_LABELS[r.status]}
                    </span>
                    {r.returnDate && <p className="text-[10px] text-muted-foreground mt-0.5">Due: {new Date(r.returnDate).toLocaleDateString()}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Quick Change Tab ───────────────────────────────────────────────────── */

function QuickChangeTab({ conflicts, students }: {
  conflicts: QuickChangeConflict[];
  students: ReturnType<typeof useStudents>["students"];
}) {
  const unresolved = conflicts.filter((c) => c.conflictDetected && !c.resolved);
  const resolved = conflicts.filter((c) => c.resolved);

  return (
    <div className="space-y-6">
      {conflicts.length === 0 ? (
        <div className="rounded-2xl border border-border/70 bg-card p-12 text-center">
          <Clock className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-semibold">No quick-change analysis yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Run analysis from the recital planner to detect costume change conflicts.</p>
        </div>
      ) : (
        <>
          {/* Unresolved conflicts */}
          {unresolved.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose" />
                <h3 className="font-display text-lg font-semibold text-rose">
                  {unresolved.length} Unresolved Conflict{unresolved.length !== 1 ? "s" : ""}
                </h3>
              </div>
              {unresolved.map((c) => {
                const student = students.find((s) => s.id === c.studentId);
                return (
                  <div key={c.id} className="rounded-2xl border border-rose/30 bg-rose/5 p-5 shadow-soft">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">{student?.name ?? "Unknown"}</p>
                        <div className="mt-2 flex items-center gap-3 text-xs">
                          <span className="rounded bg-rose/10 px-2 py-1 font-medium text-rose">
                            {c.routineA} (ends {c.routineAEndTime})
                          </span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          <span className="rounded bg-rose/10 px-2 py-1 font-medium text-rose">
                            {c.routineB} (starts {c.routineBStartTime})
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Estimated change time: {c.estimatedChangeMinutes} min — conflict detected
                        </p>
                      </div>
                    </div>
                    {c.recommendation && (
                      <div className="mt-3 rounded-lg bg-secondary/30 p-3 text-xs">
                        <span className="font-semibold">Recommendation: </span>
                        <span className="text-muted-foreground">{c.recommendation}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Resolved */}
          {resolved.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-display text-lg font-semibold text-teal">Resolved</h3>
              {resolved.map((c) => {
                const student = students.find((s) => s.id === c.studentId);
                return (
                  <div key={c.id} className="rounded-2xl border border-teal/30 bg-teal/5 p-4">
                    <p className="text-sm font-semibold">{student?.name ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.routineA} → {c.routineB} · {c.estimatedChangeMinutes} min estimated · No conflict
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Reusable Small Components ──────────────────────────────────────────── */

function SummaryCard({ label, value, icon: Icon, accent }: {
  label: string; value: string | number; icon: typeof Shirt; accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft animate-float-up">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={cn("grid h-9 w-9 place-items-center rounded-xl", `bg-${accent}/10 text-${accent}`)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function DeadlineRow({ icon: Icon, label, date, status, urgent }: {
  icon: typeof CalendarClock; label: string; date: string; status: string; urgent: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-secondary/30 p-3">
      <div className={cn("grid h-9 w-9 place-items-center rounded-lg shrink-0", urgent ? "bg-rose/10 text-rose" : "bg-secondary text-muted-foreground")}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
      <span className={cn("text-xs font-medium shrink-0", urgent ? "text-rose" : "text-muted-foreground")}>{status}</span>
    </div>
  );
}

function InsightItem({ icon: Icon, tone, children }: { icon: typeof Sparkles; tone: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-start gap-2", tone)}>
      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function ActivityItem({ icon: Icon, tone, text, time }: {
  icon: typeof CheckCircle2; tone: string; text: string; time: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("grid h-7 w-7 place-items-center rounded-lg shrink-0", `${tone}/10`)}>
        <Icon className={cn("h-3.5 w-3.5", tone)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">{text}</p>
        <p className="text-xs text-muted-foreground">{new Date(time).toLocaleDateString()}</p>
      </div>
    </div>
  );
}

function StatPill({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-card border border-border/60 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("grid h-7 w-7 place-items-center rounded-full text-xs font-semibold text-white", tone)}>
        {value}
      </span>
    </div>
  );
}

function MeasField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/30 px-2 py-1.5 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold">{value}</p>
    </div>
  );
}
