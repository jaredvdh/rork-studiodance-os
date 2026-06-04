import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { announcements, classes as demoClasses, invoices as demoInvoices, revenueSeries, students as demoStudents, studio as defaultStudio, teachers as demoT, parentAccounts as demoParents } from "./demo";
import { getTerminology } from "./terminology";
import type { VerticalTerminology } from "./terminology";
import type { Announcement, ClassStyle, Studio, Teacher, Student, Class, Invoice, ParentAccount } from "./types";
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

/* ── Shared classes state ────────────────────────────────────────────── */

interface ClassesCtx {
  classes: Class[];
  addClass: (c: Omit<Class, "id" | "studioId">) => void;
  removeClass: (id: string) => void;
  updateClass: (id: string, patch: Partial<Omit<Class, "id" | "studioId">>) => void;
  /** Enrol a student, incrementing enrolled count */
  enrolStudent: (classId: string) => void;
  /** Withdraw a student, decrementing enrolled count */
  withdrawStudent: (classId: string) => void;
}

const ClassesContext = createContext<ClassesCtx | null>(null);

export function ClassesProvider({ children }: { children: React.ReactNode }) {
  const [classes, setClasses] = useState<Class[]>(demoClasses);

  const addClass = useCallback((c: Omit<Class, "id" | "studioId">) => {
    const next: Class = { ...c, id: `c${Date.now()}`, studioId: defaultStudio.id };
    setClasses((prev) => [next, ...prev]);
  }, []);

  const removeClass = useCallback((id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateClass = useCallback((id: string, patch: Partial<Omit<Class, "id" | "studioId">>) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const enrolStudent = useCallback((classId: string) => {
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId
          ? { ...c, enrolled: c.enrolled + 1, waitlist: Math.max(0, c.waitlist - 1) }
          : c,
      ),
    );
  }, []);

  const withdrawStudent = useCallback((classId: string) => {
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId
          ? { ...c, enrolled: Math.max(0, c.enrolled - 1) }
          : c,
      ),
    );
  }, []);

  return (
    <ClassesContext.Provider value={{ classes, addClass, removeClass, updateClass, enrolStudent, withdrawStudent }}>
      {children}
    </ClassesContext.Provider>
  );
}

export function useClasses() {
  const ctx = useContext(ClassesContext);
  if (!ctx) throw new Error("useClasses must be used within ClassesProvider");
  return ctx;
}

/* ── Shared students state ───────────────────────────────────────────── */

interface StudentsCtx {
  students: Student[];
  addStudent: (s: Omit<Student, "id" | "studioId">) => void;
  updateStudent: (id: string, patch: Partial<Omit<Student, "id" | "studioId">>) => void;
  /** Enrol a student into a class — updates both student.classIds and class.enrolled */
  enrolStudentInClass: (studentId: string, classId: string) => void;
  /** Withdraw a student from a class */
  withdrawStudentFromClass: (studentId: string, classId: string) => void;
}

const StudentsContext = createContext<StudentsCtx | null>(null);

export function StudentsProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<Student[]>(demoStudents);
  const { enrolStudent: incEnrolled, withdrawStudent: decEnrolled } = useClasses();

  const addStudent = useCallback((s: Omit<Student, "id" | "studioId">) => {
    const next: Student = { ...s, id: `s${Date.now()}`, studioId: defaultStudio.id };
    setStudents((prev) => [...prev, next]);
  }, []);

  const updateStudent = useCallback((id: string, patch: Partial<Omit<Student, "id" | "studioId">>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const enrolStudentInClass = useCallback((studentId: string, classId: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId && !s.classIds.includes(classId)
          ? { ...s, classIds: [...s.classIds, classId] }
          : s,
      ),
    );
    incEnrolled(classId);
  }, [incEnrolled]);

  const withdrawStudentFromClass = useCallback((studentId: string, classId: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, classIds: s.classIds.filter((id) => id !== classId) }
          : s,
      ),
    );
    decEnrolled(classId);
  }, [decEnrolled]);

  return (
    <StudentsContext.Provider value={{ students, addStudent, updateStudent, enrolStudentInClass, withdrawStudentFromClass }}>
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents() {
  const ctx = useContext(StudentsContext);
  if (!ctx) throw new Error("useStudents must be used within StudentsProvider");
  return ctx;
}

/* ── Shared announcements state ──────────────────────────────────────── */

interface AnnouncementsCtx {
  announcements: Announcement[];
  addAnnouncement: (a: Omit<Announcement, "id" | "studioId" | "sentAt" | "reach">) => void;
}

const AnnouncementsContext = createContext<AnnouncementsCtx | null>(null);

export function AnnouncementsProvider({ children }: { children: React.ReactNode }) {
  const [anns, setAnns] = useState<Announcement[]>(announcements);

  const addAnnouncement = useCallback((a: Omit<Announcement, "id" | "studioId" | "sentAt" | "reach">) => {
    const next: Announcement = {
      ...a,
      id: `a${Date.now()}`,
      studioId: defaultStudio.id,
      sentAt: new Date().toISOString(),
      reach: 0,
    };
    setAnns((prev) => [next, ...prev]);
  }, []);

  return (
    <AnnouncementsContext.Provider value={{ announcements: anns, addAnnouncement }}>
      {children}
    </AnnouncementsContext.Provider>
  );
}

export function useAnnouncements() {
  const ctx = useContext(AnnouncementsContext);
  if (!ctx) throw new Error("useAnnouncements must be used within AnnouncementsProvider");
  return ctx;
}

/* ── Shared invoices state ───────────────────────────────────────────── */

interface InvoicesCtx {
  invoices: Invoice[];
  addInvoice: (inv: Omit<Invoice, "id" | "studioId">) => void;
  updateInvoice: (id: string, patch: Partial<Omit<Invoice, "id" | "studioId">>) => void;
}

const InvoicesContext = createContext<InvoicesCtx | null>(null);

export function InvoicesProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(demoInvoices);

  const addInvoice = useCallback((inv: Omit<Invoice, "id" | "studioId">) => {
    const next: Invoice = { ...inv, id: `inv${Date.now()}`, studioId: defaultStudio.id };
    setInvoices((prev) => [next, ...prev]);
  }, []);

  const updateInvoice = useCallback((id: string, patch: Partial<Omit<Invoice, "id" | "studioId">>) => {
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  return (
    <InvoicesContext.Provider value={{ invoices, addInvoice, updateInvoice }}>
      {children}
    </InvoicesContext.Provider>
  );
}

export function useInvoices() {
  const ctx = useContext(InvoicesContext);
  if (!ctx) throw new Error("useInvoices must be used within InvoicesProvider");
  return ctx;
}

/* ── Static helpers ──────────────────────────────────────────────────── */

/** Central read access to the active studio's data. Merges demo data with
 * any imported records from the Migration Assistant, and shared context state. */
export function useStudioData() {
  const { teachers } = useTeachers();
  const { classes } = useClasses();
  const { students } = useStudents();
  const { announcements: anns } = useAnnouncements();
  const { invoices: invs } = useInvoices();
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
      announcements: anns,
      invoices: invs,
      revenueSeries,
    };
  }, [teachers, classes, students, anns, invs, migration?.importedStudents, migration?.importedClasses, migration?.importedTeachers, migration?.importedParents]);
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
