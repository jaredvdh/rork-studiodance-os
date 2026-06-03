import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CreditCard,
  FileSignature,
  Megaphone,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { useStudio, useTerminology } from "@/data/store";

const features = [
  { icon: CalendarDays, title: "Class & schedule management", body: "Build recurring schedules, set capacities, manage waitlists and assign teachers in seconds." },
  { icon: Users, title: "Caregiver coordination", body: "Multiple caregivers per family, granular permissions, pickup authorization, and emergency contacts." },
  { icon: CreditCard, title: "Payments (Stripe coming soon)", body: "Track tuition, recital fees, and invoices. Full Stripe integration on the roadmap." },
  { icon: Megaphone, title: "Announcements", body: "Studio-wide, per-class or emergency messages with delivery rules respecting caregiver permissions." },
  { icon: FileSignature, title: "Digital waivers", body: "Liability, media and medical forms signed online with timestamps and signature records." },
  { icon: Sparkles, title: "Recital tools", body: "Generate rosters, running orders, and print-ready programmes from enrolled classes." },
];

const steps = [
  { n: "01", title: "Create your studio", body: "Add your branding, rooms and staff in under five minutes." },
  { n: "02", title: "Open registration", body: "Share your public class page and let families enroll themselves." },
  { n: "03", title: "Run the show", body: "Track attendance, collect tuition and prep recitals — all in one place." },
];

export default function Landing() {
  const { studio } = useStudio();
  const term = useTerminology();
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-base font-semibold text-primary-foreground overflow-hidden">
              {studio.logoUrl ? (
                <img src={studio.logoUrl} alt={studio.name} className="h-full w-full object-cover" />
              ) : (
                studio.initials
              )}
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">{studio.name}</span>
          </Link>
          <nav className="ml-auto hidden items-center gap-8 text-sm font-medium text-foreground/70 md:flex">
            <a href="#features" className="transition hover:text-foreground">Features</a>
            <a href="#how" className="transition hover:text-foreground">How it works</a>
            <a href="#pricing" className="transition hover:text-foreground">Pricing</a>
          </nav>
          <div className="ml-auto flex items-center gap-3 md:ml-8">
            <Link to="/parent" className="hidden text-sm font-medium text-foreground/70 transition hover:text-foreground sm:block">
              Parent/Student Portal
            </Link>
            <Link to="/dashboard" className="hidden text-sm font-medium text-foreground/70 transition hover:text-foreground sm:block">
              Log in
            </Link>
            <Link
              to="/dashboard"
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90"
            >
              Open dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-rose/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-plum/15 blur-3xl" />
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[1.1fr_0.9fr] md:py-28">
          <div className="animate-float-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground/70">
              <span className="h-1.5 w-1.5 rounded-full bg-rose" />
              The operating system for {term.verticalAdjective} studios
            </span>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-balance md:text-6xl">
              Run your whole studio from one beautiful place.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
              Classes, students, payments, waivers and recitals — StudioFlow replaces the spreadsheets, group chats and paper forms with one calm, premium dashboard.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/dashboard"
                className="group inline-flex items-center gap-2 rounded-full bg-rose px-6 py-3 text-sm font-semibold text-rose-foreground shadow-lift transition hover:opacity-90"
              >
                Start free trial
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-secondary"
              >
                View live demo
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Built for modern studios. Early access available now.
            </p>
          </div>

          {/* Hero preview card — real feature highlight */}
          <div className="animate-float-up [animation-delay:120ms]">
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-lift">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Family coordination</p>
              <p className="mt-1 font-display text-2xl font-semibold tracking-tight">Caregivers &amp; permissions</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Every caregiver gets their own login. Granular permissions for billing, medical notes, pickup authorization, and emergency communication.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { k: "Caregivers", v: "2+", icon: Users },
                  { k: "Students", v: "Unlimited", icon: Users },
                  { k: "Permissions", v: "Granular", icon: Sparkles },
                ].map((s) => (
                  <div key={s.k} className="rounded-xl bg-secondary p-3">
                    <s.icon className="h-4 w-4 text-muted-foreground mb-1" />
                    <p className="font-display text-lg font-semibold">{s.v}</p>
                    <p className="text-xs text-muted-foreground">{s.k}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-rose">Everything in one place</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">Built for the way studios actually work.</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-rose/10 text-rose">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-4xl font-semibold tracking-tight">Up and running by Monday.</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n}>
                <span className="font-display text-5xl font-semibold text-rose/30">{s.n}</span>
                <h3 className="mt-3 font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / CTA */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-24">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground shadow-lift">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-rose/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-plum/30 blur-3xl" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold tracking-tight text-balance md:text-5xl">
              Give your studio the software it deserves.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-primary-foreground/70">
              Free 30-day trial. No card required. Cancel anytime.
            </p>
            <Link
              to="/dashboard"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-rose px-7 py-3.5 text-sm font-semibold text-rose-foreground shadow-lift transition hover:opacity-90"
            >
              Open your dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} StudioFlow. Made for studios like {studio.name}.</p>
          <div className="flex gap-6">
            <a href="#features" className="transition hover:text-foreground">Features</a>
            <a href="#pricing" className="transition hover:text-foreground">Pricing</a>
            <Link to="/dashboard" className="transition hover:text-foreground">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
