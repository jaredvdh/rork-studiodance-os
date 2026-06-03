import { createAdminClient } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const NOW = new Date().toISOString();

/* ── Demo passwords for auth seed — same as demo-login ────────────── */
const DEMO_PASSWORD = "StudioFlowDemo123!";

/* ── Helper: deterministic IDs ────────────────────────────────────── */
function did(prefix: string, n: number): string {
  return `demo_${prefix}_${n}`;
}

/* ── Tenant 1: Aurora Dance Academy ───────────────────────────────── */

const STUDIO_AURORA = {
  id: "demo_studio_aurora",
  name: "Aurora Dance Academy",
  tagline: "Where every dancer finds their light",
  city: "Portland, OR",
  brand_color: "350 74% 60%",
  initials: "AD",
  vertical: "dance",
  owner_id: "demo_user_admin_dance",
  created_at: NOW,
  updated_at: NOW,
};

const PROFILES_AURORA = [
  { id: "demo_user_admin_dance", email: "demo.admin@studioflow.app", name: "Aurora Admin", role: "studio_admin", studio_id: "demo_studio_aurora", created_at: NOW, updated_at: NOW },
  { id: "demo_user_parent_dance", email: "demo.parent@studioflow.app", name: "Diane Walsh", role: "parent", studio_id: "demo_studio_aurora", created_at: NOW, updated_at: NOW },
  { id: "demo_user_coach_1", email: "mara@aurora.dance", name: "Mara Delgado", role: "instructor", studio_id: "demo_studio_aurora", created_at: NOW, updated_at: NOW },
  { id: "demo_user_coach_2", email: "theo@aurora.dance", name: "Theo Nakamura", role: "instructor", studio_id: "demo_studio_aurora", created_at: NOW, updated_at: NOW },
  { id: "demo_user_coach_3", email: "priya@aurora.dance", name: "Priya Anand", role: "instructor", studio_id: "demo_studio_aurora", created_at: NOW, updated_at: NOW },
];

const TEACHERS_AURORA = [
  { id: did("t", 1), studio_id: STUDIO_AURORA.id, name: "Mara Delgado", styles: ["Ballet", "Lyrical"], email: "mara@aurora.dance", hourly_rate_cents: 4500, pay_type: "employee", created_at: NOW, updated_at: NOW },
  { id: did("t", 2), studio_id: STUDIO_AURORA.id, name: "Theo Nakamura", styles: ["Hip Hop", "Jazz"], email: "theo@aurora.dance", hourly_rate_cents: 5000, pay_type: "1099", created_at: NOW, updated_at: NOW },
  { id: did("t", 3), studio_id: STUDIO_AURORA.id, name: "Priya Anand", styles: ["Contemporary", "Lyrical"], email: "priya@aurora.dance", hourly_rate_cents: 4000, pay_type: "employee", created_at: NOW, updated_at: NOW },
];

