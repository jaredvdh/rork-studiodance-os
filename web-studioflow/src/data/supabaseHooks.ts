import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "@/data/studioStore";
import type { Studio, Teacher, Student, Class, Announcement, Invoice, ParentAccount, Enrolment, EnrolmentStatus, WaiverTemplate, WaiverVersion, WaiverSignature, UploadedDocument, Costume, CostumeAssignment, StudentMeasurement, SizingChart, SizeRecommendation, CostumeFee, VendorOrder, VendorOrderItem, Alteration, CostumeDistribution, ReusableCostume, CostumeRental, QuickChangeConflict } from "@/data/types";
import {
  getDemoAnnouncements,
  getDemoClasses,
  getDemoTeachers,
  getDemoStudio,
  getDemoRecitalEvents,
  announcements as demoAnnouncements,
  students as demoStudents,
  parentAccounts as demoParents,
  studio as defaultStudio,
  invoices as demoInvoices,
  waiverTemplates as demoWaiverTemplates,
  waiverVersions as demoWaiverVersions,
  waiverSignatures as demoWaiverSignatures,
  enrolments as demoEnrolments,
  uploadedDocuments as demoUploadedDocuments,
  costumes as demoCostumes,
  costumeAssignments as demoCostumeAssignments,
  studentMeasurements as demoStudentMeasurements,
  sizingCharts as demoSizingCharts,
  sizeRecommendations as demoSizeRecommendations,
  costumeFees as demoCostumeFees,
  vendorOrders as demoVendorOrders,
  alterations as demoAlterations,
  costumeDistributions as demoCostumeDistributions,
  reusableCostumes as demoReusableCostumes,
  costumeRentals as demoCostumeRentals,
  quickChangeConflicts as demoQuickChangeConflicts,
  classes as demoClasses,
  teachers as demoTeachers,
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
 *
 * When `isDemo` is true, skip the Supabase query entirely to avoid
 * 404 console noise from tables that haven't been migrated yet.
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
      // Demo sessions use seeded local data — skip the Supabase round-trip
      if (isDemo) return demoData;

      try {
        const { data, error } = await supabaseQuery();
        if (error) throw error;
        if (data && data.length > 0) return data as T[];
      } catch {
        // Supabase failed — real studios get empty arrays, never demo data
      }
      return [];
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
  const { studio: currentStudio } = useStudio();
  const demoStudio = getDemoStudio(currentStudio.vertical);
  return useDualQuery<Studio>(
    ["studio", studioId, currentStudio.vertical],
    async () => {
      const { data, error } = await supabase
        .from("studios")
        .select("*")
        .eq("id", studioId)
        .single();
      if (error || !data) return { data: null, error };
      return { data: [{ id: data.id, name: data.name, tagline: data.tagline ?? "", city: data.city ?? "", brandColor: data.brand_color ?? "", initials: data.initials ?? "", logoUrl: data.logo_url ?? undefined, vertical: (data.vertical as Studio["vertical"]) ?? "dance" }], error: null };
    },
    [demoStudio],
    isDemo,
  );
}

/* ── Teachers ─────────────────────────────────────────────────── */

