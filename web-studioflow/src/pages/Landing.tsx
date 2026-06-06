import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CreditCard,
  FileText,
  Megaphone,
  Sparkles,
  Users,
  Check,
  Clock,
  ShieldCheck,
  Music,
  Dumbbell,
  Heart,
  Swords,
  Shirt,
  GraduationCap,
  Upload,
  GitBranch,
  SearchCheck,
  Rocket,
  BarChart3,
  Menu,
  X,
  UserPlus,
  Bell,
  Palette,
} from "lucide-react";

import { useStudio } from "@/data/store";

/* ── Business types for the selector ───────────────────────────── */

type BusinessType = "dance" | "fitness" | "music" | "martial_arts" | "yoga";

interface BusinessProfile {
  id: BusinessType;
  label: string;
  icon: typeof Sparkles;
  headline: string;
  features: string[];
  mockupTitle: string;
  mockupBody: string;
  mockupStats: { k: string; v: string; icon: typeof Sparkles }[];
}

const businessProfiles: BusinessProfile[] = [
  {
    id: "dance",
    label: "Dance Studio",
    icon: Music,
    headline: "Class scheduling, costumes, recitals, parent portal, waivers.",
    features: ["Recital running orders", "Costume tracking & sizing", "Parent communication", "Digital waivers", "Class & teacher scheduling"],
    mockupTitle: "Recital season, simplified",
    mockupBody: "Auto-generated running orders, costume assignments, and parent notifications — all connected.",
    mockupStats: [
      { k: "Recital Prep", v: "100%", icon: Sparkles },
      { k: "Costumes", v: "Tracked", icon: Shirt },
      { k: "Parents", v: "Connected", icon: Users },
    ],
  },
  {
    id: "fitness",
    label: "Fitness Studio",
    icon: Dumbbell,
    headline: "Memberships, class packs, attendance, instructor pay, announcements.",
    features: ["Membership & pass management", "Attendance tracking", "Instructor scheduling", "Member communication", "Billing & invoices"],
    mockupTitle: "Run your gym from one dashboard",
    mockupBody: "Track attendance, manage memberships, pay instructors, and keep members engaged — all in one place.",
    mockupStats: [
      { k: "Attendance", v: "Real-time", icon: BarChart3 },
      { k: "Members", v: "Unlimited", icon: Users },
      { k: "Instructors", v: "Scheduled", icon: CalendarDays },
    ],
  },
  {
    id: "music",
    label: "Music School",
    icon: Music,
    headline: "Private lessons, teacher schedules, student notes, billing, parent communication.",
    features: ["Private lesson scheduling", "Student progress notes", "Teacher timetables", "Billing & invoices", "Recital planning"],
    mockupTitle: "Harmony in operations",
    mockupBody: "Schedule one-on-one lessons, track student progress, handle billing, and communicate with families effortlessly.",
    mockupStats: [
      { k: "Lessons", v: "Scheduled", icon: CalendarDays },
      { k: "Students", v: "Tracked", icon: GraduationCap },
      { k: "Billing", v: "Automated", icon: CreditCard },
    ],
  },
  {
    id: "martial_arts",
    label: "Martial Arts",
    icon: Swords,
    headline: "Belt levels, attendance, memberships, grading events, waivers.",
    features: ["Belt & rank tracking", "Grading event management", "Attendance records", "Membership billing", "Digital waivers"],
    mockupTitle: "From white belt to black belt",
    mockupBody: "Track every student's journey, manage belt promotions, schedule gradings, and handle memberships seamlessly.",
    mockupStats: [
      { k: "Students", v: "Ranked", icon: Swords },
      { k: "Gradings", v: "Scheduled", icon: CalendarDays },
      { k: "Waivers", v: "Signed", icon: FileText },
    ],
  },
  {
    id: "yoga",
    label: "Yoga / Pilates",
    icon: Heart,
    headline: "Class bookings, waitlists, instructor schedules, passes, waivers.",
    features: ["Class booking & waitlists", "Pass & membership tracking", "Teacher schedules", "Student communication", "Digital waivers"],
    mockupTitle: "Flow state for your studio",
    mockupBody: "Manage class bookings, track passes, schedule teachers, and keep your community connected — all from one calm place.",
    mockupStats: [
      { k: "Bookings", v: "Live", icon: CalendarDays },
      { k: "Waitlist", v: "Auto", icon: Clock },
      { k: "Passes", v: "Tracked", icon: CreditCard },
    ],
  },
];

/* ── Features data ──────────────────────────────────────────────── */

