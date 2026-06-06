import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileSpreadsheet,
  Hash,
  Loader2,
  Search,
  Sparkles,
  HelpCircle,
  Zap,
  Type,
} from "lucide-react";
import type { FieldMapping, MatchReason } from "@/data/migrationTypes";
import { cn } from "@/lib/utils";
import { getFieldDefs } from "@/lib/fieldMapper";

interface FieldMapperProps {
  file: {
    id: string;
    fileName: string;
    detectedType: string | null;
    headers: string[];
    rows: Array<{ index: number; raw: Record<string, string> }>;
    mappings: FieldMapping[];
  };
  onUpdateMapping: (fileId: string, col: string, targetField: string | null) => void;
  onAutoMap: (fileId: string) => void;
  aiLoading: boolean;
}

/* ── Match reason display helpers ────────────────────────────────── */

const MATCH_REASON_CONFIG: Record<Exclude<MatchReason, null>, { label: string; icon: typeof Check; className: string }> = {
  exact: { label: "Exact Match", icon: Check, className: "bg-success/10 text-success border-success/30" },
  synonym: { label: "Synonym Match", icon: Type, className: "bg-primary/10 text-primary border-primary/30" },
  fuzzy: { label: "Fuzzy Match", icon: Search, className: "bg-amber-100 text-amber-800 border-amber-200" },
  manual: { label: "Manual", icon: Hash, className: "bg-muted text-muted-foreground border-border/50" },
};

function getMatchReasonBadge(matchReason: MatchReason) {
  if (!matchReason) return null;
  const config = MATCH_REASON_CONFIG[matchReason];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        config.className,
      )}
      title={config.label}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

/* ── Confidence helpers ──────────────────────────────────────────── */

function getConfidenceClass(confidence: number, matchReason: MatchReason) {
  if (matchReason === "exact") return "bg-success/10 text-success border-success/30";
  if (matchReason === "synonym") return "bg-primary/10 text-primary border-primary/30";
  if (confidence >= 80) return "bg-success/10 text-success border-success/30";
  if (confidence >= 50) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-muted text-muted-foreground border-border/50";
}

function getConfidenceLabel(confidence: number, matchReason: MatchReason) {
  if (matchReason === "exact") return "High";
  if (matchReason === "synonym") return "Good";
  if (confidence >= 80) return "High";
  if (confidence >= 50) return "Medium";
  return "Needs review";
}

/* ── Component ───────────────────────────────────────────────────── */

