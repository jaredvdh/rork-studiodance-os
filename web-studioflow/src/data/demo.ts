import type {
  Announcement,
  Caregiver,
  CaregiverAuditEvent,
  Class,
  Enrolment,
  FamilyContact,
  Invoice,
  ParentAccount,
  RecitalEvent,
  RevenuePoint,
  Student,
  Studio,
  Teacher,
  WaiverTemplate,
  WaiverVersion,
  WaiverSignature,
  UploadedDocument,
} from "./types";
import { SAFE_SECONDARY_DEFAULTS } from "./types";

export const studio: Studio = {
  id: "stu_aurora",
  name: "Aurora Dance Academy",
  tagline: "Where every dancer finds their light",
  city: "Portland, OR",
  brandColor: "350 74% 60%",
  initials: "AD",
  vertical: "dance",
};

export const teachers: Teacher[] = [
  { id: "t1", studioId: studio.id, name: "Mara Delgado", styles: ["Ballet", "Lyrical"], email: "mara@aurora.dance", hourlyRateCents: 4500, payType: "employee" },
  { id: "t2", studioId: studio.id, name: "Theo Nakamura", styles: ["Hip Hop", "Jazz"], email: "theo@aurora.dance", hourlyRateCents: 5000, payType: "1099" },
  { id: "t3", studioId: studio.id, name: "Priya Anand", styles: ["Contemporary", "Lyrical"], email: "priya@aurora.dance", hourlyRateCents: 4000, payType: "employee" },
  { id: "t4", studioId: studio.id, name: "Jules Romano", styles: ["Tap", "Jazz"], email: "jules@aurora.dance", hourlyRateCents: 3500, payType: "1099" },
  { id: "t5", studioId: studio.id, name: "Sasha Berg", styles: ["Acro", "Ballet"], email: "sasha@aurora.dance", hourlyRateCents: 5500, payType: "employee" },
];

export const classes: Class[] = [
  { id: "c1", studioId: studio.id, name: "Tiny Tots Ballet", style: "Ballet", ageGroup: "Tiny Tots", day: "Mon", startTime: "16:00", durationMins: 45, room: "Studio A", teacherId: "t1", capacity: 12, enrolled: 11, waitlist: 3, inRecital: true, priceCents: 8500 },
  { id: "c2", studioId: studio.id, name: "Junior Hip Hop", style: "Hip Hop", ageGroup: "Junior", day: "Mon", startTime: "17:00", durationMins: 60, room: "Studio B", teacherId: "t2", capacity: 18, enrolled: 18, waitlist: 5, inRecital: true, priceCents: 9500 },
  { id: "c3", studioId: studio.id, name: "Senior Contemporary", style: "Contemporary", ageGroup: "Senior", day: "Tue", startTime: "18:30", durationMins: 75, room: "Studio A", teacherId: "t3", capacity: 16, enrolled: 13, waitlist: 0, inRecital: true, priceCents: 11000 },
  { id: "c4", studioId: studio.id, name: "Intermediate Jazz", style: "Jazz", ageGroup: "Intermediate", day: "Tue", startTime: "17:00", durationMins: 60, room: "Studio B", teacherId: "t4", capacity: 16, enrolled: 14, waitlist: 1, inRecital: true, priceCents: 9500 },
  { id: "c5", studioId: studio.id, name: "Adult Tap Social", style: "Tap", ageGroup: "Adult", day: "Wed", startTime: "19:30", durationMins: 60, room: "Studio C", teacherId: "t4", capacity: 20, enrolled: 9, waitlist: 0, inRecital: false, priceCents: 7500 },
  { id: "c6", studioId: studio.id, name: "Junior Lyrical", style: "Lyrical", ageGroup: "Junior", day: "Wed", startTime: "16:30", durationMins: 60, room: "Studio A", teacherId: "t1", capacity: 16, enrolled: 15, waitlist: 2, inRecital: true, priceCents: 9500 },
  { id: "c7", studioId: studio.id, name: "Senior Hip Hop Crew", style: "Hip Hop", ageGroup: "Senior", day: "Thu", startTime: "18:00", durationMins: 90, room: "Studio B", teacherId: "t2", capacity: 20, enrolled: 19, waitlist: 6, inRecital: true, priceCents: 12500 },
  { id: "c8", studioId: studio.id, name: "Acro Foundations", style: "Acro", ageGroup: "Intermediate", day: "Thu", startTime: "16:30", durationMins: 60, room: "Studio C", teacherId: "t5", capacity: 12, enrolled: 8, waitlist: 0, inRecital: false, priceCents: 10000 },
  { id: "c9", studioId: studio.id, name: "Pre-Pro Ballet", style: "Ballet", ageGroup: "Senior", day: "Fri", startTime: "17:30", durationMins: 90, room: "Studio A", teacherId: "t5", capacity: 14, enrolled: 14, waitlist: 4, inRecital: true, priceCents: 14000 },
  { id: "c10", studioId: studio.id, name: "Saturday Combo Jr.", style: "Jazz", ageGroup: "Junior", day: "Sat", startTime: "10:00", durationMins: 75, room: "Studio B", teacherId: "t3", capacity: 18, enrolled: 16, waitlist: 0, inRecital: true, priceCents: 10500 },
];

