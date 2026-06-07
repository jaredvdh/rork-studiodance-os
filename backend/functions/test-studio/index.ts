import { createAdminClient } from "../_shared/auth.ts";
import { handlePreflight, jsonCorsHeaders } from "../_shared/cors.ts";

/**
 * test-studio — reliable sandbox provisioning for StudioFlow.
 *
 * Creates REAL Supabase-backed test studios that exercise the true production
 * data flow + RLS, then lets the team delete them safely. Unlike the legacy
 * demo flow, this does NOT rely on synthetic client-side JWTs or Rork→Supabase
 * JWKS trust. Instead it provisions a native Supabase Auth user (email/password)
 * via service_role, so `auth.uid()` resolves and every existing RLS policy works
 * unchanged when the client signs in.
 *
 * Actions (POST body { action }):
 *   • "create" — provision a test admin auth user + profile + studio (is_test),
 *                optionally seed realistic per-vertical sample data and a
 *                portal (caregiver/member) auth account for portal testing.
 *   • "delete" — verify studios.is_test = true, then delete the studio (cascade)
 *                and the test auth users/profiles it provisioned.
 *
 * Everything written here is marked is_test = true so it is trivially filtered
 * and removed later. service_role is used ONLY by this backend function; normal
 * app traffic continues to use the user's own session under RLS.
 */

type Vertical = "dance" | "yoga" | "crossfit" | "gym" | "martial_arts" | "music_school";

const TEST_PASSWORD = "Sandbox123!";
const NOW = () => new Date().toISOString();
const uid = () => crypto.randomUUID();

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

/** A short random token for unique test emails. */
function token(): string {
  return Math.random().toString(36).slice(2, 8);
}

/* ── Per-vertical sample data blueprints ──────────────────────────────────── */

interface Blueprint {
  /** Whether participants are children with separate caregivers (true) or adults
   *  who are their own portal account (false). */
  childBased: boolean;
  brandColor: string;
  tagline: string;
  teachers: { name: string; styles: string[]; rate: number; payType: string }[];
  classes: { name: string; style: string; age: string; day: string; time: string; mins: number; room: string; cap: number; price: number }[];
  /** participant first names */
  names: string[];
  waiverTitle: string;
  waiverType: string;
  waiverBody: string;
}

