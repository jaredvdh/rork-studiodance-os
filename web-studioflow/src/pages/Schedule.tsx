import { useEffect, useMemo, useRef } from "react";

import { styleStyles, teacherName, useStudioData, useTeachers, useTerminology } from "@/data/store";
import type { WeekDay } from "@/data/types";
import { cn } from "@/lib/utils";

const DAYS: WeekDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const START_HOUR = 0;
const END_HOUR = 24;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const ROW_H = 64; // px per hour
const GUTTER_W = 56; // px for hour labels
const DEFAULT_SCROLL_HOUR = 7; // scroll to 7am on load

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatHour(hour: number): string {
  if (hour === 0) return "12a";
  if (hour === 12) return "12p";
  return hour > 12 ? `${hour - 12}p` : `${hour}a`;
}

export default function Schedule() {
  const { classes } = useStudioData();
  const { teachers } = useTeachers();
  const term = useTerminology();
  const scrollRef = useRef<HTMLDivElement>(null);

  const byDay = useMemo(() => {
    const map: Record<string, typeof classes> = {};
    DAYS.forEach((d) => (map[d] = classes.filter((c) => c.day === d).sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))));
    return map;
  }, [classes]);

  const totalHeight = HOURS.length * ROW_H;

  // Scroll to default hour on first render
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = DEFAULT_SCROLL_HOUR * ROW_H;
    }
  }, []);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6" style={{ height: "calc(100vh - 6rem)" }}>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Weekly schedule</h2>
          <p className="text-sm text-muted-foreground">All rooms · Monday to Saturday · 24-hour view</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          {term.styleCategories.map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-muted-foreground">
              <span className={cn("h-2.5 w-2.5 rounded-full", styleStyles[s].dot)} /> {s}
            </span>
          ))}
        </div>
      </div>

      {/* Scrollable schedule grid */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-auto rounded-2xl border border-border/70 bg-card shadow-soft"
      >
        <div className="min-w-[860px]" style={{ height: totalHeight }}>
          {/* Sticky day header row */}
          <div
            className="sticky top-0 z-20 grid gap-2 border-b border-border/70 bg-card/95 pb-2 pt-4 backdrop-blur-sm"
            style={{ gridTemplateColumns: `${GUTTER_W}px repeat(${DAYS.length}, 1fr)` }}
          >
            <div />
            {DAYS.map((d) => (
              <div key={d} className="text-center text-sm font-semibold">
                {d}
              </div>
            ))}
          </div>

          {/* Body grid */}
          <div
            className="grid gap-2 px-4"
            style={{ gridTemplateColumns: `${GUTTER_W}px repeat(${DAYS.length}, 1fr)` }}
          >
            {/* Sticky hour gutter */}
            <div className="relative" style={{ height: totalHeight }}>
              {HOURS.map((h, i) => (
                <div
                  key={h}
                  className="absolute -translate-y-2 text-xs text-muted-foreground"
                  style={{ top: i * ROW_H }}
                >
                  {formatHour(h)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAYS.map((d) => (
              <div key={d} className="relative rounded-xl bg-secondary/30" style={{ height: totalHeight }}>
                {/* Hour grid lines */}
                {HOURS.map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-border/50"
                    style={{ top: i * ROW_H }}
                  />
                ))}

                {/* Class blocks */}
                {byDay[d].map((c) => {
                  const startMins = toMinutes(c.startTime);
                  const top = (startMins / 60) * ROW_H;
                  const height = (c.durationMins / 60) * ROW_H - 4;

                  // Skip classes outside visible range (before midnight or after midnight - unlikely)
                  if (top + height < -4 || top > totalHeight + 4) return null;

                  return (
                    <div
                      key={c.id}
                      className={cn(
                        "absolute left-1 right-1 overflow-hidden rounded-lg border-l-2 p-2 text-xs shadow-soft transition hover:z-10 hover:shadow-lift",
                        styleStyles[c.style].chip,
                      )}
                      style={{ top, height, borderLeftColor: "currentColor" }}
                    >
                      <p className="truncate font-semibold leading-tight">{c.name}</p>
                      <p className="truncate opacity-80">
                        {c.startTime} · {c.room}
                      </p>
                      <p className="truncate opacity-70">{teacherName(teachers, c.teacherId)}</p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
