import { useState, useRef, useEffect } from "react";
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
  Smartphone,
  Layers,
  Zap,
  TrendingUp,
  ClipboardCheck,
  MessageCircle,
  MoveRight,
  Star,
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
  useCases: string[];
  accentColor: string;
}

const businessProfiles: BusinessProfile[] = [
  {
    id: "dance",
    label: "Dance Studio",
    icon: Music,
    headline: "Class scheduling, recital planning, costume tracking, parent portal, and digital waivers — all connected.",
    features: [
      "Recital running orders & performance planning",
      "Costume tracking & measurement management",
      "Parent communication & caregiver permissions",
      "Digital waivers & media consent forms",
      "Class & teacher scheduling",
    ],
    useCases: ["Classes", "Recitals", "Costumes", "Parent communication"],
    mockupTitle: "Recital season, simplified",
    mockupBody: "Auto-generated running orders, costume assignments, and parent notifications — all connected.",
    mockupStats: [
      { k: "Recital Prep", v: "100%", icon: Sparkles },
      { k: "Costumes", v: "Tracked", icon: Shirt },
      { k: "Parents", v: "Connected", icon: Users },
    ],
    accentColor: "bg-rose/10 text-rose",
  },
  {
    id: "fitness",
    label: "Fitness Studio",
    icon: Dumbbell,
    headline: "Memberships, class packs, attendance tracking, coach management, and member communication.",
    features: [
      "Membership & class pass management",
      "Real-time attendance tracking",
      "Coach scheduling & pay estimates",
      "Member communication & announcements",
      "Billing & recurring invoices",
    ],
    useCases: ["Memberships", "Attendance", "Coach management", "Class packs"],
    mockupTitle: "Run your fitness studio from one dashboard",
    mockupBody: "Track attendance, manage memberships, pay coaches, and keep members engaged — all in one place.",
    mockupStats: [
      { k: "Attendance", v: "Real-time", icon: BarChart3 },
      { k: "Members", v: "Unlimited", icon: Users },
      { k: "Coaches", v: "Scheduled", icon: CalendarDays },
    ],
    accentColor: "bg-teal/10 text-teal",
  },
  {
    id: "music",
    label: "Music School",
    icon: Music,
    headline: "Private lessons, teacher schedules, student progress notes, billing, and family communication.",
    features: [
      "Private lesson scheduling & waitlists",
      "Student progress notes & practice logs",
      "Teacher timetables & room allocation",
      "Billing & lesson package invoicing",
      "Recital planning & family communication",
    ],
    useCases: ["Private lessons", "Student progress", "Teacher schedules", "Recital prep"],
    mockupTitle: "Harmony in operations",
    mockupBody: "Schedule one-on-one lessons, track student progress, handle billing, and communicate with families effortlessly.",
    mockupStats: [
      { k: "Lessons", v: "Scheduled", icon: CalendarDays },
      { k: "Students", v: "Tracked", icon: GraduationCap },
      { k: "Billing", v: "Automated", icon: CreditCard },
    ],
    accentColor: "bg-plum/10 text-plum",
  },
  {
    id: "martial_arts",
    label: "Martial Arts",
    icon: Swords,
    headline: "Belt & rank tracking, grading events, attendance, membership billing, and digital waivers.",
    features: [
      "Belt & rank progression tracking",
      "Grading event scheduling & rosters",
      "Attendance & class history records",
      "Membership billing & payment tracking",
      "Digital waivers & liability forms",
    ],
    useCases: ["Belt grading", "Attendance", "Memberships", "Waivers"],
    mockupTitle: "From white belt to black belt",
    mockupBody: "Track every student's journey, manage belt promotions, schedule gradings, and handle memberships seamlessly.",
    mockupStats: [
      { k: "Students", v: "Ranked", icon: Swords },
      { k: "Gradings", v: "Scheduled", icon: CalendarDays },
      { k: "Waivers", v: "Signed", icon: FileText },
    ],
    accentColor: "bg-gold/10 text-gold",
  },
  {
    id: "yoga",
    label: "Yoga / Pilates",
    icon: Heart,
    headline: "Class bookings, waitlists, pass tracking, instructor schedules, and digital waivers.",
    features: [
      "Class booking & automatic waitlists",
      "Pass & membership tracking",
      "Teacher schedules & substitute management",
      "Student communication & community messages",
      "Digital waivers & health forms",
    ],
    useCases: ["Passes", "Bookings", "Waitlists", "Teacher schedules"],
    mockupTitle: "Flow state for your studio",
    mockupBody: "Manage class bookings with automatic waitlists, track passes, schedule teachers, and keep your community connected.",
    mockupStats: [
      { k: "Bookings", v: "Live", icon: CalendarDays },
      { k: "Waitlist", v: "Auto", icon: Clock },
      { k: "Passes", v: "Tracked", icon: CreditCard },
    ],
    accentColor: "bg-rose/10 text-rose",
  },
];