const allFeatures = [
  { icon: CalendarDays, title: "Class & schedule management", body: "Build recurring schedules, set capacities, manage waitlists, and assign teachers in seconds." },
  { icon: Users, title: "Students, families & caregiver permissions", body: "Multiple caregivers per family, granular permissions, pickup authorization, and emergency contacts." },
  { icon: CreditCard, title: "Billing & Stripe payments", body: "Track tuition, send invoices, collect payments online with Stripe, and manage class fees." },
  { icon: FileText, title: "Digital waivers", body: "Liability, media, and medical forms signed online with timestamps and signature records." },
  { icon: Megaphone, title: "Announcements & communication", body: "Studio-wide, per-class, or emergency messages with delivery rules respecting caregiver permissions." },
  { icon: Sparkles, title: "Events, recitals & workshops", body: "Plan recitals, competitions, workshops, and performances with running orders and rosters." },
  { icon: BarChart3, title: "Attendance & waitlists", body: "Track attendance in real time, manage waitlists automatically, and spot participation trends." },
  { icon: UserPlus, title: "Instructor management & pay", body: "Schedule teachers, track hours, manage payroll estimates, and handle substitute coverage." },
  { icon: Upload, title: "Migration assistant", body: "Import students, classes, and instructors from spreadsheets or existing platforms with smart field mapping." },
];

/* ── Migration steps ────────────────────────────────────────────── */

const migrationSteps = [
  { n: "01", title: "Upload your file", body: "Drag and drop a CSV or Excel export from your current system." },
  { n: "02", title: "Map your fields", body: "Our AI copilot matches your columns to StudioFlow fields automatically." },
  { n: "03", title: "Validate your data", body: "Review duplicates, missing fields, and formatting issues before import." },
  { n: "04", title: "Launch your studio", body: "Confirm and import — your classes, students, and staff are ready." },
];

const migrationChecklist = [
  "CSV / Excel import",
  "Smart field mapping",
  "Duplicate detection",
  "Parent/caregiver linking",
  "Class & enrolment preview",
];

/* ── Pricing ────────────────────────────────────────────────────── */

const plans = [
  {
    name: "Startup",
    price: "$29",
    period: "/month",
    description: "For small studios and startups",
    features: [
      "Up to 150 students",
      "Class scheduling",
      "Student/family management",
      "Parent/student portal",
      "Digital waivers",
      "Announcements",
      "Migration wizard",
    ],
    cta: "Start free trial",
    featured: false,
  },
  {
    name: "Growth",
    price: "$49",
    period: "/month",
    description: "For growing studios",
    features: [
      "Unlimited students",
      "Billing & invoices",
      "Events/recitals/workshops",
      "Instructor management",
      "Advanced permissions",
      "Priority support",
    ],
    cta: "Start free trial",
    featured: true,
  },
];

/* ── How it works steps ─────────────────────────────────────────── */

const howSteps = [
  {
    n: "1",
    title: "Create your studio",
    body: "Add branding, rooms, staff, and choose your business type.",
  },
  {
    n: "2",
    title: "Import or start fresh",
    body: "Use the migration wizard or add your first classes manually.",
  },
  {
    n: "3",
    title: "Open registration",
    body: "Share your public registration page and parent/student portal.",
  },
  {
    n: "4",
    title: "Run everything in one place",
    body: "Manage schedules, payments, waivers, attendance, and communication.",
  },
];

/* ── Main Component ─────────────────────────────────────────────── */

