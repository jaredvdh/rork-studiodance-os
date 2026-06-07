/**
 * Central demo-mode detection.
 *
 * Demo sessions are entirely client-side: they hold a synthetic, unsigned JWT
 * (the frontend only decodes tokens, never verifies them) and load seeded data
 * from `demo.ts`. They must NEVER hit production Supabase tables or attach their
 * token to Supabase requests.
 *
 * This module is intentionally framework-free so it can be used both inside React
 * (via `isDemoUser`) and outside React (via `isDemoMode`, e.g. in the Supabase
 * fetch wrapper which has no access to context).
 */

const ACCESS_TOKEN_KEY = "rork:access_token";
const USER_META_KEY = "rork:user_meta";

/** Decode a JWT payload without verifying its signature. Returns null on failure. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function flagIsDemo(value: unknown): boolean {
  return value === true || value === "true";
}

/**
 * Whether the current persisted session is a demo session.
 *
 * Reads from localStorage only (no React), so it is safe to call from the
 * Supabase fetch wrapper and other non-component code.
 */
export function isDemoMode(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    const meta = localStorage.getItem(USER_META_KEY);
    if (meta) {
      const parsed = JSON.parse(meta) as { isDemo?: unknown };
      if (flagIsDemo(parsed.isDemo)) return true;
    }
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload && flagIsDemo(payload.is_demo)) return true;
    }
  } catch {
    // Corrupted storage — treat as a non-demo session.
  }
  return false;
}

/** Minimal shape needed to check the demo flag on a user object. */
export interface DemoUserLike {
  isDemo?: boolean;
}

/** Whether the given user object represents a demo user. */
export function isDemoUser(user: DemoUserLike | null | undefined): boolean {
  return user?.isDemo === true;
}
