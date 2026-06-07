/**
 * Central, robust builder for Supabase Edge Function URLs.
 *
 * Edge Functions live at `${PROJECT_URL}/functions/v1/<name>`, NOT under the
 * REST path. Some environments configure EXPO_PUBLIC_SUPABASE_URL with a
 * trailing slash or a `/rest/v1` suffix (the REST endpoint). Appending
 * `/functions/v1/<name>` to such a value produces a broken URL like
 * `.../rest/v1//functions/v1/demo-login` which returns 401.
 *
 * This helper normalises the configured URL down to the bare project origin
 * before building the functions path, so callers always hit the correct
 * endpoint regardless of how the env var is set.
 */

/** Normalise EXPO_PUBLIC_SUPABASE_URL to the bare project origin. */
function getSupabaseProjectUrl(): string | null {
  const raw = (import.meta.env.EXPO_PUBLIC_SUPABASE_URL as string) || "";
  if (!raw || (!raw.startsWith("http://") && !raw.startsWith("https://"))) {
    return null;
  }
  // Strip trailing slashes, then strip a trailing `/rest/v1` (or `/functions/v1`)
  // suffix if the env var was misconfigured with an API path.
  let base = raw.replace(/\/+$/, "");
  base = base.replace(/\/rest\/v1$/i, "");
  base = base.replace(/\/functions\/v1$/i, "");
  base = base.replace(/\/+$/, "");
  return base;
}

/**
 * Build the full URL for a named Supabase Edge Function.
 * Returns null when no valid Supabase URL is configured.
 *
 * @example
 *   getFunctionUrl("demo-login") // -> https://<ref>.supabase.co/functions/v1/demo-login
 */
export function getFunctionUrl(name: string): string | null {
  const base = getSupabaseProjectUrl();
  if (!base) return null;
  const fn = name.replace(/^\/+/, "");
  return `${base}/functions/v1/${fn}`;
}

/** Whether a valid Supabase Edge Functions base is configured. */
export function isFunctionsConfigured(): boolean {
  return getSupabaseProjectUrl() !== null;
}
