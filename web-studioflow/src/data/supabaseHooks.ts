import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "@/data/studioStore";
import type { Studio, Teacher, Student, Class, Announcement, Invoice, ParentAccount } from "@/data/types";
import {
  announcements as demoAnnouncements,
  classes as demoClasses,
  students as demoStudents,
  teachers as demoTeachers,
  parentAccounts as demoParents,
  studio as defaultStudio,
  invoices as demoInvoices,
} from "@/data/demo";

/* ── Helpers ──────────────────────────────────────────────────── */

function useStudioId(): string {
  const { studio } = useStudio();
  return studio.id;
}

/**
 * Try Supabase first. Only fall back to demo data when:
 * 1. `isDemo` is true AND
 * 2. Supabase returned empty or errored.
 *
 * Real studios get empty arrays — never demo data.
 */
function useDualQuery<T>(
  key: string[],
  supabaseQuery: () => Promise<{ data: T[] | null; error: unknown }>,
  demoData: T[],
  isDemo: boolean,
) {
  return useQuery({
    queryKey: key,
    queryFn: async (): Promise<T[]> => {
      try {
        const { data, error } = await supabaseQuery();
        if (error) throw error;
        if (data && data.length > 0) return data as T[];
      } catch {
        // Supabase failed
      }
      // Only fall back to demo data for demo sessions
      return isDemo ? demoData : [];
    },
    staleTime: 30_000,
  });
}

/** Build a user-friendly error message from a Supabase error. */
function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Operation failed";
}

/* ── Studio ───────────────────────────────────────────────────── */

export function useSupabaseStudio(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<Studio>(
    ["studio", studioId],
    async () => {
      const { data, error } = await supabase
        .from("studios")
        .select("*")
        .eq("id", studioId)
        .single();
      if (error || !data) return { data: null, error };
      return { data: [{ id: data.id, name: data.name, tagline: data.tagline ?? "", city: data.city ?? "", brandColor: data.brand_color ?? "", initials: data.initials ?? "", logoUrl: data.logo_url ?? undefined, vertical: (data.vertical as Studio["vertical"]) ?? "dance" }], error: null };
    },
    [defaultStudio],
    isDemo,
  );
}

/* ── Teachers ─────────────────────────────────────────────────── */

export function useSupabaseTeachers(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<Teacher>(
    ["teachers", studioId],
    async () => {
      const { data, error } = await supabase.from("teachers").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return { data: data.map((t) => ({ id: t.id, studioId: t.studio_id, name: t.name, styles: t.styles as Teacher["styles"], email: t.email, hourlyRateCents: t.hourly_rate_cents ?? undefined, payType: (t.pay_type as Teacher["payType"]) ?? undefined })), error: null };
    },
    demoTeachers,
    isDemo,
  );
}

export function useAddTeacher() {
  const queryClient = useQueryClient();
  const studioId = useStudioId();
  return useMutation({
    mutationFn: async (teacher: Omit<Teacher, "id" | "studioId">) => {
      const { data, error } = await supabase.from("teachers").insert({
        studio_id: studioId,
        name: teacher.name,
        email: teacher.email,
        styles: teacher.styles,
        hourly_rate_cents: teacher.hourlyRateCents ?? 0,
        pay_type: teacher.payType ?? "employee",
      }).select().single();
      if (error) throw error;
      return { ...teacher, id: data.id, studioId };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teachers"] }),
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Omit<Teacher, "id" | "studioId">> }) => {
      const updates: Record<string, unknown> = {};
      if (patch.name !== undefined) updates.name = patch.name;
      if (patch.email !== undefined) updates.email = patch.email;
      if (patch.styles !== undefined) updates.styles = patch.styles;
      if (patch.hourlyRateCents !== undefined) updates.hourly_rate_cents = patch.hourlyRateCents;
      if (patch.payType !== undefined) updates.pay_type = patch.payType;
      const { error } = await supabase.from("teachers").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teachers"] }),
  });
}

export function useRemoveTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teachers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teachers"] }),
  });
}

/* ── Classes ──────────────────────────────────────────────────── */

