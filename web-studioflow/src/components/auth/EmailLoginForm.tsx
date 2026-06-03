import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailLoginFormProps {
  /** Called with email and password on submit */
  onSubmit: (email: string, password: string) => Promise<void>;
  /** Whether an auth request is in flight */
  isLoading: boolean;
  /** Error message to display above the form */
  error?: string | null;
  /** Callback to dismiss the error */
  onClearError?: () => void;
  /** Tone variant — admin uses neutral styling, parent uses amber */
  variant?: "admin" | "parent";
  /** Show "Remember me" checkbox */
  showRememberMe?: boolean;
  /** Show "Forgot password?" link */
  showForgotPassword?: boolean;
  /** Callback for forgot password */
  onForgotPassword?: () => void;
  className?: string;
}

/**
 * Email + password login form. Shared between admin and parent portals.
 *
 * Admin styling: neutral border/ring colors. Parent styling: amber tones.
 * The form handles its own email/password state internally.
 */
export function EmailLoginForm({
  onSubmit,
  isLoading,
  error,
  onClearError,
  variant = "admin",
  showRememberMe = true,
  showForgotPassword = true,
  onForgotPassword,
  className,
}: EmailLoginFormProps) {
  const isParent = variant === "parent";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    await onSubmit(email.trim(), password);
  };

  const inputBorder = isParent ? "border-amber-200" : "border-input";
  const inputBg = isParent ? "bg-amber-50/50" : "bg-background";
  const inputFocus = isParent
    ? "focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
    : "focus:border-primary focus:ring-2 focus:ring-primary/20";
  const submitStyle = isParent
    ? "rounded-full bg-amber-400 text-amber-900 hover:opacity-90 shadow-soft"
    : "rounded-xl bg-primary text-primary-foreground hover:opacity-90 shadow-soft";
  const errorStyle = isParent
    ? "bg-red-50 border border-red-200 text-red-700"
    : "bg-destructive/10 text-destructive";

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className={cn("space-y-4", className)}>
      {error && (
        <div className={cn("rounded-xl px-4 py-3 flex items-center gap-3", errorStyle)}>
          <span className="text-sm flex-1">{error}</span>
          {onClearError && (
            <button
              type="button"
              onClick={onClearError}
              className="text-xs font-medium underline shrink-0"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground/80 mb-1.5"
        >
          Email address
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            required
            disabled={isLoading}
            className={cn(
              "w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition",
              inputBorder,
              inputBg,
              inputFocus,
              "disabled:opacity-60",
            )}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground/80 mb-1.5"
        >
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            required
            disabled={isLoading}
            className={cn(
              "w-full rounded-xl border py-3 pl-10 pr-10 text-sm outline-none transition",
              inputBorder,
              inputBg,
              inputFocus,
              "disabled:opacity-60",
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {(showRememberMe || showForgotPassword) && (
        <div className="flex items-center justify-between text-sm">
          {showRememberMe && (
            <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                className={cn(
                  "rounded",
                  isParent ? "border-amber-200 text-amber-400 focus:ring-amber-400/20" : "",
                )}
              />
              Remember me
            </label>
          )}
          {showForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              className={cn(
                "font-medium",
                isParent ? "text-amber-700 hover:text-amber-900" : "text-primary hover:text-primary/80",
              )}
            >
              Forgot password?
            </button>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !email.trim() || !password}
        className={cn(
          "group flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold transition disabled:opacity-60",
          submitStyle,
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            Sign in with email
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </form>
  );
}
