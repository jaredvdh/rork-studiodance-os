/** Core domain types for StudioFlow. Every tenant-aware record carries studioId,
 * mirroring the multi-tenant Supabase schema (studio_id + row-level security). */

/* ── Enrolment types ─────────────────────────────────────────────── */

export type EnrolmentStatus = "active" | "waitlisted" | "withdrawn" | "completed";

/** Canonical enrolment record — the single source of truth for which student
 * is in which class. Replaces the dual array+counter tracking previously
 * maintained in `students.classIds` and `classes.enrolled`. */
export interface Enrolment {
  id: string;
  studioId: string;
  studentId: string;
  classId: string;
  status: EnrolmentStatus;
  startedAt: string;  // ISO
  endedAt?: string;   // ISO — set on withdraw or completion
  createdAt: string;
  updatedAt: string;
}

/* ── Child / Minor Participant Registration Types ───────────────── */

/** An individual authorized to pick up a child from the studio. */
export interface AuthorizedPickupContact {
  name: string;
  relationship: string;
  phone: string;
  authorized: boolean;
}

/** Structured medical and safety information captured during child registration. */
export interface ChildMedicalInfo {
  allergies?: string;
  medications?: string;
  medicalConditions?: string;
  hasAsthma: boolean;
  hasInhaler: boolean;
  hasEpiPen: boolean;
  activityRestrictions?: string;
  safetyNotes?: string;
}

/** Guardian consent record captured during child registration. */
export interface GuardianConsent {
  guardianConfirmed: boolean;
  guardianRelationship: string;
  guardianId: string;
  consentTimestamp: string;
}

/** Emergency contact attached to a child's profile. */
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  secondaryPhone?: string;
  canPickup: boolean;
}

/** Individual waiver type status. Mirrors WaiverStatus but per-waiver-type granularity. */
export type IndividualWaiverStatus = "signed" | "pending" | "missing";

/** Per-waiver-type tracking for child profiles. */
export interface ChildWaivers {
  liability: IndividualWaiverStatus;
  medicalConsent: IndividualWaiverStatus;
  photoVideo: IndividualWaiverStatus;
  codeOfConduct: IndividualWaiverStatus;
  privacyData: IndividualWaiverStatus;
}

export const DEFAULT_CHILD_WAIVERS: ChildWaivers = {
  liability: "missing",
  medicalConsent: "missing",
  photoVideo: "missing",
  codeOfConduct: "missing",
  privacyData: "missing",
};

/** Complete registration payload from the multi-step child registration wizard. */
export interface ChildRegistrationPayload {
  // Step 1 — Child details
  legalFirstName: string;
  legalLastName: string;
  preferredName?: string;
  dob: string;
  gender?: string;
  pronouns?: string;
  schoolGrade?: string;

  // Step 2 — Guardian confirmation
  guardianConfirmed: boolean;
  guardianRelationship: string;
  guardianId: string;

  // Step 3 — Emergency & pickup
  emergencyContact: EmergencyContact;
  authorizedPickupContacts: AuthorizedPickupContact[];

  // Step 4 — Medical & safety
  medicalInfo: ChildMedicalInfo;
  medicalInfoConfirmed: boolean;

  // Derived (generated at submission)
  consentTimestamp: string;
}

export type Vertical =
  | "dance"
  | "yoga"
  | "crossfit"
  | "gym"
  | "martial_arts"
  | "music_school";

/** Class style — formerly DanceStyle. The available values depend on the studio vertical. */
export type ClassStyle =
  | "Ballet"
  | "Jazz"
  | "Hip Hop"
  | "Contemporary"
  | "Tap"
  | "Lyrical"
  | "Acro";

/** @deprecated Use ClassStyle instead. Kept for backward compatibility. */
export type DanceStyle = ClassStyle;

export type AgeGroup = "Tiny Tots" | "Junior" | "Intermediate" | "Senior" | "Adult";

