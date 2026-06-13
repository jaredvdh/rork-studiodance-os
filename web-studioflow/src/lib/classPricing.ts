/** Class pricing / billing helpers.
 *
 * Dance (and many other) studios rarely bill per individual class — tuition is
 * often by term, season, package, membership, or manual invoicing. This module
 * models three pricing modes so the Add/Edit Class flow never forces a price:
 *
 *  - "price"    → an explicit amount with an optional billing frequency/label
 *  - "included" → no separate charge ("Included in tuition" / "Included in membership")
 *  - "none"     → pricing hidden entirely (trials, rehearsals, comp groups, manual)
 */

import type { Class } from "@/data/types";

export type ClassPricingMode = "price" | "included" | "none";

/** Common billing frequencies offered in the picker. The empty string allows
 * a fully custom label typed by the owner. */
export const BILLING_FREQUENCIES = [
  { value: "month", label: "Monthly", suffix: "/mo" },
  { value: "term", label: "Per term", suffix: "/term" },
  { value: "season", label: "Per season", suffix: "/season" },
  { value: "week", label: "Weekly", suffix: "/wk" },
  { value: "class", label: "Per class", suffix: "/class" },
  { value: "drop-in", label: "Drop-in", suffix: "drop-in" },
  { value: "year", label: "Annual", suffix: "/yr" },
] as const;

/** Preset "included" labels. */
export const INCLUDED_LABELS = [
  "Included in tuition",
  "Included in membership",
] as const;

/** Resolve the effective pricing mode, defaulting legacy records to "price". */
export function classPricingMode(cls: Pick<Class, "pricingMode">): ClassPricingMode {
  return cls.pricingMode ?? "price";
}

/** Revenue (in cents) a class contributes per enrolled student per period.
 * Only "price" mode contributes — included/none tuition is modelled elsewhere. */
export function classRevenueCents(cls: Pick<Class, "pricingMode" | "priceCents">): number {
  return classPricingMode(cls) === "price" ? cls.priceCents : 0;
}

/** Display description of a class price. */
export interface ClassPriceDisplay {
  /** Whether any pricing should be rendered at all. */
  show: boolean;
  /** Formatted amount (price mode only), e.g. "$180". */
  amount?: string;
  /** Suffix shown after the amount, e.g. "/term", "/mo", "drop-in". */
  suffix?: string;
  /** Standalone text shown instead of an amount, e.g. "Included in tuition". */
  text?: string;
}

/** Resolve how a class price should be displayed on cards and schedules. */
export function classPriceDisplay(
  cls: Pick<Class, "pricingMode" | "priceCents" | "billingFrequency" | "includedLabel">,
  formatCurrency: (cents: number) => string,
): ClassPriceDisplay {
  const mode = classPricingMode(cls);

  if (mode === "none") return { show: false };

  if (mode === "included") {
    return { show: true, text: cls.includedLabel?.trim() || "Included in tuition" };
  }

  const freq = (cls.billingFrequency ?? "month").trim();
  const preset = BILLING_FREQUENCIES.find((f) => f.value === freq.toLowerCase());
  // Drop-in style suffixes have no leading slash; custom labels get "/ label".
  const suffix = preset
    ? preset.suffix
    : freq
      ? `/${freq}`
      : "";
  return { show: true, amount: formatCurrency(cls.priceCents), suffix };
}

/** Compact one-line price string for dense lists (students, payments, links). */
export function classPriceInline(
  cls: Pick<Class, "pricingMode" | "priceCents" | "billingFrequency" | "includedLabel">,
  formatCurrency: (cents: number) => string,
): string {
  const d = classPriceDisplay(cls, formatCurrency);
  if (!d.show) return "";
  if (d.text) return d.text;
  return `${d.amount ?? ""}${d.suffix ? ` ${d.suffix}` : ""}`.trim();
}
