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
  Vertical,
} from "./types";
import { SAFE_SECONDARY_DEFAULTS, type Address, type AddressSource } from "./types";

/* ── Vertical-aware demo data generators ────────────────────────── */

const VERTICAL_STUDIO_CONFIGS: Record<Vertical, { name: string; tagline: string; city: string; initials: string; brandColor: string }> = {
  dance: { name: "Aurora Dance Academy", tagline: "Where every dancer finds their light", city: "Portland, OR", initials: "AD", brandColor: "350 74% 60%" },
  yoga: { name: "Breath & Flow Yoga", tagline: "Find your practice, find yourself", city: "Portland, OR", initials: "BF", brandColor: "178 42% 42%" },
  crossfit: { name: "Northside CrossFit", tagline: "Forged by fire, built by community", city: "Portland, OR", initials: "NX", brandColor: "32 82% 48%" },
  gym: { name: "Iron Haven Fitness", tagline: "Your transformation starts here", city: "Portland, OR", initials: "IH", brandColor: "220 12% 40%" },
  martial_arts: { name: "Zen Mountain Dojo", tagline: "Discipline · Respect · Mastery", city: "Portland, OR", initials: "ZM", brandColor: "245 48% 48%" },
  music_school: { name: "Cascade Music Academy", tagline: "Where talent finds its voice", city: "Portland, OR", initials: "CM", brandColor: "350 74% 60%" },
};

export function getDemoStudio(vertical: Vertical): Studio {
  const cfg = VERTICAL_STUDIO_CONFIGS[vertical];
  return {
    id: `stu_${vertical}`,
    name: cfg.name,
    tagline: cfg.tagline,
    city: cfg.city,
    brandColor: cfg.brandColor,
    initials: cfg.initials,
    vertical,
    address: {
      line1: "1422 NW Irving St",
      city: "Portland",
      stateOrProvince: "OR",
      postalCode: "97209",
      country: "US",
    },
    settings: {
      preferredUnits: "imperial",
      measurementCollectionMode: "parent_size_only",
      regional: {
        country: "US",
        timezone: "America/Los_Angeles",
        currency: "USD",
        dateFormat: "MM/DD/YYYY",
        timeFormat: "12h",
        measurementSystem: "imperial",
      },
    },
  };
}