const CLASSES_AURORA = [
  { id: did("c", 1), studio_id: STUDIO_AURORA.id, name: "Tiny Tots Ballet", style: "Ballet", age_group: "Tiny Tots", day: "Mon", start_time: "16:00", duration_mins: 45, room: "Studio A", teacher_id: did("t", 1), capacity: 12, enrolled: 11, waitlist: 3, in_recital: true, price_cents: 8500, created_at: NOW, updated_at: NOW },
  { id: did("c", 2), studio_id: STUDIO_AURORA.id, name: "Junior Hip Hop", style: "Hip Hop", age_group: "Junior", day: "Mon", start_time: "17:00", duration_mins: 60, room: "Studio B", teacher_id: did("t", 2), capacity: 18, enrolled: 18, waitlist: 5, in_recital: true, price_cents: 9500, created_at: NOW, updated_at: NOW },
  { id: did("c", 3), studio_id: STUDIO_AURORA.id, name: "Senior Contemporary", style: "Contemporary", age_group: "Senior", day: "Tue", start_time: "18:30", duration_mins: 75, room: "Studio A", teacher_id: did("t", 3), capacity: 16, enrolled: 13, waitlist: 0, in_recital: true, price_cents: 11000, created_at: NOW, updated_at: NOW },
  { id: did("c", 4), studio_id: STUDIO_AURORA.id, name: "Intermediate Jazz", style: "Jazz", age_group: "Intermediate", day: "Tue", start_time: "17:00", duration_mins: 60, room: "Studio B", teacher_id: did("t", 2), capacity: 16, enrolled: 14, waitlist: 1, in_recital: true, price_cents: 9500, created_at: NOW, updated_at: NOW },
  { id: did("c", 5), studio_id: STUDIO_AURORA.id, name: "Adult Tap Social", style: "Tap", age_group: "Adult", day: "Wed", start_time: "19:30", duration_mins: 60, room: "Studio C", teacher_id: did("t", 2), capacity: 20, enrolled: 9, waitlist: 0, in_recital: false, price_cents: 7500, created_at: NOW, updated_at: NOW },
  { id: did("c", 6), studio_id: STUDIO_AURORA.id, name: "Junior Lyrical", style: "Lyrical", age_group: "Junior", day: "Wed", start_time: "16:30", duration_mins: 60, room: "Studio A", teacher_id: did("t", 1), capacity: 16, enrolled: 15, waitlist: 2, in_recital: true, price_cents: 9500, created_at: NOW, updated_at: NOW },
  { id: did("c", 7), studio_id: STUDIO_AURORA.id, name: "Senior Hip Hop Crew", style: "Hip Hop", age_group: "Senior", day: "Thu", start_time: "18:00", duration_mins: 90, room: "Studio B", teacher_id: did("t", 2), capacity: 20, enrolled: 19, waitlist: 6, in_recital: true, price_cents: 12500, created_at: NOW, updated_at: NOW },
  { id: did("c", 8), studio_id: STUDIO_AURORA.id, name: "Acro Foundations", style: "Acro", age_group: "Intermediate", day: "Thu", start_time: "16:30", duration_mins: 60, room: "Studio C", teacher_id: did("t", 3), capacity: 12, enrolled: 8, waitlist: 0, in_recital: false, price_cents: 10000, created_at: NOW, updated_at: NOW },
];

/* ── Parents / Families (3 families) ─────────────────────────────── */

const PARENTS_AURORA = [
  { id: did("parent", 1), studio_id: STUDIO_AURORA.id, name: "Diane Walsh", email: "diane.walsh@email.com", phone: "(555) 123-4567", address: "1428 NW Lovejoy St", city: "Portland", state: "OR", zip: "97209", child_ids: [did("s", 1), did("s", 5)], created_at: NOW, updated_at: NOW },
  { id: did("parent", 2), studio_id: STUDIO_AURORA.id, name: "Marcus Carter", email: "marcus.carter@email.com", phone: "(555) 234-5678", address: "3821 SE Hawthorne Blvd", city: "Portland", state: "OR", zip: "97214", child_ids: [did("s", 2)], created_at: NOW, updated_at: NOW },
  { id: did("parent", 3), studio_id: STUDIO_AURORA.id, name: "Anita Patel", email: "anita.patel@email.com", phone: "(555) 345-6789", address: "720 SW Broadway Dr", city: "Portland", state: "OR", zip: "97205", child_ids: [did("s", 3)], created_at: NOW, updated_at: NOW },
];

/* ── Students ─────────────────────────────────────────────────────── */

const firstNames = ["Ava", "Liam", "Sofia", "Noah", "Mia", "Ethan", "Isla", "Leo", "Maya", "Kai", "Zoe", "Eli", "Nora", "Owen", "Lila"];
const lastNames = ["Carter", "Nguyen", "Patel", "Rivera", "Kim", "Brooks", "Hassan", "Walsh", "Okafor", "Stein", "Ferraro", "Moss"];