/* ── Features data ──────────────────────────────────────────────── */

const allFeatures = [
  {
    icon: CalendarDays,
    title: "Scheduling & Classes",
    body: "Build recurring schedules, set capacities, manage waitlists, and assign teachers in seconds. Supports one-time workshops and multi-week courses.",
  },
  {
    icon: Users,
    title: "Students, Members & Families",
    body: "Multiple caregivers per family, granular permissions, pickup authorization, emergency contacts, and family grouping.",
  },
  {
    icon: ClipboardCheck,
    title: "Attendance Tracking",
    body: "Real-time attendance with manual or self-check-in. Spot participation trends and flag no-shows automatically.",
  },
  {
    icon: CreditCard,
    title: "Billing & Payments",
    body: "Stripe-powered tuition, invoices, class fees, and recurring memberships. Track payments and send automated reminders.",
  },
  {
    icon: FileText,
    title: "Digital Waivers",
    body: "Liability, media, and medical forms signed online with timestamps and signature records. Always compliant and paper-free.",
  },
  {
    icon: MessageCircle,
    title: "Communication Tools",
    body: "Studio-wide, per-class, or emergency announcements with delivery rules respecting caregiver permissions and contact preferences.",
  },
  {
    icon: Star,
    title: "Events & Recitals",
    body: "Plan recitals, competitions, workshops, and performances with running orders, rosters, and costume assignments.",
  },
  {
    icon: UserPlus,
    title: "Instructor Management",
    body: "Schedule teachers, track hours, manage payroll estimates, handle substitute coverage, and view availability at a glance.",
  },
  {
    icon: Upload,
    title: "Migration Assistant",
    body: "Import students, classes, and instructors from spreadsheets or existing platforms with smart field mapping and duplicate detection.",
  },
  {
    icon: Smartphone,
    title: "Parent & Member Portal",
    body: "A secure portal for families to view schedules, sign waivers, update details, and receive studio announcements.",
  },
];

/* ── Migration steps ────────────────────────────────────────────── */

const migrationSteps = [
  { n: "01", title: "Upload your file", body: "Drag and drop a CSV or Excel export from your current system. Works with spreadsheets and most studio platforms." },
  { n: "02", title: "Map your fields", body: "Smart matching automatically maps your columns to StudioFlow fields. Review and adjust in seconds." },
  { n: "03", title: "Validate and review", body: "Review duplicates, missing fields, and formatting before import. Fix issues with one click." },
  { n: "04", title: "Launch your studio", body: "Confirm and import — your classes, students, and staff are ready. Open registration immediately." },
];

const migrationChecklist = [
  "Student import",
  "Family import",
  "Class import",
  "Instructor import",
  "Duplicate detection",
  "Smart field matching",
];

/* ── Pricing ────────────────────────────────────────────────────── */

interface Plan {
  name: string;
  price: string;
  period: string;
  students: string;
  bestFor: string;
  description: string;
  features: string[];
  cta: string;
  featured: boolean;
  enterprise?: boolean;
}

