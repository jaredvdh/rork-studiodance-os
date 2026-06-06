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
  // Dance
  | "Ballet" | "Jazz" | "Hip Hop" | "Contemporary" | "Tap" | "Lyrical" | "Acro"
  // Yoga
  | "Vinyasa" | "Hatha" | "Yin" | "Restorative" | "Power Yoga"
  // CrossFit / Gym
  | "Strength" | "Conditioning" | "Olympic Lifting" | "Gymnastics" | "Mobility"
  // Martial Arts
  | "Beginner" | "Intermediate" | "Advanced" | "Sparring" | "Grading Prep"
  // Music
  | "Piano" | "Guitar" | "Voice" | "Violin" | "Drums";

/** @deprecated Use ClassStyle instead. Kept for backward compatibility. */
export type DanceStyle = ClassStyle;

export type AgeGroup = "Tiny Tots" | "Junior" | "Intermediate" | "Senior" | "Adult" | "All Levels";

export type WeekDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export type PayType = "employee" | "1099";

/** Regional settings shape stored within Studio.settings. */
export interface RegionalSettings {
  country: CountryCode;
  timezone: string;
  currency: CurrencyCode;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  measurementSystem: MeasurementSystem;
}

export type CountryCode = "CA" | "US" | "NZ" | "AU" | "GB" | "IE" | "EU" | "OTHER";
export type CurrencyCode = "CAD" | "USD" | "NZD" | "AUD" | "GBP" | "EUR";
export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
export type TimeFormat = "12h" | "24h";
export type MeasurementSystem = "metric" | "imperial";

/** Structured international address — replaces single free-text address fields. */
export interface Address {
  line1: string;
  line2?: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: CountryCode;
}

