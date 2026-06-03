import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpCircle,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileUp,
  GraduationCap,
  HelpCircle,
  Link,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { useMigration } from "@/data/migrationStore";
import { useTeachers, useStudio } from "@/data/store";
import { IMPORT_TEMPLATES } from "@/data/migrationTemplates";
import { downloadTemplate } from "@/lib/importer";
import { missingRequiredFields } from "@/lib/fieldMapper";
import { aiSuggestMappings } from "@/lib/ai";
import type { ImportCategory, FieldMapping, WizardStep } from "@/data/migrationTypes";
import { cn } from "@/lib/utils";

/* ── Step indicator ───────────────────────────────────────────────── */

const STEP_LABELS: Record<WizardStep, string> = {
  1: "Welcome",
  2: "Choose Data",
  3: "Upload File",
  4: "Map Fields",
  5: "Validate",
  6: "Preview",
  7: "Complete",
};

function StepIndicator({ step }: { step: WizardStep }) {
  return (
    <div className="mb-10 flex items-center justify-center gap-1.5">
      {(Array.from({ length: 7 }, (_, i) => (i + 1) as WizardStep)).map((s) => (
        <div key={s} className="flex items-center gap-1.5">
          <div
            className={cn(
              "grid h-8 w-8 place-items-center rounded-full text-xs font-semibold transition-all duration-300",
              s === step && "bg-primary text-primary-foreground shadow-lift scale-110",
              s < step && "bg-success text-white",
              s > step && "bg-muted text-muted-foreground",
            )}
          >
            {s < step ? <Check className="h-3.5 w-3.5" /> : s}
          </div>
          {s < 7 && (
            <div
              className={cn(
                "h-0.5 w-6 rounded-full transition-colors duration-300",
                s < step ? "bg-success" : "bg-muted",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function StepLabel({ step }: { step: WizardStep }) {
  return (
    <p className="mb-8 text-center text-sm font-medium text-muted-foreground">
      Step {step} of 7 — {STEP_LABELS[step]}
    </p>
  );
}

/* ── Step 1: Welcome ──────────────────────────────────────────────── */

function StepWelcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose/10 text-rose">
        <Upload className="h-8 w-8" />
      </div>

      <h2 className="mb-3 font-display text-3xl font-semibold tracking-tight">
        Migrate your studio into StudioFlow
      </h2>
      <p className="mx-auto mb-10 max-w-lg text-base leading-relaxed text-muted-foreground">
        We'll help bring across your students, families, classes, and instructors.
        Most studios finish in under 30 minutes.
      </p>

      {/* Supported formats */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        {[
          { label: "CSV", desc: "Spreadsheet export", icon: FileSpreadsheet },
          { label: "Excel", desc: ".xlsx files", icon: FileSpreadsheet },
          { label: "Google Sheets", desc: "Export as CSV", icon: FileSpreadsheet },
        ].map(({ label, desc, icon: Icon }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-card p-4"
          >
            <Icon className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-[11px] text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>

      {/* Coming soon */}
      <div className="mb-10 rounded-2xl border border-dashed border-border/60 bg-muted/30 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Direct imports — coming soon
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {["Jackrabbit", "Mindbody", "WellnessLiving", "DanceStudio-Pro"].map(
            (name) => (
              <span
                key={name}
                className="rounded-full border border-border/50 bg-background px-3 py-1.5 text-xs text-muted-foreground"
              >
                {name}
              </span>
            ),
          )}
        </div>
      </div>

      {/* Privacy reassurance */}
      <div className="mb-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-success" />
        Your data never leaves your browser. Nothing is uploaded to our servers.
      </div>

      <button
        onClick={onStart}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lift transition-all hover:opacity-90"
      >
        Start Migration
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ── Step 2: Choose Import Type ───────────────────────────────────── */

const CATEGORY_INFO: Array<{
  category: ImportCategory;
  label: string;
  desc: string;
  icon: typeof Users;
  available: boolean;
}> = [
  { category: "students", label: "Students & Families", desc: "Student profiles, parent contacts, medical notes, and emergency info", icon: Users, available: true },
  { category: "classes", label: "Classes & Schedule", desc: "Class names, styles, schedule, rooms, capacity, and instructor assignments", icon: BookOpen, available: true },
  { category: "instructors", label: "Instructors", desc: "Teaching staff with specialties, hourly rates, and pay type", icon: UserRound, available: true },
  { category: "enrolments", label: "Enrolments", desc: "Link students to their classes after importing both", icon: Link, available: false },
  { category: "payments", label: "Payments", desc: "Payment history, balances, and invoices", icon: FileSpreadsheet, available: false },
];

function StepChooseType({
  onSelect,
  selected,
}: {
  onSelect: (cat: ImportCategory) => void;
  selected: ImportCategory | null;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-2 text-center font-display text-2xl font-semibold tracking-tight">
        What would you like to import first?
      </h2>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Import one section at a time. Start with Students & Families.
      </p>

      <div className="mb-8 grid gap-3">
        {CATEGORY_INFO.map(({ category, label, desc, icon: Icon, available }) => (
          <button
            key={category}
            disabled={!available}
            onClick={() => available && onSelect(category)}
            className={cn(
              "flex items-start gap-4 rounded-2xl border p-4 text-left transition-all",
              available
                ? selected === category
                  ? "border-primary bg-primary/5 shadow-soft"
                  : "border-border/70 bg-card hover:border-primary/40 hover:shadow-soft"
                : "cursor-not-allowed border-border/40 bg-muted/20 opacity-50",
            )}
          >
            <div
              className={cn(
                "mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                available ? "bg-rose/10 text-rose" : "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{label}</p>
                {!available && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Coming Soon
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {available && (
                <>
                  <DownloadTemplateBtn category={category} />
                  {selected === category && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Need help */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-rose/5 to-amber-100 p-5">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-rose" />
          <p className="text-sm font-semibold">Need help?</p>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Download a template, fill it out, and upload. Each template includes
          sample data and formatting guidance.
        </p>
        <div className="flex flex-wrap gap-2">
          {IMPORT_TEMPLATES.filter((t) => t.category !== "payments").map((t) => (
            <button
              key={t.category}
              onClick={() =>
                downloadTemplate(
                  t.columns.map((c) => c.label),
                  t.sampleRows,
                  t.fileName,
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-secondary"
            >
              <Download className="h-3 w-3" />
              {t.name} template
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DownloadTemplateBtn({ category }: { category: ImportCategory }) {
  const template = IMPORT_TEMPLATES.find((t) => t.category === category);
  if (!template) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        downloadTemplate(
          template.columns.map((c) => c.label),
          template.sampleRows,
          template.fileName,
        );
      }}
      className="grid h-8 w-8 place-items-center rounded-lg border border-border/60 text-muted-foreground transition hover:bg-secondary"
      title="Download template"
    >
      <Download className="h-3.5 w-3.5" />
    </button>
  );
}

/* ── Step 3: Upload File ──────────────────────────────────────────── */

function StepUpload({
  onFile,
  file,
  loading,
  error,
}: {
  onFile: (file: File) => void;
  file: File | null;
  loading: boolean;
  error: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragover, setDragover] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragover(false);
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [onFile],
  );

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-2 text-center font-display text-2xl font-semibold tracking-tight">
        Upload your spreadsheet
      </h2>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Drag and drop a CSV or Excel file, or click to browse.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
        onDragLeave={() => setDragover(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all",
          dragover
            ? "border-primary bg-primary/5"
            : file
              ? "border-success/40 bg-success/5"
              : "border-border/70 bg-card hover:border-primary/40",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Parsing your file…</p>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center gap-2">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-success/10 text-success">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(0)} KB
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="mt-2 text-xs font-medium text-primary hover:underline"
            >
              Choose a different file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-rose/10 text-rose">
              <FileUp className="h-7 w-7" />
            </div>
            <p className="text-sm font-semibold">
              Drop your file here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              CSV and Excel (.xlsx) supported
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Help section */}
      <details className="group mt-6 rounded-2xl border border-border/60 bg-card p-4">
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground">
          <HelpCircle className="h-4 w-4" />
          Need help formatting your file?
          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
          <p>
            • Your spreadsheet should have a <strong>header row</strong> with
            column names (e.g. "Student Name", "Parent Email").
          </p>
          <p>
            • We'll automatically detect column names and match them to
            StudioFlow fields in the next step.
          </p>
          <p>
            • Download a template above to see the recommended format.
          </p>
        </div>
      </details>
    </div>
  );
}

/* ── Step 4: Field Mapping ────────────────────────────────────────── */

function StepMapping({
  mappings,
  headers,
  rows,
  onUpdateMapping,
}: {
  mappings: FieldMapping[];
  headers: string[];
  rows: Array<{ index: number; raw: Record<string, string> }>;
  onUpdateMapping: (col: string, target: string | null) => void;
}) {
  const missing = missingRequiredFields(mappings);
  const [editingCol, setEditingCol] = useState<string | null>(null);
  const [aiMapping, setAiMapping] = useState(false);

  async function handleAiAutoMap() {
    setAiMapping(true);
    try {
      const suggestions = await aiSuggestMappings(headers);
      for (const [header, field] of Object.entries(suggestions)) {
        if (field) onUpdateMapping(header, field);
      }
    } catch {
      // Silently fail — user can still map manually
    } finally {
      setAiMapping(false);
    }
  }

  const availableFields = [
    { value: "name", label: "Student Name" },
    { value: "parentName", label: "Parent Name" },
    { value: "parentEmail", label: "Parent Email" },
    { value: "parentPhone", label: "Parent Phone" },
    { value: "parentAddress", label: "Parent Address" },
    { value: "dob", label: "Date of Birth" },
    { value: "allergies", label: "Allergies" },
    { value: "medicalNotes", label: "Medical Notes" },
    { value: "emergencyContact", label: "Emergency Contact" },
    { value: "emergencyPhone", label: "Emergency Phone" },
    { value: "style", label: "Style / Type" },
    { value: "ageGroup", label: "Age Group" },
    { value: "day", label: "Day of Week" },
    { value: "startTime", label: "Start Time" },
    { value: "durationMins", label: "Duration (mins)" },
    { value: "room", label: "Room" },
    { value: "capacity", label: "Capacity" },
    { value: "teacherName", label: "Instructor Name" },
    { value: "priceCents", label: "Price" },
    { value: "email", label: "Email" },
    { value: "styles", label: "Styles / Specialties" },
    { value: "hourlyRateCents", label: "Hourly Rate" },
    { value: "payType", label: "Pay Type" },
    { value: "className", label: "Class Name (for enrolment)" },
    { value: "studentName", label: "Student Name (for enrolment)" },
    { value: "studentEmail", label: "Student Email (for enrolment)" },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-2 text-center font-display text-2xl font-semibold tracking-tight">
        Match your columns to StudioFlow fields
      </h2>
      <div className="mb-6 flex items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">
          We've automatically matched most fields. Review and adjust as needed.
        </p>
        <button
          type="button"
          onClick={handleAiAutoMap}
          disabled={aiMapping}
          className="inline-flex items-center gap-1.5 rounded-full border border-rose/30 bg-rose/5 px-3 py-1.5 text-xs font-semibold text-rose transition hover:bg-rose/10 disabled:opacity-60"
        >
          {aiMapping ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Mapping…</>
          ) : (
            <><Sparkles className="h-3.5 w-3.5" /> AI Auto-Map</>
          )}
        </button>
      </div>

      {missing.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-100 p-3">
          <p className="text-sm font-medium text-amber-900">
            Required fields not mapped:{" "}
            <span className="font-semibold">{missing.join(", ")}</span>
          </p>
        </div>
      )}

      {/* Mapping table */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 border-b border-border/60 bg-muted/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Your spreadsheet column</span>
          <span className="text-center">→</span>
          <span>StudioFlow field</span>
        </div>

        {mappings.map((m) => (
          <div
            key={m.spreadsheetColumn}
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border/30 px-4 py-3 last:border-b-0"
          >
            {/* Source column */}
            <div>
              <p className="text-sm font-medium">{m.spreadsheetColumn}</p>
              {m.sampleValues.length > 0 && (
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  e.g. {m.sampleValues.slice(0, 2).join(", ")}
                </p>
              )}
            </div>

            {/* Arrow + confidence */}
            <div className="flex flex-col items-center gap-0.5">
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              {m.targetField && m.confidence > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                    m.confidence >= 80
                      ? "bg-success/10 text-success"
                      : m.confidence >= 50
                        ? "bg-amber-100 text-amber-900"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {m.confidence}% match
                </span>
              )}
            </div>

            {/* Target field */}
            <div className="relative">
              {editingCol === m.spreadsheetColumn ? (
                <div className="flex items-center gap-1">
                  <select
                    value={m.targetField ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateMapping(m.spreadsheetColumn, val || null);
                      setEditingCol(null);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                    autoFocus
                    onBlur={() => setEditingCol(null)}
                  >
                    <option value="">— Ignore column —</option>
                    {availableFields.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <button
                  onClick={() => setEditingCol(m.spreadsheetColumn)}
                  className={cn(
                    "w-full rounded-lg border px-2.5 py-1.5 text-left text-sm transition",
                    m.targetField
                      ? "border-success/40 bg-success/5 text-success"
                      : "border-destructive/30 bg-destructive/5 text-destructive",
                  )}
                >
                  {m.targetField
                    ? availableFields.find((f) => f.value === m.targetField)?.label ?? m.targetField
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

      {/* Data preview */}
      <details className="group rounded-2xl border border-border/60 bg-card">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground">
          <Search className="h-4 w-4" />
          Preview first 3 rows
          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40">
                {headers.map((h) => (
                  <th key={h} className="whitespace-nowrap px-2 py-1.5 text-left font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 3).map((row) => (
                <tr key={row.index} className="border-b border-border/20 last:border-b-0">
                  {headers.map((h) => (
                    <td key={h} className="max-w-[150px] truncate whitespace-nowrap px-2 py-1.5">
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
  );
}

/* ── Step 5: Validation ───────────────────────────────────────────── */

function StepValidation({
  errors,
  totalRows,
  onAutoFix,
}: {
  errors: import("@/data/migrationTypes").ImportError[];
  totalRows: number;
  onAutoFix: () => void;
}) {
  const errorsList = errors.filter((e) => e.severity === "error");
  const warningsList = errors.filter((e) => e.severity === "warning");
  const cleanRows = totalRows - new Set(errorsList.map((e) => e.row)).size;

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-2 text-center font-display text-2xl font-semibold tracking-tight">
        Data Validation & Cleanup
      </h2>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        We've checked your data for common issues. Review before importing.
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
        <div className={cn(
          "rounded-2xl border p-4 text-center",
          errorsList.length > 0 ? "border-destructive/30 bg-destructive/5" : "border-border/70 bg-card",
        )}>
          <p className={cn("text-2xl font-bold", errorsList.length > 0 ? "text-destructive" : "text-muted-foreground")}>
            {errorsList.length}
          </p>
          <p className="text-[11px] text-muted-foreground">Issues found</p>
        </div>
      </div>

      {/* Auto-fix button */}
      {errorsList.length > 0 && (
        <button
          onClick={onAutoFix}
          className="mb-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-card py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
        >
          <Sparkles className="h-4 w-4 text-rose" />
          Auto-fix common issues (trim whitespace, format cleanup)
        </button>
      )}

      {/* Error list */}
      {errors.length > 0 ? (
        <div className="space-y-2">
          {errorsList.map((e, i) => (
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
          {warningsList.map((w, i) => (
            <div
              key={`warn-${i}`}
              className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-100 p-3"
            >
              <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Row {w.row} — {w.field}
                </p>
                <p className="text-xs text-amber-700">{w.message}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-success/30 bg-success/5 p-8 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-success/10">
            <Check className="h-6 w-6 text-success" />
          </div>
          <p className="font-semibold text-success">All clear!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No issues found. Your data looks great.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Step 6: Preview / Relationship Linking ───────────────────────── */

function StepPreview({ onConfirm }: { onConfirm: () => void }) {
  const { state } = useMigration();
  const preview = state.importPreview;

  if (!preview) return null;

  const hasErrors = state.errors.some((e) => e.severity === "error");

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-2 text-center font-display text-2xl font-semibold tracking-tight">
        Import Summary
      </h2>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Here's what will be added to your studio.
      </p>

      {/* Counts */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {preview.studentCount > 0 && (
          <div className="rounded-2xl border border-border/70 bg-card p-4 text-center">
            <Users className="mx-auto mb-1 h-5 w-5 text-rose" />
            <p className="text-xl font-bold">{preview.studentCount}</p>
            <p className="text-[11px] text-muted-foreground">Students</p>
          </div>
        )}
        {preview.parentCount > 0 && (
          <div className="rounded-2xl border border-border/70 bg-card p-4 text-center">
            <Users className="mx-auto mb-1 h-5 w-5 text-gold" />
            <p className="text-xl font-bold">{preview.parentCount}</p>
            <p className="text-[11px] text-muted-foreground">Parents</p>
          </div>
        )}
        {preview.classCount > 0 && (
          <div className="rounded-2xl border border-border/70 bg-card p-4 text-center">
            <BookOpen className="mx-auto mb-1 h-5 w-5 text-plum" />
            <p className="text-xl font-bold">{preview.classCount}</p>
            <p className="text-[11px] text-muted-foreground">Classes</p>
          </div>
        )}
        {preview.instructorCount > 0 && (
          <div className="rounded-2xl border border-border/70 bg-card p-4 text-center">
            <UserRound className="mx-auto mb-1 h-5 w-5 text-teal" />
            <p className="text-xl font-bold">{preview.instructorCount}</p>
            <p className="text-[11px] text-muted-foreground">Instructors</p>
          </div>
        )}
        {preview.enrolmentCount > 0 && (
          <div className="rounded-2xl border border-border/70 bg-card p-4 text-center">
            <Link className="mx-auto mb-1 h-5 w-5 text-success" />
            <p className="text-xl font-bold">{preview.enrolmentCount}</p>
            <p className="text-[11px] text-muted-foreground">Enrolments linked</p>
          </div>
        )}
      </div>

      {/* Linked enrolments */}
      {preview.linkedEnrolments.length > 0 && (
        <div className="mb-4 rounded-2xl border border-border/60 bg-card p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Student → Class links
          </p>
          <div className="max-h-48 space-y-1.5 overflow-y-auto">
            {preview.linkedEnrolments.map((link, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="font-medium">{link.studentName}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{link.className}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked assignments */}
      {preview.linkedAssignments.length > 0 && (
        <div className="mb-4 rounded-2xl border border-border/60 bg-card p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Instructor → Class assignments
          </p>
          <div className="max-h-48 space-y-1.5 overflow-y-auto">
            {preview.linkedAssignments.map((link, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="font-medium">{link.teacherName}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{link.className}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasErrors && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-center text-sm text-destructive">
          Some rows have errors and will be skipped. You can go back to fix them.
        </div>
      )}

      <button
        onClick={onConfirm}
        disabled={hasErrors}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-lift transition-all",
          hasErrors
            ? "cursor-not-allowed bg-muted text-muted-foreground"
            : "bg-primary text-primary-foreground hover:opacity-90",
        )}
      >
        <Play className="h-4 w-4" />
        Confirm & Import Data
      </button>

      {hasErrors && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Go back to Step 5 to review and fix errors before importing.
        </p>
      )}
    </div>
  );
}

/* ── Step 7: Confirmation ─────────────────────────────────────────── */

function StepConfirmation() {
  const { state, resetWizard } = useMigration();
  const navigate = useNavigate();
  const preview = state.importPreview;

  return (
    <div className="mx-auto max-w-xl text-center">
      {/* Success animation */}
      <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-success/10">
        <Check className="h-10 w-10 text-success animate-float-up" />
      </div>

      <h2 className="mb-2 font-display text-3xl font-semibold tracking-tight">
        Import Complete
      </h2>
      <p className="mb-8 text-sm text-muted-foreground">
        Your data has been imported successfully.
      </p>

      {/* Summary stats */}
      {preview && (
        <div className="mb-8 grid grid-cols-2 gap-3">
          {preview.studentCount > 0 && (
            <div className="rounded-xl border border-border/60 bg-card p-3">
              <p className="text-lg font-bold">{preview.studentCount}</p>
              <p className="text-xs text-muted-foreground">Students imported</p>
            </div>
          )}
          {preview.parentCount > 0 && (
            <div className="rounded-xl border border-border/60 bg-card p-3">
              <p className="text-lg font-bold">{preview.parentCount}</p>
              <p className="text-xs text-muted-foreground">Parents linked</p>
            </div>
          )}
          {preview.classCount > 0 && (
            <div className="rounded-xl border border-border/60 bg-card p-3">
              <p className="text-lg font-bold">{preview.classCount}</p>
              <p className="text-xs text-muted-foreground">Classes created</p>
            </div>
          )}
          {preview.instructorCount > 0 && (
            <div className="rounded-xl border border-border/60 bg-card p-3">
              <p className="text-lg font-bold">{preview.instructorCount}</p>
              <p className="text-xs text-muted-foreground">Instructors added</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lift transition hover:opacity-90"
        >
          Go to Dashboard
        </button>
        <button
          onClick={() => navigate("/migration-history")}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-card px-6 py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
        >
          Review Imported Data
        </button>
        <button
          onClick={resetWizard}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-card px-6 py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
        >
          <RotateCcw className="h-4 w-4" />
          Import More Data
        </button>
        <button
          onClick={() => navigate("/migration-history")}
          className="text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Undo Last Import
        </button>
      </div>

      {/* White-glove CTA */}
      <div className="mt-10 rounded-2xl border border-border/60 bg-gradient-to-br from-rose/5 to-amber-100 p-5 text-left">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-rose" />
          <p className="text-sm font-semibold">Need help migrating?</p>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Send us your spreadsheet exports and we'll help move your studio across.
        </p>
        <button className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background px-4 py-2 text-xs font-medium transition hover:bg-secondary">
          Contact Support
        </button>
      </div>
    </div>
  );
}

/* ── Navigation Footer ────────────────────────────────────────────── */

function NavFooter({
  step,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  forwardLabel,
}: {
  step: WizardStep;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  forwardLabel?: string;
}) {
  if (step === 1 || step === 7) return null;

  return (
    <div className="mt-10 flex items-center justify-between border-t border-border/40 pt-6">
      <button
        onClick={onBack}
        disabled={!canGoBack}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition",
          canGoBack
            ? "text-muted-foreground hover:bg-secondary"
            : "cursor-not-allowed text-muted-foreground/40",
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <span className="text-xs text-muted-foreground">
        Step {step} of 7
      </span>

      <button
        onClick={onForward}
        disabled={!canGoForward}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold transition",
          canGoForward
            ? "bg-primary text-primary-foreground shadow-lift hover:opacity-90"
            : "cursor-not-allowed bg-muted text-muted-foreground",
        )}
      >
        {forwardLabel || "Continue"}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ── Main Wizard Component ────────────────────────────────────────── */

function MigrationWizardInner() {
  const ctx = useMigration();
  const { state, goToStep, selectCategory, uploadFile, updateMapping, runValidation, buildPreview, confirmImport } = ctx;
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setUploadError(null);
      setUploading(true);
      try {
        await uploadFile(file);
      } catch {
        setUploadError("Could not parse this file. Make sure it's a valid CSV or Excel file.");
      } finally {
        setUploading(false);
      }
    },
    [uploadFile],
  );

  const handleBack = useCallback(() => {
    if (state.step > 1) goToStep((state.step - 1) as WizardStep);
  }, [state.step, goToStep]);

  const handleForward = useCallback(() => {
    switch (state.step) {
      case 2:
        if (!state.category) return;
        goToStep(3);
        break;
      case 3:
        goToStep(4);
        break;
      case 4:
        // Run validation
        runValidation();
        break;
      case 5:
        buildPreview();
        break;
      case 6:
        confirmImport();
        break;
    }
  }, [state.step, state.category, goToStep, runValidation, buildPreview, confirmImport]);

  const canGoForward = (() => {
    switch (state.step) {
      case 2: return !!state.category;
      case 3: return !!state.file;
      case 4: return true;
      case 5: return true;
      case 6: return !state.errors.some((e) => e.severity === "error");
      default: return true;
    }
  })();

  const forwardLabel = (() => {
    switch (state.step) {
      case 3: return "Map Fields";
      case 4: return "Validate Data";
      case 5: return "Preview Import";
      case 6: return "Confirm Import";
      default: return "Continue";
    }
  })();

  return (
    <div className="mx-auto max-w-3xl py-8">
      <StepIndicator step={state.step} />
      <StepLabel step={state.step} />

      {state.step === 1 && <StepWelcome onStart={() => goToStep(2)} />}
      {state.step === 2 && (
        <StepChooseType
          selected={state.category}
          onSelect={(cat) => selectCategory(cat)}
        />
      )}
      {state.step === 3 && (
        <StepUpload
          onFile={handleFile}
          file={state.file}
          loading={uploading}
          error={uploadError}
        />
      )}
      {state.step === 4 && (
        <StepMapping
          mappings={state.mappings}
          headers={state.headers}
          rows={state.rows}
          onUpdateMapping={updateMapping}
        />
      )}
      {state.step === 5 && (
        <StepValidation
          errors={state.errors}
          totalRows={state.mappedRows.length}
          onAutoFix={() => {
            updateMapping("", null); // Trigger re-run
            runValidation();
          }}
        />
      )}
      {state.step === 6 && <StepPreview onConfirm={() => confirmImport()} />}
      {state.step === 7 && <StepConfirmation />}

      <NavFooter
        step={state.step}
        canGoBack={state.step > 2}
        canGoForward={canGoForward}
        onBack={handleBack}
        onForward={handleForward}
        forwardLabel={forwardLabel}
      />
    </div>
  );
}

export default function MigrationWizard() {
  return <MigrationWizardInner />;
}
