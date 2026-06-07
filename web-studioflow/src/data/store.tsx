import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "./studioStore";
import { classes as demoClasses } from "./demo";
import type { Announcement, ClassStyle, Teacher, Student, Class, Invoice, ParentAccount, Enrolment, Costume, CostumeAssignment, StudentMeasurement, SizingChart, SizeRecommendation, CostumeFee, VendorOrder, Alteration, CostumeDistribution, ReusableCostume, CostumeRental, QuickChangeConflict } from "./types";
import { getMeasurementHistory, getStudentsWithStaleMeasurements } from "@/lib/measurements";
import { useOptionalMigration } from "./migrationStore";
import {
  useSupabaseTeachers,
  useSupabaseClasses,
  useSupabaseStudents,
  useSupabaseAnnouncements,
  useSupabaseInvoices,
  useSupabaseEnrolments,
  useSupabaseWaiverTemplates,
  useSupabaseWaiverVersions,
  useSupabaseWaiverSignatures,
  useSupabaseUploadedDocuments,
  useSupabaseCostumes,
  useSupabaseCostumeAssignments,
  useSupabaseStudentMeasurements,
  useSupabaseSizingCharts,
  useSupabaseSizeRecommendations,
  useSupabaseCostumeFees,
  useSupabaseVendorOrders,
  useSupabaseAlterations,
  useSupabaseCostumeDistributions,
  useSupabaseReusableCostumes,
  useSupabaseCostumeRentals,
  useSupabaseQuickChangeConflicts,
  useAddCostume,
  useUpdateCostume,
  useDeleteCostume,
  useAddMeasurement,
  useUpdateMeasurement,
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
  useAddWaiverTemplate,
  useUpdateWaiverTemplate,
  useCreateWaiverVersion,
  useSignWaiver,
  useAddUploadedDocument,
  useVerifyDocument,
  useAddSizingChart,
  useDeleteSizingChart,
  useAddSizeRecommendation,
  useAddVendorOrder,
  useAddCostumeDistribution,
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
  const enrolInitialSyncDone = useRef(false);

  useEffect(() => {
    // Demo mode: sync once on initial load, then preserve local edits
    // Real mode: always sync from Supabase after mutations
    if (!enrolInitialSyncDone.current || !isDemo) {
      setEnrolments(supabaseEnrolments);
      enrolInitialSyncDone.current = true;
    }
  }, [supabaseEnrolments, isDemo]);

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
  const teacherInitialSyncDone = useRef(false);

  // Demo mode: sync once on initial load, then preserve local edits
  // Real mode: always sync from Supabase after mutations
  useEffect(() => {
    if (!teacherInitialSyncDone.current || !isDemo) {
      setTeachers(supabaseTeachers);
      teacherInitialSyncDone.current = true;
    }
  }, [supabaseTeachers, isDemo]);

  const addTeacherMut = useAddTeacher();
  const updateTeacherMut = useUpdateTeacher();
  const removeTeacherMut = useRemoveTeacher();

  const addTeacher = useCallback((t: Omit<Teacher, "id" | "studioId">) => {
    const tempId = `t${Date.now()}`;
    const optimistic: Teacher = { ...t, id: tempId, studioId: "" };
    setTeachers((prev) => [...prev, optimistic]);
    if (isDemo) return;
    addTeacherMut.mutate(t, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teachers"] }),
      onError: () => {
        setTeachers((prev) => prev.filter((x) => x.id !== tempId));
      },
    });
  }, [addTeacherMut, queryClient, isDemo]);

  const removeTeacher = useCallback((id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    if (isDemo) return;
    removeTeacherMut.mutate(id, {
      onError: () => queryClient.invalidateQueries({ queryKey: ["teachers"] }),
    });
  }, [removeTeacherMut, queryClient, isDemo]);

  const updateTeacher = useCallback((id: string, patch: Partial<Omit<Teacher, "id" | "studioId">>) => {
    setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    if (isDemo) return;
    updateTeacherMut.mutate({ id, patch }, {
      onError: () => queryClient.invalidateQueries({ queryKey: ["teachers"] }),
    });
  }, [updateTeacherMut, queryClient, isDemo]);

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
  const classInitialSyncDone = useRef(false);

  // Demo mode: sync once on initial load, then preserve local edits
  // Real mode: always sync from Supabase after mutations
  useEffect(() => {
    if (!classInitialSyncDone.current || !isDemo) {
      setClasses(supabaseClasses);
      classInitialSyncDone.current = true;
    }
  }, [supabaseClasses, isDemo]);

  const addClassMut = useAddClass();
  const updateClassMut = useUpdateClass();
  const removeClassMut = useRemoveClass();

  const addClass = useCallback((c: Omit<Class, "id" | "studioId">) => {
    const tempId = `c${Date.now()}`;
    const optimistic: Class = { ...c, id: tempId, studioId: "" };
    setClasses((prev) => [optimistic, ...prev]);
    if (isDemo) return;
    addClassMut.mutate(c, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
      onError: () => {
        setClasses((prev) => prev.filter((x) => x.id !== tempId));
      },
    });
  }, [addClassMut, queryClient, isDemo]);

  const removeClass = useCallback((id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    if (isDemo) return;
    removeClassMut.mutate(id, {
      onError: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
    });
  }, [removeClassMut, queryClient, isDemo]);

  const updateClass = useCallback((id: string, patch: Partial<Omit<Class, "id" | "studioId">>) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    if (isDemo) return;
    updateClassMut.mutate({ id, patch }, {
      onError: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
    });
  }, [updateClassMut, queryClient, isDemo]);

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
  addStudent: (s: Omit<Student, "id" | "studioId">) => string;
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

  const addStudent = useCallback((s: Omit<Student, "id" | "studioId">): string => {
    const tempId = `s${Date.now()}`;
    const optimistic: Student = { ...s, id: tempId, studioId: "" };
    setStudents((prev) => [...prev, optimistic]);

    // Demo mode: keep optimistic entry — no Supabase table to persist to
    if (isDemo) return tempId;

    addStudentMut.mutate(s, {
      onSuccess: (data) => {
        // Replace optimistic ID with the real Supabase ID
        setStudents((prev) =>
          prev.map((x) => (x.id === tempId ? { ...x, id: data.id, studioId: data.studioId } : x)),
        );
        queryClient.invalidateQueries({ queryKey: ["students"] });
      },
      onError: () => {
        setStudents((prev) => prev.filter((x) => x.id !== tempId));
      },
    });
    return tempId;
  }, [addStudentMut, queryClient, isDemo]);

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
    const mergedCaregivers: ParentAccount[] = migration
      ? [...([] as ParentAccount[]), ...migration.importedCaregivers]
      : [];
    return {
      studio,
      classes: mergedClasses,
      teachers: mergedTeachers,
      students: mergedStudents,
      caregivers: mergedCaregivers,
      announcements: anns,
      invoices: invs,
      revenueSeries: [] as { month: string; revenueCents: number; enrollments: number }[],
    };
  }, [studio, teachers, classes, students, anns, invs, migration?.importedStudents, migration?.importedClasses, migration?.importedTeachers, migration?.importedCaregivers]);
}