export function useSupabaseClasses(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<Class>(
    ["classes", studioId],
    async () => {
      const { data, error } = await supabase.from("classes").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return { data: data.map((c) => ({ id: c.id, studioId: c.studio_id, name: c.name, style: c.style as Class["style"], ageGroup: (c.age_group as Class["ageGroup"]) ?? "Junior", day: (c.day as Class["day"]) ?? "Mon", startTime: c.start_time ?? "17:00", durationMins: c.duration_mins ?? 60, room: c.room ?? "Studio A", teacherId: c.teacher_id ?? "", capacity: c.capacity ?? 15, enrolled: c.enrolled ?? 0, waitlist: c.waitlist ?? 0, inRecital: c.in_recital ?? false, priceCents: c.price_cents ?? 9500 })), error: null };
    },
    demoClasses,
    isDemo,
  );
}

export function useAddClass() {
  const queryClient = useQueryClient();
  const studioId = useStudioId();
  return useMutation({
    mutationFn: async (c: Omit<Class, "id" | "studioId">) => {
      const { data, error } = await supabase.from("classes").insert({
        studio_id: studioId,
        name: c.name,
        style: c.style,
        age_group: c.ageGroup,
        day: c.day,
        start_time: c.startTime,
        duration_mins: c.durationMins,
        room: c.room,
        teacher_id: c.teacherId,
        capacity: c.capacity,
        enrolled: c.enrolled,
        waitlist: c.waitlist,
        in_recital: c.inRecital,
        price_cents: c.priceCents,
      }).select().single();
      if (error) throw error;
      return { ...c, id: data.id, studioId };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Omit<Class, "id" | "studioId">> }) => {
      const updates: Record<string, unknown> = {};
      if (patch.name !== undefined) updates.name = patch.name;
      if (patch.style !== undefined) updates.style = patch.style;
      if (patch.ageGroup !== undefined) updates.age_group = patch.ageGroup;
      if (patch.day !== undefined) updates.day = patch.day;
      if (patch.startTime !== undefined) updates.start_time = patch.startTime;
      if (patch.durationMins !== undefined) updates.duration_mins = patch.durationMins;
      if (patch.room !== undefined) updates.room = patch.room;
      if (patch.teacherId !== undefined) updates.teacher_id = patch.teacherId;
      if (patch.capacity !== undefined) updates.capacity = patch.capacity;
      if (patch.enrolled !== undefined) updates.enrolled = patch.enrolled;
      if (patch.waitlist !== undefined) updates.waitlist = patch.waitlist;
      if (patch.inRecital !== undefined) updates.in_recital = patch.inRecital;
      if (patch.priceCents !== undefined) updates.price_cents = patch.priceCents;
      const { error } = await supabase.from("classes").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useRemoveClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });
}

/* ── Students ─────────────────────────────────────────────────── */

export function useSupabaseStudents(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<Student>(
    ["students", studioId],
    async () => {
      const { data, error } = await supabase.from("students").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return { data: data.map((s) => ({ id: s.id, studioId: s.studio_id, name: s.name, dob: s.dob ?? "", parentId: s.parent_id ?? "", parentName: s.parent_name ?? "", parentEmail: s.parent_email ?? "", classIds: s.class_ids ?? [], attendanceRate: s.attendance_rate ?? 1, waiver: (s.waiver as Student["waiver"]) ?? "missing", payment: (s.payment as Student["payment"]) ?? "paid", balanceCents: s.balance_cents ?? 0, medicalNotes: s.medical_notes ?? undefined, allergies: s.allergies ?? undefined })), error: null };
    },
    demoStudents,
    isDemo,
  );
}

