import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  CalendarClock,
  CreditCard,
  DollarSign,
  Megaphone,
  Ruler,
  Signature,
  TrendingUp,
  Users,
} from "lucide-react";

import RevenueChart from "@/components/charts/RevenueChart";
import StatCard from "@/components/StatCard";
import { SetupWizard } from "@/components/SetupWizard";
import { styleStyles, teacherName, useCostumes, useEnrichedClasses, useStudio, useStudents, useTeachers, useTerminology, useInvoices, useWaivers } from "@/data/store";
import type { WeekDay } from "@/data/types";
import { formatCurrency, initials, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Check if a module key is enabled for the current vertical. */
function hasModule(enabled: import("@/data/terminology").ModuleKey[], key: import("@/data/terminology").ModuleKey): boolean {
  return enabled.includes(key);
}

const SETUP_COMPLETE_KEY = "studioflow_setup_complete";
function hasCompletedSetup(): boolean {
  return localStorage.getItem(SETUP_COMPLETE_KEY) === "true";
}
function markSetupComplete(): void {
  localStorage.setItem(SETUP_COMPLETE_KEY, "true");
}

const TODAY_DAY: Record<number, WeekDay> = {
  0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat",
};

export default function Dashboard() {
  const [showSetup, setShowSetup] = useState(false);

  const { studio } = useStudio();
  const term = useTerminology();
  const showCostumes = hasModule(term.enabledModules, "costumes");
  const showRecitals = hasModule(term.enabledModules, "recitals");
  const showPerformance = showCostumes || showRecitals;
  const classes = useEnrichedClasses();
  const { students } = useStudents();
  const { teachers } = useTeachers();
  const { invoices } = useInvoices();
  const { templates: waiverTemplates, signatures: waiverSignatures, hasOutstandingWaivers } = useWaivers();
  const { studentsMissingMeasurements, studentsWithStaleMeasurements, measurements } = useCostumes();

  useEffect(() => {
    if (!hasCompletedSetup()) {
      setShowSetup(true);
    }
  }, []);

  if (showSetup) {
    return <SetupWizard onComplete={() => { markSetupComplete(); setShowSetup(false); }} />;
  }

  // ── Computed metrics ──────────────────────────────────────────────
  const activeStudents = students.length;

  // Measurement staleness computed metrics
  const allStudentIds = useMemo(() => students.map((s) => s.id), [students]);
  const missingMeasIds = useMemo(() => studentsMissingMeasurements(allStudentIds), [studentsMissingMeasurements, allStudentIds]);
  const staleMeasIds = useMemo(() => studentsWithStaleMeasurements(allStudentIds), [studentsWithStaleMeasurements, allStudentIds]);
  const missingOrStaleCount = missingMeasIds.length + staleMeasIds.length;
  const staleStudentNames = useMemo(() =>
    staleMeasIds.map((id) => students.find((s) => s.id === id)?.name).filter(Boolean) as string[],
  [staleMeasIds, students]);
  const totalCapacity = classes.reduce((a, c) => a + c.capacity, 0);
  const totalEnrolled = classes.reduce((a, c) => a + c.enrolled, 0);
  const capacityPct = Math.round((totalEnrolled / totalCapacity) * 100);
  const avgAttendance = Math.round((students.reduce((a, s) => a + s.attendanceRate, 0) / students.length) * 100);
  const waiverDone = Math.round((students.filter((s) => s.waiver === "signed").length / students.length) * 100);

  // Waiver compliance from the waiver system (source of truth)
  const publishedRequired = waiverTemplates.filter((t) => t.status === "published" && t.required);
  const studentsWithMissingWaivers = students.filter((s) =>
    publishedRequired.some((t) =>
      !waiverSignatures.some((sig) => sig.waiverTemplateId === t.id && sig.studentId === s.id && sig.status === "signed")
    )
  ).length;
  const wCompliancePct = students.length > 0 ? Math.round(((students.length - studentsWithMissingWaivers) / students.length) * 100) : 100;

  // Revenue — estimate from enrolment × price
  const monthRevenue = classes.reduce((a, c) => a + c.enrolled * c.priceCents, 0);

  const unpaidInvoices = invoices.filter((i) => i.status !== "paid" && i.status !== "refunded");
  const overdueInvoices = invoices.filter((i) => i.status === "overdue");
  const outstanding = unpaidInvoices.reduce((a, i) => a + i.amountCents, 0);

  const today = new Date();
  const todayDay = TODAY_DAY[today.getDay()];
  const todayClasses = useMemo(
    () => classes.filter((c) => c.day === todayDay).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [classes, todayDay],
  );

  const expiringWaivers = students.filter((s) => s.waiver === "pending").length;
  const recitalClasses = classes.filter((c) => c.inRecital);

  // Top classes by fill rate
  const topClasses = [...classes].sort((a, b) => b.enrolled / b.capacity - a.enrolled / a.capacity).slice(0, 5);

  // Recent registrations (simulated — last 5 students by ID)
  const recentStudents = [...students].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Good afternoon, Studio Director</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">{studio.name}</h2>
        </div>
        <Link to="/announcements" className="inline-flex items-center gap-2 rounded-full bg-rose px-4 py-2.5 text-sm font-semibold text-rose-foreground shadow-soft transition hover:opacity-90">
          <Megaphone className="h-4 w-4" /> New announcement
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} label={`Active ${term.participantPlural.toLowerCase()}`} value={String(activeStudents)} delta={6} hint="vs. last month" icon={Users} accent="rose" />
        <StatCard index={1} label="Revenue this month" value={formatCurrency(monthRevenue, true)} delta={12} hint="from enrolments" icon={DollarSign} accent="gold" />
        <StatCard index={2} label="Capacity filled" value={`${capacityPct}%`} delta={4} hint={`${totalEnrolled}/${totalCapacity} seats`} icon={TrendingUp} accent="teal" />
        {showPerformance && (
          <StatCard index={3} label="Missing / Stale Measurements" value={String(missingOrStaleCount)} delta={missingOrStaleCount > 0 ? -3 : 0} hint={`of ${students.length} ${term.participantPlural.toLowerCase()}`} icon={Ruler} accent="plum" />
        )}
        {!showPerformance && (
          <StatCard index={3} label="Attendance rate" value={`${avgAttendance}%`} delta={2} hint={`of ${students.length} ${term.participantPlural.toLowerCase()}`} icon={TrendingUp} accent="plum" />
        )}
      </div>

      {/* ── Waiver compliance & alerts ───────────────────────────── */}
      {studentsWithMissingWaivers > 0 && (
        <Link
          to="/waivers"
          className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-soft animate-float-up hover:bg-amber-100/50 transition"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Waiver compliance alert</p>
            <p className="text-sm text-muted-foreground">
              {studentsWithMissingWaivers} {term.participant.toLowerCase()}{studentsWithMissingWaivers !== 1 ? "s" : ""} {studentsWithMissingWaivers !== 1 ? "have" : "has"} missing required waivers — {wCompliancePct}% compliance
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </Link>
      )}

      {/* ── Stale / missing measurement alert ──────────────────────── */}
      {showPerformance && (missingMeasIds.length > 0 || staleMeasIds.length > 0) && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-rose/30 bg-rose/5 p-4 shadow-soft animate-float-up">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose/10 text-rose">
              <Ruler className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Measurement alert</p>
              <p className="text-sm text-muted-foreground">
                {missingMeasIds.length > 0 && `${missingMeasIds.length} without measurements`}
                {missingMeasIds.length > 0 && staleMeasIds.length > 0 && " · "}
                {staleMeasIds.length > 0 && `${staleMeasIds.length} needing updated measurements (over 12 months old)`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/costumes"
              className="rounded-full border border-rose/30 bg-white px-4 py-2 text-sm font-semibold text-rose transition hover:bg-rose/10"
            >
              View <ArrowUpRight className="inline-block ml-1 h-3.5 w-3.5" />
            </Link>
            <button className="rounded-full bg-rose px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose/90">
              <Bell className="inline-block mr-1 h-3.5 w-3.5" />
              Remind All
            </button>
          </div>
        </div>
      )}

      {/* ── Today's classes — operational command centre ───────────── */}
      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-semibold">Today's {term.classPlural.toLowerCase()}</h3>
            <p className="text-sm text-muted-foreground">{todayDay} · {todayClasses.length} classes scheduled</p>
          </div>
          <Link to="/schedule" className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose transition hover:opacity-80">
            Full schedule <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {todayClasses.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No classes scheduled today.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {todayClasses.map((c) => {
              const pct = Math.round((c.enrolled / c.capacity) * 100);
              const full = c.enrolled >= c.capacity;
              return (
                <Link
                  key={c.id}
                  to="/classes"
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/30 p-4 transition hover:bg-secondary/60"
                >
                  <span className={cn("mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full", styleStyles[c.style].dot)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.startTime} ({c.durationMins}m) · {teacherName(teachers, c.teacherId)} · {c.room}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs font-medium tabular-nums">{c.enrolled}/{c.capacity}</span>
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
                        <div className={cn("h-full rounded-full", full ? "bg-rose" : "bg-teal")} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      {full && <span className="text-[10px] font-semibold text-rose">Full</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Revenue overview</h3>
              <p className="text-sm text-muted-foreground">Based on active enrolments · Stripe Connect</p>
            </div>
            <Link to="/payments" className="rounded-full bg-rose/10 px-3 py-1 text-sm font-semibold text-rose transition hover:bg-rose/20">
              View payments
            </Link>
          </div>
          <div className="mt-4">
            <RevenueChart data={[
              { month: "Jan", revenueCents: Math.round(monthRevenue * 0.76), enrollments: Math.round(totalEnrolled * 0.82) },
              { month: "Feb", revenueCents: Math.round(monthRevenue * 0.82), enrollments: Math.round(totalEnrolled * 0.87) },
              { month: "Mar", revenueCents: Math.round(monthRevenue * 0.88), enrollments: Math.round(totalEnrolled * 0.91) },
              { month: "Apr", revenueCents: Math.round(monthRevenue * 0.93), enrollments: Math.round(totalEnrolled * 0.95) },
              { month: "May", revenueCents: Math.round(monthRevenue * 0.97), enrollments: Math.round(totalEnrolled * 0.98) },
              { month: "Jun", revenueCents: monthRevenue, enrollments: totalEnrolled },
            ]} />
          </div>
        </div>

        {/* Completion rings + alerts */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
            <h3 className="font-display text-lg font-semibold">Studio health</h3>
            <div className="mt-4 space-y-4">
              <Progress label="Waivers completed" value={waiverDone} icon={Signature} tone="bg-teal" />
              <Progress label="Capacity filled" value={capacityPct} icon={TrendingUp} tone="bg-rose" />
              <Progress label="Tuition collected" value={unpaidInvoices.length === 0 ? 100 : Math.round(((invoices.filter((i) => i.status === "paid").length) / Math.max(invoices.length, 1)) * 100)} icon={CreditCard} tone="bg-gold" />
            </div>
          </div>

          {/* Alerts */}
          <div className="space-y-3">
            {outstanding > 0 && (
              <Link to="/payments" className="flex items-center gap-3 rounded-2xl border border-rose/30 bg-rose/5 p-4 transition hover:bg-rose/10">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose/10 text-rose">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-rose">{formatCurrency(outstanding)} outstanding</p>
                  <p className="text-xs text-muted-foreground">
                    {unpaidInvoices.length} invoices · {overdueInvoices.length} overdue
                  </p>
                </div>
                <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-rose/50" />
              </Link>
            )}
            {expiringWaivers > 0 && (
              <Link to="/students?filter=waiver" className="flex items-center gap-3 rounded-2xl border border-gold/30 bg-gold/5 p-4 transition hover:bg-gold/10">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold/10 text-gold">
                  <Signature className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gold">{expiringWaivers} waivers pending</p>
                  <p className="text-xs text-muted-foreground">Needs parent signature</p>
                </div>
                <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-gold/50" />
              </Link>
            )}
            {classes.filter((c) => c.waitlist > 0).length > 0 && (
              <Link to="/classes" className="flex items-center gap-3 rounded-2xl border border-plum/30 bg-plum/5 p-4 transition hover:bg-plum/10">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-plum/10 text-plum">
                  <Users className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-plum">
                    {classes.filter((c) => c.waitlist > 0).length} classes with waitlists
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {classes.reduce((a, c) => a + c.waitlist, 0)} {term.participantPlural.toLowerCase()} waiting
                  </p>
                </div>
                <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-plum/50" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top classes */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Fullest {term.classPlural.toLowerCase()}</h3>
            <Link to="/classes" className="text-sm text-muted-foreground transition hover:text-foreground">{classes.length} active</Link>
          </div>
          <div className="mt-4 space-y-3">
            {topClasses.map((c) => {
              const pct = Math.round((c.enrolled / c.capacity) * 100);
              return (
                <div key={c.id} className="flex items-center gap-4">
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", styleStyles[c.style].dot)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="text-sm font-semibold tabular-nums">{c.enrolled}/{c.capacity}</p>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className={cn("h-full rounded-full", styleStyles[c.style].dot)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="hidden w-20 truncate text-right text-xs text-muted-foreground sm:block">
                    {teacherName(teachers, c.teacherId)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent registrations + announcements */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Recent activity</h3>
          </div>
          <div className="mt-4 space-y-4">
            {recentStudents.slice(0, 3).map((s) => (
              <Link key={s.id} to="/students" className="flex gap-3 transition hover:opacity-80">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose/10 text-rose text-xs font-semibold">
                  {initials(s.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.name} enrolled</p>
                  <p className="text-xs text-muted-foreground">{s.classIds.length} class{s.classIds.length !== 1 ? "es" : ""} · {s.caregiverName}</p>
                </div>
              </Link>
            ))}
            <Link to="/announcements" className="flex gap-3 transition hover:opacity-80">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-foreground/70">
                <Megaphone className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">View all announcements</p>
                <p className="text-xs text-muted-foreground">Studio updates & alerts</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recital / event alert strip — only for performance verticals */}
      {showPerformance && (
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/70 bg-gradient-to-r from-plum/10 to-rose/10 p-6">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-plum/15 text-plum">
          <CalendarClock className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold">{term.event} season active</p>
          <p className="text-sm text-muted-foreground">
            {recitalClasses.length} classes performing · {recitalClasses.reduce((a, c) => a + c.enrolled, 0)} {term.participantPlural.toLowerCase()} · running order not yet finalised
          </p>
        </div>
        <Link to="/recitals" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-secondary">
          Manage {term.eventPlural.toLowerCase()}
        </Link>
      </div>
      )}
      <p className="pb-2 text-center text-xs text-muted-foreground">
        Showing data for {initials(studio.name)} · {studio.name}
      </p>
    </div>
  );
}

function Progress({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Users; tone: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-foreground/80">
          <Icon className="h-4 w-4 text-muted-foreground" /> {label}
        </span>
        <span className="font-semibold tabular-nums">{value}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
