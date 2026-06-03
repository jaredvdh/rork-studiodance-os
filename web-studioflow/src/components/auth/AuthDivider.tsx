import { cn } from "@/lib/utils";

interface AuthDividerProps {
  /** The text shown in the middle of the divider */
  label: string;
  /** Tone variant matching the portal */
  variant?: "admin" | "parent";
  className?: string;
}

/**
 * "Or continue with..." divider with a line on each side.
 * Smaller and subtler than a full section header — sits between OAuth
 * buttons and the email/password form.
 */
export function AuthDivider({ label, variant = "admin", className }: AuthDividerProps) {
  const isParent = variant === "parent";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("h-px flex-1", isParent ? "bg-amber-200" : "bg-border")} />
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className={cn("h-px flex-1", isParent ? "bg-amber-200" : "bg-border")} />
    </div>
  );
}
