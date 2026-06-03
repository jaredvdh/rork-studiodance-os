import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: ReactNode;
  /** Use "admin" for professional/operational tone, "parent" for warm/family tone */
  variant?: "admin" | "parent";
  className?: string;
}

/**
 * Shared auth card wrapper. Admin variant uses neutral/primary tones;
 * parent variant uses warm amber tones. Both share the same structural
 * layout — rounded-3xl card with shadow and border.
 */
export function AuthCard({ children, variant = "admin", className }: AuthCardProps) {
  const isParent = variant === "parent";

  return (
    <div
      className={cn(
        "rounded-3xl border p-8 shadow-lift",
        isParent
          ? "border-amber-200/70 bg-white"
          : "border-border/70 bg-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Icon badge shown at the top-center of the auth card. */
export function AuthCardIcon({
  children,
  variant = "admin",
}: {
  children: ReactNode;
  variant?: "admin" | "parent";
}) {
  const isParent = variant === "parent";
  return (
    <div
      className={cn(
        "mx-auto grid h-14 w-14 place-items-center rounded-2xl",
        isParent
          ? "bg-amber-100 text-amber-600"
          : "bg-primary/10 text-primary",
      )}
    >
      {children}
    </div>
  );
}

/** Title + subtitle section inside the card. */
export function AuthCardHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center">
      <h1 className="mt-4 font-display text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
