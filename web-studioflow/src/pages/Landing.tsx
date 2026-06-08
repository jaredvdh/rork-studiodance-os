import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Music,
  Dumbbell,
  Heart,
  Swords,
  GraduationCap,
  Menu,
  X,
  MinusCircle,
  Layers,
  Smile,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useStudio } from "@/data/store";

/* ── Types ──────────────────────────────────────────────────────── */

type BusinessType = "dance" | "fitness" | "yoga" | "music" | "martial_arts";

interface BusinessProfile {
  id: BusinessType;
  label: string;
  short: string;
  icon: typeof Music;
  blurb: string;
  screenshot: string;
  chromeLabel: string;
}

/* ── Screenshots ─────────────────────────────────────────────────── */

const SCREENSHOTS = {
  dashboard: "https://r2-pub.rork.com/generated-images/88d1cab1-4c27-4268-bb1c-71c7d6da492c.png",
  schedule: "https://r2-pub.rork.com/generated-images/c7c249e2-7b43-434a-b748-692755a6f006.png",
  classes: "https://r2-pub.rork.com/generated-images/c787a95c-8f9f-4b7c-a756-3bfea43ad233.png",
  students: "https://r2-pub.rork.com/generated-images/4e34fecf-d4cd-4699-8c7a-66c8fad7ea4d.png",
  portal: "https://r2-pub.rork.com/generated-images/96712729-1ac9-4d0a-897f-c10a47a2d3f6.png",
} as const;

/* ── Business profiles (selector) ───────────────────────────────── */

const businessProfiles: BusinessProfile[] = [
  {
    id: "dance",
    label: "Dance",
    short: "Dance",
    icon: Music,
    blurb: "Class scheduling, recital running orders, costume tracking and a parent portal — all connected.",
    screenshot: SCREENSHOTS.dashboard,
    chromeLabel: "Dance studio — Dashboard",
  },
  {
    id: "fitness",
    label: "Fitness",
    short: "Fitness",
    icon: Dumbbell,
    blurb: "Memberships, class packs, attendance and coach scheduling from one calm dashboard.",
    screenshot: SCREENSHOTS.schedule,
    chromeLabel: "Fitness studio — Schedule",
  },
  {
    id: "yoga",
    label: "Yoga",
    short: "Yoga",
    icon: Heart,
    blurb: "Bookings with automatic waitlists, pass tracking and instructor schedules in one place.",
    screenshot: SCREENSHOTS.classes,
    chromeLabel: "Yoga studio — Classes",
  },
  {
    id: "music",
    label: "Music",
    short: "Music",
    icon: GraduationCap,
    blurb: "Private lessons, teacher timetables, student progress and billing without the spreadsheets.",
    screenshot: SCREENSHOTS.students,
    chromeLabel: "Music school — Students",
  },
  {
    id: "martial_arts",
    label: "Martial Arts",
    short: "Martial",
    icon: Swords,
    blurb: "Belt and rank tracking, grading events, attendance and membership billing — seamlessly.",
    screenshot: SCREENSHOTS.dashboard,
    chromeLabel: "Martial arts — Dashboard",
  },
];

/* ── Everything included ─────────────────────────────────────────── */

const everythingIncluded = [
  "Scheduling",
  "Students & Families",
  "Attendance",
  "Payments",
  "Digital Waivers",
  "Parent Portal",
  "Recitals & Events",
  "Instructor Management",
  "Migration Tools",
  "Communication",
];

/* ── Why studios switch ──────────────────────────────────────────── */

const switchReasons = [
  {
    icon: MinusCircle,
    title: "Less administration",
    body: "Spend less time managing paperwork and payments.",
  },
  {
    icon: Layers,
    title: "Fewer systems",
    body: "Replace spreadsheets and disconnected tools.",
  },
  {
    icon: Smile,
    title: "Happier families",
    body: "Keep everyone informed and engaged.",
  },
];

/* ── Migration steps ─────────────────────────────────────────────── */

const migrationSteps = [
  { n: "01", title: "Upload your file", body: "Drag in a CSV or export from your current platform." },
  { n: "02", title: "Map your fields", body: "Smart matching aligns your columns automatically." },
  { n: "03", title: "Review", body: "Catch duplicates and formatting before importing." },
  { n: "04", title: "Launch", body: "Open registration the same day." },
];

