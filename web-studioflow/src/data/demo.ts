import type {
  Alteration,
  Announcement,
  Caregiver,
  CaregiverAuditEvent,
  Class,
  Costume,
  CostumeAssignment,
  CostumeDistribution,
  CostumeFee,
  CostumeRental,
  Enrolment,
  FamilyContact,
  Invoice,
  ParentAccount,
  QuickChangeConflict,
  RecitalEvent,
  RevenuePoint,
  ReusableCostume,
  SizeRecommendation,
  SizingChart,
  Student,
  StudentMeasurement,
  Studio,
  Teacher,
  UploadedDocument,
  VendorOrder,
  VendorOrderItem,
  WaiverSignature,
  WaiverTemplate,
  WaiverVersion,
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
  settings: { preferredUnits: "metric" },
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

/* ── Costume Library ───────────────────────────────────────────── */

const newCostumeDefaults = {
  vendorWebsiteUrl: undefined as string | undefined,
  productPageUrl: undefined as string | undefined,
  style: undefined as string | undefined,
  taxable: false,
  depositAmountCents: 0,
  sizesAvailable: [] as string[],
  sizingNotes: undefined as string | undefined,
  autoSizingEnabled: false,
  isReusable: false,
  quantityOwned: 0,
  storageLocation: undefined as string | undefined,
  condition: undefined as string | undefined,
  status: "active" as const,
};

export const costumes: Costume[] = [
  {
    id: "cos_pink_tutu",
    studioId: studio.id,
    name: "Pink Sequin Tutu Dress",
    sku: "COS-001-PNK",
    vendor: "Dancewear Co.",
    season: "Spring 2026",
    category: "ballet",
    colour: "Blush Pink",
    description: "Professional-grade sequin tutu with 5-layer tulle skirt. Empire waist with crystal embellishment. Includes matching hairpiece.",
    images: [],
    wholesaleCostCents: 4200,
    shippingAllocationCents: 350,
    markupPct: 30,
    retailCostCents: 5915,
    ...newCostumeDefaults,
    sizesAvailable: ["Child Small", "Child Medium", "Child Large"],
    autoSizingEnabled: true,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(14),
  },
  {
    id: "cos_neon_crew",
    studioId: studio.id,
    name: "Neon Street Crew Set",
    sku: "COS-002-NEO",
    vendor: "Urban Groove Supply",
    season: "Spring 2026",
    category: "hip_hop",
    colour: "Electric Green / Black",
    description: "Oversized neon hoodie with reflective strips, black joggers, and white high-tops. Breathable performance fabric.",
    images: [],
    wholesaleCostCents: 5600,
    shippingAllocationCents: 420,
    markupPct: 25,
    retailCostCents: 7525,
    ...newCostumeDefaults,
    sizesAvailable: ["Youth Small", "Youth Medium", "Youth Large"],
    createdAt: daysAgo(85),
    updatedAt: daysAgo(20),
  },
  {
    id: "cos_earth_flow",
    studioId: studio.id,
    name: "Earth-Tone Flow Dress",
    sku: "COS-003-ERT",
    vendor: "Dancewear Co.",
    season: "Spring 2026",
    category: "contemporary",
    colour: "Terracotta / Sand",
    description: "Flowing georgette dress in layered earth tones. Adjustable straps, built-in brief. Side slit for freedom of movement.",
    images: [],
    wholesaleCostCents: 3800,
    shippingAllocationCents: 300,
    markupPct: 35,
    retailCostCents: 5535,
    ...newCostumeDefaults,
    sizesAvailable: ["Child Medium", "Child Large", "Adult Small"],
    createdAt: daysAgo(82),
    updatedAt: daysAgo(10),
  },
  {
    id: "cos_gold_formal",
    studioId: studio.id,
    name: "Black & Gold Formal Attire",
    sku: "COS-004-BLK",
    vendor: "Premiere Dance Apparel",
    vendorWebsiteUrl: "https://premieredance.example.com",
    season: "Spring 2026",
    category: "jazz",
    colour: "Black / Gold",
    description: "Black sequin leotard with gold lamé overlay. Long sleeves, open back detail. Includes matching gold headpiece.",
    images: [],
    wholesaleCostCents: 6500,
    shippingAllocationCents: 480,
    markupPct: 28,
    retailCostCents: 8934,
    ...newCostumeDefaults,
    sizesAvailable: ["Child Small", "Child Medium", "Child Large", "Adult Small"],
    createdAt: daysAgo(80),
    updatedAt: daysAgo(15),
  },
  {
    id: "cos_lilac_lyrical",
    studioId: studio.id,
    name: "Lilac Dream Lyrical Dress",
    sku: "COS-005-LIL",
    vendor: "Dancewear Co.",
    season: "Spring 2026",
    category: "lyrical",
    colour: "Soft Lilac",
    description: "Ethereal chiffon dress with handkerchief hem. Empire waist, flutter sleeves. Lightweight and breathable for lyrical routines.",
    images: [],
    wholesaleCostCents: 3400,
    shippingAllocationCents: 280,
    markupPct: 32,
    retailCostCents: 4858,
    ...newCostumeDefaults,
    sizesAvailable: ["Child X-Small", "Child Small", "Child Medium"],
    createdAt: daysAgo(78),
    updatedAt: daysAgo(8),
  },
  {
    id: "cos_tap_tux",
    studioId: studio.id,
    name: "Classic Tap Tuxedo Set",
    sku: "COS-006-TAP",
    vendor: "Premiere Dance Apparel",
    season: "Spring 2026",
    category: "tap",
    colour: "Black / White",
    description: "Tailored black bodysuit with white satin bow detail. Faux tailcoat overlay. Includes tap shoe ribbon ties.",
    images: [],
    wholesaleCostCents: 4900,
    shippingAllocationCents: 380,
    markupPct: 30,
    retailCostCents: 6864,
    ...newCostumeDefaults,
    sizesAvailable: ["Child Small", "Child Medium", "Child Large", "Adult Small"],
    autoSizingEnabled: true,
    createdAt: daysAgo(75),
    updatedAt: daysAgo(25),
  },
  {
    id: "cos_acro_unitard",
    studioId: studio.id,
    name: "Flex Acro Unitard",
    sku: "COS-007-ACR",
    vendor: "Urban Groove Supply",
    season: "Spring 2026",
    category: "acro",
    colour: "Navy / Teal",
    description: "Full-coverage unitard with colour-block design. 4-way stretch fabric, reinforced seams. Grip panels on feet.",
    images: [],
    wholesaleCostCents: 3100,
    shippingAllocationCents: 250,
    markupPct: 35,
    retailCostCents: 4523,
    ...newCostumeDefaults,
    sizesAvailable: ["Child Medium", "Child Large"],
    createdAt: daysAgo(70),
    updatedAt: daysAgo(30),
  },
];

/* ── Costume Assignments — link costumes to classes/routines ────── */

export const costumeAssignments: CostumeAssignment[] = [
  { id: "ca_c1", studioId: studio.id, costumeId: "cos_pink_tutu", classId: "c1", routineName: "Act I — Little Stars", assignedCount: 11, createdAt: daysAgo(60) },
  { id: "ca_c2_neon", studioId: studio.id, costumeId: "cos_neon_crew", classId: "c2", routineName: "Act II — Rising Energy", assignedCount: 18, createdAt: daysAgo(55) },
  { id: "ca_c6_lilac", studioId: studio.id, costumeId: "cos_lilac_lyrical", classId: "c6", routineName: "Act II — Rising Energy", assignedCount: 15, createdAt: daysAgo(50) },
  { id: "ca_c10_jazz", studioId: studio.id, costumeId: "cos_gold_formal", classId: "c10", routineName: "Act II — Rising Energy", assignedCount: 16, createdAt: daysAgo(48) },
  { id: "ca_c3_earth", studioId: studio.id, costumeId: "cos_earth_flow", classId: "c3", routineName: "Act III — Grace & Flow", assignedCount: 13, createdAt: daysAgo(45) },
  { id: "ca_c4_jazz", studioId: studio.id, costumeId: "cos_tap_tux", classId: "c4", routineName: "Act III — Grace & Flow", assignedCount: 14, createdAt: daysAgo(42) },
  { id: "ca_c7_gold", studioId: studio.id, costumeId: "cos_gold_formal", classId: "c7", routineName: "Finale — Senior Spotlight", assignedCount: 19, createdAt: daysAgo(40) },
  { id: "ca_c9_ballet", studioId: studio.id, costumeId: "cos_pink_tutu", classId: "c9", routineName: "Finale — Senior Spotlight", assignedCount: 14, createdAt: daysAgo(38) },
  { id: "ca_c8_acro", studioId: studio.id, costumeId: "cos_acro_unitard", classId: "c8", assignedCount: 8, createdAt: daysAgo(35) },
];

/* ── Student Measurements — sample measurement profiles ─────────── */

export const studentMeasurements: StudentMeasurement[] = [
  { id: "sm_s1", studioId: studio.id, studentId: "s1", heightCm: 132.5, weightKg: 28.0, chestCm: 64.0, waistCm: 56.0, hipsCm: 68.0, girthCm: 118.0, inseamCm: 58.0, shoeSize: "1", status: "approved", measuredAt: daysAgo(30), createdAt: daysAgo(30) },
  { id: "sm_s2", studioId: studio.id, studentId: "s2", heightCm: 145.0, weightKg: 35.0, chestCm: 72.0, waistCm: 62.0, hipsCm: 76.0, girthCm: 132.0, inseamCm: 64.0, shoeSize: "3", status: "approved", measuredAt: daysAgo(25), createdAt: daysAgo(25) },
  { id: "sm_s3", studioId: studio.id, studentId: "s3", heightCm: 128.0, weightKg: 25.0, chestCm: 60.0, waistCm: 52.0, hipsCm: 64.0, girthCm: 112.0, inseamCm: 54.0, shoeSize: "13", status: "pending", submittedBy: "cg_primary_p3", createdAt: daysAgo(3) },
  { id: "sm_s5", studioId: studio.id, studentId: "s5", heightCm: 160.0, weightKg: 48.0, chestCm: 82.0, waistCm: 68.0, hipsCm: 88.0, girthCm: 148.0, inseamCm: 72.0, shoeSize: "6", status: "approved", measuredAt: daysAgo(20), createdAt: daysAgo(20) },
  { id: "sm_s7", studioId: studio.id, studentId: "s7", heightCm: 140.0, weightKg: 32.0, chestCm: 68.0, waistCm: 58.0, hipsCm: 72.0, girthCm: 126.0, inseamCm: 60.0, shoeSize: "2", status: "draft", createdAt: daysAgo(1) },
  { id: "sm_s10", studioId: studio.id, studentId: "s10", heightCm: 155.0, weightKg: 42.0, chestCm: 78.0, waistCm: 65.0, hipsCm: 84.0, girthCm: 140.0, inseamCm: 68.0, shoeSize: "5", status: "approved", measuredAt: daysAgo(15), createdAt: daysAgo(15) },
];

/* ── Sizing Charts — vendor size references ─────────────────────── */

export const sizingCharts: SizingChart[] = [
  {
    id: "sc_dancewear_co",
    studioId: studio.id,
    vendor: "Dancewear Co.",
    chartName: "Dancewear Co. Child Sizing — Tutus & Dresses",
    chartData: [
      { size: "Child X-Small", chestMin: 56, chestMax: 62, waistMin: 48, waistMax: 54, girthMin: 108, girthMax: 118, heightMin: 115, heightMax: 130 },
      { size: "Child Small", chestMin: 62, chestMax: 68, waistMin: 54, waistMax: 60, girthMin: 118, girthMax: 128, heightMin: 125, heightMax: 140 },
      { size: "Child Medium", chestMin: 68, chestMax: 76, waistMin: 60, waistMax: 66, girthMin: 128, girthMax: 140, heightMin: 135, heightMax: 150 },
      { size: "Child Large", chestMin: 76, chestMax: 84, waistMin: 66, waistMax: 72, girthMin: 140, girthMax: 152, heightMin: 145, heightMax: 160 },
      { size: "Adult Small", chestMin: 82, chestMax: 90, waistMin: 68, waistMax: 76, girthMin: 150, girthMax: 162, heightMin: 155, heightMax: 170 },
    ],
    createdAt: daysAgo(60),
  },
  {
    id: "sc_urban_groove",
    studioId: studio.id,
    vendor: "Urban Groove Supply",
    chartName: "Urban Groove Unisex Sizing — Streetwear",
    chartData: [
      { size: "Youth Small", chestMin: 60, chestMax: 68, waistMin: 52, waistMax: 60, heightMin: 120, heightMax: 140 },
      { size: "Youth Medium", chestMin: 68, chestMax: 78, waistMin: 60, waistMax: 68, heightMin: 135, heightMax: 155 },
      { size: "Youth Large", chestMin: 78, chestMax: 88, waistMin: 68, waistMax: 76, heightMin: 150, heightMax: 168 },
      { size: "Adult Small", chestMin: 86, chestMax: 96, waistMin: 74, waistMax: 84, heightMin: 165, heightMax: 178 },
    ],
    createdAt: daysAgo(55),
  },
];

/* ── Size Recommendations — AI/manual suggestions ───────────────── */

export const sizeRecommendations: SizeRecommendation[] = [
  { id: "sr_s1_tutu", studioId: studio.id, studentId: "s1", costumeId: "cos_pink_tutu", sizingChartId: "sc_dancewear_co", recommendedSize: "Child Small", confidencePct: 94, alternativeSize: "Child Medium", reason: "Girth measurement near upper range threshold.", flags: ["borderline_girth"], parentApproved: true, createdAt: daysAgo(28), updatedAt: daysAgo(20) },
  { id: "sr_s2_neon", studioId: studio.id, studentId: "s2", costumeId: "cos_neon_crew", sizingChartId: "sc_urban_groove", recommendedSize: "Youth Medium", confidencePct: 96, flags: [], parentApproved: true, createdAt: daysAgo(22), updatedAt: daysAgo(18) },
  { id: "sr_s3_lilac", studioId: studio.id, studentId: "s3", costumeId: "cos_lilac_lyrical", sizingChartId: "sc_dancewear_co", recommendedSize: "Child X-Small", confidencePct: 88, alternativeSize: "Child Small", reason: "Measurements pending approval. Based on parent-submitted data.", flags: ["pending_measurements"], parentApproved: false, createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  { id: "sr_s5_earth", studioId: studio.id, studentId: "s5", costumeId: "cos_earth_flow", sizingChartId: "sc_dancewear_co", recommendedSize: "Adult Small", confidencePct: 92, flags: [], parentApproved: true, createdAt: daysAgo(18), updatedAt: daysAgo(14) },
  { id: "sr_s10_gold", studioId: studio.id, studentId: "s10", costumeId: "cos_gold_formal", sizingChartId: "sc_dancewear_co", recommendedSize: "Child Large", confidencePct: 85, alternativeSize: "Adult Small", reason: "Chest and waist measurements fall between size ranges.", flags: ["borderline_chest", "borderline_waist"], parentApproved: false, createdAt: daysAgo(12), updatedAt: daysAgo(5) },
];

/* ── Costume Fees — billing integration ─────────────────────────── */

export const costumeFees: CostumeFee[] = [
  { id: "cf_s1_tutu", studioId: studio.id, studentId: "s1", costumeId: "cos_pink_tutu", feeType: "full", totalCents: 5915, paidCents: 5915, status: "paid", dueDate: daysAgo(30), createdAt: daysAgo(60), updatedAt: daysAgo(30) },
  { id: "cf_s2_neon", studioId: studio.id, studentId: "s2", costumeId: "cos_neon_crew", feeType: "deposit_balance", totalCents: 7525, paidCents: 4000, status: "partial", dueDate: daysAhead(10), createdAt: daysAgo(50), updatedAt: daysAgo(15) },
  { id: "cf_s5_earth", studioId: studio.id, studentId: "s5", costumeId: "cos_earth_flow", feeType: "full", totalCents: 5535, paidCents: 0, status: "unpaid", dueDate: daysAhead(14), createdAt: daysAgo(40), updatedAt: daysAgo(40) },
  { id: "cf_s10_gold", studioId: studio.id, studentId: "s10", costumeId: "cos_gold_formal", feeType: "installment", totalCents: 8934, paidCents: 3000, status: "partial", dueDate: daysAhead(21), createdAt: daysAgo(45), updatedAt: daysAgo(5) },
];

/* ── Vendor Orders ─────────────────────────────────────────────── */

const orderItems_dc: VendorOrderItem[] = [
  { id: "voi_dc_cs", vendorOrderId: "vo_dancewear_co", costumeId: "cos_pink_tutu", size: "Child Small", quantity: 12, unitCostCents: 4200, createdAt: daysAgo(28) },
  { id: "voi_dc_cm", vendorOrderId: "vo_dancewear_co", costumeId: "cos_pink_tutu", size: "Child Medium", quantity: 6, unitCostCents: 4200, createdAt: daysAgo(28) },
  { id: "voi_dc_cl", vendorOrderId: "vo_dancewear_co", costumeId: "cos_pink_tutu", size: "Child Large", quantity: 3, unitCostCents: 4200, createdAt: daysAgo(28) },
  { id: "voi_dc_earth_sm", vendorOrderId: "vo_dancewear_co", costumeId: "cos_earth_flow", size: "Adult Small", quantity: 8, unitCostCents: 3800, createdAt: daysAgo(28) },
  { id: "voi_dc_earth_med", vendorOrderId: "vo_dancewear_co", costumeId: "cos_earth_flow", size: "Child Large", quantity: 5, unitCostCents: 3800, createdAt: daysAgo(28) },
];

const orderItems_ug: VendorOrderItem[] = [
  { id: "voi_ug_ym", vendorOrderId: "vo_urban_groove", costumeId: "cos_neon_crew", size: "Youth Medium", quantity: 18, unitCostCents: 5600, createdAt: daysAgo(20) },
  { id: "voi_ug_yl", vendorOrderId: "vo_urban_groove", costumeId: "cos_neon_crew", size: "Youth Large", quantity: 4, unitCostCents: 5600, createdAt: daysAgo(20) },
];

export const vendorOrders: VendorOrder[] = [
  {
    id: "vo_dancewear_co",
    studioId: studio.id,
    vendor: "Dancewear Co.",
    poNumber: "PO-2026-001",
    orderDate: daysAgo(28),
    expectedDelivery: daysAhead(5),
    status: "shipped",
    vendorNotes: "Partial shipment — pink tutus en route. Earth-tones shipping next week.",
    shippingCostCents: 2500,
    items: orderItems_dc,
    createdAt: daysAgo(28),
    updatedAt: daysAgo(3),
  },
  {
    id: "vo_urban_groove",
    studioId: studio.id,
    vendor: "Urban Groove Supply",
    poNumber: "PO-2026-002",
    orderDate: daysAgo(20),
    expectedDelivery: daysAhead(10),
    status: "ordered",
    shippingCostCents: 1800,
    items: orderItems_ug,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(2),
  },
];

/* ── Alterations ───────────────────────────────────────────────── */

export const alterations: Alteration[] = [
  { id: "alt_s1_hem", studioId: studio.id, studentId: "s1", costumeId: "cos_pink_tutu", alterationType: "Hem shortening", assignedTo: "Sarah (Seamstress)", dueDate: daysAhead(7), status: "in_progress", notes: "Remove 2 inches from tulle layers only.", photos: [], createdAt: daysAgo(10), updatedAt: daysAgo(2) },
  { id: "alt_s5_strap", studioId: studio.id, studentId: "s5", costumeId: "cos_earth_flow", alterationType: "Strap adjustment", assignedTo: "Sarah (Seamstress)", dueDate: daysAhead(5), status: "not_started", notes: "Shorten straps by 1.5 inches. Adjustable straps already at limit.", photos: [], createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  { id: "alt_s7_waist", studioId: studio.id, studentId: "s7", costumeId: "cos_gold_formal", alterationType: "Waist take-in", assignedTo: "Studio Staff", dueDate: daysAgo(2), status: "complete", notes: "Taken in 1 inch at side seams.", photos: [], createdAt: daysAgo(14), updatedAt: daysAgo(2) },
];

/* ── Costume Distributions ──────────────────────────────────────── */

export const costumeDistributions: CostumeDistribution[] = [
  {
    id: "cdist_s7",
    studioId: studio.id,
    studentId: "s7",
    costumeId: "cos_gold_formal",
    itemsChecklist: [
      { label: "Costume (Black & Gold Leotard)", checked: true },
      { label: "Gold Headpiece", checked: true },
      { label: "Tights (Convertible)", checked: true },
      { label: "Accessories", checked: true },
      { label: "Shoes", checked: true },
    ],
    signedBy: "Diane Walsh",
    signedAt: daysAgo(2),
    missingItems: [],
    notes: "All items accounted for.",
    createdAt: daysAgo(2),
  },
];

/* ── Reusable Inventory ────────────────────────────────────────── */

export const reusableCostumes: ReusableCostume[] = [
  { id: "rinv_pink_sm_1", studioId: studio.id, costumeId: "cos_pink_tutu", size: "Child Small", condition: "good", purchaseDate: daysAgo(365), lastUsed: daysAgo(180), storageBin: "BIN-A12", rackNumber: "R3", status: "available", createdAt: daysAgo(365), updatedAt: daysAgo(60) },
  { id: "rinv_pink_sm_2", studioId: studio.id, costumeId: "cos_pink_tutu", size: "Child Small", condition: "excellent", purchaseDate: daysAgo(90), storageBin: "BIN-A12", rackNumber: "R3", status: "reserved", createdAt: daysAgo(90), updatedAt: daysAgo(14) },
  { id: "rinv_tap_m", studioId: studio.id, costumeId: "cos_tap_tux", size: "Child Medium", condition: "fair", purchaseDate: daysAgo(540), lastUsed: daysAgo(200), storageBin: "BIN-C04", rackNumber: "R7", status: "available", notes: "Some sequin wear on collar. Still performance-ready.", createdAt: daysAgo(540), updatedAt: daysAgo(30) },
  { id: "rinv_acro_navy", studioId: studio.id, costumeId: "cos_acro_unitard", size: "Child Large", condition: "damaged", purchaseDate: daysAgo(300), lastUsed: daysAgo(100), storageBin: "BIN-F02", rackNumber: "R2", status: "damaged", notes: "Tear at left knee seam. Needs repair before reuse.", createdAt: daysAgo(300), updatedAt: daysAgo(14) },
];

/* ── Costume Rentals ────────────────────────────────────────────── */

export const costumeRentals: CostumeRental[] = [
  { id: "rent_s12_lilac", studioId: studio.id, studentId: "s12", costumeId: "cos_lilac_lyrical", rentalFeeCents: 2500, depositCents: 5000, returnDate: daysAhead(14), status: "active", damageFeeCents: 0, createdAt: daysAgo(10), updatedAt: daysAgo(10) },
  { id: "rent_s8_tap", studioId: studio.id, studentId: "s8", costumeId: "cos_tap_tux", rentalFeeCents: 3000, depositCents: 6000, returnDate: daysAgo(5), returnedAt: daysAgo(5), status: "returned", damageFeeCents: 0, notes: "Returned in good condition.", createdAt: daysAgo(30), updatedAt: daysAgo(5) },
];

/* ── Quick Change Conflicts ─────────────────────────────────────── */

export const quickChangeConflicts: QuickChangeConflict[] = [
  {
    id: "qcc_s5", studioId: studio.id, recitalEventId: "r1", studentId: "s5",
    routineA: "Act II — Rising Energy", routineAEndTime: "19:42",
    routineB: "Act III — Grace & Flow", routineBStartTime: "19:50",
    estimatedChangeMinutes: 5, conflictDetected: true,
    recommendation: "Pre-position costume change station near stage left wing. Consider moving Act III entry by 2 minutes.",
    resolved: false, createdAt: daysAgo(7),
  },
  {
    id: "qcc_s10", studioId: studio.id, recitalEventId: "r1", studentId: "s10",
    routineA: "Act II — Rising Energy", routineAEndTime: "19:42",
    routineB: "Finale — Senior Spotlight", routineBStartTime: "19:55",
    estimatedChangeMinutes: 8, conflictDetected: false,
    resolved: true, createdAt: daysAgo(5),
  },
];