const firstNames = ["Ava", "Liam", "Sofia", "Noah", "Mia", "Ethan", "Isla", "Leo", "Maya", "Kai", "Zoe", "Eli", "Nora", "Owen", "Lila", "Jude", "Ruby", "Finn", "Iris", "Theo", "June", "Cole", "Wren", "Asa"];
const lastNames = ["Carter", "Nguyen", "Patel", "Rivera", "Kim", "Brooks", "Hassan", "Lopez", "Walsh", "Okafor", "Stein", "Ferraro", "Moss", "Diaz", "Pruitt", "Vance"];
const parentFirst = ["Diane", "Marcus", "Anita", "Greg", "Lena", "Sam", "Yara", "Paul", "Nadia", "Cliff", "Bea", "Omar"];
const parentLast = ["Walsh", "Carter", "Patel", "Kim", "Brooks", "Hassan", "Lopez", "Rivera", "Stein", "Moss"];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function makeContact(first: string, last: string, email: string, phone: string, address: string, relationship: string, billing: boolean, emergency: boolean, household?: string): FamilyContact {
  return {
    firstName: first,
    lastName: last,
    relationshipToStudent: relationship,
    email,
    phone,
    address,
    city: "Portland",
    state: "OR",
    zip: "97209",
    householdLabel: household,
    receivesEmails: true,
    receivesSMS: true,
    receivesBilling: billing,
    emergencyContact: emergency,
  };
}

