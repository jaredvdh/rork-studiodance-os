import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, MapPin, Search, Sparkles, Users } from "lucide-react";

import { classById, styleStyles, teacherName, useStudioData, useTeachers } from "@/data/store";
import type { AgeGroup, WeekDay } from "@/data/types";
import { formatCurrency } from "@/lib/format";
import { classPriceDisplay } from "@/lib/classPricing";
import { cn } from "@/lib/utils";

const days: WeekDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const styles: string[] = [
  "Ballet",
  "Jazz",
  "Hip Hop",
  "Contemporary",
  "Tap",
  "Lyrical",
  "Acro",
  "Vinyasa",
  "Hatha",
  "CrossFit",
  "Strength",
  "Conditioning",
];
const ageGroups: AgeGroup[] = [
  "Tiny Tots",
  "Junior",
  "Intermediate",
  "Senior",
  "Adult",
];

export default function ParentClasses() {
  const { classes } = useStudioData();
  const { teachers } = useTeachers();
  const [search, setSearch] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedAge, setSelectedAge] = useState<AgeGroup | null>(null);
  const [selectedDay, setSelectedDay] = useState<WeekDay | null>(null);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(
    new Set(["c1", "c6"]),
  );

  const filtered = useMemo(() => {
    let result = classes;
    if (search)
      result = result.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      );
    if (selectedStyle) result = result.filter((c) => c.style === selectedStyle);
    if (selectedAge) result = result.filter((c) => c.ageGroup === selectedAge);
    if (selectedDay) result = result.filter((c) => c.day === selectedDay);
    return result;
  }, [classes, search, selectedStyle, selectedAge, selectedDay]);

  const toggleEnroll = (id: string) => {
    setEnrolledIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="animate-float-up">
          <p className="text-sm text-muted-foreground">Class catalog</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Find the perfect class
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} class{filtered.length !== 1 ? "es" : ""} available
          </p>
        </div>
        <Link
          to="/parent/schedule"
          className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-soft transition hover:bg-amber-50"
        >
          <Clock className="h-4 w-4" />
          View schedule
        </Link>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            placeholder="Search by class name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Style chips */}
          {styles.map((s) => (
            <button
              key={s}
              onClick={() =>
                setSelectedStyle(selectedStyle === s ? null : s)
              }
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                selectedStyle === s
                  ? styleStyles[s].chip
                  : "border border-amber-200 bg-white text-muted-foreground hover:bg-amber-50",
              )}
            >
              {s}
            </button>
          ))}
          <span className="w-px bg-amber-200 mx-1" />
          {/* Age chips */}
          {ageGroups.map((a) => (
            <button
              key={a}
              onClick={() => setSelectedAge(selectedAge === a ? null : a)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                selectedAge === a
                  ? "bg-amber-400 text-amber-900"
                  : "border border-amber-200 bg-white text-muted-foreground hover:bg-amber-50",
              )}
            >
              {a}
            </button>
          ))}
          <span className="w-px bg-amber-200 mx-1" />
          {/* Day chips */}
          {days.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(selectedDay === d ? null : d)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                selectedDay === d
                  ? "bg-amber-400 text-amber-900"
                  : "border border-amber-200 bg-white text-muted-foreground hover:bg-amber-50",
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Class grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c, i) => {
          const isEnrolled = enrolledIds.has(c.id);
          const isFull = c.enrolled >= c.capacity;
          const teacher = teacherName(teachers, c.teacherId);
          const canEnroll = !isFull && !isEnrolled;

          return (
            <div
              key={c.id}
              className="animate-float-up rounded-2xl border border-amber-200/70 bg-white p-5 shadow-soft transition hover:shadow-lift"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    styleStyles[c.style].chip,
                  )}
                >
                  {c.style}
                </span>
                {isEnrolled ? (
                  <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                    Enrolled
                  </span>
                ) : isFull ? (
                  <span className="rounded-full bg-rose/10 px-2.5 py-0.5 text-xs font-semibold text-rose">
                    Full
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    {c.capacity - c.enrolled} spots
                  </span>
                )}
              </div>

              <h3 className="mt-3 font-display text-lg font-semibold">
                {c.name}
              </h3>
              <p className="text-sm text-muted-foreground">{c.ageGroup}</p>

              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>
                    {c.day} {c.startTime} · {c.durationMins}min
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>
                    {c.room} · {teacher}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>
                    {c.enrolled}/{c.capacity} enrolled
                    {c.waitlist > 0 && (
                      <span className="text-amber-600">
                        {" "}
                        · {c.waitlist} waitlisted
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                {(() => {
                  const d = classPriceDisplay(c, formatCurrency);
                  if (!d.show) return <span className="text-sm text-muted-foreground">No set price</span>;
                  if (d.text) return <span className="text-sm font-semibold text-teal">{d.text}</span>;
                  return (
                    <span className="font-display text-xl font-semibold">
                      {d.amount}
                      {d.suffix && <span className="text-xs font-normal text-muted-foreground">{d.suffix}</span>}
                    </span>
                  );
                })()}
                <button
                  onClick={() => toggleEnroll(c.id)}
                  disabled={isFull && !isEnrolled}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                    isEnrolled
                      ? "bg-success/10 text-success border border-success/30 hover:bg-success/20"
                      : canEnroll
                        ? "bg-amber-400 text-amber-900 hover:opacity-90"
                        : "bg-secondary text-muted-foreground cursor-not-allowed",
                  )}
                >
                  {isEnrolled
                    ? "Drop class"
                    : isFull
                      ? "Join waitlist"
                      : "Enroll"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-500">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold">
            No classes match
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your filters to see more options.
          </p>
        </div>
      )}
    </div>
  );
}
