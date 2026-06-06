import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";

import type {
  ImportCategory,
  MigrationProvider,
  ParsedRow,
  UploadedFile,
  WizardStep,
  ImportError,
} from "@/data/migrationTypes";
import { parseFile } from "@/lib/importer";
import { autoMapFields, applyMappings } from "@/lib/fieldMapper";
import { validateImport } from "@/lib/validation";
import { guessDataType } from "@/data/providerData";
import { useMigration } from "@/data/migrationStore";
import { useTeachers } from "@/data/store";
import { classes as demoClasses, students as demoStudents, teachers as demoTeachers } from "@/data/demo";
import { cn } from "@/lib/utils";

import ProviderSelector from "@/components/ProviderSelector";
import DataTypeSelector from "@/components/DataTypeSelector";
import ExportInstructions from "@/components/ExportInstructions";
import FileUploadZone from "@/components/FileUploadZone";
import FieldMapper from "@/components/FieldMapper";
import ValidationPanel from "@/components/ValidationPanel";
import ImportPreview from "@/components/ImportPreview";
import ImportComplete from "@/components/ImportComplete";

/* ── Step indicator ───────────────────────────────────────────────── */

const STEP_LABELS: Record<WizardStep, string> = {
  1: "Provider",
  2: "Data Types",
  3: "Export Guide",
  4: "Upload Files",
  5: "Map Fields",
  6: "Validate",
  7: "Preview",
  8: "Complete",
};

