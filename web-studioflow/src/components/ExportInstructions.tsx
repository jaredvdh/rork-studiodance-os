import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import type { MigrationProvider } from "@/data/migrationTypes";
import { getProvider } from "@/data/providerData";
import { IMPORT_TEMPLATES } from "@/data/migrationTemplates";
import { downloadTemplate } from "@/lib/importer";
import { cn } from "@/lib/utils";

interface ExportInstructionsProps {
  provider: MigrationProvider;
}

export default function ExportInstructions({ provider }: ExportInstructionsProps) {
  const info = getProvider(provider);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-2 text-center font-display text-2xl font-semibold tracking-tight text-foreground">
        Export your data from {info.name}
      </h2>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Follow the steps below to export your data. Then upload the files on the
        next screen.
      </p>

      {/* Provider-specific export steps */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="border-b border-border/50 bg-muted/30 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            How to export from {info.name}
          </p>
        </div>
        <div className="divide-y divide-border/30">
          {info.exportSteps.map((step, i) => (
            <div key={i}>
              <button
                onClick={() =>
                  setExpandedStep(expandedStep === i ? null : i)
                }
                className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-muted/30"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-rose/10 text-xs font-bold text-rose">
                  {i + 1}
                </span>
                <span
                  className="flex-1 text-sm"
                  dangerouslySetInnerHTML={{ __html: step }}
                />
                {expandedStep === i ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Notes */}
        {info.notes && (
          <div className="border-t border-border/40 bg-muted/20 px-5 py-3">
            <div className="flex items-start gap-2">
              <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{info.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Download templates */}
      <div className="mb-8">
        <p className="mb-3 text-sm font-semibold">
          Download StudioFlow templates (optional)
        </p>
        <p className="mb-4 text-xs text-muted-foreground">
          Use these templates to format your data before uploading, or skip if
          your export is already clean. Our smart mapping handles most formats.
        </p>
        <div className="flex flex-wrap gap-2">
          {IMPORT_TEMPLATES.map((t) => (
            <button
              key={t.category}
              onClick={() =>
                downloadTemplate(
                  t.columns.map((c) => c.label),
                  t.sampleRows,
                  t.fileName,
                )
              }
              className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <Download className="h-3.5 w-3.5" />
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* File formats info */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground">
            Accepted formats:{" "}
            <span className="font-semibold text-foreground">
              {info.formats.join(", ")}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
