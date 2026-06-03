import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, authHeaders } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "@/data/store";
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

/** Try Supabase first, fall back to demo data. */
function useDualQuery<T>(key: string[], supabaseQuery: () => Promise<{ data: T[] | null; error: unknown }>, demoData: T[]) {
  return useQuery({
    queryKey: key,
    queryFn: async (): Promise<T[]> => {
      try {
        const { data, error } = await supabaseQuery();
        if (error) throw error;
        if (data && data.length > 0) return data as T[];
      } catch {
        // Supabase failed — fall back to demo
      }
      return demoData;
    },
    staleTime: 30_000,
  });
}

/* ── Studio ───────────────────────────────────────────────────── */

export function useSupabaseStudio() {
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
  );
}

/* ── Teachers ─────────────────────────────────────────────────── */

export function useSupabaseTeachers() {
  const studioId = useStudioId();
  return useDualQuery<Teacher>(
    ["teachers", studioId],
    async () => {
      const { data, error } = await supabase.from("teachers").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return { data: data.map((t) => ({ id: t.id, studioId: t.studio_id, name: t.name, styles: t.styles as Teacher["styles"], email: t.email, hourlyRateCents: t.hourly_rate_cents ?? undefined, payType: (t.pay_type as Teacher["payType"]) ?? undefined })), error: null };
    },
    demoTeachers,
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
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teachers"] }),
  });
}

/* ── Classes ──────────────────────────────────────────────────── */

export function useSupabaseClasses() {
  const studioId = useStudioId();
  return useDualQuery<Class>(
    ["classes", studioId],
    async () => {
      const { data, error } = await supabase.from("classes").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return { data: data.map((c) => ({ id: c.id, studioId: c.studio_id, name: c.name, style: c.style as Class["style"], ageGroup: (c.age_group as Class["ageGroup"]) ?? "Junior", day: (c.day as Class["day"]) ?? "Mon", startTime: c.start_time ?? "17:00", durationMins: c.duration_mins ?? 60, room: c.room ?? "Studio A", teacherId: c.teacher_id ?? "", capacity: c.capacity ?? 15, enrolled: c.enrolled ?? 0, waitlist: c.waitlist ?? 0, inRecital: c.in_recital ?? false, priceCents: c.price_cents ?? 9500 })), error: null };
    },
    demoClasses,
  );
}

/* ── Students ─────────────────────────────────────────────────── */

export function useSupabaseStudents() {
  const studioId = useStudioId();
  return useDualQuery<Student>(
    ["students", studioId],
    async () => {
      const { data, error } = await supabase.from("students").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return { data: data.map((s) => ({ id: s.id, studioId: s.studio_id, name: s.name, dob: s.dob ?? "", parentId: s.parent_id ?? "", parentName: s.parent_name ?? "", parentEmail: s.parent_email ?? "", classIds: s.class_ids ?? [], attendanceRate: s.attendance_rate ?? 1, waiver: (s.waiver as Student["waiver"]) ?? "missing", payment: (s.payment as Student["payment"]) ?? "paid", balanceCents: s.balance_cents ?? 0, medicalNotes: s.medical_notes ?? undefined, allergies: s.allergies ?? undefined })), error: null };
    },
    demoStudents,
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
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
  });
}

/* ── Announcements ────────────────────────────────────────────── */

export function useSupabaseAnnouncements() {
  const studioId = useStudioId();
  return useDualQuery<Announcement>(
    ["announcements", studioId],
    async () => {
      const { data, error } = await supabase.from("announcements").select("*").eq("studio_id", studioId).order("sent_at", { ascending: false });
      if (error || !data) return { data: null, error };
      return { data: data.map((a) => ({ id: a.id, studioId: a.studio_id, title: a.title, body: a.body ?? "", scope: (a.scope as Announcement["scope"]) ?? "Studio-wide", sentAt: a.sent_at ?? "", audience: a.audience ?? "", reach: a.reach ?? 0 })), error: null };
    },
    demoAnnouncements,
  );
}

/* ── Invoices ─────────────────────────────────────────────────── */

export function useSupabaseInvoices() {
  const studioId = useStudioId();
  return useDualQuery<Invoice>(
    ["invoices", studioId],
    async () => {
      const { data, error } = await supabase.from("invoices").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return { data: data.map((i) => ({ id: i.id, studioId: i.studio_id, studentName: i.student_name, parentName: i.parent_name ?? "", description: i.description ?? "", amountCents: i.amount_cents ?? 0, status: (i.status as Invoice["status"]) ?? "due", dueDate: i.due_date ?? "" })), error: null };
    },
    demoInvoices,
  );
}

/* ── Parents (Families) ───────────────────────────────────────── */

export function useSupabaseParents() {
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
