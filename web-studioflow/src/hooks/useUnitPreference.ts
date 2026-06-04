import { useMemo } from "react";
import type { UnitSystem } from "@/lib/units";
import { useStudio } from "@/data/studioStore";

/** Resolves the effective unit system for the current user.
 *  Studio default → profile override → metric fallback.
 *
 *  For the parent portal, the profile.preferredUnits field
 *  is checked first; for the admin dashboard, the studio
 *  default applies immediately. */
export function useUnitPreference(parentPreference?: UnitSystem | null): {
  preferredUnits: UnitSystem;
  isMetric: boolean;
  isImperial: boolean;
} {
  const { studio } = useStudio();

  return useMemo(() => {
    // 1. Parent explicit override
    if (parentPreference) {
      return {
        preferredUnits: parentPreference,
        isMetric: parentPreference === "metric",
        isImperial: parentPreference === "imperial",
      };
    }

    // 2. Studio default from settings
    const studioDefault = (studio.settings?.preferredUnits ?? "metric") as UnitSystem;

    // 3. Hard fallback
    const resolved = studioDefault || "metric";
    return {
      preferredUnits: resolved,
      isMetric: resolved === "metric",
      isImperial: resolved === "imperial",
    };
  }, [parentPreference, studio.settings]);
}
