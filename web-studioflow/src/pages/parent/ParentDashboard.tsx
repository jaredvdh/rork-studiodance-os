import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Clock,
  Signature,
  Heart,
  Megaphone,
  Plus,
  Sparkles,
  TrendingUp,
  Music,
} from "lucide-react";

import { styleStyles, useStudio, useStudioData, useTerminology } from "@/data/store";
import { useParent } from "@/data/parentStore";
import { ageFromDob, formatCurrency, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function ParentDashboard() {
  const { studio } = useStudio();
  const term = useTerminology();
  const { classes, announcements, invoices } = useStudioData();
  const { parent, primaryContact, children: myStudents } = useParent();

  const myClassIds = useMemo(
    () => [...new Set(myStudents.flatMap((s) => s.classIds))],
    [myStudents],
  );

  const myClasses = useMemo(
    () => classes.filter((c) => myClassIds.includes(c.id)),
    [classes, myClassIds],
  );

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const upcomingClasses = useMemo(
    () =>
      myClasses
        .sort((a, b) => {
          const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        })
        .slice(0, 4),
    [myClasses],
  );

  const todayClasses = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayDay = dayNames[new Date().getDay()];
    return myClasses.filter((c) => c.day === todayDay);
  }, [myClasses]);

  const outstandingInvoices = useMemo(
    () =>
      invoices.filter(
        (i) =>
          myStudents.some((s) => s.name === i.studentName) &&
          i.status !== "paid",
      ),
    [invoices, myStudents],
  );

  const unsignedWaivers = useMemo(
    () => myStudents.filter((s) => s.waiver !== "signed"),
    [myStudents],
  );

  const needsAttention = [
    ...(unsignedWaivers.length > 0
      ? [{ type: "waiver" as const, count: unsignedWaivers.length, label: "Waiver signatures needed", urgent: true }]
      : []),
    ...(outstandingInvoices.length > 0
      ? [{ type: "payment" as const, count: outstandingInvoices.length, label: "Invoices awaiting payment", urgent: true }]
      : []),
    ...(myStudents.filter((s) => s.attendanceRate < 0.7).length > 0
      ? [{ type: "attendance" as const, count: 1, label: "Low attendance alert", urgent: false }]
      : []),
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="animate-float-up">
          <p className="text-sm text-muted-foreground">
            {today} · Welcome back,
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            {primaryContact.firstName}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {myStudents.length} {term.participant.toLowerCase()}{myStudents.length !== 1 ? "s" : ""} at{" "}
            {studio.name}
          </p>
        </div>
        <Link
          to="/parent/classes"
          className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-amber-900 shadow-soft transition hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" />
          Browse classes
        </Link>
      </div>

      {/* ── Urgent alerts ──────────────────────────────────────────── */}
      {needsAttention.length > 0 && (
        <div className="space-y-3 animate-float-up">
          {unsignedWaivers.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-200 text-amber-700">
                <Signature className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {unsignedWaivers.length} waiver{unsignedWaivers.length !== 1 ? "s" : ""}{" "}
                  need{unsignedWaivers.length === 1 ? "s" : ""} your signature
                </p>
                <p className="text-sm text-muted-foreground">
                  {unsignedWaivers.map((s) => s.name).join(", ")}
                </p>
              </div>
              <Link
                to="/parent/waivers"
                className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:opacity-90"
              >
                Sign now
              </Link>
            </div>
          )}

          {outstandingInvoices.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-rose/20 bg-rose/5 p-5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose/10 text-rose">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-rose">
                  {formatCurrency(
                    outstandingInvoices.reduce((a, i) => a + i.amountCents, 0),
                  )}{" "}
                  outstanding
                </p>
                <p className="text-sm text-muted-foreground">
                  {outstandingInvoices.length} invoice
                  {outstandingInvoices.length !== 1 ? "s" : ""} awaiting payment
                </p>
              </div>
              <Link
                to="/parent/payments"
                className="rounded-full border border-rose/20 bg-white px-4 py-2 text-sm font-semibold text-rose transition hover:bg-rose/5"
              >
                View payments
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Today at a glance ──────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {myStudents.slice(0, 4).map((s, i) => {
          const enrolled = classes.filter((c) => s.classIds.includes(c.id));
          const avgAtt = Math.round(s.attendanceRate * 100);
          const hasLowAttendance = avgAtt < 70;
          return (
            <Link
              key={s.id}
              to="/parent/family"
              className="animate-float-up rounded-2xl border border-amber-200/70 bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-lift group"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700 group-hover:bg-amber-200 transition-colors">
                  <Heart className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {s.waiver !== "signed" && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      Waiver
                    </span>
                  )}
                  {hasLowAttendance && (
                    <span className="rounded-full bg-rose/10 px-2 py-0.5 text-[10px] font-semibold text-rose">
                      {avgAtt}%
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-3 font-display text-base font-semibold">{s.name}</p>
              <p className="text-xs text-muted-foreground">{ageFromDob(s.dob)} yrs</p>
              <div className="mt-2.5 space-y-1">
                {enrolled.slice(0, 2).map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5 text-xs">
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", styleStyles[c.style].dot)} />
                    <span className="truncate text-muted-foreground">{c.name}</span>
                  </div>
                ))}
                {enrolled.length > 2 && (
                  <p className="text-[10px] text-muted-foreground pl-2.5">+{enrolled.length - 2} more</p>
                )}
                {enrolled.length === 0 && (
                  <p className="text-[10px] text-muted-foreground">Not enrolled</p>
                )}
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" />
                <span>{avgAtt}% attendance</span>
              </div>
            </Link>
          );
        })}
        {myStudents.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-4 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/30 p-8 text-center">
            <Heart className="mx-auto h-10 w-10 text-amber-300" />
            <h4 className="mt-3 font-medium">No {term.participantPlural.toLowerCase()} added yet</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your {term.participantPlural.toLowerCase()} to get started.
            </p>
            <Link
              to="/parent/family"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-900"
            >
              <Plus className="h-4 w-4" />
              Add {term.participant.toLowerCase()}
            </Link>
          </div>
        )}
      </div>

      {/* ── Upcoming classes & Studio updates ─────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming classes */}
        <div className="rounded-2xl border border-amber-200/70 bg-white shadow-soft lg:col-span-2">
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">
                {todayClasses.length > 0 ? "Today's classes" : "Upcoming classes"}
              </h3>
              <Link
                to="/parent/schedule"
                className="text-xs font-medium text-amber-700 transition hover:text-amber-900 inline-flex items-center gap-1"
              >
                Full schedule <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
          {upcomingClasses.length === 0 ? (
            <div className="px-6 pb-6">
              <div className="rounded-xl bg-amber-50/60 p-6 text-center">
                <CalendarClock className="mx-auto h-8 w-8 text-amber-300" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No classes scheduled. Browse the catalog to enroll.
                </p>
                <Link
                  to="/parent/classes"
                  className="mt-3 inline-block text-sm font-medium text-amber-700 hover:text-amber-900"
                >
                  Find classes →
                </Link>
              </div>
            </div>
          ) : (
            <div className="px-6 pb-6 space-y-2">
              {upcomingClasses.map((c) => {
                const enrolledStudents = myStudents.filter((s) =>
                  s.classIds.includes(c.id),
                );
                const isToday = c.day === ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
                return (
                  <div
                    key={c.id}
                    className={cn(
                      "flex items-center gap-4 rounded-xl p-4 transition-colors",
                      isToday
                        ? "bg-amber-100/70 border border-amber-200/60"
                        : "bg-amber-50/60 hover:bg-amber-50",
                    )}
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{c.name}</p>
                        {isToday && (
                          <span className="shrink-0 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            Today
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {c.day} {c.startTime} · {c.durationMins}min · {c.room}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">
                        {enrolledStudents.map((s) => s.name.split(" ")[0]).join(", ")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Studio updates */}
        <div className="rounded-2xl border border-amber-200/70 bg-white shadow-soft">
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Studio updates</h3>
              <Link
                to="/parent/announcements"
                className="text-xs font-medium text-amber-700 transition hover:text-amber-900"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="px-6 pb-6 space-y-3">
            {announcements.slice(0, 3).map((a) => {
              const isUrgent = a.scope === "Emergency";
              return (
                <div
                  key={a.id}
                  className={cn(
                    "flex gap-3 rounded-xl p-3",
                    isUrgent ? "bg-rose/5 border border-rose/10" : "bg-amber-50/60",
                  )}
                >
                  <div
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                      isUrgent ? "bg-rose/10 text-rose" : "bg-amber-100 text-amber-700",
                    )}
                  >
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {isUrgent && (
                        <span className="mr-1.5 rounded-full bg-rose/20 px-1.5 py-0.5 text-[10px] font-semibold text-rose">
                          Urgent
                        </span>
                      )}
                      {a.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {relativeTime(a.sentAt)} · {a.scope}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Action cards (contextual) ─────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {unsignedWaivers.length > 0 && (
          <Link
            to="/parent/waivers"
            className="rounded-2xl border border-amber-200/70 bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-lift"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <Signature className="h-5 w-5" />
            </div>
            <h4 className="mt-3 font-display text-base font-semibold">Sign waivers</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {unsignedWaivers.length} waiver{unsignedWaivers.length !== 1 ? "s" : ""} need{unsignedWaivers.length === 1 ? "s" : ""} your attention.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-700">
              Sign now <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        )}
        {outstandingInvoices.length > 0 && (
          <Link
            to="/parent/payments"
            className="rounded-2xl border border-amber-200/70 bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-lift"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose/10 text-rose">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h4 className="mt-3 font-display text-base font-semibold">Pay invoices</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatCurrency(outstandingInvoices.reduce((a, i) => a + i.amountCents, 0))} due across {outstandingInvoices.length} invoice{outstandingInvoices.length !== 1 ? "s" : ""}.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-700">
              Pay now <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        )}
        <Link
          to="/parent/schedule"
          className="rounded-2xl border border-amber-200/70 bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-lift"
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal/10 text-teal">
            <CalendarClock className="h-5 w-5" />
          </div>
          <h4 className="mt-3 font-display text-base font-semibold">Weekly schedule</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            View all {myStudents.length > 0 ? "your children's" : "upcoming"} classes for the week ahead.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-700">
            View schedule <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}