function makeStudent(i: number) {
  const fi = i % firstNames.length;
  const li = (i * 3 + 1) % lastNames.length;
  const name = `${firstNames[fi]} ${lastNames[li]}`;
  const parentIdx = i % 3;
  const parent = PARENTS_AURORA[parentIdx];
  const waiverRoll = (i * 7) % 10;
  const payRoll = (i * 5) % 10;
  const attendance = Math.min(0.99, 0.72 + ((i * 13) % 26) / 100);
  const enrolled = CLASSES_AURORA.filter((_, ci) => (i + ci) % 4 === 0).slice(0, 2).map((c) => c.id);
  return {
    id: did("s", i + 1),
    studio_id: STUDIO_AURORA.id,
    name,
    dob: new Date(2008 + (i % 12), (i * 3) % 12, ((i * 7) % 27) + 1).toISOString(),
    parent_id: parent.id,
    parent_name: parent.name,
    parent_email: parent.email,
    class_ids: enrolled.length ? enrolled : [CLASSES_AURORA[i % CLASSES_AURORA.length].id],
    attendance_rate: attendance,
    waiver: waiverRoll < 7 ? "signed" : waiverRoll < 9 ? "pending" : "missing",
    payment: payRoll < 7 ? "paid" : payRoll < 9 ? "due" : "overdue",
    balance_cents: payRoll < 7 ? 0 : payRoll < 9 ? 9500 : 19000,
    medical_notes: i % 6 === 0 ? "Mild asthma — inhaler in bag" : null,
    allergies: [null, null, null, "Peanuts", "Dairy", "Gluten", "Bee stings", "Latex"][i % 8] as string | null,
    created_at: NOW,
    updated_at: NOW,
  };
}

const STUDENTS_AURORA = Array.from({ length: 15 }, (_, i) => makeStudent(i));

/* ── Enrolments ──────────────────────────────────────────────────── */
const ENROLMENTS_AURORA = STUDENTS_AURORA.flatMap((s) =>
  (s.class_ids as string[]).map((cid: string) => ({
    id: did("enr", STUDENTS_AURORA.indexOf(s) * 10 + CLASSES_AURORA.findIndex((c) => c.id === cid)),
    studio_id: STUDIO_AURORA.id,
    student_id: s.id,
    class_id: cid,
    created_at: NOW,
  }))
);

/* ── Announcements ───────────────────────────────────────────────── */
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const ANNOUNCEMENTS_AURORA = [
  { id: did("ann", 1), studio_id: STUDIO_AURORA.id, title: "Spring Recital rehearsal — May 25th", body: "All recital classes have a mandatory dress rehearsal at the Benson Theatre. Arrive 30 minutes early with full costume and hair done.", scope: "Recital", sent_at: daysAgo(1), audience: "8 recital classes", reach: 121, created_at: NOW, updated_at: NOW },
  { id: did("ann", 2), studio_id: STUDIO_AURORA.id, title: "Jazz Class cancelled tonight", body: "Due to a facilities issue, tonight's Intermediate Jazz is cancelled. A make-up class will be scheduled next week.", scope: "Emergency", sent_at: daysAgo(2), audience: "Intermediate Jazz", reach: 14, created_at: NOW, updated_at: NOW },
  { id: did("ann", 3), studio_id: STUDIO_AURORA.id, title: "Costumes due next week", body: "Final costume payments are due Friday. Please complete your balance in the parent portal to secure your dancer's costume.", scope: "Studio-wide", sent_at: daysAgo(4), audience: "All families", reach: 42, created_at: NOW, updated_at: NOW },
  { id: did("ann", 4), studio_id: STUDIO_AURORA.id, title: "New Acro Foundations spots open", body: "We've opened 4 additional spots in Acro Foundations on Thursdays. Enroll now through the portal.", scope: "Studio-wide", sent_at: daysAgo(8), audience: "All families", reach: 42, created_at: NOW, updated_at: NOW },
];

