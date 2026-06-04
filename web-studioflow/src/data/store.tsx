import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "./studioStore";
import { classes as demoClasses } from "./demo";
import type { Announcement, ClassStyle, Teacher, Student, Class, Invoice, ParentAccount, Enrolment } from "./types";
import { useOptionalMigration } from "./migrationStore";
import {
  useSupabaseTeachers,
  useSupabaseClasses,
  useSupabaseStudents,
  useSupabaseAnnouncements,
  useSupabaseInvoices,
  useSupabaseEnrolments,
  useAddTeacher,
  useUpdateTeacher,
  useRemoveTeacher,
  useAddClass,
  useUpdateClass,
  useRemoveClass,
  useAddStudent,
  useUpdateStudent,
  useRemoveStudent,
  useEnrolStudent,
  useWithdrawStudent,
  useAddAnnouncement,
  useAddInvoice,
  useUpdateInvoice,
} from "./supabaseHooks";

/* ── Helpers ──────────────────────────────────────────────────── */


/* ── Shared enrolments state (SOURCE OF TRUTH for student↔class) ─────── */

interface EnrolmentsCtx {
  enrolments: Enrolment[];
  /** Map of classId → count of active & waitlisted enrolments */
  countByClassId: Map<string, number>;
  /** Map of studentId → array of active classIds */
  classIdsByStudentId: Map<string, string[]>;
}

const EnrolmentsContext = createContext<EnrolmentsCtx | null>(null);

export function EnrolmentsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isDemo = user?.isDemo === true;
  const { data: supabaseEnrolments = [] } = useSupabaseEnrolments(isDemo);
  const [enrolments, setEnrolments] = useState<Enrolment[]>([]);

  useEffect(() => {
    setEnrolments(supabaseEnrolments);
  }, [supabaseEnrolments]);

  const ctx = useMemo((): EnrolmentsCtx => {
    const active = enrolments.filter((e) => e.status === "active" || e.status === "waitlisted");
    const countByClassId = new Map<string, number>();
    const classIdsByStudentId = new Map<string, string[]>();
    for (const e of active) {
      countByClassId.set(e.classId, (countByClassId.get(e.classId) ?? 0) + 1);
      const ids = classIdsByStudentId.get(e.studentId) ?? [];
      ids.push(e.classId);
      classIdsByStudentId.set(e.studentId, ids);
    }
    return { enrolments, countByClassId, classIdsByStudentId };
  }, [enrolments]);

  return (
    <EnrolmentsContext.Provider value={ctx}>
      {children}
    </EnrolmentsContext.Provider>
  );
}

export function useEnrolments() {
  const ctx = useContext(EnrolmentsContext);
  if (!ctx) throw new Error("useEnrolments must be used within EnrolmentsProvider");
  return ctx;
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
  const { user } = useAuth();
  const isDemo = user?.isDemo === true;
  const { data: supabaseTeachers = [] } = useSupabaseTeachers(isDemo);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const queryClient = useQueryClient();

  // Sync from Supabase when data loads
  useEffect(() => {
    setTeachers(supabaseTeachers);
  }, [supabaseTeachers]);

  const addTeacherMut = useAddTeacher();
  const updateTeacherMut = useUpdateTeacher();
  const removeTeacherMut = useRemoveTeacher();

  const addTeacher = useCallback((t: Omit<Teacher, "id" | "studioId">) => {
    const tempId = `t${Date.now()}`;
    const optimistic: Teacher = { ...t, id: tempId, studioId: "" };
    setTeachers((prev) => [...prev, optimistic]);
    addTeacherMut.mutate(t, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teachers"] }),
      onError: () => {
        setTeachers((prev) => prev.filter((x) => x.id !== tempId));
      },
    });
  }, [addTeacherMut, queryClient]);

  const removeTeacher = useCallback((id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    removeTeacherMut.mutate(id, {
      onError: () => queryClient.invalidateQueries({ queryKey: ["teachers"] }),
    });
  }, [removeTeacherMut, queryClient]);

  const updateTeacher = useCallback((id: string, patch: Partial<Omit<Teacher, "id" | "studioId">>) => {
    setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    updateTeacherMut.mutate({ id, patch }, {
      onError: () => queryClient.invalidateQueries({ queryKey: ["teachers"] }),
    });
  }, [updateTeacherMut, queryClient]);

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
}

const ClassesContext = createContext<ClassesCtx | null>(null);

