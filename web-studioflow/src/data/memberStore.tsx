import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useSupabaseCaregiverByEmail, useSupabaseCaregiverStudents } from "./supabaseHooks";
import {
  parentAccounts,
  students as demoStudentsArr,
} from "./demo";
import {
  type Student,
  type FamilyContact,
  type Caregiver,
  caregiverToContact,
} from "./types";
import { useStudents } from "./store";

/* ── Types ─────────────────────────────────────────────────────────── */

/** The member store provides self-service access for a student/member
 *  who logs into their own portal (not a parent managing children). */
interface MemberCtx {
  /** Whether member data is still loading. */
  isLoading: boolean;
  /** The student record for the currently logged-in member. */
  memberStudent: Student | null;
  /** All classes the member is enrolled in. */
  enrolledClassIds: string[];
  /** The member's caregiver record (if exists — for family-linked members). */
  caregiver: Caregiver | null;
  /** Primary contact info derived from caregiver. */
  primaryContact: FamilyContact | null;
  /** Any additional caregivers linked to this member (e.g., separated parents). */
  additionalCaregivers: Caregiver[];
  /** Switch to a different member (demo convenience). */
  switchMember: (studentId: string) => void;
  /** Update the member's own profile. */
  updateMemberProfile: (patch: Partial<Student>) => void;
  /** Enroll this member in a class. */
  enrolInClass: (classId: string) => void;
  /** Drop this member from a class. */
  dropClass: (classId: string) => void;
}

/* ── Context ──────────────────────────────────────────────────────── */

const MemberContext = createContext<MemberCtx | null>(null);

/* ── Demo helpers ─────────────────────────────────────────────────── */

function findDemoCaregiverForStudent(studentId: string): Caregiver | null {
  for (const pa of parentAccounts) {
    if (pa.primaryCaregiver && pa.childIds.includes(studentId)) {
      return pa.primaryCaregiver;
    }
    for (const cg of pa.additionalCaregivers ?? []) {
      if (pa.childIds.includes(studentId)) {
        return cg;
      }
    }
  }
  return null;
}

/* ── Provider ──────────────────────────────────────────────────────── */

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isDemo = user?.isDemo === true;

  const {
    students: sharedStudents,
    enrolStudentInClass,
    withdrawStudentFromClass,
    updateStudent,
  } = useStudents();

  /* ── Real mode: fetch caregiver by email to find linked students ─── */
  const { data: supabaseCaregiver, isLoading: cgLoading } = useSupabaseCaregiverByEmail(isDemo);
  const supabaseCgId = supabaseCaregiver?.id;

  const { data: supabaseCgStudents = [] } = useSupabaseCaregiverStudents(
    isDemo ? undefined : supabaseCgId,
    isDemo,
  );

  /* ── Real mode: find the student matching the user ────────────────── */
  // In real mode, we look up the student that matches the authenticated user's name/email
  // or is linked to the caregiver. The member portal is for a specific student.
  const realMemberStudent = useMemo(() => {
    if (isDemo || !user) return null;
    // Try to find a student by matching caregiver-linked students first
    if (supabaseCgStudents.length > 0) {
      return supabaseCgStudents[0]; // Default to first linked student
    }
    // Fall back to searching shared students by email or name match
    const match = sharedStudents.find(
      (s) => s.caregiverEmail === user.email || s.name?.toLowerCase().includes(user.name?.toLowerCase() ?? ""),
    );
    return match ?? null;
  }, [isDemo, user, supabaseCgStudents, sharedStudents]);

  /* ── Demo mode: pick first student with classes ──────────────────── */
  const demoDefaultStudent = useMemo(
    () => sharedStudents.find((s) => s.classIds.length > 0) ?? sharedStudents[0] ?? null,
    [sharedStudents],
  );

  const [demoStudentId, setDemoStudentId] = useState<string>(demoDefaultStudent?.id ?? "");

  const demoMemberStudent = useMemo(
    () => sharedStudents.find((s) => s.id === demoStudentId) ?? demoDefaultStudent,
    [sharedStudents, demoStudentId, demoDefaultStudent],
  );

  const memberStudent = isDemo ? demoMemberStudent : realMemberStudent;

  /* ── Caregiver info ──────────────────────────────────────────────── */
  const caregiver = useMemo(
    () => {
      if (isDemo) return memberStudent ? findDemoCaregiverForStudent(memberStudent.id) : null;
      return supabaseCaregiver ?? null;
    },
    [isDemo, memberStudent, supabaseCaregiver],
  );

  const primaryContact = useMemo(
    () => (caregiver ? caregiverToContact(caregiver) : null),
    [caregiver],
  );

  const additionalCaregivers = useMemo(() => {
    if (isDemo && memberStudent) {
      for (const pa of parentAccounts) {
        if (pa.childIds.includes(memberStudent.id)) {
          return pa.additionalCaregivers ?? [];
        }
      }
    }
    return [];
  }, [isDemo, memberStudent]);

  /* ── Actions ──────────────────────────────────────────────────────── */
  const switchMember = useCallback((id: string) => {
    if (isDemo) setDemoStudentId(id);
  }, [isDemo]);

  const updateMemberProfile = useCallback(
    (patch: Partial<Student>) => {
      if (!memberStudent) return;
      updateStudent(memberStudent.id, patch);
    },
    [memberStudent, updateStudent],
  );

  const enrolInClass = useCallback(
    (classId: string) => {
      if (!memberStudent) return;
      enrolStudentInClass(memberStudent.id, classId);
    },
    [memberStudent, enrolStudentInClass],
  );

  const dropClass = useCallback(
    (classId: string) => {
      if (!memberStudent) return;
      withdrawStudentFromClass(memberStudent.id, classId);
    },
    [memberStudent, withdrawStudentFromClass],
  );

  const isLoading = !isDemo && cgLoading;

  const ctx = useMemo(
    (): MemberCtx => ({
      isLoading,
      memberStudent,
      enrolledClassIds: memberStudent?.classIds ?? [],
      caregiver,
      primaryContact,
      additionalCaregivers,
      switchMember,
      updateMemberProfile,
      enrolInClass,
      dropClass,
    }),
    [isLoading, memberStudent, caregiver, primaryContact, additionalCaregivers, switchMember, updateMemberProfile, enrolInClass, dropClass],
  );

  return (
    <MemberContext.Provider value={ctx}>
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  const ctx = useContext(MemberContext);
  if (!ctx) throw new Error("useMember must be used within MemberProvider");
  return ctx;
}