/* ── Invoices ─────────────────────────────────────────────────────── */
const INVOICES_AURORA = STUDENTS_AURORA
  .filter((s) => s.payment !== "paid")
  .slice(0, 8)
  .map((s, i) => ({
    id: did("inv", i + 1),
    studio_id: STUDIO_AURORA.id,
    student_name: s.name,
    parent_name: s.parent_name,
    description: i % 2 === 0 ? "May tuition" : "Recital costume + tuition",
    amount_cents: s.balance_cents || 9500,
    status: s.payment as string,
    due_date: s.payment === "overdue" ? daysAgo(6) : new Date(Date.now() + (5 + i) * 86400000).toISOString(),
    created_at: NOW,
    updated_at: NOW,
  }));

/* ── Recital ─────────────────────────────────────────────────────── */
const RECITAL_AURORA = [{
  id: did("rec", 1),
  studio_id: STUDIO_AURORA.id,
  name: "Spring Showcase 2026",
  date: "2026-06-15T19:00:00Z",
  venue: "Benson Theatre",
  costume_deadline: "2026-05-30T00:00:00Z",
  created_at: NOW,
  updated_at: NOW,
}];

/* ── Activity logs ────────────────────────────────────────────────── */
const ACTIVITY_AURORA = [
  { id: did("log", 1), studio_id: STUDIO_AURORA.id, user_id: "demo_user_admin_dance", event: "studio_created", details: "Aurora Dance Academy demo tenant seeded", created_at: NOW },
  { id: did("log", 2), studio_id: STUDIO_AURORA.id, user_id: "demo_user_admin_dance", event: "announcement_sent", details: "\"Spring Recital rehearsal\" sent to 121 recipients", created_at: daysAgo(1) },
  { id: did("log", 3), studio_id: STUDIO_AURORA.id, user_id: "demo_user_admin_dance", event: "emergency_sent", details: "\"Jazz Class cancelled tonight\" sent to 14 recipients (emergency)", created_at: daysAgo(2) },
];

/* ══════════════════════════════════════════════════════════════════════
   TENANT 2: Northside CrossFit
   ══════════════════════════════════════════════════════════════════════ */

const STUDIO_CROSSFIT = {
  id: "demo_studio_crossfit",
  name: "Northside CrossFit",
  tagline: "Forged by community. Driven by results.",
  city: "Portland, OR",
  brand_color: "32 82% 48%",
  initials: "NC",
  vertical: "crossfit",
  owner_id: "demo_user_admin_crossfit",
  created_at: NOW,
  updated_at: NOW,
};

const PROFILES_CROSSFIT = [
  { id: "demo_user_admin_crossfit", email: "demo.crossfit@studioflow.app", name: "Northside Admin", role: "studio_admin", studio_id: "demo_studio_crossfit", created_at: NOW, updated_at: NOW },
  { id: "demo_user_coach_cf1", email: "jake@northsidecrossfit.com", name: "Jake Morrison", role: "instructor", studio_id: "demo_studio_crossfit", created_at: NOW, updated_at: NOW },
  { id: "demo_user_coach_cf2", email: "alex@northsidecrossfit.com", name: "Alex Rivera", role: "instructor", studio_id: "demo_studio_crossfit", created_at: NOW, updated_at: NOW },
];

const TEACHERS_CROSSFIT = [
  { id: did("cf_t", 1), studio_id: STUDIO_CROSSFIT.id, name: "Jake Morrison", styles: ["CrossFit", "Olympic Lifting"], email: "jake@northsidecrossfit.com", hourly_rate_cents: 5500, pay_type: "employee", created_at: NOW, updated_at: NOW },
  { id: did("cf_t", 2), studio_id: STUDIO_CROSSFIT.id, name: "Alex Rivera", styles: ["CrossFit", "Gymnastics"], email: "alex@northsidecrossfit.com", hourly_rate_cents: 5000, pay_type: "1099", created_at: NOW, updated_at: NOW },
];