const BLUEPRINTS: Record<Vertical, Blueprint> = {
  dance: {
    childBased: true,
    brandColor: "350 74% 60%",
    tagline: "Where every dancer finds their light",
    teachers: [
      { name: "Mara Delgado", styles: ["Ballet", "Lyrical"], rate: 4500, payType: "employee" },
      { name: "Theo Nakamura", styles: ["Hip Hop", "Jazz"], rate: 5000, payType: "1099" },
      { name: "Priya Anand", styles: ["Contemporary", "Tap"], rate: 4000, payType: "employee" },
    ],
    classes: [
      { name: "Tiny Tots Ballet", style: "Ballet", age: "Tiny Tots", day: "Mon", time: "16:00", mins: 45, room: "Studio A", cap: 12, price: 8500 },
      { name: "Junior Hip Hop", style: "Hip Hop", age: "Junior", day: "Mon", time: "17:00", mins: 60, room: "Studio B", cap: 18, price: 9500 },
      { name: "Senior Contemporary", style: "Contemporary", age: "Senior", day: "Tue", time: "18:30", mins: 75, room: "Studio A", cap: 16, price: 11000 },
      { name: "Intermediate Jazz", style: "Jazz", age: "Intermediate", day: "Wed", time: "17:00", mins: 60, room: "Studio B", cap: 16, price: 9500 },
      { name: "Junior Tap", style: "Tap", age: "Junior", day: "Thu", time: "16:30", mins: 60, room: "Studio C", cap: 14, price: 9000 },
    ],
    names: ["Ava", "Liam", "Sofia", "Noah", "Mia", "Ethan", "Isla", "Leo"],
    waiverTitle: "Liability Release & Recital Participation",
    waiverType: "liability",
    waiverBody: "I acknowledge the physical nature of dance instruction and recital performances and release Aurora Dance Academy from liability for injuries sustained during classes, rehearsals, and performances. I confirm I am the legal guardian authorised to sign on behalf of my dancer.",
  },
  crossfit: {
    childBased: false,
    brandColor: "32 82% 48%",
    tagline: "Forged by community. Driven by results.",
    teachers: [
      { name: "Jake Morrison", styles: ["Strength", "Olympic Lifting"], rate: 5500, payType: "employee" },
      { name: "Alex Rivera", styles: ["Conditioning", "Gymnastics"], rate: 5000, payType: "1099" },
    ],
    classes: [
      { name: "Morning WOD", style: "Conditioning", age: "Adult", day: "Mon", time: "06:00", mins: 60, room: "Main Floor", cap: 20, price: 15000 },
      { name: "Olympic Lifting", style: "Olympic Lifting", age: "Adult", day: "Tue", time: "07:00", mins: 90, room: "Platform", cap: 12, price: 18000 },
      { name: "Gymnastics Skills", style: "Gymnastics", age: "Adult", day: "Wed", time: "17:30", mins: 60, room: "Main Floor", cap: 16, price: 15000 },
      { name: "Evening WOD", style: "Conditioning", age: "Adult", day: "Thu", time: "18:00", mins: 60, room: "Main Floor", cap: 20, price: 15000 },
      { name: "Mobility & Recovery", style: "Mobility", age: "Adult", day: "Sat", time: "09:00", mins: 45, room: "Studio B", cap: 16, price: 12000 },
    ],
    names: ["Sarah", "Mike", "Emma", "Chris", "Lisa", "David", "Maria", "Tom"],
    waiverTitle: "Fitness Assumption of Risk & Liability Waiver",
    waiverType: "liability",
    waiverBody: "I understand that CrossFit and high-intensity training carry inherent risks. I confirm I am physically able to participate and release Northside CrossFit from liability for injuries sustained during training. I agree to follow coach instruction and gym safety rules.",
  },
  yoga: {
    childBased: false,
    brandColor: "178 42% 42%",
    tagline: "Breathe. Move. Restore.",
    teachers: [
      { name: "Lena Brooks", styles: ["Vinyasa", "Power Yoga"], rate: 4500, payType: "1099" },
      { name: "Sam Okafor", styles: ["Hatha", "Yin"], rate: 4200, payType: "employee" },
    ],
    classes: [
      { name: "Morning Vinyasa Flow", style: "Vinyasa", age: "All Levels", day: "Mon", time: "07:30", mins: 60, room: "Main Room", cap: 22, price: 9000 },
      { name: "Power Yoga", style: "Power Yoga", age: "Intermediate", day: "Tue", time: "18:00", mins: 60, room: "Main Room", cap: 20, price: 9500 },
      { name: "Gentle Hatha", style: "Hatha", age: "All Levels", day: "Wed", time: "10:00", mins: 75, room: "Studio 2", cap: 18, price: 9000 },
      { name: "Yin & Restore", style: "Yin", age: "All Levels", day: "Thu", time: "19:00", mins: 75, room: "Studio 2", cap: 16, price: 9000 },
      { name: "Weekend Restorative", style: "Restorative", age: "All Levels", day: "Sat", time: "08:30", mins: 90, room: "Main Room", cap: 20, price: 10000 },
    ],
    names: ["Grace", "Owen", "Nora", "Eli", "Zoe", "Kai", "Lila", "Ben"],
    waiverTitle: "Yoga Health & Liability Acknowledgement",
    waiverType: "liability",
    waiverBody: "I acknowledge that yoga involves physical movement and that I am responsible for practising within my own limits. I have disclosed any relevant health conditions and release the studio from liability for injuries arising from my practice.",
  },
  gym: {
    childBased: false,
    brandColor: "220 12% 40%",
    tagline: "Stronger every day.",
    teachers: [
      { name: "Riley Stone", styles: ["Strength", "Conditioning"], rate: 5000, payType: "employee" },
      { name: "Dana Fields", styles: ["Mobility", "Gymnastics"], rate: 4600, payType: "1099" },
    ],
    classes: [
      { name: "Strength Circuit", style: "Strength", age: "Adult", day: "Mon", time: "06:30", mins: 60, room: "Floor 1", cap: 20, price: 13000 },
      { name: "HIIT Conditioning", style: "Conditioning", age: "Adult", day: "Wed", time: "18:00", mins: 45, room: "Floor 1", cap: 24, price: 12000 },
      { name: "Mobility Lab", style: "Mobility", age: "Adult", day: "Fri", time: "17:00", mins: 45, room: "Studio B", cap: 16, price: 11000 },
    ],
    names: ["Jordan", "Casey", "Avery", "Morgan", "Quinn", "Reese", "Skyler", "Drew"],
    waiverTitle: "Gym Membership Liability Waiver",
    waiverType: "liability",
    waiverBody: "I assume the risks associated with strength and conditioning training and release the gym from liability for injuries sustained on the premises. I agree to use equipment safely and follow staff guidance.",
  },
  martial_arts: {
    childBased: true,
    brandColor: "245 48% 48%",
    tagline: "Discipline. Respect. Strength.",
    teachers: [
      { name: "Sensei Hiro Tanaka", styles: ["Beginner", "Advanced"], rate: 5000, payType: "employee" },
      { name: "Sensei Carla Reyes", styles: ["Intermediate", "Sparring"], rate: 4500, payType: "1099" },
    ],
    classes: [
      { name: "Little Dragons (Beginner)", style: "Beginner", age: "Tiny Tots", day: "Mon", time: "16:00", mins: 45, room: "Dojo A", cap: 16, price: 9000 },
      { name: "Youth White-Yellow", style: "Beginner", age: "Junior", day: "Tue", time: "17:00", mins: 60, room: "Dojo A", cap: 20, price: 9500 },
      { name: "Intermediate Belt", style: "Intermediate", age: "Intermediate", day: "Wed", time: "18:00", mins: 60, room: "Dojo B", cap: 18, price: 10500 },
      { name: "Advanced Sparring", style: "Sparring", age: "Senior", day: "Thu", time: "19:00", mins: 75, room: "Dojo A", cap: 14, price: 11500 },
      { name: "Grading Prep", style: "Grading Prep", age: "All Levels", day: "Sat", time: "10:00", mins: 90, room: "Dojo B", cap: 16, price: 12000 },
    ],
    names: ["Aiden", "Maya", "Ravi", "Hana", "Diego", "Yuki", "Omar", "Ivy"],
    waiverTitle: "Martial Arts Participation & Liability Release",
    waiverType: "liability",
    waiverBody: "I understand that martial arts training includes physical contact and sparring. I release the school from liability for injuries sustained during training, gradings, and tournaments, and confirm I am the legal guardian authorised to sign for my student.",
  },
  music_school: {
    childBased: true,
    brandColor: "268 30% 40%",
    tagline: "Find your sound.",
    teachers: [
      { name: "Clara Whitman", styles: ["Piano", "Voice"], rate: 5000, payType: "1099" },
      { name: "Marcus Bell", styles: ["Guitar", "Drums"], rate: 4800, payType: "1099" },
    ],
    classes: [
      { name: "Beginner Piano", style: "Piano", age: "Junior", day: "Mon", time: "16:00", mins: 30, room: "Room 1", cap: 1, price: 6000 },
      { name: "Guitar Fundamentals", style: "Guitar", age: "Intermediate", day: "Tue", time: "17:00", mins: 45, room: "Room 2", cap: 4, price: 7000 },
      { name: "Vocal Technique", style: "Voice", age: "Senior", day: "Wed", time: "18:00", mins: 45, room: "Room 3", cap: 6, price: 7500 },
      { name: "Drum Lab", style: "Drums", age: "All Levels", day: "Thu", time: "17:30", mins: 45, room: "Room 4", cap: 4, price: 7000 },
    ],
    names: ["Ella", "Jonah", "Priya", "Theo", "Anya", "Caleb", "Rosa", "Finn"],
    waiverTitle: "Music School Enrolment & Media Consent",
    waiverType: "photo_video",
    waiverBody: "I consent to my child's participation in lessons and recitals, and I grant permission for recital photos and video to be used for studio promotion. I confirm I am the legal guardian authorised to sign on their behalf.",
  },
};

