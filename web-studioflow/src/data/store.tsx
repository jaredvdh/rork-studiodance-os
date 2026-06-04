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
  /** Optimistically add/update an enrolment in local state (for demo mode + instant UI). */
  addEnrolment: (enrolment: Enrolment) => void;
  /** Optimistically update an enrolment's status in local state. */
  updateEnrolmentStatus: (studentId: string, classId: string, status: Enrolment["status"]) => void;
}

const EnrolmentsContext = createContext<EnrolmentsCtx | null>(null);

export function EnrolmentsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isDemo = user?.isDemo === true;
  const { data: supabaseEnrolments = [] } = useSupabaseEnrolments(isDemo);
  const [enrolments, setEnrolments] = useState<Enrolment[]>([]);
  const [localMutations, setLocalMutations] = useState<Set<string>>(new Set());

  useEffect(() => {
    setEnrolments(supabaseEnrolments);
  }, [supabaseEnrolments]);

  // Merge local (optimistic) mutations on top of Supabase/demo data.
  // Key: `${studentId}:${classId}`
  const addEnrolment = useCallback((enrolment: Enrolment) => {
    const key = `${enrolment.studentId}:${enrolment.classId}`;
    setLocalMutations((prev) => new Set(prev).add(key));
    setEnrolments((prev) => {
      const filtered = prev.filter(
        (e) => !(e.studentId === enrolment.studentId && e.classId === enrolment.classId),
      );
      return [...filtered, enrolment];
    });
  }, []);

  const updateEnrolmentStatus = useCallback(
    (studentId: string, classId: string, status: Enrolment["status"]) => {
      const key = `${studentId}:${classId}`;
      setLocalMutations((prev) => new Set(prev).add(key));
      setEnrolments((prev) =>
        prev.map((e) =>
          e.studentId === studentId && e.classId === classId
            ? { ...e, status, endedAt: status === "withdrawn" ? new Date().toISOString() : e.endedAt, updatedAt: new Date().toISOString() }
            : e,
        ),
      );
    },
    [],
  );

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
    return { enrolments, countByClassId, classIdsByStudentId, addEnrolment, updateEnrolmentStatus };
  }, [enrolments, addEnrolment, updateEnrolmentStatus]);

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
    <ClassesContext.Provider value={{ classes, addClass, removeClass, updateClass }}>
      {children}
    </ClassesContext.Provider>
  );
}

export function useClasses() {
  const ctx = useContext(ClassesContext);
  if (!ctx) throw new Error("useClasses must be used within ClassesProvider");
  return ctx;
}

/** Returns classes with enrolled counts derived from the enrolments table
 * (the single source of truth). Safe to call even if EnrolmentsProvider is a
 * descendant — falls back to raw class.enrolled when enrolments aren't available. */
export function useEnrichedClasses() {
  const { classes } = useClasses();
  const enrolmentsCtx = useContext(EnrolmentsContext);
  return useMemo(() => {
    if (!enrolmentsCtx) return classes;
    return classes.map((c) => ({
      ...c,
      enrolled: enrolmentsCtx.countByClassId.get(c.id) ?? c.enrolled,
      waitlist: 0,
    }));
  }, [classes, enrolmentsCtx]);
}

/* ── Shared students state ───────────────────────────────────────────── */

interface StudentsCtx {
  students: Student[];
  addStudent: (s: Omit<Student, "id" | "studioId">) => void;
  updateStudent: (id: string, patch: Partial<Omit<Student, "id" | "studioId">>) => void;
  /** Enrol a student into a class — writes to enrolments table (source of truth).
   * Pass forceWaitlist to bypass capacity check and force waitlist status. */
  enrolStudentInClass: (studentId: string, classId: string, forceWaitlist?: boolean) => void;
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
  // Access classes from sibling context (needed for capacity checks in enrolStudentInClass)
  const classesCtx = useContext(ClassesContext);
  const classes = classesCtx?.classes ?? [];

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

