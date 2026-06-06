import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Briefcase,
  Calendar,
  Check,
  Heart,
  Info,
  Link,
  Play,
  ShieldCheck,
  TrendingUp,
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
  const totalAllRows = fileSummaries.reduce((s, fs) => s + fs.file.rowCount, 0);

  const confidenceScore = useMemo(() => {
    if (totalAllRows === 0) return 0;
    const penalty = totalBlocks * 3 + totalWarns * 0.5;
    return Math.max(0, Math.round(100 - (penalty / totalAllRows) * 100));
  }, [totalAllRows, totalBlocks, totalWarns]);

  const confidenceLabel = useMemo(() => {
    if (confidenceScore >= 95) return "Excellent";
    if (confidenceScore >= 80) return "Good";
    if (confidenceScore >= 60) return "Fair";
    return "Needs attention";
  }, [confidenceScore]);

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

      {/* Confidence score */}
      <div className="mb-6 rounded-2xl border border-border/70 bg-card p-5">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "grid h-12 w-12 shrink-0 place-items-center rounded-full",
                confidenceScore >= 80
                  ? "bg-success/10"
                  : confidenceScore >= 60
                    ? "bg-amber-100"
                    : "bg-destructive/10",
              )}
            >
              <TrendingUp
                className={cn(
                  "h-6 w-6",
                  confidenceScore >= 80
                    ? "text-success"
                    : confidenceScore >= 60
                      ? "text-amber-600"
                      : "text-destructive",
                )}
              />
            </div>
            <div>
              <p className="text-lg font-bold">
                Migration Confidence:{" "}
                <span
                  className={cn(
                    confidenceScore >= 80
                      ? "text-success"
                      : confidenceScore >= 60
                        ? "text-amber-600"
                        : "text-destructive",
                  )}
                >
                  {confidenceLabel}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {totalRecords} clean records ready to import
                {totalBlocks > 0 && ` · ${totalBlocks} blocked`}
                {totalWarns > 0 && ` · ${totalWarns} warnings`}
              </p>
            </div>
          </div>
        </div>
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

      {/* Strong warning before import */}
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Please review before importing
            </p>
            <p className="text-xs text-amber-700">
              Imported records will be added to your studio. You can roll back
              individual imports from the Import History page, but this should be
              treated as a real data change.
            </p>
            {hasBlockingErrors && (
              <p className="mt-2 text-xs font-medium text-destructive">
                {totalBlocks} row{totalBlocks !== 1 ? "s have" : " has"} blocking
                errors and will be skipped.
              </p>
            )}
          </div>
        </div>
      </div>

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