/* ── Pricing ─────────────────────────────────────────────────────── */

interface Plan {
  name: string;
  price: string;
  students: string;
  tagline: string;
  featured: boolean;
}

const plans: Plan[] = [
  { name: "Startup", price: "$29", students: "Up to 150 students", tagline: "For new studios", featured: false },
  { name: "Growing", price: "$49", students: "Up to 400 students", tagline: "Most popular", featured: true },
  { name: "Professional", price: "$99", students: "Unlimited growth", tagline: "For established studios", featured: false },
];

const pricingPromises = ["No setup fees", "No onboarding fees", "No sales calls", "Cancel anytime"];

/* ── Reusable: browser-framed screenshot ─────────────────────────── */

function BrowserShot({
  src,
  label,
  alt,
  onClick,
  className = "",
}: {
  src: string;
  label: string;
  alt: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-lift",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 border-b border-black/[0.04] bg-[#F7F5F2] px-5 py-3.5">
        <span className="h-3 w-3 rounded-full bg-rose/40" />
        <span className="h-3 w-3 rounded-full bg-gold/40" />
        <span className="h-3 w-3 rounded-full bg-teal/40" />
        <span className="ml-2 text-[12px] font-medium text-foreground/30">{label}</span>
      </div>
      <img src={src} alt={alt} className="w-full" loading="lazy" />
    </div>
  );
}

/* ── Reusable: alternating story section ─────────────────────────── */

function StorySection({
  id,
  eyebrow,
  title,
  body,
  src,
  chrome,
  alt,
  reverse = false,
  onImageClick,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  body: string;
  src: string;
  chrome: string;
  alt: string;
  reverse?: boolean;
  onImageClick: () => void;
}) {
  return (
    <section id={id} className="mx-auto max-w-7xl px-5 py-20 md:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className={cn(reverse && "lg:order-2")}>
          <p className="text-[13px] font-semibold uppercase tracking-widest text-rose">{eyebrow}</p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance md:text-5xl">
            {title}
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-foreground/55">{body}</p>
        </div>
        <div className={cn("group", reverse && "lg:order-1")}>
          <BrowserShot
            src={src}
            label={chrome}
            alt={alt}
            onClick={onImageClick}
            className="transition-transform duration-500 group-hover:-translate-y-1"
          />
        </div>
      </div>
    </section>
  );
}

/* ── Main Component ───────────────────────────────────────────────── */