/* ── Row builders ─────────────────────────────────────────────────────────── */

interface SeedResult {
  results: string[];
  errors: string[];
  counts: Record<string, number>;
  portal: { email: string; password: string; role: string; participants: string[] } | null;
}

// deno-lint-ignore no-explicit-any
type Db = any;

async function seedStudioData(
  db: Db,
  studioId: string,
  vertical: Vertical,
): Promise<SeedResult> {
  const bp = BLUEPRINTS[vertical];
  const results: string[] = [];
  const errors: string[] = [];
  const counts: Record<string, number> = {};

  async function insert(table: string, rows: Record<string, unknown>[], label: string) {
    if (rows.length === 0) return;
    const { error } = await db.from(table).insert(rows);
    if (error) {
      errors.push(`${label}: ${error.message}`);
    } else {
      results.push(`${label}: ${rows.length}`);
      counts[table] = (counts[table] ?? 0) + rows.length;
    }
  }

  // Teachers / coaches / instructors
  const teacherRows = bp.teachers.map((t) => ({
    id: uid(),
    studio_id: studioId,
    name: t.name,
    email: `coach.${t.name.split(" ")[0].toLowerCase()}.${token()}@studioflow.test`,
    styles: t.styles,
    hourly_rate_cents: t.rate,
    pay_type: t.payType,
  }));
  await insert("teachers", teacherRows, "Instructors");

  // Classes
  const classRows = bp.classes.map((c, i) => ({
    id: uid(),
    studio_id: studioId,
    name: c.name,
    style: c.style,
    teacher_id: teacherRows[i % teacherRows.length].id,
    age_group: c.age,
    capacity: c.cap,
    enrolled: 0,
    waitlist: 0,
    day: c.day,
    start_time: c.time,
    duration_mins: c.mins,
    room: c.room,
    price_cents: c.price,
    in_recital: vertical === "dance" || vertical === "music_school",
  }));
  await insert("classes", classRows, "Classes");

  // Caregivers + students.
  // childBased verticals: distinct caregiver (parent) per family with children.
  // adult verticals: the member is their own caregiver (relationship "Self").
  const caregiverRows: Record<string, unknown>[] = [];
  const studentRows: Record<string, unknown>[] = [];
  const enrolmentRows: Record<string, unknown>[] = [];
  const invoiceRows: Record<string, unknown>[] = [];

  // The first caregiver becomes the linked portal account.
  let portalCaregiver: { id: string; name: string; email: string } | null = null;
  const portalEmail = `${bp.childBased ? "parent" : "member"}.${token()}@studioflow.test`;
  const participantNames: string[] = [];

  const familyCount = bp.childBased ? 4 : 6;
  for (let f = 0; f < familyCount; f++) {
    const cgId = uid();
    const firstName = bp.names[f % bp.names.length];
    const lastName = ["Walsh", "Carter", "Patel", "Nguyen", "Brooks", "Stein"][f % 6];
    const isPortal = f === 0;
    const cgEmail = isPortal ? portalEmail : `contact.${firstName.toLowerCase()}.${token()}@studioflow.test`;

    caregiverRows.push({
      id: cgId,
      studio_id: studioId,
      first_name: bp.childBased ? `Pat ${lastName}` : firstName,
      last_name: lastName,
      name: bp.childBased ? `Pat ${lastName}` : `${firstName} ${lastName}`,
      email: cgEmail,
      phone: `(555) ${100 + f}-${1000 + f}`,
      relationship_to_student: bp.childBased ? "Parent" : "Self",
      status: "active",
      role: "primary_caregiver",
      receives_announcements: true,
      receives_emergency_messages: true,
      can_view_schedule: true,
      can_view_billing: true,
      can_pay_invoices: true,
      can_sign_waivers: true,
    });

    if (isPortal) portalCaregiver = { id: cgId, name: `${firstName} ${lastName}`, email: cgEmail };

    // Each family/member has 1-2 participants. For child-based, the portal
    // family gets 2 children; otherwise 1.
    const childCount = bp.childBased ? (isPortal ? 2 : 1) : 1;
    for (let c = 0; c < childCount; c++) {
      const sId = uid();
      const sName = bp.childBased
        ? `${bp.names[(f + c + 1) % bp.names.length]} ${lastName}`
        : `${firstName} ${lastName}`;
      if (isPortal) participantNames.push(sName);

      const enrolledClass = classRows[(f + c) % classRows.length];
      const payRoll = (f + c) % 3;
      const payment = payRoll === 0 ? "overdue" : payRoll === 1 ? "due" : "paid";
      const balance = payment === "paid" ? 0 : enrolledClass.price_cents as number;

      studentRows.push({
        id: sId,
        studio_id: studioId,
        name: sName,
        dob: bp.childBased
          ? new Date(2012 + (f % 6), (c * 3) % 12, ((f * 5) % 27) + 1).toISOString().slice(0, 10)
          : new Date(1990 + (f % 15), (f * 2) % 12, ((f * 7) % 27) + 1).toISOString().slice(0, 10),
        caregiver_id: cgId,
        caregiver_name: caregiverRows[caregiverRows.length - 1].name,
        caregiver_email: cgEmail,
        class_ids: [enrolledClass.id],
        attendance_rate: 0.78 + ((f + c) % 20) / 100,
        waiver: (f + c) % 4 === 0 ? "pending" : "signed",
        payment,
        balance_cents: balance,
        medical_notes: (f + c) % 5 === 0 ? "Mild asthma — inhaler on hand" : null,
        allergies: [null, "Peanuts", null, "Dairy", null, "Bee stings"][(f + c) % 6],
      });

      enrolmentRows.push({
        id: uid(),
        studio_id: studioId,
        student_id: sId,
        class_id: enrolledClass.id,
        status: "active",
        started_at: NOW(),
      });

      if (payment !== "paid") {
        invoiceRows.push({
          id: uid(),
          studio_id: studioId,
          student_name: sName,
          parent_name: caregiverRows[caregiverRows.length - 1].name,
          parent_email: cgEmail,
          description: payment === "overdue" ? "Outstanding tuition" : `${enrolledClass.name} — monthly`,
          amount_cents: balance,
          status: payment,
          due_date: payment === "overdue" ? daysFromNow(-5) : daysFromNow(7 + f),
        });
      }
    }
  }

  await insert("caregivers", caregiverRows, bp.childBased ? "Caregivers" : "Members");
  await insert("students", studentRows, "Participants");
  await insert("enrolments", enrolmentRows, "Enrolments");
  await insert("invoices", invoiceRows, "Invoices (test mode)");

  // Update derived enrolled counts on classes
  for (const cls of classRows) {
    const count = enrolmentRows.filter((e) => e.class_id === cls.id).length;
    if (count > 0) {
      await db.from("classes").update({ enrolled: count }).eq("id", cls.id);
    }
  }

  // Announcements
  const annRows = [
    { id: uid(), studio_id: studioId, title: "Welcome to your sandbox studio", body: "This is realistic test data. Explore the dashboard, then delete it any time from Settings.", scope: "Studio-wide", sent_at: daysFromNow(-1), audience: "Everyone", reach: studentRows.length },
    { id: uid(), studio_id: studioId, title: bp.childBased ? "Costume & fees reminder" : "Membership renewal reminder", body: "A friendly reminder that outstanding balances are due this week. Pay securely from the portal.", scope: "Studio-wide", sent_at: daysFromNow(-3), audience: "All families", reach: caregiverRows.length },
  ];
  await insert("announcements", annRows, "Announcements");

  // Waiver template + published version
  try {
    const templateId = uid();
    const versionId = uid();
    const { error: tErr } = await db.from("waiver_templates").insert({
      id: templateId,
      studio_id: studioId,
      title: bp.waiverTitle,
      description: "Sample waiver seeded for sandbox testing.",
      type: bp.waiverType,
      status: "published",
      required: true,
      renewal_period: "annual",
      current_version_id: null,
    });
    if (tErr) throw tErr;
    const { error: vErr } = await db.from("waiver_versions").insert({
      id: versionId,
      waiver_template_id: templateId,
      studio_id: studioId,
      version_number: 1,
      body_markdown: bp.waiverBody,
      published_at: NOW(),
    });
    if (vErr) throw vErr;
    await db.from("waiver_templates").update({ current_version_id: versionId }).eq("id", templateId);
    results.push("Waivers: 1 template");
    counts["waiver_templates"] = 1;
  } catch (err) {
    errors.push(`Waivers: ${err instanceof Error ? err.message : String(err)}`);
  }

  // studio_settings (test mode flag + vertical)
  try {
    await db.from("studio_settings").upsert({
      studio_id: studioId,
      settings: { vertical, testing_mode: true, paymentMethod: "stripe", paymentMode: "test" },
    }, { onConflict: "studio_id" });
  } catch { /* non-fatal */ }

  return {
    results,
    errors,
    counts,
    portal: portalCaregiver
      ? { email: portalCaregiver.email, password: TEST_PASSWORD, role: bp.childBased ? "caregiver" : "member", participants: participantNames }
      : null,
  };
}

