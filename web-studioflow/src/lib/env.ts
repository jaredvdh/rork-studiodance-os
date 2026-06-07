/**
 * Centralised environment-variable validation.
 *
 * Surfaces clear, actionable errors when required production configuration is
 * missing — instead of failing silently deep inside a network call. Safe to
 * import anywhere; `validateEnvironment()` only logs (never throws) so a
 * mis-configured preview still renders the UI with degraded features.
 */

interface EnvVar {
  key: string;
  /** Human description of what breaks without it. */
  purpose: string;
  /** Whether the app is unusable in production without it. */
  required: boolean;
}

const ENV_VARS: EnvVar[] = [
  { key: "EXPO_PUBLIC_SUPABASE_URL", purpose: "Database, storage, auth and edge functions", required: true },
  { key: "EXPO_PUBLIC_SUPABASE_ANON_KEY", purpose: "Public Supabase client key", required: true },
  { key: "EXPO_PUBLIC_RORK_AUTH_URL", purpose: "Google/Apple sign-in via Rork Auth", required: true },
  { key: "EXPO_PUBLIC_RORK_APP_KEY", purpose: "Rork Auth app identification", required: true },
  { key: "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY", purpose: "Live payments (omit to run in simulated mode)", required: false },
];

function readEnv(key: string): string {
  try {
    return (import.meta.env as Record<string, string>)[key] ?? "";
  } catch {
    return "";
  }
}

export interface EnvStatus {
  missingRequired: string[];
  missingOptional: string[];
  stripeMode: "live" | "simulated";
  supabaseConfigured: boolean;
}

/** Compute the current environment status without side effects. */
export function getEnvStatus(): EnvStatus {
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  for (const v of ENV_VARS) {
    const value = readEnv(v.key);
    if (value) continue;
    if (v.required) missingRequired.push(v.key);
    else missingOptional.push(v.key);
  }

  const pk = readEnv("EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  const stripeMode: EnvStatus["stripeMode"] =
    pk && !pk.startsWith("pk_placeholder") && !pk.startsWith("pk_test_placeholder")
      ? "live"
      : "simulated";

  return {
    missingRequired,
    missingOptional,
    stripeMode,
    supabaseConfigured: readEnv("EXPO_PUBLIC_SUPABASE_URL").startsWith("http"),
  };
}

/**
 * Validate the environment at startup. Logs clear errors/warnings but never
 * throws — the UI must still render so users see a helpful message rather than
 * a white screen.
 */
export function validateEnvironment(): EnvStatus {
  const status = getEnvStatus();

  if (status.missingRequired.length > 0) {
    console.error(
      "[StudioFlow] Missing REQUIRED environment variables — the app will not work in production until these are set:\n" +
        status.missingRequired
          .map((k) => {
            const meta = ENV_VARS.find((v) => v.key === k);
            return `  • ${k} — ${meta?.purpose ?? ""}`;
          })
          .join("\n"),
    );
  }

  if (status.stripeMode === "simulated") {
    console.warn(
      "[StudioFlow] Payments are running in SIMULATED mode. Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY " +
        "(and the SUPABASE_STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET edge-function secrets) to enable live payments.",
    );
  }

  return status;
}