  const enrolStudentInClass = useCallback((studentId: string, classId: string, forceWaitlist?: boolean) => {
    if (!enrolmentsCtx) return;
    // Determine status: check if class is at capacity
    const cls = classes.find((c) => c.id === classId);
    const enrolledCount = enrolmentsCtx.countByClassId.get(classId) ?? 0;
    const isFull = cls ? enrolledCount >= cls.capacity : false;
    const status: Enrolment["status"] = forceWaitlist || isFull ? "waitlisted" : "active";

    const now = new Date().toISOString();
    const optimistic: Enrolment = {
      id: `enr_opt_${studentId}_${classId}`,
      studioId: "",
      studentId,
      classId,
      status,
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    // Optimistic update — UI responds instantly (critical for demo mode)
    enrolmentsCtx.addEnrolment(optimistic);

    // Persist to Supabase (no-op on failure — local state already updated)
    enrolMut.mutate(
      { studentId, classId, forceWaitlist: forceWaitlist ?? isFull },
      {
        onError: () => {
          // Rollback: remove optimistic, reload from source
          queryClient.invalidateQueries({ queryKey: ["enrolments"] });
          queryClient.invalidateQueries({ queryKey: ["students"] });
          queryClient.invalidateQueries({ queryKey: ["classes"] });
        },
      },
    );
  }, [enrolmentsCtx, classes, enrolMut, queryClient]); // eslint-disable-line react-hooks/exhaustive-deps

  const withdrawStudentFromClass = useCallback((studentId: string, classId: string) => {
    if (!enrolmentsCtx) return;

    // Optimistic update — mark as withdrawn immediately
    enrolmentsCtx.updateEnrolmentStatus(studentId, classId, "withdrawn");

    // Persist to Supabase (no-op on failure — local state already updated)
    withdrawMut.mutate({ studentId, classId }, {
      onError: () => {
        // Rollback: reload from source
        queryClient.invalidateQueries({ queryKey: ["enrolments"] });
        queryClient.invalidateQueries({ queryKey: ["students"] });
        queryClient.invalidateQueries({ queryKey: ["classes"] });
      },
    });
  }, [enrolmentsCtx, withdrawMut, queryClient]);

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
  const classes = useEnrichedClasses();
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

/* ── Shared waivers state (templates + signatures) ───────────────────── */

interface WaiversCtx {
  templates: import("./types").WaiverTemplate[];
  versions: import("./types").WaiverVersion[];
  signatures: import("./types").WaiverSignature[];
  addTemplate: (t: Omit<import("./types").WaiverTemplate, "id" | "studioId" | "createdAt" | "updatedAt">) => void;
  updateTemplate: (id: string, patch: Partial<import("./types").WaiverTemplate>) => void;
  /** Create a new version for a template and optionally publish it. */
  createVersion: (templateId: string, bodyMarkdown: string, publish?: boolean) => void;
  /** Sign a waiver for a student/caregiver. */
  signWaiver: (sig: {
    waiverTemplateId: string;
    waiverVersionId: string;
    studentId?: string;
    caregiverId?: string;
    signerName: string;
    signerRelationship?: string;
    guardianAuthorityConfirmed: boolean;
  }) => void;
  /** Get signatures for a specific student. */
  signaturesForStudent: (studentId: string) => import("./types").WaiverSignature[];
  /** Check if a student has outstanding required waivers. */
  hasOutstandingWaivers: (studentId: string) => boolean;
}

const WaiversContext = createContext<WaiversCtx | null>(null);

export function WaiversProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isDemo = user?.isDemo === true;
  const { data: supabaseTemplates = [] } = useSupabaseWaiverTemplates(isDemo);
  const { data: supabaseVersions = [] } = useSupabaseWaiverVersions(isDemo);
  const { data: supabaseSignatures = [] } = useSupabaseWaiverSignatures(isDemo);
  const [templates, setTemplates] = useState<import("./types").WaiverTemplate[]>([]);
  const [versions, setVersions] = useState<import("./types").WaiverVersion[]>([]);
  const [signatures, setSignatures] = useState<import("./types").WaiverSignature[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => { setTemplates(supabaseTemplates); }, [supabaseTemplates]);
  useEffect(() => { setVersions(supabaseVersions); }, [supabaseVersions]);
  useEffect(() => { setSignatures(supabaseSignatures); }, [supabaseSignatures]);

  const addTemplateMut = useAddWaiverTemplate();
  const updateTemplateMut = useUpdateWaiverTemplate();
  const createVersionMut = useCreateWaiverVersion();
  const signWaiverMut = useSignWaiver();

  const addTemplate = useCallback((t: Omit<import("./types").WaiverTemplate, "id" | "studioId" | "createdAt" | "updatedAt">) => {
    const tempId = `wtmp_${Date.now()}`;
    const optimistic = { ...t, id: tempId, studioId: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setTemplates((prev) => [optimistic, ...prev]);
    addTemplateMut.mutate(t, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["waiver_templates"] }),
      onError: () => setTemplates((prev) => prev.filter((x) => x.id !== tempId)),
    });
  }, [addTemplateMut, queryClient]);

  const updateTemplate = useCallback((id: string, patch: Partial<import("./types").WaiverTemplate>) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t)));
    updateTemplateMut.mutate({ id, patch }, {
      onError: () => queryClient.invalidateQueries({ queryKey: ["waiver_templates"] }),
    });
  }, [updateTemplateMut, queryClient]);

  const createVersion = useCallback((templateId: string, bodyMarkdown: string, publish?: boolean) => {
    createVersionMut.mutate({ templateId, bodyMarkdown, publish }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["waiver_versions"] });
        queryClient.invalidateQueries({ queryKey: ["waiver_templates"] });
      },
    });
  }, [createVersionMut, queryClient]);

  const signWaiver = useCallback((sig: {
    waiverTemplateId: string; waiverVersionId: string; studentId?: string;
    caregiverId?: string; signerName: string; signerRelationship?: string;
    guardianAuthorityConfirmed: boolean;
  }) => {
    const optimisticId = `ws_${Date.now()}`;
    const now = new Date().toISOString();
    const optimistic: import("./types").WaiverSignature = {
      id: optimisticId, studioId: "", waiverTemplateId: sig.waiverTemplateId,
      waiverVersionId: sig.waiverVersionId, studentId: sig.studentId,
      caregiverId: sig.caregiverId, signerName: sig.signerName,
      signerRelationship: sig.signerRelationship, signatureType: "typed",
      guardianAuthorityConfirmed: sig.guardianAuthorityConfirmed,
      eSignConsent: true, signedAt: now, status: "signed",
    };
    setSignatures((prev) => [optimistic, ...prev]);
    signWaiverMut.mutate({ ...sig, eSignConsent: true }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["waiver_signatures"] });
        queryClient.invalidateQueries({ queryKey: ["students"] });
      },
      onError: () => setSignatures((prev) => prev.filter((x) => x.id !== optimisticId)),
    });
  }, [signWaiverMut, queryClient]);

  const signaturesForStudent = useCallback((studentId: string) =>
    signatures.filter((s) => s.studentId === studentId && s.status === "signed"), [signatures]);

  const hasOutstandingWaivers = useCallback((studentId: string) => {
    const required = templates.filter((t) => t.status === "published" && t.required);
    return required.some((t) => !signatures.some(
      (s) => s.waiverTemplateId === t.id && s.studentId === studentId && s.status === "signed"
    ));
  }, [templates, signatures]);

  const ctx = useMemo((): WaiversCtx => ({
    templates, versions, signatures,
    addTemplate, updateTemplate, createVersion, signWaiver,
    signaturesForStudent, hasOutstandingWaivers,
  }), [templates, versions, signatures, addTemplate, updateTemplate, createVersion, signWaiver, signaturesForStudent, hasOutstandingWaivers]);

  return <WaiversContext.Provider value={ctx}>{children}</WaiversContext.Provider>;
}

