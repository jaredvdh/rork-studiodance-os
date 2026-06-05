/** Locale-aware formatting for StudioFlow. All formatting functions now accept
 *  regional settings as a parameter so every module inherits the studio's
 *  configured country, currency, date format, time format, and measurement system.
 *
 *  For convenience, a React context hook `useRegionalFormat()` is provided that
 *  derives settings from `useStudio()`. */

import { useMemo } from "react";
import { useStudio } from "@/data/studioStore";
import type { CurrencyCode, DateFormat, MeasurementSystem, RegionalSettings } from "@/data/types";
import {
  formatCurrencyRegional,
  formatDateRegional,
  formatTimeRegional,
  formatDateTimeRegional,
  formatDateWithPattern,
  formatHeight,
  formatWeight,
  formatCm,
  resolveRegionalSettings,
  type CountryCode,
  type TimeFormat,
} from "./locale";

// Re-export the low-level helpers for advanced use cases
export {
  formatCurrencyRegional,
  formatDateRegional,
  formatTimeRegional,
  formatDateTimeRegional,
  formatDateWithPattern,
  formatHeight,
  formatWeight,
  formatCm,
  resolveRegionalSettings,
  countryLabel,
  formatPhoneForDisplay,
  stripPhoneFormatting,
  looksLikeInternationalPhone,
  getCountryConfig,
  getCurrencyConfig,
} from "./locale";
export type { CountryCode, CurrencyCode, DateFormat, TimeFormat, MeasurementSystem, RegionalSettings } from "./locale";

/* ── Legacy-compatible wrappers (use studio default settings) ──────── */

/** Format currency in cents according to the current studio's regional settings.
 *  For direct use when you don't have settings available, use formatCurrencyRegional(). */
export function formatCurrency(cents: number, compact = false): string {
  // Legacy fallback — uses USD for backward compat when no studio context
  return formatCurrencyRegional(cents, "USD", compact);
}

/** Format a date according to the current studio's regional settings. */
export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  // Legacy fallback — uses en-US
  return new Date(iso).toLocaleDateString("en-US", opts ?? { month: "short", day: "numeric" });
}

/* ── React hook for regional formatting ───────────────────────────── */

/** React hook that returns format helpers bound to the current studio's regional settings.
 *  Usage: `const { formatCurrency, formatDate, formatTime } = useRegionalFormat();` */
export function useRegionalFormat() {
  const { studio } = useStudio();
  const settings = useMemo(() => resolveRegionalSettings(studio), [studio]);

  return useMemo(() => ({
    settings,
    /** Format a monetary amount (in cents). */
    formatCurrency: (cents: number, compact = false) =>
      formatCurrencyRegional(cents, settings.currency, compact),
    /** Format a date string. */
    formatDate: (iso: string, opts?: Intl.DateTimeFormatOptions) =>
      formatDateRegional(iso, settings, opts),
    /** Format a time string. */
    formatTime: (iso: string, opts?: Intl.DateTimeFormatOptions) =>
      formatTimeRegional(iso, settings, opts),
    /** Format a date+time string. */
    formatDateTime: (iso: string) =>
      formatDateTimeRegional(iso, settings),
    /** Format with a specific date pattern. */
    formatDateWithPattern: (iso: string, df?: DateFormat) =>
      formatDateWithPattern(iso, df ?? settings.dateFormat),
    /** Format height display. */
    formatHeight: (cm: number | undefined) =>
      formatHeight(cm, settings.measurementSystem),
    /** Format weight display. */
    formatWeight: (kg: number | undefined) =>
      formatWeight(kg, settings.measurementSystem),
    /** Format a measurement in cm. */
    formatCm: (cm: number | undefined) =>
      formatCm(cm, settings.measurementSystem),
  }), [settings]);
}

/* ── Non-React helpers (kept for backward compat) ─────────────────── */

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.round(diffMs / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  return `${Math.round(days / 30)}mo ago`;
}

export function ageFromDob(iso: string): number {
  const dob = new Date(iso);
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (365.25 * 86400000));
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