const CLASSES_CROSSFIT = [
  { id: did("cf_c", 1), studio_id: STUDIO_CROSSFIT.id, name: "Morning WOD", style: "WOD", age_group: "Adult", day: "Mon", start_time: "06:00", duration_mins: 60, room: "Main Floor", teacher_id: did("cf_t", 1), capacity: 20, enrolled: 18, waitlist: 3, in_recital: false, price_cents: 15000, created_at: NOW, updated_at: NOW },
  { id: did("cf_c", 2), studio_id: STUDIO_CROSSFIT.id, name: "Olympic Lifting", style: "Olympic Lifting", age_group: "Adult", day: "Tue", start_time: "07:00", duration_mins: 90, room: "Platform", teacher_id: did("cf_t", 1), capacity: 12, enrolled: 10, waitlist: 1, in_recital: false, price_cents: 18000, created_at: NOW, updated_at: NOW },
  { id: did("cf_c", 3), studio_id: STUDIO_CROSSFIT.id, name: "Gymnastics Skills", style: "Gymnastics", age_group: "Adult", day: "Wed", start_time: "17:30", duration_mins: 60, room: "Main Floor", teacher_id: did("cf_t", 2), capacity: 16, enrolled: 12, waitlist: 0, in_recital: false, price_cents: 15000, created_at: NOW, updated_at: NOW },
  { id: did("cf_c", 4), studio_id: STUDIO_CROSSFIT.id, name: "Evening WOD", style: "WOD", age_group: "Adult", day: "Thu", start_time: "18:00", duration_mins: 60, room: "Main Floor", teacher_id: did("cf_t", 2), capacity: 20, enrolled: 19, waitlist: 4, in_recital: false, price_cents: 15000, created_at: NOW, updated_at: NOW },
  { id: did("cf_c", 5), studio_id: STUDIO_CROSSFIT.id, name: "Foundations", style: "Foundations", age_group: "Adult", day: "Sat", start_time: "09:00", duration_mins: 75, room: "Main Floor", teacher_id: did("cf_t", 1), capacity: 10, enrolled: 7, waitlist: 0, in_recital: false, price_cents: 12000, created_at: NOW, updated_at: NOW },
  { id: did("cf_c", 6), studio_id: STUDIO_CROSSFIT.id, name: "Competition Prep", style: "WOD", age_group: "Adult", day: "Fri", start_time: "17:00", duration_mins: 90, room: "Main Floor", teacher_id: did("cf_t", 1), capacity: 12, enrolled: 12, waitlist: 5, in_recital: false, price_cents: 20000, created_at: NOW, updated_at: NOW },
];

