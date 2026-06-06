import { useCallback, useRef, useState } from "react";
import {
  FileSpreadsheet,
  FileUp,
  Loader2,
  Trash2,
  AlertCircle,
  ChevronDown,
  Check,
  HelpCircle,
} from "lucide-react";
import type { ImportCategory, UploadedFile } from "@/data/migrationTypes";
import { IMPORTABLE_DATA_TYPES, guessDataType } from "@/data/providerData";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  files: UploadedFile[];
  onAddFiles: (newFiles: File[]) => Promise<void>;
  onRemoveFile: (fileId: string) => void;
  onChangeType: (fileId: string, newType: ImportCategory) => void;
  loading: boolean;
}

const TYPE_BADGE_CLASS: Record<string, string> = {
  ready: "bg-success/10 text-success border-success/30",
  optional: "bg-amber-100 text-amber-800 border-amber-200",
  "coming-soon": "bg-muted text-muted-foreground border-border/50",
};

export default function FileUploadZone({
  files,
  onAddFiles,
  onRemoveFile,
  onChangeType,
  loading,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragover, setDragover] = useState(false);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragover(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        await onAddFiles(droppedFiles);
      }
    },
    [onAddFiles],
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? []);
      if (selected.length > 0) {
        await onAddFiles(selected);
      }
      if (inputRef.current) inputRef.current.value = "";
    },
    [onAddFiles],
  );

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-2 text-center font-display text-2xl font-semibold tracking-tight text-foreground">
        Upload your exported files
      </h2>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Drag and drop CSV or Excel files. You can upload multiple files — we'll
        help you organize them.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragover(true);
        }}
        onDragLeave={() => setDragover(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all",
          dragover
            ? "border-primary bg-primary/5"
            : "border-border/70 bg-card hover:border-primary/40",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Parsing your files…
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose/10">
              <FileUp className="h-8 w-8 text-rose" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Drag & drop your files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports CSV, XLSX, XLS — multiple files at once
            </p>
          </div>
        )}
      </div>

      {/* Uploaded file cards */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Uploaded files ({files.length})
          </p>
          {files.map((uf) => {
            const detectedTypeInfo = IMPORTABLE_DATA_TYPES.find(
              (t) => t.id === uf.detectedType,
            );
            const currentTypeInfo = IMPORTABLE_DATA_TYPES.find(
              (t) => t.id === uf.detectedType,
            );

            return (
              <div
                key={uf.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 sm:flex-row sm:items-center"
              >
                {/* File icon & name */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose/10 text-rose">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{uf.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(uf.fileSize)} · {uf.rowCount} rows ·{" "}
                      {uf.headers.length} columns
                    </p>
                  </div>
                </div>

                {/* Data type selector */}
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground">Data type:</span>
                  <select
                    value={uf.detectedType ?? ""}
                    onChange={(e) =>
                      onChangeType(uf.id, e.target.value as ImportCategory)
                    }
                    className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {IMPORTABLE_DATA_TYPES.filter(
                      (t) => t.status !== "coming-soon",
                    ).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile(uf.id);
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    title="Remove file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Help tip */}
      {files.length === 0 && (
        <div className="mt-6 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="flex items-start gap-2">
            <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">
              <p className="mb-1 font-medium">No files uploaded yet — tips for best results:</p>
              <ul className="list-inside list-disc space-y-0.5">
                <li>Upload one file per data type (students, classes, instructors)</li>
                <li>Make sure each file has a header row with column names</li>
                <li>Remove empty rows and columns before uploading</li>
                <li>Phone numbers and dates can be in any readable format</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
