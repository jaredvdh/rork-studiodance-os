import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Clock, Heart, MapPin } from "lucide-react";

import { styleStyles, teacherName, useStudioData, useTeachers } from "@/data/store";
import { useParent } from "@/data/parentStore";
import type { WeekDay } from "@/data/types";
import { cn } from "@/lib/utils";

const dayNames: Record<WeekDay, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};
const dayOrder: WeekDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const childColors = [
  "border-l-amber-400 bg-amber-50/50",
  "border-l-rose bg-rose/5",
  "border-l-teal bg-teal/5",
  "border-l-plum bg-plum/5",
];

export default function ParentSchedule() {
  const { classes } = useStudioData();
  const { teachers } = useTeachers();
  const { children: myStudents } = useParent();

  const myClassIds = useMemo(
    () => [...new Set(myStudents.flatMap((s) => s.classIds))],
    [myStudents],
  );

  const myClasses = useMemo(
    () => classes.filter((c) => myClassIds.includes(c.id)),
    [classes, myClassIds],
  );

  const byDay = useMemo(() => {
    const map: Record<WeekDay, typeof myClasses> = {
      Mon: [],
      Tue: [],
      Wed: [],
      Thu: [],
      Fri: [],
      Sat: [],
      Sun: [],
    };
    myClasses.forEach((c) => {
      map[c.day] = [...(map[c.day] || []), c].sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      );
    });
    return map;
  }, [myClasses]);

  const activeDays = dayOrder.filter((d) => byDay[d].length > 0);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="animate-float-up">
        <p className="text-sm text-muted-foreground">Weekly schedule</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          Your family's week
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {myClasses.length} classes across {activeDays.length} day
          {activeDays.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Legend */}
      {myStudents.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {myStudents.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 text-sm">
              <span
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor: ["#F59E0B", "#E11D48", "#0D9488", "#7C3AED"][
                    i % 4
                  ],
                }}
              />
              <span className="font-medium">{s.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Day-by-day */}
      {activeDays.length > 0 ? (
        <div className="space-y-6">
          {activeDays.map((day) => (
            <div key={day}>
              <h3 className="font-display text-lg font-semibold text-foreground/80 mb-3 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-amber-700 text-sm font-semibold">
                  {day}
                </span>
                {dayNames[day]}
              </h3>
              <div className="space-y-3">
                {byDay[day].map((c, ci) => {
                  const enrolledStudents = myStudents.filter((s) =>
                    s.classIds.includes(c.id),
                  );
                  const studentIdx = enrolledStudents.length
                    ? myStudents.findIndex((s) => s.id === enrolledStudents[0].id)
                    : 0;

                  return (
                    <div
                      key={c.id}
                      className={cn(
                        "rounded-xl border-l-4 p-4 animate-float-up",
                        childColors[studentIdx % childColors.length],
                      )}
                      style={{ animationDelay: `${ci * 60}ms` }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-semibold",
                                styleStyles[c.style].chip,
                              )}
                            >
                              {c.style}
                            </span>
                            {c.inRecital && (
                              <span className="rounded-full bg-plum/10 px-2 py-0.5 text-xs font-semibold text-plum">
                                Recital
                              </span>
                            )}
                          </div>
                          <h4 className="mt-1 font-display text-lg font-semibold">
                            {c.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {c.startTime} · {c.durationMins}min
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {c.room}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {teacherName(teachers, c.teacherId)}
                        </span>
                        <span className="text-sm text-muted-foreground">·</span>
                        <span className="text-sm text-muted-foreground">
                          {c.ageGroup}
                        </span>
                        <span className="text-sm text-muted-foreground">·</span>
                        <span className="flex items-center gap-1 text-sm">
                          <Heart className="h-3.5 w-3.5 text-amber-500" />
                          {enrolledStudents.map((s) => s.name).join(", ")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-500">
            <Heart className="h-8 w-8" />
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold">
            No classes scheduled
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Enroll in a class to see it on your schedule.
          </p>
          <Link
            to="/parent/classes"
            className="mt-4 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-900"
          >
            Browse classes
          </Link>
        </div>
      )}
    </div>
  );
}
