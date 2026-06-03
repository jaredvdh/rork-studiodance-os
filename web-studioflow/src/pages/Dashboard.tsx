import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarClock,
  CreditCard,
  DollarSign,
  FileSignature,
  Megaphone,
  TrendingUp,
  Users,
} from "lucide-react";

import RevenueChart from "@/components/charts/RevenueChart";
import StatCard from "@/components/StatCard";
import { SetupWizard } from "@/components/SetupWizard";
import { styleStyles, teacherName, useStudio, useStudioData, useTeachers, useTerminology } from "@/data/store";
import { formatCurrency, initials, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const SETUP_COMPLETE_KEY = "studioflow_setup_complete";
function hasCompletedSetup(): boolean {
  return localStorage.getItem(SETUP_COMPLETE_KEY) === "true";
}
function markSetupComplete(): void {
  localStorage.setItem(SETUP_COMPLETE_KEY, "true");
}

export default function Dashboard() {
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    if (!hasCompletedSetup()) {
      setShowSetup(true);
    }
  }, []);

  if (showSetup) {
    return <SetupWizard onComplete={() => { markSetupComplete(); setShowSetup(false); }} />;
  }
  const { studio } = useStudio();
  const term = useTerminology();
  const { classes, students, announcements, invoices, revenueSeries } = useStudioData();
  const { teachers } = useTeachers();

  const activeStudents = students.length;
  const totalCapacity = classes.reduce((a, c) => a + c.capacity, 0);
  const totalEnrolled = classes.reduce((a, c) => a + c.enrolled, 0);
  const capacityPct = Math.round((totalEnrolled / totalCapacity) * 100);
  const avgAttendance = Math.round((students.reduce((a, s) => a + s.attendanceRate, 0) / students.length) * 100);
  const waiverDone = Math.round((students.filter((s) => s.waiver === "signed").length / students.length) * 100);
  const monthRevenue = revenueSeries[revenueSeries.length - 1].revenueCents;
  const outstanding = invoices.reduce((a, i) => a + i.amountCents, 0);
  const recitalClasses = classes.filter((c) => c.inRecital);

  const topClasses = [...classes].sort((a, b) => b.enrolled / b.capacity - a.enrolled / a.capacity).slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Good afternoon, Studio Director</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">{studio.name}</h2>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-rose px-4 py-2.5 text-sm font-semibold text-rose-foreground shadow-soft transition hover:opacity-90">
          <Megaphone className="h-4 w-4" /> New announcement
        </button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} label={`Active ${term.participantPlural.toLowerCase()}`} value={String(activeStudents)} delta={6} hint="vs. last month" icon={Users} accent="rose" />
        <StatCard index={1} label="Revenue this month" value={formatCurrency(monthRevenue, true)} delta={12} hint="May billing" icon={DollarSign} accent="gold" />
        <StatCard index={2} label="Class capacity" value={`${capacityPct}%`} delta={4} hint={`${totalEnrolled}/${totalCapacity} seats`} icon={TrendingUp} accent="teal" />
        <StatCard index={3} label="Avg. attendance" value={`${avgAttendance}%`} delta={-2} hint="last 30 days" icon={CalendarClock} accent="plum" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Revenue overview</h3>
              <p className="text-sm text-muted-foreground">Last 6 months · Stripe Connect</p>
            </div>
            <span className="rounded-full bg-success/10 px-3 py-1 text-sm font-semibold text-success">+45% YoY</span>
          </div>
          <div className="mt-4">
            <RevenueChart data={revenueSeries} />
          </div>
        </div>

        {/* Completion rings */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
            <h3 className="font-display text-lg font-semibold">Studio health</h3>
            <div className="mt-4 space-y-4">
              <Progress label="Waivers completed" value={waiverDone} icon={FileSignature} tone="bg-teal" />
              <Progress label="Capacity filled" value={capacityPct} icon={TrendingUp} tone="bg-rose" />
              <Progress label="Tuition collected" value={88} icon={CreditCard} tone="bg-gold" />
            </div>
          </div>
          <div className="rounded-2xl border border-rose/30 bg-rose/5 p-5">
            <div className="flex items-center gap-2 text-rose">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-semibold">{formatCurrency(outstanding)} outstanding</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {invoices.length} invoices awaiting payment. {invoices.filter((i) => i.status === "overdue").length} overdue.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top classes */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Fullest classes</h3>
            <span className="text-sm text-muted-foreground">{classes.length} active</span>
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

        {/* Announcements */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Recent activity</h3>
          </div>
          <div className="mt-4 space-y-4">
            {announcements.slice(0, 4).map((a) => (
              <div key={a.id} className="flex gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-foreground/70">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.audience} · {relativeTime(a.sentAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recital alert strip */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/70 bg-gradient-to-r from-plum/10 to-rose/10 p-6">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-plum/15 text-plum">
          <CalendarClock className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold">Spring Recital is 23 days away</p>
          <p className="text-sm text-muted-foreground">
            {recitalClasses.length} classes performing · {recitalClasses.reduce((a, c) => a + c.enrolled, 0)} {term.participantPlural.toLowerCase()} · running order not yet finalized
          </p>
        </div>
        <Link to="/recitals" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-secondary">
          Open recital tools
        </Link>
      </div>

      <p className="pb-2 text-center text-xs text-muted-foreground">
        Showing demo data for {initials(studio.name)} · {studio.name}
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
