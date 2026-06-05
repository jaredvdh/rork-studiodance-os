import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.EXPO_PUBLIC_SUPABASE_URL as string) || "";
const supabaseAnonKey = (import.meta.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string) || "";

const VALID_URL = supabaseUrl.startsWith("http");

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
        { auth: { autoRefreshToken: false, persistSession: false } },
      );
    } else {
      _client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
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

/** Create headers with the auth token for Supabase API calls. */
export function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