export function useWaivers() {
  const ctx = useContext(WaiversContext);
  if (!ctx) throw new Error("useWaivers must be used within WaiversProvider");
  return ctx;
}

/* ── Shared uploaded documents state ──────────────────────────────────── */

interface DocumentsCtx {
  documents: import("./types").UploadedDocument[];
  addDocument: (doc: Omit<import("./types").UploadedDocument, "id" | "studioId" | "uploadedAt" | "createdAt" | "updatedAt">) => void;
  verifyDocument: (id: string, status: "verified" | "rejected", verifiedBy?: string) => void;
  documentsForStudent: (studentId: string) => import("./types").UploadedDocument[];
  expiringDocuments: () => import("./types").UploadedDocument[];
}

const DocumentsContext = createContext<DocumentsCtx | null>(null);

export function DocumentsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isDemo = user?.isDemo === true;
  const { data: supabaseDocs = [] } = useSupabaseUploadedDocuments(isDemo);
  const [docs, setDocs] = useState<import("./types").UploadedDocument[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => { setDocs(supabaseDocs); }, [supabaseDocs]);

  const addDocMut = useAddUploadedDocument();
  const verifyMut = useVerifyDocument();

  const addDocument = useCallback((doc: Omit<import("./types").UploadedDocument, "id" | "studioId" | "uploadedAt" | "createdAt" | "updatedAt">) => {
    const tempId = `udd_${Date.now()}`;
    const now = new Date().toISOString();
    const optimistic = { ...doc, id: tempId, studioId: "", uploadedAt: now, createdAt: now, updatedAt: now };
    setDocs((prev) => [optimistic, ...prev]);
    addDocMut.mutate(doc, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["uploaded_documents"] }),
      onError: () => setDocs((prev) => prev.filter((x) => x.id !== tempId)),
    });
  }, [addDocMut, queryClient]);

  const verifyDocument = useCallback((id: string, status: "verified" | "rejected", verifiedBy?: string) => {
    setDocs((prev) => prev.map((d) => d.id === id ? { ...d, verificationStatus: status, verifiedBy, verifiedAt: new Date().toISOString() } : d));
    verifyMut.mutate({ id, status, verifiedBy }, {
      onError: () => queryClient.invalidateQueries({ queryKey: ["uploaded_documents"] }),
    });
  }, [verifyMut, queryClient]);

  const documentsForStudent = useCallback((studentId: string) =>
    docs.filter((d) => d.studentId === studentId), [docs]);

  const expiringDocuments = useCallback(() => {
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    return docs.filter((d) => d.expiryDate && new Date(d.expiryDate) < thirtyDays);
  }, [docs]);

  const ctx = useMemo((): DocumentsCtx => ({
    documents: docs, addDocument, verifyDocument, documentsForStudent, expiringDocuments,
  }), [docs, addDocument, verifyDocument, documentsForStudent, expiringDocuments]);

  return <DocumentsContext.Provider value={ctx}>{children}</DocumentsContext.Provider>;
}

export function useDocuments() {
  const ctx = useContext(DocumentsContext);
  if (!ctx) throw new Error("useDocuments must be used within DocumentsProvider");
  return ctx;
}
