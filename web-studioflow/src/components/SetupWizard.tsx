import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Check,
  GraduationCap,
  Megaphone,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { useStudio } from "@/data/store";
import type { Vertical } from "@/data/types";
import { ALL_VERTICALS, VERTICAL_LABELS } from "@/data/terminology";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const STEPS = [
  { key: "welcome", label: "Welcome", icon: Zap },
  { key: "profile", label: "Studio profile", icon: Building2 },
  { key: "staff", label: "Add instructors", icon: GraduationCap },
  { key: "classes", label: "Add classes", icon: Users },
  { key: "invite", label: "Invite families", icon: Megaphone },
  { key: "done", label: "Ready", icon: Check },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

interface SetupWizardProps {
  onComplete: () => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const { studio, updateStudio } = useStudio();
  const navigate = useNavigate();
  const [step, setStep] = useState<StepKey>("welcome");
  const [studioName, setStudioName] = useState(studio.name);
  const [studioCity, setStudioCity] = useState(studio.city);
  const [studioVertical, setStudioVertical] = useState<Vertical>(studio.vertical);

  const currentIndex = STEPS.findIndex((s) => s.key === step);

  const handleComplete = async () => {
    updateStudio({
      name: studioName || "My Studio",
      city: studioCity,
      vertical: studioVertical,
    });

    // Persist to Supabase if authenticated
    try {
      await supabase.from("studios").upsert({
        id: studio.id,
        name: studioName || "My Studio",
        city: studioCity,
        vertical: studioVertical,
        owner_id: "", // Will be set by the authenticated user via RLS
      });
    } catch { /* ignore */ }

    toast.success("Studio setup complete! Welcome to StudioFlow.");
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 py-12">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-muted-foreground">
              Step {currentIndex + 1} of {STEPS.length}
            </p>
            <p className="text-sm font-medium text-rose">
              {STEPS[currentIndex].label}
            </p>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-rose transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="animate-float-up">
          {step === "welcome" && (
            <div className="text-center py-8">
              <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-rose/10 text-rose">
                <Zap className="h-10 w-10" />
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-tight mb-4">
                Welcome to StudioFlow
              </h1>
              <p className="mx-auto max-w-md text-base text-muted-foreground leading-relaxed">
                Let's set up your studio in a few minutes. Classes, students, payments, waivers — all in one beautiful place.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {[
                  { icon: Users, label: "Class management" },
                  { icon: Megaphone, label: "Family coordination" },
                  { icon: Building2, label: "Multi-vertical support" },
                ].map((f) => (
                  <span key={f.label} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
                    <f.icon className="h-4 w-4 text-rose" />
                    {f.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {step === "profile" && (
            <div className="space-y-6 py-4">
              <h2 className="font-display text-2xl font-semibold tracking-tight">Tell us about your studio</h2>
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Studio name</span>
                  <input
                    value={studioName}
                    onChange={(e) => setStudioName(e.target.value)}
                    placeholder="Your studio name"
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">City</span>
                  <input
                    value={studioCity}
                    onChange={(e) => setStudioCity(e.target.value)}
                    placeholder="City, State"
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Studio type</span>
                  <select
                    value={studioVertical}
                    onChange={(e) => setStudioVertical(e.target.value as Vertical)}
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
                  >
                    {ALL_VERTICALS.map((v) => (
                      <option key={v} value={v}>{VERTICAL_LABELS[v]}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This adjusts labels throughout the app — Student/Athlete, Instructor/Coach, etc.
                  </p>
                </label>
              </div>
            </div>
          )}

          {step === "staff" && (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-plum/10 text-plum">
                <GraduationCap className="h-8 w-8" />
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight mb-3">Add your instructors</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                You can add instructors now or anytime from the dashboard. Each instructor can have their own pay rate, styles, and schedule.
              </p>
              <button
                onClick={() => navigate("/instructors")}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-secondary"
              >
                Go to instructors
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === "classes" && (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-teal/10 text-teal">
                <Users className="h-8 w-8" />
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight mb-3">Build your class schedule</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Create classes, set capacities, assign instructors, and open registration. You can also import from a spreadsheet.
              </p>
              <div className="mt-6 flex justify-center gap-3 flex-wrap">
                <button
                  onClick={() => navigate("/classes")}
                  className="inline-flex items-center gap-2 rounded-full bg-rose px-5 py-2.5 text-sm font-semibold text-rose-foreground"
                >
                  Add classes
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate("/migration")}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-secondary"
                >
                  Import from spreadsheet
                </button>
              </div>
            </div>
          )}

          {step === "invite" && (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gold/15 text-gold">
                <Megaphone className="h-8 w-8" />
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight mb-3">Invite families</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Share your registration link with families. They can create accounts, enroll in classes, sign waivers, and manage payments — all from the parent portal.
              </p>
              <button
                onClick={() => toast.success("Registration link: /parent/register")}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose px-5 py-2.5 text-sm font-semibold text-rose-foreground"
              >
                Copy registration link
              </button>
            </div>
          )}

          {step === "done" && (
            <div className="text-center py-8">
              <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-success/10 text-success">
                <Check className="h-10 w-10" />
              </div>
              <h2 className="font-display text-3xl font-semibold tracking-tight mb-3">You're all set!</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Your studio is ready. You can always add more instructors, classes, or import data later.
              </p>
              <button
                onClick={handleComplete}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-rose px-6 py-3 text-sm font-semibold text-rose-foreground shadow-lift"
              >
                Go to dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        {step !== "done" && (
          <div className="mt-10 flex items-center justify-between">
            <button
              onClick={() => {
                const prev = STEPS[currentIndex - 1];
                if (prev) setStep(prev.key);
              }}
              disabled={currentIndex === 0}
              className="text-sm font-medium text-muted-foreground disabled:opacity-30 hover:text-foreground"
            >
              Back
            </button>
            <button
              onClick={() => {
                const next = STEPS[currentIndex + 1];
                if (next) setStep(next.key);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-rose px-5 py-2.5 text-sm font-semibold text-rose-foreground shadow-soft hover:opacity-90"
            >
              {currentIndex === STEPS.length - 2 ? "Finish" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