export function useSupabaseTeachers(isDemo: boolean) {
  const studioId = useStudioId();
  const { studio: currentStudio } = useStudio();
  const vTeachers = getDemoTeachers(currentStudio.vertical);
  return useDualQuery<Teacher>(
    ["teachers", studioId, currentStudio.vertical],
    async () => {
      const { data, error } = await supabase.from("teachers").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return { data: data.map((t) => ({ id: t.id, studioId: t.studio_id, name: t.name, styles: t.styles as Teacher["styles"], email: t.email, hourlyRateCents: t.hourly_rate_cents ?? undefined, payType: (t.pay_type as Teacher["payType"]) ?? undefined })), error: null };
    },
    vTeachers,
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
  const { studio: currentStudio } = useStudio();
  const vClasses = getDemoClasses(currentStudio.vertical);
  return useDualQuery<Class>(
    ["classes", studioId, currentStudio.vertical],
    async () => {
      const { data, error } = await supabase.from("classes").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return { data: data.map((c) => ({ id: c.id, studioId: c.studio_id, name: c.name, style: c.style as Class["style"], ageGroup: (c.age_group as Class["ageGroup"]) ?? "Junior", day: (c.day as Class["day"]) ?? "Mon", startTime: c.start_time ?? "17:00", durationMins: c.duration_mins ?? 60, room: c.room ?? "Studio A", teacherId: c.teacher_id ?? "", capacity: c.capacity ?? 15, enrolled: c.enrolled ?? 0, waitlist: c.waitlist ?? 0, inRecital: c.in_recital ?? false, priceCents: c.price_cents ?? 9500 })), error: null };
    },
    vClasses,
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
        caregiverId: s.caregiver_id ?? "", caregiverName: s.caregiver_name ?? "", caregiverEmail: s.caregiver_email ?? "",
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
        caregiver_id: student.caregiverId,
        caregiver_name: student.caregiverName,
        caregiver_email: student.caregiverEmail,
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
      if (patch.caregiverId !== undefined) updates.caregiver_id = patch.caregiverId;
      if (patch.caregiverName !== undefined) updates.caregiver_name = patch.caregiverName;
      if (patch.caregiverEmail !== undefined) updates.caregiver_email = patch.caregiverEmail;
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
  const { studio: currentStudio } = useStudio();
  const vAnnouncements = getDemoAnnouncements(currentStudio.vertical);
  return useDualQuery<Announcement>(
    ["announcements", studioId, currentStudio.vertical],
    async () => {
      const { data, error } = await supabase.from("announcements").select("*").eq("studio_id", studioId).order("sent_at", { ascending: false });
      if (error || !data) return { data: null, error };
      return { data: data.map((a) => ({ id: a.id, studioId: a.studio_id, title: a.title, body: a.body ?? "", scope: (a.scope as Announcement["scope"]) ?? "Studio-wide", sentAt: a.sent_at ?? "", audience: a.audience ?? "", reach: a.reach ?? 0 })), error: null };
    },
    vAnnouncements,
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
      return { data: data.map((i) => ({ id: i.id, studioId: i.studio_id, studentName: i.student_name, caregiverName: i.parent_name ?? "", description: i.description ?? "", amountCents: i.amount_cents ?? 0, status: (i.status as Invoice["status"]) ?? "due", dueDate: i.due_date ?? "" })), error: null };
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
        parent_name: inv.caregiverName,
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
      if (patch.caregiverName !== undefined) updates.parent_name = patch.caregiverName;
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

/* ── Caregivers (Parent Portal) ────────────────────────────────── */

/** Map a Supabase caregivers row to our Caregiver type. */
function mapSupabaseCaregiver(row: Record<string, unknown>): Caregiver {
  const firstName = (row.first_name as string) || (row.name as string)?.split(" ")?.[0] || "";
  const lastName = (row.last_name as string) || (row.name as string)?.split(" ")?.slice(1)?.join(" ") || "";
  return {
    id: row.id as string,
    first_name: firstName,
    last_name: lastName,
    relationship_to_student: (row.relationship_to_student as string) || "Parent",
    email: row.email as string,
    phone: (row.phone as string) ?? "",
    address: (row.structured_address as Address) ?? (row.address as string) ?? undefined,
    city: (row.city as string) ?? undefined,
    state: (row.state as string) ?? undefined,
    zip: (row.zip as string) ?? undefined,
    household_label: (row.household_label as string) ?? undefined,
    status: ((row.status as string) ?? "active") as Caregiver["status"],
    role: ((row.role as string) ?? "primary_caregiver") as Caregiver["role"],
    receives_announcements: (row.receives_announcements as boolean) ?? true,
    receives_emergency_messages: (row.receives_emergency_messages as boolean) ?? true,
    can_view_schedule: (row.can_view_schedule as boolean) ?? true,
    can_view_billing: (row.can_view_billing as boolean) ?? false,
    can_pay_invoices: (row.can_pay_invoices as boolean) ?? false,
    can_manage_enrolments: (row.can_manage_enrolments as boolean) ?? false,
    can_sign_waivers: (row.can_sign_waivers as boolean) ?? false,
    can_view_medical_notes: (row.can_view_medical_notes as boolean) ?? false,
    authorized_pickup: (row.authorized_pickup as boolean) ?? false,
    invited_at: (row.invited_at as string) ?? undefined,
    accepted_at: (row.accepted_at as string) ?? undefined,
    custody_restriction: (row.custody_restriction as boolean) ?? undefined,
    court_order_on_file: (row.court_order_on_file as boolean) ?? undefined,
    communication_only: (row.communication_only as boolean) ?? undefined,
  };
}

/** Fetch the caregiver record matching the authenticated user's email.
 * Returns null if no caregiver exists for this user. */
export function useSupabaseCaregiverByEmail(isDemo: boolean) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["caregiver_by_email", user?.email],
    queryFn: async (): Promise<Caregiver | null> => {
      if (!user || isDemo) return null;
      try {
        const { data, error } = await supabase
          .from("caregivers")
          .select("*")
          .eq("email", user.email)
          .eq("status", "active")
          .maybeSingle();
        if (error || !data) return null;
        return mapSupabaseCaregiver(data as Record<string, unknown>);
      } catch {
        return null;
      }
    },
    enabled: !!user && !isDemo,
    staleTime: 30_000,
  });
}

/** Fetch all caregivers for the active studio. */
export function useSupabaseCaregivers(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<Caregiver>(
    ["caregivers", studioId],
    async () => {
      const { data, error } = await supabase.from("caregivers").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return {
        data: (data as unknown as Record<string, unknown>[]).map(mapSupabaseCaregiver),
        error: null,
      };
    },
    demoParents.map((p) => p.primaryCaregiver),
    isDemo,
  );
}

/**
 * Demo students linked to the seeded demo parent/caregiver.
 *
 * In demo mode the parent portal user is the first seeded parent account
 * (Diane Walsh). We resolve their linked students from the demo data so the
 * parent demo experience shows real seeded children rather than an empty list.
 */
const demoCaregiverStudents: Student[] = (() => {
  const demoParent = demoParents[0];
  if (!demoParent) return [];
  const childIdSet = new Set(demoParent.childIds);
  return demoStudents.filter(
    (s) => childIdSet.has(s.id) || s.caregiverId === demoParent.id,
  );
})();

/** Fetch students linked to a specific caregiver. Scoped by RLS in real mode. */
export function useSupabaseCaregiverStudents(caregiverId: string | undefined, isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<Student>(
    ["caregiver_students", caregiverId ?? "none", studioId],
    async () => {
      if (!caregiverId) return { data: [], error: null };
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("studio_id", studioId)
        .eq("caregiver_id", caregiverId);
      if (error || !data) return { data: null, error };
      return { data: (data as unknown as Record<string, unknown>[]).map((s) => ({
        id: s.id as string, studioId: s.studio_id as string, name: s.name as string,
        dob: (s.dob as string) ?? "",
        caregiverId: (s.caregiver_id as string) ?? "",
        caregiverName: (s.caregiver_name as string) ?? "",
        caregiverEmail: (s.caregiver_email as string) ?? "",
        classIds: (s.class_ids as string[]) ?? [],
        attendanceRate: (s.attendance_rate as number) ?? 1,
        waiver: ((s.waiver as string) ?? "missing") as Student["waiver"],
        payment: ((s.payment as string) ?? "paid") as Student["payment"],
        balanceCents: (s.balance_cents as number) ?? 0,
        medicalNotes: (s.medical_notes as string) ?? undefined,
        allergies: (s.allergies as string) ?? undefined,
        legalFirstName: (s.legal_first_name as string) ?? undefined,
        legalLastName: (s.legal_last_name as string) ?? undefined,
        preferredName: (s.preferred_name as string) ?? undefined,
        gender: (s.gender as string) ?? undefined,
        pronouns: (s.pronouns as string) ?? undefined,
        schoolGrade: (s.school_grade as string) ?? undefined,
        emergencyContactName: (s.emergency_contact_name as string) ?? undefined,
        emergencyContactRelationship: (s.emergency_contact_relationship as string) ?? undefined,
        emergencyContactPhone: (s.emergency_contact_phone as string) ?? undefined,
        emergencyContactSecondaryPhone: (s.emergency_contact_secondary_phone as string) ?? undefined,
        emergencyContactCanPickup: (s.emergency_contact_can_pickup as boolean) ?? undefined,
        authorizedPickupContacts: (s.authorized_pickup_contacts as Student["authorizedPickupContacts"]) ?? undefined,
      })), error: null };
    },
    demoCaregiverStudents,
    isDemo,
  );
}

export function useAddCaregiver() {
  const queryClient = useQueryClient();
  const studioId = useStudioId();
  return useMutation({
    mutationFn: async (cg: Omit<Caregiver, "id">) => {
      const { data, error } = await supabase.from("caregivers").insert({
        studio_id: studioId,
        first_name: cg.first_name,
        last_name: cg.last_name,
        name: `${cg.first_name} ${cg.last_name}`,
        email: cg.email,
        phone: cg.phone,
        relationship_to_student: cg.relationship_to_student,
        role: cg.role,
        status: cg.status,
        receives_announcements: cg.receives_announcements,
        receives_emergency_messages: cg.receives_emergency_messages,
        can_view_schedule: cg.can_view_schedule,
        can_view_billing: cg.can_view_billing,
        can_pay_invoices: cg.can_pay_invoices,
        can_manage_enrolments: cg.can_manage_enrolments,
        can_sign_waivers: cg.can_sign_waivers,
        can_view_medical_notes: cg.can_view_medical_notes,
        authorized_pickup: cg.authorized_pickup,
        structured_address: cg.address ?? null,
        household_label: cg.household_label ?? null,
      }).select().single();
      if (error) throw error;
      return { ...cg, id: data.id };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["caregivers"] }),
  });
}