function StepIndicator({ step, total }: { step: WizardStep; total: number }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-0.5 overflow-x-auto px-2 sm:mb-10 sm:gap-1">
      {(Array.from({ length: total }, (_, i) => (i + 1) as WizardStep)).map((s) => (
        <div key={s} className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <div
            className={cn(
              "grid h-7 w-7 place-items-center rounded-full text-[10px] font-semibold transition-all duration-300 sm:h-8 sm:w-8 sm:text-xs",
              s === step && "bg-primary text-primary-foreground shadow-lift scale-110",
              s < step && "bg-success text-white",
              s > step && "bg-muted text-muted-foreground",
            )}
          >
            {s < step ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : s}
          </div>
          {s < total && (
            <div
              className={cn(
                "h-0.5 w-3 rounded-full transition-colors duration-300 sm:w-5",
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
      Step {step} of 8 — {STEP_LABELS[step]}
    </p>
  );
}

/* ── Nav Footer ───────────────────────────────────────────────────── */

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
  if (step === 1 || step === 8) return null;

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
        Step {step} of 8
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

/* ── Main Wizard ──────────────────────────────────────────────────── */

export default function MigrationWizard() {
  const navigate = useNavigate();
  const migrationCtx = useMigration();
  const teachersCtx = useTeachers();

  /* ── Wizard state ──────────────────────────────────────────────── */
  const [step, setStep] = useState<WizardStep>(1);
  const [provider, setProvider] = useState<MigrationProvider | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<ImportCategory[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [needsReviewCount, setNeedsReviewCount] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [validating, setValidating] = useState(false);

  /* ── Navigation helpers ────────────────────────────────────────── */

  const goNext = useCallback(() => {
    setStep((prev) => Math.min(prev + 1, 8) as WizardStep);
  }, []);

  const goBack = useCallback(() => {
    // Step 5 has sub-navigation between files — go back within files first
    if (step === 5 && currentFileIndex > 0) {
      setCurrentFileIndex((i) => i - 1);
      return;
    }
    // Step 5 → go back to step 4, reset file index
    if (step === 5 && currentFileIndex === 0) {
      setCurrentFileIndex(0);
      setStep(4);
      return;
    }
    setStep((prev) => Math.max(prev - 1, 1) as WizardStep);
  }, [step, currentFileIndex]);

  /* ── Step 2: Toggle data types ─────────────────────────────────── */

  const toggleDataType = useCallback((dt: ImportCategory) => {
    setSelectedTypes((prev) =>
      prev.includes(dt) ? prev.filter((t) => t !== dt) : [...prev, dt],
    );
  }, []);

  /* ── Step 4: Upload files ──────────────────────────────────────── */

  const handleAddFiles = useCallback(
    async (newFiles: File[]) => {
      setUploadLoading(true);
      try {
        const parsed: UploadedFile[] = [];

        for (const file of newFiles) {
          const { rows, headers } = await parseFile(file);
          const detectedType = guessDataType(headers);
          const category = detectedType;

          // Auto-map fields for this file
          const sampleRows = rows.slice(0, 5).map((r) => r.raw);
          const mappings = autoMapFields(headers, sampleRows, category);
          const mappedRows = applyMappings(rows, mappings);

          parsed.push({
            id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            file,
            fileName: file.name,
            fileSize: file.size,
            rowCount: rows.length,
            headers,
            detectedType,
            rows,
            mappings,
            mappedRows,
            errors: [],
          });
        }

        setFiles((prev) => [...prev, ...parsed]);
      } catch (err) {
        console.error("Failed to parse file:", err);
      } finally {
        setUploadLoading(false);
      }
    },
    [],
  );

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const handleChangeFileType = useCallback(
    (fileId: string, newType: ImportCategory) => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== fileId) return f;
          // Re-run auto-map with new category
          const sampleRows = f.rows.slice(0, 5).map((r) => r.raw);
          const mappings = autoMapFields(f.headers, sampleRows, newType);
          const mappedRows = applyMappings(f.rows, mappings);
          return {
            ...f,
            detectedType: newType,
            mappings,
            mappedRows,
            errors: [],
          };
        }),
      );
    },
    [],
  );

  /* ── Step 5: Field mapping ─────────────────────────────────────── */

  const handleUpdateMapping = useCallback(
    (fileId: string, col: string, targetField: string | null) => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== fileId) return f;
          const mappings = f.mappings.map((m) =>
            m.spreadsheetColumn === col
              ? { ...m, targetField, confidence: targetField === null ? 0 : 50 }
              : m,
          );
          const mappedRows = applyMappings(f.rows, mappings);
          return { ...f, mappings, mappedRows, errors: [] };
        }),
      );
    },
    [],
  );

  const handleAutoMap = useCallback(
    async (fileId: string) => {
      setAiLoading(true);
      // Simulate AI re-mapping — could integrate real AI in future
      await new Promise((r) => setTimeout(r, 600));
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== fileId) return f;
          const category = f.detectedType ?? "students";
          const sampleRows = f.rows.slice(0, 5).map((r) => r.raw);
          const mappings = autoMapFields(f.headers, sampleRows, category);
          const mappedRows = applyMappings(f.rows, mappings);
          return { ...f, mappings, mappedRows, errors: [] };
        }),
      );
      setAiLoading(false);
    },
    [],
  );

  /* ── Step 6: Run validation ────────────────────────────────────── */

  const runValidationForAll = useCallback(() => {
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
        };
        const errors = validateImport(ctx);
        return { ...f, errors };
      }),
    );
  }, [migrationCtx.importedStudents, migrationCtx.importedClasses, migrationCtx.importedTeachers, teachersCtx.teachers]);

  /* ── Step 7: Confirm import ────────────────────────────────────── */

  const handleConfirmImport = useCallback(() => {
    setConfirming(true);
    // Brief delay to show loading state
    setTimeout(() => {
      let totalImported = 0;
      let totalSkipped = 0;
      let totalNeedsReview = 0;

      for (const f of files) {
        const cleanCount = f.rowCount - f.errors.filter((e) => e.severity === "error").length;
        const warnCount = f.errors.filter((e) => e.severity === "warning").length;
        totalImported += cleanCount;
        totalSkipped += f.errors.filter((e) => e.severity === "error").length;
        totalNeedsReview += warnCount;
      }

      setImportedCount(totalImported);
      setSkippedCount(totalSkipped);
      setNeedsReviewCount(totalNeedsReview);
      setConfirming(false);
      setStep(8);
    }, 800);
  }, [files]);

  /* ── Forward button logic ──────────────────────────────────────── */

  const canGoForward = (() => {
    if (confirming || validating) return false;
    switch (step) {
      case 1:
        return !!provider;
      case 2:
        return selectedTypes.length > 0;
      case 3:
        return true;
      case 4:
        return files.length > 0;
      case 5:
        // Allow advancing within files OR to next step if on last file
        return true;
      case 6: {
        const hasBlocking = files.some((f) =>
          f.errors.some((e) => e.severity === "error"),
        );
        return !hasBlocking;
      }
      case 7:
        return true;
      default:
        return true;
    }
  })();

  const forwardLabel = (() => {
    if (confirming) return "Importing…";
    if (validating) return "Validating…";
    switch (step) {
      case 1:
        return "Select Data Types";
      case 2:
        return "Export Guide";
      case 3:
        return "Upload Files";
      case 4:
        return "Map Fields";
      case 5: {
        // Show different label if there are more files to map
        if (currentFileIndex < files.length - 1) {
          return "Next File";
        }
        return "Validate";
      }
      case 6:
        return "Preview Import";
      case 7:
        return "Confirm Import";
      default:
        return "Continue";
    }
  })();

  const handleForward = useCallback(() => {
    switch (step) {
      case 5:
        // If there are more files to map, advance within step 5
        if (currentFileIndex < files.length - 1) {
          setCurrentFileIndex((i) => i + 1);
          return;
        }
        goNext();
        break;
      case 6: {
        setValidating(true);
        // Small delay so UI updates
        setTimeout(() => {
          runValidationForAll();
          setValidating(false);
          goNext();
        }, 400);
        break;
      }
      case 7:
        if (!confirming) {
          handleConfirmImport();
        }
        break;
      default:
        goNext();
    }
  }, [step, currentFileIndex, files.length, goNext, runValidationForAll, handleConfirmImport]);

  /* ── Step 6 helpers ────────────────────────────────────────────── */

  const hasBlockingErrors = files.some((f) =>
    f.errors.some((e) => e.severity === "error"),
  );

  const handleAutoFix = useCallback(() => {
    setFiles((prev) =>
      prev.map((f) => {
        // Simple auto-fix: trim whitespace and re-validate
        const cleanedRows = f.mappedRows.map((row) => {
          const cleaned: Record<string, string> = {};
          for (const [key, val] of Object.entries(row.mapped)) {
            cleaned[key] = val.trim();
          }
          return { ...row, mapped: cleaned };
        });

        const ctx = {
          existingStudents: [...demoStudents, ...migrationCtx.importedStudents],
          existingClasses: [...demoClasses, ...migrationCtx.importedClasses],
          existingTeachers: [
            ...demoTeachers,
            ...migrationCtx.importedTeachers,
            ...teachersCtx.teachers,
          ],
          mappedRows: cleanedRows,
          category: f.detectedType ?? "students",
        };
        const errors = validateImport(ctx);
        return { ...f, mappedRows: cleanedRows, errors };
      }),
    );
  }, [migrationCtx.importedStudents, migrationCtx.importedClasses, migrationCtx.importedTeachers, teachersCtx.teachers]);

  const handleImportMore = useCallback(() => {
    setStep(1);
    setProvider(null);
    setSelectedTypes([]);
    setFiles([]);
    setCurrentFileIndex(0);
  }, []);

  /* ── Render ────────────────────────────────────────────────────── */

  return (
    <div className="mx-auto max-w-4xl py-8">
      <StepIndicator step={step} total={8} />
      <StepLabel step={step} />

      {/* Step 1: Provider Selection */}
      {step === 1 && (
        <ProviderSelector
          selected={provider}
          onSelect={setProvider}
          onContinue={goNext}
        />
      )}

      {/* Step 2: Data Type Selection */}
      {step === 2 && (
        <DataTypeSelector
          selectedTypes={selectedTypes}
          onToggle={toggleDataType}
        />
      )}

      {/* Step 3: Export Instructions */}
      {step === 3 && provider && (
        <ExportInstructions provider={provider} />
      )}

      {/* Step 4: File Upload */}
      {step === 4 && (
        <FileUploadZone
          files={files}
          onAddFiles={handleAddFiles}
          onRemoveFile={handleRemoveFile}
          onChangeType={handleChangeFileType}
          loading={uploadLoading}
        />
      )}

      {/* Step 5: Field Mapping (per file) */}
      {step === 5 && files.length > 0 && (
        <>
          {/* File tabs */}
          {files.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2 justify-center">
              {files.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => setCurrentFileIndex(i)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-medium transition",
                    i === currentFileIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {f.fileName}
                  {f.errors.length > 0 && (
                    <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-destructive/20 text-[10px] font-bold text-destructive">
                      {f.errors.filter((e) => e.severity === "error").length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          <FieldMapper
            file={files[currentFileIndex]}
            onUpdateMapping={handleUpdateMapping}
            onAutoMap={handleAutoMap}
            aiLoading={aiLoading}
          />
        </>
      )}

      {/* Step 6: Validation */}
      {step === 6 && (
        <ValidationPanel
          files={files}
          onAutoFix={handleAutoFix}
        />
      )}

      {/* Step 7: Import Preview */}
      {step === 7 && (
        <ImportPreview
          files={files}
          onConfirm={handleConfirmImport}
          onBack={goBack}
          hasBlockingErrors={hasBlockingErrors}
        />
      )}

      {/* Step 8: Import Complete */}
      {step === 8 && (
        <ImportComplete
          files={files}
          importedCount={importedCount}
          skippedCount={skippedCount}
          needsReviewCount={needsReviewCount}
          onImportMore={handleImportMore}
        />
      )}

      <NavFooter
        step={step}
        canGoBack={step > 1 && !confirming}
        canGoForward={canGoForward}
        onBack={goBack}
        onForward={handleForward}
        forwardLabel={forwardLabel}
      />
    </div>
  );
}