// Re-export StudioProvider, useStudio, useTerminology so existing imports from "@/data/store" keep working
export { StudioProvider, useStudio, useTerminology, useOnboarding } from "./studioStore";

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
  // Dance
  Ballet: { dot: "bg-rose", chip: "bg-rose/10 text-rose" },
  Jazz: { dot: "bg-gold", chip: "bg-gold/15 text-gold" },
  "Hip Hop": { dot: "bg-plum", chip: "bg-plum/10 text-plum" },
  Contemporary: { dot: "bg-teal", chip: "bg-teal/10 text-teal" },
  Tap: { dot: "bg-foreground", chip: "bg-foreground/10 text-foreground" },
  Lyrical: { dot: "bg-rose", chip: "bg-rose/10 text-rose" },
  Acro: { dot: "bg-teal", chip: "bg-teal/10 text-teal" },
  // Yoga
  Vinyasa: { dot: "bg-teal", chip: "bg-teal/10 text-teal" },
  Hatha: { dot: "bg-foreground", chip: "bg-foreground/10 text-foreground" },
  Yin: { dot: "bg-plum", chip: "bg-plum/10 text-plum" },
  Restorative: { dot: "bg-gold", chip: "bg-gold/15 text-gold" },
  "Power Yoga": { dot: "bg-rose", chip: "bg-rose/10 text-rose" },
  // CrossFit / Gym
  Strength: { dot: "bg-rose", chip: "bg-rose/10 text-rose" },
  Conditioning: { dot: "bg-teal", chip: "bg-teal/10 text-teal" },
  "Olympic Lifting": { dot: "bg-gold", chip: "bg-gold/15 text-gold" },
  Gymnastics: { dot: "bg-plum", chip: "bg-plum/10 text-plum" },
  Mobility: { dot: "bg-foreground", chip: "bg-foreground/10 text-foreground" },
  // Martial Arts
  Beginner: { dot: "bg-teal", chip: "bg-teal/10 text-teal" },
  Intermediate: { dot: "bg-gold", chip: "bg-gold/15 text-gold" },
  Advanced: { dot: "bg-rose", chip: "bg-rose/10 text-rose" },
  Sparring: { dot: "bg-plum", chip: "bg-plum/10 text-plum" },
  "Grading Prep": { dot: "bg-foreground", chip: "bg-foreground/10 text-foreground" },
  // Music
  Piano: { dot: "bg-foreground", chip: "bg-foreground/10 text-foreground" },
  Guitar: { dot: "bg-gold", chip: "bg-gold/15 text-gold" },
  Voice: { dot: "bg-rose", chip: "bg-rose/10 text-rose" },
  Violin: { dot: "bg-plum", chip: "bg-plum/10 text-plum" },
  Drums: { dot: "bg-teal", chip: "bg-teal/10 text-teal" },
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