const VERTICAL_TEACHER_POOLS: Record<Vertical, Array<{ name: string; styles: ClassStyle[]; skills: Array<{ name: string; category: string }>; email: string; hourlyRateCents: number; payType: "employee" | "1099" }>> = {
  dance: [
    { name: "Mara Delgado", styles: ["Ballet", "Lyrical"], skills: [{ name: "Ballet", category: "Dance" }, { name: "Lyrical", category: "Dance" }, { name: "Pointe", category: "Dance" }], email: "mara@aurora.dance", hourlyRateCents: 4500, payType: "employee" },
    { name: "Theo Nakamura", styles: ["Hip Hop", "Jazz"], skills: [{ name: "Hip Hop", category: "Dance" }, { name: "Jazz", category: "Dance" }, { name: "Breaking", category: "Dance" }], email: "theo@aurora.dance", hourlyRateCents: 5000, payType: "1099" },
    { name: "Priya Anand", styles: ["Contemporary", "Lyrical"], skills: [{ name: "Contemporary", category: "Dance" }, { name: "Lyrical", category: "Dance" }], email: "priya@aurora.dance", hourlyRateCents: 4000, payType: "employee" },
    { name: "Jules Romano", styles: ["Tap", "Jazz"], skills: [{ name: "Tap", category: "Dance" }, { name: "Jazz", category: "Dance" }], email: "jules@aurora.dance", hourlyRateCents: 3500, payType: "1099" },
    { name: "Sasha Berg", styles: ["Acro", "Ballet"], skills: [{ name: "Acro", category: "Dance" }, { name: "Ballet", category: "Dance" }], email: "sasha@aurora.dance", hourlyRateCents: 5500, payType: "employee" },
  ],
  yoga: [
    { name: "Lena Oakes", styles: ["Vinyasa", "Power Yoga"], skills: [{ name: "Vinyasa", category: "Yoga" }, { name: "Power Yoga", category: "Yoga" }], email: "lena@breathflow.yoga", hourlyRateCents: 5500, payType: "1099" },
    { name: "Ravi Kapoor", styles: ["Hatha", "Restorative"], skills: [{ name: "Hatha", category: "Yoga" }, { name: "Restorative", category: "Yoga" }], email: "ravi@breathflow.yoga", hourlyRateCents: 5000, payType: "1099" },
    { name: "Maya Chen", styles: ["Yin", "Vinyasa"], skills: [{ name: "Yin", category: "Yoga" }, { name: "Vinyasa", category: "Yoga" }], email: "maya@breathflow.yoga", hourlyRateCents: 4800, payType: "employee" },
    { name: "Sam Rivers", styles: ["Power Yoga", "Hatha"], skills: [{ name: "Power Yoga", category: "Yoga" }, { name: "Hatha", category: "Yoga" }], email: "sam@breathflow.yoga", hourlyRateCents: 4500, payType: "employee" },
  ],
  crossfit: [
    { name: "Dom Reyes", styles: ["Strength", "Olympic Lifting"], skills: [{ name: "Strength", category: "CrossFit" }, { name: "Olympic Lifting", category: "CrossFit" }], email: "dom@northside.fit", hourlyRateCents: 6000, payType: "employee" },
    { name: "Jess Park", styles: ["Conditioning", "Gymnastics"], skills: [{ name: "Conditioning", category: "CrossFit" }, { name: "Gymnastics", category: "CrossFit" }], email: "jess@northside.fit", hourlyRateCents: 5500, payType: "employee" },
    { name: "Troy Mitchell", styles: ["Mobility", "Strength"], skills: [{ name: "Mobility", category: "CrossFit" }, { name: "Strength", category: "CrossFit" }], email: "troy@northside.fit", hourlyRateCents: 5000, payType: "1099" },
  ],
  gym: [
    { name: "Marcus Stone", styles: ["Strength", "Conditioning"], skills: [{ name: "Strength", category: "Gym" }, { name: "Conditioning", category: "Gym" }], email: "marcus@ironhaven.fit", hourlyRateCents: 5000, payType: "employee" },
    { name: "Tanya Ross", styles: ["Mobility", "Gymnastics"], skills: [{ name: "Mobility", category: "Gym" }, { name: "Gymnastics", category: "Gym" }], email: "tanya@ironhaven.fit", hourlyRateCents: 4500, payType: "1099" },
    { name: "Chris Park", styles: ["Olympic Lifting", "Strength"], skills: [{ name: "Olympic Lifting", category: "Gym" }, { name: "Strength", category: "Gym" }], email: "chris@ironhaven.fit", hourlyRateCents: 5500, payType: "employee" },
  ],
  martial_arts: [
    { name: "Sensei Tanaka", styles: ["Advanced", "Sparring"], skills: [{ name: "Advanced", category: "Martial Arts" }, { name: "Sparring", category: "Martial Arts" }], email: "tanaka@zenmountain.do", hourlyRateCents: 6000, payType: "employee" },
    { name: "Kenji Mori", styles: ["Intermediate", "Grading Prep"], skills: [{ name: "Intermediate", category: "Martial Arts" }, { name: "Grading Prep", category: "Martial Arts" }], email: "kenji@zenmountain.do", hourlyRateCents: 4800, payType: "1099" },
    { name: "Aiko Saito", styles: ["Beginner", "Intermediate"], skills: [{ name: "Beginner", category: "Martial Arts" }, { name: "Intermediate", category: "Martial Arts" }], email: "aiko@zenmountain.do", hourlyRateCents: 4200, payType: "employee" },
  ],
  music_school: [
    { name: "Claire Beaumont", styles: ["Piano", "Voice"], skills: [{ name: "Piano", category: "Music" }, { name: "Voice", category: "Music" }], email: "claire@cascade.music", hourlyRateCents: 6500, payType: "employee" },
    { name: "Diego Fuentes", styles: ["Guitar", "Drums"], skills: [{ name: "Guitar", category: "Music" }, { name: "Drums", category: "Music" }], email: "diego@cascade.music", hourlyRateCents: 5500, payType: "1099" },
    { name: "Yuki Tanaka", styles: ["Violin", "Piano"], skills: [{ name: "Violin", category: "Music" }, { name: "Piano", category: "Music" }], email: "yuki@cascade.music", hourlyRateCents: 6000, payType: "employee" },
    { name: "Omar Brooks", styles: ["Voice", "Guitar"], skills: [{ name: "Voice", category: "Music" }, { name: "Guitar", category: "Music" }], email: "omar@cascade.music", hourlyRateCents: 5000, payType: "1099" },
  ],
};

