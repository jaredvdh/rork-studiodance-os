import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { studio as defaultStudio } from "./demo";
import { getTerminology } from "./terminology";
import type { VerticalTerminology } from "./terminology";
import type { Studio, RegionalSettings } from "./types";
import { DEFAULT_REGIONAL_SETTINGS } from "@/lib/locale";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

/* ── Studio branding (Supabase-backed with localStorage cache) ─────── */

const STUDIO_KEY = "studioflow_studio";
const ONBOARDING_KEY = "studioflow_onboarding_completed";

function loadCachedStudio(): Studio {
  try {
    const raw = localStorage.getItem(STUDIO_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Studio;
      if (!parsed.settings?.regional) {
        parsed.settings = { ...parsed.settings, regional: DEFAULT_REGIONAL_SETTINGS };
      }
      return parsed;
    }
  } catch { /* ignore corrupt data */ }
  return { ...defaultStudio };
}

function cacheStudio(s: Studio) {
  localStorage.setItem(STUDIO_KEY, JSON.stringify(s));
}

/** Fetch the studio for the given owner from Supabase. Returns null if none exists. */
async function fetchStudioFromSupabase(ownerId: string): Promise<Studio | null> {
  try {
    const { data, error } = await supabase
      .from("studios")
      .select("*")
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (error || !data) return null;
    return mapSupabaseStudio(data);
  } catch {
    return null;
  }
}

/** Map a supabase studios row to our Studio type. */
function mapSupabaseStudio(row: Record<string, unknown>): Studio {
  return {
    id: row.id as string,
    name: row.name as string,
    tagline: (row.tagline as string) || "",
    city: (row.city as string) || "",
    brandColor: (row.brand_color as string) || defaultStudio.brandColor,
    initials: (row.initials as string) || defaultStudio.initials,
    logoUrl: (row.logo_url as string) || undefined,
    bannerUrl: (row.banner_url as string) || undefined,
    vertical: (row.vertical as Studio["vertical"]) || defaultStudio.vertical,
    settings: { regional: DEFAULT_REGIONAL_SETTINGS },
  };
}

/** Upsert the studio to Supabase. Creates if no id match, updates otherwise. */
async function upsertStudioToSupabase(s: Studio, ownerId: string): Promise<void> {
  try {
    // Check if the studio already exists for this owner
    const { data: existing } = await supabase
      .from("studios")
      .select("id")
      .eq("owner_id", ownerId)
      .maybeSingle();

    const row = {
      name: s.name,
      tagline: s.tagline,
      city: s.city,
      brand_color: s.brandColor,
      initials: s.initials,
      logo_url: s.logoUrl,
      banner_url: s.bannerUrl,
      vertical: s.vertical,
      owner_id: ownerId,
    };

    if (existing?.id) {
      await supabase.from("studios").update(row).eq("id", existing.id);
    } else if (s.id && s.id !== defaultStudio.id) {
      // Try upsert with the existing ID (may fail if not a valid UUID from Supabase)
      await supabase.from("studios").upsert({ ...row, id: s.id });
    } else {
      await supabase.from("studios").insert(row);
    }
  } catch {
    // Supabase write failed — localStorage cache still holds the data
  }
}

/** Mark onboarding completed in the profiles table. */
async function markOnboardingComplete(userId: string): Promise<void> {
  try {
    const now = new Date().toISOString();
    await supabase
      .from("profiles")
      .upsert({
        id: userId,
        onboarding_completed: true,
        onboarding_completed_at: now,
        updated_at: now,
      });
    localStorage.setItem(ONBOARDING_KEY, "true");
  } catch {
    // Non-critical — local flag suffices
    localStorage.setItem(ONBOARDING_KEY, "true");
  }
}

function isOnboardingCompleted(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}

interface StudioCtx {
  studio: Studio;
  updateStudio: (patch: Partial<Omit<Studio, "id">>) => void;
  onboardingCompleted: boolean;
  completeOnboarding: () => Promise<void>;
}

const StudioContext = createContext<StudioCtx | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [studio, setStudio] = useState<Studio>(loadCachedStudio);
  const [onboardingCompleted, setOnboardingCompleted] = useState(isOnboardingCompleted);
  const [supabaseSynced, setSupabaseSynced] = useState(false);

  // On mount (or when user changes), fetch the real studio from Supabase
  useEffect(() => {
    if (!user || user.isDemo || supabaseSynced) return;

    const userId = user.id;
    let cancelled = false;

    (async () => {
      const remote = await fetchStudioFromSupabase(userId);
      if (cancelled) return;
      if (remote) {
        setStudio(remote);
        cacheStudio(remote);
        setSupabaseSynced(true);
      } else {
        // No studio yet — create one from the cached/local data
        const current = loadCachedStudio();
        await upsertStudioToSupabase(current, userId);
        setSupabaseSynced(true);
      }
      // Check onboarding status from profiles
      checkOnboardingFromProfile(userId).then((completed) => {
        if (completed) {
          setOnboardingCompleted(true);
          localStorage.setItem(ONBOARDING_KEY, "true");
        }
      });
    })();

    return () => { cancelled = true; };
  }, [user, supabaseSynced]);

  const updateStudio = useCallback((patch: Partial<Omit<Studio, "id">>) => {
    setStudio((prev) => {
      const next = { ...prev, ...patch };
      cacheStudio(next);
      // Sync to Supabase in the background
      if (user && !user.isDemo) {
        upsertStudioToSupabase(next, user.id).catch(() => {});
      }
      return next;
    });
  }, [user]);

  const completeOnboarding = useCallback(async () => {
    if (user && !user.isDemo) {
      await markOnboardingComplete(user.id);
    } else {
      localStorage.setItem(ONBOARDING_KEY, "true");
    }
    setOnboardingCompleted(true);
  }, [user]);

  // Apply studio brandColor as a CSS custom property on mount / change
  useEffect(() => {
    document.documentElement.style.setProperty("--studio-brand", studio.brandColor);
  }, [studio.brandColor]);

  return (
    <StudioContext.Provider value={{ studio, updateStudio, onboardingCompleted, completeOnboarding }}>
      {children}
    </StudioContext.Provider>
  );
}

/** Check the profiles table for onboarding status. */
async function checkOnboardingFromProfile(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", userId)
      .maybeSingle();
    if (error || !data) return false;
    return data.onboarding_completed === true;
  } catch {
    return false;
  }
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used within StudioProvider");
  return ctx;
}

/** Access onboarding state and complete-onboarding action. */
export function useOnboarding() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useOnboarding must be used within StudioProvider");
  return { onboardingCompleted: ctx.onboardingCompleted, completeOnboarding: ctx.completeOnboarding };
}

/** Returns the user-facing terminology for the current studio's vertical.
 * Labels like "Students"/"Athletes"/"Members" adjust automatically. */
export function useTerminology(): VerticalTerminology {
  const { studio } = useStudio();
  return getTerminology(studio.vertical);
}
