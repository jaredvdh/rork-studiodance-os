import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useStudio } from "@/data/store";
import { useAuth } from "@/hooks/useAuth";
import {
  AuthCard,
  AuthCardIcon,
  AuthCardHeader,
} from "@/components/auth/AuthCard";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { EmailLoginForm } from "@/components/auth/EmailLoginForm";

export default function ParentLogin() {
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
    <div className="min-h-screen bg-parent flex flex-col items-center justify-center px-4 py-12">
      <Link
        to="/"
        className="mb-8 flex items-center gap-2.5 animate-float-up"
      >
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400 font-display text-lg font-semibold text-amber-900">
          {studio.initials}
        </div>
        <span className="font-display text-xl font-semibold tracking-tight">
          StudioFlow
        </span>
      </Link>

      <div className="w-full max-w-md animate-float-up [animation-delay:80ms]">
        <AuthCard variant="parent">
          <AuthCardIcon variant="parent">
            <Heart className="h-7 w-7" />
          </AuthCardIcon>
          <AuthCardHeader
            title="Parent/Student Portal"
            subtitle={`Sign in to manage your children's classes, payments, and waivers at ${studio.name}`}
          />

          {/* OAuth buttons — balanced emphasis for parents / caregivers */}
          <OAuthButtons
            onSignIn={signIn}
            isLoading={isSigningIn}
            emphasis="balanced"
            variant="parent"
            className="mt-6"
          />

          {/* Divider */}
          <AuthDivider
            label="or sign in with email"
            variant="parent"
            className="mt-6"
          />

          {/* Email/password form */}
          <EmailLoginForm
            onSubmit={handleEmailSignIn}
            isLoading={isSigningIn}
            error={error}
            onClearError={clearError}
            variant="parent"
            showRememberMe
            showForgotPassword
            className="mt-4"
          />

          {/* Register link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Don't have an account?
            </p>
            <Link
              to="/parent/register"
              className="inline-flex items-center gap-2 rounded-full border-2 border-amber-200 bg-white px-6 py-2.5 text-sm font-semibold text-amber-700 shadow-soft transition hover:bg-amber-50 hover:border-amber-300"
            >
              <Heart className="h-4 w-4" />
              Register your family
            </Link>
          </div>
        </AuthCard>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/login" className="hover:text-foreground transition">
            Studio owner? Sign in to the admin dashboard →
          </Link>
        </p>
      </div>
    </div>
  );
}
