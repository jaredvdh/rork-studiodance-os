import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { studio as defaultStudio } from "./demo";
import { getTerminology } from "./terminology";
import type { VerticalTerminology } from "./terminology";
import type { Studio } from "./types";

/* ── Studio branding (persisted to localStorage) ──────────────────── */

const STUDIO_KEY = "studioflow_studio";

function loadStudio(): Studio {
  try {
    const raw = localStorage.getItem(STUDIO_KEY);
    if (raw) return JSON.parse(raw) as Studio;
  } catch { /* ignore corrupt data */ }
  return { ...defaultStudio };
}

function saveStudio(s: Studio) {
  localStorage.setItem(STUDIO_KEY, JSON.stringify(s));
}

interface StudioCtx {
  studio: Studio;
  updateStudio: (patch: Partial<Omit<Studio, "id">>) => void;
}

const StudioContext = createContext<StudioCtx | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [studio, setStudio] = useState<Studio>(loadStudio);

  const updateStudio = useCallback((patch: Partial<Omit<Studio, "id">>) => {
    setStudio((prev) => {
      const next = { ...prev, ...patch };
      saveStudio(next);
      return next;
    });
  }, []);

  // Apply studio brandColor as a CSS custom property on mount / change
  useEffect(() => {
    document.documentElement.style.setProperty("--studio-brand", studio.brandColor);
  }, [studio.brandColor]);

  return (
    <StudioContext.Provider value={{ studio, updateStudio }}>
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used within StudioProvider");
  return ctx;
}

/** Returns the user-facing terminology for the current studio's vertical.
 * Labels like "Students"/"Athletes"/"Members" adjust automatically. */
export function useTerminology(): VerticalTerminology {
  const { studio } = useStudio();
  return getTerminology(studio.vertical);
}
