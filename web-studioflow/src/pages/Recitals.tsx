import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  FileDown,
  GripVertical,
  ImageIcon,
  MapPin,
  Music,
  Plus,
  Printer,
  Search,
  Shirt,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";

import Modal from "@/components/Modal";
import { recitalEvents } from "@/data/demo";
import { classById, styleStyles, teacherName, useStudio, useStudioData, useTeachers, useCostumes, useTerminology } from "@/data/store";
import type { AgeGroup, Class, Costume, CostumeAssignment, RecitalEvent, RecitalPerformance, Studio, Teacher } from "@/data/types";
import type { VerticalTerminology } from "@/data/terminology";
import { cn } from "@/lib/utils";

const AGES: AgeGroup[] = ["Tiny Tots", "Junior", "Intermediate", "Senior", "Adult"];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function extractTimeFromISO(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function applyTimeToISO(iso: string, hhmm: string): string {
  const d = new Date(iso);
  const [h, m] = hhmm.split(":").map(Number);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d.toISOString();
}

function formatStartTime(hhmm: string | undefined): string {
  if (!hhmm) return "—";
  const [h, m] = hhmm.split(":").map(Number);
  const hour = (h ?? 0) % 12 || 12;
  const ampm = (h ?? 0) >= 12 ? "PM" : "AM";
  return `${hour}:${String(m ?? 0).padStart(2, "0")} ${ampm}`;
}

function exportProgrammeToWord(
  studio: Studio,
  event: RecitalEvent,
  teachers: Teacher[],
  term: ReturnType<typeof useTerminology>,
) {
  const perfClasses = (perf: RecitalPerformance) =>
    perf.classIds.map((id) => classById(id)).filter(Boolean) as Class[];

  const totalDancers = event.performances.reduce(
    (a, p) => a + perfClasses(p).reduce((s, c) => s + c.enrolled, 0),
    0,
  );

  const eventDate = new Date(event.date);
  const dateStr = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = eventDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const actRows = event.performances
    .map((perf) => {
      const classes = perfClasses(perf);
      const actStart = perf.startTime ? formatStartTime(perf.startTime) : "";
      const classRows = classes
        .map(
          (c) => `
        <tr>
          <td style="padding:6pt 8pt;border-bottom:1pt solid #ece5e0;">
            <span style="display:inline-block;width:8pt;height:8pt;border-radius:50%;background:${styleColor(c.style)};vertical-align:middle;margin-right:4pt;"></span>
            ${c.name}
          </td>
          <td style="padding:6pt 8pt;border-bottom:1pt solid #ece5e0;color:#4a3f4a;">${teacherName(teachers, c.teacherId)}</td>
          <td style="padding:6pt 8pt;border-bottom:1pt solid #ece5e0;color:#6b5e68;">${c.style}</td>
          <td style="padding:6pt 8pt;border-bottom:1pt solid #ece5e0;color:#6b5e68;">${c.ageGroup}</td>
        </tr>`,
        )
        .join("");

      return `
      <div style="margin-bottom:18pt;">
        <div style="border-bottom:1pt solid #e0d5d0;padding-bottom:6pt;margin-bottom:8pt;">
          <p style="margin:0;font-family:Georgia,serif;font-size:14pt;font-weight:600;">
            ${perf.name}
            ${actStart ? `<span style="font-size:10pt;color:#6b5e68;font-weight:400;margin-left:8pt;">${actStart}</span>` : ""}
          </p>
          <p style="margin:4pt 0 0;font-size:9pt;color:#b5a39c;">
            ${classes.length} class${classes.length !== 1 ? "es" : ""} · ${classes.reduce((a, c) => a + c.enrolled, 0)} ${term.participantPlural.toLowerCase()}
            ${perf.costumeNote ? ` · Costume: ${perf.costumeNote}` : ""}
          </p>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:10pt;">
          <thead>
            <tr style="text-align:left;font-size:9pt;font-weight:600;text-transform:uppercase;color:#b5a39c;letter-spacing:0.5pt;">
              <th style="padding:6pt 8pt;">Class</th>
              <th style="padding:6pt 8pt;">Teacher</th>
              <th style="padding:6pt 8pt;">Style</th>
              <th style="padding:6pt 8pt;">Age Group</th>
            </tr>
          </thead>
          <tbody>${classRows}</tbody>
        </table>
      </div>`;
    })
    .join("");

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${event.name} — ${studio.name}</title>
      <style>
        @page { margin:0.75in; size:letter; }
        body { font-family:Georgia,'Times New Roman',serif; color:#1a1423; }
      </style>
    </head>
    <body>
      <div style="text-align:center;border-bottom:2pt solid #d4c5c0;padding-bottom:14pt;margin-bottom:24pt;">
        <h1 style="font-family:Georgia,serif;font-size:24pt;font-weight:600;margin:0;letter-spacing:-0.5pt;">${studio.name}</h1>
        <p style="margin:4pt 0 0;font-family:Georgia,serif;font-size:11pt;font-style:italic;color:#6b5e68;">${studio.tagline}</p>
      </div>

      <h2 style="text-align:center;font-family:Georgia,serif;font-size:20pt;font-weight:600;margin:0 0 2pt;letter-spacing:-0.3pt;">${event.name}</h2>
      <p style="text-align:center;font-size:11pt;color:#6b5e68;margin:0 0 18pt;">
        ${dateStr} · ${timeStr} · ${event.venue}
      </p>

      <div style="text-align:center;margin-bottom:18pt;">
        <span style="display:inline-block;width:40%;height:1pt;background:#e0d5d0;vertical-align:middle;"></span>
        <span style="display:inline-block;margin:0 12pt;font-size:8pt;font-weight:600;text-transform:uppercase;letter-spacing:2pt;color:#b5a39c;vertical-align:middle;">Programme</span>
        <span style="display:inline-block;width:40%;height:1pt;background:#e0d5d0;vertical-align:middle;"></span>
      </div>

      ${actRows}

      <div style="text-align:center;border-top:1pt solid #d4c5c0;padding-top:8pt;margin-top:18pt;">
        <p style="font-size:9pt;color:#b5a39c;margin:0;">
          ${totalDancers} ${term.participantPlural.toLowerCase()} · ${event.performances.length} acts · ${studio.name} · ${studio.city}
        </p>
      </div>
    </body>
    </html>`;

  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${studio.name} — ${event.name}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function styleColor(style: ClassStyle): string {
  const map: Record<string, string> = {
    Ballet: "#d94a6e",
    Jazz: "#c99d3e",
    "Hip Hop": "#77568c",
    Tap: "#1a1423",
    Contemporary: "#4a9e8a",
    Lyrical: "#d94a6e",
    Acro: "#e07b5a",
  };
  return map[style] ?? "#6b5e68";
}

export default function Recitals() {
  const { studio } = useStudio();
  const term = useTerminology();
  const { classes: initial, students } = useStudioData();
  const { teachers } = useTeachers();
  const ctx = useCostumes();
  const [classes, setClasses] = useState<Class[]>(initial);
  const [events, setEvents] = useState(recitalEvents);
  const [search, setSearch] = useState<string>("");
  const [ageFilter, setAgeFilter] = useState<AgeGroup | "All">("All");
  const [expandedActs, setExpandedActs] = useState<Set<string>>(new Set(events[0]?.performances.map((p) => p.id) ?? []));
  const [perfModalOpen, setPerfModalOpen] = useState<boolean>(false);
  const [newPerfName, setNewPerfName] = useState<string>("");
  const [newPerfStartTime, setNewPerfStartTime] = useState<string>("");
  const [editingEventTime, setEditingEventTime] = useState<boolean>(false);
  const [editingActTime, setEditingActTime] = useState<string | null>(null);

  const activeEvent = events[0];

  const recitalClassIds = useMemo(
    () => new Set(classes.filter((c) => c.inRecital).map((c) => c.id)),
    [classes],
  );

  const recitalClasses = useMemo(() => classes.filter((c) => c.inRecital), [classes]);

  const availableClasses = useMemo(() => {
    let pool = classes.filter((c) => !c.inRecital);
    if (search.trim()) {
      const q = search.toLowerCase();
      pool = pool.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (ageFilter !== "All") {
      pool = pool.filter((c) => c.ageGroup === ageFilter);
    }
    return pool;
  }, [classes, search, ageFilter]);

  const totalDancers = useMemo(
    () => recitalClasses.reduce((a, c) => a + c.enrolled, 0),
    [recitalClasses],
  );

  const unassignedClassIds = useMemo(() => {
    const assigned = new Set(activeEvent.performances.flatMap((p) => p.classIds));
    return recitalClasses.filter((c) => !assigned.has(c.id)).map((c) => c.id);
  }, [recitalClasses, activeEvent]);

  function toggleRecital(classId: string) {
    setClasses((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, inRecital: !c.inRecital } : c)),
    );
    // Remove from any performance if removing from recital
    const cls = classes.find((c) => c.id === classId);
    if (cls?.inRecital) {
      setEvents((prev) =>
        prev.map((ev) => ({
          ...ev,
          performances: ev.performances.map((p) => ({
            ...p,
            classIds: p.classIds.filter((id) => id !== classId),
          })),
        })),
      );
    }
  }

  function assignToPerformance(classId: string, performanceId: string) {
    setEvents((prev) =>
      prev.map((ev) => ({
        ...ev,
        performances: ev.performances.map((p) => {
          if (p.id === performanceId && !p.classIds.includes(classId)) {
            return { ...p, classIds: [...p.classIds, classId] };
          }
          return { ...p, classIds: p.classIds.filter((id) => id !== classId) };
        }),
      })),
    );
  }

  function removeFromPerformance(classId: string, performanceId: string) {
    setEvents((prev) =>
      prev.map((ev) => ({
        ...ev,
        performances: ev.performances.map((p) =>
          p.id === performanceId
            ? { ...p, classIds: p.classIds.filter((id) => id !== classId) }
            : p,
        ),
      })),
    );
  }

  function createPerformance() {
    if (!newPerfName.trim()) return;
    const perf: RecitalPerformance = {
      id: `p${Date.now()}`,
      studioId: studio.id,
      name: newPerfName.trim(),
      classIds: [],
      order: activeEvent.performances.length + 1,
      startTime: newPerfStartTime.trim() || undefined,
    };
    setEvents((prev) =>
      prev.map((ev) => ({ ...ev, performances: [...ev.performances, perf] })),
    );
    setExpandedActs((prev) => new Set([...prev, perf.id]));
    setNewPerfName("");
    setNewPerfStartTime("");
    setPerfModalOpen(false);
  }

  function deletePerformance(perfId: string) {
    setEvents((prev) =>
      prev.map((ev) => ({
        ...ev,
        performances: ev.performances.filter((p) => p.id !== perfId),
      })),
    );
  }

  function toggleAct(perfId: string) {
    setExpandedActs((prev) => {
      const next = new Set(prev);
      if (next.has(perfId)) next.delete(perfId);
      else next.add(perfId);
      return next;
    });
  }

  return (
    <div className="no-print mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{term.event} Management</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">{term.eventPlural}</h2>
        </div>
      </div>

      {/* Event banner */}
      <div className="overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 via-rose/5 to-plum/10 p-6 shadow-soft">
        <div className="flex flex-wrap items-start gap-6">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gold/15 text-gold">
            <Trophy className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-2xl font-semibold tracking-tight">{activeEvent.name}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {activeEvent.venue}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {new Date(activeEvent.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {editingEventTime ? (
                  <input
                    type="time"
                    className="w-28 rounded-lg border border-rose bg-card px-2 py-1 text-sm outline-none transition focus:ring-2 focus:ring-rose/20"
                    value={extractTimeFromISO(activeEvent.date)}
                    onChange={(e) => {
                      setEvents((prev) =>
                        prev.map((ev) => ({
                          ...ev,
                          date: applyTimeToISO(ev.date, e.target.value),
                        })),
                      );
                    }}
                    onBlur={() => setEditingEventTime(false)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setEditingEventTime(false);
                    }}
                  />
                ) : (
                  <button
                    onClick={() => setEditingEventTime(true)}
                    className="rounded-lg px-2 py-1 text-sm font-medium transition hover:bg-gold/10"
                    title="Edit start time"
                  >
                    {formatTime(activeEvent.date)}
                  </button>
                )}
              </span>
              {activeEvent.costumeDeadline && (
                <span className="flex items-center gap-1.5 text-gold font-medium">
                  <Clock className="h-4 w-4" />
                  Costume deadline:{" "}
                  {new Date(activeEvent.costumeDeadline).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportProgrammeToWord(studio, activeEvent, teachers, term)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-soft transition hover:bg-secondary"
            >
              <FileDown className="h-4 w-4" /> Export .doc
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-soft transition hover:bg-secondary print-btn"
            >
              <Printer className="h-4 w-4" /> Print Programme
            </button>
            <button
              onClick={() => setPerfModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-rose px-4 py-2.5 text-sm font-semibold text-rose-foreground shadow-soft transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> New Act
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill label={`${term.event} classes`} value={String(recitalClasses.length)} accent="gold" icon={Music} />
          <StatPill label={term.participantPlural} value={String(totalDancers)} accent="rose" icon={Users} />
          <StatPill label="Performances" value={String(activeEvent.performances.length)} accent="plum" icon={Sparkles} />
          <StatPill
            label={activeEvent.costumeDeadline ? "Costume deadline" : "Event date"}
            value={
              activeEvent.costumeDeadline
                ? new Date(activeEvent.costumeDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : new Date(activeEvent.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            }
            accent="teal"
            icon={Clock}
          />
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Recital Plan */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">{term.event} Plan</h3>
            <span className="text-sm text-muted-foreground">
              {recitalClasses.length} classes · {activeEvent.performances.length} acts
            </span>
          </div>

          {activeEvent.performances.length === 0 && unassignedClassIds.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
                <Music className="h-6 w-6" />
              </div>
              <p className="font-display text-lg font-semibold text-foreground/70">No classes in the recital yet</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Add classes from the pool on the right to start building your recital plan.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Performances */}
              {activeEvent.performances.map((perf, pi) => {
                const perfClasses = perf.classIds
                  .map((id) => classById(id))
                  .filter(Boolean) as Class[];
                const isExpanded = expandedActs.has(perf.id);
                return (
                  <div
                    key={perf.id}
                    className="animate-float-up rounded-2xl border border-border/70 bg-card shadow-soft"
                    style={{ animationDelay: `${pi * 60}ms` }}
                  >
                    <button
                      onClick={() => toggleAct(perf.id)}
                      className="flex w-full items-center gap-3 px-5 py-4 text-left"
                    >
                      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-plum/10 text-xs font-bold text-plum">
                        {perf.order}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-base font-semibold">{perf.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {perfClasses.length} class{perfClasses.length !== 1 ? "es" : ""}
                          {perf.costumeNote && <> · {perf.costumeNote}</>}
                        </p>
                        {/* Costume thumbnails for this routine */}
                        {perf.classIds.length > 0 && (() => {
                          const perfCostumeAssignments = ctx.assignments.filter((a) => perf.classIds.includes(a.classId ?? ""));
                          const perfCostumeIds = new Set(perfCostumeAssignments.map((a) => a.costumeId));
                          const perfCostumes = ctx.costumes.filter((c) => perfCostumeIds.has(c.id));
                          if (perfCostumes.length === 0) return null;
                          return (
                            <div className="flex items-center gap-2 mt-1">
                              {perfCostumes.slice(0, 4).map((costume) => (
                                <div key={costume.id} className="flex items-center gap-1.5 rounded-full bg-rose/10 px-2.5 py-0.5 text-[11px] font-medium text-rose" title={costume.name}>
                                  <Shirt className="h-3 w-3" />
                                  <span className="truncate max-w-[80px]">{costume.name}</span>
                                </div>
                              ))}
                              {perfCostumes.length > 4 && (
                                <span className="text-[10px] text-muted-foreground">+{perfCostumes.length - 4} more</span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      {perf.startTime && (
                        <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                          <Clock className="h-3 w-3" /> {formatStartTime(perf.startTime)}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {perfClasses.reduce((a, c) => a + c.enrolled, 0)} {term.participantPlural.toLowerCase()}
                      </span>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          isExpanded && "rotate-90",
                        )}
                      />
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border/70 px-5 pb-4 pt-3 space-y-2">
                        {perfClasses.length === 0 ? (
                          <p className="py-3 text-center text-sm text-muted-foreground">
                            No classes assigned yet. Drag classes here or use the dropdown on a recital class.
                          </p>
                        ) : (
                          perfClasses.map((c) => (
                            <RecitalClassCard
                              key={c.id}
                              cls={c}
                              onRemove={() => removeFromPerformance(c.id, perf.id)}
                              onRemoveFromRecital={() => toggleRecital(c.id)}
                              performances={activeEvent.performances}
                              currentPerfId={perf.id}
                              onAssign={(perfId) => assignToPerformance(c.id, perfId)}
                              teachers={teachers}
                            />
                          ))
                        )}
                      </div>
                    )}

                    {/* Timing row */}
                    <div className="flex items-center gap-3 border-t border-border/70 px-5 py-2.5">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Start time</span>
                      {editingActTime === perf.id ? (
                        <input
                          type="time"
                          className="w-28 rounded-lg border border-rose bg-card px-2 py-1 text-sm outline-none transition focus:ring-2 focus:ring-rose/20"
                          value={perf.startTime ?? ""}
                          onChange={(e) => {
                            setEvents((prev) =>
                              prev.map((ev) => ({
                                ...ev,
                                performances: ev.performances.map((p) =>
                                  p.id === perf.id ? { ...p, startTime: e.target.value } : p,
                                ),
                              })),
                            );
                          }}
                          onBlur={() => setEditingActTime(null)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setEditingActTime(null);
                          }}
                        />
                      ) : (
                        <button
                          onClick={() => setEditingActTime(perf.id)}
                          className="rounded-lg px-2 py-1 text-sm font-medium tabular-nums transition hover:bg-gold/10"
                        >
                          {formatStartTime(perf.startTime)}
                        </button>
                      )}
                      <div className="flex-1" />
                      <button
                        onClick={() => deletePerformance(perf.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete act
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Unassigned section */}
              {unassignedClassIds.length > 0 && (
                <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-sm font-semibold text-muted-foreground">Unassigned</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                      {unassignedClassIds.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {unassignedClassIds.map((id) => {
                      const c = classById(id);
                      if (!c) return null;
                      return (
                        <RecitalClassCard
                          key={c.id}
                          cls={c}
                          onRemoveFromRecital={() => toggleRecital(c.id)}
                          performances={activeEvent.performances}
                          onAssign={(perfId) => assignToPerformance(c.id, perfId)}
                          teachers={teachers}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Class Pool */}
        <div className="lg:col-span-2 space-y-4">
          <div className="sticky top-20 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Add Classes</h3>
              <span className="text-sm text-muted-foreground">{availableClasses.length} available</span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by class name…"
                className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Age filter chips */}
            <div className="flex flex-wrap gap-1.5">
              {(["All", ...AGES] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setAgeFilter(a)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    ageFilter === a
                      ? "border-rose bg-rose/10 text-rose"
                      : "border-border bg-card text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>

            {/* Available classes */}
            <div className="space-y-2">
              {availableClasses.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card/60 px-4 py-12 text-center">
                  <Search className="h-5 w-5 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    {search || ageFilter !== "All"
                      ? "No classes match your filters"
                      : "All classes are in the recital"}
                  </p>
                </div>
              ) : (
                availableClasses.map((c, i) => (
                  <div
                    key={c.id}
                    className="animate-float-up flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <span
                      className={cn(
                        "h-2.5 w-2.5 shrink-0 rounded-full",
                        styleStyles[c.style].dot,
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.ageGroup} · {c.day} {c.startTime} · {teacherName(teachers, c.teacherId)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {c.enrolled}/{c.capacity}
                      </span>
                      <button
                        onClick={() => toggleRecital(c.id)}
                        className="inline-flex items-center gap-1 rounded-full bg-rose px-3 py-1.5 text-xs font-semibold text-rose-foreground transition hover:opacity-90"
                      >
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Performance Modal */}
      <Modal
        open={perfModalOpen}
        onClose={() => {
          setPerfModalOpen(false);
          setNewPerfName("");
          setNewPerfStartTime("");
        }}
        title="Create a performance act"
        description="Organize recital classes into acts for the running order."
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setPerfModalOpen(false);
                setNewPerfName("");
                setNewPerfStartTime("");
              }}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              onClick={createPerformance}
              className="rounded-full bg-rose px-5 py-2 text-sm font-semibold text-rose-foreground transition hover:opacity-90"
            >
              Create act
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Act name
            </span>
            <input
              value={newPerfName}
              onChange={(e) => setNewPerfName(e.target.value)}
              placeholder="e.g. Act I — Opening Numbers"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && createPerformance()}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Start time
            </span>
            <input
              type="time"
              value={newPerfStartTime}
              onChange={(e) => setNewPerfStartTime(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
          </label>
        </div>
      </Modal>

      {/* ── Print-only Programme ────────────────────────────────── */}
      <div className="print-only">
        <Programme studio={studio} event={activeEvent} teachers={teachers} term={term} />
      </div>

      <p className="no-print pb-2 text-center text-xs text-muted-foreground">
        Recital data is demo content · Spring Showcase 2026
      </p>
    </div>
  );
}

/** A compact card for a class already in the recital plan. */
function RecitalClassCard({
  cls,
  performances,
  currentPerfId,
  onRemove,
  onRemoveFromRecital,
  onAssign,
  teachers,
}: {
  cls: Class;
  performances: RecitalPerformance[];
  currentPerfId?: string;
  onRemove?: () => void;
  onRemoveFromRecital: () => void;
  onAssign: (perfId: string) => void;
  teachers: Teacher[];
}) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3 transition hover:border-border">
      <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", styleStyles[cls.style].dot)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{cls.name}</p>
        <p className="text-xs text-muted-foreground">
          {cls.ageGroup} · {cls.day} {cls.startTime} · {teacherName(teachers, cls.teacherId)} · {cls.enrolled} enrolled
        </p>
      </div>
      <div className="flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
        {/* Assign to performance dropdown */}
        <select
          value={currentPerfId ?? ""}
          onChange={(e) => {
            if (e.target.value) onAssign(e.target.value);
          }}
          className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs outline-none"
        >
          <option value="">Move to…</option>
          {performances
            .filter((p) => p.id !== currentPerfId)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
        {onRemove && (
          <button
            onClick={onRemove}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            title="Remove from act"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={onRemoveFromRecital}
          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          title="Remove from recital"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ── Printable Programme ───────────────────────────────────────────── */

function Programme({
  studio,
  event,
  teachers,
  term,
}: {
  studio: Studio;
  event: RecitalEvent;
  teachers: Teacher[];
  term: ReturnType<typeof useTerminology>;
}) {
  const perfClasses = (perf: RecitalPerformance) =>
    perf.classIds.map((id) => classById(id)).filter(Boolean) as Class[];

  const totalDancersProgramme = event.performances.reduce(
    (a, p) => a + perfClasses(p).reduce((s, c) => s + c.enrolled, 0),
    0,
  );

  const eventDate = new Date(event.date);

  return (
    <div className="mx-auto max-w-[7in] py-8 font-sans text-[#1a1423]">
      {/* Studio masthead */}
      <div className="mb-10 border-b-2 border-[#d4c5c0] pb-7 text-center">
        <h1 className="font-display text-[28pt] font-semibold tracking-tight text-[#1a1423]">
          {studio.name}
        </h1>
        <p className="mt-1 font-display text-[11pt] italic text-[#6b5e68]">
          {studio.tagline}
        </p>
      </div>

      {/* Event title */}
      <h2 className="mb-1 text-center font-display text-[22pt] font-semibold tracking-tight">
        {event.name}
      </h2>
      <p className="mb-8 text-center text-[11pt] text-[#6b5e68]">
        {eventDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
        {" · "}
        {eventDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })}
        {" · "}
        {event.venue}
      </p>

      {/* Divider */}
      <div className="mb-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#e0d5d0]" />
        <span className="text-[9pt] font-semibold uppercase tracking-[0.2em] text-[#b5a39c]">
          Programme
        </span>
        <div className="h-px flex-1 bg-[#e0d5d0]" />
      </div>

      {/* Performances */}
      {event.performances.map((perf) => {
        const classes = perfClasses(perf);
        return (
          <div key={perf.id} className="print-act mb-8">
            {/* Act header */}
            <div className="mb-4 border-b border-[#e0d5d0] pb-3">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-[15pt] font-semibold tracking-tight">
                  {perf.name}
                </span>
                {perf.startTime && (
                  <span className="text-[11pt] text-[#6b5e68]">
                    {formatStartTime(perf.startTime)}
                  </span>
                )}
                <span className="text-[9pt] text-[#b5a39c]">
                  {classes.length} class{classes.length !== 1 ? "es" : ""}
                  {" · "}
                  {classes.reduce((a, c) => a + c.enrolled, 0)} {term.participantPlural.toLowerCase()}
                </span>
              </div>
              {perf.costumeNote && (
                <p className="mt-1 text-[10pt] italic text-[#6b5e68]">
                  Costume: {perf.costumeNote}
                </p>
              )}
            </div>

            {/* Class list */}
            <table className="w-full border-collapse text-[10pt]">
              <thead>
                <tr className="border-b border-[#ece5e0] text-left text-[9pt] font-semibold uppercase tracking-[0.08em] text-[#b5a39c]">
                  <th className="w-8 pb-2"></th>
                  <th className="pb-2 pr-4">Class</th>
                  <th className="pb-2 pr-4">Teacher</th>
                  <th className="pb-2 pr-4">Style</th>
                  <th className="pb-2">Age Group</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.id} className="border-b border-[#f3eeea]">
                    <td className="py-2.5">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{
                          backgroundColor:
                            c.style === "Ballet" || c.style === "Lyrical"
                              ? "#d94a6e"
                              : c.style === "Jazz"
                                ? "#c99d3e"
                                : c.style === "Hip Hop"
                                  ? "#77568c"
                                  : c.style === "Tap"
                                    ? "#1a1423"
                                    : "#4a9e8a",
                        }}
                      />
                    </td>
                    <td className="py-2.5 pr-4 font-medium">{c.name}</td>
                    <td className="py-2.5 pr-4 text-[#4a3f4a]">
                      {teacherName(teachers, c.teacherId)}
                    </td>
                    <td className="py-2.5 pr-4 text-[#6b5e68]">{c.style}</td>
                    <td className="py-2.5 text-[#6b5e68]">{c.ageGroup}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Footer */}
      <div className="mt-10 border-t border-[#d4c5c0] pt-5 text-center">
        <p className="text-[9pt] text-[#b5a39c]">
          {totalDancersProgramme} {term.participantPlural.toLowerCase()} · {event.performances.length} acts ·{" "}
          {studio.name} · {studio.city}
        </p>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  accent: "gold" | "rose" | "plum" | "teal";
  icon: typeof Music;
}) {
  const colors: Record<string, string> = {
    gold: "bg-gold/10 text-gold",
    rose: "bg-rose/10 text-rose",
    plum: "bg-plum/10 text-plum",
    teal: "bg-teal/10 text-teal",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/60 px-4 py-3">
      <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", colors[accent])}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-display text-lg font-semibold tabular-nums leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
