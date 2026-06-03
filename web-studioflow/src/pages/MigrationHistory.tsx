import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Download,
  FileSpreadsheet,
  RefreshCcw,
  RotateCcw,
  Sparkles,
  UserRound,
  Users,
  BookOpen,
} from "lucide-react";

import { useMigration } from "@/data/migrationStore";
import type { ImportJob } from "@/data/migrationTypes";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, typeof Users> = {
  students: Users,
  classes: BookOpen,
  instructors: UserRound,
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function JobCard({ job, onRollback }: { job: ImportJob; onRollback: (id: string) => void }) {
  const Icon = CATEGORY_ICONS[job.category] ?? FileSpreadsheet;
  const successCount = job.importedRows;
  const skippedCount = job.skippedRows;

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 transition-all hover:shadow-soft">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose/10 text-rose">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold capitalize">{job.category}</p>
            <p className="text-xs text-muted-foreground">{job.fileName}</p>
          </div>
        </div>

        {/* Rollback button */}
        {job.snapshot && (
          <button
            onClick={() => onRollback(job.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
          >
            <RotateCcw className="h-3 w-3" />
            Rollback
          </button>
        )}
        {!job.snapshot && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Rolled back
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-success/5 px-2.5 py-1.5 text-center">
          <p className="text-sm font-bold text-success">{successCount}</p>
          <p className="text-[10px] text-muted-foreground">Imported</p>
        </div>
        <div className="rounded-lg bg-muted px-2.5 py-1.5 text-center">
          <p className="text-sm font-bold text-muted-foreground">{skippedCount}</p>
          <p className="text-[10px] text-muted-foreground">Skipped</p>
        </div>
        <div
          className={cn(
            "rounded-lg px-2.5 py-1.5 text-center",
            job.errorCount > 0 ? "bg-destructive/5" : "bg-muted",
          )}
        >
          <p
            className={cn(
              "text-sm font-bold",
              job.errorCount > 0 ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {job.errorCount}
          </p>
          <p className="text-[10px] text-muted-foreground">Errors</p>
        </div>
      </div>

      {/* Timestamp */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {job.completedAt ? formatDate(job.completedAt) : "In progress"}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {job.totalRows} rows
        </span>
      </div>
    </div>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-muted/60">
        <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">No imports yet</h3>
      <p className="mb-6 text-sm text-muted-foreground">
        Your import history will appear here once you start migrating data.
      </p>
      <button
        onClick={onStart}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lift transition hover:opacity-90"
      >
        <Download className="h-4 w-4" />
        Start your first import
      </button>
    </div>
  );
}

function WhiteGloveCTA() {
  return (
    <div className="mt-10 rounded-2xl border border-border/60 bg-gradient-to-br from-rose/5 to-amber-100 p-6">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-rose" />
        <p className="text-sm font-semibold">Need help migrating your studio?</p>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Send us your spreadsheet exports from Jackrabbit, Mindbody, WellnessLiving,
        DanceStudio-Pro, or Google Sheets. We'll help move your data across.
      </p>
      <button className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background px-4 py-2 text-xs font-medium transition hover:bg-secondary">
        Contact Support
      </button>
    </div>
  );
}

function MigrationHistoryInner() {
  const { history, rollbackImport } = useMigration();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate("/migration")}
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Migration Assistant
          </button>
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Import History
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review past imports and roll back if needed.
          </p>
        </div>
        <button
          onClick={() => navigate("/migration")}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          New Import
        </button>
      </div>

      {history.length === 0 ? (
        <EmptyState onStart={() => navigate("/migration")} />
      ) : (
        <div className="space-y-3">
          {history.map((job) => (
            <JobCard key={job.id} job={job} onRollback={rollbackImport} />
          ))}
        </div>
      )}

      <WhiteGloveCTA />
    </div>
  );
}

export default function MigrationHistory() {
  return <MigrationHistoryInner />;
}
