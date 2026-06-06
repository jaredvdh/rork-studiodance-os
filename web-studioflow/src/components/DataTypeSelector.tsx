import { Check, Clock, HelpCircle } from "lucide-react";
import type { ImportCategory } from "@/data/migrationTypes";
import { IMPORTABLE_DATA_TYPES, getImportableType } from "@/data/providerData";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ready: { label: "Ready", className: "bg-success/10 text-success border-success/30" },
  optional: { label: "Optional", className: "bg-amber-100 text-amber-800 border-amber-200" },
  "coming-soon": { label: "Coming soon", className: "bg-muted text-muted-foreground border-border/50" },
};

const ICON_MAP: Record<string, string> = {
  users: "👥",
  heart: "❤️",
  calendar: "📅",
  link: "🔗",
  briefcase: "💼",
  "credit-card": "💳",
  shirt: "👕",
  "clipboard-check": "📋",
};

interface DataTypeSelectorProps {
  selectedTypes: ImportCategory[];
  onToggle: (type: ImportCategory) => void;
}

export default function DataTypeSelector({
  selectedTypes,
  onToggle,
}: DataTypeSelectorProps) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="mb-2 font-display text-2xl font-semibold tracking-tight text-foreground">
        What data would you like to bring across?
      </h2>
      <p className="mb-8 text-sm text-muted-foreground">
        Select the types of data you want to import. You can always add more
        later.
      </p>

      {/* Legend */}
      <div className="mb-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        {Object.entries(STATUS_BADGE).map(([status, badge]) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span
              className={cn(
                "inline-block h-2.5 w-2.5 rounded-full",
                status === "ready"
                  ? "bg-success"
                  : status === "optional"
                    ? "bg-amber-400"
                    : "bg-muted-foreground/30",
              )}
            />
            {badge.label}
          </span>
        ))}
      </div>

      {/* Data type cards */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {IMPORTABLE_DATA_TYPES.map((dt) => {
          const isSelected = selectedTypes.includes(dt.id);
          const isDisabled = dt.status === "coming-soon";
          const badge = STATUS_BADGE[dt.status];

          return (
            <button
              key={dt.id}
              disabled={isDisabled}
              onClick={() => !isDisabled && onToggle(dt.id)}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-4 text-left transition-all",
                isDisabled
                  ? "cursor-not-allowed border-border/40 bg-muted/20 opacity-50"
                  : isSelected
                    ? "border-primary bg-primary/5 shadow-soft"
                    : "border-border/70 bg-card hover:border-primary/40 hover:shadow-soft",
              )}
            >
              <span className="mt-0.5 text-xl shrink-0">
                {ICON_MAP[dt.icon] ?? "📦"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{dt.label}</p>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      badge.className,
                    )}
                  >
                    {badge.label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {dt.description}
                </p>
              </div>
              {isSelected && (
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Help tip */}
      <div className="mx-auto max-w-md rounded-xl border border-border/60 bg-muted/30 p-3">
        <div className="flex items-start gap-2">
          <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-left text-xs text-muted-foreground">
            <strong>Recommended:</strong> Start with Students/Members and Classes.
            You can import instructors and enrolments in later passes. Each data
            type can be uploaded as a separate file or combined spreadsheet.
          </p>
        </div>
      </div>
    </div>
  );
}
