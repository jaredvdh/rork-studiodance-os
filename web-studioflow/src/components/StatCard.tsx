import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  icon: LucideIcon;
  accent?: "rose" | "gold" | "teal" | "plum";
  index?: number;
}

const accentMap = {
  rose: "bg-rose/10 text-rose",
  gold: "bg-gold/15 text-gold",
  teal: "bg-teal/10 text-teal",
  plum: "bg-plum/10 text-plum",
};

export default function StatCard({ label, value, delta, hint, icon: Icon, accent = "rose", index = 0 }: StatCardProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div
      className="animate-float-up rounded-2xl border border-border/70 bg-card p-5 shadow-soft transition hover:shadow-lift"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className={cn("grid h-11 w-11 place-items-center rounded-xl", accentMap[accent])}>
          <Icon className="h-5 w-5" />
        </div>
        {delta !== undefined && (
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold",
              positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm font-medium text-foreground/70">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