const cfFirstNames = ["Jake", "Sarah", "Mike", "Emma", "Chris", "Lisa", "David", "Maria", "Tom", "Rachel", "Ben", "Anna", "Sam", "Kelly", "Dan"];
const cfLastNames = ["Thompson", "Garcia", "Miller", "Davis", "Wilson", "Anderson", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Harris"];

const PARENTS_CROSSFIT = [
  { id: did("cf_parent", 1), studio_id: STUDIO_CROSSFIT.id, name: "James Thompson", email: "james.t@email.com", phone: "(555) 456-7890", address: "1200 N Williams Ave", city: "Portland", state: "OR", zip: "97227", child_ids: [did("cf_s", 1), did("cf_s", 2)], created_at: NOW, updated_at: NOW },
  { id: did("cf_parent", 2), studio_id: STUDIO_CROSSFIT.id, name: "Lisa Garcia", email: "lisa.g@email.com", phone: "(555) 567-8901", address: "850 NE Alberta St", city: "Portland", state: "OR", zip: "97211", child_ids: [did("cf_s", 3)], created_at: NOW, updated_at: NOW },
  { id: did("cf_parent", 3), studio_id: STUDIO_CROSSFIT.id, name: "Tom Miller", email: "tom.m@email.com", phone: "(555) 678-9012", address: "2100 SE Division St", city: "Portland", state: "OR", zip: "97202", child_ids: [did("cf_s", 4)], created_at: NOW, updated_at: NOW },
];

const STUDENTS_CROSSFIT = Array.from({ length: 12 }, (_, i) => ({
  id: did("cf_s", i + 1),
  studio_id: STUDIO_CROSSFIT.id,
  name: `${cfFirstNames[i]} ${cfLastNames[i]}`,
  dob: new Date(1985 + (i % 20), (i * 3) % 12, ((i * 7) % 27) + 1).toISOString(),
  parent_id: PARENTS_CROSSFIT[i % 3].id,
  parent_name: PARENTS_CROSSFIT[i % 3].name,
  parent_email: PARENTS_CROSSFIT[i % 3].email,
  class_ids: [CLASSES_CROSSFIT[i % CLASSES_CROSSFIT.length].id],
  attendance_rate: 0.75 + ((i * 11) % 20) / 100,
  waiver: i % 5 === 0 ? "pending" : "signed",
  payment: i % 4 === 0 ? "overdue" : "paid",
  balance_cents: i % 4 === 0 ? 15000 : 0,
  medical_notes: null as string | null,
  allergies: null as string | null,
  created_at: NOW,
  updated_at: NOW,
}));

const ENROLMENTS_CROSSFIT = STUDENTS_CROSSFIT.map((s) => ({
  id: did("cf_enr", STUDENTS_CROSSFIT.indexOf(s)),
  studio_id: STUDIO_CROSSFIT.id,
  student_id: s.id,
  class_id: (s.class_ids as string[])[0],
  created_at: NOW,
}));

const ANNOUNCEMENTS_CROSSFIT = [
  { id: did("cf_ann", 1), studio_id: STUDIO_CROSSFIT.id, title: "Box closed July 4th", body: "Northside will be closed for Independence Day. Saturday classes resume as normal.", scope: "Studio-wide", sent_at: daysAgo(3), audience: "All athletes", reach: 56, created_at: NOW, updated_at: NOW },
  { id: did("cf_ann", 2), studio_id: STUDIO_CROSSFIT.id, title: "Murph Challenge this Saturday", body: "Join us for the annual Murph Challenge! Heats start at 8 AM. Sign up on the whiteboard.", scope: "Event", sent_at: daysAgo(1), audience: "All athletes", reach: 56, created_at: NOW, updated_at: NOW },
  { id: did("cf_ann", 3), studio_id: STUDIO_CROSSFIT.id, title: "New Foundations cycle starts June 15", body: "Perfect for newcomers or anyone wanting to refine their technique. 6-week cycle, 2x/week.", scope: "Studio-wide", sent_at: daysAgo(5), audience: "All athletes", reach: 56, created_at: NOW, updated_at: NOW },
];

const INVOICES_CROSSFIT = STUDENTS_CROSSFIT
  .filter((s) => s.payment !== "paid")
  .slice(0, 4)
  .map((s, i) => ({
    id: did("cf_inv", i + 1),
    studio_id: STUDIO_CROSSFIT.id,
    student_name: s.name,
    parent_name: s.parent_name,
    description: i % 2 === 0 ? "June membership" : "Competition Prep + membership",
    amount_cents: s.balance_cents || 15000,
    status: s.payment as string,
    due_date: s.payment === "overdue" ? daysAgo(3) : new Date(Date.now() + (5 + i) * 86400000).toISOString(),
    created_at: NOW,
    updated_at: NOW,
  }));

const ACTIVITY_CROSSFIT = [
  { id: did("cf_log", 1), studio_id: STUDIO_CROSSFIT.id, user_id: "demo_user_admin_crossfit", event: "studio_created", details: "Northside CrossFit demo tenant seeded", created_at: NOW },
  { id: did("cf_log", 2), studio_id: STUDIO_CROSSFIT.id, user_id: "demo_user_admin_crossfit", event: "announcement_sent", details: "\"Box closed July 4th\" sent to 56 athletes", created_at: daysAgo(3) },
];

/* ── Studio settings ──────────────────────────────────────────────── */
const STUDIO_SETTINGS = [
  { id: did("sett", 1), studio_id: STUDIO_AURORA.id, settings: { vertical: "dance", autoPayEnabled: false, notificationsEnabled: true }, created_at: NOW, updated_at: NOW },
  { id: did("sett", 2), studio_id: STUDIO_CROSSFIT.id, settings: { vertical: "crossfit", autoPayEnabled: false, notificationsEnabled: true }, created_at: NOW, updated_at: NOW },
];

/* ══════════════════════════════════════════════════════════════════════
   Handler
   ══════════════════════════════════════════════════════════════════════ */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Parse optional reset flag
    let reset = false;
    try {
      const body = await req.json();
      reset = body?.reset === true;
    } catch { /* no body — default to upsert */ }

    const supabase = createAdminClient();

    const results: string[] = [];
    const errors: string[] = [];

    /* ── Helper: upsert with error collection ────────────────────── */
    async function upsert(table: string, rows: Record<string, unknown>[], label: string) {
      if (reset) {
        // Delete all demo records from this table first
        const { error: delErr } = await supabase
          .from(table)
          .delete()
          .like("id", "demo_%");
        if (delErr) errors.push(`delete ${table}: ${delErr.message}`);
      }

      const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
      if (error) {
        errors.push(`${label}: ${error.message}`);
      } else {
        results.push(`${label}: ${rows.length} rows`);
      }
    }

    // ── Seed Tenant 1: Aurora Dance ───────────────────────────────
    await upsert("studios", [STUDIO_AURORA], "Aurora studio");
    await upsert("profiles", PROFILES_AURORA, "Aurora profiles");
    await upsert("teachers", TEACHERS_AURORA, "Aurora teachers");
    await upsert("classes", CLASSES_AURORA, "Aurora classes");
    await upsert("parents", PARENTS_AURORA, "Aurora parents");
    await upsert("students", STUDENTS_AURORA, "Aurora students");
    await upsert("enrolments", ENROLMENTS_AURORA, "Aurora enrolments");
    await upsert("announcements", ANNOUNCEMENTS_AURORA, "Aurora announcements");
    await upsert("invoices", INVOICES_AURORA, "Aurora invoices");
    await upsert("recital_events", RECITAL_AURORA, "Aurora recitals");
    await upsert("activity_logs", ACTIVITY_AURORA, "Aurora activity logs");

    // ── Seed Tenant 2: Northside CrossFit ─────────────────────────
    await upsert("studios", [STUDIO_CROSSFIT], "CrossFit studio");
    await upsert("profiles", PROFILES_CROSSFIT, "CrossFit profiles");
    await upsert("teachers", TEACHERS_CROSSFIT, "CrossFit coaches");
    await upsert("classes", CLASSES_CROSSFIT, "CrossFit sessions");
    await upsert("parents", PARENTS_CROSSFIT, "CrossFit parents");
    await upsert("students", STUDENTS_CROSSFIT, "CrossFit athletes");
    await upsert("enrolments", ENROLMENTS_CROSSFIT, "CrossFit enrolments");
    await upsert("announcements", ANNOUNCEMENTS_CROSSFIT, "CrossFit announcements");
    await upsert("invoices", INVOICES_CROSSFIT, "CrossFit invoices");
    await upsert("activity_logs", ACTIVITY_CROSSFIT, "CrossFit activity logs");

    // ── Shared ────────────────────────────────────────────────────
    await upsert("studio_settings", STUDIO_SETTINGS, "Studio settings");

    // ── Also upsert into import_history for migration demo ────────
    await upsert("import_history", [{
      id: did("imp", 1),
      studio_id: STUDIO_AURORA.id,
      user_id: "demo_user_admin_dance",
      file_name: "aurora_roster_2025.csv",
      file_type: "csv",
      category: "students",
      total_rows: 42,
      imported_rows: 38,
      skipped_rows: 2,
      error_count: 2,
      completed_at: daysAgo(60),
      created_at: NOW,
    }], "Aurora import history");

    const statusCode = errors.length > 0 ? 207 : 200;

    return new Response(JSON.stringify({
      ok: errors.length === 0,
      results,
      errors,
      reset,
      message: `Seeded ${results.length} tables across 2 demo tenants. ${errors.length > 0 ? ` ${errors.length} errors.` : "All clear."}`,
    }), {
      status: statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("seed-demo-data error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", detail: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
