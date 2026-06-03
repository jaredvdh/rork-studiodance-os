import type {
  Announcement,
  Caregiver,
  CaregiverAuditEvent,
  Class,
  FamilyContact,
  Invoice,
  ParentAccount,
  RecitalEvent,
  RevenuePoint,
  Student,
  Studio,
  Teacher,
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
  const name = `${pick(firstNames, i)} ${pick(lastNames, i * 3 + 1)}`;
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
