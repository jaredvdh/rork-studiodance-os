/**
 * Test / Sandbox studio client.
 *
 * Creates REAL Supabase-backed test studios via the `test-studio` Edge Function
 * (service_role), then signs the test admin in using NATIVE Supabase Auth
 * (email/password). Native auth means `auth.uid()` resolves and every RLS policy
 * works exactly as in production — without depending on the legacy demo-login
 * edge function or Rork→Supabase JWKS trust.
 *
 * Sandbox isolation:
 *   • Every studio/profile created here is marked is_test = true.
 *   • Deleting a test studio cascades to all its data and removes the test
 *     auth users — real studios are untouched.
 */

import { supabase } from "@/lib/supabase";
import { getFunctionUrl } from "@/lib/supabaseFunctions";
import type { Vertical } from "@/data/types";

const ACCESS_TOKEN_KEY = "rork:access_token";
const REFRESH_TOKEN_KEY = "rork:refresh_token";
const USER_META_KEY = "rork:user_meta";
const STUDIO_CACHE_KEY = "studioflow_studio";
const ONBOARDING_KEY = "studioflow_onboarding_completed";
const SETUP_COMPLETE_KEY = "studioflow_setup_complete";

export interface TestStudioCredentials {
  email: string;
  password: string;
}

export interface CreateTestStudioResult {
  ok: boolean;
  studioId: string;
  vertical: Vertical;
  seeded: boolean;
  admin: TestStudioCredentials;
  portal: { email: string; password: string; role: string; participants: string[] } | null;
  results: string[];
  errors: string[];
  counts: Record<string, number>;
}

export interface CreateTestStudioOptions {
  vertical: Vertical;
  studioName: string;
  brandColor?: string;
  seed: boolean;
}

function functionUrlOrThrow(name: string): string {
  const url = getFunctionUrl(name);
  if (!url) {
    throw new Error("Supabase is not configured — cannot create a test studio.");
  }
  return url;
}

async function callTestStudio(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const url = functionUrlOrThrow("test-studio");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error((data.error as string) || `Request failed (${res.status})`);
  }
  return data;
}

/**
 * Clear any cached studio / onboarding state so the freshly created sandbox
 * studio loads cleanly for the newly signed-in identity.
 */
function clearLocalStudioState(seeded: boolean): void {
  localStorage.removeItem(STUDIO_CACHE_KEY);
  if (seeded) {
    // Seeded studios skip onboarding and land on a populated dashboard.
    localStorage.setItem(ONBOARDING_KEY, "true");
    localStorage.setItem(SETUP_COMPLETE_KEY, "true");
  } else {
    // Blank studios go through the real onboarding/setup flow.
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(SETUP_COMPLETE_KEY);
  }
}

/**
 * Sign in with a native Supabase email/password account and persist the session
 * tokens the same way the auth provider does (so a page reload restores it).
 */
export async function signInTestAccount(
  email: string,
  password: string,
  fallbackRole: string,
): Promise<{ role: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(error?.message ?? "Sign-in failed for test account");
  }
  const su = data.session.user;
  const role = (su.user_metadata?.role as string) ?? fallbackRole;
  localStorage.setItem(ACCESS_TOKEN_KEY, data.session.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.session.refresh_token);
  localStorage.setItem(USER_META_KEY, JSON.stringify({
    id: su.id,
    email: su.email ?? email,
    name: su.user_metadata?.name as string,
    role,
    studioId: su.user_metadata?.studio_id as string,
    isDemo: false,
  }));
  return { role };
}

/** Create a test studio and sign in as its admin. Returns full creation result. */
export async function createTestStudio(opts: CreateTestStudioOptions): Promise<CreateTestStudioResult> {
  const data = await callTestStudio({
    action: "create",
    vertical: opts.vertical,
    studioName: opts.studioName,
    brandColor: opts.brandColor,
    seed: opts.seed,
  });

  const result: CreateTestStudioResult = {
    ok: data.ok === true,
    studioId: data.studioId as string,
    vertical: data.vertical as Vertical,
    seeded: data.seeded === true,
    admin: data.admin as TestStudioCredentials,
    portal: (data.portal as CreateTestStudioResult["portal"]) ?? null,
    results: (data.results as string[]) ?? [],
    errors: (data.errors as string[]) ?? [],
    counts: (data.counts as Record<string, number>) ?? {},
  };

  // Sign in as the new admin via native Supabase Auth, then clear cached state.
  clearLocalStudioState(result.seeded);
  await signInTestAccount(result.admin.email, result.admin.password, "studio_admin");

  return result;
}

/** Add realistic sample data to an existing test studio. */
export async function seedTestStudio(studioId: string): Promise<Record<string, unknown>> {
  return callTestStudio({ action: "seed", studioId });
}

/**
 * Delete a test studio and all its sandbox data (cascade) plus the test auth
 * users it provisioned. The backend refuses to delete a non-test studio.
 */
export async function deleteTestStudio(studioId: string): Promise<{ ok: boolean; removedUsers: number }> {
  const data = await callTestStudio({ action: "delete", studioId });
  return { ok: data.ok === true, removedUsers: (data.removedUsers as number) ?? 0 };
}