export function useUpdateCaregiver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Caregiver> }) => {
      const updates: Record<string, unknown> = {};
      if (patch.first_name !== undefined) { updates.first_name = patch.first_name; updates.name = `${patch.first_name} ${patch.last_name ?? ""}`; }
      if (patch.last_name !== undefined) { updates.last_name = patch.last_name; updates.name = `${patch.first_name ?? ""} ${patch.last_name}`; }
      if (patch.email !== undefined) updates.email = patch.email;
      if (patch.phone !== undefined) updates.phone = patch.phone;
      if (patch.relationship_to_student !== undefined) updates.relationship_to_student = patch.relationship_to_student;
      if (patch.role !== undefined) updates.role = patch.role;
      if (patch.status !== undefined) updates.status = patch.status;
      if (patch.receives_announcements !== undefined) updates.receives_announcements = patch.receives_announcements;
      if (patch.receives_emergency_messages !== undefined) updates.receives_emergency_messages = patch.receives_emergency_messages;
      if (patch.can_view_schedule !== undefined) updates.can_view_schedule = patch.can_view_schedule;
      if (patch.can_view_billing !== undefined) updates.can_view_billing = patch.can_view_billing;
      if (patch.can_pay_invoices !== undefined) updates.can_pay_invoices = patch.can_pay_invoices;
      if (patch.can_manage_enrolments !== undefined) updates.can_manage_enrolments = patch.can_manage_enrolments;
      if (patch.can_sign_waivers !== undefined) updates.can_sign_waivers = patch.can_sign_waivers;
      if (patch.can_view_medical_notes !== undefined) updates.can_view_medical_notes = patch.can_view_medical_notes;
      if (patch.authorized_pickup !== undefined) updates.authorized_pickup = patch.authorized_pickup;
      if (patch.household_label !== undefined) updates.household_label = patch.household_label;
      if (patch.address !== undefined) updates.structured_address = patch.address;
      const { error } = await supabase.from("caregivers").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["caregivers"] }),
  });
}

export function useRemoveCaregiver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("caregivers").update({ status: "removed" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["caregivers"] }),
  });
}

/* ── Parents (Families) — legacy, deprecated ───────────────────── */

/** @deprecated Use useSupabaseCaregivers and build ParentAccount client-side. */
export function useSupabaseParents(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<ParentAccount>(
    ["caregivers", studioId],
    async () => {
      const { data, error } = await supabase.from("caregivers").select("*").eq("studio_id", studioId);
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
  const isDemo = user?.isDemo === true;
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      // Demo sessions must never write to the production profiles table.
      if (!user || isDemo) return null;
      const { data, error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, email: user.email, name: user.name, avatar_url: user.picture, updated_at: new Date().toISOString() }, { onConflict: "id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !isDemo,
    staleTime: 5 * 60_000,
  });
}

/* ── Waiver Templates ─────────────────────────────────────────── */

export function useSupabaseWaiverTemplates(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<WaiverTemplate>(
    ["waiver_templates", studioId],
    async () => {
      const { data, error } = await supabase.from("waiver_templates").select("*").eq("studio_id", studioId).order("created_at", { ascending: false });
      if (error || !data) return { data: null, error };
      return {
        data: (data as unknown as Record<string, unknown>[]).map((t) => ({
          id: t.id as string, studioId: t.studio_id as string, title: t.title as string,
          description: (t.description as string) ?? undefined,
          type: (t.type as string) ?? "custom",
          status: (t.status as string) ?? "draft",
          currentVersionId: (t.current_version_id as string) ?? undefined,
          required: (t.required as boolean) ?? false,
          appliesTo: (t.applies_to as { scope: string; targetIds?: string[] }) ?? { scope: "all" },
          renewalPeriod: (t.renewal_period as string) ?? "once",
          createdAt: (t.created_at as string) ?? "",
          updatedAt: (t.updated_at as string) ?? "",
        })),
        error: null,
      };
    },
    demoWaiverTemplates,
    isDemo,
  );
}

export function useSupabaseWaiverVersions(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<WaiverVersion>(
    ["waiver_versions", studioId],
    async () => {
      const { data, error } = await supabase.from("waiver_versions").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return {
        data: (data as unknown as Record<string, unknown>[]).map((v) => ({
          id: v.id as string, waiverTemplateId: v.waiver_template_id as string, studioId: v.studio_id as string,
          versionNumber: (v.version_number as number) ?? 1,
          bodyHtml: (v.body_html as string) ?? undefined,
          bodyMarkdown: (v.body_markdown as string) ?? undefined,
          publishedAt: (v.published_at as string) ?? undefined,
          createdBy: (v.created_by as string) ?? undefined,
          archivedAt: (v.archived_at as string) ?? undefined,
          createdAt: (v.created_at as string) ?? "",
        })),
        error: null,
      };
    },
    demoWaiverVersions,
    isDemo,
  );
}

export function useSupabaseWaiverSignatures(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<WaiverSignature>(
    ["waiver_signatures", studioId],
    async () => {
      const { data, error } = await supabase.from("waiver_signatures").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return {
        data: (data as unknown as Record<string, unknown>[]).map((ws) => ({
          id: ws.id as string, studioId: ws.studio_id as string,
          waiverTemplateId: ws.waiver_template_id as string,
          waiverVersionId: ws.waiver_version_id as string,
          studentId: (ws.student_id as string) ?? undefined,
          caregiverId: (ws.caregiver_id as string) ?? undefined,
          signerName: ws.signer_name as string,
          signerRelationship: (ws.signer_relationship as string) ?? undefined,
          signatureType: ((ws.signature_type as string) ?? "typed") as "typed" | "drawn",
          signatureData: (ws.signature_data as string) ?? undefined,
          guardianAuthorityConfirmed: (ws.guardian_authority_confirmed as boolean) ?? false,
          eSignConsent: (ws.e_sign_consent as boolean) ?? false,
          signedAt: ws.signed_at as string,
          ipAddress: (ws.ip_address as string) ?? undefined,
          userAgent: (ws.user_agent as string) ?? undefined,
          status: ((ws.status as string) ?? "signed") as "signed" | "expired" | "revoked",
          pdfUrl: (ws.pdf_url as string) ?? undefined,
          metadata: (ws.metadata as Record<string, unknown>) ?? undefined,
        })),
        error: null,
      };
    },
    demoWaiverSignatures,
    isDemo,
  );
}

export function useSupabaseUploadedDocuments(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<UploadedDocument>(
    ["uploaded_documents", studioId],
    async () => {
      const { data, error } = await supabase.from("uploaded_documents").select("*").eq("studio_id", studioId).order("uploaded_at", { ascending: false });
      if (error || !data) return { data: null, error };
      return {
        data: (data as unknown as Record<string, unknown>[]).map((d) => ({
          id: d.id as string, studioId: d.studio_id as string,
          familyId: (d.family_id as string) ?? undefined,
          studentId: (d.student_id as string) ?? undefined,
          classId: (d.class_id as string) ?? undefined,
          eventId: (d.event_id as string) ?? undefined,
          documentType: ((d.document_type as string) ?? "custom") as UploadedDocument["documentType"],
          title: d.title as string,
          fileUrl: (d.file_url as string) ?? undefined,
          fileName: (d.file_name as string) ?? undefined,
          mimeType: (d.mime_type as string) ?? undefined,
          fileSizeBytes: (d.file_size_bytes as number) ?? undefined,
          uploadedBy: (d.uploaded_by as string) ?? undefined,
          uploadedAt: d.uploaded_at as string,
          verifiedBy: (d.verified_by as string) ?? undefined,
          verifiedAt: (d.verified_at as string) ?? undefined,
          verificationStatus: ((d.verification_status as string) ?? "unverified") as UploadedDocument["verificationStatus"],
          expiryDate: (d.expiry_date as string) ?? undefined,
          notes: (d.notes as string) ?? undefined,
          visibility: ((d.visibility as string) ?? "caregiver_visible") as UploadedDocument["visibility"],
          createdAt: (d.created_at as string) ?? "",
          updatedAt: (d.updated_at as string) ?? "",
        })),
        error: null,
      };
    },
    demoUploadedDocuments,
    isDemo,
  );
}

/* ── Waiver Template Mutations ────────────────────────────────── */

export function useAddWaiverTemplate() {
  const queryClient = useQueryClient();
  const studioId = useStudioId();
  return useMutation({
    mutationFn: async (t: Omit<WaiverTemplate, "id" | "studioId" | "createdAt" | "updatedAt">) => {
      const { data, error } = await supabase.from("waiver_templates").insert({
        studio_id: studioId, title: t.title, description: t.description,
        type: t.type, status: t.status, required: t.required,
        applies_to: t.appliesTo as Record<string, unknown>,
        renewal_period: t.renewalPeriod,
      }).select().single();
      if (error) throw error;
      return { ...t, id: data.id, studioId };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["waiver_templates"] }),
  });
}

