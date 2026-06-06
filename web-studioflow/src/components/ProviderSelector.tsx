import { useState } from "react";
import {
  ArrowRight,
  Check,
  FileSpreadsheet,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { MigrationProvider } from "@/data/migrationTypes";
import { PROVIDERS } from "@/data/providerData";
import { cn } from "@/lib/utils";

interface ProviderSelectorProps {
  selected: MigrationProvider | null;
  onSelect: (provider: MigrationProvider) => void;
  onContinue: () => void;
}

const PROVIDER_ICONS: Record<string, string> = {
  jackrabbit: "JR",
  mindbody: "MB",
  wellnessliving: "WL",
  "dancestudio-pro": "DP",
  momence: "MO",
  acuity: "AC",
  spreadsheet: "CS",
  other: "••",
};

export default function ProviderSelector({
  selected,
  onSelect,
  onContinue,
}: ProviderSelectorProps) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {/* Icon */}
      <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-rose/10">
        <FileSpreadsheet className="h-8 w-8 text-rose" />
      </div>

      <h2 className="mb-3 font-display text-3xl font-semibold tracking-tight text-foreground">
        Where are you moving from?
      </h2>
      <p className="mx-auto mb-2 max-w-lg text-balance text-sm leading-relaxed text-muted-foreground">
        StudioFlow supports CSV and XLSX migration from most studio management
        platforms. Select your current provider below.
      </p>

      {/* Reassurance badges */}
      <div className="mx-auto mb-8 flex max-w-md flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-success" />
          Preview everything before import
        </span>
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-success" />
          No data overwritten
        </span>
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-success" />
          Fix errors before committing
        </span>
      </div>

      {/* Provider grid */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            onClick={() => onSelect(provider.id)}
            className={cn(
              "group flex items-start gap-4 rounded-2xl border p-4 text-left transition-all",
              selected === provider.id
                ? "border-primary bg-primary/5 shadow-soft ring-1 ring-primary/20"
                : "border-border/70 bg-card hover:border-primary/30 hover:shadow-soft",
            )}
          >
            <div
              className={cn(
                "mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold",
                selected === provider.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:bg-rose/10 group-hover:text-rose",
              )}
            >
              {PROVIDER_ICONS[provider.id] ?? "•"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{provider.name}</p>
                {!provider.hasGuidance && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Generic import
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                {provider.description}
              </p>
            </div>
            {selected === provider.id && (
              <Check className="mt-1 h-5 w-5 shrink-0 text-primary" />
            )}
          </button>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={onContinue}
        disabled={!selected}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-lift transition-all",
          selected
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : "cursor-not-allowed bg-muted text-muted-foreground",
        )}
      >
        Continue
        <ArrowRight className="h-4 w-4" />
      </button>

      {/* Help CTA */}
      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-border/60 bg-gradient-to-br from-rose/5 to-amber-100 p-4 text-left">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-rose" />
          <p className="text-sm font-semibold">Need help?</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Send us your exported files and we'll handle the migration for you —
          free for all StudioFlow plans.
        </p>
      </div>
    </div>
  );
}
