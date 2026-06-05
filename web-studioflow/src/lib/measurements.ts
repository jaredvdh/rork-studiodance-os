/** Measurement freshness, history, and growth utilities for Phase 15.
 *  All values are stored internally as metric (cm / kg).
 *  Date formatting accepts optional locale for internationalization. */

import type { StudentMeasurement } from "@/data/types";

/* ── Freshness ─────────────────────────────────────────────── */

export type MeasurementFreshness = "current" | "review" | "stale";

export const FRESHNESS_CONFIG: Record<MeasurementFreshness, {
  label: string;
  color: string;  // Tailwind text color
  bg: string;     // Tailwind background
  dot: string;    // Tailwind dot color
  months: [number, number]; // [min, max) in months
}> = {
  current: {
    label: "Current",
    color: "text-teal",
    bg: "bg-teal/10",
    dot: "bg-teal",
    months: [0, 6],
  },
  review: {
    label: "Review Recommended",
    color: "text-gold",
    bg: "bg-gold/10",
    dot: "bg-gold",
    months: [6, 12],
  },
  stale: {
    label: "Update Required",
    color: "text-rose",
    bg: "bg-rose/10",
    dot: "bg-rose",
    months: [12, Infinity],
  },
};

/** Determine measurement freshness based on last-updated date.
 *  Returns "current" if measuredAt is undefined (no measurement → no staleness to flag). */
export function getMeasurementFreshness(measuredAt?: string): MeasurementFreshness {
  if (!measuredAt) return "current"; // No measurement date = treat as current (not flagged)
  const ageMonths = monthsSince(measuredAt);
  if (ageMonths < 6) return "current";
  if (ageMonths < 12) return "review";
  return "stale";
}

/** Get the freshness config for a measurement. */
export function getFreshnessConfig(measuredAt?: string) {
  return FRESHNESS_CONFIG[getMeasurementFreshness(measuredAt)];
}

/* ── History ────────────────────────────────────────────────── */

/** Sort measurements by measuredAt descending (newest first), then by createdAt. */
export function sortMeasurementsByDate(measurements: StudentMeasurement[]): StudentMeasurement[] {
  return [...measurements].sort((a, b) => {
    const aDate = a.measuredAt ?? a.createdAt;
    const bDate = b.measuredAt ?? b.createdAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });
}

/** Get all historical measurements for a student, newest first. */
export function getMeasurementHistory(
  studentId: string,
  allMeasurements: StudentMeasurement[],
): StudentMeasurement[] {
  return sortMeasurementsByDate(
    allMeasurements.filter((m) => m.studentId === studentId),
  );
}

/* ── Staleness ──────────────────────────────────────────────── */

/** Return student IDs whose most recent approved measurement is stale (>12 months). */
export function getStudentsWithStaleMeasurements(
  studentIds: string[],
  allMeasurements: StudentMeasurement[],
): string[] {
  const approved = allMeasurements.filter((m) => m.status === "approved");
  const latestByStudent = new Map<string, StudentMeasurement>();

  for (const m of approved) {
    const existing = latestByStudent.get(m.studentId);
    if (!existing || new Date(m.measuredAt ?? m.createdAt) > new Date(existing.measuredAt ?? existing.createdAt)) {
      latestByStudent.set(m.studentId, m);
    }
  }

  return studentIds.filter((id) => {
    const latest = latestByStudent.get(id);
    if (!latest) return false; // No approved measurement at all → handled by missing, not stale
    return getMeasurementFreshness(latest.measuredAt) === "stale";
  });
}

/* ── Helpers ────────────────────────────────────────────────── */

function monthsSince(iso: string): number {
  const then = new Date(iso);
  const now = new Date();
  return (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
}

/** Format a date string to a human-readable relative format. */
export function formatLastUpdated(measuredAt?: string): string {
  if (!measuredAt) return "Never";
  const age = monthsSince(measuredAt);
  if (age === 0) return "This month";
  if (age === 1) return "1 month ago";
  if (age < 12) return `${age} months ago`;
  const years = Math.floor(age / 12);
  if (years === 1) return "1 year ago";
  return `${years} years ago`;
}

/** Format a date string to a full date (e.g., "Jun 4, 2026").
 *  Accepts optional locale for internationalization (default "en-US"). */
export function formatDateFull(iso?: string, locale = "en-US"): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
