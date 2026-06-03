import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Where to redirect unauthenticated users. Defaults to /login for admin, /parent/login for parent. */
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const fallback = location.pathname.startsWith("/parent") ? "/parent/login" : "/login";
    return <Navigate to={redirectTo ?? fallback} state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

/** Redirects authenticated users away from login/register pages. */
export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (user) {
    const isParent = user.role === "parent" || user.role === "caregiver";
    return <Navigate to={isParent ? "/parent" : "/dashboard"} replace />;
  }

  return <>{children}</>;
}
