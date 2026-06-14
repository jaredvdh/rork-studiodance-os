import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Beaker,
  Check,
  Copy,
  FlaskConical,
  Loader2,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ALL_VERTICALS, VERTICAL_LABELS, getTerminology } from "@/data/terminology";
import type { Vertical } from "@/data/types";
import { createTestStudio, signInTestAccount, type CreateTestStudioResult } from "@/lib/testStudio";

const VERTICAL_BLURB: Record<Vertical, string> = {
  dance: "Ballet, jazz, tap & hip hop classes, children linked to parents, recital & costume data.",
  crossfit: "WOD schedule, adult members, coaches, membership invoices, fitness waivers.",
  yoga: "Adult members, class packs, instructors, health/intake notes.",
  gym: "Strength & conditioning classes, adult members, trainers, membership billing.",
  martial_arts: "Belt levels, youth & adult students linked to parents, grading & sparring classes.",
  music_school: "1:1 lessons, instruments, students linked to parents, recital media consent.",
  swimming: "Learn to swim, squad training, stroke correction, carnivals & competition prep.",
  pilates: "Reformer & mat classes, clinical programs, prenatal sessions & client management.",
  gymnastics: "Recreational to competitive, tumbling, acrobatics, displays & squad management.",
  cheer: "All stars, school cheer, tumbling & stunting programs, competition management.",
};