export function ClassesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isDemo = user?.isDemo === true;
  const { data: supabaseClasses = [] } = useSupabaseClasses(isDemo);
  const [classes, setClasses] = useState<Class[]>([]);
  const queryClient = useQueryClient();

  // Derive enrolled/waitlist counts from enrolments context (source of truth)
  const enrolmentsCtx = useContext(EnrolmentsContext);

  // Merge Supabase classes with derived enrolment counts
  const derivedClasses = useMemo(() => {
    if (!enrolmentsCtx) return classes;
    return classes.map((c) => ({
      ...c,
      enrolled: enrolmentsCtx.countByClassId.get(c.id) ?? c.enrolled,
      waitlist: 0, // waitlist derived from enrolments when status field is live
    }));
  }, [classes, enrolmentsCtx]);
  useEffect(() => {
    setClasses(supabaseClasses);
  }, [supabaseClasses]);

  const addClassMut = useAddClass();
  const updateClassMut = useUpdateClass();
  const removeClassMut = useRemoveClass();

  const addClass = useCallback((c: Omit<Class, "id" | "studioId">) => {
    const tempId = `c${Date.now()}`;
    const optimistic: Class = { ...c, id: tempId, studioId: "" };
    setClasses((prev) => [optimistic, ...prev]);
    addClassMut.mutate(c, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
      onError: () => {
        setClasses((prev) => prev.filter((x) => x.id !== tempId));
      },
    });
  }, [addClassMut, queryClient]);

  const removeClass = useCallback((id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    removeClassMut.mutate(id, {
      onError: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
    });
  }, [removeClassMut, queryClient]);

  const updateClass = useCallback((id: string, patch: Partial<Omit<Class, "id" | "studioId">>) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    updateClassMut.mutate({ id, patch }, {
      onError: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
    });
  }, [updateClassMut, queryClient]);

  return (
    <ClassesContext.Provider value={{ classes: derivedClasses, addClass, removeClass, updateClass }}>
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
  /** Enrol a student into a class — writes to enrolments table (source of truth) */
  enrolStudentInClass: (studentId: string, classId: string) => void;
  /** Withdraw a student from a class — updates enrolment status to "withdrawn" */
  withdrawStudentFromClass: (studentId: string, classId: string) => void;
}

const StudentsContext = createContext<StudentsCtx | null>(null);