export function useUpdateWaiverTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<WaiverTemplate> }) => {
      const updates: Record<string, unknown> = {};
      if (patch.title !== undefined) updates.title = patch.title;
      if (patch.description !== undefined) updates.description = patch.description;
      if (patch.type !== undefined) updates.type = patch.type;
      if (patch.status !== undefined) updates.status = patch.status;
      if (patch.required !== undefined) updates.required = patch.required;
      if (patch.appliesTo !== undefined) updates.applies_to = patch.appliesTo as Record<string, unknown>;
      if (patch.renewalPeriod !== undefined) updates.renewal_period = patch.renewalPeriod;
      if (patch.currentVersionId !== undefined) updates.current_version_id = patch.currentVersionId;
      const { error } = await supabase.from("waiver_templates").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["waiver_templates"] }),
  });
}

export function useCreateWaiverVersion() {
  const queryClient = useQueryClient();
  const studioId = useStudioId();
  return useMutation({
    mutationFn: async ({ templateId, bodyMarkdown, publish }: {
      templateId: string; bodyMarkdown?: string; publish?: boolean;
    }) => {
      const { data: versions } = await supabase
        .from("waiver_versions")
        .select("version_number")
        .eq("waiver_template_id", templateId)
        .order("version_number", { ascending: false })
        .limit(1);
      const nextVersion = ((versions?.[0] as Record<string, unknown> | undefined)?.version_number as number ?? 0) + 1;

      const { data, error } = await supabase.from("waiver_versions").insert({
        waiver_template_id: templateId,
        studio_id: studioId,
        version_number: nextVersion,
        body_markdown: bodyMarkdown,
        published_at: publish ? new Date().toISOString() : null,
      }).select().single();
      if (error) throw error;

      if (publish) {
        await supabase.from("waiver_templates").update({
          current_version_id: (data as Record<string, unknown>).id as string,
          status: "published",
        }).eq("id", templateId);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiver_templates"] });
      queryClient.invalidateQueries({ queryKey: ["waiver_versions"] });
    },
  });
}

/* ── Waiver Signature Mutations ────────────────────────────────── */

export function useSignWaiver() {
  const queryClient = useQueryClient();
  const studioId = useStudioId();
  return useMutation({
    mutationFn: async (sig: {
      waiverTemplateId: string;
      waiverVersionId: string;
      studentId?: string;
      caregiverId?: string;
      signerName: string;
      signerRelationship?: string;
      guardianAuthorityConfirmed: boolean;
      eSignConsent: boolean;
    }) => {
      const { data, error } = await supabase.from("waiver_signatures").insert({
        studio_id: studioId,
        waiver_template_id: sig.waiverTemplateId,
        waiver_version_id: sig.waiverVersionId,
        student_id: sig.studentId,
        caregiver_id: sig.caregiverId,
        signer_name: sig.signerName,
        signer_relationship: sig.signerRelationship,
        signature_type: "typed",
        guardian_authority_confirmed: sig.guardianAuthorityConfirmed,
        e_sign_consent: sig.eSignConsent,
        signed_at: new Date().toISOString(),
        status: "signed",
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waiver_signatures"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

/* ── Uploaded Document Mutations ──────────────────────────────── */

export function useAddUploadedDocument() {
  const queryClient = useQueryClient();
  const studioId = useStudioId();
  return useMutation({
    mutationFn: async (doc: Omit<UploadedDocument, "id" | "studioId" | "uploadedAt" | "createdAt" | "updatedAt">) => {
      const { data, error } = await supabase.from("uploaded_documents").insert({
        studio_id: studioId,
        family_id: doc.familyId,
        student_id: doc.studentId,
        class_id: doc.classId,
        event_id: doc.eventId,
        document_type: doc.documentType,
        title: doc.title,
        file_url: doc.fileUrl,
        file_name: doc.fileName,
        mime_type: doc.mimeType,
        file_size_bytes: doc.fileSizeBytes,
        uploaded_by: doc.uploadedBy,
        uploaded_at: new Date().toISOString(),
        verification_status: doc.verificationStatus,
        expiry_date: doc.expiryDate,
        notes: doc.notes,
        visibility: doc.visibility,
      }).select().single();
      if (error) throw error;
      return { ...doc, id: data.id, studioId };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["uploaded_documents"] }),
  });
}

export function useVerifyDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, verifiedBy }: { id: string; status: "verified" | "rejected"; verifiedBy?: string }) => {
      const { error } = await supabase.from("uploaded_documents").update({
        verification_status: status,
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["uploaded_documents"] }),
  });
}

/* ── Costumes ──────────────────────────────────────────────────── */

export function useSupabaseCostumes(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<Costume>(
    ["costumes", studioId],
    async () => {
      const { data, error } = await supabase.from("costumes").select("*").eq("studio_id", studioId).order("created_at", { ascending: false });
      if (error || !data) return { data: null, error };
      return { data: (data as unknown as Record<string, unknown>[]).map((c) => ({
        id: c.id as string, studioId: c.studio_id as string, name: c.name as string,
        sku: (c.sku as string) ?? undefined, vendor: (c.vendor as string) ?? undefined,
        vendorWebsiteUrl: (c.vendor_website_url as string) ?? undefined,
        productPageUrl: (c.product_page_url as string) ?? undefined,
        style: (c.style as string) ?? undefined,
        season: (c.season as string) ?? undefined, category: (c.category as string) ?? "other",
        colour: (c.colour as string) ?? undefined, description: (c.description as string) ?? undefined,
        images: (c.images as string[]) ?? [], vendorPdfUrl: (c.vendor_pdf_url as string) ?? undefined,
        sizingChartPdfUrl: (c.sizing_chart_pdf_url as string) ?? undefined,
        careInstructions: (c.care_instructions as string) ?? undefined,
        wholesaleCostCents: (c.wholesale_cost_cents as number) ?? 0,
        shippingAllocationCents: (c.shipping_allocation_cents as number) ?? 0,
        markupPct: (c.markup_pct as number) ?? 30,
        retailCostCents: (c.retail_cost_cents as number) ?? 0,
        taxable: (c.taxable as boolean) ?? false,
        depositAmountCents: (c.deposit_amount_cents as number) ?? 0,
        sizesAvailable: (c.sizes_available as string[]) ?? [],
        sizingNotes: (c.sizing_notes as string) ?? undefined,
        autoSizingEnabled: (c.auto_sizing_enabled as boolean) ?? false,
        isReusable: (c.is_reusable as boolean) ?? false,
        quantityOwned: (c.quantity_owned as number) ?? 0,
        storageLocation: (c.storage_location as string) ?? undefined,
        condition: (c.condition as string) ?? undefined,
        status: ((c.status as string) ?? "active") as CostumeStatus,
        createdAt: (c.created_at as string) ?? "", updatedAt: (c.updated_at as string) ?? "",
      })), error: null };
    },
    demoCostumes,
    isDemo,
  );
}

export function useAddCostume() {
  const queryClient = useQueryClient();
  const studioId = useStudioId();
  return useMutation({
    mutationFn: async (costume: Omit<Costume, "id" | "studioId" | "createdAt" | "updatedAt" | "retailCostCents">) => {
      const { data, error } = await supabase.from("costumes").insert({
        studio_id: studioId,
        name: costume.name,
        sku: costume.sku ?? null,
        vendor: costume.vendor ?? null,
        vendor_website_url: costume.vendorWebsiteUrl ?? null,
        product_page_url: costume.productPageUrl ?? null,
        style: costume.style ?? null,
        season: costume.season ?? null,
        category: costume.category,
        colour: costume.colour ?? null,
        description: costume.description ?? null,
        images: costume.images ?? [],
        vendor_pdf_url: costume.vendorPdfUrl ?? null,
        sizing_chart_pdf_url: costume.sizingChartPdfUrl ?? null,
        care_instructions: costume.careInstructions ?? null,
        wholesale_cost_cents: costume.wholesaleCostCents,
        shipping_allocation_cents: costume.shippingAllocationCents,
        markup_pct: costume.markupPct,
        taxable: costume.taxable,
        deposit_amount_cents: costume.depositAmountCents,
        sizes_available: costume.sizesAvailable ?? [],
        sizing_notes: costume.sizingNotes ?? null,
        auto_sizing_enabled: costume.autoSizingEnabled,
        is_reusable: costume.isReusable,
        quantity_owned: costume.quantityOwned,
        storage_location: costume.storageLocation ?? null,
        condition: costume.condition ?? null,
        status: costume.status ?? "active",
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["costumes"] }),
  });
}

export function useUpdateCostume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Omit<Costume, "id" | "studioId" | "createdAt" | "updatedAt" | "retailCostCents">> }) => {
      const updates: Record<string, unknown> = {};
      if (patch.name !== undefined) updates.name = patch.name;
      if (patch.sku !== undefined) updates.sku = patch.sku;
      if (patch.vendor !== undefined) updates.vendor = patch.vendor;
      if (patch.vendorWebsiteUrl !== undefined) updates.vendor_website_url = patch.vendorWebsiteUrl;
      if (patch.productPageUrl !== undefined) updates.product_page_url = patch.productPageUrl;
      if (patch.style !== undefined) updates.style = patch.style;
      if (patch.season !== undefined) updates.season = patch.season;
      if (patch.category !== undefined) updates.category = patch.category;
      if (patch.colour !== undefined) updates.colour = patch.colour;
      if (patch.description !== undefined) updates.description = patch.description;
      if (patch.images !== undefined) updates.images = patch.images;
      if (patch.vendorPdfUrl !== undefined) updates.vendor_pdf_url = patch.vendorPdfUrl;
      if (patch.sizingChartPdfUrl !== undefined) updates.sizing_chart_pdf_url = patch.sizingChartPdfUrl;
      if (patch.careInstructions !== undefined) updates.care_instructions = patch.careInstructions;
      if (patch.wholesaleCostCents !== undefined) updates.wholesale_cost_cents = patch.wholesaleCostCents;
      if (patch.shippingAllocationCents !== undefined) updates.shipping_allocation_cents = patch.shippingAllocationCents;
      if (patch.markupPct !== undefined) updates.markup_pct = patch.markupPct;
      if (patch.taxable !== undefined) updates.taxable = patch.taxable;
      if (patch.depositAmountCents !== undefined) updates.deposit_amount_cents = patch.depositAmountCents;
      if (patch.sizesAvailable !== undefined) updates.sizes_available = patch.sizesAvailable;
      if (patch.sizingNotes !== undefined) updates.sizing_notes = patch.sizingNotes;
      if (patch.autoSizingEnabled !== undefined) updates.auto_sizing_enabled = patch.autoSizingEnabled;
      if (patch.isReusable !== undefined) updates.is_reusable = patch.isReusable;
      if (patch.quantityOwned !== undefined) updates.quantity_owned = patch.quantityOwned;
      if (patch.storageLocation !== undefined) updates.storage_location = patch.storageLocation;
      if (patch.condition !== undefined) updates.condition = patch.condition;
      if (patch.status !== undefined) updates.status = patch.status;
      const { error } = await supabase.from("costumes").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["costumes"] }),
  });
}

