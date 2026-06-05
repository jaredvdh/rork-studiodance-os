import { useMemo, useState } from "react";
import type { RecitalPerformance, QuickChangeConflict, Student } from "@/data/types";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  GripVertical,
  RefreshCw,
  Sparkles,
  User,
  Users,
} from "lucide-react";

interface QuickChangeAssistantProps {
  performances: RecitalPerformance[];
  conflicts: QuickChangeConflict[];
  students: Student[];
  onDetectConflicts: (perfIds: string[]) => void;
  onReorderRoutine?: (perfId: string, newOrder: number) => void;
}

interface StudentRoutine {
  studentId: string;
  studentName: string;
  routines: { performanceId: string; performanceName: string; startTime?: string; endTime?: string }[];
}

export default function QuickChangeAssistant({
  performances,
  conflicts,
  students,
  onDetectConflicts,
  onReorderRoutine,
}: QuickChangeAssistantProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [changeTimeMinutes, setChangeTimeMinutes] = useState(5);

  // Build per-student routine timelines
  const studentTimelines = useMemo((): StudentRoutine[] => {
    const map = new Map<string, { performanceId: string; performanceName: string; startTime?: string; endTime?: string }[]>();
    // In a real app, we'd use costume assignments to link students to performances
    // For now, use the quick-change conflict data
    for (const c of conflicts) {
      const list = map.get(c.studentId) ?? [];
      if (c.routineA) list.push({ performanceId: "", performanceName: c.routineA, startTime: undefined, endTime: c.routineAEndTime });
      if (c.routineB) list.push({ performanceId: "", performanceName: c.routineB, startTime: c.routineBStartTime, endTime: undefined });
      map.set(c.studentId, list);
    }
    return Array.from(map.entries()).map(([studentId, routines]) => {
      const s = students.find((st) => st.id === studentId);
      return { studentId, studentName: s?.name ?? "Unknown", routines };
    });
  }, [conflicts, students]);

  const unresolvedConflicts = conflicts.filter((c) => c.conflictDetected && !c.resolved);
  const resolvedConflicts = conflicts.filter((c) => c.resolved);

  const handleRunAnalysis = () => {
    setAnalyzing(true);
    // Simulate analysis delay
    setTimeout(() => {
      onDetectConflicts(performances.map((p) => p.id));
      setAnalyzing(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Quick-Change Assistant</h3>
          <p className="text-sm text-muted-foreground">
            Detect students with insufficient time between costume changes.
          </p>
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={analyzing || performances.length < 2}
          className="inline-flex items-center gap-2 rounded-full bg-plum px-4 py-2.5 text-sm font-semibold text-white shadow-lift transition hover:opacity-90 disabled:opacity-50"
        >
          <Sparkles className={cn("h-4 w-4", analyzing && "animate-spin")} />
          {analyzing ? "Analyzing..." : "Run Analysis"}
        </button>
      </div>

      {/* Settings */}
      <div className="flex items-center gap-4 rounded-xl bg-secondary/30 p-4">
        <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Estimated change time:</span>
          <select
            value={changeTimeMinutes}
            onChange={(e) => setChangeTimeMinutes(Number(e.target.value))}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold outline-none focus:border-rose"
          >
            {[3, 4, 5, 6, 7, 8, 10].map((m) => (
              <option key={m} value={m}>{m} minutes</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {conflicts.length === 0 ? (
        <div className="rounded-2xl border border-border/70 bg-card p-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-semibold">No analysis yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Run the analysis above to scan the recital lineup for costume-change conflicts.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Conflicts summary */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-rose/10 p-4 text-center">
              <p className="text-2xl font-display font-bold text-rose">{unresolvedConflicts.length}</p>
              <p className="text-xs font-medium text-rose/80">Unresolved Conflicts</p>
            </div>
            <div className="rounded-xl bg-teal/10 p-4 text-center">
              <p className="text-2xl font-display font-bold text-teal">{resolvedConflicts.length}</p>
              <p className="text-xs font-medium text-teal/80">Resolved</p>
            </div>
            <div className="rounded-xl bg-plum/10 p-4 text-center">
              <p className="text-2xl font-display font-bold text-plum">{studentTimelines.length}</p>
              <p className="text-xs font-medium text-plum/80">Students in Multiple Routines</p>
            </div>
          </div>

          {/* Unresolved conflicts */}
          {unresolvedConflicts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose" />
                <h4 className="font-semibold text-rose">
                  {unresolvedConflicts.length} Conflict{unresolvedConflicts.length !== 1 ? "s" : ""} Detected
                </h4>
              </div>
              {unresolvedConflicts.map((c) => {
                const student = students.find((s) => s.id === c.studentId);
                return (
                  <div key={c.id} className="rounded-2xl border border-rose/30 bg-rose/5 p-5">
                    <div className="flex items-start gap-4">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose/10 shrink-0">
                        <User className="h-5 w-5 text-rose" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-base font-semibold">{student?.name ?? "Unknown"}</p>
                        <div className="mt-3 flex items-center gap-3 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose/10 px-3 py-1.5 text-xs font-medium text-rose">
                            <Clock className="h-3 w-3" />
                            {c.routineA} (ends {c.routineAEndTime})
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose/10 px-3 py-1.5 text-xs font-medium text-rose">
                            <Clock className="h-3 w-3" />
                            {c.routineB} (starts {c.routineBStartTime})
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                          Only {calculateTimeBetween(c.routineAEndTime, c.routineBStartTime)} minutes between routines — needs at least {c.estimatedChangeMinutes ?? 5} minutes to change.
                        </p>
                        {c.recommendation && (
                          <div className="mt-3 rounded-xl bg-secondary/30 p-3 flex items-start gap-2">
                            <Sparkles className="h-4 w-4 text-plum mt-0.5 shrink-0" />
                            <p className="text-sm text-foreground">{c.recommendation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Student timelines */}
          {studentTimelines.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Student Timelines</h4>
              <div className="space-y-2">
                {studentTimelines.map((st) => (
                  <div key={st.studentId} className="rounded-xl border border-border/70 bg-card p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-plum/10">
                        <Users className="h-4 w-4 text-plum" />
                      </div>
                      <p className="text-sm font-semibold">{st.studentName}</p>
                      <span className="text-xs text-muted-foreground">{st.routines.length} routines</span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {st.routines.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 shrink-0">
                          <div className="rounded-lg bg-secondary px-3 py-2 text-xs">
                            <p className="font-medium">{r.performanceName}</p>
                            {r.startTime && <p className="text-muted-foreground">{r.startTime}</p>}
                          </div>
                          {i < st.routines.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function calculateTimeBetween(endTime?: string, startTime?: string): number {
  if (!endTime || !startTime) return 0;
  const [eh, em] = endTime.split(":").map(Number);
  const [sh, sm] = startTime.split(":").map(Number);
  const endMins = (eh ?? 0) * 60 + (em ?? 0);
  const startMins = (sh ?? 0) * 60 + (sm ?? 0);
  return startMins - endMins;
}
