import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import {
  useSupabaseCaregiverByEmail,
  useSupabaseCaregiverStudents,
  useUpdateCaregiver as useUpdateCaregiverMut,
  useAddCaregiver as useAddCaregiverMut,
  useRemoveCaregiver as useRemoveCaregiverMut,
} from "./supabaseHooks";
import {
  parentAccounts,
  students as demoStudentsArr,
} from "./demo";
import {
  type Caregiver,
  type CaregiverAuditEvent,
  type CaregiverPermissions,
  type CaregiverStatus,
  type FamilyContact,
  type ParentAccount,
  type Student,
  SAFE_SECONDARY_DEFAULTS,
  caregiverToContact,
} from "./types";
import { useStudents, useInvoices, useClasses, useEnrolments, useAnnouncements, useWaivers } from "./store";

/* ── Helpers ───────────────────────────────────────────────────────-- */

function newId(prefix: string): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function pushAudit(
  log: CaregiverAuditEvent[] | undefined,
  caregiverId: string,
  event: string,
  details?: string,
): CaregiverAuditEvent[] {
  const entry: CaregiverAuditEvent = {
    id: newId("alog"),
    caregiverId,
    timestamp: new Date().toISOString(),
    event,
    details,
  };
  return [...(log ?? []), entry];
}

/* ── Load state enum ─────────────────────────────────────────────── */
type LoadState = "idle" | "loading" | "loaded" | "empty" | "error";

/* ── Shared parent / family state ─────────────────────────────────── */

interface ParentCtx {
  /** Whether the parent data is still loading from Supabase. */
  isLoading: boolean;
  /** Whether there was an error fetching parent data. */
  loadError: string | null;
  /** The load state for the parent portal. */
  loadState: LoadState;
  /** The currently logged-in parent account. */
  parent: ParentAccount | null;
  /** Convenience: the primary contact (legacy) */
  primaryContact: FamilyContact | null;
  /** Convenience: the secondary contact, if any (legacy — first additional caregiver) */
  secondaryContact: FamilyContact | null;
  /** The canonical primary caregiver record */
  primaryCaregiver: Caregiver | null;
  /** The first additional caregiver, if any (legacy — kept for backward compat) */
  secondaryCaregiver: Caregiver | null;
  /** All additional caregivers beyond the primary (supports multi-household families) */
  additionalCaregivers: Caregiver[];
  /** All children belonging to this parent */
  children: Student[];
  /** Switch to a different parent (demo convenience) */
  switchParent: (id: string) => void;
  /** Add a new child to this parent (accepts full registration payload with legal/medical/emergency fields). */
  addChild: (
    child: Omit<
      Student,
      | "id" | "studioId" | "caregiverId" | "caregiverName" | "caregiverEmail"
      | "classIds" | "attendanceRate" | "payment" | "balanceCents"
    >,
  ) => void;
  /** Remove a child */
  removeChild: (id: string) => void;
  /** Update a child's profile fields */
  updateChild: (id: string, patch: Partial<Student>) => void;
  /** Update the primary contact's details (legacy) */
  updatePrimaryContact: (patch: Partial<FamilyContact>) => void;
  /** Add or update the secondary contact (legacy) */
  setSecondaryContact: (contact: FamilyContact) => void;
  /** Remove the secondary contact (legacy) */
  removeSecondaryContact: () => void;

  /* ── Caregiver management ─────────────────────────────────────── */
  /** Nominate a new additional caregiver (appends to additionalCaregivers array, status → invited) */
  inviteCaregiver: (data: Omit<Caregiver, "id" | "status" | "role">) => void;
  /** Accept an invitation for a specific caregiver (status → active) */
  acceptCaregiverInvite: (caregiverId: string) => void;
  /** Resend the invitation email for a specific caregiver */
  resendCaregiverInvite: (caregiverId: string) => void;
  /** Update permissions for a specific additional caregiver */
  updateCaregiverPermissions: (caregiverId: string, patch: Partial<CaregiverPermissions>) => void;
  /** Disable a specific additional caregiver (status → disabled) */
  disableCaregiver: (caregiverId: string) => void;
  /** Re-enable a disabled caregiver */
  enableCaregiver: (caregiverId: string) => void;
  /** Permanently remove a specific additional caregiver (status → removed) */
  removeCaregiver: (caregiverId: string) => void;
  /** Update any caregiver field (admin-level) */
  updateCaregiver: (caregiverId: string, patch: Partial<Caregiver>) => void;
  /** Full audit trail for the current parent account */
  auditLog: CaregiverAuditEvent[];
}