export default function Sandbox() {
  const navigate = useNavigate();
  const [vertical, setVertical] = useState<Vertical>("dance");
  const [studioName, setStudioName] = useState("");
  const [seed, setSeed] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateTestStudioResult | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const term = getTerminology(vertical);

  const handleCreate = useCallback(async () => {
    setError(null);
    setIsCreating(true);
    try {
      const res = await createTestStudio({
        vertical,
        studioName: studioName.trim() || `Sandbox ${VERTICAL_LABELS[vertical]}`,
        seed,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create test studio");
    } finally {
      setIsCreating(false);
    }
  }, [vertical, studioName, seed]);

  const enterDashboard = useCallback(() => {
    // Admin is already signed in by createTestStudio. Hard reload so the auth
    // + studio providers pick up the fresh native Supabase session.
    window.location.href = "/dashboard";
  }, []);

  const enterPortal = useCallback(async () => {
    if (!result?.portal) return;
    setPortalLoading(true);
    try {
      const { role } = await signInTestAccount(result.portal.email, result.portal.password, result.portal.role);
      window.location.href = role === "studio_admin" ? "/dashboard" : "/parent";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign into portal");
      setPortalLoading(false);
    }
  }, [result]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-teal-50 via-cream to-emerald-50 px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-emerald-200/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {/* Header */}
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-teal-100">
            <FlaskConical className="h-7 w-7 text-teal-700" />
          </div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-teal-300/70 bg-teal-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-800">
            <Beaker className="h-3 w-3" /> Sandbox · Test mode
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Create a test studio
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Spins up a real, Supabase-backed studio so you can test the full product end-to-end.
            Everything is clearly marked <strong>TEST</strong> and can be deleted from Settings at any time.
          </p>
        </div>

        {result ? (
          <ResultPanel
            result={result}
            onEnterDashboard={enterDashboard}
            onEnterPortal={enterPortal}
            portalLoading={portalLoading}
          />
        ) : (
          <div className="rounded-2xl border border-teal-200/70 bg-white/85 p-6 shadow-soft backdrop-blur-sm">
            {/* Business type */}
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Business type
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ALL_VERTICALS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVertical(v)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-all",
                    vertical === v
                      ? "border-teal-400 bg-teal-50 ring-1 ring-teal-200"
                      : "border-border/60 bg-white hover:bg-teal-50/50",
                  )}
                >
                  <p className="text-sm font-semibold">{VERTICAL_LABELS[v]}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {term && v === vertical ? `${getTerminology(v).participantPlural} · ${getTerminology(v).classPlural}` : getTerminology(v).participantPlural}
                  </p>
                </button>
              ))}
            </div>
            <p className="mt-3 rounded-lg bg-teal-50/70 px-3 py-2 text-xs text-teal-800">
              {VERTICAL_BLURB[vertical]}
            </p>

            {/* Studio name */}
            <div className="mt-5 space-y-1.5">
              <label htmlFor="studio-name" className="text-sm font-medium">
                Studio name <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="studio-name"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                placeholder={`Sandbox ${VERTICAL_LABELS[vertical]}`}
                className="h-11"
              />
            </div>

            {/* Seed toggle */}
            <button
              type="button"
              onClick={() => setSeed((s) => !s)}
              className="mt-5 flex w-full items-start gap-3 rounded-xl border border-border/60 bg-white p-3.5 text-left transition hover:bg-teal-50/40"
            >
              <span
                className={cn(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition",
                  seed ? "border-teal-500 bg-teal-500 text-white" : "border-border bg-white",
                )}
              >
                {seed && <Check className="h-3.5 w-3.5" />}
              </span>
              <span>
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-teal-600" /> Add sample data
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Seeds realistic {term.classPlural.toLowerCase()}, {term.participantPlural.toLowerCase()},
                  {" "}{term.instructorPlural.toLowerCase()}, invoices (test mode), announcements & a waiver —
                  plus a portal login. Uncheck to go through onboarding manually from a blank studio.
                </span>
              </span>
            </button>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button onClick={() => void handleCreate()} disabled={isCreating} className="mt-5 w-full gap-2">
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
              {isCreating ? "Creating test studio…" : "Create test studio"}
            </Button>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/login" className="font-medium text-teal-700 hover:text-teal-800">
            <ArrowRight className="-mt-0.5 mr-1 inline h-3 w-3" /> Back to sign-in
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ── Result panel: credentials + entry actions ──────────────────────────── */

function ResultPanel({
  result,
  onEnterDashboard,
  onEnterPortal,
  portalLoading,
}: {
  result: CreateTestStudioResult;
  onEnterDashboard: () => void;
  onEnterPortal: () => void;
  portalLoading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-teal-200/70 bg-white/90 p-6 shadow-soft backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100">
          <Check className="h-5 w-5 text-emerald-700" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Test studio ready</h2>
          <p className="text-xs text-muted-foreground">
            {VERTICAL_LABELS[result.vertical]} · {result.seeded ? "sample data added" : "blank — onboarding next"}
          </p>
        </div>
      </div>

      {result.seeded && Object.keys(result.counts).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {Object.entries(result.counts).map(([table, n]) => (
            <span key={table} className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-medium text-teal-700">
              {n} {table.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      <CredentialRow label="Admin login" email={result.admin.email} password={result.admin.password} />
      {result.portal && (
        <CredentialRow
          label={result.portal.role === "member" ? "Member portal login" : "Parent portal login"}
          email={result.portal.email}
          password={result.portal.password}
          note={result.portal.participants.length > 0 ? `Linked to: ${result.portal.participants.join(", ")}` : undefined}
        />
      )}

      <p className="mt-3 text-[11px] text-muted-foreground">
        Save these credentials — you can sign back in from the normal sign-in pages. They use real Supabase
        sessions, so all data is scoped by the same security rules as production.
      </p>

      {result.errors.length > 0 && (
        <details className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <summary className="cursor-pointer font-medium">Seeding completed with {result.errors.length} warning(s)</summary>
          <ul className="mt-1.5 list-disc pl-4">
            {result.errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </details>
      )}

      <div className="mt-5 flex flex-col gap-2.5">
        <Button onClick={onEnterDashboard} className="w-full gap-2">
          Enter admin dashboard <ArrowRight className="h-4 w-4" />
        </Button>
        {result.portal && (
          <Button onClick={onEnterPortal} variant="outline" disabled={portalLoading} className="w-full gap-2">
            {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sign in to {result.portal.role === "member" ? "member" : "parent"} portal
          </Button>
        )}
      </div>
    </div>
  );
}

function CredentialRow({
  label,
  email,
  password,
  note,
}: {
  label: string;
  email: string;
  password: string;
  note?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(`${email} / ${password}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="mt-4 rounded-xl border border-border/60 bg-secondary/30 p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <button onClick={copy} className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 hover:text-teal-800">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-1 break-all font-mono text-xs">{email}</p>
      <p className="font-mono text-xs text-muted-foreground">{password}</p>
      {note && <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>}
    </div>
  );
}
