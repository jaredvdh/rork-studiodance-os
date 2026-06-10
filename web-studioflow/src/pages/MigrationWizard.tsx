import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  FileSpreadsheet,
  FileUp,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  Zap,
} from "lucide-react";

import type {
  ImportCategory,
  ParsedRow,
  UploadedFile,
  ImportError,
  MatchReason,
} from "@/data/migrationTypes";
import { parseFile } from "@/lib/importer";
import {
  autoMapFields,
  applyMappings,
  validateMappings,
  getFieldDefs,
} from "@/lib/fieldMapper";
import { validateImport } from "@/lib/validation";
import { guessDataType } from "@/data/providerData";
import { useMigration } from "@/data/migrationStore";
import { useTeachers } from "@/data/store";
import {
  classes as demoClasses,
  students as demoStudents,
  teachers as demoTeachers,
} from "@/data/demo";
import { cn } from "@/lib/utils";

/* ───────────────────────────────────────────────────────────────────
   Step indicator (3 steps)
   ─────────────────────────────────────────────────────────────────── */

const STEPS = ["Upload", "Review", "Done"] as const;
type Step = 0 | 1 | 2;

function StepBar({ step }: { step: Step }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-1">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-1">
          <div
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold transition-all duration-300",
              i === step && "bg-primary text-primary-foreground shadow-lift scale-110",
              i < step && "bg-success text-white",
              i > step && "bg-muted text-muted-foreground",
            )}
          >
            {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "h-0.5 w-6 rounded-full transition-colors sm:w-10",
                i < step ? "bg-success" : "bg-muted",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────
   Type badge helpers
   ─────────────────────────────────────────────────────────────────── */

const TYPE_LABELS: Record<string, string> = {
  students: "Students / Members",
  caregivers: "Parents / Caregivers",
  classes: "Classes / Sessions",
  instructors: "Instructors / Staff",
  enrolments: "Enrolments",
  payments: "Payments / Balances",
  costumes: "Costumes",
  attendance: "Attendance",
};

const TYPE_COLORS: Record<string, string> = {
  students: "bg-blue-100 text-blue-800 border-blue-200",
  caregivers: "bg-rose/10 text-rose border-rose/20",
  classes: "bg-emerald-100 text-emerald-800 border-emerald-200",
  instructors: "bg-purple-100 text-purple-800 border-purple-200",
  enrolments: "bg-amber-100 text-amber-800 border-amber-200",
  payments: "bg-teal-100 text-teal-800 border-teal-200",
  costumes: "bg-pink-100 text-pink-800 border-pink-200",
  attendance: "bg-sky-100 text-sky-800 border-sky-200",
};

/* ───────────────────────────────────────────────────────────────────
   Match reason helpers
   ─────────────────────────────────────────────────────────────────── */

const MATCH_CONFIG: Record<
  Exclude<MatchReason, null>,
  { label: string; className: string }
> = {
  exact: { label: "Exact", className: "bg-success/10 text-success border-success/30" },
  synonym: { label: "Synonym", className: "bg-primary/10 text-primary border-primary/30" },
  fuzzy: { label: "Fuzzy", className: "bg-amber-100 text-amber-800 border-amber-200" },
  manual: { label: "Manual", className: "bg-muted text-muted-foreground border-border/50" },
};

function MatchBadge({ reason }: { reason: MatchReason }) {
  if (!reason) return null;
  const cfg = MATCH_CONFIG[reason];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        cfg.className,
      )}
    >
      {reason === "exact" && <Check className="h-2.5 w-2.5" />}
      {reason === "synonym" && <Sparkles className="h-2.5 w-2.5" />}
      {reason === "fuzzy" && <Search className="h-2.5 w-2.5" />}
      {cfg.label}
    </span>
  );
}

/* ───────────────────────────────────────────────────────────────────
   File parsing helpers
   ─────────────────────────────────────────────────────────────────── */

function createUploadedFile(
  file: File,
  fileName: string,
  headers: string[],
  rows: ParsedRow[],
  sheetName?: string,
): UploadedFile {
  const detectedType = guessDataType(headers);
  const sampleRows = rows.slice(0, 5).map((r) => r.raw);
  const rawMappings = autoMapFields(headers, sampleRows, detectedType);
  const mappings = validateMappings(rawMappings, sampleRows);
  const mappedRows = applyMappings(rows, mappings);

  return {
    id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    file,
    fileName: sheetName ? `${fileName} [${sheetName}]` : fileName,
    fileSize: file.size,
    rowCount: rows.length,
    headers,
    detectedType,
    rows,
    mappings,
    mappedRows,
    errors: [],
  };
}