/* ── Shared costumes state ──────────────────────────────────────────────── */

interface CostumesCtx {
  costumes: Costume[];
  assignments: CostumeAssignment[];
  measurements: StudentMeasurement[];
  sizingCharts: SizingChart[];
  sizeRecommendations: SizeRecommendation[];
  costumeFees: CostumeFee[];
  vendorOrders: VendorOrder[];
  alterations: Alteration[];
  distributions: CostumeDistribution[];
  reusableInventory: ReusableCostume[];
  rentals: CostumeRental[];
  quickChangeConflicts: QuickChangeConflict[];
  /** Get all costumes assigned to a specific class. */
  costumesForClass: (classId: string) => Costume[];
  /** Get all costumes assigned to a specific student. */
  costumesForStudent: (studentId: string) => Costume[];
  /** Get the size recommendation for a student+costume pair. */
  sizeRecForStudentCostume: (studentId: string, costumeId: string) => SizeRecommendation | undefined;
  /** Get measurement for a student. */
  measurementForStudent: (studentId: string) => StudentMeasurement | undefined;
  /** Get all measurements for a student (history), newest first. */
  measurementHistory: (studentId: string) => StudentMeasurement[];
  /** Get students missing measurements (no approved record). */
  studentsMissingMeasurements: (allStudentIds: string[]) => string[];
  /** Get students with stale (>12 months) approved measurements. */
  studentsWithStaleMeasurements: (allStudentIds: string[]) => string[];
  /** Get fees for a student. */
  feesForStudent: (studentId: string) => CostumeFee[];
  /** Get alteration count by status. */
  alterationCountByStatus: (status: Alteration["status"]) => number;
  /** Get outstanding costume fee totals by status. */
  outstandingFeeTotal: () => number;
  /** Get number of costumes with quick-change conflicts. */
  quickChangeConflictCount: () => number;
  /** Get orders by status. */
  ordersByStatus: (status: VendorOrder["status"]) => VendorOrder[];
  /** Add a new costume. */
  addCostume: (c: Omit<Costume, "id" | "studioId" | "createdAt" | "updatedAt" | "retailCostCents">) => Promise<string>;
  /** Update an existing costume. */
  updateCostume: (id: string, patch: Partial<Costume>) => Promise<void>;
  /** Delete a costume (with confirmation). */
  deleteCostume: (id: string) => Promise<void>;
  /** Duplicate a costume. */
  duplicateCostume: (id: string) => Promise<string>;
  /** Submit a measurement (draft or pending for approval). */
  submitMeasurement: (m: Omit<StudentMeasurement, "id" | "studioId" | "createdAt"> & { id?: string }) => Promise<string>;
  /** Add a sizing chart. */
  addSizingChart: (c: Omit<SizingChart, "id" | "studioId" | "createdAt">) => Promise<void>;
  /** Delete a sizing chart. */
  deleteSizingChart: (id: string) => void;
  /** Add a size recommendation (from auto-sizing engine). */
  addSizeRecommendation: (r: Omit<SizeRecommendation, "id" | "studioId" | "createdAt" | "updatedAt">) => Promise<void>;
  /** Add a vendor order. */
  addVendorOrder: (o: Omit<VendorOrder, "id" | "studioId" | "createdAt" | "updatedAt">) => Promise<void>;
  /** Add a costume distribution record. */
  addDistribution: (d: Omit<CostumeDistribution, "id" | "studioId" | "createdAt">) => Promise<void>;
}