export default function Landing() {
  const { studio } = useStudio();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessType>("dance");
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const profile = businessProfiles.find((p) => p.id === selectedBusiness)!;

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = (
    <>
      <a href="#disciplines" onClick={() => setMobileNavOpen(false)} className="transition-colors hover:text-foreground">Disciplines</a>
      <a href="#scheduling" onClick={() => setMobileNavOpen(false)} className="transition-colors hover:text-foreground">Scheduling</a>
      <a href="#portal" onClick={() => setMobileNavOpen(false)} className="transition-colors hover:text-foreground">Portal</a>
      <a href="#migration" onClick={() => setMobileNavOpen(false)} className="transition-colors hover:text-foreground">Migration</a>
      <a href="#pricing" onClick={() => setMobileNavOpen(false)} className="transition-colors hover:text-foreground">Pricing</a>
    </>
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-foreground">
      {/* ── NAV ─────────────────────────────────────────────────── */}
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-all duration-300",
          scrolled
            ? "border-black/[0.08] bg-[#FAF8F5]/90 backdrop-blur-xl shadow-sm"
            : "border-transparent bg-[#FAF8F5]/60 backdrop-blur-lg",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center px-5">
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

          <nav className="ml-10 hidden items-center gap-8 text-[14px] font-medium text-foreground/55 lg:flex">
            {navLinks}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <Link to="/dashboard" className="hidden text-[14px] font-medium text-foreground/55 transition-colors hover:text-foreground sm:inline-block">
              Log in
            </Link>
            <Link
              to="/dashboard"
              className="hidden rounded-full bg-[#1a1423] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1a1423]/85 active:scale-[0.97] sm:inline-flex items-center gap-2"
            >
              Start free trial
            </Link>
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="ml-1 grid h-10 w-10 place-items-center rounded-xl text-foreground/60 transition-colors hover:text-foreground lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="border-t border-black/[0.06] bg-[#FAF8F5] px-5 pb-6 pt-4 lg:hidden">
            <nav className="flex flex-col gap-4 text-[15px] font-medium text-foreground/60">
              {navLinks}
              <Link to="/parent" onClick={() => setMobileNavOpen(false)} className="transition-colors hover:text-foreground">Portal login</Link>
              <Link to="/dashboard" onClick={() => setMobileNavOpen(false)} className="transition-colors hover:text-foreground">Log in</Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileNavOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[#1a1423] px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
              >
                Start free trial
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ── SECTION 1 — HERO ────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-rose/12 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-72 h-[440px] w-[440px] rounded-full bg-plum/8 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-grain opacity-40" />

        <div className="relative mx-auto max-w-4xl px-5 pt-20 text-center md:pt-28 lg:pt-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/70 px-4 py-2 text-[13px] font-semibold text-foreground/55 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
            No sales calls · No onboarding fees · 30-day free trial
          </span>

          <h1 className="mx-auto mt-7 max-w-3xl font-display text-[2.9rem] font-semibold leading-[1.04] tracking-tight text-balance md:text-7xl">
            Run your studio from one calm dashboard.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-foreground/55 md:text-xl">
            Classes, families, payments, waivers and communication — all in one place.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-2 rounded-full bg-rose px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-rose/25 transition-all hover:bg-rose/90 active:scale-[0.97]"
            >
              Start free trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-7 py-3.5 text-[15px] font-semibold text-foreground shadow-sm transition-all hover:bg-neutral-50 active:scale-[0.97]"
            >
              View live demo
            </Link>
          </div>
          <p className="mt-5 text-sm text-foreground/40">Free 30-day trial. No credit card required.</p>
        </div>

        {/* Hero screenshot — the hero */}
        <div className="relative mx-auto mt-14 max-w-6xl px-5 pb-20 md:mt-20 md:pb-28">
          <div className="pointer-events-none absolute inset-x-10 top-10 -z-10 h-72 rounded-full bg-rose/10 blur-3xl" />
          <div className="animate-float-up">
            <BrowserShot
              src={SCREENSHOTS.dashboard}
              label="app.studioflow.co — Dashboard"
              alt="StudioFlow dashboard showing classes, students, revenue and waivers at a glance"
              onClick={() => setLightboxImg(SCREENSHOTS.dashboard)}
            />
          </div>
        </div>
      </section>

      {/* ── SECTION 2 — ONE PLATFORM, MANY DISCIPLINES ──────────── */}
      <section id="disciplines" className="border-t border-black/[0.04] bg-[#F7F5F2]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:py-28">
          <div className="text-center">
            <p className="text-[13px] font-semibold uppercase tracking-widest text-rose">One platform</p>
            <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance md:text-5xl">
              One platform. Many disciplines.
            </h2>
          </div>

          {/* Selector */}
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {businessProfiles.map((bp) => {
              const isActive = selectedBusiness === bp.id;
              return (
                <button
                  key={bp.id}
                  onClick={() => setSelectedBusiness(bp.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-all active:scale-[0.97]",
                    isActive
                      ? "bg-[#1a1423] text-white shadow-lg"
                      : "bg-white border border-black/[0.06] text-foreground/55 hover:bg-white hover:text-foreground hover:border-black/[0.12]",
                  )}
                >
                  <bp.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{bp.label}</span>
                  <span className="sm:hidden">{bp.short}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic content */}
          <div key={selectedBusiness} className="animate-fade-in mx-auto mt-12 max-w-5xl">
            <BrowserShot
              src={profile.screenshot}
              label={profile.chromeLabel}
              alt={`StudioFlow for ${profile.label.toLowerCase()} studios`}
              onClick={() => setLightboxImg(profile.screenshot)}
            />
            <p className="mx-auto mt-8 max-w-xl text-center text-lg leading-relaxed text-foreground/55">
              {profile.blurb}
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — SCHEDULING ──────────────────────────────── */}
      <StorySection
        id="scheduling"
        eyebrow="Scheduling"
        title="Your schedule at a glance."
        body="Create classes, assign instructors, manage capacity and view your week instantly."
        src={SCREENSHOTS.schedule}
        chrome="Schedule — Weekly view"
        alt="StudioFlow weekly schedule with classes arranged by day"
        onImageClick={() => setLightboxImg(SCREENSHOTS.schedule)}
      />

      {/* ── SECTION 4 — STUDENTS & FAMILIES ─────────────────────── */}
      <div className="border-t border-black/[0.04] bg-[#F7F5F2]">
        <StorySection
          eyebrow="Students & families"
          title="Every family connected."
          body="Students, caregivers, waivers and attendance all stay linked automatically."
          src={SCREENSHOTS.students}
          chrome="Students & Caregivers"
          alt="StudioFlow student and family records with waiver tracking"
          reverse
          onImageClick={() => setLightboxImg(SCREENSHOTS.students)}
        />
      </div>

      {/* ── SECTION 5 — PARENT PORTAL ───────────────────────────── */}
      <section id="portal" className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 top-24 h-96 w-96 rounded-full bg-plum/8 blur-3xl" />
        <div className="mx-auto max-w-7xl px-5 py-20 md:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-widest text-rose">Parent portal</p>
              <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance md:text-5xl">
                Parents always know what's happening.
              </h2>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-foreground/55">
                Schedules, waivers, payments and announcements in one simple portal.
              </p>
              <Link
                to="/parent"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1a1423] px-6 py-3 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-[#1a1423]/85 active:scale-[0.97]"
              >
                Explore the portal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Phone mockup dominates */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="pointer-events-none absolute inset-0 -z-10 scale-125 rounded-full bg-rose/12 blur-3xl" />
                <div
                  className="w-[300px] cursor-pointer overflow-hidden rounded-[3rem] border-[7px] border-[#1a1423] bg-white shadow-lift transition-transform duration-500 hover:-translate-y-1 md:w-[340px]"
                  onClick={() => setLightboxImg(SCREENSHOTS.portal)}
                >
                  <div className="mx-auto mt-3 h-7 w-28 rounded-full bg-[#1a1423]" />
                  <img
                    src={SCREENSHOTS.portal}
                    alt="StudioFlow parent portal on mobile — schedules, waivers and payments"
                    className="mt-3 w-full"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6 — BILLING & WAIVERS ───────────────────────── */}
      <div className="border-t border-black/[0.04] bg-[#F7F5F2]">
        <StorySection
          eyebrow="Billing & waivers"
          title="Billing that takes care of itself."
          body="Invoices, payments, reminders and digital waivers managed from one system."
          src={SCREENSHOTS.classes}
          chrome="Billing & Waivers"
          alt="StudioFlow billing and digital waivers management"
          onImageClick={() => setLightboxImg(SCREENSHOTS.classes)}
        />
      </div>

      {/* ── SECTION 7 — EVERYTHING INCLUDED ─────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-20 md:py-28">
        <div className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-widest text-rose">Everything included</p>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance md:text-5xl">
            One subscription. The whole studio.
          </h2>
        </div>
        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
          {everythingIncluded.map((item) => (
            <div key={item} className="flex items-center gap-3 border-b border-black/[0.05] pb-4 text-[17px] font-medium text-foreground/75">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal/10">
                <Check className="h-3.5 w-3.5 text-teal" />
              </span>
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 8 — WHY STUDIOS SWITCH ──────────────────────── */}
      <section className="border-y border-black/[0.04] bg-[#F7F5F2]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:py-28">
          <div className="text-center">
            <p className="text-[13px] font-semibold uppercase tracking-widest text-rose">Why studios switch</p>
            <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance md:text-5xl">
              Built to make studio life simpler.
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {switchReasons.map((r) => (
              <div
                key={r.title}
                className="rounded-3xl bg-white p-8 shadow-soft transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose/[0.08] text-rose">
                  <r.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight">{r.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-foreground/55">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 9 — MIGRATION ───────────────────────────────── */}
      <section id="migration" className="mx-auto max-w-7xl px-5 py-20 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="group lg:order-2">
            <BrowserShot
              src={SCREENSHOTS.dashboard}
              label="Migration assistant"
              alt="StudioFlow migration assistant importing data"
              onClick={() => setLightboxImg(SCREENSHOTS.dashboard)}
              className="transition-transform duration-500 group-hover:-translate-y-1"
            />
          </div>
          <div className="lg:order-1">
            <p className="text-[13px] font-semibold uppercase tracking-widest text-rose">Migration</p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance md:text-5xl">
              Switching software should not be painful.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-foreground/55">
              Import students, families and classes in one guided session.
            </p>
            <div className="mt-8 space-y-5">
              {migrationSteps.map((step) => (
                <div key={step.n} className="flex gap-4">
                  <span className="font-display text-lg font-semibold text-rose">{step.n}</span>
                  <div>
                    <h3 className="font-display text-[17px] font-semibold">{step.title}</h3>
                    <p className="mt-0.5 text-[14px] leading-relaxed text-foreground/50">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 10 — PRICING ────────────────────────────────── */}
      <section id="pricing" className="border-t border-black/[0.04] bg-[#F7F5F2]">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <div className="text-center">
            <p className="text-[13px] font-semibold uppercase tracking-widest text-rose">Pricing</p>
            <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance md:text-5xl">
              Simple pricing that grows with you.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-3xl p-8 transition-transform duration-300 hover:-translate-y-1",
                  plan.featured
                    ? "bg-[#1a1423] text-white shadow-xl md:-mt-4 md:mb-4"
                    : "bg-white text-foreground shadow-soft",
                )}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-rose px-4 py-1 text-[12px] font-semibold text-white shadow-md whitespace-nowrap">
                    Most popular
                  </span>
                )}
                <p className={cn("font-display text-xl font-semibold", plan.featured ? "text-white" : "text-foreground")}>
                  {plan.name}
                </p>
                <p className={cn("mt-1 text-[13px] font-medium", plan.featured ? "text-white/55" : "text-foreground/40")}>
                  {plan.tagline}
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-semibold tracking-tight">{plan.price}</span>
                  <span className={cn("text-sm", plan.featured ? "text-white/50" : "text-foreground/35")}>/month</span>
                </div>
                <p className={cn("mt-3 text-[14px]", plan.featured ? "text-white/60" : "text-foreground/50")}>
                  {plan.students}
                </p>
                <Link
                  to="/dashboard"
                  className={cn(
                    "mt-8 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold transition-all active:scale-[0.97]",
                    plan.featured
                      ? "bg-rose text-white shadow-lg shadow-rose/30 hover:bg-rose/90"
                      : "bg-[#1a1423] text-white hover:bg-[#1a1423]/85",
                  )}
                >
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {pricingPromises.map((p) => (
              <div key={p} className="flex items-center gap-2 text-[14px] font-medium text-foreground/55">
                <Check className="h-4 w-4 shrink-0 text-teal" />
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 11 — FINAL CTA ──────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-20 md:py-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#1a1423] px-8 py-20 text-center shadow-xl md:px-16 md:py-32">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-rose/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-plum/25 blur-3xl" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-white text-balance md:text-6xl">
              Start your free trial today.
            </h2>
            <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-white/55">
              Create your studio in minutes and see everything in one place.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/dashboard"
                className="group inline-flex items-center gap-2 rounded-full bg-rose px-8 py-4 text-[15px] font-semibold text-white shadow-lg shadow-rose/30 transition-all hover:bg-rose/90 active:scale-[0.97]"
              >
                Start free trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-8 py-4 text-[15px] font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.97]"
              >
                Book a demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIGHTBOX ────────────────────────────────────────────── */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1a1423]/90 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setLightboxImg(null)}
        >
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white/90 transition-colors hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxImg}
            alt="Screenshot preview"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t border-black/[0.04] bg-[#F7F5F2]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-10 text-[14px] text-foreground/35 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#1a1423] font-display text-xs font-semibold text-white">
              {studio.initials}
            </div>
            <p>© {new Date().getFullYear()} StudioFlow</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="#disciplines" className="transition-colors hover:text-foreground/70">Disciplines</a>
            <a href="#scheduling" className="transition-colors hover:text-foreground/70">Scheduling</a>
            <a href="#portal" className="transition-colors hover:text-foreground/70">Portal</a>
            <a href="#pricing" className="transition-colors hover:text-foreground/70">Pricing</a>
            <Link to="/parent" className="transition-colors hover:text-foreground/70">Portal login</Link>
            <Link to="/dashboard" className="transition-colors hover:text-foreground/70">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
