import { createContext, useCallback, useContext, useMemo, useState } from "react";

import {
  parentAccounts,
  studio as defaultStudio,
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
import { useStudents } from "./store";

/* ── Helpers ─────────────────────────────────────────────────────── */

function newId(prefix: string): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function pushAudit(
  log: CaregiverAuditEvent[] | undefined,
  caregiverId: string,
  accountId: string,
  event: string,
  details?: string,
): CaregiverAuditEvent[] {
  const entry: CaregiverAuditEvent = {
    id: newId("alog"),
    caregiverId,
    accountId,
    timestamp: new Date().toISOString(),
    event,
    details,
  };
  return [...(log ?? []), entry];
}

/* ── Shared parent / family state ─────────────────────────────────── */

interface ParentCtx {
  /** The currently logged-in parent account (demo: Diane Walsh) */
  parent: ParentAccount;
  /** Convenience: the primary contact (legacy) */
  primaryContact: FamilyContact;
  /** Convenience: the secondary contact, if any (legacy — first additional caregiver) */
  secondaryContact: FamilyContact | undefined;
  /** The canonical primary caregiver record */
  primaryCaregiver: Caregiver;
  /** The first additional caregiver, if any (legacy — kept for backward compat) */
  secondaryCaregiver: Caregiver | undefined;
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
      | "id"
      | "studioId"
      | "caregiverId"
      | "caregiverName"
      | "caregiverEmail"
      | "classIds"
      | "attendanceRate"
      | "payment"
      | "balanceCents"
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
  updateCaregiver: (
    caregiverId: string,
    patch: Partial<Caregiver>,
  ) => void;
  /** Full audit trail for the current parent account */
  auditLog: CaregiverAuditEvent[];
}

const ParentContext = createContext<ParentCtx | null>(null);

export function ParentProvider({ children }: { children: React.ReactNode }) {
  const [accountId, setAccountId] = useState<string>(parentAccounts[0].id);
  const [allParents, setAllParents] = useState<ParentAccount[]>(parentAccounts);

  // Derive students from the shared context (enrolment-aware), not standalone demo data.
  // This ensures admin-made enrolment changes are reflected in the parent portal.
  const { students: sharedStudents, addStudent: sharedAddStudent, updateStudent: sharedUpdateStudent } = useStudents();

  const parent = useMemo(
    () => allParents.find((p) => p.id === accountId) ?? allParents[0],
    [allParents, accountId],
  );

  const primaryContact = parent.primaryContact;
  const additionalCaregivers = parent.additionalCaregivers ?? [];
  const secondaryCaregiver = additionalCaregivers[0];
  const secondaryContact = secondaryCaregiver
    ? caregiverToContact(secondaryCaregiver)
    : undefined;
  const primaryCaregiver = parent.primaryCaregiver;
  const auditLog = parent.caregiverAuditLog ?? [];

  const parentChildren = useMemo(
    () => sharedStudents.filter((s) => parent.childIds.includes(s.id)),
    [sharedStudents, parent.childIds],
  );

  const switchParent = useCallback((id: string) => setParentId(id), []);

  /* ── Patch the current parent record ─────────────────────────── */
  const patchParent = useCallback(
    (patch: Partial<ParentAccount>) => {
      setAllParents((prev) =>
        prev.map((p) => (p.id === parent.id ? { ...p, ...patch } : p)),
      );
    },
    [parent.id],
  );

  /* ── Child management ────────────────────────────────────────── */
  const addChild = useCallback(
    (
      child: Omit<
        Student,
        | "id"
        | "studioId"
        | "caregiverId"
        | "caregiverName"
        | "caregiverEmail"
        | "classIds"
        | "attendanceRate"
        | "payment"
        | "balanceCents"
      >,
    ) => {
      const pc = parent.primaryContact;
      // Delegate to shared context so the new child appears everywhere.
      // addStudent returns the new ID synchronously — use it directly.
      const newId = sharedAddStudent({
        ...child,
        caregiverId: parent.id,
        caregiverName: `${pc.firstName} ${pc.lastName}`,
        caregiverEmail: pc.email,
        classIds: [],
        attendanceRate: 1,
        waiver: child.waiver ?? "missing",
        payment: "paid",
        balanceCents: 0,
      });
      // Immediately link the new child to this parent
      patchParent({ childIds: [...parent.childIds, newId] });
    },
    [parent, sharedAddStudent, patchParent],
  );

  const removeChild = useCallback(
    (id: string) => {
      // Only unlink from parent — don't delete the student record
      patchParent({
        childIds: parent.childIds.filter((cid) => cid !== id),
      });
    },
    [parent.childIds, patchParent],
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
      patchParent({
        primaryContact: { ...parent.primaryContact, ...patch },
        primaryCaregiver: {
          ...parent.primaryCaregiver,
          first_name: patch.firstName ?? parent.primaryCaregiver.first_name,
          last_name: patch.lastName ?? parent.primaryCaregiver.last_name,
          email: patch.email ?? parent.primaryCaregiver.email,
          phone: patch.phone ?? parent.primaryCaregiver.phone,
          address: patch.address ?? parent.primaryCaregiver.address,
          relationship_to_student:
            patch.relationshipToStudent ??
            parent.primaryCaregiver.relationship_to_student,
        },
      });
    },
    [parent.primaryContact, parent.primaryCaregiver, patchParent],
  );

  const setSecondaryContact = useCallback(
    (contact: FamilyContact) => {
      // Legacy: update first additional caregiver
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
        status: existing?.status ?? "active",
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
      patchParent({
        additionalCaregivers: newList,
        secondaryContact: contact,
        secondaryCaregiver: cg,
      });
    },
    [additionalCaregivers, patchParent],
  );

  const removeSecondaryContact = useCallback(() => {
    // Legacy: remove first additional caregiver
    const removed = additionalCaregivers.slice(1);
    patchParent({
      additionalCaregivers: removed,
      secondaryContact: undefined,
      secondaryCaregiver: removed[0],
    });
  }, [additionalCaregivers, patchParent]);

  /* ── Caregiver management (multi-caregiver, ID-based) ───────── */

  const inviteCaregiver = useCallback(
    (data: Omit<Caregiver, "id" | "status" | "role">) => {
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
      patchParent({
        additionalCaregivers: newList,
        secondaryCaregiver: first,
        secondaryContact: first ? caregiverToContact(first) : undefined,
        caregiverAuditLog: pushAudit(
          parent.caregiverAuditLog,
          cg.id,
          parent.id,
          "caregiver_nominated",
          `${cg.first_name} ${cg.last_name} nominated as additional caregiver`,
        ),
      });
    },
    [parent, additionalCaregivers, patchParent],
  );

  const acceptCaregiverInvite = useCallback(
    (caregiverId: string) => {
      const cg = additionalCaregivers.find((a) => a.id === caregiverId);
      if (!cg) return;
      const updated: Caregiver = {
        ...cg,
        status: "active" as CaregiverStatus,
        accepted_at: new Date().toISOString(),
      };
      const newList = additionalCaregivers.map((a) =>
        a.id === caregiverId ? updated : a,
      );
      const first = newList[0];
      patchParent({
        additionalCaregivers: newList,
        secondaryCaregiver: first,
        secondaryContact: first ? caregiverToContact(first) : undefined,
        caregiverAuditLog: pushAudit(
          parent.caregiverAuditLog,
          caregiverId,
          parent.id,
          "invitation_accepted",
          `${cg.first_name} ${cg.last_name} accepted invitation`,
        ),
      });
    },
    [parent, additionalCaregivers, patchParent],
  );

  const resendCaregiverInvite = useCallback(
    (caregiverId: string) => {
      const cg = additionalCaregivers.find((a) => a.id === caregiverId);
      if (!cg) return;
      const updated: Caregiver = { ...cg, invited_at: new Date().toISOString() };
      const newList = additionalCaregivers.map((a) =>
        a.id === caregiverId ? updated : a,
      );
      patchParent({
        additionalCaregivers: newList,
        caregiverAuditLog: pushAudit(
          parent.caregiverAuditLog,
          caregiverId,
          parent.id,
          "invitation_resent",
          `Invitation resent to ${cg.first_name} ${cg.last_name}`,
        ),
      });
    },
    [parent, additionalCaregivers, patchParent],
  );

  const updateCaregiverPermissions = useCallback(
    (caregiverId: string, patch: Partial<CaregiverPermissions>) => {
      const cg = additionalCaregivers.find((a) => a.id === caregiverId);
      if (!cg) return;
      const updated: Caregiver = { ...cg, ...patch };
      const newList = additionalCaregivers.map((a) =>
        a.id === caregiverId ? updated : a,
      );
      const first = newList[0];
      patchParent({
        additionalCaregivers: newList,
        secondaryCaregiver: first,
        secondaryContact: first ? caregiverToContact(first) : undefined,
        caregiverAuditLog: pushAudit(
          parent.caregiverAuditLog,
          caregiverId,
          parent.id,
          "permission_changed",
          `Permissions updated for ${cg.first_name} ${cg.last_name}`,
        ),
      });
    },
    [parent, additionalCaregivers, patchParent],
  );

  const disableCaregiver = useCallback(
    (caregiverId: string) => {
      const cg = additionalCaregivers.find((a) => a.id === caregiverId);
      if (!cg) return;
      const updated: Caregiver = {
        ...cg,
        status: "disabled" as CaregiverStatus,
      };
      const newList = additionalCaregivers.map((a) =>
        a.id === caregiverId ? updated : a,
      );
      patchParent({
        additionalCaregivers: newList,
        caregiverAuditLog: pushAudit(
          parent.caregiverAuditLog,
          caregiverId,
          parent.id,
          "caregiver_disabled",
          `${cg.first_name} ${cg.last_name} disabled`,
        ),
      });
    },
    [parent, additionalCaregivers, patchParent],
  );

  const enableCaregiver = useCallback(
    (caregiverId: string) => {
      const cg = additionalCaregivers.find((a) => a.id === caregiverId);
      if (!cg) return;
      const updated: Caregiver = {
        ...cg,
        status: "active" as CaregiverStatus,
      };
      const newList = additionalCaregivers.map((a) =>
        a.id === caregiverId ? updated : a,
      );
      patchParent({
        additionalCaregivers: newList,
        caregiverAuditLog: pushAudit(
          parent.caregiverAuditLog,
          caregiverId,
          parent.id,
          "caregiver_enabled",
          `${cg.first_name} ${cg.last_name} re-enabled`,
        ),
      });
    },
    [parent, additionalCaregivers, patchParent],
  );

  const removeCaregiver = useCallback(
    (caregiverId: string) => {
      const cg = additionalCaregivers.find((a) => a.id === caregiverId);
      if (!cg) return;
      // Soft-delete: mark as removed instead of deleting from array
      const updated: Caregiver = {
        ...cg,
        status: "removed" as CaregiverStatus,
      };
      const newList = additionalCaregivers.map((a) =>
        a.id === caregiverId ? updated : a,
      );
      patchParent({
        additionalCaregivers: newList,
        caregiverAuditLog: pushAudit(
          parent.caregiverAuditLog,
          caregiverId,
          parent.id,
          "caregiver_removed",
          `${cg.first_name} ${cg.last_name} removed`,
        ),
      });
    },
    [parent, additionalCaregivers, patchParent],
  );

  const updateCaregiver = useCallback(
    (caregiverId: string, patch: Partial<Caregiver>) => {
      const isPrimary = caregiverId === parent.primaryCaregiver?.id;
      const isAdditional = additionalCaregivers.some((a) => a.id === caregiverId);

      if (isPrimary) {
        const updated: Caregiver = { ...parent.primaryCaregiver, ...patch };
        patchParent({
          primaryCaregiver: updated,
          primaryContact: caregiverToContact(updated),
        });
      } else if (isAdditional) {
        const newList = additionalCaregivers.map((a) =>
          a.id === caregiverId ? { ...a, ...patch } : a,
        );
        const first = newList[0];
        patchParent({
          additionalCaregivers: newList,
          secondaryCaregiver: first,
          secondaryContact: first ? caregiverToContact(first) : undefined,
        });
      }
    },
    [parent, additionalCaregivers, patchParent],
  );

  return (
    <ParentContext.Provider
      value={{
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
      }}
    >
      {children}
    </ParentContext.Provider>
  );
}

export function useParent() {
  const ctx = useContext(ParentContext);
  if (!ctx) throw new Error("useParent must be used within ParentProvider");
  return ctx;
}