export const CostumesContext = createContext<CostumesCtx | null>(null);

export function CostumesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isDemo = user?.isDemo === true;
  const { data: supabaseCostumes = [] } = useSupabaseCostumes(isDemo);
  const { data: supabaseAssignments = [] } = useSupabaseCostumeAssignments(isDemo);
  const { data: supabaseMeasurements = [] } = useSupabaseStudentMeasurements(isDemo);
  const { data: supabaseSizingCharts = [] } = useSupabaseSizingCharts(isDemo);
  const { data: supabaseSizeRecs = [] } = useSupabaseSizeRecommendations(isDemo);
  const { data: supabaseFees = [] } = useSupabaseCostumeFees(isDemo);
  const { data: supabaseOrders = [] } = useSupabaseVendorOrders(isDemo);
  const { data: supabaseAlterations = [] } = useSupabaseAlterations(isDemo);
  const { data: supabaseDistributions = [] } = useSupabaseCostumeDistributions(isDemo);
  const { data: supabaseReusable = [] } = useSupabaseReusableCostumes(isDemo);
  const { data: supabaseRentals = [] } = useSupabaseCostumeRentals(isDemo);
  const { data: supabaseQuickChange = [] } = useSupabaseQuickChangeConflicts(isDemo);

  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [assignments, setAssignments] = useState<CostumeAssignment[]>([]);
  const [measurements, setMeasurements] = useState<StudentMeasurement[]>([]);
  const [sizingCharts] = useState<SizingChart[]>(supabaseSizingCharts);
  const [sizeRecommendations] = useState<SizeRecommendation[]>(supabaseSizeRecs);
  const [costumeFees] = useState<CostumeFee[]>(supabaseFees);
  const [vendorOrders] = useState<VendorOrder[]>(supabaseOrders);
  const [alterations] = useState<Alteration[]>(supabaseAlterations);
  const [distributions] = useState<CostumeDistribution[]>(supabaseDistributions);
  const [reusableInventory] = useState<ReusableCostume[]>(supabaseReusable);
  const [rentals] = useState<CostumeRental[]>(supabaseRentals);
  const [quickChangeConflicts] = useState<QuickChangeConflict[]>(supabaseQuickChange);

  useEffect(() => { setCostumes(supabaseCostumes); }, [supabaseCostumes]);
  useEffect(() => { setAssignments(supabaseAssignments); }, [supabaseAssignments]);
  useEffect(() => { setMeasurements(supabaseMeasurements); }, [supabaseMeasurements]);

  const addCostumeMutation = useAddCostume();
  const updateCostumeMutation = useUpdateCostume();
  const deleteCostumeMutation = useDeleteCostume();
  const addMeasurementMutation = useAddMeasurement();
  const updateMeasurementMutation = useUpdateMeasurement();
  const addSizingChartMutation = useAddSizingChart();
  const deleteSizingChartMutation = useDeleteSizingChart();
  const addSizeRecMutation = useAddSizeRecommendation();
  const addVendorOrderMutation = useAddVendorOrder();
  const addDistributionMutation = useAddCostumeDistribution();

  const addCostume = useCallback(async (c: Omit<Costume, "id" | "studioId" | "createdAt" | "updatedAt" | "retailCostCents">): Promise<string> => {
    if (isDemo) {
      const id = `cos_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      const retail = Math.round((c.wholesaleCostCents + c.shippingAllocationCents) * (1 + c.markupPct / 100));
      const newCostume: Costume = { ...c, id, studioId: "demo", retailCostCents: retail, createdAt: now, updatedAt: now } as Costume;
      setCostumes((prev) => [newCostume, ...prev]);
      return id;
    }
    await addCostumeMutation.mutateAsync(c);
    return "";
  }, [isDemo, addCostumeMutation]);

  const updateCostume = useCallback(async (id: string, patch: Partial<Costume>): Promise<void> => {
    if (isDemo) {
      setCostumes((prev) => prev.map((c) => c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c));
      return;
    }
    await updateCostumeMutation.mutateAsync({ id, patch: patch as Omit<Costume, "id" | "studioId" | "createdAt" | "updatedAt" | "retailCostCents"> & Partial<Pick<Costume, "id" | "studioId" | "createdAt" | "updatedAt">> });
  }, [isDemo, updateCostumeMutation]);

  const deleteCostume = useCallback(async (id: string): Promise<void> => {
    if (isDemo) {
      setCostumes((prev) => prev.filter((c) => c.id !== id));
      return;
    }
    await deleteCostumeMutation.mutateAsync(id);
  }, [isDemo, deleteCostumeMutation]);

  const duplicateCostume = useCallback(async (id: string): Promise<string> => {
    const source = costumes.find((c) => c.id === id);
    if (!source) throw new Error("Costume not found");
    const { id: _sid, studioId: _sst, createdAt: _sca, updatedAt: _sup, retailCostCents: _sret, ...rest } = source;
    return addCostume({
      ...rest,
      name: `${source.name} (Copy)`,
      sku: source.sku ? `${source.sku}-COPY` : undefined,
    });
  }, [costumes, addCostume]);

  const addSizingChart = useCallback(async (c: Omit<SizingChart, "id" | "studioId" | "createdAt">): Promise<void> => {
    if (isDemo) {
      const id = `sc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date().toISOString();
      const newChart: SizingChart = { ...c, id, studioId: "demo", createdAt: now };
      (setSizingCharts as (val: React.SetStateAction<SizingChart[]>) => void)((prev: SizingChart[]) => [newChart, ...prev]);
      return;
    }
    await addSizingChartMutation.mutateAsync(c);
  }, [isDemo, addSizingChartMutation]);

  const deleteSizingChart = useCallback((id: string) => {
    if (isDemo) {
      (setSizingCharts as (val: React.SetStateAction<SizingChart[]>) => void)((prev: SizingChart[]) => prev.filter((x: SizingChart) => x.id !== id));
      return;
    }
    deleteSizingChartMutation.mutate(id);
  }, [isDemo, deleteSizingChartMutation]);

  const addSizeRecommendation = useCallback(async (r: Omit<SizeRecommendation, "id" | "studioId" | "createdAt" | "updatedAt">): Promise<void> => {
    if (isDemo) {
      const id = `sr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date().toISOString();
      const newRec: SizeRecommendation = { ...r, id, studioId: "demo", createdAt: now, updatedAt: now };
      (setSizeRecs as (val: React.SetStateAction<SizeRecommendation[]>) => void)((prev: SizeRecommendation[]) => [newRec, ...prev]);
      return;
    }
    await addSizeRecMutation.mutateAsync(r);
  }, [isDemo, addSizeRecMutation]);

  const addVendorOrder = useCallback(async (o: Omit<VendorOrder, "id" | "studioId" | "createdAt" | "updatedAt">): Promise<void> => {
    if (isDemo) {
      const id = `vo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date().toISOString();
      const newOrder: VendorOrder = { ...o, id, studioId: "demo", createdAt: now, updatedAt: now };
      (setVendorOrders as (val: React.SetStateAction<VendorOrder[]>) => void)((prev: VendorOrder[]) => [newOrder, ...prev]);
      return;
    }
    await addVendorOrderMutation.mutateAsync(o);
  }, [isDemo, addVendorOrderMutation]);

  const addDistribution = useCallback(async (d: Omit<CostumeDistribution, "id" | "studioId" | "createdAt">): Promise<void> => {
    if (isDemo) {
      const id = `cd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date().toISOString();
      const newDist: CostumeDistribution = { ...d, id, studioId: "demo", createdAt: now };
      (setDistributions as (val: React.SetStateAction<CostumeDistribution[]>) => void)((prev: CostumeDistribution[]) => [newDist, ...prev]);
      return;
    }
    await addDistributionMutation.mutateAsync(d);
  }, [isDemo, addDistributionMutation]);

  const submitMeasurement = useCallback(async (
    m: Omit<StudentMeasurement, "id" | "studioId" | "createdAt"> & { id?: string },
  ): Promise<string> => {
    if (isDemo) {
      const now = new Date().toISOString();
      if (m.id) {
        setMeasurements((prev) => prev.map((x) =>
          x.id === m.id ? { ...x, ...m, updatedAt: now } as StudentMeasurement : x,
        ));
        return m.id;
      }
      const id = `sm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const newMeas: StudentMeasurement = { ...m, id, studioId: "demo", createdAt: now } as StudentMeasurement;
      setMeasurements((prev) => [newMeas, ...prev]);
      return id;
    }
    if (m.id) {
      const { id, ...patch } = m;
      await updateMeasurementMutation.mutateAsync({ id, patch });
      return id;
    }
    await addMeasurementMutation.mutateAsync(m);
    return "";
  }, [isDemo, addMeasurementMutation, updateMeasurementMutation]);

  const costumesForClass = useCallback((classId: string) => {
    const assignmentIds = new Set(assignments.filter((a) => a.classId === classId).map((a) => a.costumeId));
    return costumes.filter((c) => assignmentIds.has(c.id));
  }, [costumes, assignments]);

  const costumesForStudent = useCallback((studentId: string) => {
    const assignmentIds = new Set(assignments.filter((a) => a.studentId === studentId).map((a) => a.costumeId));
    return costumes.filter((c) => assignmentIds.has(c.id));
  }, [costumes, assignments]);

  const sizeRecForStudentCostume = useCallback((studentId: string, costumeId: string) =>
    sizeRecommendations.find((r) => r.studentId === studentId && r.costumeId === costumeId),
  [sizeRecommendations]);

  const measurementForStudent = useCallback((studentId: string) =>
    measurements.find((m) => m.studentId === studentId && m.status === "approved"),
  [measurements]);

  const measurementHistory = useCallback((studentId: string) =>
    getMeasurementHistory(studentId, measurements),
  [measurements]);

  const feesForStudent = useCallback((studentId: string) =>
    costumeFees.filter((f) => f.studentId === studentId),
  [costumeFees]);

  const alterationCountByStatus = useCallback((status: Alteration["status"]) =>
    alterations.filter((a) => a.status === status).length,
  [alterations]);

  const studentsMissingMeasurements = useCallback((allStudentIds: string[]) => {
    const measured = new Set(measurements.filter((m) => m.status === "approved").map((m) => m.studentId));
    return allStudentIds.filter((id) => !measured.has(id));
  }, [measurements]);

  const studentsWithStaleMeasurements = useCallback((allStudentIds: string[]) =>
    getStudentsWithStaleMeasurements(allStudentIds, measurements),
  [measurements]);

  const outstandingFeeTotal = useCallback(() =>
    costumeFees.filter((f) => f.status !== "paid" && f.status !== "waived")
      .reduce((sum, f) => sum + (f.totalCents - f.paidCents), 0),
  [costumeFees]);

  const quickChangeConflictCount = useCallback(() =>
    quickChangeConflicts.filter((q) => q.conflictDetected && !q.resolved).length,
  [quickChangeConflicts]);

  const ordersByStatus = useCallback((status: VendorOrder["status"]) =>
    vendorOrders.filter((o) => o.status === status),
  [vendorOrders]);

  const ctx = useMemo((): CostumesCtx => ({
    costumes, assignments, measurements, sizingCharts, sizeRecommendations,
    costumeFees, vendorOrders, alterations, distributions, reusableInventory,
    rentals, quickChangeConflicts,
    costumesForClass, costumesForStudent, sizeRecForStudentCostume,
    measurementForStudent, measurementHistory,
    studentsMissingMeasurements, studentsWithStaleMeasurements,
    feesForStudent, alterationCountByStatus,
    outstandingFeeTotal, quickChangeConflictCount,
    ordersByStatus,
    addCostume, updateCostume, deleteCostume, duplicateCostume, submitMeasurement,
    addSizingChart, deleteSizingChart, addSizeRecommendation, addVendorOrder, addDistribution,
  }), [costumes, assignments, measurements, sizingCharts, sizeRecommendations,
    costumeFees, vendorOrders, alterations, distributions, reusableInventory,
    rentals, quickChangeConflicts,
    costumesForClass, costumesForStudent, sizeRecForStudentCostume,
    measurementForStudent, measurementHistory,
    studentsMissingMeasurements, studentsWithStaleMeasurements,
    feesForStudent, alterationCountByStatus,
    outstandingFeeTotal, quickChangeConflictCount,
    ordersByStatus,
    addCostume, updateCostume, deleteCostume, duplicateCostume, submitMeasurement,
    addSizingChart, deleteSizingChart, addSizeRecommendation, addVendorOrder, addDistribution]);

  return <CostumesContext.Provider value={ctx}>{children}</CostumesContext.Provider>;
}

export function useCostumes() {
  const ctx = useContext(CostumesContext);
  if (!ctx) throw new Error("useCostumes must be used within CostumesProvider");
  return ctx;
}
