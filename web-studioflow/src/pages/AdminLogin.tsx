import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  AuthCard,
  AuthCardIcon,
  AuthCardHeader,
} from "@/components/auth/AuthCard";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { EmailLoginForm } from "@/components/auth/EmailLoginForm";

export default function AdminLogin() {
  const {
    isSigningIn,
    error,
    signIn,
    signInWithEmail,
    signInDemo,
    clearError,
  } = useAuth();

  const handleEmailSignIn = async (email: string, password: string) => {
    // Detect demo accounts — route through demo-login edge function
    if (email.toLowerCase().endsWith("@studioflow.app")) {
      try {
        const user = await signInDemo(email, password);
        window.location.href = user.role === "parent" || user.role === "caregiver"
          ? "/parent"
          : "/dashboard";
      } catch {
        // Error already set by signInDemo
      }
      return;
    }
    await signInWithEmail(email, password);
  };

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
            title="Welcome back"
            subtitle="Sign in to your studio dashboard"
          />

          {/* OAuth buttons — primary emphasis for admin */}
          <OAuthButtons
            onSignIn={signIn}
            isLoading={isSigningIn}
            emphasis="oauth-first"
            variant="admin"
            className="mt-6"
          />

          {/* Divider */}
          <AuthDivider
            label="or continue with email"
            variant="admin"
            className="mt-6"
          />

          {/* Email/password form — secondary */}
          <EmailLoginForm
            onSubmit={handleEmailSignIn}
            isLoading={isSigningIn}
            error={error}
            onClearError={clearError}
            variant="admin"
            showRememberMe
            showForgotPassword
            className="mt-4"
          />

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By signing in you agree to our Terms of Service and Privacy Policy.
          </p>
        </AuthCard>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to StudioFlow?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:text-primary/80 transition">
            Start your free trial
          </Link>
        </p>

        <div className="mt-5 text-center">
          <Link
            to="/parent/login"
            className="text-sm font-medium text-primary hover:text-primary/80 transition"
          >
            Parent/Student Portal →
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