export function useDeleteCostume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("costumes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["costumes"] }),
  });
}

export function useSupabaseCostumeAssignments(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<CostumeAssignment>(
    ["costume_assignments", studioId],
    async () => {
      const { data, error } = await supabase.from("costume_assignments").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return { data: (data as unknown as Record<string, unknown>[]).map((a) => ({
        id: a.id as string, studioId: a.studio_id as string, costumeId: a.costume_id as string,
        classId: (a.class_id as string) ?? undefined, studentId: (a.student_id as string) ?? undefined,
        recitalPerformanceId: (a.recital_performance_id as string) ?? undefined,
        routineName: (a.routine_name as string) ?? undefined,
        assignedCount: (a.assigned_count as number) ?? 1,
        createdAt: (a.created_at as string) ?? "",
      })), error: null };
    },
    demoCostumeAssignments,
    isDemo,
  );
}

export function useSupabaseStudentMeasurements(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<StudentMeasurement>(
    ["student_measurements", studioId],
    async () => {
      const { data, error } = await supabase.from("student_measurements").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return { data: (data as unknown as Record<string, unknown>[]).map((m) => ({
        id: m.id as string, studioId: m.studio_id as string, studentId: m.student_id as string,
        heightCm: (m.height_cm as number) ?? undefined, weightKg: (m.weight_kg as number) ?? undefined,
        chestCm: (m.chest_cm as number) ?? undefined, waistCm: (m.waist_cm as number) ?? undefined,
        hipsCm: (m.hips_cm as number) ?? undefined, girthCm: (m.girth_cm as number) ?? undefined,
        inseamCm: (m.inseam_cm as number) ?? undefined, shoeSize: (m.shoe_size as string) ?? undefined,
        measuredBy: (m.measured_by as string) ?? undefined, measuredAt: (m.measured_at as string) ?? undefined,
        submittedBy: (m.submitted_by as string) ?? undefined,
        status: ((m.status as string) ?? "pending") as StudentMeasurement["status"],
        notes: (m.notes as string) ?? undefined,
        createdAt: (m.created_at as string) ?? "",
      })), error: null };
    },
    demoStudentMeasurements,
    isDemo,
  );
}