/* ── Provision a native Supabase auth user + profile ──────────────────────── */

async function createAuthUser(
  db: Db,
  email: string,
  name: string,
  role: string,
  studioId: string | null,
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { name, role, studio_id: studioId, is_test: true },
  });
  if (error || !data?.user) {
    return { error: error?.message ?? "Failed to create auth user" };
  }
  const userId = data.user.id as string;
  const { error: pErr } = await db.from("profiles").upsert({
    id: userId,
    email,
    name,
    role,
    studio_id: studioId,
    is_test: true,
    onboarding_completed: false,
    updated_at: NOW(),
  }, { onConflict: "id" });
  if (pErr) return { error: `profile: ${pErr.message}` };
  return { id: userId };
}

/* ── Handler ──────────────────────────────────────────────────────────────── */

Deno.serve(async (req: Request): Promise<Response> => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: jsonCorsHeaders(req),
    });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400, headers: jsonCorsHeaders(req),
    });
  }

  const action = String(body.action ?? "");
  const db = createAdminClient();

  try {
    if (action === "create") {
      const vertical = (String(body.vertical ?? "dance")) as Vertical;
      if (!BLUEPRINTS[vertical]) {
        return new Response(JSON.stringify({ error: `Unknown vertical: ${vertical}` }), {
          status: 400, headers: jsonCorsHeaders(req),
        });
      }
      const seed = body.seed === true;
      const bp = BLUEPRINTS[vertical];
      const studioName = String(body.studioName ?? "").trim() || `Sandbox ${vertical} studio`;
      const brandColor = String(body.brandColor ?? "").trim() || bp.brandColor;

      // 1. Provision the test admin auth user (no studio yet).
      const stamp = token();
      const adminEmail = `test-admin.${stamp}@studioflow.test`;
      const adminName = "Sandbox Owner";
      const admin = await createAuthUser(db, adminEmail, adminName, "studio_admin", null);
      if ("error" in admin) {
        return new Response(JSON.stringify({ error: `Admin provisioning failed: ${admin.error}` }), {
          status: 500, headers: jsonCorsHeaders(req),
        });
      }

      // 2. Create the studio owned by the admin (marked is_test).
      const studioId = uid();
      const initials = studioName.split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 3) || "TS";
      const { error: sErr } = await db.from("studios").insert({
        id: studioId,
        name: studioName,
        owner_id: admin.id,
        brand_color: brandColor,
        city: "Portland, OR",
        initials,
        tagline: bp.tagline,
        vertical,
        is_test: true,
      });
      if (sErr) {
        // best-effort cleanup of the orphaned admin user
        await db.auth.admin.deleteUser(admin.id).catch(() => {});
        return new Response(JSON.stringify({ error: `Studio creation failed: ${sErr.message}` }), {
          status: 500, headers: jsonCorsHeaders(req),
        });
      }
      // Link admin profile → studio
      await db.from("profiles").update({ studio_id: studioId }).eq("id", admin.id);

      let seedResult: SeedResult | null = null;
      let portalUserId: string | null = null;

      if (seed) {
        seedResult = await seedStudioData(db, studioId, vertical);

        // Provision a portal auth account matching the linked caregiver/member email.
        if (seedResult.portal) {
          const portalUser = await createAuthUser(
            db,
            seedResult.portal.email,
            seedResult.portal.participants[0] ?? "Sandbox Member",
            seedResult.portal.role,
            studioId,
          );
          if ("id" in portalUser) {
            portalUserId = portalUser.id;
          } else {
            seedResult.errors.push(`Portal account: ${portalUser.error}`);
          }
        }

        // If seeded, mark onboarding complete so the admin lands on the dashboard.
        await db.from("profiles").update({ onboarding_completed: true }).eq("id", admin.id);
      }

      return new Response(JSON.stringify({
        ok: true,
        studioId,
        vertical,
        seeded: seed,
        admin: { email: adminEmail, password: TEST_PASSWORD },
        portal: seed ? seedResult?.portal ?? null : null,
        portalUserId,
        results: seedResult?.results ?? [],
        errors: seedResult?.errors ?? [],
        counts: seedResult?.counts ?? {},
      }), { status: 200, headers: jsonCorsHeaders(req) });
    }

    if (action === "seed") {
      // Add sample data to an existing test studio.
      const studioId = String(body.studioId ?? "");
      if (!studioId) {
        return new Response(JSON.stringify({ error: "studioId required" }), {
          status: 400, headers: jsonCorsHeaders(req),
        });
      }
      const { data: studio, error: fErr } = await db.from("studios")
        .select("id, vertical, is_test").eq("id", studioId).maybeSingle();
      if (fErr || !studio) {
        return new Response(JSON.stringify({ error: "Studio not found" }), {
          status: 404, headers: jsonCorsHeaders(req),
        });
      }
      if (studio.is_test !== true) {
        return new Response(JSON.stringify({ error: "Refusing to seed a non-test studio" }), {
          status: 403, headers: jsonCorsHeaders(req),
        });
      }
      const seedResult = await seedStudioData(db, studioId, (studio.vertical ?? "dance") as Vertical);
      let portalUserId: string | null = null;
      if (seedResult.portal) {
        const portalUser = await createAuthUser(db, seedResult.portal.email, seedResult.portal.participants[0] ?? "Sandbox Member", seedResult.portal.role, studioId);
        if ("id" in portalUser) portalUserId = portalUser.id;
        else seedResult.errors.push(`Portal account: ${portalUser.error}`);
      }
      return new Response(JSON.stringify({
        ok: seedResult.errors.length === 0,
        studioId,
        portal: seedResult.portal,
        portalUserId,
        results: seedResult.results,
        errors: seedResult.errors,
        counts: seedResult.counts,
      }), { status: 200, headers: jsonCorsHeaders(req) });
    }

    if (action === "delete") {
      const studioId = String(body.studioId ?? "");
      if (!studioId) {
        return new Response(JSON.stringify({ error: "studioId required" }), {
          status: 400, headers: jsonCorsHeaders(req),
        });
      }

      // 1. Verify the studio is a test studio before touching anything.
      const { data: studio, error: fErr } = await db.from("studios")
        .select("id, owner_id, is_test").eq("id", studioId).maybeSingle();
      if (fErr || !studio) {
        return new Response(JSON.stringify({ error: "Studio not found" }), {
          status: 404, headers: jsonCorsHeaders(req),
        });
      }
      if (studio.is_test !== true) {
        return new Response(JSON.stringify({ error: "Refusing to delete a non-test studio" }), {
          status: 403, headers: jsonCorsHeaders(req),
        });
      }

      // 2. Collect test profiles linked to this studio (admin + portal accounts)
      //    so we can remove their auth users after the studio is gone.
      const { data: testProfiles } = await db.from("profiles")
        .select("id").eq("studio_id", studioId).eq("is_test", true);
      const profileIds: string[] = (testProfiles ?? []).map((p: { id: string }) => p.id);
      if (studio.owner_id && !profileIds.includes(studio.owner_id)) profileIds.push(studio.owner_id);

      // 3. Delete the studio — cascades to all studio_id-scoped tables.
      const { error: dErr } = await db.from("studios").delete().eq("id", studioId).eq("is_test", true);
      if (dErr) {
        return new Response(JSON.stringify({ error: `Delete failed: ${dErr.message}` }), {
          status: 500, headers: jsonCorsHeaders(req),
        });
      }

      // 4. Remove the test auth users + their (now studio-less) profiles.
      let removedUsers = 0;
      for (const pid of profileIds) {
        await db.from("profiles").delete().eq("id", pid).eq("is_test", true).catch(() => {});
        const { error: uErr } = await db.auth.admin.deleteUser(pid);
        if (!uErr) removedUsers++;
      }

      return new Response(JSON.stringify({
        ok: true,
        studioId,
        removedUsers,
        message: "Test studio and all linked sandbox data deleted.",
      }), { status: 200, headers: jsonCorsHeaders(req) });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400, headers: jsonCorsHeaders(req),
    });
  } catch (err) {
    console.error("test-studio error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", detail: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: jsonCorsHeaders(req),
    });
  }
});
