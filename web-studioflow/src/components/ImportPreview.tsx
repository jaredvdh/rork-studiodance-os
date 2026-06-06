import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Calendar,
  Check,
  Heart,
  Info,
  Link,
  Play,
  Users,
} from "lucide-react";
import type { UploadedFile } from "@/data/migrationTypes";
import { cn } from "@/lib/utils";

interface ImportPreviewProps {
  files: UploadedFile[];
  onConfirm: () => void;
  onBack: () => void;
  hasBlockingErrors: boolean;
}

const ICON_MAP: Record<string, typeof Users> = {
  students: Users,
  caregivers: Heart,
  classes: BookOpen,
  instructors: Briefcase,
  enrolments: Link,
  payments: Calendar,
};

const LABEL_MAP: Record<string, string> = {
  students: "Students / Members",
  caregivers: "Parents / Caregivers",
  classes: "Classes / Sessions",
  instructors: "Instructors / Staff",
  enrolments: "Enrolments",
  payments: "Payments",
};

export default function ImportPreview({
  files,
  onConfirm,
  onBack,
  hasBlockingErrors,
}: ImportPreviewProps) {
  const fileSummaries = files.map((f) => {
    const blockedCount = f.errors.filter((e) => e.severity === "error").length;
    const warnCount = f.errors.filter((e) => e.severity === "warning").length;
    const cleanCount = f.rowCount - blockedCount;
    return {
      file: f,
      typeLabel: LABEL_MAP[f.detectedType ?? "students"] ?? "Data",
      cleanCount,
      blockedCount,
      warnCount,
      Icon: ICON_MAP[f.detectedType ?? "students"] ?? Users,
    };
  });

  const totalRecords = fileSummaries.reduce((s, fs) => s + fs.cleanCount, 0);
  const totalBlocks = fileSummaries.reduce((s, fs) => s + fs.blockedCount, 0);
  const totalWarns = fileSummaries.reduce((s, fs) => s + fs.warnCount, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-2 text-center font-display text-2xl font-semibold tracking-tight text-foreground">
        Import preview
      </h2>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Here's what will be added to your studio. Nothing is imported until you
        confirm.
      </p>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {fileSummaries.map((fs) => (
          <div
            key={fs.file.id}
            className="rounded-2xl border border-border/70 bg-card p-4 text-center"
          >
            <fs.Icon className="mx-auto mb-2 h-5 w-5 text-rose" />
            <p className="text-xl font-bold">{fs.cleanCount}</p>
            <p className="text-[11px] text-muted-foreground">{fs.typeLabel}</p>
            {fs.warnCount > 0 && (
              <p className="mt-1 text-[10px] text-amber-600">
                {fs.warnCount} warning{fs.warnCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Bottom summary */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-success/30 bg-success/5 p-3 text-center">
          <Check className="mx-auto mb-1 h-4 w-4 text-success" />
          <p className="text-lg font-bold text-success">{totalRecords}</p>
          <p className="text-[10px] text-muted-foreground">Ready to import</p>
        </div>
        <div
          className={cn(
            "rounded-xl border p-3 text-center",
            totalBlocks > 0
              ? "border-destructive/30 bg-destructive/5"
              : "border-border/60 bg-muted/20",
          )}
        >
          <Info className="mx-auto mb-1 h-4 w-4 text-destructive" />
          <p
            className={cn(
              "text-lg font-bold",
              totalBlocks > 0 ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {totalBlocks}
          </p>
          <p className="text-[10px] text-muted-foreground">Blocking errors</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-100 p-3 text-center">
          <Info className="mx-auto mb-1 h-4 w-4 text-amber-600" />
          <p className="text-lg font-bold text-amber-800">{totalWarns}</p>
          <p className="text-[10px] text-muted-foreground">Warnings</p>
        </div>
      </div>

      {/* Blocking error notice */}
      {hasBlockingErrors && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-sm font-medium text-destructive">
            Some rows have blocking errors and will be skipped.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Go back to Validation or Field Mapping to fix them, or continue to
            import only clean records.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-card px-5 py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
        >
          Back to mapping
        </button>
        <button
          onClick={onConfirm}
          disabled={hasBlockingErrors}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-lift transition-all",
            hasBlockingErrors
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground hover:opacity-90",
          )}
        >
          {hasBlockingErrors ? (
            <>
              Import clean records only
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Confirm & import
            </>
          )}
        </button>
      </div>

      {hasBlockingErrors && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Fix blocking errors before importing, or go back to clear them.
        </p>
      )}
    </div>
  );
}
