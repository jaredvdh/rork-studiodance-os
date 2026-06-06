import { useMemo } from "react";
import {
  AlertTriangle,
  Check,
  Download,
  Info,
  Sparkles,
  X,
} from "lucide-react";
import type { ImportError, UploadedFile } from "@/data/migrationTypes";
import { cn } from "@/lib/utils";

interface ValidationPanelProps {
  files: UploadedFile[];
  onAutoFix: () => void;
}

function downloadErrorReport(errors: ImportError[]): void {
  const header = "Row,Field,Severity,Message";
  const rows = errors.map(
    (e) => `${e.row},"${e.field}","${e.severity}","${e.message.replace(/"/g, '""')}"`,
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "studioflow_import_errors.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ValidationPanel({
  files,
  onAutoFix,
}: ValidationPanelProps) {
  const allErrors = useMemo(
    () => files.flatMap((f) => f.errors),
    [files],
  );

  const blockingErrors = useMemo(
    () => allErrors.filter((e) => e.severity === "error"),
    [allErrors],
  );
  const warnings = useMemo(
    () => allErrors.filter((e) => e.severity === "warning"),
    [allErrors],
  );
  const suggestions = useMemo(
    () => allErrors.filter((e) => e.severity === "suggestion"),
    [allErrors],
  );

  const totalRows = useMemo(
    () => files.reduce((sum, f) => sum + f.rowCount, 0),
    [files],
  );
  const cleanRows = useMemo(
    () =>
      totalRows -
      new Set(blockingErrors.map((e) => `${e.row}-${e.field}`)).size,
    [totalRows, blockingErrors],
  );

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-2 text-center font-display text-2xl font-semibold tracking-tight text-foreground">
        Review & fix issues
      </h2>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        We've checked your data for common problems. Fix blocking errors before
        importing.
      </p>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border/70 bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalRows}</p>
          <p className="text-[11px] text-muted-foreground">Total rows</p>
        </div>
        <div className="rounded-2xl border border-success/30 bg-success/5 p-4 text-center">
          <p className="text-2xl font-bold text-success">{cleanRows}</p>
          <p className="text-[11px] text-muted-foreground">Clean rows</p>
        </div>
        <div
          className={cn(
            "rounded-2xl border p-4 text-center",
            blockingErrors.length > 0
              ? "border-destructive/30 bg-destructive/5"
              : "border-border/70 bg-card",
          )}
        >
          <p
            className={cn(
              "text-2xl font-bold",
              blockingErrors.length > 0
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            {blockingErrors.length}
          </p>
          <p className="text-[11px] text-muted-foreground">Issues found</p>
        </div>
      </div>

      {/* Auto-fix button */}
      {allErrors.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            onClick={onAutoFix}
            className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
          >
            <Sparkles className="h-4 w-4 text-rose" />
            Auto-fix common issues (trim, format cleanup)
          </button>
          <button
            onClick={() => downloadErrorReport(allErrors)}
            className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
          >
            <Download className="h-4 w-4" />
            Download error report CSV
          </button>
        </div>
      )}

      {/* Per-file summaries */}
      {files.length > 1 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {files.map((f) => {
            const fErrors = f.errors.filter((e) => e.severity === "error");
            const fWarnings = f.errors.filter((e) => e.severity === "warning");
            return (
              <div
                key={f.id}
                className="rounded-xl border border-border/60 bg-card p-3"
              >
                <p className="truncate text-xs font-semibold">{f.fileName}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {f.rowCount} rows · {fErrors.length} errors · {fWarnings.length}{" "}
                  warnings
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Error list */}
      {allErrors.length > 0 ? (
        <div className="space-y-2">
          {/* Blocking errors */}
          {blockingErrors.map((e, i) => (
            <div
              key={`err-${i}`}
              className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3"
            >
              <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Row {e.row} — {e.field}
                </p>
                <p className="text-xs text-muted-foreground">{e.message}</p>
              </div>
            </div>
          ))}

          {/* Warnings */}
          {warnings.map((w, i) => (
            <div
              key={`warn-${i}`}
              className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-100 p-3"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Row {w.row} — {w.field}
                </p>
                <p className="text-xs text-amber-700">{w.message}</p>
              </div>
            </div>
          ))}

          {/* Suggestions */}
          {suggestions.map((s, i) => (
            <div
              key={`sug-${i}`}
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Row {s.row} — {s.field}
                </p>
                <p className="text-xs text-muted-foreground">{s.message}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-success/30 bg-success/5 p-10 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-success/10">
            <Check className="h-7 w-7 text-success" />
          </div>
          <p className="text-lg font-semibold text-success">
            Everything looks great!
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            No issues found in any uploaded file. You're ready to continue.
          </p>
        </div>
      )}

      {/* Blocking error notice */}
      {blockingErrors.length > 0 && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-sm text-destructive">
            You have {blockingErrors.length} blocking error
            {blockingErrors.length !== 1 ? "s" : ""}. Fix these before
            importing.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Go back to Field Mapping to fix or change data types, or download the
            error report to review offline.
          </p>
        </div>
      )}
    </div>
  );
}