export type WeekDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export type PayType = "employee" | "1099";

export interface Studio {
  id: string;
  name: string;
  tagline: string;
  city: string;
  brandColor: string;
  initials: string;
  logoUrl?: string;
  vertical: Vertical;
}

export interface Class {
  id: string;
  studioId: string;
  name: string;
  style: ClassStyle;
  ageGroup: AgeGroup;
  day: WeekDay;
  startTime: string; // "16:30"
  durationMins: number;
  room: string;
  teacherId: string;
  capacity: number;
  enrolled: number;
  waitlist: number;
  inRecital: boolean;
  priceCents: number;
}

/** @deprecated Use Class instead. Kept for backward compatibility. */
export type DanceClass = Class;

export interface Teacher {
  id: string;
  studioId: string;
  name: string;
  styles: ClassStyle[];
  email: string;
  hourlyRateCents?: number;
  payType?: PayType;
}

export type WaiverStatus = "signed" | "pending" | "missing";
export type PaymentStatus = "paid" | "due" | "overdue";

export interface Student {
  id: string;
  studioId: string;
  /** Display name — derived from legalFirstName + legalLastName for new records, raw name for legacy. */
  name: string;
  /** Legal first name (new registration flow). */
  legalFirstName?: string;
  /** Legal last name (new registration flow). */
  legalLastName?: string;
  /** Preferred / nickname. */
  preferredName?: string;
  dob: string; // ISO
  /** Age group auto-derived from DOB at registration time. */
  ageAtRegistration?: number;
  gender?: string;
  pronouns?: string;
  schoolGrade?: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  classIds: string[];
  attendanceRate: number; // 0..1
  waiver: WaiverStatus;
  /** Per-waiver-type tracking (new registration flow). */
  waivers?: ChildWaivers;
  payment: PaymentStatus;
  balanceCents: number;
  medicalNotes?: string;
  allergies?: string;
  /** Structured medical info (new registration flow). */
  medicalInfo?: ChildMedicalInfo;
  medicalInfoConfirmed?: boolean;
  // Emergency contact (new registration flow)
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  emergencyContactSecondaryPhone?: string;
  emergencyContactCanPickup?: boolean;
  // Authorized pickup contacts (new registration flow)
  authorizedPickupContacts?: AuthorizedPickupContact[];
  // Guardian consent (new registration flow)
  guardianConfirmed?: boolean;
  guardianRelationship?: string;
  guardianId?: string;
  consentTimestamp?: string;
}

export type AnnouncementScope = "Studio-wide" | "Class" | "Recital" | "Emergency";

export interface Announcement {
  id: string;
  studioId: string;
  title: string;
  body: string;
  scope: AnnouncementScope;
  sentAt: string; // ISO
  audience: string;
  reach: number;
}

export interface Invoice {
  id: string;
  studioId: string;
  studentName: string;
  parentName: string;
  description: string;
  amountCents: number;
  status: PaymentStatus;
  dueDate: string; // ISO
  /** Optional link to the enrolment this invoice was generated from. */
  enrolmentId?: string;
}

export interface RevenuePoint {
  month: string;
  revenueCents: number;
  enrollments: number;
}

export interface RecitalPerformance {
  id: string;
  studioId: string;
  name: string;
  classIds: string[];
  order: number;
  startTime?: string; // "19:30" — act start time
  notes?: string;
  costumeNote?: string;
}

/** A family contact — primary or secondary parent/guardian. */
export interface FamilyContact {
  firstName: string;
  lastName: string;
  relationshipToStudent: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  householdLabel?: string;
  receivesEmails: boolean;
  receivesSMS: boolean;
  receivesBilling: boolean;
  emergencyContact: boolean;
}

/** Returns the full display name of a family contact. */
export function contactFullName(c: FamilyContact): string {
  return `${c.firstName} ${c.lastName}`;
}