const VERTICAL_CLASS_TEMPLATES: Record<Vertical, Array<{ name: string; style: ClassStyle; ageGroup: AgeGroup; day: WeekDay; startTime: string; durationMins: number; room: string; capacity: number; priceCents: number; inRecital: boolean }>> = {
  dance: [
    { name: "Tiny Tots Ballet", style: "Ballet", ageGroup: "Tiny Tots", day: "Mon", startTime: "16:00", durationMins: 45, room: "Studio A", capacity: 12, priceCents: 8500, inRecital: true },
    { name: "Junior Hip Hop", style: "Hip Hop", ageGroup: "Junior", day: "Mon", startTime: "17:00", durationMins: 60, room: "Studio B", capacity: 18, priceCents: 9500, inRecital: true },
    { name: "Senior Contemporary", style: "Contemporary", ageGroup: "Senior", day: "Tue", startTime: "18:30", durationMins: 75, room: "Studio A", capacity: 16, priceCents: 11000, inRecital: true },
    { name: "Intermediate Jazz", style: "Jazz", ageGroup: "Intermediate", day: "Tue", startTime: "17:00", durationMins: 60, room: "Studio B", capacity: 16, priceCents: 9500, inRecital: true },
    { name: "Adult Tap Social", style: "Tap", ageGroup: "Adult", day: "Wed", startTime: "19:30", durationMins: 60, room: "Studio C", capacity: 20, priceCents: 7500, inRecital: false },
    { name: "Junior Lyrical", style: "Lyrical", ageGroup: "Junior", day: "Wed", startTime: "16:30", durationMins: 60, room: "Studio A", capacity: 16, priceCents: 9500, inRecital: true },
    { name: "Senior Hip Hop Crew", style: "Hip Hop", ageGroup: "Senior", day: "Thu", startTime: "18:00", durationMins: 90, room: "Studio B", capacity: 20, priceCents: 12500, inRecital: true },
    { name: "Acro Foundations", style: "Acro", ageGroup: "Intermediate", day: "Thu", startTime: "16:30", durationMins: 60, room: "Studio C", capacity: 12, priceCents: 10000, inRecital: false },
    { name: "Pre-Pro Ballet", style: "Ballet", ageGroup: "Senior", day: "Fri", startTime: "17:30", durationMins: 90, room: "Studio A", capacity: 14, priceCents: 14000, inRecital: true },
    { name: "Saturday Combo Jr.", style: "Jazz", ageGroup: "Junior", day: "Sat", startTime: "10:00", durationMins: 75, room: "Studio B", capacity: 18, priceCents: 10500, inRecital: true },
  ],
  yoga: [
    { name: "Morning Vinyasa Flow", style: "Vinyasa", ageGroup: "Adult", day: "Mon", startTime: "07:00", durationMins: 60, room: "Main Studio", capacity: 24, priceCents: 1800, inRecital: false },
    { name: "Gentle Hatha", style: "Hatha", ageGroup: "All Levels", day: "Mon", startTime: "09:30", durationMins: 75, room: "Main Studio", capacity: 20, priceCents: 2000, inRecital: false },
    { name: "Power Hour", style: "Power Yoga", ageGroup: "Adult", day: "Tue", startTime: "06:30", durationMins: 60, room: "Main Studio", capacity: 28, priceCents: 1800, inRecital: false },
    { name: "Yin & Meditation", style: "Yin", ageGroup: "All Levels", day: "Tue", startTime: "19:00", durationMins: 90, room: "Small Studio", capacity: 16, priceCents: 2200, inRecital: false },
    { name: "Restorative Yoga", style: "Restorative", ageGroup: "Adult", day: "Wed", startTime: "18:00", durationMins: 75, room: "Main Studio", capacity: 20, priceCents: 2000, inRecital: false },
    { name: "Lunchtime Vinyasa", style: "Vinyasa", ageGroup: "Adult", day: "Thu", startTime: "12:00", durationMins: 45, room: "Main Studio", capacity: 24, priceCents: 1500, inRecital: false },
    { name: "Weekend Warrior Flow", style: "Power Yoga", ageGroup: "Adult", day: "Sat", startTime: "09:00", durationMins: 90, room: "Main Studio", capacity: 28, priceCents: 2500, inRecital: false },
  ],
  crossfit: [
    { name: "Dawn Patrol WOD", style: "Conditioning", ageGroup: "Adult", day: "Mon", startTime: "06:00", durationMins: 60, room: "Box", capacity: 20, priceCents: 22000, inRecital: false },
    { name: "Strength & Conditioning", style: "Strength", ageGroup: "Adult", day: "Mon", startTime: "07:30", durationMins: 60, room: "Box", capacity: 18, priceCents: 22000, inRecital: false },
    { name: "Olympic Lifting Clinic", style: "Olympic Lifting", ageGroup: "Intermediate", day: "Tue", startTime: "17:30", durationMins: 90, room: "Box", capacity: 12, priceCents: 18000, inRecital: false },
    { name: "Gymnastics Skills", style: "Gymnastics", ageGroup: "All Levels", day: "Wed", startTime: "18:00", durationMins: 60, room: "Box", capacity: 16, priceCents: 15000, inRecital: false },
    { name: "Mobility & Recovery", style: "Mobility", ageGroup: "All Levels", day: "Thu", startTime: "07:00", durationMins: 45, room: "Box", capacity: 22, priceCents: 12000, inRecital: false },
    { name: "Hero WOD Saturday", style: "Conditioning", ageGroup: "Adult", day: "Sat", startTime: "09:00", durationMins: 75, room: "Box", capacity: 24, priceCents: 16000, inRecital: false },
  ],
  gym: [
    { name: "Early Bird Strength", style: "Strength", ageGroup: "Adult", day: "Mon", startTime: "06:30", durationMins: 60, room: "Weight Room", capacity: 20, priceCents: 12000, inRecital: false },
    { name: "HIIT Conditioning", style: "Conditioning", ageGroup: "Adult", day: "Mon", startTime: "09:00", durationMins: 45, room: "Cardio Floor", capacity: 24, priceCents: 10000, inRecital: false },
    { name: "Olympic Lifting 101", style: "Olympic Lifting", ageGroup: "Intermediate", day: "Tue", startTime: "17:30", durationMins: 60, room: "Weight Room", capacity: 14, priceCents: 14000, inRecital: false },
    { name: "Bodyweight Mastery", style: "Gymnastics", ageGroup: "All Levels", day: "Wed", startTime: "18:30", durationMins: 45, room: "Studio", capacity: 18, priceCents: 9000, inRecital: false },
    { name: "Stretch & Recover", style: "Mobility", ageGroup: "All Levels", day: "Fri", startTime: "08:00", durationMins: 45, room: "Studio", capacity: 22, priceCents: 8000, inRecital: false },
    { name: "Weekend Warrior", style: "Conditioning", ageGroup: "Adult", day: "Sat", startTime: "10:00", durationMins: 60, room: "Cardio Floor", capacity: 24, priceCents: 11000, inRecital: false },
  ],
  martial_arts: [
    { name: "Beginners' Foundation", style: "Beginner", ageGroup: "All Levels", day: "Mon", startTime: "17:00", durationMins: 60, room: "Dojo", capacity: 20, priceCents: 12000, inRecital: false },
    { name: "Intermediate Kata", style: "Intermediate", ageGroup: "Intermediate", day: "Tue", startTime: "18:00", durationMins: 75, room: "Dojo", capacity: 16, priceCents: 14000, inRecital: false },
    { name: "Advanced Sparring", style: "Sparring", ageGroup: "Senior", day: "Wed", startTime: "19:00", durationMins: 90, room: "Dojo", capacity: 14, priceCents: 16000, inRecital: false },
    { name: "Grading Preparation", style: "Grading Prep", ageGroup: "All Levels", day: "Thu", startTime: "17:30", durationMins: 60, room: "Dojo", capacity: 18, priceCents: 13000, inRecital: false },
    { name: "Junior Warriors", style: "Beginner", ageGroup: "Junior", day: "Sat", startTime: "10:00", durationMins: 45, room: "Dojo", capacity: 22, priceCents: 10000, inRecital: false },
  ],
  music_school: [
    { name: "Piano Beginners", style: "Piano", ageGroup: "Junior", day: "Mon", startTime: "15:30", durationMins: 30, room: "Room 1", capacity: 1, priceCents: 12000, inRecital: true },
    { name: "Intermediate Piano", style: "Piano", ageGroup: "Intermediate", day: "Mon", startTime: "17:00", durationMins: 45, room: "Room 1", capacity: 1, priceCents: 16000, inRecital: true },
    { name: "Guitar Group", style: "Guitar", ageGroup: "Junior", day: "Tue", startTime: "16:00", durationMins: 45, room: "Room 2", capacity: 6, priceCents: 10000, inRecital: true },
    { name: "Voice Studio", style: "Voice", ageGroup: "All Levels", day: "Tue", startTime: "17:00", durationMins: 45, room: "Room 3", capacity: 1, priceCents: 14000, inRecital: true },
    { name: "Violin Ensemble", style: "Violin", ageGroup: "Intermediate", day: "Wed", startTime: "16:00", durationMins: 60, room: "Room 2", capacity: 8, priceCents: 11000, inRecital: true },
    { name: "Drum Circle", style: "Drums", ageGroup: "All Levels", day: "Thu", startTime: "18:00", durationMins: 60, room: "Room 4", capacity: 10, priceCents: 9000, inRecital: false },
    { name: "Advanced Piano", style: "Piano", ageGroup: "Senior", day: "Fri", startTime: "16:00", durationMins: 60, room: "Room 1", capacity: 1, priceCents: 18000, inRecital: true },
    { name: "Saturday Music Makers", style: "Voice", ageGroup: "Tiny Tots", day: "Sat", startTime: "10:00", durationMins: 30, room: "Room 3", capacity: 10, priceCents: 8000, inRecital: false },
  ],
};