const plans: Plan[] = [
  {
    name: "Startup",
    price: "$29",
    period: "/month",
    students: "Up to 150 active students",
    bestFor: "New and small studios",
    description: "Everything you need to get started.",
    features: [
      "Scheduling & calendar",
      "Student / member management",
      "Parent & student portal",
      "Digital waivers",
      "Announcements",
      "Migration assistant",
    ],
    cta: "Start free trial",
    featured: false,
  },
  {
    name: "Studio",
    price: "$59",
    period: "/month",
    students: "Up to 300 active students",
    bestFor: "Growing studios",
    description: "The complete studio toolkit.",
    features: [
      "Everything in Startup",
      "Billing & invoicing",
      "Attendance tracking",
      "Event & recital management",
      "Instructor management",
      "Priority support",
    ],
    cta: "Start free trial",
    featured: true,
  },
  {
    name: "Growth",
    price: "$99",
    period: "/month",
    students: "Up to 750 active students",
    bestFor: "Established studios",
    description: "Advanced features for scale.",
    features: [
      "Everything in Studio",
      "Advanced reporting",
      "Custom branding",
      "Multi-user administration",
      "Performance insights",
      "API access",
    ],
    cta: "Start free trial",
    featured: false,
  },
  {
    name: "Pro",
    price: "$149",
    period: "/month",
    students: "Up to 1,500 active students",
    bestFor: "Large studios",
    description: "Full power and flexibility.",
    features: [
      "Everything in Growth",
      "Advanced permissions & roles",
      "Dedicated account manager",
      "Custom onboarding",
      "Bulk operations",
      "Early access to new features",
    ],
    cta: "Start free trial",
    featured: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    students: "Multi-location",
    bestFor: "Organizations",
    description: "For multi-location studios and franchises.",
    features: [
      "Everything in Pro",
      "Multiple locations",
      "Centralized management",
      "Custom onboarding & training",
      "Dedicated support team",
      "Custom integrations",
    ],
    cta: "Contact us",
    featured: false,
    enterprise: true,
  },
];

/* ── How it works steps ─────────────────────────────────────────── */

const howSteps = [
  {
    n: "01",
    title: "Create your studio",
    body: "Add branding, rooms, instructors, and business details. Choose your studio type to tailor the experience.",
    icon: Sparkles,
  },
  {
    n: "02",
    title: "Import your data",
    body: "Use the migration wizard to pull in students, families, classes, and staff — or start fresh and add manually.",
    icon: Upload,
  },
  {
    n: "03",
    title: "Open registration",
    body: "Share your public registration page and portal. Families can sign waivers, view schedules, and update details.",
    icon: Rocket,
  },
  {
    n: "04",
    title: "Run everything in one place",
    body: "Manage scheduling, attendance, billing, waivers, and communication from a single calm dashboard.",
    icon: Layers,
  },
];

/* ── Mockup card helper ─────────────────────────────────────────── */

