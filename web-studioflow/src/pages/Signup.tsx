import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, MailCheck, Sparkles, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  AuthCard,
  AuthCardIcon,
  AuthCardHeader,
} from "@/components/auth/AuthCard";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { cn } from "@/lib/utils";

const STUDIO_CACHE_KEY = "studioflow_studio";
const ONBOARDING_KEY = "studioflow_onboarding_completed";
const SETUP_COMPLETE_KEY = "studioflow_setup_complete";

/**
 * Clear any cached studio / onboarding state so a brand-new account starts on a
 * blank studio and is taken through the real onboarding flow (no demo leftovers).
 */
function resetLocalStudioState(): void {
  localStorage.removeItem(STUDIO_CACHE_KEY);
  localStorage.removeItem(ONBOARDING_KEY);
  localStorage.removeItem(SETUP_COMPLETE_KEY);
}

/**
 * Customer account creation — the start of the real onboarding journey.
 * Generic StudioFlow branding (not tied to any studio). After the account is
 * created, the user lands on the dashboard where the setup wizard guides them
 * through creating their studio, choosing a type and completing onboarding.
 */
export default function Signup() {
  const navigate = useNavigate();
  const { signIn, signUpWithEmail, isSigningIn, error, clearError } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    clearError();
    resetLocalStudioState();

    await signUpWithEmail(email.trim(), password, {
      name: name.trim() || undefined,
      role: "studio_admin",
    });

    // If a session was created immediately, the auth provider now has a user
    // and we can head straight into onboarding. If email confirmation is
    // required, no session exists yet — show a "check your email" state.
    const token = localStorage.getItem("rork:access_token");
    if (token) {
      navigate("/dashboard");
    } else {
      setConfirmationSent(true);
    }
  };

  if (confirmationSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md animate-float-up text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <MailCheck className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Confirm your email</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We've sent a confirmation link to <span className="font-medium text-foreground">{email.trim()}</span>.
            Open it to activate your account, then sign in to set up your studio.
          </p>
          <Link
            to="/login"
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90"
          >
            Go to sign-in <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md animate-float-up">
        {/* Generic StudioFlow brand — not tied to a studio */}
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#1a1423] font-display text-lg font-semibold text-white">
            SF
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">
            StudioFlow
          </span>
        </Link>

        <AuthCard variant="admin">
          <AuthCardIcon variant="admin">
            <Sparkles className="h-7 w-7" />
          </AuthCardIcon>
          <AuthCardHeader
            title="Start your free trial"
            subtitle="Create your account — no credit card required."
          />

          {/* OAuth — fastest path to an account */}
          <OAuthButtons
            onSignIn={signIn}
            isLoading={isSigningIn}
            emphasis="oauth-first"
            variant="admin"
            className="mt-6"
          />

          <AuthDivider label="or sign up with email" variant="admin" className="mt-6" />

          <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
            {error && (
              <div className="flex items-center gap-3 rounded-xl bg-destructive/10 px-4 py-3">
                <span className="flex-1 text-sm text-destructive">{error}</span>
                <button type="button" onClick={clearError} className="shrink-0 text-xs font-medium underline">
                  Dismiss
                </button>
              </div>
            )}

            <Field
              id="name"
              label="Your name"
              icon={User}
              type="text"
              value={name}
              onChange={setName}
              placeholder="Jordan Lee"
              autoComplete="name"
            />
            <Field
              id="email"
              label="Email address"
              icon={Mail}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@email.com"
              autoComplete="email"
              required
            />
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground/80">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  disabled={isSigningIn}
                  className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
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

            <button
              type="submit"
              disabled={isSigningIn || !email.trim() || password.length < 8}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 disabled:opacity-60"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
                </>
              ) : (
                <>
                  Create account <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </p>
        </AuthCard>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:text-primary/80 transition">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}: {
  id: string;
  label: string;
  icon: typeof Mail;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground/80">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={cn(
            "w-full rounded-xl border border-input bg-background py-3 pl-10 pr-4 text-sm outline-none transition",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
          )}
        />
      </div>
    </div>
  );
}