const VERTICAL_ANNOUNCEMENT_TEMPLATES: Record<Vertical, Array<{ title: string; body: string; scope: AnnouncementScope; audience: string; reach: number; daysAgoVal: number }>> = {
  dance: [
    { title: "Spring Recital rehearsal — May 25th", body: "All recital classes have a mandatory dress rehearsal at the Benson Theatre. Arrive 30 minutes early with full costume and hair done.", scope: "Recital", audience: "8 recital classes", reach: 121, daysAgoVal: 1 },
    { title: "Jazz Class cancelled tonight", body: "Due to a facilities issue, tonight's Intermediate Jazz is cancelled. A make-up class will be scheduled next week.", scope: "Emergency", audience: "Intermediate Jazz", reach: 14, daysAgoVal: 2 },
    { title: "Costumes due next week", body: "Final costume payments are due Friday. Please complete your balance in the parent portal to secure your dancer's costume.", scope: "Studio-wide", audience: "All families", reach: 42, daysAgoVal: 4 },
    { title: "New Acro Foundations spots open", body: "We've opened 4 additional spots in Acro Foundations on Thursdays. Enrol now through the portal.", scope: "Studio-wide", audience: "All families", reach: 42, daysAgoVal: 8 },
  ],
  yoga: [
    { title: "Summer Solstice Workshop — June 21", body: "Join us for a special 2-hour solstice practice with live music. Early bird pricing until June 10th.", scope: "Studio-wide", audience: "All members", reach: 85, daysAgoVal: 1 },
    { title: "New Yin & Meditation class added", body: "Due to popular demand, we've added a Wednesday evening Yin & Meditation class starting next week.", scope: "Studio-wide", audience: "All members", reach: 85, daysAgoVal: 3 },
    { title: "Class Pass update", body: "Reminder: unused class passes expire at the end of this month. Check your account for remaining credits.", scope: "Studio-wide", audience: "All members", reach: 85, daysAgoVal: 5 },
  ],
  crossfit: [
    { title: "Murph Challenge — Memorial Day", body: "Join us Monday for the annual Murph WOD. Heats start at 8am. Sign up on the whiteboard to reserve your spot.", scope: "Studio-wide", audience: "All athletes", reach: 64, daysAgoVal: 1 },
    { title: "Olympic Lifting Seminar", body: "Coach Dom is running a 2-day clean & jerk seminar this weekend. Limited to 12 athletes. $40 registration.", scope: "Studio-wide", audience: "All athletes", reach: 64, daysAgoVal: 3 },
    { title: "Benchmark testing week", body: "Next week is benchmark testing. We'll be retesting Fran, Grace, and Helen. Track your progress on the app.", scope: "Studio-wide", audience: "All athletes", reach: 64, daysAgoVal: 6 },
  ],
  gym: [
    { title: "Summer Body Challenge", body: "8-week transformation challenge starts Monday. $500 prize for the winner. Sign up at the front desk.", scope: "Studio-wide", audience: "All members", reach: 58, daysAgoVal: 2 },
    { title: "New HIIT class time", body: "We've added a 7am HIIT class on Tuesdays and Thursdays starting next week. Limited to 24 spots.", scope: "Studio-wide", audience: "All members", reach: 58, daysAgoVal: 4 },
  ],
  martial_arts: [
    { title: "Belt grading — June 15th", body: "Registration for the June belt grading is now open. All eligible students must have their grading form signed by a parent or guardian by June 10th.", scope: "Studio-wide", audience: "All students", reach: 42, daysAgoVal: 1 },
    { title: "Sparring safety equipment check", body: "All sparring students: please bring your protective gear to class this week for a mandatory equipment safety check.", scope: "Class", audience: "Sparring classes", reach: 18, daysAgoVal: 3 },
    { title: "Dojo spring cleaning", body: "We're organising a dojo clean-up day this Saturday. Volunteers welcome — pizza provided after!", scope: "Studio-wide", audience: "All students", reach: 42, daysAgoVal: 5 },
  ],
  music_school: [
    { title: "Spring Recital programme finalised", body: "The recital running order is now available in the parent portal. Please confirm your child's participation by Friday.", scope: "Recital", audience: "Recital participants", reach: 45, daysAgoVal: 1 },
    { title: "Instrument maintenance workshop", body: "Free workshop this Saturday: learn basic instrument care and tuning. All students welcome.", scope: "Studio-wide", audience: "All families", reach: 52, daysAgoVal: 3 },
    { title: "Practice room schedule update", body: "Practice rooms are now available for booking via the parent portal. Book up to 2 hours per week per student.", scope: "Studio-wide", audience: "All families", reach: 52, daysAgoVal: 5 },
  ],
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export function getDemoTeachers(vertical: Vertical): Teacher[] {
  const studio = getDemoStudio(vertical);
  const pool = VERTICAL_TEACHER_POOLS[vertical];
  return pool.map((t, i) => ({
    id: `t${i + 1}`,
    studioId: studio.id,
    name: t.name,
    styles: t.styles,
    skills: t.skills,
    email: t.email,
    phone: `+1 503 555 0${100 + i * 10}`,
    address: "1422 NW Irving St, Portland, OR 97209",
    status: "active" as const,
    hireDate: `${2020 + (i % 3)}-0${(i % 9) + 1}-15`,
    employeeId: `EMP-00${i + 1}`,
    certifications: [{ name: "First Aid / CPR", issuedAt: "2025-08-20", expiresAt: "2027-08-20" }],
    hourlyRateCents: t.hourlyRateCents,
    payType: t.payType,
  }));
}

export function getDemoClasses(vertical: Vertical): Class[] {
  const studio = getDemoStudio(vertical);
  const teachers = getDemoTeachers(vertical);
  const templates = VERTICAL_CLASS_TEMPLATES[vertical];
  return templates.map((t, i) => {
    const enrolled = Math.round(t.capacity * (0.5 + Math.random() * 0.45));
    const waitlist = enrolled >= t.capacity ? Math.ceil(Math.random() * 5) : 0;
    return {
      id: `c${i + 1}`,
      studioId: studio.id,
      name: t.name,
      style: t.style,
      ageGroup: t.ageGroup,
      day: t.day,
      startTime: t.startTime,
      durationMins: t.durationMins,
      room: t.room,
      teacherId: teachers[i % teachers.length].id,
      capacity: t.capacity,
      enrolled,
      waitlist,
      inRecital: t.inRecital,
      priceCents: t.priceCents,
    };
  });
}

export function getDemoAnnouncements(vertical: Vertical): Announcement[] {
  const studio = getDemoStudio(vertical);
  const templates = VERTICAL_ANNOUNCEMENT_TEMPLATES[vertical];
  return templates.map((t, i) => ({
    id: `a${i + 1}`,
    studioId: studio.id,
    title: t.title,
    body: t.body,
    scope: t.scope,
    sentAt: daysAgo(t.daysAgoVal),
    audience: t.audience,
    reach: t.reach,
  }));
}

export function getDemoRecitalEvents(vertical: Vertical): RecitalEvent[] {
  const studio = getDemoStudio(vertical);
  const eventLabel = vertical === "dance" ? "Spring Showcase 2026" : vertical === "music_school" ? "Spring Recital 2026" : "";
  const venue = vertical === "dance" ? "Benson Theatre" : vertical === "music_school" ? "Cascade Concert Hall" : "";
  if (vertical !== "dance" && vertical !== "music_school") return [];
  const classes = getDemoClasses(vertical).filter((c) => c.inRecital);
  const performances = classes.map((c, i) => ({
    id: `p${i + 1}`,
    studioId: studio.id,
    name: `Act ${i + 1} — ${c.name}`,
    classIds: [c.id],
    order: i + 1,
    startTime: `${19 + Math.floor(i / 2)}:${i % 2 === 0 ? "00" : "30"}`,
    costumeNote: vertical === "dance" ? (i % 2 === 0 ? "Pink tutus and ballet slippers" : "Neon accents and white sneakers") : undefined,
  }));
  return [{
    id: "r1",
    studioId: studio.id,
    name: eventLabel,
    date: "2026-06-15T19:00:00Z",
    venue,
    costumeDeadline: vertical === "dance" ? "2026-05-30T00:00:00Z" : undefined,
    performances,
  }];
}

// ── Backward-compatible static exports (dance default) ────────────

export const studio: Studio = {
  id: "stu_aurora",
  name: "Aurora Dance Academy",
  tagline: "Where every dancer finds their light",
  city: "Portland, OR",
  brandColor: "350 74% 60%",
  initials: "AD",
  vertical: "dance",
  address: {
    line1: "1422 NW Irving St",
    city: "Portland",
    stateOrProvince: "OR",
    postalCode: "97209",
    country: "US",
  },
  settings: {
    preferredUnits: "imperial",
    measurementCollectionMode: "parent_size_only",
    regional: {
      country: "US",
      timezone: "America/Los_Angeles",
      currency: "USD",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      measurementSystem: "imperial",
    },
  },
};

export const teachers: Teacher[] = [
  { id: "t1", studioId: studio.id, name: "Mara Delgado", preferredName: "Mara", styles: ["Ballet", "Lyrical"], skills: [{ name: "Ballet", category: "Dance" }, { name: "Lyrical", category: "Dance" }, { name: "Pointe", category: "Dance" }], email: "mara@aurora.dance", phone: "+1 503 555 0101", address: "1422 NW Irving St, Portland, OR 97209", emergencyContact: { name: "Carlos Delgado", relationship: "Spouse", phone: "+1 503 555 0102" }, status: "active" as const, hireDate: "2020-08-15", employeeId: "EMP-001", certifications: [{ name: "Dance Teacher Certification", issuedAt: "2024-06-01", expiresAt: "2027-06-01" }, { name: "First Aid / CPR", issuedAt: "2025-09-15", expiresAt: "2027-09-15" }, { name: "Safe Sport", issuedAt: "2025-01-10", expiresAt: "2026-01-10" }], hourlyRateCents: 4500, payType: "employee" },
  { id: "t2", studioId: studio.id, name: "Theo Nakamura", styles: ["Hip Hop", "Jazz"], skills: [{ name: "Hip Hop", category: "Dance" }, { name: "Jazz", category: "Dance" }, { name: "Breaking", category: "Dance" }], email: "theo@aurora.dance", phone: "+1 503 555 0201", address: "825 NW 23rd Ave, Portland, OR 97210", emergencyContact: { name: "Yuki Nakamura", relationship: "Partner", phone: "+1 503 555 0202" }, status: "active" as const, hireDate: "2021-03-01", employeeId: "EMP-002", certifications: [{ name: "First Aid / CPR", issuedAt: "2025-08-20", expiresAt: "2027-08-20" }], hourlyRateCents: 5000, payType: "1099" },
  { id: "t3", studioId: studio.id, name: "Priya Anand", styles: ["Contemporary", "Lyrical"], skills: [{ name: "Contemporary", category: "Dance" }, { name: "Lyrical", category: "Dance" }, { name: "Improvisation", category: "Dance" }], email: "priya@aurora.dance", phone: "+1 503 555 0301", address: "310 NE Multnomah St, Portland, OR 97232", status: "active" as const, hireDate: "2022-09-01", employeeId: "EMP-003", certifications: [{ name: "Dance Teacher Certification", issuedAt: "2024-11-01", expiresAt: "2027-11-01" }, { name: "Police Check", issuedAt: "2025-06-01", expiresAt: "2026-06-01" }], hourlyRateCents: 4000, payType: "employee" },
  { id: "t4", studioId: studio.id, name: "Jules Romano", preferredName: "Jules", styles: ["Tap", "Jazz"], skills: [{ name: "Tap", category: "Dance" }, { name: "Jazz", category: "Dance" }, { name: "Musical Theatre", category: "Dance" }], email: "jules@aurora.dance", phone: "+1 503 555 0401", address: "55 SW Yamhill St, Portland, OR 97204", emergencyContact: { name: "Marie Romano", relationship: "Mother", phone: "+1 503 555 0402" }, status: "on_leave" as const, hireDate: "2023-01-15", employeeId: "EMP-004", certifications: [{ name: "First Aid / CPR", issuedAt: "2024-12-01", expiresAt: "2026-12-01" }], hourlyRateCents: 3500, payType: "1099" },
  { id: "t5", studioId: studio.id, name: "Sasha Berg", styles: ["Acro", "Ballet"], skills: [{ name: "Acro", category: "Dance" }, { name: "Ballet", category: "Dance" }, { name: "Pointe", category: "Dance" }, { name: "Partnering", category: "Dance" }], email: "sasha@aurora.dance", phone: "+1 503 555 0501", address: "721 NW 9th Ave, Portland, OR 97209", emergencyContact: { name: "David Berg", relationship: "Spouse", phone: "+1 503 555 0502" }, status: "active" as const, hireDate: "2019-06-01", employeeId: "EMP-005", certifications: [{ name: "Dance Teacher Certification", issuedAt: "2025-02-01", expiresAt: "2028-02-01" }, { name: "First Aid / CPR", issuedAt: "2025-10-01", expiresAt: "2027-10-01" }, { name: "Safe Sport", issuedAt: "2025-03-15", expiresAt: "2026-03-15" }, { name: "Police Check", issuedAt: "2025-05-01", expiresAt: "2026-05-01" }], hourlyRateCents: 5500, payType: "employee" },
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

function makeContact(first: string, last: string, email: string, phone: string, address: string, relationship: string, billing: boolean, emergency: boolean, household?: string, addressSource?: AddressSource): FamilyContact {
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
    addressSource,
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
    addressSource: role === "primary_caregiver" ? "household" : (overrides?.addressSource as AddressSource | undefined),
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
  addressSource: "separate" as AddressSource,
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
  addressSource: "separate" as AddressSource,
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

// ── Structured household addresses ────────────────────────────
const addrWalsh: Address = { line1: "1428 NW Lovejoy St", city: "Portland", stateOrProvince: "OR", postalCode: "97209", country: "US" };
const addrCarter: Address = { line1: "3821 SE Hawthorne Blvd", city: "Portland", stateOrProvince: "OR", postalCode: "97214", country: "US" };
const addrPatel: Address = { line1: "720 SW Broadway Dr", city: "Portland", stateOrProvince: "OR", postalCode: "97205", country: "US" };
const addrGreg: Address = { line1: "4510 NE Alberta Ct", city: "Portland", stateOrProvince: "OR", postalCode: "97211", country: "US" };

export const parentAccounts: ParentAccount[] = [
  {
    id: "p1",
    studioId: studio.id,
    primaryContact: makeContact("Diane", "Walsh", "diane.walsh@email.com", "(555) 123-4567", "1428 NW Lovejoy St", "Parent", true, true, "Diane's house", "household"),
    primaryCaregiver: makeCaregiver("cg_primary_p1", "Diane", "Walsh", "diane.walsh@email.com", "(555) 123-4567", "1428 NW Lovejoy St", "Parent", "primary_caregiver", { household_label: "Diane's house", addressSource: "household" }),
    // Multi-household: Diane is separated; Greg (ex) and his partner Lena are also caregivers
    secondaryContact: makeContact("Greg", "Walsh", "greg.walsh@email.com", "(555) 111-2233", "4510 NE Alberta Ct", "Father", false, true, "Greg's house", "separate"),
    secondaryCaregiver: gregCg,
    additionalCaregivers: [gregCg, lenaCg],
    caregiverAuditLog: [
      { id: "alog1", caregiverId: "cg_primary_p1", timestamp: new Date(Date.now() - 86400000 * 90).toISOString(), event: "caregiver_nominated", details: "Primary caregiver created at registration" },
      { id: "alog2", caregiverId: "cg_addl_greg", timestamp: new Date(Date.now() - 86400000 * 30).toISOString(), event: "caregiver_nominated", details: "Greg Walsh nominated as additional caregiver — separate household" },
      { id: "alog3", caregiverId: "cg_addl_lena", timestamp: new Date(Date.now() - 86400000 * 15).toISOString(), event: "caregiver_nominated", details: "Lena Walsh nominated as additional caregiver — Greg & Lena's household" },
    ],
    childIds: ["s1", "s5"],
    householdAddress: addrWalsh,
    addressUpdatedAt: new Date(Date.now() - 86400000 * 90).toISOString(),
    addressUpdatedBy: "cg_primary_p1",
  },
  {
    id: "p2",
    studioId: studio.id,
    primaryContact: makeContact("Marcus", "Carter", "marcus.carter@email.com", "(555) 234-5678", "3821 SE Hawthorne Blvd", "Parent", true, true, undefined, "household"),
    primaryCaregiver: makeCaregiver("cg_primary_p2", "Marcus", "Carter", "marcus.carter@email.com", "(555) 234-5678", "3821 SE Hawthorne Blvd", "Parent", "primary_caregiver", { addressSource: "household" }),
    additionalCaregivers: [],
    caregiverAuditLog: [
      { id: "alog4", caregiverId: "cg_primary_p2", timestamp: new Date(Date.now() - 86400000 * 120).toISOString(), event: "caregiver_nominated", details: "Primary caregiver created at registration" },
    ],
    childIds: ["s2"],
    householdAddress: addrCarter,
    addressUpdatedAt: new Date(Date.now() - 86400000 * 120).toISOString(),
    addressUpdatedBy: "cg_primary_p2",
  },
  {
    id: "p3",
    studioId: studio.id,
    primaryContact: makeContact("Anita", "Patel", "anita.patel@email.com", "(555) 345-6789", "720 SW Broadway Dr", "Guardian", true, true, undefined, "household"),
    secondaryContact: makeContact("Raj", "Patel", "raj.patel@email.com", "(555) 765-4321", "720 SW Broadway Dr", "Guardian", true, false, undefined, "household"),
    primaryCaregiver: makeCaregiver("cg_primary_p3", "Anita", "Patel", "anita.patel@email.com", "(555) 345-6789", "720 SW Broadway Dr", "Guardian", "primary_caregiver", { addressSource: "household" }),
    secondaryCaregiver: rajCg,
    additionalCaregivers: [rajCg],
    caregiverAuditLog: [
      { id: "alog5", caregiverId: "cg_primary_p3", timestamp: new Date(Date.now() - 86400000 * 80).toISOString(), event: "caregiver_nominated", details: "Primary caregiver created at registration" },
      { id: "alog6", caregiverId: "cg_secondary_p3", timestamp: new Date(Date.now() - 86400000 * 40).toISOString(), event: "caregiver_nominated", details: "Raj Patel nominated as secondary caregiver" },
      { id: "alog7", caregiverId: "cg_secondary_p3", timestamp: new Date(Date.now() - 86400000 * 35).toISOString(), event: "billing_access_changed", details: "Billing and invoice payment enabled for Raj Patel" },
    ],
    childIds: ["s3"],
    householdAddress: addrPatel,
    addressUpdatedAt: new Date(Date.now() - 86400000 * 80).toISOString(),
    addressUpdatedBy: "cg_primary_p3",
  },
];

const allergyOptions = [undefined, undefined, undefined, "Peanuts", "Dairy", "Gluten", "Bee stings", "Latex"];

export const students: Student[] = Array.from({ length: 42 }).map((_, i) => {
  const firstName = pick(firstNames, i);
  const lastName = pick(lastNames, i * 3 + 1);
  const name = `${firstName} ${lastName}`;
  const caregiverName = `${pick(parentFirst, i * 2)} ${pick(lastNames, i * 3 + 1)}`;
  const caregiverId = parentAccounts[i % parentAccounts.length].id;
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
    caregiverId,
    caregiverName,
    caregiverEmail: `${parentFirst[i % parentFirst.length].toLowerCase()}.${(parentLast[i % parentLast.length] || "parent").toLowerCase()}@email.com`,
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
    caregiverName: s.caregiverName,
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
        caregiverId: `cg_primary_${s.caregiverId}`,
        signerName: s.caregiverName,
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
  { id: "sm_s1", studioId: studio.id, studentId: "s1", clothingSize: "Child Medium", leotardSize: "Child Medium", heightCm: 132.5, weightKg: 28.0, chestCm: 64.0, waistCm: 56.0, hipsCm: 68.0, girthCm: 118.0, inseamCm: 58.0, shoeSize: "1", source: "studio", status: "approved", measuredAt: daysAgo(30), measuredBy: "Mara Delgado", createdAt: daysAgo(30) },
  { id: "sm_s2", studioId: studio.id, studentId: "s2", clothingSize: "Child Large", leotardSize: "Child Large", heightCm: 145.0, weightKg: 35.0, chestCm: 72.0, waistCm: 62.0, hipsCm: 76.0, girthCm: 132.0, inseamCm: 64.0, shoeSize: "3", source: "studio", status: "approved", measuredAt: daysAgo(25), measuredBy: "Theo Nakamura", createdAt: daysAgo(25) },
  { id: "sm_s3", studioId: studio.id, studentId: "s3", clothingSize: "Child Small", shoeSize: "13", source: "parent", status: "size_provided", submittedBy: "cg_primary_p3", createdAt: daysAgo(3) },
  { id: "sm_s5", studioId: studio.id, studentId: "s5", clothingSize: "Adult Small", leotardSize: "Adult Small", heightCm: 160.0, weightKg: 48.0, chestCm: 82.0, waistCm: 68.0, hipsCm: 88.0, girthCm: 148.0, inseamCm: 72.0, shoeSize: "6", source: "hybrid", status: "approved", measuredAt: daysAgo(20), measuredBy: "Sasha Berg", createdAt: daysAgo(20) },
  { id: "sm_s7", studioId: studio.id, studentId: "s7", clothingSize: "Child Medium", shoeSize: "2", heightCm: 140.0, source: "parent", status: "parent_submitted", submittedBy: "cg_primary_p1", createdAt: daysAgo(1) },
  { id: "sm_s10", studioId: studio.id, studentId: "s10", clothingSize: "Child Large", heightCm: 155.0, weightKg: 42.0, chestCm: 78.0, waistCm: 65.0, hipsCm: 84.0, girthCm: 140.0, inseamCm: 68.0, shoeSize: "5", source: "studio", status: "approved", measuredAt: daysAgo(15), measuredBy: "Priya Anand", createdAt: daysAgo(15) },
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
