import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { parentAccounts, studio as defaultStudio } from "./demo";
import {
  type Student,
  type FamilyContact,
  type Caregiver,
  caregiverToContact,
} from "./types";
import { useStudents } from "./store";
import { useInvoices } from "./store";

/* ── Types ─────────────────────────────────────────────────────────── */

/** The member store provides self-service access for a student/member
 *  who logs into their own portal (not a parent managing children). */
interface MemberCtx {
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

/* ── Demo defaults ────────────────────────────────────────────────── */

function findDemoCaregiverForStudent(studentId: string): Caregiver | null {
  for (const pa of parentAccounts) {
    // Check primary caregiver
    if (pa.primaryCaregiver && pa.childIds.includes(studentId)) {
      return pa.primaryCaregiver;
    }
    // Check additional caregivers
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
  const { students: sharedStudents, enrolStudentInClass, withdrawStudentFromClass } = useStudents();
  const allStudents = useMemo(() => sharedStudents, [sharedStudents]);

  // Pick the first student with classes as the default member
  const defaultStudent = useMemo(
    () => allStudents.find((s) => s.classIds.length > 0) ?? allStudents[0] ?? null,
    [allStudents],
  );

  const [studentId, setStudentId] = useState<string>(defaultStudent?.id ?? "");

  const memberStudent = useMemo(
    () => allStudents.find((s) => s.id === studentId) ?? defaultStudent,
    [allStudents, studentId, defaultStudent],
  );

  const caregiver = useMemo(
    () => (memberStudent ? findDemoCaregiverForStudent(memberStudent.id) : null),
    [memberStudent],
  );

  const primaryContact = useMemo(
    () => (caregiver ? caregiverToContact(caregiver) : null),
    [caregiver],
  );

  const additionalCaregivers = useMemo(() => {
    if (!memberStudent) return [];
    for (const pa of parentAccounts) {
      if (pa.childIds.includes(memberStudent.id)) {
        return pa.additionalCaregivers ?? [];
      }
    }
    return [];
  }, [memberStudent]);

  const switchMember = useCallback((id: string) => setStudentId(id), []);

  const updateMemberProfile = useCallback(
    (patch: Partial<Student>) => {
      if (!memberStudent) return;
      // Updates through shared context
      const { updateStudent } = useStudents();
      updateStudent(memberStudent.id, patch);
    },
    [memberStudent],
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

  const ctx = useMemo(
    (): MemberCtx => ({
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
    [memberStudent, caregiver, primaryContact, additionalCaregivers, switchMember, enrolInClass, dropClass],
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