/* ── Caregiver model (two-caregiver architecture) ──────────────────── */

export type CaregiverStatus = "invited" | "active" | "disabled" | "removed";
export type CaregiverRole = "primary_caregiver" | "secondary_caregiver" | "additional_caregiver" | "emergency_contact_only";

/** Granular permission set for a caregiver. Safe defaults are applied
 * automatically when a secondary caregiver is first nominated. */
export interface CaregiverPermissions {
  receives_announcements: boolean;
  receives_emergency_messages: boolean;
  can_view_schedule: boolean;
  can_view_billing: boolean;
  can_pay_invoices: boolean;
  can_manage_enrolments: boolean;
  can_sign_waivers: boolean;
  can_view_medical_notes: boolean;
  authorized_pickup: boolean;
}

/** Default (safe) permissions for a newly-invited secondary caregiver. */
export const SAFE_SECONDARY_DEFAULTS: CaregiverPermissions = {
  receives_announcements: true,
  receives_emergency_messages: true,
  can_view_schedule: true,
  can_view_billing: false,
  can_pay_invoices: false,
  can_manage_enrolments: false,
  can_sign_waivers: false,
  can_view_medical_notes: false,
  authorized_pickup: false,
};

/** Full caregiver record — the canonical model for any adult attached
 * to a family account. Replaces the old FamilyContact for new flows. */
export interface Caregiver extends CaregiverPermissions {
  id: string;
  first_name: string;
  last_name: string;
  relationship_to_student: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  household_label?: string;
  status: CaregiverStatus;
  role: CaregiverRole;
  invited_at?: string;
  accepted_at?: string;
  /** Admin-only visibility flags (never exposed in parent portal). */
  custody_restriction?: boolean;
  court_order_on_file?: boolean;
  communication_only?: boolean;
}

/** Derive a legacy FamilyContact from a Caregiver so existing UI
 * that reads primaryContact / secondaryContact keeps working. */
export function caregiverToContact(c: Caregiver): FamilyContact {
  return {
    firstName: c.first_name,
    lastName: c.last_name,
    relationshipToStudent: c.relationship_to_student,
    email: c.email,
    phone: c.phone,
    address: c.address,
    city: c.city,
    state: c.state,
    zip: c.zip,
    householdLabel: c.household_label,
    receivesEmails: c.receives_announcements,
    receivesSMS: c.receives_emergency_messages,
    receivesBilling: c.can_view_billing || c.can_pay_invoices,
    emergencyContact: c.authorized_pickup || c.receives_emergency_messages,
  };
}

/** Full name for a caregiver. */
export function caregiverFullName(c: Caregiver): string {
  return `${c.first_name} ${c.last_name}`;
}

/** Audit-log entry for caregiver lifecycle events. */
export interface CaregiverAuditEvent {
  id: string;
  caregiverId: string;
  parentId: string;
  timestamp: string;
  event: string;
  details?: string;
}

export interface ParentAccount {
  id: string;
  studioId: string;
  primaryContact: FamilyContact;
  /** @deprecated Use additionalCaregivers instead. */
  secondaryContact?: FamilyContact;
  /** Canonical caregiver records (always present for new accounts). */
  primaryCaregiver: Caregiver;
  /** @deprecated Use additionalCaregivers instead — kept for backward compat. Points to additionalCaregivers[0]. */
  secondaryCaregiver?: Caregiver;
  /** All additional caregivers beyond the primary. Supports families with multiple
   * households (e.g., separated parents, each with a partner). */
  additionalCaregivers: Caregiver[];
  /** Audit trail for sensitive caregiver events. */
  caregiverAuditLog?: CaregiverAuditEvent[];
  childIds: string[];
}

export interface RecitalEvent {
  id: string;
  studioId: string;
  name: string;
  date: string; // ISO
  venue: string;
  performances: RecitalPerformance[];
  costumeDeadline?: string; // ISO
}