export default function Landing() {
  const { studio } = useStudio();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessType>("dance");
  const profile = businessProfiles.find((p) => p.id === selectedBusiness)!;

  /* ── Nav links ──────────────────────────────────────────────── */
  const navLinks = (
    <>
      <a href="#features" onClick={() => setMobileNavOpen(false)} className="transition-colors hover:text-foreground">Features</a>
      <a href="#how" onClick={() => setMobileNavOpen(false)} className="transition-colors hover:text-foreground">How it works</a>
      <a href="#migration" onClick={() => setMobileNavOpen(false)} className="transition-colors hover:text-foreground">Migration</a>
      <a href="#pricing" onClick={() => setMobileNavOpen(false)} className="transition-colors hover:text-foreground">Pricing</a>
    </>
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-foreground">
      {/* ════════════════════════════════════════════════════════════
          NAVIGATION
          ════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[#FAF8F5]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-5">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#1a1423] font-display text-base font-semibold text-white overflow-hidden">
              {studio.logoUrl ? (
                <img src={studio.logoUrl} alt={studio.name} className="h-full w-full object-cover" />
              ) : (
                studio.initials
              )}
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">StudioFlow</span>
          </Link>

          {/* Desktop nav */}
          <nav className="ml-12 hidden items-center gap-8 text-[15px] font-medium text-foreground/60 md:flex">
            {navLinks}
          </nav>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-3">
            <Link to="/parent" className="hidden text-[15px] font-medium text-foreground/60 transition-colors hover:text-foreground sm:inline-block">
              Parent Portal
            </Link>
            <Link to="/dashboard" className="hidden text-[15px] font-medium text-foreground/60 transition-colors hover:text-foreground sm:inline-block">
              Log in
            </Link>
            <Link
              to="/dashboard"
              className="hidden rounded-full bg-[#1a1423] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1a1423]/85 active:scale-[0.97] sm:inline-flex items-center gap-2"
            >
              Open dashboard
            </Link>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="ml-1 grid h-10 w-10 place-items-center rounded-xl text-foreground/60 transition-colors hover:text-foreground md:hidden"
              aria-label="Toggle menu"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav panel */}
        {mobileNavOpen && (
          <div className="border-t border-black/[0.06] bg-[#FAF8F5] px-5 pb-6 pt-4 md:hidden">
            <nav className="flex flex-col gap-4 text-[15px] font-medium text-foreground/60">
              {navLinks}
              <Link to="/parent" onClick={() => setMobileNavOpen(false)} className="transition-colors hover:text-foreground">Parent Portal</Link>
              <Link to="/dashboard" onClick={() => setMobileNavOpen(false)} className="transition-colors hover:text-foreground">Log in</Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileNavOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[#1a1423] px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
              >
                Open dashboard
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ════════════════════════════════════════════════════════════
          HERO
          ════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Ambient blurs */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-rose/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-64 h-[400px] w-[400px] rounded-full bg-[#7c6ba0]/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-[300px] w-[300px] rounded-full bg-gold/10 blur-3xl" />

        <div className="mx-auto max-w-7xl px-5 pb-20 pt-16 md:pt-24 lg:pt-32">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            {/* Left: copy */}
            <div className="animate-float-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/60 px-3.5 py-1.5 text-[13px] font-semibold text-foreground/60 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-rose" />
                The operating system for class-based studios
              </span>
              <h1 className="mt-6 font-display text-[2.75rem] font-semibold leading-[1.06] tracking-tight text-balance md:text-6xl">
                Run your studio from one calm dashboard.
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-foreground/55">
                Classes, students, billing, waivers, staff, events and communication — all in one simple operating system for modern studios.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center gap-2 rounded-full bg-rose px-6 py-3 text-[15px] font-semibold text-white shadow-lg shadow-rose/25 transition-all hover:bg-rose/90 active:scale-[0.97]"
                >
                  Start free trial
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-6 py-3 text-[15px] font-semibold text-foreground shadow-sm transition-all hover:bg-neutral-50 active:scale-[0.97]"
                >
                  View live demo
                </Link>
              </div>
              <p className="mt-6 text-sm text-foreground/40">
                Free 30-day trial. No card required.
              </p>
            </div>

            {/* Right: floating dashboard mockup panels */}
            <div className="animate-float-up relative hidden lg:block" style={{ animationDelay: "120ms" }}>
              {/* Main panel */}
              <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-lg">
                {/* Browser chrome */}
                <div className="mb-4 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose/40" />
                  <span className="h-2.5 w-2.5 rounded-full bg-gold/40" />
                  <span className="h-2.5 w-2.5 rounded-full bg-teal/40" />
                  <span className="ml-3 text-xs font-medium text-foreground/25">StudioFlow — Dashboard</span>
                </div>

                {/* Dashboard cards */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    { label: "Classes today", value: "8", icon: CalendarDays, color: "bg-rose/10 text-rose" },
                    { label: "Students", value: "247", icon: Users, color: "bg-teal/10 text-teal" },
                    { label: "Revenue", value: "$4.2k", icon: CreditCard, color: "bg-gold/10 text-gold" },
                    { label: "Waivers", value: "12 due", icon: FileText, color: "bg-plum/10 text-plum" },
                  ].map((card) => (
                    <div key={card.label} className="rounded-xl border border-black/[0.04] bg-[#F9F7F4] p-3">
                      <div className={`grid h-7 w-7 place-items-center rounded-lg ${card.color}`}>
                        <card.icon className="h-3.5 w-3.5" />
                      </div>
                      <p className="mt-2 font-display text-xl font-semibold tracking-tight">{card.value}</p>
                      <p className="text-[11px] font-medium text-foreground/35">{card.label}</p>
                    </div>
                  ))}
                </div>

                {/* Activity row */}
                <div className="rounded-xl border border-black/[0.04] bg-[#F9F7F4] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground/40">UPCOMING CLASSES</span>
                    <span className="text-[11px] font-medium text-rose">View all</span>
                  </div>
                  {["Beginner Ballet — 4:30 PM", "Jazz II — 5:45 PM", "Contemporary — 7:00 PM"].map((cls, i) => (
                    <div key={cls} className={`flex items-center justify-between py-2 ${i < 2 ? "border-b border-black/[0.04]" : ""}`}>
                      <span className="text-[13px] font-medium text-foreground/70">{cls}</span>
                      <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[11px] font-semibold text-teal">On</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating smaller panels */}
              <div className="absolute -bottom-6 -right-6 rounded-xl border border-black/[0.06] bg-white p-3 shadow-md w-44">
                <p className="text-[11px] font-semibold text-foreground/35 uppercase">Quick Actions</p>
                <div className="mt-2 space-y-1.5">
                  {["+ Add class", "+ Enrol student", "+ Send message"].map((a) => (
                    <div key={a} className="flex items-center gap-2 rounded-lg bg-[#F9F7F4] px-2.5 py-1.5 text-[12px] font-medium text-foreground/60 cursor-pointer hover:bg-rose/5 transition-colors">
                      <div className="h-1.5 w-1.5 rounded-full bg-rose/50" />
                      {a}
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute -left-8 top-1/3 rounded-xl border border-black/[0.06] bg-white p-3 shadow-md w-36">
                <p className="text-[11px] font-semibold text-foreground/35 uppercase">Attendance</p>
                <div className="mt-2 space-y-1">
                  {[85, 92, 78].map((pct, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-foreground/50 w-12">4:{3 + i}0 PM</span>
                      <div className="flex-1 h-1.5 rounded-full bg-black/[0.05] overflow-hidden">
                        <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] font-semibold text-foreground/35">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          BUSINESS TYPE SELECTOR
          ════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-5 pb-20">
        <div className="rounded-3xl border border-black/[0.05] bg-white/70 p-6 md:p-10 shadow-sm">
          <p className="text-center text-[13px] font-semibold uppercase tracking-widest text-foreground/35">Built for your type of studio</p>
          <h2 className="mt-2 text-center font-display text-3xl font-semibold tracking-tight md:text-4xl">
            One product, many disciplines.
          </h2>

          {/* Tabs */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {businessProfiles.map((bp) => {
              const isActive = selectedBusiness === bp.id;
              return (
                <button
                  key={bp.id}
                  onClick={() => setSelectedBusiness(bp.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-semibold transition-all active:scale-[0.97] ${
                    isActive
                      ? "bg-[#1a1423] text-white shadow-md"
                      : "bg-white border border-black/[0.06] text-foreground/55 hover:bg-neutral-50 hover:text-foreground"
                  }`}
                >
                  <bp.icon className="h-4 w-4" />
                  {bp.label}
                </button>
              );
            })}
          </div>

          {/* Dynamic content */}
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-widest text-rose">How it fits</p>
              <p className="mt-3 text-lg leading-relaxed text-foreground/60">
                {profile.headline}
              </p>
              <ul className="mt-5 space-y-2.5">
                {profile.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[15px] text-foreground/70">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-black/[0.05] bg-[#F9F7F4] p-6">
              <p className="font-display text-xl font-semibold tracking-tight">{profile.mockupTitle}</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/50">{profile.mockupBody}</p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {profile.mockupStats.map((s) => (
                  <div key={s.k} className="rounded-xl bg-white p-3 shadow-sm">
                    <s.icon className="mb-1 h-4 w-4 text-rose/60" />
                    <p className="font-display text-lg font-semibold">{s.v}</p>
                    <p className="text-[12px] font-medium text-foreground/35">{s.k}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FEATURES
          ════════════════════════════════════════════════════════════ */}
      <section id="features" className="mx-auto max-w-7xl px-5 pb-20">
        <div className="max-w-xl">
          <p className="text-[13px] font-semibold uppercase tracking-widest text-rose">Everything in one place</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">Built for the way studios actually work.</h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allFeatures.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-black/[0.05] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-rose/[0.07] text-rose group-hover:bg-rose group-hover:text-white transition-colors">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-[17px] font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-foreground/45">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          MIGRATION / SETUP
          ════════════════════════════════════════════════════════════ */}
      <section id="migration" className="border-y border-black/[0.04] bg-[#F7F5F2]">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-widest text-rose">Migration</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Easy startup or transition from your existing studio software.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-foreground/50">
                Import students, families, classes, instructors, and enrolments with a guided setup wizard.
                Start fresh or migrate from spreadsheets and existing studio platforms.
              </p>
              {/* Checklist */}
              <div className="mt-6 rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
                <p className="text-[13px] font-semibold text-foreground/40 uppercase mb-3">Migration Assistant</p>
                <ul className="space-y-2">
                  {migrationChecklist.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-[14px] text-foreground/65">
                      <Check className="h-4 w-4 shrink-0 text-teal" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Wizard steps visual */}
            <div className="space-y-4">
              {migrationSteps.map((step, i) => (
                <div key={step.n} className="flex gap-4 animate-float-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="flex flex-col items-center">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-white border border-black/[0.05] shadow-sm">
                      <span className="font-display text-lg font-semibold text-rose">{step.n}</span>
                    </div>
                    {i < migrationSteps.length - 1 && (
                      <div className="mt-1.5 h-8 w-px bg-black/[0.06]" />
                    )}
                  </div>
                  <div className="pt-1.5">
                    <h3 className="font-display text-[17px] font-semibold">{step.title}</h3>
                    <p className="mt-1 text-[14px] leading-relaxed text-foreground/45">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          HOW IT WORKS
          ════════════════════════════════════════════════════════════ */}
      <section id="how" className="mx-auto max-w-7xl px-5 py-20">
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Up and running in days, not months.</h2>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {howSteps.map((step, i) => (
            <div key={step.n} className="relative text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#1a1423] text-white shadow-lg">
                <span className="font-display text-lg font-semibold">{step.n}</span>
              </div>
              {i < howSteps.length - 1 && (
                <div className="absolute left-[calc(50%+2rem)] top-6 hidden h-px w-[calc(100%-5rem)] bg-black/[0.06] lg:block" />
              )}
              <h3 className="mt-4 font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-foreground/45">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          PRICING
          ════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="border-t border-black/[0.04] bg-[#F7F5F2]">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <div className="text-center">
            <p className="text-[13px] font-semibold uppercase tracking-widest text-rose">Pricing</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Simple, honest pricing.
            </h2>
            <p className="mt-3 text-[15px] text-foreground/45">
              No forced sales demo. No hidden onboarding fees.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 shadow-sm transition-all hover:shadow-lg ${
                  plan.featured
                    ? "border-rose/30 bg-white ring-1 ring-rose/20"
                    : "border-black/[0.05] bg-white"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-rose px-3.5 py-1 text-[12px] font-semibold text-white shadow-md">
                    Most popular
                  </span>
                )}
                <p className="font-display text-xl font-semibold">{plan.name}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-semibold tracking-tight">{plan.price}</span>
                  <span className="text-foreground/35">{plan.period}</span>
                </div>
                <p className="mt-2 text-[14px] text-foreground/45">{plan.description}</p>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[14px] text-foreground/65">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/dashboard"
                  className={`mt-7 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[15px] font-semibold transition-all active:scale-[0.97] ${
                    plan.featured
                      ? "bg-rose text-white shadow-lg shadow-rose/25 hover:bg-rose/90"
                      : "bg-[#1a1423] text-white shadow-sm hover:bg-[#1a1423]/85"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FINAL CTA
          ════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-5 py-24">
        <div className="relative overflow-hidden rounded-3xl bg-[#1a1423] px-8 py-16 text-center shadow-xl md:px-16 md:py-20">
          {/* Ambient glows */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-rose/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-plum/25 blur-3xl" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight text-white text-balance md:text-5xl">
              Give your studio software that feels calm, clear, and built for you.
            </h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/dashboard"
                className="group inline-flex items-center gap-2 rounded-full bg-rose px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-rose/30 transition-all hover:bg-rose/90 active:scale-[0.97]"
              >
                Start free trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-7 py-3.5 text-[15px] font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.97]"
              >
                View live demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FOOTER
          ════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-black/[0.04] bg-[#F7F5F2]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-[14px] text-foreground/35 sm:flex-row">
          <p>© {new Date().getFullYear()} StudioFlow. Made for studios like {studio.name}.</p>
          <div className="flex gap-6">
            <a href="#features" className="transition-colors hover:text-foreground/70">Features</a>
            <a href="#how" className="transition-colors hover:text-foreground/70">How it works</a>
            <a href="#migration" className="transition-colors hover:text-foreground/70">Migration</a>
            <a href="#pricing" className="transition-colors hover:text-foreground/70">Pricing</a>
            <Link to="/parent" className="transition-colors hover:text-foreground/70">Parent Portal</Link>
            <Link to="/dashboard" className="transition-colors hover:text-foreground/70">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