function MockCard({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={`animate-float-up rounded-xl border border-black/[0.06] bg-white shadow-sm ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */

export default function Landing() {
  const { studio } = useStudio();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessType>("dance");
  const profile = businessProfiles.find((p) => p.id === selectedBusiness)!;

  /* Scroll-aware nav background */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Reusable nav links ─────────────────────────────────────── */
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
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? "border-black/[0.08] bg-[#FAF8F5]/90 backdrop-blur-xl shadow-sm"
            : "border-transparent bg-[#FAF8F5]/60 backdrop-blur-lg"
        }`}
      >
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
              Portal
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
              <Link to="/parent" onClick={() => setMobileNavOpen(false)} className="transition-colors hover:text-foreground">Portal</Link>
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
        <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-rose/12 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-64 h-[400px] w-[400px] rounded-full bg-plum/8 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-[300px] w-[300px] rounded-full bg-gold/8 blur-3xl" />
        {/* Grain texture */}
        <div className="pointer-events-none absolute inset-0 bg-grain opacity-40" />

        <div className="mx-auto max-w-7xl px-5 pb-16 pt-12 md:pb-24 md:pt-20 lg:pt-28">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            {/* Left: copy */}
            <div className="animate-float-up">
              {/* Trust badge */}
              <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/70 px-4 py-2 text-[13px] font-semibold text-foreground/55 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                No sales calls. No onboarding fees. No long implementation projects.
              </span>

              <h1 className="mt-6 font-display text-[2.75rem] font-semibold leading-[1.06] tracking-tight text-balance md:text-6xl">
                Run your studio from one calm dashboard.
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-foreground/55">
                Classes, members, students, billing, waivers, staff, events and communication — all in
                one operating system built for modern studios.
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
              <p className="mt-6 text-sm text-foreground/40">Free 30-day trial. No credit card required.</p>
            </div>

            {/* Right: layered floating dashboard mockups (desktop only) */}
            <div className="relative hidden lg:block" style={{ minHeight: "440px" }}>
              {/* Main panel — dashboard */}
              <MockCard delay={0} className="relative z-10 p-5 shadow-soft">
                {/* Browser chrome */}
                <div className="mb-4 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose/40" />
                  <span className="h-2.5 w-2.5 rounded-full bg-gold/40" />
                  <span className="h-2.5 w-2.5 rounded-full bg-teal/40" />
                  <span className="ml-3 text-xs font-medium text-foreground/25">StudioFlow — Dashboard</span>
                </div>

                {/* Dashboard stat cards */}
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

                {/* Upcoming classes */}
                <div className="rounded-xl border border-black/[0.04] bg-[#F9F7F4] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-foreground/40 uppercase">Upcoming Classes</span>
                    <span className="text-[11px] font-medium text-rose">View all</span>
                  </div>
                  {["Beginner Ballet — 4:30 PM", "Jazz II — 5:45 PM", "Contemporary — 7:00 PM"].map((cls, i) => (
                    <div key={cls} className={`flex items-center justify-between py-2 ${i < 2 ? "border-b border-black/[0.04]" : ""}`}>
                      <span className="text-[13px] font-medium text-foreground/70">{cls}</span>
                      <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[11px] font-semibold text-teal">On</span>
                    </div>
                  ))}
                </div>
              </MockCard>

              {/* Floating panel — Quick Actions (bottom right) */}
              <MockCard delay={120} className="absolute -bottom-4 -right-4 z-20 w-44 p-3 shadow-md">
                <p className="text-[11px] font-semibold text-foreground/35 uppercase">Quick Actions</p>
                <div className="mt-2 space-y-1.5">
                  {["+ Add class", "+ Enrol student", "+ Send message"].map((a) => (
                    <div key={a} className="flex items-center gap-2 rounded-lg bg-[#F9F7F4] px-2.5 py-1.5 text-[12px] font-medium text-foreground/60">
                      <div className="h-1.5 w-1.5 rounded-full bg-rose/50" />
                      {a}
                    </div>
                  ))}
                </div>
              </MockCard>

              {/* Floating panel — Attendance (top left) */}
              <MockCard delay={200} className="absolute -left-6 top-10 z-20 w-40 p-3 shadow-md">
                <p className="text-[11px] font-semibold text-foreground/35 uppercase">Attendance</p>
                <div className="mt-2 space-y-1.5">
                  {[85, 92, 78].map((pct, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-foreground/50 w-12">4:{3 + i}0 PM</span>
                      <div className="flex-1 h-1.5 rounded-full bg-black/[0.05] overflow-hidden">
                        <div className="h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold text-foreground/35">{pct}%</span>
                    </div>
                  ))}
                </div>
              </MockCard>

              {/* Floating panel — Student profile (mid right) */}
              <MockCard delay={280} className="absolute -right-2 top-28 z-20 w-40 p-3 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-rose/10 text-rose text-xs font-bold">EK</div>
                  <div>
                    <p className="text-[12px] font-semibold text-foreground/80">Emma K.</p>
                    <p className="text-[11px] text-foreground/40">Ballet III · Age 8</p>
                  </div>
                </div>
                <div className="mt-2.5 space-y-1">
                  {["Waiver: Signed", "Payment: Current", "Attendance: 92%"].map((s) => (
                    <div key={s} className="flex items-center gap-1.5 text-[11px] text-foreground/50">
                      <Check className="h-3 w-3 text-teal shrink-0" />
                      {s}
                    </div>
                  ))}
                </div>
              </MockCard>
            </div>

            {/* Mobile mockup (simpler) */}
            <div className="block lg:hidden animate-float-up" style={{ animationDelay: "120ms" }}>
              <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-soft">
                <div className="mb-3 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose/40" />
                  <span className="h-2 w-2 rounded-full bg-gold/40" />
                  <span className="h-2 w-2 rounded-full bg-teal/40" />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "Classes today", value: "8", color: "bg-rose/10 text-rose" },
                    { label: "Students", value: "247", color: "bg-teal/10 text-teal" },
                    { label: "Revenue", value: "$4.2k", color: "bg-gold/10 text-gold" },
                    { label: "Waivers", value: "12 due", color: "bg-plum/10 text-plum" },
                  ].map((card) => (
                    <div key={card.label} className="rounded-xl border border-black/[0.04] bg-[#F9F7F4] p-3">
                      <p className="font-display text-lg font-semibold">{card.value}</p>
                      <p className="text-[11px] font-medium text-foreground/35">{card.label}</p>
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
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-semibold transition-all active:scale-[0.97] ${
                    isActive
                      ? "bg-[#1a1423] text-white shadow-lg"
                      : "bg-white border border-black/[0.06] text-foreground/55 hover:bg-neutral-50 hover:text-foreground hover:border-black/[0.12]"
                  }`}
                >
                  <bp.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{bp.label}</span>
                  <span className="sm:hidden">{bp.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic content */}
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div className="animate-float-up" key={selectedBusiness}>
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.useCases.map((uc) => (
                  <span key={uc} className="rounded-full bg-rose/[0.07] px-3 py-1 text-[12px] font-semibold text-rose">
                    {uc}
                  </span>
                ))}
              </div>
              <p className="text-lg leading-relaxed text-foreground/60">{profile.headline}</p>
              <ul className="mt-5 space-y-2.5">
                {profile.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[15px] text-foreground/70">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-black/[0.05] bg-[#F9F7F4] p-6 animate-float-up" style={{ animationDelay: "100ms" }}>
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
          <p className="text-[13px] font-semibold uppercase tracking-widest text-rose">Everything you need</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Everything your studio needs.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground/45">
            One platform for scheduling, students, billing, waivers, communication, and more — no stitching tools together.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {allFeatures.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg xl:col-span-1"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-rose/[0.07] text-rose group-hover:bg-rose group-hover:text-white transition-colors duration-200">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-[16px] font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-foreground/45">{f.body}</p>
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
                Switching software should not be painful.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-foreground/50">
                Move from spreadsheets or existing studio management software with our guided migration
                assistant. Import students, families, classes, instructors, and enrolments in one session.
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-foreground/40">
                Whether you're moving from spreadsheets, Jackrabbit, Mindbody, WellnessLiving or another
                platform, StudioFlow helps you get started quickly.
              </p>

              {/* Checklist */}
              <div className="mt-6 rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
                <p className="text-[13px] font-semibold text-foreground/40 uppercase mb-3">Migration Assistant</p>
                <div className="grid grid-cols-2 gap-2">
                  {migrationChecklist.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-[13px] text-foreground/65">
                      <Check className="h-3.5 w-3.5 shrink-0 text-teal" />
                      {item}
                    </div>
                  ))}
                </div>
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
          <p className="text-[13px] font-semibold uppercase tracking-widest text-rose">Get started</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Start today. Open registration tonight.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-foreground/45">
            Most studios can create their account, import data and begin accepting registrations within a single session.
          </p>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {howSteps.map((step, i) => (
            <div key={step.n} className="relative text-center group">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#1a1423] text-white shadow-lg transition-transform group-hover:scale-105">
                <step.icon className="h-6 w-6" />
              </div>
              {i < howSteps.length - 1 && (
                <div className="absolute left-[calc(50%+2.5rem)] top-7 hidden h-px w-[calc(100%-5.5rem)] bg-black/[0.06] lg:block" />
              )}
              <div className="mx-auto mt-3 grid h-6 w-6 place-items-center rounded-full bg-rose/10 text-rose">
                <span className="text-[11px] font-bold">{step.n}</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-foreground/45 px-2">{step.body}</p>
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
              Simple pricing that grows with your studio.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-foreground/45">
              No contracts. No forced demos. No surprise onboarding fees. Start with a 30-day free trial.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-6 shadow-sm transition-all hover:shadow-lg ${
                  plan.featured
                    ? "border-rose/30 bg-white ring-1 ring-rose/20 lg:-mt-4 lg:mb-4"
                    : "border-black/[0.05] bg-white"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-rose px-3.5 py-1 text-[12px] font-semibold text-white shadow-md whitespace-nowrap">
                    Most popular
                  </span>
                )}
                <div className="mb-4">
                  <p className="font-display text-lg font-semibold">{plan.name}</p>
                  <p className="mt-0.5 text-[12px] font-medium text-foreground/40">{plan.students}</p>
                </div>
                <div className="flex items-baseline gap-0.5 mb-1">
                  <span className="font-display text-3xl font-semibold tracking-tight">{plan.price}</span>
                  {plan.period && <span className="text-foreground/35 text-sm">{plan.period}</span>}
                </div>
                <p className="text-[13px] font-medium text-foreground/40 mb-4">{plan.bestFor}</p>
                <p className="text-[13px] text-foreground/50 mb-4">{plan.description}</p>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-foreground/60">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/dashboard"
                  className={`mt-auto flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-all active:scale-[0.97] ${
                    plan.enterprise
                      ? "border-2 border-[#1a1423] text-[#1a1423] hover:bg-[#1a1423] hover:text-white"
                      : plan.featured
                        ? "bg-rose text-white shadow-lg shadow-rose/25 hover:bg-rose/90"
                        : "bg-[#1a1423] text-white shadow-sm hover:bg-[#1a1423]/85"
                  }`}
                >
                  {plan.cta}
                  {!plan.enterprise && <ArrowRight className="h-4 w-4" />}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          PORTAL SECTION
          ════════════════════════════════════════════════════════════ */}
      <section id="portal" className="mx-auto max-w-7xl px-5 py-20">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16 items-center">
          {/* Left: portal mockup */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Phone frame */}
              <div className="w-64 rounded-[2.5rem] border-[5px] border-[#1a1423] bg-white p-4 shadow-lift mx-auto">
                {/* Notch */}
                <div className="mx-auto mb-4 h-6 w-24 rounded-full bg-[#1a1423]" />
                {/* Portal content */}
                <div className="rounded-2xl bg-[#F9F7F4] p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold text-foreground/50">STUDIOFLOW PORTAL</span>
                    <Bell className="h-4 w-4 text-rose/60" />
                  </div>
                  {/* Student list */}
                  <div className="space-y-3">
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[13px] font-semibold text-foreground/80">Emma K.</p>
                          <p className="text-[11px] text-foreground/40">Ballet III · Tue 4:30 PM</p>
                        </div>
                        <div className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-bold text-teal">Signed in</div>
                      </div>
                    </div>
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[13px] font-semibold text-foreground/80">Liam K.</p>
                          <p className="text-[11px] text-foreground/40">Hip Hop I · Thu 5:00 PM</p>
                        </div>
                        <div className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold">Waiver due</div>
                      </div>
                    </div>
                  </div>
                  {/* Quick actions */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 rounded-lg bg-white p-2.5 text-[12px] font-medium text-foreground/60 shadow-sm">
                      <CalendarDays className="h-3.5 w-3.5 text-rose/60" />
                      View schedule
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-white p-2.5 text-[12px] font-medium text-foreground/60 shadow-sm">
                      <FileText className="h-3.5 w-3.5 text-teal/60" />
                      Sign waivers
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-white p-2.5 text-[12px] font-medium text-foreground/60 shadow-sm">
                      <CreditCard className="h-3.5 w-3.5 text-gold/60" />
                      View payments
                    </div>
                  </div>
                </div>
              </div>
              {/* Ambient glow */}
              <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-rose/10 blur-3xl" />
            </div>
          </div>

          {/* Right: copy */}
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-widest text-rose">Portal</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              A secure portal for students, members, and families.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-foreground/50">
              Give caregivers and members their own dashboard to view schedules, sign waivers, update
              contact details, and receive studio announcements. No more paper forms or missed messages.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                "View class schedules and attendance history",
                "Sign digital waivers and update medical forms",
                "Manage family accounts and pickup authorizations",
                "Receive studio announcements by class or group",
                "View payment history and outstanding invoices",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14px] text-foreground/65">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/parent"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#1a1423] px-6 py-3 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-[#1a1423]/85 active:scale-[0.97]"
            >
              Explore the portal
              <MoveRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FINAL CTA
          ════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-[#1a1423] px-8 py-16 text-center shadow-xl md:px-16 md:py-24">
          {/* Ambient glows */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-rose/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-plum/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-40 right-40 h-48 w-48 rounded-full bg-gold/15 blur-3xl" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight text-white text-balance md:text-5xl">
              Spend less time managing your studio. More time growing it.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-white/55 text-[15px] leading-relaxed">
              Join modern studios using StudioFlow to simplify scheduling, communication, billing, and events.
            </p>
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
                View demo
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
          <p>© {new Date().getFullYear()} StudioFlow. Built for modern studios.</p>
          <div className="flex flex-wrap justify-center gap-5">
            <a href="#features" className="transition-colors hover:text-foreground/70">Features</a>
            <a href="#how" className="transition-colors hover:text-foreground/70">How it works</a>
            <a href="#migration" className="transition-colors hover:text-foreground/70">Migration</a>
            <a href="#pricing" className="transition-colors hover:text-foreground/70">Pricing</a>
            <Link to="/parent" className="transition-colors hover:text-foreground/70">Portal</Link>
            <Link to="/dashboard" className="transition-colors hover:text-foreground/70">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