export function StudentsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isDemo = user?.isDemo === true;
  const { data: supabaseStudents = [] } = useSupabaseStudents(isDemo);
  const [students, setStudents] = useState<Student[]>([]);
  const queryClient = useQueryClient();

  // Derive classIds from enrolments context (source of truth)
  const enrolmentsCtx = useContext(EnrolmentsContext);

  // Merge students with derived classIds from enrolments
  const derivedStudents = useMemo(() => {
    if (!enrolmentsCtx) return students;
    return students.map((s) => ({
      ...s,
      classIds: enrolmentsCtx.classIdsByStudentId.get(s.id) ?? s.classIds,
    }));
  }, [students, enrolmentsCtx]);

  // Sync from Supabase
  useEffect(() => {
    setStudents(supabaseStudents);
  }, [supabaseStudents]);

  const addStudentMut = useAddStudent();
  const updateStudentMut = useUpdateStudent();
  const removeStudentMut = useRemoveStudent();
  const enrolMut = useEnrolStudent();
  const withdrawMut = useWithdrawStudent();

  const addStudent = useCallback((s: Omit<Student, "id" | "studioId">) => {
    const tempId = `s${Date.now()}`;
    const optimistic: Student = { ...s, id: tempId, studioId: "" };
    setStudents((prev) => [...prev, optimistic]);
    addStudentMut.mutate(s, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
      onError: () => {
        setStudents((prev) => prev.filter((x) => x.id !== tempId));
      },
    });
  }, [addStudentMut, queryClient]);

  const updateStudent = useCallback((id: string, patch: Partial<Omit<Student, "id" | "studioId">>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    updateStudentMut.mutate({ id, patch }, {
      onError: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
    });
  }, [updateStudentMut, queryClient]);

  const enrolStudentInClass = useCallback((studentId: string, classId: string) => {
    // Persist to enrolments table (source of truth).
    // Derived counts in classes/students update on invalidation.
    enrolMut.mutate({ studentId, classId }, {
      onError: () => {
        queryClient.invalidateQueries({ queryKey: ["enrolments"] });
        queryClient.invalidateQueries({ queryKey: ["students"] });
        queryClient.invalidateQueries({ queryKey: ["classes"] });
      },
    });
  }, [enrolMut, queryClient]);

  const withdrawStudentFromClass = useCallback((studentId: string, classId: string) => {
    // Persist to enrolments table — updates status to "withdrawn" (preserves history).
    // Derived counts in classes/students update on invalidation.
    withdrawMut.mutate({ studentId, classId }, {
      onError: () => {
        queryClient.invalidateQueries({ queryKey: ["enrolments"] });
        queryClient.invalidateQueries({ queryKey: ["students"] });
        queryClient.invalidateQueries({ queryKey: ["classes"] });
      },
    });
  }, [withdrawMut, queryClient]);

  return (
    <StudentsContext.Provider value={{ students: derivedStudents, addStudent, updateStudent, enrolStudentInClass, withdrawStudentFromClass }}>
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
  const { user } = useAuth();
  const isDemo = user?.isDemo === true;
  const { data: supabaseAnns = [] } = useSupabaseAnnouncements(isDemo);
  const [anns, setAnns] = useState<Announcement[]>([]);
  const queryClient = useQueryClient();

  // Sync from Supabase
  useEffect(() => {
    setAnns(supabaseAnns);
  }, [supabaseAnns]);

  const addAnnouncementMut = useAddAnnouncement();

  const addAnnouncement = useCallback((a: Omit<Announcement, "id" | "studioId" | "sentAt" | "reach">) => {
    const sentAt = new Date().toISOString();
    const tempId = `a${Date.now()}`;
    const optimistic: Announcement = {
      ...a,
      id: tempId,
      studioId: "",
      sentAt,
      reach: 0,
    };
    setAnns((prev) => [optimistic, ...prev]);

    addAnnouncementMut.mutate({ ...a, sentAt, reach: 0 } as Announcement & { sentAt: string; reach: number }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
      onError: () => {
        setAnns((prev) => prev.filter((x) => x.id !== tempId));
      },
    });
  }, [addAnnouncementMut, queryClient]);

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
  const { user } = useAuth();
  const isDemo = user?.isDemo === true;
  const { data: supabaseInvs = [] } = useSupabaseInvoices(isDemo);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const queryClient = useQueryClient();

  // Sync from Supabase
  useEffect(() => {
    setInvoices(supabaseInvs);
  }, [supabaseInvs]);

  const addInvoiceMut = useAddInvoice();
  const updateInvoiceMut = useUpdateInvoice();

  const addInvoice = useCallback((inv: Omit<Invoice, "id" | "studioId">) => {
    const tempId = `inv${Date.now()}`;
    const optimistic: Invoice = { ...inv, id: tempId, studioId: "" };
    setInvoices((prev) => [optimistic, ...prev]);
    addInvoiceMut.mutate(inv, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
      onError: () => {
        setInvoices((prev) => prev.filter((x) => x.id !== tempId));
      },
    });
  }, [addInvoiceMut, queryClient]);

  const updateInvoice = useCallback((id: string, patch: Partial<Omit<Invoice, "id" | "studioId">>) => {
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    updateInvoiceMut.mutate({ id, patch }, {
      onError: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
    });
  }, [updateInvoiceMut, queryClient]);

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
  const { studio } = useStudio();
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
      ? [...([] as ParentAccount[]), ...migration.importedParents]
      : [];
    return {
      studio,
      classes: mergedClasses,
      teachers: mergedTeachers,
      students: mergedStudents,
      parents: mergedParents,
      announcements: anns,
      invoices: invs,
      revenueSeries: [] as { month: string; revenueCents: number; enrollments: number }[],
    };
  }, [studio, teachers, classes, students, anns, invs, migration?.importedStudents, migration?.importedClasses, migration?.importedTeachers, migration?.importedParents]);
}

// Re-export StudioProvider, useStudio, useTerminology so existing imports from "@/data/store" keep working
export { StudioProvider, useStudio, useTerminology } from "./studioStore";

export function teacherName(teachers: Teacher[], id: string): string {
  return teachers.find((t) => t.id === id)?.name ?? "Unassigned";
}

/** @deprecated Use useClasses() hook to look up classes by ID.
 * Kept for backward compatibility — resolves from demo data if no context classes available. */
export function classById(id: string, contextClasses?: Class[]): Class | undefined {
  const all = contextClasses ?? demoClasses;
  return all.find((c) => c.id === id);
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
