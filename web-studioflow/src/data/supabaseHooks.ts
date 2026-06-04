import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "@/data/studioStore";
import type { Studio, Teacher, Student, Class, Announcement, Invoice, ParentAccount, Enrolment, EnrolmentStatus } from "@/data/types";
import {
  announcements as demoAnnouncements,
  classes as demoClasses,
  students as demoStudents,
  teachers as demoTeachers,
  parentAccounts as demoParents,
  studio as defaultStudio,
  invoices as demoInvoices,
  enrolments as demoEnrolments,
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
      return { data: data.map((s) => ({
        id: s.id, studioId: s.studio_id, name: s.name, dob: s.dob ?? "",
        parentId: s.parent_id ?? "", parentName: s.parent_name ?? "", parentEmail: s.parent_email ?? "",
        classIds: s.class_ids ?? [], attendanceRate: s.attendance_rate ?? 1,
        waiver: (s.waiver as Student["waiver"]) ?? "missing",
        payment: (s.payment as Student["payment"]) ?? "paid",
        balanceCents: s.balance_cents ?? 0,
        medicalNotes: s.medical_notes ?? undefined, allergies: s.allergies ?? undefined,
        // New registration fields
        legalFirstName: s.legal_first_name ?? undefined,
        legalLastName: s.legal_last_name ?? undefined,
        preferredName: s.preferred_name ?? undefined,
        gender: s.gender ?? undefined,
        pronouns: s.pronouns ?? undefined,
        schoolGrade: s.school_grade ?? undefined,
        ageAtRegistration: undefined, // computed client-side
        emergencyContactName: s.emergency_contact_name ?? undefined,
        emergencyContactRelationship: s.emergency_contact_relationship ?? undefined,
        emergencyContactPhone: s.emergency_contact_phone ?? undefined,
        emergencyContactSecondaryPhone: s.emergency_contact_secondary_phone ?? undefined,
        emergencyContactCanPickup: s.emergency_contact_can_pickup ?? undefined,
        authorizedPickupContacts: (s.authorized_pickup_contacts as Student["authorizedPickupContacts"]) ?? undefined,
        medicalInfo: s.has_asthma != null || s.has_epipen != null ? {
          allergies: s.allergies ?? undefined,
          medications: s.medications ?? undefined,
          medicalConditions: s.medical_conditions ?? undefined,
          hasAsthma: s.has_asthma ?? false,
          hasInhaler: s.has_inhaler ?? false,
          hasEpiPen: s.has_epipen ?? false,
          activityRestrictions: s.activity_restrictions ?? undefined,
          safetyNotes: s.safety_notes ?? undefined,
        } : undefined,
        medicalInfoConfirmed: s.medical_info_confirmed ?? undefined,
        guardianConfirmed: s.guardian_confirmed ?? undefined,
        guardianRelationship: s.guardian_relationship ?? undefined,
        guardianId: s.guardian_id ?? undefined,
        consentTimestamp: s.consent_timestamp ?? undefined,
        waivers: s.waiver_liability != null ? {
          liability: (s.waiver_liability as "signed" | "pending" | "missing") ?? "missing",
          medicalConsent: (s.waiver_medical_consent as "signed" | "pending" | "missing") ?? "missing",
          photoVideo: (s.waiver_photo_video as "signed" | "pending" | "missing") ?? "missing",
          codeOfConduct: (s.waiver_code_of_conduct as "signed" | "pending" | "missing") ?? "missing",
          privacyData: (s.waiver_privacy_data as "signed" | "pending" | "missing") ?? "missing",
        } : undefined,
      })), error: null };
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
        // New registration fields
        legal_first_name: student.legalFirstName ?? null,
        legal_last_name: student.legalLastName ?? null,
        preferred_name: student.preferredName ?? null,
        gender: student.gender ?? null,
        pronouns: student.pronouns ?? null,
        school_grade: student.schoolGrade ?? null,
        emergency_contact_name: student.emergencyContactName ?? null,
        emergency_contact_relationship: student.emergencyContactRelationship ?? null,
        emergency_contact_phone: student.emergencyContactPhone ?? null,
        emergency_contact_secondary_phone: student.emergencyContactSecondaryPhone ?? null,
        emergency_contact_can_pickup: student.emergencyContactCanPickup ?? false,
        authorized_pickup_contacts: student.authorizedPickupContacts ?? null,
        medications: student.medicalInfo?.medications ?? null,
        medical_conditions: student.medicalInfo?.medicalConditions ?? null,
        has_asthma: student.medicalInfo?.hasAsthma ?? false,
        has_inhaler: student.medicalInfo?.hasInhaler ?? false,
        has_epipen: student.medicalInfo?.hasEpiPen ?? false,
        activity_restrictions: student.medicalInfo?.activityRestrictions ?? null,
        safety_notes: student.medicalInfo?.safetyNotes ?? null,
        medical_info_confirmed: student.medicalInfoConfirmed ?? false,
        guardian_confirmed: student.guardianConfirmed ?? false,
        guardian_relationship: student.guardianRelationship ?? null,
        guardian_id: student.guardianId ?? null,
        consent_timestamp: student.consentTimestamp ?? null,
        waiver_liability: student.waivers?.liability ?? "missing",
        waiver_medical_consent: student.waivers?.medicalConsent ?? "missing",
        waiver_photo_video: student.waivers?.photoVideo ?? "missing",
        waiver_code_of_conduct: student.waivers?.codeOfConduct ?? "missing",
        waiver_privacy_data: student.waivers?.privacyData ?? "missing",
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
      // New registration fields (update on patch)
      if (patch.legalFirstName !== undefined) updates.legal_first_name = patch.legalFirstName;
      if (patch.legalLastName !== undefined) updates.legal_last_name = patch.legalLastName;
      if (patch.preferredName !== undefined) updates.preferred_name = patch.preferredName;
      if (patch.gender !== undefined) updates.gender = patch.gender;
      if (patch.pronouns !== undefined) updates.pronouns = patch.pronouns;
      if (patch.schoolGrade !== undefined) updates.school_grade = patch.schoolGrade;
      if (patch.emergencyContactName !== undefined) updates.emergency_contact_name = patch.emergencyContactName;
      if (patch.emergencyContactRelationship !== undefined) updates.emergency_contact_relationship = patch.emergencyContactRelationship;
      if (patch.emergencyContactPhone !== undefined) updates.emergency_contact_phone = patch.emergencyContactPhone;
      if (patch.emergencyContactSecondaryPhone !== undefined) updates.emergency_contact_secondary_phone = patch.emergencyContactSecondaryPhone;
      if (patch.emergencyContactCanPickup !== undefined) updates.emergency_contact_can_pickup = patch.emergencyContactCanPickup;
      if (patch.authorizedPickupContacts !== undefined) updates.authorized_pickup_contacts = patch.authorizedPickupContacts;
      if (patch.medicalInfo?.allergies !== undefined) updates.allergies = patch.medicalInfo.allergies;
      if (patch.medicalInfo?.medications !== undefined) updates.medications = patch.medicalInfo.medications;
      if (patch.medicalInfo?.medicalConditions !== undefined) updates.medical_conditions = patch.medicalInfo.medicalConditions;
      if (patch.medicalInfo?.hasAsthma !== undefined) updates.has_asthma = patch.medicalInfo.hasAsthma;
      if (patch.medicalInfo?.hasInhaler !== undefined) updates.has_inhaler = patch.medicalInfo.hasInhaler;
      if (patch.medicalInfo?.hasEpiPen !== undefined) updates.has_epipen = patch.medicalInfo.hasEpiPen;
      if (patch.medicalInfo?.activityRestrictions !== undefined) updates.activity_restrictions = patch.medicalInfo.activityRestrictions;
      if (patch.medicalInfo?.safetyNotes !== undefined) updates.safety_notes = patch.medicalInfo.safetyNotes;
      if (patch.medicalInfoConfirmed !== undefined) updates.medical_info_confirmed = patch.medicalInfoConfirmed;
      if (patch.guardianConfirmed !== undefined) updates.guardian_confirmed = patch.guardianConfirmed;
      if (patch.guardianRelationship !== undefined) updates.guardian_relationship = patch.guardianRelationship;
      if (patch.guardianId !== undefined) updates.guardian_id = patch.guardianId;
      if (patch.consentTimestamp !== undefined) updates.consent_timestamp = patch.consentTimestamp;
      if (patch.waivers?.liability !== undefined) updates.waiver_liability = patch.waivers.liability;
      if (patch.waivers?.medicalConsent !== undefined) updates.waiver_medical_consent = patch.waivers.medicalConsent;
      if (patch.waivers?.photoVideo !== undefined) updates.waiver_photo_video = patch.waivers.photoVideo;
      if (patch.waivers?.codeOfConduct !== undefined) updates.waiver_code_of_conduct = patch.waivers.codeOfConduct;
      if (patch.waivers?.privacyData !== undefined) updates.waiver_privacy_data = patch.waivers.privacyData;
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

/* ── Enrolments (source of truth for student↔class relationships) ─── */

/** Fetch all enrolments for the active studio from Supabase.
 * For demo sessions, falls back to demo enrolments.
 * This is the canonical data source — class.enrolled and student.classIds
 * are DERIVED from this table, never manually maintained. */
export function useSupabaseEnrolments(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<Enrolment>(
    ["enrolments", studioId],
    async () => {
      const { data, error } = await supabase.from("enrolments").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return {
        data: data.map((e) => ({
          id: e.id,
          studioId: e.studio_id,
          studentId: e.student_id,
          classId: e.class_id,
          status: (e.status as EnrolmentStatus) ?? "active",
          startedAt: e.started_at ?? e.created_at ?? new Date().toISOString(),
          endedAt: e.ended_at ?? undefined,
          createdAt: e.created_at ?? new Date().toISOString(),
          updatedAt: e.updated_at ?? new Date().toISOString(),
        })),
        error: null,
      };
    },
    demoEnrolments,
    isDemo,
  );
}

/**
 * Enrol a student into a class by inserting a row into the enrolments table.
 *
 * If the class is at capacity, the enrolment is created with status "waitlisted".
 * Otherwise status is "active".
 *
 * The student.classIds array and class.enrolled count are no longer written
 * directly — they are DERIVED from this table.
 */
export function useEnrolStudent() {
  const queryClient = useQueryClient();
  const studioId = useStudioId();
  return useMutation({
    mutationFn: async ({
      studentId,
      classId,
      forceWaitlist,
    }: {
      studentId: string;
      classId: string;
      forceWaitlist?: boolean;
    }) => {
      // Check if already enrolled (any status)
      const { data: existing } = await supabase
        .from("enrolments")
        .select("id, status")
        .eq("student_id", studentId)
        .eq("class_id", classId)
        .maybeSingle();

      if (existing) {
        // If withdrawn, reactivate instead of duplicate
        if (existing.status === "withdrawn") {
          const { error } = await supabase
            .from("enrolments")
            .update({ status: "active", started_at: new Date().toISOString(), ended_at: null })
            .eq("id", existing.id);
          if (error) throw error;
          return;
        }
        return; // Already active or waitlisted — no-op
      }

      // Determine status: check class capacity
      let status: EnrolmentStatus = "active";
      if (forceWaitlist) {
        status = "waitlisted";
      } else {
        const { data: cls } = await supabase
          .from("classes")
          .select("capacity")
          .eq("id", classId)
          .single();
        if (cls) {
          const { count } = await supabase
            .from("enrolments")
            .select("*", { count: "exact", head: true })
            .eq("class_id", classId)
            .eq("status", "active");
          if (count !== null && count >= (cls.capacity ?? 99)) {
            status = "waitlisted";
          }
        }
      }

      const now = new Date().toISOString();
      const { error } = await supabase.from("enrolments").insert({
        studio_id: studioId,
        student_id: studentId,
        class_id: classId,
        status,
        started_at: now,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrolments"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

/**
 * Withdraw a student from a class by updating the enrolment status to "withdrawn".
 * Preserves history — the enrolment row is NOT deleted.
 * Sets ended_at to the current timestamp.
 */
export function useWithdrawStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, classId }: { studentId: string; classId: string }) => {
      const { data: enrolment, error: fetchErr } = await supabase
        .from("enrolments")
        .select("id")
        .eq("student_id", studentId)
        .eq("class_id", classId)
        .in("status", ["active", "waitlisted"])
        .maybeSingle();

      if (fetchErr || !enrolment) return; // Not enrolled — no-op

      const { error } = await supabase
        .from("enrolments")
        .update({ status: "withdrawn", ended_at: new Date().toISOString() })
        .eq("id", enrolment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrolments"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

/**
 * Promote a waitlisted enrolment to active (e.g. when a spot opens up).
 */
export function usePromoteEnrolment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enrolmentId: string) => {
      const { error } = await supabase
        .from("enrolments")
        .update({ status: "active", started_at: new Date().toISOString() })
        .eq("id", enrolmentId)
        .eq("status", "waitlisted");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrolments"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
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
      const insert: Record<string, unknown> = {
        studio_id: studioId,
        student_name: inv.studentName,
        parent_name: inv.parentName,
        description: inv.description,
        amount_cents: inv.amountCents,
        status: inv.status,
        due_date: inv.dueDate,
      };
      // Link to enrolment if provided (allows billing to reference the exact enrolment)
      if (inv.enrolmentId) {
        insert.enrolment_id = inv.enrolmentId;
      }
      const { data, error } = await supabase.from("invoices").insert(insert).select().single();
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