export function useSupabaseSizingCharts(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<SizingChart>(
    ["sizing_charts", studioId],
    async () => {
      const { data, error } = await supabase.from("sizing_charts").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return { data: (data as unknown as Record<string, unknown>[]).map((c) => ({
        id: c.id as string, studioId: c.studio_id as string,
        costumeId: (c.costume_id as string) ?? undefined,
        vendor: c.vendor as string, chartName: c.chart_name as string,
        chartData: (c.chart_data as SizingChart["chartData"]) ?? [],
        fileUrl: (c.file_url as string) ?? undefined,
        fileType: (c.file_type as SizingChart["fileType"]) ?? undefined,
        createdAt: (c.created_at as string) ?? "",
      })), error: null };
    },
    demoSizingCharts,
    isDemo,
  );
}

export function useSupabaseSizeRecommendations(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<SizeRecommendation>(
    ["size_recommendations", studioId],
    async () => {
      const { data, error } = await supabase.from("size_recommendations").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return { data: (data as unknown as Record<string, unknown>[]).map((r) => ({
        id: r.id as string, studioId: r.studio_id as string, studentId: r.student_id as string,
        costumeId: r.costume_id as string, sizingChartId: (r.sizing_chart_id as string) ?? undefined,
        recommendedSize: (r.recommended_size as string) ?? undefined,
        confidencePct: (r.confidence_pct as number) ?? undefined,
        alternativeSize: (r.alternative_size as string) ?? undefined,
        reason: (r.reason as string) ?? undefined, flags: (r.flags as string[]) ?? [],
        approvedBy: (r.approved_by as string) ?? undefined, approvedAt: (r.approved_at as string) ?? undefined,
        parentApproved: (r.parent_approved as boolean) ?? false,
        parentNotes: (r.parent_notes as string) ?? undefined,
        createdAt: (r.created_at as string) ?? "", updatedAt: (r.updated_at as string) ?? "",
      })), error: null };
    },
    demoSizeRecommendations,
    isDemo,
  );
}

export function useSupabaseCostumeFees(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<CostumeFee>(
    ["costume_fees", studioId],
    async () => {
      const { data, error } = await supabase.from("costume_fees").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return { data: (data as unknown as Record<string, unknown>[]).map((f) => ({
        id: f.id as string, studioId: f.studio_id as string, studentId: f.student_id as string,
        costumeId: f.costume_id as string,
        feeType: ((f.fee_type as string) ?? "full") as CostumeFee["feeType"],
        totalCents: (f.total_cents as number) ?? 0, paidCents: (f.paid_cents as number) ?? 0,
        invoiceId: (f.invoice_id as string) ?? undefined,
        status: ((f.status as string) ?? "unpaid") as CostumeFee["status"],
        dueDate: (f.due_date as string) ?? undefined,
        createdAt: (f.created_at as string) ?? "", updatedAt: (f.updated_at as string) ?? "",
      })), error: null };
    },
    demoCostumeFees,
    isDemo,
  );
}