const ParentContext = createContext<ParentCtx | null>(null);

/* ── Empty / Loading / Error placeholder values ──────────────────── */

const NULL_CONTACT: FamilyContact = {
  firstName: "", lastName: "", relationshipToStudent: "", email: "", phone: "",
};
const NULL_CAREGIVER: Caregiver = {
  id: "", first_name: "", last_name: "", relationship_to_student: "", email: "",
  phone: "", status: "active", role: "primary_caregiver",
  receives_announcements: true, receives_emergency_messages: true,
  can_view_schedule: true, can_view_billing: false, can_pay_invoices: false,
  can_manage_enrolments: false, can_sign_waivers: false,
  can_view_medical_notes: false, authorized_pickup: false,
};

export function ParentProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isDemo = user?.isDemo === true;

  /* ── Demo mode state (unchanged from original) ─────────────────── */
  const [demoAccountId, setDemoAccountId] = useState<string>(parentAccounts[0]?.id ?? "");
  const [demoParents, setDemoParents] = useState<ParentAccount[]>(parentAccounts);

  /* ── Real mode: fetch caregiver by email ──────────────────────── */
  const {
    data: supabaseCaregiver,
    isLoading: cgLoading,
    isError: cgError,
  } = useSupabaseCaregiverByEmail(isDemo);

  const supabaseCgId = supabaseCaregiver?.id;

  /* ── Fetch students linked to the caregiver (real mode) ───────── */
  const {
    data: supabaseCgStudents = [],
    isLoading: studentsLoading,
  } = useSupabaseCaregiverStudents(isDemo ? undefined : supabaseCgId, isDemo);

  /* ── Shared context hooks ────────────────────────────────────── */
  const {
    students: sharedStudents,
    addStudent: sharedAddStudent,
    updateStudent: sharedUpdateStudent,
  } = useStudents();

  const queryClient = useQueryClient();
  const updateCgMut = useUpdateCaregiverMut();
  const addCgMut = useAddCaregiverMut();
  const removeCgMut = useRemoveCaregiverMut();

  /* ── Track if real-mode data has synced at least once ──────────── */
  const realSyncDone = useRef(false);

  /* ── Local state for caregiver management edits (real mode) ────── */
  const [realCaregiver, setRealCaregiver] = useState<Caregiver | null>(null);
  const [realAdditionalCgs, setRealAdditionalCgs] = useState<Caregiver[]>([]);
  const [realAuditLog, setRealAuditLog] = useState<CaregiverAuditEvent[]>([]);

  // Sync real caregiver from Supabase when it arrives
  useEffect(() => {
    if (isDemo) return;
    if (supabaseCaregiver && !realSyncDone.current) {
      setRealCaregiver(supabaseCaregiver);
      realSyncDone.current = true;
    } else if (supabaseCaregiver && realSyncDone.current) {
      // Keep local edits but update if the remote version changes
      setRealCaregiver((prev) => prev?.id === supabaseCaregiver.id ? prev : supabaseCaregiver);
    }
  }, [supabaseCaregiver, isDemo]);

  /* ── Derived values ───────────────────────────────────────────── */

  // Demo mode: use local demo state
  const demoParent = useMemo(
    () => demoParents.find((p) => p.id === demoAccountId) ?? demoParents[0],
    [demoParents, demoAccountId],
  );

  // Real mode: construct ParentAccount from Supabase caregiver + students
  const realParent = useMemo((): ParentAccount | null => {
    if (!realCaregiver) return null;
    const cg = realCaregiver;
    const childIds = supabaseCgStudents.map((s) => s.id);
    return {
      id: cg.id,
      studioId: "",
      primaryContact: caregiverToContact(cg),
      primaryCaregiver: cg,
      secondaryCaregiver: realAdditionalCgs[0],
      secondaryContact: realAdditionalCgs[0] ? caregiverToContact(realAdditionalCgs[0]) : undefined,
      additionalCaregivers: realAdditionalCgs,
      caregiverAuditLog: realAuditLog,
      childIds,
    };
  }, [realCaregiver, supabaseCgStudents, realAdditionalCgs, realAuditLog]);

  // Compute load state for real mode
  const loadState: LoadState = useMemo(() => {
    if (isDemo) return "loaded";
    if (cgLoading || studentsLoading) return "loading";
    if (cgError) return "error";
    if (!realCaregiver) return "empty";
    return "loaded";
  }, [isDemo, cgLoading, studentsLoading, cgError, realCaregiver]);

  const parent = isDemo ? demoParent : realParent;
  const primaryContact = parent?.primaryContact ?? NULL_CONTACT;
  const additionalCaregivers = parent?.additionalCaregivers ?? [];
  const secondaryCaregiver = additionalCaregivers[0] ?? null;
  const secondaryContact = secondaryCaregiver
    ? caregiverToContact(secondaryCaregiver)
    : null;
  const primaryCaregiver = parent?.primaryCaregiver ?? NULL_CAREGIVER;
  const auditLog = parent?.caregiverAuditLog ?? [];

  /* ── Children: demo uses sharedStudents filtered by childIds; real uses supabaseCgStudents directly ── */
  const parentChildren: Student[] = useMemo(() => {
    if (isDemo) {
      return sharedStudents.filter((s) => demoParent.childIds.includes(s.id));
    }
    // Real mode: merge supabase students with shared context (for enrolments/classIds)
    const cgIds = new Set(supabaseCgStudents.map((s) => s.id));
    return sharedStudents.filter((s) => cgIds.has(s.id));
  }, [isDemo, sharedStudents, demoParent.childIds, supabaseCgStudents]);

  /* ── Switch parent (demo mode only) ────────────────────────────── */
  const switchParent = useCallback((id: string) => {
    if (isDemo) setDemoAccountId(id);
  }, [isDemo]);

  /* ── Patch helpers ─────────────────────────────────────────────── */
  const patchDemoParent = useCallback(
    (patch: Partial<ParentAccount>) => {
      setDemoParents((prev) =>
        prev.map((p) => (p.id === demoParent.id ? { ...p, ...patch } : p)),
      );
    },
    [demoParent.id],
  );

  const patchRealCg = useCallback(
    (patch: Partial<Caregiver>) => {
      setRealCaregiver((prev) => prev ? { ...prev, ...patch } : prev);
      // Persist to Supabase
      if (realCaregiver?.id) {
        updateCgMut.mutate(
          { id: realCaregiver.id, patch },
          { onError: () => queryClient.invalidateQueries({ queryKey: ["caregiver_by_email"] }) },
        );
      }
    },
    [realCaregiver, updateCgMut, queryClient],
  );

  /* ── Child management ────────────────────────────────────────── */
  const addChild = useCallback(
    (
      child: Omit<
        Student,
        | "id" | "studioId" | "caregiverId" | "caregiverName" | "caregiverEmail"
        | "classIds" | "attendanceRate" | "payment" | "balanceCents"
      >,
    ) => {
      const pc = isDemo ? demoParent.primaryContact : primaryContact;
      const cgId = isDemo ? demoParent.id : (realCaregiver?.id ?? "");
      const cgName = `${pc.firstName} ${pc.lastName}`;
      const newId = sharedAddStudent({
        ...child,
        caregiverId: cgId,
        caregiverName: cgName,
        caregiverEmail: pc.email || "",
        classIds: [],
        attendanceRate: 1,
        waiver: child.waiver ?? "missing",
        payment: "paid",
        balanceCents: 0,
      });
      if (isDemo) {
        patchDemoParent({ childIds: [...demoParent.childIds, newId] });
      }
    },
    [isDemo, demoParent, primaryContact, realCaregiver, sharedAddStudent, patchDemoParent],
  );

  const removeChild = useCallback(
    (id: string) => {
      if (isDemo) {
        patchDemoParent({
          childIds: demoParent.childIds.filter((cid) => cid !== id),
        });
      }
      // Real mode: RLS prevents deleting — just unlink is a caregiver update
    },
    [isDemo, demoParent.childIds, patchDemoParent],
  );

  const updateChild = useCallback(
    (id: string, patch: Partial<Student>) => {
      sharedUpdateStudent(id, patch);
    },
    [sharedUpdateStudent],
  );

  /* ── Legacy contact management ───────────────────────────────── */
  const updatePrimaryContact = useCallback(
    (patch: Partial<FamilyContact>) => {
      const cgPatch: Partial<Caregiver> = {
        first_name: patch.firstName ?? primaryCaregiver.first_name,
        last_name: patch.lastName ?? primaryCaregiver.last_name,
        email: patch.email ?? primaryCaregiver.email,
        phone: patch.phone ?? primaryCaregiver.phone,
        relationship_to_student: patch.relationshipToStudent ?? primaryCaregiver.relationship_to_student,
      };
      if (isDemo) {
        patchDemoParent({
          primaryContact: { ...demoParent.primaryContact, ...patch },
          primaryCaregiver: { ...demoParent.primaryCaregiver, ...cgPatch },
        });
      } else {
        patchRealCg(cgPatch);
      }
    },
    [isDemo, demoParent, primaryCaregiver, patchDemoParent, patchRealCg],
  );

  const setSecondaryContact = useCallback(
    (contact: FamilyContact) => {
      if (isDemo) {
        const existing = additionalCaregivers[0];
        const cg: Caregiver = {
          id: existing?.id ?? newId("cg_addl"),
          first_name: contact.firstName,
          last_name: contact.lastName,
          relationship_to_student: contact.relationshipToStudent,
          email: contact.email,
          phone: contact.phone,
          address: contact.address,
          city: contact.city,
          state: contact.state,
          zip: contact.zip,
          household_label: contact.householdLabel,
          status: (existing?.status ?? "active") as CaregiverStatus,
          role: "additional_caregiver",
          receives_announcements: contact.receivesEmails,
          receives_emergency_messages: contact.emergencyContact,
          can_view_schedule: true,
          can_view_billing: contact.receivesBilling,
          can_pay_invoices: contact.receivesBilling,
          can_manage_enrolments: false,
          can_sign_waivers: false,
          can_view_medical_notes: false,
          authorized_pickup: contact.emergencyContact,
        };
        const newList = existing
          ? additionalCaregivers.map((a) => (a.id === existing.id ? cg : a))
          : [cg];
        patchDemoParent({
          additionalCaregivers: newList,
          secondaryContact: contact,
          secondaryCaregiver: cg,
        });
      } else {
        // Real mode: create or update the additional caregiver in Supabase
        const existing = realAdditionalCgs[0];
        if (existing) {
          const cgPatch: Partial<Caregiver> = {
            first_name: contact.firstName,
            last_name: contact.lastName,
            email: contact.email,
            phone: contact.phone,
          };
          updateCgMut.mutate({ id: existing.id, patch: cgPatch });
          setRealAdditionalCgs((prev) =>
            prev.map((a) => (a.id === existing.id ? { ...a, ...cgPatch } : a)),
          );
        }
      }
    },
    [isDemo, additionalCaregivers, realAdditionalCgs, patchDemoParent, updateCgMut],
  );

  const removeSecondaryContact = useCallback(() => {
    if (isDemo) {
      const removed = additionalCaregivers.slice(1);
      patchDemoParent({
        additionalCaregivers: removed,
        secondaryContact: undefined,
        secondaryCaregiver: removed[0],
      });
    } else {
      const existing = realAdditionalCgs[0];
      if (existing) {
        removeCgMut.mutate(existing.id);
        setRealAdditionalCgs((prev) => prev.slice(1));
      }
    }
  }, [isDemo, additionalCaregivers, realAdditionalCgs, patchDemoParent, removeCgMut]);

  /* ── Caregiver management (multi-caregiver, ID-based) ──────────── */

  const inviteCaregiver = useCallback(
    (data: Omit<Caregiver, "id" | "status" | "role">) => {
      if (isDemo) {
        const cg: Caregiver = {
          ...data,
          id: newId("cg_addl"),
          status: "invited" as CaregiverStatus,
          role: "additional_caregiver",
          ...SAFE_SECONDARY_DEFAULTS,
          invited_at: new Date().toISOString(),
        };
        const newList = [...additionalCaregivers, cg];
        const first = newList[0];
        patchDemoParent({
          additionalCaregivers: newList,
          secondaryCaregiver: first,
          secondaryContact: first ? caregiverToContact(first) : undefined,
          caregiverAuditLog: pushAudit(
            demoParent.caregiverAuditLog, cg.id, demoParent.id,
            "caregiver_nominated",
            `${cg.first_name} ${cg.last_name} nominated as additional caregiver`,
          ),
        });
      } else {
        const cg: Caregiver = {
          ...data,
          id: "",
          status: "invited",
          role: "additional_caregiver",
          ...SAFE_SECONDARY_DEFAULTS,
          invited_at: new Date().toISOString(),
        };
        addCgMut.mutate(cg, {
          onSuccess: (result) => {
            const created = { ...cg, id: result.id };
            setRealAdditionalCgs((prev) => [...prev, created]);
            setRealAuditLog((prev) => pushAudit(prev, result.id, "caregiver_nominated",
              `${cg.first_name} ${cg.last_name} nominated as additional caregiver`));
          },
        });
      }
    },
    [isDemo, additionalCaregivers, demoParent, patchDemoParent, addCgMut],
  );

  const acceptCaregiverInvite = useCallback(
    (caregiverId: string) => {
      if (isDemo) {
        const cg = additionalCaregivers.find((a) => a.id === caregiverId);
        if (!cg) return;
        const updated: Caregiver = { ...cg, status: "active" as CaregiverStatus, accepted_at: new Date().toISOString() };
        const newList = additionalCaregivers.map((a) => (a.id === caregiverId ? updated : a));
        patchDemoParent({
          additionalCaregivers: newList,
          secondaryCaregiver: newList[0],
          secondaryContact: newList[0] ? caregiverToContact(newList[0]) : undefined,
          caregiverAuditLog: pushAudit(demoParent.caregiverAuditLog, caregiverId, "invitation_accepted",
            `${cg.first_name} ${cg.last_name} accepted invitation`),
        });
      } else {
        updateCgMut.mutate({ id: caregiverId, patch: { status: "active", accepted_at: new Date().toISOString() } });
        setRealAdditionalCgs((prev) =>
          prev.map((a) => a.id === caregiverId ? { ...a, status: "active", accepted_at: new Date().toISOString() } : a),
        );
      }
    },
    [isDemo, additionalCaregivers, demoParent, patchDemoParent, updateCgMut],
  );

  const resendCaregiverInvite = useCallback(
    (caregiverId: string) => {
      if (isDemo) {
        const cg = additionalCaregivers.find((a) => a.id === caregiverId);
        if (!cg) return;
        const updated: Caregiver = { ...cg, invited_at: new Date().toISOString() };
        const newList = additionalCaregivers.map((a) => (a.id === caregiverId ? updated : a));
        patchDemoParent({
          additionalCaregivers: newList,
          caregiverAuditLog: pushAudit(demoParent.caregiverAuditLog, caregiverId, "invitation_resent",
            `Invitation resent to ${cg.first_name} ${cg.last_name}`),
        });
      }
    },
    [isDemo, additionalCaregivers, demoParent, patchDemoParent],
  );

  const updateCaregiverPermissions = useCallback(
    (caregiverId: string, patch: Partial<CaregiverPermissions>) => {
      if (isDemo) {
        const cg = additionalCaregivers.find((a) => a.id === caregiverId);
        if (!cg) return;
        const updated: Caregiver = { ...cg, ...patch };
        const newList = additionalCaregivers.map((a) => (a.id === caregiverId ? updated : a));
        patchDemoParent({
          additionalCaregivers: newList,
          secondaryCaregiver: newList[0],
          secondaryContact: newList[0] ? caregiverToContact(newList[0]) : undefined,
          caregiverAuditLog: pushAudit(demoParent.caregiverAuditLog, caregiverId, "permission_changed",
            `Permissions updated for ${cg.first_name} ${cg.last_name}`),
        });
      } else {
        updateCgMut.mutate({ id: caregiverId, patch });
        setRealAdditionalCgs((prev) =>
          prev.map((a) => (a.id === caregiverId ? { ...a, ...patch } : a)),
        );
      }
    },
    [isDemo, additionalCaregivers, demoParent, patchDemoParent, updateCgMut],
  );

  const disableCaregiver = useCallback(
    (caregiverId: string) => {
      if (isDemo) {
        const cg = additionalCaregivers.find((a) => a.id === caregiverId);
        if (!cg) return;
        const updated: Caregiver = { ...cg, status: "disabled" as CaregiverStatus };
        const newList = additionalCaregivers.map((a) => (a.id === caregiverId ? updated : a));
        patchDemoParent({
          additionalCaregivers: newList,
          caregiverAuditLog: pushAudit(demoParent.caregiverAuditLog, caregiverId, "caregiver_disabled",
            `${cg.first_name} ${cg.last_name} disabled`),
        });
      } else {
        updateCgMut.mutate({ id: caregiverId, patch: { status: "disabled" } });
        setRealAdditionalCgs((prev) =>
          prev.map((a) => a.id === caregiverId ? { ...a, status: "disabled" } : a),
        );
      }
    },
    [isDemo, additionalCaregivers, demoParent, patchDemoParent, updateCgMut],
  );

  const enableCaregiver = useCallback(
    (caregiverId: string) => {
      if (isDemo) {
        const cg = additionalCaregivers.find((a) => a.id === caregiverId);
        if (!cg) return;
        const updated: Caregiver = { ...cg, status: "active" as CaregiverStatus };
        const newList = additionalCaregivers.map((a) => (a.id === caregiverId ? updated : a));
        patchDemoParent({
          additionalCaregivers: newList,
          caregiverAuditLog: pushAudit(demoParent.caregiverAuditLog, caregiverId, "caregiver_enabled",
            `${cg.first_name} ${cg.last_name} re-enabled`),
        });
      } else {
        updateCgMut.mutate({ id: caregiverId, patch: { status: "active" } });
        setRealAdditionalCgs((prev) =>
          prev.map((a) => a.id === caregiverId ? { ...a, status: "active" } : a),
        );
      }
    },
    [isDemo, additionalCaregivers, demoParent, patchDemoParent, updateCgMut],
  );

  const removeCaregiver = useCallback(
    (caregiverId: string) => {
      if (isDemo) {
        const cg = additionalCaregivers.find((a) => a.id === caregiverId);
        if (!cg) return;
        const updated: Caregiver = { ...cg, status: "removed" as CaregiverStatus };
        const newList = additionalCaregivers.map((a) => (a.id === caregiverId ? updated : a));
        patchDemoParent({
          additionalCaregivers: newList,
          caregiverAuditLog: pushAudit(demoParent.caregiverAuditLog, caregiverId, "caregiver_removed",
            `${cg.first_name} ${cg.last_name} removed`),
        });
      } else {
        removeCgMut.mutate(caregiverId);
        setRealAdditionalCgs((prev) => prev.filter((a) => a.id !== caregiverId));
      }
    },
    [isDemo, additionalCaregivers, demoParent, patchDemoParent, removeCgMut],
  );

  const updateCaregiver = useCallback(
    (caregiverId: string, patch: Partial<Caregiver>) => {
      if (isDemo) {
        const isPrimary = caregiverId === demoParent.primaryCaregiver?.id;
        const isAdditional = additionalCaregivers.some((a) => a.id === caregiverId);
        if (isPrimary) {
          const updated: Caregiver = { ...demoParent.primaryCaregiver, ...patch };
          patchDemoParent({
            primaryCaregiver: updated,
            primaryContact: caregiverToContact(updated),
          });
        } else if (isAdditional) {
          const newList = additionalCaregivers.map((a) => (a.id === caregiverId ? { ...a, ...patch } : a));
          patchDemoParent({
            additionalCaregivers: newList,
            secondaryCaregiver: newList[0],
            secondaryContact: newList[0] ? caregiverToContact(newList[0]) : undefined,
          });
        }
      } else {
        updateCgMut.mutate({ id: caregiverId, patch });
        if (caregiverId === realCaregiver?.id) {
          setRealCaregiver((prev) => prev ? { ...prev, ...patch } : prev);
        } else {
          setRealAdditionalCgs((prev) =>
            prev.map((a) => (a.id === caregiverId ? { ...a, ...patch } : a)),
          );
        }
      }
    },
    [isDemo, demoParent, additionalCaregivers, realCaregiver, patchDemoParent, updateCgMut],
  );

  /* ── Context value ──────────────────────────────────────────────── */
  const ctx = useMemo((): ParentCtx => ({
    isLoading: loadState === "loading",
    loadError: loadState === "error" ? "Failed to load caregiver data. Please try again." : null,
    loadState,
    parent,
    primaryContact,
    secondaryContact,
    primaryCaregiver,
    secondaryCaregiver,
    additionalCaregivers,
    children: parentChildren,
    switchParent,
    addChild,
    removeChild,
    updateChild,
    updatePrimaryContact,
    setSecondaryContact,
    removeSecondaryContact,
    inviteCaregiver,
    acceptCaregiverInvite,
    resendCaregiverInvite,
    updateCaregiverPermissions,
    disableCaregiver,
    enableCaregiver,
    removeCaregiver,
    updateCaregiver,
    auditLog,
  }), [
    loadState, parent, primaryContact, secondaryContact,
    primaryCaregiver, secondaryCaregiver, additionalCaregivers,
    parentChildren, switchParent, addChild, removeChild, updateChild,
    updatePrimaryContact, setSecondaryContact, removeSecondaryContact,
    inviteCaregiver, acceptCaregiverInvite, resendCaregiverInvite,
    updateCaregiverPermissions, disableCaregiver, enableCaregiver,
    removeCaregiver, updateCaregiver, auditLog,
  ]);

  return (
    <ParentContext.Provider value={ctx}>
      {children}
    </ParentContext.Provider>
  );
}

export function useParent() {
  const ctx = useContext(ParentContext);
  if (!ctx) throw new Error("useParent must be used within ParentProvider");
  return ctx;
}

/** Loading skeleton component for parent portal pages. */
export function ParentLoadingSkeleton({ lines = 5 }: { lines?: number }) {
  return (
    <div className="space-y-4 animate-pulse p-6">
      <div className="h-8 w-48 bg-muted rounded-lg" />
      <div className="h-4 w-72 bg-muted rounded" />
      <div className="space-y-3 mt-6">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Empty state for parent portal when no caregiver account is found. */
export function NoCaregiverFound({ email }: { email?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber/10 text-amber">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
        </svg>
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold">No caregiver account found</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {email
          ? `No caregiver account is linked to ${email}. Please contact your studio administrator.`
          : "Your account isn't linked to any family profiles yet. Ask your studio to add you as a caregiver."}
      </p>
    </div>
  );
}

/** Error state for parent portal when data fails to load. */
export function ParentLoadError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose/10 text-rose">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold">Something went wrong</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {message ?? "We couldn't load your family data. Please try again."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
        >
          Try again
        </button>
      )}
    </div>
  );
}
