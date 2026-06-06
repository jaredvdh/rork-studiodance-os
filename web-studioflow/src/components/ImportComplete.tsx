import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Clock,
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
        Import complete
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

      {/* White-glove CTA */}
      <div className="mt-10 rounded-2xl border border-border/60 bg-gradient-to-br from-rose/5 to-amber-100 p-5 text-left">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-rose" />
          <p className="text-sm font-semibold">Need help?</p>
        </div>
        <p className="text-xs text-muted-foreground">
          If something doesn't look right, our support team can help. We offer
          free migration assistance on all plans.
        </p>
      </div>
    </div>
  );
}
