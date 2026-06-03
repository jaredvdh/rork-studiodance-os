import { Link, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "@/data/store";
import {
  AuthCard,
  AuthCardIcon,
  AuthCardHeader,
} from "@/components/auth/AuthCard";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { EmailLoginForm } from "@/components/auth/EmailLoginForm";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { studio } = useStudio();
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
        {/* Brand */}
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary font-display text-lg font-semibold text-primary-foreground">
            {studio.initials}
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
            title="Studio Dashboard"
            subtitle={`Sign in to manage ${studio.name}`}
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

        <div className="mt-6 text-center">
          <Link
            to="/parent/login"
            className="text-sm font-medium text-primary hover:text-primary/80 transition"
          >
            Parent/Student Portal →
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition">
            ← Back to {studio.name}
          </Link>
        </p>
      </div>
    </div>
  );
}
