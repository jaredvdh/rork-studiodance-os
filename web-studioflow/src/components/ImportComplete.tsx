import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Clock,
  HelpCircle,
  Mail,
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react";
import type { UploadedFile } from "@/data/migrationTypes";

interface ImportCompleteProps {
  files: UploadedFile[];
  importedCount: number;
  skippedCount: number;
  needsReviewCount: number;
  onImportMore: () => void;
}

const LABEL_MAP: Record<string, string> = {
  students: "Students/Members",
  caregivers: "Parents/Caregivers",
  classes: "Classes",
  instructors: "Instructors",
  enrolments: "Enrolments",
  payments: "Payments",
};

export default function ImportComplete({
  files,
  importedCount,
  skippedCount,
  needsReviewCount,
  onImportMore,
}: ImportCompleteProps) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl text-center">
      {/* Success animation */}
      <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-success/10">
        <Check className="h-10 w-10 text-success" />
      </div>

      <h2 className="mb-2 font-display text-3xl font-semibold tracking-tight text-foreground">
        Import complete!
      </h2>
      <p className="mb-8 text-sm text-muted-foreground">
        Your data has been imported successfully. Here's a summary.
      </p>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-success/30 bg-success/5 p-4 text-center">
          <p className="text-2xl font-bold text-success">{importedCount}</p>
          <p className="text-[11px] text-muted-foreground">Imported</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{skippedCount}</p>
          <p className="text-[11px] text-muted-foreground">Skipped</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-100 p-4 text-center">
          <p className="text-2xl font-bold text-amber-800">
            {needsReviewCount}
          </p>
          <p className="text-[11px] text-muted-foreground">Need review</p>
        </div>
      </div>

      {/* Per-type breakdown */}
      <div className="mb-8 grid grid-cols-2 gap-2">
        {files.map((f) => (
          <div
            key={f.id}
            className="rounded-xl border border-border/60 bg-card p-3 text-left"
          >
            <p className="truncate text-xs font-semibold">
              {LABEL_MAP[f.detectedType ?? "students"] ?? "Data"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {f.rowCount} records from {f.fileName}
            </p>
          </div>
        ))}
      </div>

      {/* What happens next? */}
      <div className="mb-8 rounded-2xl border border-border/70 bg-card p-5 text-left">
        <div className="mb-3 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-rose" />
          <h3 className="font-display text-lg font-semibold">What happens next?</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/10 text-[10px] font-bold text-success">
              1
            </span>
            <div>
              <p className="text-sm font-medium">Review imported records</p>
              <p className="text-xs text-muted-foreground">
                Check your students, classes, and instructors on their respective
                pages. Everything is live and ready to use.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/10 text-[10px] font-bold text-success">
              2
            </span>
            <div>
              <p className="text-sm font-medium">Invite families to the portal</p>
              <p className="text-xs text-muted-foreground">
                Caregivers can log in to view schedules, sign waivers, and manage
                their accounts. Send invites from the Students page.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/10 text-[10px] font-bold text-success">
              3
            </span>
            <div>
              <p className="text-sm font-medium">Set up billing (optional)</p>
              <p className="text-xs text-muted-foreground">
                Configure tuition, class fees, and payment schedules from the
                Payments page when you're ready.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/10 text-[10px] font-bold text-success">
              4
            </span>
            <div>
              <p className="text-sm font-medium">Import more data anytime</p>
              <p className="text-xs text-muted-foreground">
                Run the migration wizard again for additional data types or
                updated exports. No limit on imports.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Next actions */}
      <div className="space-y-3">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lift transition hover:opacity-90"
        >
          Go to Dashboard
        </button>
        <button
          onClick={() => navigate("/students")}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-card px-6 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
        >
          <Users className="h-4 w-4" />
          Review students
        </button>
        <button
          onClick={() => navigate("/classes")}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-card px-6 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
        >
          <Clock className="h-4 w-4" />
          Review classes
        </button>
        <button
          onClick={() => navigate("/payments")}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-card px-6 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
        >
          Review billing
        </button>
        <button
          onClick={onImportMore}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-card px-6 py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
        >
          <RotateCcw className="h-4 w-4" />
          Import more data
        </button>
      </div>

      {/* Concierge: send us your export */}
      <div className="mt-10 rounded-2xl border border-border/60 bg-gradient-to-br from-rose/5 to-amber-100 p-5 text-left">
        <div className="mb-1 flex items-center gap-2">
          <Mail className="h-4 w-4 text-rose" />
          <p className="text-sm font-semibold">
            Send us your export — we'll migrate it for you
          </p>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          If you'd rather not go through the wizard, email us your exported CSV
          or Excel files and our team will handle the entire migration — free on
          all plans.
        </p>
        <button className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background px-4 py-2 text-xs font-medium transition hover:bg-secondary">
          <Mail className="h-3.5 w-3.5" />
          Contact Support
        </button>
      </div>

      {/* Need help? */}
      <div className="mt-4 rounded-2xl border border-border/60 bg-muted/20 p-4 text-left">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Something doesn't look right?</p>
        </div>
        <p className="text-xs text-muted-foreground">
          You can roll back this import from the Import History page at any
          time. Visit{" "}
          <button
            onClick={() => navigate("/migration-history")}
            className="underline transition hover:text-foreground"
          >
            Import History
          </button>{" "}
          to review or undo changes.
        </p>
      </div>
    </div>
  );
}
