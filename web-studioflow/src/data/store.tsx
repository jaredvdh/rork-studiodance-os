import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { announcements, classes, invoices, revenueSeries, students, studio as defaultStudio, teachers as demoT, parentAccounts as demoParents } from "./demo";
import { getTerminology } from "./terminology";
import type { VerticalTerminology } from "./terminology";
import type { ClassStyle, Studio, Teacher, Student, Class, ParentAccount } from "./types";
import { useOptionalMigration } from "./migrationStore";

/* ── Studio branding (persisted to localStorage) ──────────────────── */

const STUDIO_KEY = "studioflow_studio";

function loadStudio(): Studio {
  try {
    const raw = localStorage.getItem(STUDIO_KEY);
    if (raw) return JSON.parse(raw) as Studio;
  } catch { /* ignore corrupt data */ }
  return { ...defaultStudio };
}

function saveStudio(s: Studio) {
  localStorage.setItem(STUDIO_KEY, JSON.stringify(s));
}

interface StudioCtx {
  studio: Studio;
  updateStudio: (patch: Partial<Omit<Studio, "id">>) => void;
}

const StudioContext = createContext<StudioCtx | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [studio, setStudio] = useState<Studio>(loadStudio);

  const updateStudio = useCallback((patch: Partial<Omit<Studio, "id">>) => {
    setStudio((prev) => {
      const next = { ...prev, ...patch };
      saveStudio(next);
      return next;
    });
  }, []);

  // Apply studio brandColor as a CSS custom property on mount / change
  useEffect(() => {
    document.documentElement.style.setProperty("--studio-brand", studio.brandColor);
  }, [studio.brandColor]);

  return (
    <StudioContext.Provider value={{ studio, updateStudio }}>
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used within StudioProvider");
  return ctx;
}

/** Returns the user-facing terminology for the current studio's vertical.
 * Labels like "Students"/"Athletes"/"Members" adjust automatically. */
export function useTerminology(): VerticalTerminology {
  const { studio } = useStudio();
  return getTerminology(studio.vertical);
}

/* ── Shared teachers state ───────────────────────────────────────────── */

interface TeachersCtx {
  teachers: Teacher[];
  addTeacher: (t: Omit<Teacher, "id" | "studioId">) => void;
  removeTeacher: (id: string) => void;
  updateTeacher: (id: string, patch: Partial<Omit<Teacher, "id" | "studioId">>) => void;
}

const TeachersContext = createContext<TeachersCtx | null>(null);

export function TeachersProvider({ children }: { children: React.ReactNode }) {
  const [teachers, setTeachers] = useState<Teacher[]>(demoT);

  const addTeacher = useCallback((t: Omit<Teacher, "id" | "studioId">) => {
    const next: Teacher = { ...t, id: `t${Date.now()}`, studioId: defaultStudio.id };
    setTeachers((prev) => [...prev, next]);
  }, []);

  const removeTeacher = useCallback((id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTeacher = useCallback((id: string, patch: Partial<Omit<Teacher, "id" | "studioId">>) => {
    setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  return (
    <TeachersContext.Provider value={{ teachers, addTeacher, removeTeacher, updateTeacher }}>
      {children}
    </TeachersContext.Provider>
  );
}

export function useTeachers() {
  const ctx = useContext(TeachersContext);
  if (!ctx) throw new Error("useTeachers must be used within TeachersProvider");
  return ctx;
}

/* ── Static helpers ──────────────────────────────────────────────────── */

/** Central read access to the active studio's data. Merges demo data with
 * any imported records from the Migration Assistant. */
export function useStudioData() {
  const { teachers } = useTeachers();
  const migration = useOptionalMigration();
  return useMemo(() => {
    const mergedStudents: Student[] = migration
      ? [...students, ...migration.importedStudents]
      : students;
    const mergedClasses: Class[] = migration
      ? [...classes, ...migration.importedClasses]
      : classes;
    const mergedTeachers: Teacher[] = migration
      ? [...teachers, ...migration.importedTeachers]
      : teachers;
    const mergedParents: ParentAccount[] = migration
      ? [...demoParents, ...migration.importedParents]
      : demoParents;
    return {
      studio: defaultStudio,
      classes: mergedClasses,
      teachers: mergedTeachers,
      students: mergedStudents,
      parents: mergedParents,
      announcements,
      invoices,
      revenueSeries,
    };
  }, [teachers, migration?.importedStudents, migration?.importedClasses, migration?.importedTeachers, migration?.importedParents]);
}

export function teacherName(teachers: Teacher[], id: string): string {
  return teachers.find((t) => t.id === id)?.name ?? "Unassigned";
}

export function classById(id: string) {
  return classes.find((c) => c.id === id);
}

/** Tailwind-ready accent tokens per class style for chips and visuals. */
export const styleStyles: Record<ClassStyle, { dot: string; chip: string }> = {
  Ballet: { dot: "bg-rose", chip: "bg-rose/10 text-rose" },
  Jazz: { dot: "bg-gold", chip: "bg-gold/15 text-gold" },
  "Hip Hop": { dot: "bg-plum", chip: "bg-plum/10 text-plum" },
  Contemporary: { dot: "bg-teal", chip: "bg-teal/10 text-teal" },
  Tap: { dot: "bg-foreground", chip: "bg-foreground/10 text-foreground" },
  Lyrical: { dot: "bg-rose", chip: "bg-rose/10 text-rose" },
  Acro: { dot: "bg-teal", chip: "bg-teal/10 text-teal" },
};