export function useAddStudent() {
  const queryClient = useQueryClient();
  const studioId = useStudioId();
  return useMutation({
    mutationFn: async (student: Omit<Student, "id" | "studioId">) => {
      const { data, error } = await supabase.from("students").insert({
        studio_id: studioId,
        name: student.name,
        dob: student.dob,
        parent_id: student.parentId,
        parent_name: student.parentName,
        parent_email: student.parentEmail,
        class_ids: student.classIds,
        attendance_rate: student.attendanceRate,
        waiver: student.waiver,
        payment: student.payment,
        balance_cents: student.balanceCents,
        medical_notes: student.medicalNotes ?? null,
        allergies: student.allergies ?? null,
      }).select().single();
      if (error) throw error;
      return { ...student, id: data.id, studioId };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Omit<Student, "id" | "studioId">> }) => {
      const updates: Record<string, unknown> = {};
      if (patch.name !== undefined) updates.name = patch.name;
      if (patch.dob !== undefined) updates.dob = patch.dob;
      if (patch.parentId !== undefined) updates.parent_id = patch.parentId;
      if (patch.parentName !== undefined) updates.parent_name = patch.parentName;
      if (patch.parentEmail !== undefined) updates.parent_email = patch.parentEmail;
      if (patch.classIds !== undefined) updates.class_ids = patch.classIds;
      if (patch.attendanceRate !== undefined) updates.attendance_rate = patch.attendanceRate;
      if (patch.waiver !== undefined) updates.waiver = patch.waiver;
      if (patch.payment !== undefined) updates.payment = patch.payment;
      if (patch.balanceCents !== undefined) updates.balance_cents = patch.balanceCents;
      if (patch.medicalNotes !== undefined) updates.medical_notes = patch.medicalNotes;
      if (patch.allergies !== undefined) updates.allergies = patch.allergies;
      const { error } = await supabase.from("students").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useRemoveStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
  });
}

/**
 * Enrol a student into a class. Updates student.classIds array AND
 * increments class.enrolled count atomically via Supabase RPC or
 * sequential updates. The caller (StudentsProvider) handles the
 * optimistic UI; this hook does the server persistence.
 */
/**
 * Update the enrolled count on a class row directly.
 * Reads current value then writes incremented/decremented count.
 */
async function adjustClassEnrolled(classId: string, delta: number) {
  const { data: cls, error: readErr } = await supabase
    .from("classes")
    .select("enrolled")
    .eq("id", classId)
    .single();
  if (readErr) {
    console.warn("Failed to read class enrolled count:", readErr);
    return;
  }
  const newCount = Math.max(0, (cls?.enrolled ?? 0) + delta);
  const { error: writeErr } = await supabase
    .from("classes")
    .update({ enrolled: newCount })
    .eq("id", classId);
  if (writeErr) {
    console.warn("Failed to update class enrolled count:", writeErr);
  }
}