export default function FieldMapper({
  file,
  onUpdateMapping,
  onAutoMap,
  aiLoading,
}: FieldMapperProps) {
  const [editingCol, setEditingCol] = useState<string | null>(null);

  const category = file.detectedType ?? "students";
  const availableFields = getFieldDefs(category);

  const missingRequired = file.mappings.filter(
    (m) => m.isRequired && !m.targetField,
  );

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-2 text-center font-display text-2xl font-semibold tracking-tight text-foreground">
        Map &quot;{file.fileName}&quot; columns to StudioFlow fields
      </h2>
      <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">
          We&apos;ve matched your columns. Review and adjust any that need attention.
        </p>
        <button
          type="button"
          onClick={() => onAutoMap(file.id)}
          disabled={aiLoading}
          className="inline-flex items-center gap-1.5 rounded-full border border-rose/30 bg-rose/5 px-3 py-1.5 text-xs font-semibold text-rose transition hover:bg-rose/10 disabled:opacity-60"
        >
          {aiLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Remapping…
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" /> AI Auto-Map
            </>
          )}
        </button>
      </div>

      {/* Required fields warning */}
      {missingRequired.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-100 p-3">
          <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              Required fields not mapped
            </p>
            <p className="text-xs text-amber-700">
              {missingRequired.map((m) => m.spreadsheetColumn).join(", ")} — use
              the dropdown to map these
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {file.mappings.length === 0 && (
        <div className="mb-6 rounded-2xl border border-border/50 bg-muted/20 p-10 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-muted/40">
            <FileSpreadsheet className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold text-muted-foreground">
            No columns to map
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            This file doesn&apos;t have any detectable columns. Try uploading a
            different file or check that your CSV has a header row.
          </p>
        </div>
      )}

      {/* Mapping table */}
      {file.mappings.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-border/70 bg-card">
          <div className="hidden grid-cols-[1fr_120px_auto_1fr] items-center gap-3 border-b border-border/60 bg-muted/40 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
            <span>Your column</span>
            <span className="text-center">Match</span>
            <span className="text-center">→</span>
            <span>StudioFlow field</span>
          </div>

          {file.mappings.map((m) => (
            <div
              key={m.spreadsheetColumn}
              className="flex flex-col gap-2 border-b border-border/30 px-4 py-3.5 last:border-b-0 sm:grid sm:grid-cols-[1fr_120px_auto_1fr] sm:items-center sm:gap-3 sm:px-5"
            >
              {/* Source column */}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {m.spreadsheetColumn}
                </p>
                {m.sampleValues.length > 0 && (
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    e.g. {m.sampleValues.slice(0, 2).join(", ")}
                  </p>
                )}
              </div>

              {/* Confidence + match reason badges */}
              <div className="flex flex-wrap items-center gap-1 sm:flex-col sm:items-center">
                {m.targetField && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      getConfidenceClass(m.confidence, m.matchReason),
                    )}
                  >
                    <Zap className="h-2.5 w-2.5" />
                    {getConfidenceLabel(m.confidence, m.matchReason)}
                  </span>
                )}
                {getMatchReasonBadge(m.matchReason)}
              </div>

              {/* Arrow */}
              <div className="hidden sm:flex sm:justify-center">
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </div>

              {/* Target field selector */}
              <div className="relative">
                {editingCol === m.spreadsheetColumn ? (
                  <select
                    value={m.targetField ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateMapping(file.id, m.spreadsheetColumn, val || null);
                      setEditingCol(null);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
                    autoFocus
                    onBlur={() => setEditingCol(null)}
                  >
                    <option value="">— Ignore column —</option>
                    {availableFields.map((f) => (
                      <option key={f.field} value={f.field}>
                        {f.label} {f.required ? " *" : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <button
                    onClick={() => setEditingCol(m.spreadsheetColumn)}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-left text-sm transition",
                      m.targetField
                        ? "border-success/40 bg-success/5 text-success"
                        : "border-destructive/30 bg-destructive/5 text-destructive",
                    )}
                  >
                    {m.targetField
                      ? (availableFields.find((f) => f.field === m.targetField)
                          ?.label ?? m.targetField)
                      : "— Unmapped —"}
                  </button>
                )}
                {m.isRequired && (
                  <span className="mt-0.5 block text-[10px] font-medium text-rose">
                    Required
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Match legend */}
      {file.mappings.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            {getMatchReasonBadge("exact")}
            Column name matched a known field
          </span>
          <span className="inline-flex items-center gap-1">
            {getMatchReasonBadge("synonym")}
            Matched using a synonym or alias
          </span>
          <span className="inline-flex items-center gap-1">
            {getMatchReasonBadge("fuzzy")}
            Best guess — please verify
          </span>
        </div>
      )}

      {/* Data preview */}
      {file.mappings.length > 0 && (
        <details className="group rounded-2xl border border-border/60 bg-card">
          <summary className="flex cursor-pointer items-center gap-2 px-5 py-3 text-sm font-medium text-muted-foreground">
            <Search className="h-4 w-4" />
            Preview first 3 rows
            <ChevronDown className="ml-auto h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="overflow-x-auto px-5 pb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40">
                  {file.headers.map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-2 py-1.5 text-left font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {file.rows.slice(0, 3).map((row) => (
                  <tr
                    key={row.index}
                    className="border-b border-border/20 last:border-b-0"
                  >
                    {file.headers.map((h) => (
                      <td
                        key={h}
                        className="max-w-[150px] truncate whitespace-nowrap px-2 py-1.5"
                      >
                        {row.raw[h] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