function makeCaregiver(
  id: string,
  first: string,
  last: string,
  email: string,
  phone: string,
  address: string,
  relationship: string,
  role: "primary_caregiver" | "secondary_caregiver",
  overrides?: Partial<Caregiver>,
): Caregiver {
  return {
    id,
    first_name: first,
    last_name: last,
    relationship_to_student: relationship,
    email,
    phone,
    address,
    city: "Portland",
    state: "OR",
    zip: "97209",
    status: "active",
    role,
    receives_announcements: true,
    receives_emergency_messages: true,
    can_view_schedule: true,
    can_view_billing: role === "primary_caregiver",
    can_pay_invoices: role === "primary_caregiver",
    can_manage_enrolments: role === "primary_caregiver",
    can_sign_waivers: role === "primary_caregiver",
    can_view_medical_notes: role === "primary_caregiver",
    authorized_pickup: true,
    accepted_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── Multi-household example: Diane Walsh (separated, ex has a partner) ──────
const rajCg = makeCaregiver("cg_secondary_p3", "Raj", "Patel", "raj.patel@email.com", "(555) 765-4321", "720 SW Broadway Dr", "Guardian", "secondary_caregiver", {
  ...SAFE_SECONDARY_DEFAULTS,
  can_view_billing: true,
  can_pay_invoices: true,
});

const gregCg = makeCaregiver("cg_addl_greg", "Greg", "Walsh", "greg.walsh@email.com", "(555) 111-2233", "4510 NE Alberta Ct", "Father", "additional_caregiver", {
  ...SAFE_SECONDARY_DEFAULTS,
  household_label: "Greg's house",
  authorized_pickup: true,
});

const lenaCg: Caregiver = {
  id: "cg_addl_lena",
  first_name: "Lena",
  last_name: "Walsh",
  relationship_to_student: "Step-parent",
  email: "lena.walsh@email.com",
  phone: "(555) 222-3344",
  address: "4510 NE Alberta Ct",
  city: "Portland",
  state: "OR",
  zip: "97211",
  household_label: "Greg & Lena's house",
  status: "active" as const,
  role: "additional_caregiver" as const,
  receives_announcements: true,
  receives_emergency_messages: true,
  can_view_schedule: true,
  can_view_billing: false,
  can_pay_invoices: false,
  can_manage_enrolments: false,
  can_sign_waivers: false,
  can_view_medical_notes: false,
  authorized_pickup: true,
};

export const parentAccounts: ParentAccount[] = [
  {
    id: "p1",
    studioId: studio.id,
    primaryContact: makeContact("Diane", "Walsh", "diane.walsh@email.com", "(555) 123-4567", "1428 NW Lovejoy St", "Parent", true, true, "Diane's house"),
    primaryCaregiver: makeCaregiver("cg_primary_p1", "Diane", "Walsh", "diane.walsh@email.com", "(555) 123-4567", "1428 NW Lovejoy St", "Parent", "primary_caregiver", { household_label: "Diane's house" }),
    // Multi-household: Diane is separated; Greg (ex) and his partner Lena are also caregivers
    secondaryContact: makeContact("Greg", "Walsh", "greg.walsh@email.com", "(555) 111-2233", "4510 NE Alberta Ct", "Father", false, true, "Greg's house"),
    secondaryCaregiver: gregCg,
    additionalCaregivers: [gregCg, lenaCg],
    caregiverAuditLog: [
      { id: "alog1", caregiverId: "cg_primary_p1", parentId: "p1", timestamp: new Date(Date.now() - 86400000 * 90).toISOString(), event: "caregiver_nominated", details: "Primary caregiver created at registration" },
      { id: "alog2", caregiverId: "cg_addl_greg", parentId: "p1", timestamp: new Date(Date.now() - 86400000 * 30).toISOString(), event: "caregiver_nominated", details: "Greg Walsh nominated as additional caregiver" },
      { id: "alog3", caregiverId: "cg_addl_lena", parentId: "p1", timestamp: new Date(Date.now() - 86400000 * 15).toISOString(), event: "caregiver_nominated", details: "Lena Walsh nominated as additional caregiver" },
    ],
    childIds: ["s1", "s5"],
  },
  {
    id: "p2",
    studioId: studio.id,
    primaryContact: makeContact("Marcus", "Carter", "marcus.carter@email.com", "(555) 234-5678", "3821 SE Hawthorne Blvd", "Parent", true, true, undefined),
    primaryCaregiver: makeCaregiver("cg_primary_p2", "Marcus", "Carter", "marcus.carter@email.com", "(555) 234-5678", "3821 SE Hawthorne Blvd", "Parent", "primary_caregiver"),
    additionalCaregivers: [],
    caregiverAuditLog: [
      { id: "alog4", caregiverId: "cg_primary_p2", parentId: "p2", timestamp: new Date(Date.now() - 86400000 * 120).toISOString(), event: "caregiver_nominated", details: "Primary caregiver created at registration" },
    ],
    childIds: ["s2"],
  },
  {
    id: "p3",
    studioId: studio.id,
    primaryContact: makeContact("Anita", "Patel", "anita.patel@email.com", "(555) 345-6789", "720 SW Broadway Dr", "Guardian", true, true, undefined),
    secondaryContact: makeContact("Raj", "Patel", "raj.patel@email.com", "(555) 765-4321", "720 SW Broadway Dr", "Guardian", true, false, undefined),
    primaryCaregiver: makeCaregiver("cg_primary_p3", "Anita", "Patel", "anita.patel@email.com", "(555) 345-6789", "720 SW Broadway Dr", "Guardian", "primary_caregiver"),
    secondaryCaregiver: rajCg,
    additionalCaregivers: [rajCg],
    caregiverAuditLog: [
      { id: "alog5", caregiverId: "cg_primary_p3", parentId: "p3", timestamp: new Date(Date.now() - 86400000 * 80).toISOString(), event: "caregiver_nominated", details: "Primary caregiver created at registration" },
      { id: "alog6", caregiverId: "cg_secondary_p3", parentId: "p3", timestamp: new Date(Date.now() - 86400000 * 40).toISOString(), event: "caregiver_nominated", details: "Raj Patel nominated as secondary caregiver" },
      { id: "alog7", caregiverId: "cg_secondary_p3", parentId: "p3", timestamp: new Date(Date.now() - 86400000 * 35).toISOString(), event: "billing_access_changed", details: "Billing and invoice payment enabled for Raj Patel" },
    ],
    childIds: ["s3"],
  },
];

const allergyOptions = [undefined, undefined, undefined, "Peanuts", "Dairy", "Gluten", "Bee stings", "Latex"];

export const students: Student[] = Array.from({ length: 42 }).map((_, i) => {
  const firstName = pick(firstNames, i);
  const lastName = pick(lastNames, i * 3 + 1);
  const name = `${firstName} ${lastName}`;
  const parentName = `${pick(parentFirst, i * 2)} ${pick(lastNames, i * 3 + 1)}`;
  const parentId = parentAccounts[i % parentAccounts.length].id;
  const enrolledClasses = classes.filter((_, ci) => (i + ci) % 4 === 0).slice(0, 2).map((c) => c.id);
  const waiverRoll = (i * 7) % 10;
  const payRoll = (i * 5) % 10;
  const attendance = 0.72 + ((i * 13) % 26) / 100;
  return {
    id: `s${i + 1}`,
    studioId: studio.id,
    name,
    // Legal name derived from display name for backward compat
    legalFirstName: firstName,
    legalLastName: lastName,
    preferredName: undefined,
    dob: new Date(2008 + (i % 12), (i * 3) % 12, ((i * 7) % 27) + 1).toISOString(),
    parentId,
    parentName,
    parentEmail: `${parentFirst[i % parentFirst.length].toLowerCase()}.${(parentLast[i % parentLast.length] || "parent").toLowerCase()}@email.com`,
    classIds: enrolledClasses.length ? enrolledClasses : [classes[i % classes.length].id],
    attendanceRate: Math.min(0.99, attendance),
    waiver: waiverRoll < 7 ? "signed" : waiverRoll < 9 ? "pending" : "missing",
    payment: payRoll < 7 ? "paid" : payRoll < 9 ? "due" : "overdue",
    balanceCents: payRoll < 7 ? 0 : (payRoll < 9 ? 9500 : 19000),
    medicalNotes: i % 6 === 0 ? "Mild asthma — inhaler in bag" : undefined,
    allergies: allergyOptions[i % allergyOptions.length],
  };
});

export const announcements: Announcement[] = [
  { id: "a1", studioId: studio.id, title: "Spring Recital rehearsal — May 25th", body: "All recital classes have a mandatory dress rehearsal at the Benson Theatre. Arrive 30 minutes early with full costume and hair done.", scope: "Recital", sentAt: daysAgo(1), audience: "8 recital classes", reach: 121 },
  { id: "a2", studioId: studio.id, title: "Jazz Class cancelled tonight", body: "Due to a facilities issue, tonight's Intermediate Jazz is cancelled. A make-up class will be scheduled next week.", scope: "Emergency", sentAt: daysAgo(2), audience: "Intermediate Jazz", reach: 14 },
  { id: "a3", studioId: studio.id, title: "Costumes due next week", body: "Final costume payments are due Friday. Please complete your balance in the parent portal to secure your dancer's costume.", scope: "Studio-wide", sentAt: daysAgo(4), audience: "All families", reach: 42 },
  { id: "a4", studioId: studio.id, title: "New Acro Foundations spots open", body: "We've opened 4 additional spots in Acro Foundations on Thursdays. Enroll now through the portal.", scope: "Studio-wide", sentAt: daysAgo(8), audience: "All families", reach: 42 },
];

export const invoices: Invoice[] = students
  .filter((s) => s.payment !== "paid")
  .slice(0, 9)
  .map((s, i) => ({
    id: `inv${i + 1}`,
    studioId: studio.id,
    studentName: s.name,
    parentName: s.parentName,
    description: i % 2 === 0 ? "May tuition" : "Recital costume + tuition",
    amountCents: s.balanceCents || 9500,
    status: s.payment,
    dueDate: s.payment === "overdue" ? daysAgo(6) : daysAhead(5 + i),
  }));

export const recitalEvents: RecitalEvent[] = [
  {
    id: "r1",
    studioId: studio.id,
    name: "Spring Showcase 2026",
    date: "2026-06-15T19:00:00Z",
    venue: "Benson Theatre",
    costumeDeadline: "2026-05-30T00:00:00Z",
    performances: [
      { id: "p1", studioId: studio.id, name: "Act I — Little Stars", classIds: ["c1"], order: 1, startTime: "19:00", costumeNote: "Pink tutus and ballet slippers" },
      { id: "p2", studioId: studio.id, name: "Act II — Rising Energy", classIds: ["c2", "c6", "c10"], order: 2, startTime: "19:20", costumeNote: "Neon accents and white sneakers" },
      { id: "p3", studioId: studio.id, name: "Act III — Grace & Flow", classIds: ["c3", "c4"], order: 3, startTime: "20:00", costumeNote: "Flowing earth-tone fabrics" },
      { id: "p4", studioId: studio.id, name: "Finale — Senior Spotlight", classIds: ["c7", "c9"], order: 4, startTime: "20:30", costumeNote: "Black and gold formal attire" },
    ],
  },
];

export const revenueSeries: RevenuePoint[] = [
  { month: "Dec", revenueCents: 2840000, enrollments: 198 },
  { month: "Jan", revenueCents: 3120000, enrollments: 214 },
  { month: "Feb", revenueCents: 2990000, enrollments: 221 },
  { month: "Mar", revenueCents: 3460000, enrollments: 236 },
  { month: "Apr", revenueCents: 3680000, enrollments: 248 },
  { month: "May", revenueCents: 4120000, enrollments: 261 },
];

/* ── Enrolments — derived from student.classIds and class.enrolled ────
 * These records make the enrolments table the source of truth.
 * Each student→class mapping from the demo students array becomes an
 * active enrolment. Counts match the hardcoded class.enrolled values. */
export const enrolments: Enrolment[] = students.flatMap((student) =>
  student.classIds.map((classId, idx) => ({
    id: `enr_${student.id}_${classId}`,
    studioId: studio.id,
    studentId: student.id,
    classId,
    status: "active" as const,
    startedAt: new Date(Date.now() - 86400000 * (30 + idx * 7)).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * (30 + idx * 7)).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * (2 + idx)).toISOString(),
  })),
);

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function daysAhead(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

/* ── Waiver Templates ──────────────────────────────────────────── */

export const waiverTemplates: WaiverTemplate[] = [
  {
    id: "wt_liability",
    studioId: studio.id,
    title: "General Liability Waiver",
    description: "Standard liability release for dance class participation and studio premises. Covers physical activity risks, equipment use, and general conduct.",
    type: "liability",
    status: "published",
    currentVersionId: "wv_liability_v1",
    required: true,
    appliesTo: { scope: "all" },
    renewalPeriod: "once",
    createdAt: daysAgo(120),
    updatedAt: daysAgo(14),
  },
  {
    id: "wt_medical",
    studioId: studio.id,
    title: "Emergency Medical Consent",
    description: "Authorizes the studio to seek emergency medical treatment for the participant if a parent/guardian cannot be reached immediately.",
    type: "medical_consent",
    status: "published",
    currentVersionId: "wv_medical_v2",
    required: true,
    appliesTo: { scope: "all" },
    renewalPeriod: "annual",
    createdAt: daysAgo(110),
    updatedAt: daysAgo(7),
  },
  {
    id: "wt_photo",
    studioId: studio.id,
    title: "Media & Photo Release",
    description: "Permission for the studio to use photos and videos of the participant for promotional purposes, social media, and website content.",
    type: "photo_video",
    status: "published",
    currentVersionId: "wv_photo_v1",
    required: false,
    appliesTo: { scope: "all" },
    renewalPeriod: "once",
    createdAt: daysAgo(100),
    updatedAt: daysAgo(30),
  },
  {
    id: "wt_conduct",
    studioId: studio.id,
    title: "Code of Conduct",
    description: "Studio behaviour expectations for participants and families, including attendance policies, dress code, and respectful conduct guidelines.",
    type: "code_of_conduct",
    status: "published",
    currentVersionId: "wv_conduct_v1",
    required: true,
    appliesTo: { scope: "all" },
    renewalPeriod: "once",
    createdAt: daysAgo(95),
    updatedAt: daysAgo(45),
  },
  {
    id: "wt_privacy",
    studioId: studio.id,
    title: "Privacy & Data Consent",
    description: "Consent for collection and use of personal data including contact information, attendance records, and payment history in accordance with our privacy policy.",
    type: "privacy_data",
    status: "published",
    currentVersionId: "wv_privacy_v1",
    required: true,
    appliesTo: { scope: "all" },
    renewalPeriod: "once",
    createdAt: daysAgo(90),
    updatedAt: daysAgo(30),
  },
  {
    id: "wt_recital",
    studioId: studio.id,
    title: "Recital Participation Agreement",
    description: "Terms for recital participation including costume purchase/costs, mandatory rehearsals, and performance expectations.",
    type: "event_release",
    status: "draft",
    required: false,
    appliesTo: { scope: "event", targetIds: ["r1"] },
    renewalPeriod: "per_event",
    createdAt: daysAgo(20),
    updatedAt: daysAgo(2),
  },
];

/* ── Waiver Versions ──────────────────────────────────────────── */

export const waiverVersions: WaiverVersion[] = [
  { id: "wv_liability_v1", waiverTemplateId: "wt_liability", studioId: studio.id, versionNumber: 1, bodyMarkdown: `# Aurora Dance Academy — General Liability Waiver\n\n## Assumption of Risk\n\nI understand and acknowledge that participation in dance classes, rehearsals, performances, and related activities at Aurora Dance Academy ("the Studio") involves inherent risks, including but not limited to physical injury, illness, and property damage.\n\nI voluntarily assume all risks associated with participation in Studio activities.\n\n## Release of Liability\n\nI hereby release, waive, and discharge Aurora Dance Academy, its owners, employees, instructors, and volunteers from any and all liability, claims, demands, or causes of action arising from or related to participation in Studio activities.\n\n## Medical Authorization\n\nIn the event of an emergency, I authorize the Studio to obtain medical treatment for the participant named below. I understand the Studio will make reasonable efforts to contact me before taking action.\n\n## Agreement\n\nI have read this waiver and understand its contents. I sign this document voluntarily and with full knowledge of its significance.`, publishedAt: daysAgo(100), createdBy: undefined, createdAt: daysAgo(100) },
  { id: "wv_medical_v1", waiverTemplateId: "wt_medical", studioId: studio.id, versionNumber: 1, bodyMarkdown: `# Emergency Medical Treatment Consent\n\nI hereby authorize Aurora Dance Academy staff to consent to any x-ray examination, anesthetic, medical, dental, or surgical diagnosis or treatment, and hospital care deemed necessary by a licensed physician, dentist, or surgeon.\n\nThis authorization is effective when I cannot be reached immediately by phone.\n\nI agree to assume all financial responsibility for any medical treatment provided.`, publishedAt: daysAgo(90), createdBy: undefined, createdAt: daysAgo(90), archivedAt: daysAgo(7) },
  { id: "wv_medical_v2", waiverTemplateId: "wt_medical", studioId: studio.id, versionNumber: 2, bodyMarkdown: `# Emergency Medical Treatment Consent (v2)\n\nI hereby authorize Aurora Dance Academy staff to consent to any x-ray examination, anesthetic, medical, dental, or surgical diagnosis or treatment, and hospital care deemed necessary by a licensed physician, dentist, or surgeon.\n\nThis authorization is effective when I cannot be reached immediately by phone. The Studio will attempt to contact all emergency contacts on file before authorizing non-urgent treatment.\n\n## Insurance Information\n\nI understand that the Studio does not carry medical insurance for participants. I agree to assume all financial responsibility for any medical treatment provided and represent that the participant is covered by personal/family health insurance.\n\n## Medication Administration\n\nIf the participant requires medication during Studio activities, I will provide written instructions and the medication in its original container.`, publishedAt: daysAgo(7), createdBy: undefined, createdAt: daysAgo(7) },
  { id: "wv_photo_v1", waiverTemplateId: "wt_photo", studioId: studio.id, versionNumber: 1, bodyMarkdown: `# Media & Photo Release\n\nI grant Aurora Dance Academy permission to use photographs, video recordings, and/or audio recordings of the participant taken during Studio activities for promotional purposes including:\n\n- Studio website and social media accounts\n- Printed marketing materials and brochures\n- Local news and community publications\n- Studio recital programs and materials\n\nI understand that participants will not be identified by full name in public-facing materials without separate written consent.\n\n## Opt-out\n\nI may revoke this consent in writing at any time. Revocation will apply to future use only and will not affect materials already published.`, publishedAt: daysAgo(80), createdBy: undefined, createdAt: daysAgo(80) },
  { id: "wv_conduct_v1", waiverTemplateId: "wt_conduct", studioId: studio.id, versionNumber: 1, bodyMarkdown: `# Aurora Dance Academy — Code of Conduct\n\n## Participant Expectations\n\n- Arrive on time for all classes and rehearsals\n- Wear appropriate dance attire and footwear as specified by instructors\n- Treat instructors, staff, and fellow participants with respect at all times\n- No food, gum, or drinks (except water) in the studio spaces\n- No phones or electronic devices during class time\n\n## Parent/Guardian Expectations\n\n- Communicate absences to the Studio in advance when possible\n- Pick up participants promptly after classes conclude\n- Address concerns directly with instructors or studio management\n- Keep contact and medical information current in the parent portal\n\n## Attendance Policy\n\nRegular attendance is essential for participant progress and group cohesion. Excessive unexcused absences may affect recital participation eligibility.\n\n## Agreement\n\nI have read, understand, and agree to abide by the Aurora Dance Academy Code of Conduct. I understand that violations may result in disciplinary action including dismissal from the program.`, publishedAt: daysAgo(75), createdBy: undefined, createdAt: daysAgo(75) },
  { id: "wv_privacy_v1", waiverTemplateId: "wt_privacy", studioId: studio.id, versionNumber: 1, bodyMarkdown: `# Privacy & Data Consent\n\nAurora Dance Academy collects and processes personal data to provide dance instruction and related services. This includes:\n\n- Contact information (names, email, phone, address)\n- Participant information (age, medical details, attendance)\n- Payment and billing information\n- Emergency contact details\n\n## Data Usage\n\nYour data is used exclusively for:\n- Studio operations and class management\n- Communication about classes, events, and studio announcements\n- Billing and payment processing\n- Emergency situations\n\n## Data Sharing\n\nWe do not sell personal data. Data may be shared with:\n- Instructors and staff (as needed for instruction)\n- Payment processors (for billing only)\n- Emergency services (as required)\n\n## Your Rights\n\nYou may request access to, correction of, or deletion of your personal data by contacting the studio directly.`, publishedAt: daysAgo(70), createdBy: undefined, createdAt: daysAgo(70) },
];

/* ── Waiver Signatures ─────────────────────────────────────────── */

// Generate demo signatures: ~70% of students have signed the liability waiver
const SIGNED_FORMS = ["wt_liability", "wt_medical", "wt_conduct", "wt_privacy"];

export const waiverSignatures: WaiverSignature[] = students
  .filter((s, i) => {
    const w = (i * 7) % 10;
    return w < 7; // 70% have signed
  })
  .flatMap((s) =>
    SIGNED_FORMS.map((templateId, fi) => {
      const version = waiverVersions.find((v) => v.waiverTemplateId === templateId && !v.archivedAt);
      const signedDays = 60 - fi * 15 - (parseInt(s.id.slice(1)) % 20);
      return {
        id: `ws_${s.id}_${templateId}`,
        studioId: studio.id,
        waiverTemplateId: templateId,
        waiverVersionId: version?.id ?? `wv_${templateId.replace("wt_", "")}_v1`,
        studentId: s.id,
        caregiverId: `cg_primary_${s.parentId}`,
        signerName: s.parentName,
        signerRelationship: "Parent",
        signatureType: "typed" as const,
        guardianAuthorityConfirmed: true,
        eSignConsent: true,
        signedAt: daysAgo(signedDays),
        ipAddress: "192.168.1.1",
        userAgent: "StudioFlow Demo",
        status: "signed" as const,
        metadata: { signed_via: "parent_portal", platform: "web" },
      } satisfies WaiverSignature;
    }),
  );

/* ── Uploaded External Documents ────────────────────────────────── */

export const uploadedDocuments: UploadedDocument[] = [
  {
    id: "ud_p1_custody",
    studioId: studio.id,
    familyId: "p1",
    studentId: "s1",
    documentType: "custody_court",
    title: "Custody Agreement — Walsh Family",
    fileName: "walsh_custody_2024.pdf",
    mimeType: "application/pdf",
    fileSizeBytes: 245760,
    uploadedBy: undefined,
    uploadedAt: daysAgo(80),
    verificationStatus: "verified",
    verifiedBy: undefined,
    verifiedAt: daysAgo(78),
    visibility: "admin_only",
    notes: "Court-ordered custody agreement. Admin access only per family request.",
    createdAt: daysAgo(80),
    updatedAt: daysAgo(78),
  },
  {
    id: "ud_s3_medical",
    studioId: studio.id,
    studentId: "s3",
    documentType: "allergy_plan",
    title: "Anaphylaxis Emergency Plan — Sofia Patel",
    fileName: "sofia_anaphylaxis_plan.pdf",
    mimeType: "application/pdf",
    fileSizeBytes: 122880,
    uploadedBy: undefined,
    uploadedAt: daysAgo(45),
    verificationStatus: "verified",
    verifiedBy: undefined,
    verifiedAt: daysAgo(44),
    expiryDate: daysAhead(180),
    visibility: "caregiver_visible",
    notes: "EpiPen required. Updated plan from pediatrician.",
    createdAt: daysAgo(45),
    updatedAt: daysAgo(44),
  },
  {
    id: "ud_s7_waiver",
    studioId: studio.id,
    studentId: "s7",
    documentType: "scanned_waiver",
    title: "Signed Liability Waiver — Scanned",
    fileName: "s7_liability_signed.pdf",
    mimeType: "application/pdf",
    fileSizeBytes: 180224,
    uploadedBy: undefined,
    uploadedAt: daysAgo(10),
    verificationStatus: "unverified",
    visibility: "caregiver_visible",
    notes: "Paper waiver signed at front desk. Needs staff verification.",
    createdAt: daysAgo(10),
    updatedAt: daysAgo(10),
  },
];
