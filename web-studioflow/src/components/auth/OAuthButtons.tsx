import { cn } from "@/lib/utils";

interface OAuthButtonsProps {
  /** Called with the chosen provider. Parent sets loading state. */
  onSignIn: (provider: "google" | "apple") => void;
  /** Whether an auth request is in flight */
  isLoading: boolean;
  /** Visual emphasis — "oauth-first" makes OAuth buttons prominent, "balanced" gives equal weight */
  emphasis?: "oauth-first" | "balanced";
  /** Tone variant matching the portal */
  variant?: "admin" | "parent";
  className?: string;
}

/**
 * Google + Apple OAuth buttons. Shared between admin and parent portals.
 *
 * Admin (oauth-first): Google and Apple are the top-level CTA — tall, prominent.
 * Parent (balanced): Google and Apple sit above the email form naturally.
 */
export function OAuthButtons({
  onSignIn,
  isLoading,
  emphasis = "oauth-first",
  variant = "admin",
  className,
}: OAuthButtonsProps) {
  const isParent = variant === "parent";

  return (
    <div className={cn("space-y-3", className)}>
      {/* Google */}
      <button
        type="button"
        onClick={() => onSignIn("google")}
        disabled={isLoading}
        className={cn(
          "flex w-full items-center justify-center gap-3 rounded-xl border py-3 text-sm font-medium shadow-soft transition disabled:opacity-60",
          isParent
            ? "border-amber-200 bg-white text-foreground hover:bg-amber-50"
            : "border-border bg-white text-foreground hover:bg-secondary",
        )}
      >
        <GoogleIcon />
        {isLoading ? "Signing in…" : "Continue with Google"}
      </button>

      {/* Apple */}
      <button
        type="button"
        onClick={() => onSignIn("apple")}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#050708] py-3 text-sm font-medium text-white shadow-soft transition hover:bg-[#050708]/90 disabled:opacity-60"
      >
        <AppleIcon />
        {isLoading ? "Signing in…" : "Continue with Apple"}
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}