/* ───────────────────────────────────────────────────────────────────
   Main component
   ─────────────────────────────────────────────────────────────────── */

export default function MigrationWizard() {
  const navigate = useNavigate();
  const migrationCtx = useMigration();
  const teachersCtx = useTeachers();

  const [step, setStep] = useState<Step>(0);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragover, setDragover] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  /* ── Step 0: File upload with auto-detection ──────────────────── */

  const handleFiles = useCallback(async (newFiles: File[]) => {
    setLoading(true);
    try {
      const parsed: UploadedFile[] = [];
      for (const file of newFiles) {
        const result = await parseFile(file);
        for (const sheet of result.sheets) {
          if (sheet.rowCount > 0) {
            const label =
              result.sheets.length > 1
                ? `${result.fileName} [${sheet.name}]`
                : result.fileName;
            parsed.push(
              createUploadedFile(file, label, sheet.headers, sheet.rows, sheet.name),
            );
          }
        }
      }
      setFiles((prev) => [...prev, ...parsed]);
    } catch (err) {
      console.error("Failed to parse file:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const changeFileType = useCallback((id: string, newType: ImportCategory) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const sampleRows = f.rows.slice(0, 5).map((r) => r.raw);
        const rawMappings = autoMapFields(f.headers, sampleRows, newType);
        const mappings = validateMappings(rawMappings, sampleRows);
        const mappedRows = applyMappings(f.rows, mappings);
        return { ...f, detectedType: newType, mappings, mappedRows, errors: [] };
      }),
    );
  }, []);

  /* ── Step 1: Field mapping adjustments ────────────────────────── */

  const updateMapping = useCallback(
    (fileId: string, col: string, targetField: string | null) => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== fileId) return f;
          const mappings = f.mappings.map((m) =>
            m.spreadsheetColumn === col
              ? {
                  ...m,
                  targetField,
                  confidence: targetField === null ? 0 : 50,
                  matchReason: (targetField === null ? null : "manual") as MatchReason,
                }
              : m,
          );
          const mappedRows = applyMappings(f.rows, mappings);
          return { ...f, mappings, mappedRows, errors: [] };
        }),
      );
    },
    [],
  );

  const remapFile = useCallback((fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        const category = f.detectedType ?? "students";
        const sampleRows = f.rows.slice(0, 5).map((r) => r.raw);
        const rawMappings = autoMapFields(f.headers, sampleRows, category);
        const mappings = validateMappings(rawMappings, sampleRows);
        const mappedRows = applyMappings(f.rows, mappings);
        return { ...f, mappings, mappedRows, errors: [] };
      }),
    );
  }, []);

  /* ── Import ────────────────────────────────────────────────────── */

  const handleImport = useCallback(() => {
    setImporting(true);

    // Run validation first
    setFiles((prev) =>
      prev.map((f) => {
        const ctx = {
          existingStudents: [...demoStudents, ...migrationCtx.importedStudents],
          existingClasses: [...demoClasses, ...migrationCtx.importedClasses],
          existingTeachers: [
            ...demoTeachers,
            ...migrationCtx.importedTeachers,
            ...teachersCtx.teachers,
          ],
          mappedRows: f.mappedRows,
          category: f.detectedType ?? "students",
          mappings: f.mappings,
        };
        const errors = validateImport(ctx);
        return { ...f, errors };
      }),
    );

    setTimeout(() => {
      let imported = 0;
      let skipped = 0;

      setFiles((prev) => {
        for (const f of prev) {
          imported += f.rowCount - f.errors.filter((e) => e.severity === "error").length;
          skipped += f.errors.filter((e) => e.severity === "error").length;
        }
        return prev;
      });

      setImportedCount(imported);
      setSkippedCount(skipped);
      setImporting(false);
      setStep(2);
    }, 1000);
  }, [migrationCtx, teachersCtx]);

  const handleReset = useCallback(() => {
    setStep(0);
    setFiles([]);
    setImportedCount(0);
    setSkippedCount(0);
  }, []);

  /* ── Confidence summary ────────────────────────────────────────── */

  const totalRows = files.reduce((s, f) => s + f.rowCount, 0);
  const totalMapped = files.reduce(
    (s, f) => s + f.mappings.filter((m) => m.targetField).length,
    0,
  );
  const totalColumns = files.reduce((s, f) => s + f.headers.length, 0);

  return (
    <div className="mx-auto max-w-3xl py-8">
      <StepBar step={step} />

      {/* ================================================================
          STEP 0 — Upload
          ================================================================ */}
      {step === 0 && (
        <>
          <div className="mb-10 text-center">
            <h1 className="mb-2 font-display text-3xl font-semibold tracking-tight text-foreground">
              Import your data
            </h1>
            <p className="text-sm text-muted-foreground">
              Drop a spreadsheet — we'll figure out what's inside and map it automatically.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragover(true);
            }}
            onDragLeave={() => setDragover(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragover(false);
              const dropped = Array.from(e.dataTransfer.files);
              if (dropped.length) handleFiles(dropped);
            }}
            onClick={() => {
              const input = document.getElementById("migration-file-input") as HTMLInputElement;
              input?.click();
            }}
            className={cn(
              "relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all",
              dragover
                ? "border-primary bg-primary/5"
                : "border-border/60 bg-card hover:border-primary/40",
            )}
          >
            <input
              id="migration-file-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              multiple
              className="hidden"
              onChange={(e) => {
                const selected = Array.from(e.target.files ?? []);
                if (selected.length) handleFiles(selected);
                (e.target as HTMLInputElement).value = "";
              }}
            />

            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">
                  Analysing your spreadsheet…
                </p>
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center gap-3">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose/10">
                  <FileUp className="h-8 w-8 text-rose" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Drop your spreadsheet here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  CSV, XLSX, or XLS — we auto-detect students, classes, instructors & more
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose/10">
                  <FileUp className="h-8 w-8 text-rose" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Drop more files or click to add
                </p>
                <p className="text-xs text-muted-foreground">
                  {files.length} file{files.length !== 1 ? "s" : ""} uploaded
                </p>
              </div>
            )}
          </div>

          {/* File cards */}
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Detected data ({files.length} file{files.length !== 1 ? "s" : ""})
              </p>
              {files.map((f) => {
                const mappedCount = f.mappings.filter((m) => m.targetField).length;
                return (
                  <div
                    key={f.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose/10 text-rose">
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{f.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {f.rowCount} rows · {f.headers.length} columns ·{" "}
                          {mappedCount} auto-mapped
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                          TYPE_COLORS[f.detectedType ?? "students"] ??
                            "bg-muted text-muted-foreground border-border/50",
                        )}
                      >
                        {TYPE_LABELS[f.detectedType ?? "students"] ?? "Data"}
                      </span>

                      <select
                        value={f.detectedType ?? "students"}
                        onChange={(e) =>
                          changeFileType(f.id, e.target.value as ImportCategory)
                        }
                        className="rounded-lg border border-border bg-background px-2 py-1 text-[10px]"
                      >
                        {Object.entries(TYPE_LABELS).map(([id, label]) => (
                          <option key={id} value={id}>
                            {label}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(f.id);
                        }}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Continue CTA */}
          {files.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lift transition hover:opacity-90"
              >
                Review &amp; confirm
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* ================================================================
          STEP 1 — Review mappings & import
          ================================================================ */}
      {step === 1 && (
        <>
          <div className="mb-8 text-center">
            <h1 className="mb-2 font-display text-3xl font-semibold tracking-tight text-foreground">
              Review your import
            </h1>
            <p className="text-sm text-muted-foreground">
              {files.length} file{files.length !== 1 ? "s" : ""} · {totalRows} rows ·{" "}
              {totalMapped} of {totalColumns} columns auto-mapped
            </p>
          </div>

          {files.map((f, fi) => (
            <div
              key={f.id}
              className={cn(fi > 0 && "mt-10")}
            >
              {/* File header */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-rose" />
                  <h2 className="font-semibold text-foreground">{f.fileName}</h2>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                    TYPE_COLORS[f.detectedType ?? "students"] ??
                      "bg-muted text-muted-foreground",
                  )}
                >
                  {TYPE_LABELS[f.detectedType ?? "students"] ?? "Data"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {f.rowCount} rows · {f.mappings.filter((m) => m.targetField).length}{" "}
                  columns mapped
                </span>
                <button
                  onClick={() => remapFile(f.id)}
                  className="ml-auto inline-flex items-center gap-1 rounded-lg border border-border/60 bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-secondary"
                >
                  <Sparkles className="h-3 w-3" /> Re-map
                </button>
              </div>

              {/* Mapping table */}
              <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
                <div className="grid grid-cols-[1fr_60px_1fr] items-center gap-2 border-b border-border/40 bg-muted/30 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Your column</span>
                  <span className="text-center">Match</span>
                  <span>StudioFlow field</span>
                </div>

                {f.mappings.map((m) => {
                  const defs = getFieldDefs(f.detectedType ?? "students");
                  const editingId = `select_${f.id}_${m.spreadsheetColumn}`;

                  return (
                    <div
                      key={m.spreadsheetColumn}
                      className="grid grid-cols-[1fr_60px_1fr] items-center gap-2 border-b border-border/20 px-4 py-3 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{m.spreadsheetColumn}</p>
                        {m.sampleValues.length > 0 && (
                          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                            e.g. {m.sampleValues.slice(0, 2).join(", ")}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-center">
                        {m.targetField ? (
                          <MatchBadge reason={m.matchReason} />
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </div>

                      <select
                        id={editingId}
                        value={m.targetField ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateMapping(f.id, m.spreadsheetColumn, val || null);
                        }}
                        className={cn(
                          "w-full rounded-lg border px-2 py-1.5 text-xs",
                          m.targetField
                            ? "border-success/40 bg-success/5 text-success"
                            : "border-destructive/30 bg-destructive/5 text-destructive",
                        )}
                      >
                        <option value="">— Skip column —</option>
                        {defs.map((d) => (
                          <option key={d.field} value={d.field}>
                            {d.label} {d.required ? "*" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              {/* Preview toggle */}
              <details className="mt-3 group rounded-xl border border-border/40 bg-card">
                <summary className="flex cursor-pointer items-center gap-2 px-4 py-2.5 text-xs font-medium text-muted-foreground">
                  <Search className="h-3.5 w-3.5" />
                  Preview first 3 rows
                  <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="overflow-x-auto px-4 pb-3">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-border/30">
                        {f.headers.map((h) => (
                          <th
                            key={h}
                            className="whitespace-nowrap px-2 py-1 text-left font-medium text-muted-foreground"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {f.rows.slice(0, 3).map((row) => (
                        <tr
                          key={row.index}
                          className="border-b border-border/15 last:border-b-0"
                        >
                          {f.headers.map((h) => (
                            <td
                              key={h}
                              className="max-w-[120px] truncate whitespace-nowrap px-2 py-1"
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
            </div>
          ))}

          {/* Bottom actions */}
          <div className="mt-10 flex items-center justify-between border-t border-border/40 pt-6">
            <button
              onClick={() => setStep(0)}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              onClick={handleImport}
              disabled={importing}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-lift transition",
                importing
                  ? "cursor-wait bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:opacity-90",
              )}
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  Import {totalRows} record{totalRows !== 1 ? "s" : ""}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* ================================================================
          STEP 2 — Done
          ================================================================ */}
      {step === 2 && (
        <div className="text-center">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-success/10">
            <Check className="h-10 w-10 text-success" />
          </div>

          <h1 className="mb-2 font-display text-3xl font-semibold tracking-tight text-foreground">
            Import complete
          </h1>
          <p className="mb-10 text-sm text-muted-foreground">
            {importedCount} record{importedCount !== 1 ? "s" : ""} imported
            {skippedCount > 0 && ` · ${skippedCount} skipped`}
          </p>

          {/* Per-file summary */}
          <div className="mb-10 grid gap-2 sm:grid-cols-2">
            {files.map((f) => (
              <div
                key={f.id}
                className="rounded-xl border border-border/60 bg-card p-3 text-left"
              >
                <p className="truncate text-xs font-semibold">
                  {TYPE_LABELS[f.detectedType ?? "students"] ?? "Data"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {f.rowCount} records from {f.fileName}
                </p>
              </div>
            ))}
          </div>

          {/* Next steps */}
          <div className="space-y-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lift transition hover:opacity-90"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate("/students")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-card px-6 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              Review students
            </button>
            <button
              onClick={() => navigate("/classes")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-card px-6 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              Review classes
            </button>
            <button
              onClick={handleReset}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-card px-6 py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
            >
              Import more data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
