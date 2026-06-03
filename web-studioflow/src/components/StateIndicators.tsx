import { type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Skeleton loading placeholder — mimics card layout.
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/70 bg-card p-6 shadow-soft animate-pulse", className)}>
      <div className="h-4 w-1/3 rounded-full bg-secondary mb-4" />
      <div className="h-8 w-1/2 rounded-full bg-secondary mb-2" />
      <div className="h-3 w-2/3 rounded-full bg-secondary" />
    </div>
  );
}

/** Table row skeleton. */
export function RowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-secondary shrink-0" />
      {Array.from({ length: cols - 1 }).map((_, i) => (
        <div key={i} className="flex-1">
          <div className="h-4 w-2/3 rounded-full bg-secondary mb-1" />
          <div className="h-3 w-1/2 rounded-full bg-secondary" />
        </div>
      ))}
    </div>
  );
}

/** Stats grid skeleton. */
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Page-level loading spinner. */
export function PageLoader({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

/**
 * Empty state for a new studio with no data.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-muted/50 text-muted-foreground/50 mb-4">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 rounded-full bg-rose px-5 py-2.5 text-sm font-semibold text-rose-foreground shadow-soft transition hover:opacity-90"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Error state with retry.
 */
export function ErrorState({
  message = "Something went wrong loading this data.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-rose/10 text-rose mb-4">
        <Loader2 className="h-7 w-7" />
      </div>
      <h3 className="font-display text-lg font-semibold">Failed to load</h3>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-secondary"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * "Coming soon" badge for feature in development.
 */
export function ComingSoonBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      Coming soon
    </span>
  );
}