export function useSupabaseVendorOrders(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<VendorOrder>(
    ["vendor_orders", studioId],
    async () => {
      const { data, error } = await supabase.from("vendor_orders").select("*, vendor_order_items(*)").eq("studio_id", studioId).order("created_at", { ascending: false });
      if (error || !data) return { data: null, error };
      return { data: (data as unknown as Record<string, unknown>[]).map((o) => ({
        id: o.id as string, studioId: o.studio_id as string, vendor: o.vendor as string,
        poNumber: (o.po_number as string) ?? undefined,
        orderDate: (o.order_date as string) ?? undefined,
        expectedDelivery: (o.expected_delivery as string) ?? undefined,
        actualDelivery: (o.actual_delivery as string) ?? undefined,
        status: ((o.status as string) ?? "draft") as VendorOrder["status"],
        vendorNotes: (o.vendor_notes as string) ?? undefined,
        shippingCostCents: (o.shipping_cost_cents as number) ?? 0,
        items: ((o.vendor_order_items as unknown as Record<string, unknown>[]) ?? []).map((i: Record<string, unknown>) => ({
          id: i.id as string, vendorOrderId: i.vendor_order_id as string,
          costumeId: i.costume_id as string, size: i.size as string,
          quantity: (i.quantity as number) ?? 1, unitCostCents: (i.unit_cost_cents as number) ?? 0,
          createdAt: (i.created_at as string) ?? "",
        })),
        createdAt: (o.created_at as string) ?? "", updatedAt: (o.updated_at as string) ?? "",
      })), error: null };
    },
    demoVendorOrders,
    isDemo,
  );
}

export function useSupabaseAlterations(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<Alteration>(
    ["alterations", studioId],
    async () => {
      const { data, error } = await supabase.from("alterations").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return { data: (data as unknown as Record<string, unknown>[]).map((a) => ({
        id: a.id as string, studioId: a.studio_id as string, studentId: a.student_id as string,
        costumeId: a.costume_id as string, alterationType: a.alteration_type as string,
        assignedTo: (a.assigned_to as string) ?? undefined, dueDate: (a.due_date as string) ?? undefined,
        status: ((a.status as string) ?? "not_started") as Alteration["status"],
        notes: (a.notes as string) ?? undefined, photos: (a.photos as string[]) ?? [],
        createdAt: (a.created_at as string) ?? "", updatedAt: (a.updated_at as string) ?? "",
      })), error: null };
    },
    demoAlterations,
    isDemo,
  );
}

export function useSupabaseCostumeDistributions(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<CostumeDistribution>(
    ["costume_distributions", studioId],
    async () => {
      const { data, error } = await supabase.from("costume_distributions").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return { data: (data as unknown as Record<string, unknown>[]).map((d) => ({
        id: d.id as string, studioId: d.studio_id as string, studentId: d.student_id as string,
        costumeId: d.costume_id as string,
        itemsChecklist: (d.items_checklist as CostumeDistribution["itemsChecklist"]) ?? [],
        signatureData: (d.signature_data as string) ?? undefined,
        signedBy: (d.signed_by as string) ?? undefined, signedAt: (d.signed_at as string) ?? undefined,
        missingItems: (d.missing_items as string[]) ?? [], notes: (d.notes as string) ?? undefined,
        receiptPdfUrl: (d.receipt_pdf_url as string) ?? undefined,
        distributedBy: (d.distributed_by as string) ?? undefined,
        createdAt: (d.created_at as string) ?? "",
      })), error: null };
    },
    demoCostumeDistributions,
    isDemo,
  );
}

export function useSupabaseReusableCostumes(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<ReusableCostume>(
    ["reusable_costumes", studioId],
    async () => {
      const { data, error } = await supabase.from("reusable_costumes").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return { data: (data as unknown as Record<string, unknown>[]).map((r) => ({
        id: r.id as string, studioId: r.studio_id as string, costumeId: r.costume_id as string,
        size: r.size as string,
        condition: ((r.condition as string) ?? "good") as ReusableCostume["condition"],
        purchaseDate: (r.purchase_date as string) ?? undefined,
        lastUsed: (r.last_used as string) ?? undefined,
        storageBin: (r.storage_bin as string) ?? undefined,
        rackNumber: (r.rack_number as string) ?? undefined,
        status: ((r.status as string) ?? "available") as ReusableCostume["status"],
        notes: (r.notes as string) ?? undefined,
        createdAt: (r.created_at as string) ?? "", updatedAt: (r.updated_at as string) ?? "",
      })), error: null };
    },
    demoReusableCostumes,
    isDemo,
  );
}

export function useSupabaseCostumeRentals(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<CostumeRental>(
    ["costume_rentals", studioId],
    async () => {
      const { data, error } = await supabase.from("costume_rentals").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return { data: (data as unknown as Record<string, unknown>[]).map((r) => ({
        id: r.id as string, studioId: r.studio_id as string, studentId: r.student_id as string,
        inventoryId: (r.inventory_id as string) ?? undefined, costumeId: r.costume_id as string,
        rentalFeeCents: (r.rental_fee_cents as number) ?? 0,
        depositCents: (r.deposit_cents as number) ?? 0,
        returnDate: (r.return_date as string) ?? undefined,
        returnedAt: (r.returned_at as string) ?? undefined,
        damageFeeCents: (r.damage_fee_cents as number) ?? 0,
        status: ((r.status as string) ?? "active") as CostumeRental["status"],
        notes: (r.notes as string) ?? undefined,
        createdAt: (r.created_at as string) ?? "", updatedAt: (r.updated_at as string) ?? "",
      })), error: null };
    },
    demoCostumeRentals,
    isDemo,
  );
}

/* ── Measurement Mutations ──────────────────────────────────────── */

