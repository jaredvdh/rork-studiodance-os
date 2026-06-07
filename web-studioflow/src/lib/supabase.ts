import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.EXPO_PUBLIC_SUPABASE_URL as string) || "";
const supabaseAnonKey = (import.meta.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string) || "";

const VALID_URL = supabaseUrl.startsWith("http");

/**
 * Custom fetch wrapper that injects the Rork Auth JWT into every Supabase
 * REST request. This allows RLS policies to use auth.uid() when Supabase
 * is configured to trust Rork's JWKS endpoint.
 *
 * For Supabase to validate Rork JWTs, configure the Supabase project:
 *   Dashboard → Authentication → Settings → JWT Settings
 *   → Add External JWT Secret / JWKS URL: https://api.rork.com/.well-known/jwks.json
 *
 * Until that is configured, RLS policies will see auth.uid() = null.
 * Backend functions use the service_role key (createAdminClient) to
 * bypass RLS, servicing all requests through the backend API layer.
 */
function authenticatedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getAccessToken();
  if (!token) return fetch(input, init);

  const headers = new Headers(init?.headers);
  // Only inject the Rork JWT if there isn't already a Supabase session
  // header set (e.g. from signInWithEmail). The Supabase client sets its
  // own Authorization header when a session exists.
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    if (!VALID_URL) {
      console.warn(
        "Supabase URL not configured — using placeholder. Set EXPO_PUBLIC_SUPABASE_URL to enable live persistence.",
      );
      _client = createClient(
        "https://placeholder.supabase.co",
        "placeholder-key",
        {
          auth: { autoRefreshToken: false, persistSession: false },
          global: { fetch: authenticatedFetch },
        },
      );
    } else {
      _client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { fetch: authenticatedFetch },
      });
    }
  }
  return _client;
}

/**
 * Lazy Supabase client.
 *
 * Uses a Proxy so all property access (e.g. supabase.from('table'), supabase.auth)
 * is routed through the lazily-initialised real client. This prevents a hard crash
 * at module-load time when EXPO_PUBLIC_SUPABASE_URL is missing (e.g. in a preview
 * deployment without Supabase env vars set).
 *
 * All outgoing requests include the Rork Auth JWT (if present) in the
 * Authorization header, enabling RLS-driven multi-tenant queries.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
  set(_target, prop, value, receiver) {
    return Reflect.set(getClient(), prop, value, receiver);
  },
  has(_target, prop) {
    return Reflect.has(getClient(), prop);
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(getClient(), prop);
  },
  ownKeys(_target) {
    return Reflect.ownKeys(getClient());
  },
});

/** Get the current user's access token from localStorage for passing in headers. */
export function getAccessToken(): string | null {
  return localStorage.getItem("rork:access_token");
}

/** Create headers with the auth token for manual fetch calls. */
export function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
