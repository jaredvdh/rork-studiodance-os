/** Unit conversion and display formatting for the global unit system.
 *  All values are stored internally as metric (cm / kg).
 *  The UI converts at render time based on user preference. */

export type UnitSystem = "metric" | "imperial";

/** Height: cm ↔ ft/in */
export function cmToFtIn(cm: number): { ft: number; inches: number } {
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  // Handle inch overflow (e.g. 11.97 → 12)
  if (inches === 12) return { ft: ft + 1, inches: 0 };
  return { ft, inches };
}

export function ftInToCm(ft: number, inches: number): number {
  return Math.round((ft * 12 + inches) * 2.54 * 10) / 10;
}

export function formatHeight(cm: number | undefined | null, units: UnitSystem): string {
  if (cm == null) return "—";
  if (units === "metric") return `${Math.round(cm)} cm`;
  const { ft, inches } = cmToFtIn(cm);
  return `${ft} ft ${inches} in`;
}

/** Weight: kg ↔ lb */
export function kgToLb(kg: number): number {
  return Math.round(kg * 2.20462);
}

export function lbToKg(lb: number): number {
  return Math.round(lb / 2.20462 * 10) / 10;
}

export function formatWeight(kg: number | undefined | null, units: UnitSystem): string {
  if (kg == null) return "—";
  if (units === "metric") return `${Math.round(kg)} kg`;
  return `${kgToLb(kg)} lb`;
}

/** Generic cm measurement (chest, waist, hips, girth, inseam) */
export function formatCm(value: number | undefined | null, units: UnitSystem): string {
  if (value == null) return "—";
  if (units === "metric") return `${Math.round(value)} cm`;
  const inches = Math.round(value / 2.54 * 10) / 10;
  return `${inches} in`;
}

export function cmToIn(value: number): number {
  return Math.round(value / 2.54 * 10) / 10;
}

export function inToCm(value: number): number {
  return Math.round(value * 2.54 * 10) / 10;
}

/** Height validation — flags impossible values based on the active unit system */
export function validateHeight(value: number, units: UnitSystem): string | null {
  if (units === "metric") {
    if (value < 40) return "Height is unusually low. Did you mean cm?";
    if (value > 250) return "Height is unusually high. Did you mean cm?";
  } else {
    // Value is in inches (raw input before conversion)
    if (value > 96) return "Height over 8 ft — please check"; 
    if (value < 12) return "Height under 1 ft — please check";
  }
  return null;
}

/** Weight validation */
export function validateWeight(value: number, units: UnitSystem): string | null {
  if (units === "metric") {
    if (value < 2) return "Weight is unusually low. Did you mean kg?";
    if (value > 250) return "Weight is unusually high. Did you mean kg?";
  } else {
    if (value < 4) return "Weight under 4 lb — please check";
    if (value > 600) return "Weight over 600 lb — please check";
  }
  return null;
}