export function useEnrolStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, classId }: { studentId: string; classId: string }) => {
      // 1. Fetch current student class_ids
      const { data: student, error: fetchErr } = await supabase
        .from("students")
        .select("class_ids")
        .eq("id", studentId)
        .single();
      if (fetchErr) throw fetchErr;

      const classIds: string[] = (student?.class_ids ?? []) as string[];
      if (classIds.includes(classId)) return; // already enrolled

      // 2. Update student
      const { error: updateErr } = await supabase
        .from("students")
        .update({ class_ids: [...classIds, classId] })
        .eq("id", studentId);
      if (updateErr) throw updateErr;

      // 3. Increment class enrolled count
      await adjustClassEnrolled(classId, 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

/** Withdraw a student from a class. Counterpart to useEnrolStudent. */
export function useWithdrawStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, classId }: { studentId: string; classId: string }) => {
      const { data: student, error: fetchErr } = await supabase
        .from("students")
        .select("class_ids")
        .eq("id", studentId)
        .single();
      if (fetchErr) throw fetchErr;

      const classIds: string[] = (student?.class_ids ?? []) as string[];
      if (!classIds.includes(classId)) return; // not enrolled

      const { error: updateErr } = await supabase
        .from("students")
        .update({ class_ids: classIds.filter((id) => id !== classId) })
        .eq("id", studentId);
      if (updateErr) throw updateErr;

      await adjustClassEnrolled(classId, -1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

/* ── Announcements ────────────────────────────────────────────── */

export function useSupabaseAnnouncements(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<Announcement>(
    ["announcements", studioId],
    async () => {
      const { data, error } = await supabase.from("announcements").select("*").eq("studio_id", studioId).order("sent_at", { ascending: false });
      if (error || !data) return { data: null, error };
      return { data: data.map((a) => ({ id: a.id, studioId: a.studio_id, title: a.title, body: a.body ?? "", scope: (a.scope as Announcement["scope"]) ?? "Studio-wide", sentAt: a.sent_at ?? "", audience: a.audience ?? "", reach: a.reach ?? 0 })), error: null };
    },
    demoAnnouncements,
    isDemo,
  );
}

export function useAddAnnouncement() {
  const queryClient = useQueryClient();
  const studioId = useStudioId();
  return useMutation({
    mutationFn: async (a: Omit<Announcement, "id" | "studioId" | "sentAt" | "reach"> & { sentAt: string; reach: number }) => {
      const { data, error } = await supabase.from("announcements").insert({
        studio_id: studioId,
        title: a.title,
        body: a.body,
        scope: a.scope,
        sent_at: a.sentAt,
        audience: a.audience,
        reach: a.reach,
      }).select().single();
      if (error) throw error;
      return { ...a, id: data.id, studioId };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

/* ── Invoices ─────────────────────────────────────────────────── */

export function useSupabaseInvoices(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<Invoice>(
    ["invoices", studioId],
    async () => {
      const { data, error } = await supabase.from("invoices").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return { data: data.map((i) => ({ id: i.id, studioId: i.studio_id, studentName: i.student_name, parentName: i.parent_name ?? "", description: i.description ?? "", amountCents: i.amount_cents ?? 0, status: (i.status as Invoice["status"]) ?? "due", dueDate: i.due_date ?? "" })), error: null };
    },
    demoInvoices,
    isDemo,
  );
}

export function useAddInvoice() {
  const queryClient = useQueryClient();
  const studioId = useStudioId();
  return useMutation({
    mutationFn: async (inv: Omit<Invoice, "id" | "studioId">) => {
      const { data, error } = await supabase.from("invoices").insert({
        studio_id: studioId,
        student_name: inv.studentName,
        parent_name: inv.parentName,
        description: inv.description,
        amount_cents: inv.amountCents,
        status: inv.status,
        due_date: inv.dueDate,
      }).select().single();
      if (error) throw error;
      return { ...inv, id: data.id, studioId };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Omit<Invoice, "id" | "studioId">> }) => {
      const updates: Record<string, unknown> = {};
      if (patch.studentName !== undefined) updates.student_name = patch.studentName;
      if (patch.parentName !== undefined) updates.parent_name = patch.parentName;
      if (patch.description !== undefined) updates.description = patch.description;
      if (patch.amountCents !== undefined) updates.amount_cents = patch.amountCents;
      if (patch.status !== undefined) updates.status = patch.status;
      if (patch.dueDate !== undefined) updates.due_date = patch.dueDate;
      const { error } = await supabase.from("invoices").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

/* ── Parents (Families) ───────────────────────────────────────── */

export function useSupabaseParents(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<ParentAccount>(
    ["parents", studioId],
    async () => {
      const { data, error } = await supabase.from("parents").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return {
        data: data.map((p) => {
          const nameParts = p.name.split(" ");
          const firstName = nameParts[0] ?? "";
          const lastName = nameParts.slice(1).join(" ") ?? "";
          return {
            id: p.id,
            studioId: p.studio_id,
            primaryContact: { firstName, lastName, relationshipToStudent: "Parent", email: p.email, phone: p.phone ?? "", address: p.address, city: p.city, state: p.state, zip: p.zip, receivesEmails: true, receivesSMS: true, receivesBilling: true, emergencyContact: true },
            primaryCaregiver: { id: `cg_primary_${p.id}`, first_name: firstName, last_name: lastName, relationship_to_student: "Parent", email: p.email, phone: p.phone ?? "", address: p.address ?? undefined, city: p.city ?? undefined, state: p.state ?? undefined, zip: p.zip ?? undefined, status: "active" as const, role: "primary_caregiver" as const, receives_announcements: true, receives_emergency_messages: true, can_view_schedule: true, can_view_billing: true, can_pay_invoices: true, can_manage_enrolments: true, can_sign_waivers: true, can_view_medical_notes: true, authorized_pickup: true },
            additionalCaregivers: [],
            childIds: p.child_ids ?? [],
          };
        }),
        error: null,
      };
    },
    demoParents,
    isDemo,
  );
}

/* ── Profile sync ─────────────────────────────────────────────── */

export function useSyncProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, email: user.email, name: user.name, avatar_url: user.picture, updated_at: new Date().toISOString() }, { onConflict: "id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });
}