export function useAddMeasurement() {
  const queryClient = useQueryClient();
  const studioId = useStudioId();
  return useMutation({
    mutationFn: async (measurement: Omit<StudentMeasurement, "id" | "studioId" | "createdAt">) => {
      const { data, error } = await supabase.from("student_measurements").insert({
        studio_id: studioId,
        student_id: measurement.studentId,
        height_cm: measurement.heightCm ?? null,
        weight_kg: measurement.weightKg ?? null,
        chest_cm: measurement.chestCm ?? null,
        waist_cm: measurement.waistCm ?? null,
        hips_cm: measurement.hipsCm ?? null,
        girth_cm: measurement.girthCm ?? null,
        inseam_cm: measurement.inseamCm ?? null,
        shoe_size: measurement.shoeSize ?? null,
        measured_by: measurement.measuredBy ?? null,
        measured_at: measurement.measuredAt ?? null,
        submitted_by: measurement.submittedBy ?? null,
        status: measurement.status,
        notes: measurement.notes ?? null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student_measurements"] }),
  });
}

export function useUpdateMeasurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Omit<StudentMeasurement, "id" | "studioId" | "createdAt">> }) => {
      const updates: Record<string, unknown> = {};
      if (patch.studentId !== undefined) updates.student_id = patch.studentId;
      if (patch.heightCm !== undefined) updates.height_cm = patch.heightCm;
      if (patch.weightKg !== undefined) updates.weight_kg = patch.weightKg;
      if (patch.chestCm !== undefined) updates.chest_cm = patch.chestCm;
      if (patch.waistCm !== undefined) updates.waist_cm = patch.waistCm;
      if (patch.hipsCm !== undefined) updates.hips_cm = patch.hipsCm;
      if (patch.girthCm !== undefined) updates.girth_cm = patch.girthCm;
      if (patch.inseamCm !== undefined) updates.inseam_cm = patch.inseamCm;
      if (patch.shoeSize !== undefined) updates.shoe_size = patch.shoeSize;
      if (patch.measuredBy !== undefined) updates.measured_by = patch.measuredBy;
      if (patch.measuredAt !== undefined) updates.measured_at = patch.measuredAt;
      if (patch.submittedBy !== undefined) updates.submitted_by = patch.submittedBy;
      if (patch.status !== undefined) updates.status = patch.status;
      if (patch.notes !== undefined) updates.notes = patch.notes;
      const { error } = await supabase.from("student_measurements").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student_measurements"] }),
  });
}

/* ── Sizing Chart Mutations ──────────────────────────────────── */

export function useAddSizingChart() {
  const queryClient = useQueryClient();
  const studioId = useStudioId();
  return useMutation({
    mutationFn: async (chart: Omit<SizingChart, "id" | "studioId" | "createdAt">) => {
      const { data, error } = await supabase.from("sizing_charts").insert({
        studio_id: studioId,
        costume_id: chart.costumeId ?? null,
        vendor: chart.vendor,
        chart_name: chart.chartName,
        chart_data: chart.chartData as unknown as Record<string, unknown>[],
        file_url: chart.fileUrl ?? null,
        file_type: chart.fileType ?? null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sizing_charts"] }),
  });
}

export function useDeleteSizingChart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sizing_charts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sizing_charts"] }),
  });
}

export function useAddSizeRecommendation() {
  const queryClient = useQueryClient();
  const studioId = useStudioId();
  return useMutation({
    mutationFn: async (rec: Omit<SizeRecommendation, "id" | "studioId" | "createdAt" | "updatedAt">) => {
      const { data, error } = await supabase.from("size_recommendations").insert({
        studio_id: studioId,
        student_id: rec.studentId,
        costume_id: rec.costumeId,
        sizing_chart_id: rec.sizingChartId ?? null,
        recommended_size: rec.recommendedSize ?? null,
        confidence_pct: rec.confidencePct ?? null,
        alternative_size: rec.alternativeSize ?? null,
        reason: rec.reason ?? null,
        flags: rec.flags ?? [],
        parent_approved: rec.parentApproved,
        parent_notes: rec.parentNotes ?? null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["size_recommendations"] });
    },
  });
}

/* ── Vendor Order Mutations ──────────────────────────────────── */

export function useAddVendorOrder() {
  const queryClient = useQueryClient();
  const studioId = useStudioId();
  return useMutation({
    mutationFn: async (order: Omit<VendorOrder, "id" | "studioId" | "createdAt" | "updatedAt">) => {
      const { data: orderData, error } = await supabase.from("vendor_orders").insert({
        studio_id: studioId,
        vendor: order.vendor,
        po_number: order.poNumber ?? null,
        order_date: order.orderDate ?? null,
        expected_delivery: order.expectedDelivery ?? null,
        status: order.status,
        vendor_notes: order.vendorNotes ?? null,
        shipping_cost_cents: order.shippingCostCents,
      }).select().single();
      if (error) throw error;

      // Insert line items
      if (order.items.length > 0) {
        const items = order.items.map((item) => ({
          vendor_order_id: (orderData as Record<string, unknown>).id as string,
          costume_id: item.costumeId,
          size: item.size,
          quantity: item.quantity,
          unit_cost_cents: item.unitCostCents,
        }));
        const { error: itemError } = await supabase.from("vendor_order_items").insert(items);
        if (itemError) throw itemError;
      }

      return orderData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor_orders"] });
    },
  });
}

/* ── Distribution Mutations ──────────────────────────────────── */

export function useAddCostumeDistribution() {
  const queryClient = useQueryClient();
  const studioId = useStudioId();
  return useMutation({
    mutationFn: async (d: Omit<CostumeDistribution, "id" | "studioId" | "createdAt">) => {
      const { data, error } = await supabase.from("costume_distributions").insert({
        studio_id: studioId,
        student_id: d.studentId,
        costume_id: d.costumeId,
        items_checklist: d.itemsChecklist as unknown as Record<string, unknown>[],
        signature_data: d.signatureData ?? null,
        signed_by: d.signedBy ?? null,
        signed_at: d.signedAt ?? null,
        missing_items: d.missingItems ?? [],
        notes: d.notes ?? null,
        receipt_pdf_url: d.receiptPdfUrl ?? null,
        distributed_by: d.distributedBy ?? null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["costume_distributions"] }),
  });
}

export function useSupabaseQuickChangeConflicts(isDemo: boolean) {
  const studioId = useStudioId();
  return useDualQuery<QuickChangeConflict>(
    ["quick_change_analyses", studioId],
    async () => {
      const { data, error } = await supabase.from("quick_change_analyses").select("*").eq("studio_id", studioId);
      if (error || !data) return { data: null, error };
      return { data: (data as unknown as Record<string, unknown>[]).map((q) => ({
        id: q.id as string, studioId: q.studio_id as string,
        recitalEventId: (q.recital_event_id as string) ?? undefined,
        studentId: q.student_id as string,
        routineA: (q.routine_a as string) ?? undefined,
        routineAEndTime: (q.routine_a_end_time as string) ?? undefined,
        routineB: (q.routine_b as string) ?? undefined,
        routineBStartTime: (q.routine_b_start_time as string) ?? undefined,
        estimatedChangeMinutes: (q.estimated_change_minutes as number) ?? undefined,
        conflictDetected: (q.conflict_detected as boolean) ?? false,
        recommendation: (q.recommendation as string) ?? undefined,
        resolved: (q.resolved as boolean) ?? false,
        createdAt: (q.created_at as string) ?? "",
      })), error: null };
    },
    demoQuickChangeConflicts,
    isDemo,
  );
}
