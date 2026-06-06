import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  Globe,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Table2,
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

      {/* No API banner */}
      <div className="mb-6 rounded-xl border border-border/60 bg-success/5 p-4">
        <div className="flex items-start gap-2">
          <Globe className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <div>
            <p className="text-xs font-semibold text-success">
              No API access or developer setup required
            </p>
            <p className="text-xs text-muted-foreground">
              Every major studio platform lets you export your data as a CSV or
              Excel file from the admin dashboard. Just download and upload — no
              IT tickets, no integration work.
            </p>
          </div>
        </div>
      </div>

      {/* Sample export preview */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="border-b border-border/50 bg-muted/30 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What your {info.name} export should look like
          </p>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40">
                <th className="whitespace-nowrap px-2 py-1.5 text-left font-medium text-muted-foreground">
                  Student Name
                </th>
                <th className="whitespace-nowrap px-2 py-1.5 text-left font-medium text-muted-foreground">
                  Caregiver Email
                </th>
                <th className="whitespace-nowrap px-2 py-1.5 text-left font-medium text-muted-foreground">
                  Phone
                </th>
                <th className="whitespace-nowrap px-2 py-1.5 text-left font-medium text-muted-foreground">
                  Date of Birth
                </th>
                <th className="whitespace-nowrap px-2 py-1.5 text-left font-medium text-muted-foreground">
                  Class
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/20">
                <td className="whitespace-nowrap px-2 py-1.5">Emily Walsh</td>
                <td className="whitespace-nowrap px-2 py-1.5">diane@example.com</td>
                <td className="whitespace-nowrap px-2 py-1.5">(555) 123-4567</td>
                <td className="whitespace-nowrap px-2 py-1.5">2016-04-12</td>
                <td className="whitespace-nowrap px-2 py-1.5">Junior Jazz</td>
              </tr>
              <tr className="border-b border-border/20">
                <td className="whitespace-nowrap px-2 py-1.5">Liam Carter</td>
                <td className="whitespace-nowrap px-2 py-1.5">marcus@example.com</td>
                <td className="whitespace-nowrap px-2 py-1.5">(555) 234-5678</td>
                <td className="whitespace-nowrap px-2 py-1.5">2014-09-23</td>
                <td className="whitespace-nowrap px-2 py-1.5">Junior Hip Hop</td>
              </tr>
              <tr>
                <td className="whitespace-nowrap px-2 py-1.5">Sofia Patel</td>
                <td className="whitespace-nowrap px-2 py-1.5">anita@example.com</td>
                <td className="whitespace-nowrap px-2 py-1.5">(555) 345-6789</td>
                <td className="whitespace-nowrap px-2 py-1.5">2015-01-17</td>
                <td className="whitespace-nowrap px-2 py-1.5">Tiny Tots Ballet</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="border-t border-border/40 bg-muted/20 px-5 py-2.5">
          <div className="flex items-center gap-2">
            <Table2 className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">
              Your export doesn't need to match exactly — our smart field mapping
              will detect your column names automatically.
            </p>
          </div>
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
