import { Beaker, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoBadgeProps {
  /** Visual variant */
  variant?: "pill" | "banner";
  /** Optional className override */
  className?: string;
}

/** Shows a "Demo account" indicator in the app shell when a demo user is logged in. */
export function DemoBadge({ variant = "pill", className }: DemoBadgeProps) {
  if (variant === "banner") {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 border-b border-amber-300/60 bg-amber-100/80 px-4 py-1.5 text-xs font-medium text-amber-800 backdrop-blur-sm",
          className,
        )}
      >
        <Beaker className="h-3.5 w-3.5" />
        <span>Demo environment — seeded data for evaluation only</span>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700",
        className,
      )}
    >
      <Beaker className="h-3 w-3" />
      Demo
    </span>
  );
}

interface ResetDemoButtonProps {
  className?: string;
}

/** Admin-only button to reset demo data to factory defaults. */
export function ResetDemoButton({ className }: ResetDemoButtonProps) {
  const handleReset = async () => {
    if (!confirm("Reset all demo data to factory defaults? This cannot be undone.")) return;

    try {
      const functionsUrl = `${import.meta.env.EXPO_PUBLIC_SUPABASE_URL as string}/functions/v1`;
      const token = localStorage.getItem("rork:access_token");
      const res = await fetch(`${functionsUrl}/seed-demo-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reset: true }),
      });
      const data = await res.json();
      if (data.ok) {
        alert("Demo data has been reset. The page will reload.");
        window.location.reload();
      } else {
        alert(`Reset completed with warnings: ${data.errors?.join(", ") ?? "Unknown error"}`);
        window.location.reload();
      }
    } catch (err) {
      alert(`Reset failed: ${err instanceof Error ? err.message : "Network error"}`);
    }
  };

  return (
    <button
      onClick={() => void handleReset()}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100",
        className,
      )}
    >
      <RefreshCw className="h-3 w-3" />
      Reset demo data
    </button>
  );
}

/** Returns true if the current session is a demo account. */
export function isDemoSession(): boolean {
  try {
    const token = localStorage.getItem("rork:access_token");
    if (!token) return false;
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    return payload?.is_demo === true;
  } catch {
    return false;
  }
}
