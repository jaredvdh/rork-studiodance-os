import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Heart,
  Mail,
  Lock,
} from "lucide-react";
import type { FormEvent } from "react";

import { useStudio } from "@/data/store";
import { useAuth } from "@/hooks/useAuth";

export default function ParentLogin() {
  const { studio } = useStudio();
  const { isSigningIn, error, signIn, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void signIn("google");
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
        <div className="rounded-3xl border border-amber-200/70 bg-white p-8 shadow-lift">
          <div className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-600">
              <Heart className="h-7 w-7" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-semibold">
              Parent/Student Portal
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to manage your children's classes, payments, and waivers
              at {studio.name}
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3">
              <span className="text-sm text-red-700 flex-1">{error}</span>
              <button
                onClick={clearError}
                className="text-xs font-medium text-red-700 underline shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="mt-6">
            <button
              type="button"
              onClick={() => signIn("google")}
              disabled={isSigningIn}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-amber-200 bg-white py-3 text-sm font-medium text-foreground shadow-soft transition hover:bg-amber-50 disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {isSigningIn ? "Signing in…" : "Continue with Google"}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
                  placeholder="you@email.com"
                  className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
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
                  placeholder="Your password"
                  className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-3 pl-10 pr-10 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-amber-200 text-amber-400 focus:ring-amber-400/20"
                />
                Remember me
              </label>
              <button
                type="button"
                className="font-medium text-amber-700 hover:text-amber-900"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSigningIn}
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 py-3 text-sm font-semibold text-amber-900 shadow-soft transition hover:opacity-90 disabled:opacity-60"
            >
              {isSigningIn ? "Signing in…" : "Sign in with email"}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
          </form>

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
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/dashboard" className="hover:text-foreground transition">
            Studio owner? Sign in to the admin dashboard →
          </Link>
        </p>
      </div>
    </div>
  );
}