export interface Studio {
  id: string;
  name: string;
  tagline: string;
  city: string;
  brandColor: string;
  initials: string;
  logoUrl?: string;
  vertical: Vertical;
  /** Structured studio address (replaces single city string for intl support). */
  address?: Address;
  settings?: {
    preferredUnits?: "metric" | "imperial";
    /** Regional settings — becomes the platform-wide source of truth for all locale-dependent formatting. */
    regional?: RegionalSettings;
    /** Controls how measurements are collected — parent sizing only, full measurements, studio-only, or hybrid. */
    measurementCollectionMode?: MeasurementCollectionMode;
  };
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

export type InstructorStatus = "active" | "on_leave" | "archived";

export const INSTRUCTOR_STATUS_LABELS: Record<InstructorStatus, string> = {
  active: "Active",
  on_leave: "On Leave",
  archived: "Archived",
};

export interface Certification {
  name: string;
  issuedAt?: string;
  expiresAt?: string;
  notes?: string;
}

export interface InstructorDocument {
  id: string;
  studioId: string;
  instructorId: string;
  title: string;
  documentType: string; // e.g. "employment_agreement", "certification", "background_check", "insurance"
  fileUrl?: string;
  fileName?: string;
  expiresAt?: string;
  uploadedAt: string;
  notes?: string;
}

export interface EmergencyContact_Teacher {
  name: string;
  relationship: string;
  phone: string;
}

/** Instructor skill/qualification — studio-defined categories replacing hardcoded dance styles. */
export interface Skill {
  name: string;
  /** Optional vertical context (e.g., dance styles, CrossFit certs, yoga styles). Stored as free text so any vertical works. */
  category?: string;
}

export interface Teacher {
  id: string;
  studioId: string;
  name: string;
  preferredName?: string;
  /** @deprecated Use skills instead. Kept for backward compatibility. */
  styles: ClassStyle[];
  /** Studio-defined skills / qualifications — replaces hardcoded dance styles. */
  skills?: Skill[];
  email: string;
  phone?: string;
  /** Structured international address. */
  address?: Address | string;
  emergencyContact?: EmergencyContact_Teacher;
  status: InstructorStatus;
  hireDate?: string;
  employeeId?: string;
  certifications: Certification[];
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
  caregiverId: string;
  caregiverName: string;
  caregiverEmail: string;
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
  caregiverName: string;
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
  /** Structured international address — replaces address/city/state/zip. */
  address?: Address | string;
  /** @deprecated Use address field instead. */
  city?: string;
  /** @deprecated Use address field instead. */
  state?: string;
  /** @deprecated Use address field instead. */
  zip?: string;
  householdLabel?: string;
  /** How the caregiver's address relates to the household. */
  addressSource?: AddressSource;
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
  /** Structured international address — replaces address/city/state/zip. */
  address?: Address | string;
  /** @deprecated Use address field instead. */
  city?: string;
  /** @deprecated Use address field instead. */
  state?: string;
  /** @deprecated Use address field instead. */
  zip?: string;
  household_label?: string;
  /** How the caregiver's address relates to the household. */
  addressSource?: AddressSource;
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

/* ── Address relationship types for caregivers ────────────────────── */

/** Describes how a caregiver's address relates to the family household. */
export type AddressSource =
  | "household"           // Lives at the household address
  | "separate"            // Has their own separate address on file
  | "billing"             // Address used only for billing
  | "emergency_only";     // No address — emergency contact only

export const ADDRESS_SOURCE_LABELS: Record<AddressSource, string> = {
  household: "Lives at household address",
  separate: "Separate address on file",
  billing: "Billing address",
  emergency_only: "Emergency contact only",
};

/** Determine the effective address source for a caregiver given the household data. */
export function resolveAddressSource(
  caregiver: Caregiver | FamilyContact,
  householdAddress?: Address,
): AddressSource {
  // Caregiver type
  if ("first_name" in caregiver && "role" in caregiver) {
    const cg = caregiver as Caregiver;
    if (cg.role === "emergency_contact_only") return "emergency_only";
    if (cg.addressSource) return cg.addressSource;
  }
  // FamilyContact type
  if ("firstName" in caregiver) {
    const fc = caregiver as FamilyContact;
    if (fc.addressSource) return fc.addressSource;
    if (fc.emergencyContact && !fc.receivesBilling && !fc.address) return "emergency_only";
  }
  // Heuristic: if caregiver has an address different from household, they're separate
  const cgAddr = ("address" in caregiver ? (caregiver as Caregiver).address : (caregiver as FamilyContact).address) as Address | string | undefined;
  if (!cgAddr && householdAddress) return "household";
  if (!cgAddr && !householdAddress) return "emergency_only";
  if (typeof cgAddr === "string") {
    // Can't compare string to structured, assume separate if different content
    return "separate";
  }
  if (householdAddress && cgAddr && typeof cgAddr === "object") {
    const a = cgAddr as Address;
    const ha = householdAddress;
    const same = a.line1 === ha.line1 && a.city === ha.city && a.postalCode === ha.postalCode && a.country === ha.country;
    return same ? "household" : "separate";
  }
  return householdAddress ? "household" : "emergency_only";
}

/** Format an Address for display on one line. */
export function formatAddressShort(addr?: Address | string | null): string {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  const parts = [addr.line1, addr.line2, addr.city, addr.stateOrProvince, addr.postalCode]
    .filter(Boolean);
  return parts.join(", ");
}

/** Format an Address for display across multiple lines. */
export function formatAddressMultiline(addr?: Address | string | null): string[] {
  if (!addr) return [];
  if (typeof addr === "string") return [addr];
  const lines: string[] = [addr.line1];
  if (addr.line2) lines.push(addr.line2);
  const cityRegion = [addr.city, addr.stateOrProvince, addr.postalCode].filter(Boolean).join(" ");
  if (cityRegion) lines.push(cityRegion);
  if (addr.country) lines.push(addr.country);
  return lines;
}

/** Create an empty address object with defaults. */
export function emptyAddress(country: CountryCode = "US"): Address {
  return { line1: "", city: "", stateOrProvince: "", postalCode: "", country };
}

/** Check if an Address is effectively empty (all fields blank). */
export function isAddressEmpty(addr?: Address | string | null): boolean {
  if (!addr) return true;
  if (typeof addr === "string") return addr.trim() === "";
  return !addr.line1 && !addr.line2 && !addr.city && !addr.stateOrProvince && !addr.postalCode;
}

/** Audit-log entry for caregiver lifecycle events. */
export interface CaregiverAuditEvent {
  id: string;
  caregiverId: string;
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
  /** Primary household address — the canonical address for this family. */
  householdAddress?: Address;
  /** Billing address — if different from household. */
  billingAddress?: Address;
  /** When the household address was last updated. */
  addressUpdatedAt?: string;
  /** Who last updated the address (caregiver ID or 'admin'). */
  addressUpdatedBy?: string;
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

/* ── Waiver & Document Compliance Types ──────────────────────────── */

export type WaiverTemplateType =
  | "liability"
  | "medical_consent"
  | "photo_video"
  | "code_of_conduct"
  | "privacy_data"
  | "payment_auth"
  | "travel_consent"
  | "event_release"
  | "custom";

export const WAIVER_TYPE_LABELS: Record<WaiverTemplateType, string> = {
  liability: "Liability Waiver",
  medical_consent: "Emergency Medical Consent",
  photo_video: "Photo/Video Consent",
  code_of_conduct: "Code of Conduct",
  privacy_data: "Privacy/Data Consent",
  payment_auth: "Payment Authorization",
  travel_consent: "Travel Consent",
  event_release: "Event/Competition Release",
  custom: "Custom Form",
};

export type TemplateStatus = "draft" | "published" | "archived";
export type RenewalPeriod = "once" | "annual" | "per_season" | "per_event";

export interface WaiverTemplate {
  id: string;
  studioId: string;
  title: string;
  description?: string;
  type: WaiverTemplateType;
  status: TemplateStatus;
  currentVersionId?: string;
  required: boolean;
  appliesTo: {
    scope: "all" | "class" | "age_group" | "program" | "event";
    targetIds?: string[];
  };
  renewalPeriod: RenewalPeriod;
  createdAt: string;
  updatedAt: string;
}

export interface WaiverVersion {
  id: string;
  waiverTemplateId: string;
  studioId: string;
  versionNumber: number;
  bodyHtml?: string;
  bodyMarkdown?: string;
  publishedAt?: string;
  createdBy?: string;
  archivedAt?: string;
  createdAt: string;
}

export type SignatureType = "typed" | "drawn";
export type SignatureStatus = "signed" | "expired" | "revoked";

export interface WaiverSignature {
  id: string;
  studioId: string;
  waiverTemplateId: string;
  waiverVersionId: string;
  studentId?: string;
  caregiverId?: string;
  signerName: string;
  signerRelationship?: string;
  signatureType: SignatureType;
  signatureData?: string;
  guardianAuthorityConfirmed: boolean;
  eSignConsent: boolean;
  signedAt: string;
  ipAddress?: string;
  userAgent?: string;
  status: SignatureStatus;
  pdfUrl?: string;
  metadata?: Record<string, unknown>;
}

export type DocumentType =
  | "scanned_waiver"
  | "signed_pdf"
  | "medical_plan"
  | "allergy_plan"
  | "custody_court"
  | "travel_consent"
  | "competition_release"
  | "insurance"
  | "custom";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  scanned_waiver: "Scanned Paper Waiver",
  signed_pdf: "Signed PDF",
  medical_plan: "Medical Plan",
  allergy_plan: "Allergy/Anaphylaxis Plan",
  custody_court: "Custody/Court Document",
  travel_consent: "Travel Consent",
  competition_release: "Competition Release",
  insurance: "Insurance Document",
  custom: "Custom Document",
};

export type VerificationStatus = "unverified" | "verified" | "rejected";
export type DocumentVisibility = "admin_only" | "caregiver_visible" | "staff_visible";

export interface UploadedDocument {
  id: string;
  studioId: string;
  familyId?: string;
  studentId?: string;
  classId?: string;
  eventId?: string;
  documentType: DocumentType;
  title: string;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  uploadedBy?: string;
  uploadedAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationStatus: VerificationStatus;
  expiryDate?: string;
  notes?: string;
  visibility: DocumentVisibility;
  createdAt: string;
  updatedAt: string;
}

/** Computed waiver compliance status for a student. */
export interface WaiverCompliance {
  studentId: string;
  outstandingCount: number;
  signedCount: number;
  expiredCount: number;
  templates: {
    template: WaiverTemplate;
    signature?: WaiverSignature;
    status: "pending" | "signed" | "expired" | "not_required";
  }[];
}

/* ── Costume Management Types ──────────────────────────────────── */

export type CostumeCategory =
  | "ballet"
  | "jazz"
  | "tap"
  | "contemporary"
  | "lyrical"
  | "acro"
  | "hip_hop"
  | "musical_theatre"
  | "other";

export const COSTUME_CATEGORY_LABELS: Record<CostumeCategory, string> = {
  ballet: "Ballet",
  jazz: "Jazz",
  tap: "Tap",
  contemporary: "Contemporary",
  lyrical: "Lyrical",
  acro: "Acro",
  hip_hop: "Hip Hop",
  musical_theatre: "Musical Theatre",
  other: "Other",
};

export type CostumeStatus = "draft" | "active" | "ordered" | "retired";
export const COSTUME_STATUS_LABELS: Record<CostumeStatus, string> = {
  draft: "Draft",
  active: "Active",
  ordered: "Ordered",
  retired: "Retired",
};

export interface Costume {
  id: string;
  studioId: string;
  name: string;
  sku?: string;
  vendor?: string;
  vendorWebsiteUrl?: string;
  productPageUrl?: string;
  style?: string;
  season?: string;
  category: CostumeCategory;
  colour?: string;
  description?: string;
  images: string[];
  vendorPdfUrl?: string;
  sizingChartPdfUrl?: string;
  careInstructions?: string;
  wholesaleCostCents: number;
  shippingAllocationCents: number;
  markupPct: number;
  retailCostCents: number;
  taxable: boolean;
  depositAmountCents: number;
  sizesAvailable: string[];
  sizingNotes?: string;
  autoSizingEnabled: boolean;
  isReusable: boolean;
  quantityOwned: number;
  storageLocation?: string;
  condition?: string;
  status: CostumeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CostumeAssignment {
  id: string;
  studioId: string;
  costumeId: string;
  classId?: string;
  studentId?: string;
  recitalPerformanceId?: string;
  routineName?: string;
  assignedCount: number;
  createdAt: string;
}

export type MeasurementStatus =
  | "draft"
  | "size_provided"
  | "studio_needed"
  | "studio_measured"
  | "parent_submitted"
  | "pending_review"
  | "approved"
  | "rejected";

export const MEASUREMENT_STATUS_LABELS: Record<MeasurementStatus, string> = {
  draft: "Draft",
  size_provided: "Size provided",
  studio_needed: "Studio measurement needed",
  studio_measured: "Studio measured",
  parent_submitted: "Parent submitted",
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

export type MeasurementCollectionMode =
  | "parent_size_only"
  | "parent_measurements"
  | "studio_only"
  | "hybrid";

export const MEASUREMENT_COLLECTION_MODE_LABELS: Record<MeasurementCollectionMode, string> = {
  parent_size_only: "Parent Size Only",
  parent_measurements: "Parent Measurements",
  studio_only: "Studio Measurements Only",
  hybrid: "Hybrid",
};

export type UnitSystem = "metric" | "imperial";

/** Who provided/owns this measurement record — used for admin+parent dual-entry workflow. */
export type MeasurementSource = "parent" | "studio" | "hybrid";

export interface StudentMeasurement {
  id: string;
  studioId: string;
  studentId: string;
  /** Parent-friendly sizing fields (simple mode). */
  clothingSize?: string;
  leotardSize?: string;
  /** Full advanced measurements (admin mode). */
  heightCm?: number;
  weightKg?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  girthCm?: number;
  inseamCm?: number;
  shoeSize?: string;
  measuredBy?: string;
  measuredAt?: string;
  submittedBy?: string;
  source: MeasurementSource;
  status: MeasurementStatus;
  notes?: string;
  createdAt: string;
}

export interface SizingChart {
  id: string;
  studioId: string;
  costumeId?: string;
  vendor: string;
  chartName: string;
  chartData: SizingChartRow[];
  fileUrl?: string;
  fileType?: "pdf" | "csv" | "excel" | "manual";
  createdAt: string;
}

export interface SizingChartRow {
  size: string;
  chestMin?: number;
  chestMax?: number;
  waistMin?: number;
  waistMax?: number;
  hipsMin?: number;
  hipsMax?: number;
  girthMin?: number;
  girthMax?: number;
  heightMin?: number;
  heightMax?: number;
  weightMin?: number;
  weightMax?: number;
  /** Unit system used by this chart row. If omitted, assumed metric (cm/kg). */
  unit?: UnitSystem;
}

export interface SizeRecommendation {
  id: string;
  studioId: string;
  studentId: string;
  costumeId: string;
  sizingChartId?: string;
  recommendedSize?: string;
  confidencePct?: number;
  alternativeSize?: string;
  reason?: string;
  flags: string[];
  approvedBy?: string;
  approvedAt?: string;
  parentApproved: boolean;
  parentNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CostumeFeeType = "included_in_tuition" | "full" | "deposit_balance" | "installment";
export type CostumeFeeStatus = "unpaid" | "partial" | "paid" | "waived";

export const COSTUME_FEE_TYPE_LABELS: Record<CostumeFeeType, string> = {
  included_in_tuition: "Included in Tuition",
  full: "Full Payment",
  deposit_balance: "Deposit + Balance",
  installment: "Installment Plan",
};

export interface CostumeFee {
  id: string;
  studioId: string;
  studentId: string;
  costumeId: string;
  feeType: CostumeFeeType;
  totalCents: number;
  paidCents: number;
  invoiceId?: string;
  status: CostumeFeeStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type VendorOrderStatus =
  | "draft"
  | "ordered"
  | "shipped"
  | "delivered"
  | "quality_checked"
  | "ready"
  | "distributed"
  | "cancelled";

export const VENDOR_ORDER_STATUS_LABELS: Record<VendorOrderStatus, string> = {
  draft: "Draft",
  ordered: "Ordered",
  shipped: "Shipped",
  delivered: "Delivered",
  quality_checked: "Quality Checked",
  ready: "Ready for Distribution",
  distributed: "Distributed",
  cancelled: "Cancelled",
};

export interface VendorOrder {
  id: string;
  studioId: string;
  vendor: string;
  poNumber?: string;
  orderDate?: string;
  expectedDelivery?: string;
  actualDelivery?: string;
  status: VendorOrderStatus;
  vendorNotes?: string;
  shippingCostCents: number;
  items: VendorOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface VendorOrderItem {
  id: string;
  vendorOrderId: string;
  costumeId: string;
  size: string;
  quantity: number;
  unitCostCents: number;
  createdAt: string;
}

export type AlterationStatus = "not_started" | "in_progress" | "complete" | "delivered";

export const ALTERATION_STATUS_LABELS: Record<AlterationStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  complete: "Complete",
  delivered: "Delivered",
};

export interface Alteration {
  id: string;
  studioId: string;
  studentId: string;
  costumeId: string;
  alterationType: string;
  assignedTo?: string;
  dueDate?: string;
  status: AlterationStatus;
  notes?: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CostumeDistribution {
  id: string;
  studioId: string;
  studentId: string;
  costumeId: string;
  itemsChecklist: { label: string; checked: boolean }[];
  signatureData?: string;
  signedBy?: string;
  signedAt?: string;
  missingItems: string[];
  notes?: string;
  receiptPdfUrl?: string;
  distributedBy?: string;
  createdAt: string;
}

export type InventoryCondition = "excellent" | "good" | "fair" | "damaged" | "retired";
export type InventoryStatus = "available" | "reserved" | "damaged" | "retired";

export const INVENTORY_CONDITION_LABELS: Record<InventoryCondition, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  damaged: "Damaged",
  retired: "Retired",
};

export interface ReusableCostume {
  id: string;
  studioId: string;
  costumeId: string;
  size: string;
  condition: InventoryCondition;
  purchaseDate?: string;
  lastUsed?: string;
  storageBin?: string;
  rackNumber?: string;
  status: InventoryStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type RentalStatus = "active" | "returned" | "overdue" | "damaged" | "lost";

export const RENTAL_STATUS_LABELS: Record<RentalStatus, string> = {
  active: "Active",
  returned: "Returned",
  overdue: "Overdue",
  damaged: "Damaged",
  lost: "Lost",
};

export interface CostumeRental {
  id: string;
  studioId: string;
  studentId: string;
  inventoryId?: string;
  costumeId: string;
  rentalFeeCents: number;
  depositCents: number;
  returnDate?: string;
  returnedAt?: string;
  damageFeeCents: number;
  status: RentalStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuickChangeConflict {
  id: string;
  studioId: string;
  recitalEventId?: string;
  studentId: string;
  routineA?: string;
  routineAEndTime?: string;
  routineB?: string;
  routineBStartTime?: string;
  estimatedChangeMinutes?: number;
  conflictDetected: boolean;
  recommendation?: string;
  resolved: boolean;
  createdAt: string;
}
