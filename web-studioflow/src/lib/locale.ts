/** Regional settings, country configs, and locale-aware formatting for StudioFlow.
 *  Single source of truth for all internationalization — date, time, currency,
 *  address labels, phone formats, and measurement systems. */

import type { Studio } from "@/data/types";

/* ── Country definitions ─────────────────────────────────────────── */

export type CountryCode = "CA" | "US" | "NZ" | "AU" | "GB" | "IE" | "EU" | "OTHER";

export interface CountryConfig {
  code: CountryCode;
  name: string;
  /** ISO 4217 currency code */
  currency: CurrencyCode;
  /** IANA timezone identifier (most common for the country) */
  defaultTimezone: string;
  /** Preferred date format */
  dateFormat: DateFormat;
  /** Default time format */
  timeFormat: TimeFormat;
  /** Default measurement system */
  measurementSystem: MeasurementSystem;
  /** Address field labels */
  addressLabels: {
    stateOrProvince: string;   // "State", "Province", "Region", "County"
    postalCode: string;        // "ZIP Code", "Postal Code", "Postcode"
  };
  /** Phone country code (e.g., "+1", "+44") */
  phoneCode: string;
  /** Example phone number for placeholders */
  phoneExample: string;
}

export type CurrencyCode = "CAD" | "USD" | "NZD" | "AUD" | "GBP" | "EUR";

export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

export type TimeFormat = "12h" | "24h";

export type MeasurementSystem = "metric" | "imperial";

export const COUNTRY_CONFIGS: Record<CountryCode, CountryConfig> = {
  CA: {
    code: "CA",
    name: "Canada",
    currency: "CAD",
    defaultTimezone: "America/Toronto",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    measurementSystem: "metric",
    addressLabels: { stateOrProvince: "Province", postalCode: "Postal Code" },
    phoneCode: "+1",
    phoneExample: "+1 416 555 0123",
  },
  US: {
    code: "US",
    name: "United States",
    currency: "USD",
    defaultTimezone: "America/Chicago",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    measurementSystem: "imperial",
    addressLabels: { stateOrProvince: "State", postalCode: "ZIP Code" },
    phoneCode: "+1",
    phoneExample: "+1 212 555 0123",
  },
  NZ: {
    code: "NZ",
    name: "New Zealand",
    currency: "NZD",
    defaultTimezone: "Pacific/Auckland",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    measurementSystem: "metric",
    addressLabels: { stateOrProvince: "Region", postalCode: "Postcode" },
    phoneCode: "+64",
    phoneExample: "+64 21 555 0123",
  },
  AU: {
    code: "AU",
    name: "Australia",
    currency: "AUD",
    defaultTimezone: "Australia/Sydney",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    measurementSystem: "metric",
    addressLabels: { stateOrProvince: "State", postalCode: "Postcode" },
    phoneCode: "+61",
    phoneExample: "+61 412 555 012",
  },
  GB: {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    defaultTimezone: "Europe/London",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    measurementSystem: "metric",
    addressLabels: { stateOrProvince: "County", postalCode: "Postcode" },
    phoneCode: "+44",
    phoneExample: "+44 7700 555 012",
  },
  IE: {
    code: "IE",
    name: "Ireland",
    currency: "EUR",
    defaultTimezone: "Europe/Dublin",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    measurementSystem: "metric",
    addressLabels: { stateOrProvince: "County", postalCode: "Eircode" },
    phoneCode: "+353",
    phoneExample: "+353 87 555 0123",
  },
  EU: {
    code: "EU",
    name: "European Union",
    currency: "EUR",
    defaultTimezone: "Europe/Paris",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    measurementSystem: "metric",
    addressLabels: { stateOrProvince: "Region", postalCode: "Postal Code" },
    phoneCode: "+33",
    phoneExample: "+33 6 12 34 56 78",
  },
  OTHER: {
    code: "OTHER",
    name: "Other",
    currency: "USD",
    defaultTimezone: "UTC",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "24h",
    measurementSystem: "metric",
    addressLabels: { stateOrProvince: "State / Province", postalCode: "Postal Code" },
    phoneCode: "+1",
    phoneExample: "+1 555 0123",
  },
};

/** All countries for select dropdowns, ordered by commonality. */
export const ALL_COUNTRIES: CountryCode[] = [
  "CA", "US", "NZ", "AU", "GB", "IE", "EU", "OTHER",
];

/* ── Currency configs ─────────────────────────────────────────────── */

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  /** Number of decimal places (0 for JPY, 2 for most) */
  decimals: number;
  /** Locale string for Intl.NumberFormat */
  locale: string;
}

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  CAD: { code: "CAD", symbol: "CA$", name: "Canadian Dollar", decimals: 2, locale: "en-CA" },
  USD: { code: "USD", symbol: "$", name: "US Dollar", decimals: 2, locale: "en-US" },
  NZD: { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", decimals: 2, locale: "en-NZ" },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar", decimals: 2, locale: "en-AU" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", decimals: 2, locale: "en-GB" },
  EUR: { code: "EUR", symbol: "€", name: "Euro", decimals: 2, locale: "de-DE" },
};

/* ── Regional settings resolver ────────────────────────────────────── */

export interface RegionalSettings {
  country: CountryCode;
  timezone: string;
  currency: CurrencyCode;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  measurementSystem: MeasurementSystem;
}

export const DEFAULT_REGIONAL_SETTINGS: RegionalSettings = {
  country: "US",
  timezone: "America/Chicago",
  currency: "USD",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  measurementSystem: "imperial",
};

/** Resolve the effective regional settings from a Studio record. */
export function resolveRegionalSettings(studio?: Studio | null): RegionalSettings {
  if (studio?.settings?.regional) return studio.settings.regional;
  // Backward compat: derive from legacy fields if available
  if (studio?.settings) {
    const country = (studio.settings as Record<string, unknown>).country as CountryCode | undefined;
    if (country && COUNTRY_CONFIGS[country]) {
      const cfg = COUNTRY_CONFIGS[country];
      return {
        country,
        timezone: cfg.defaultTimezone,
        currency: cfg.currency,
        dateFormat: cfg.dateFormat,
        timeFormat: cfg.timeFormat,
        measurementSystem: (studio.settings.preferredUnits ?? cfg.measurementSystem) as MeasurementSystem,
      };
    }
  }
  return DEFAULT_REGIONAL_SETTINGS;
}

/** Get the country config for a studio or country code. */
export function getCountryConfig(country: CountryCode): CountryConfig {
  return COUNTRY_CONFIGS[country] ?? COUNTRY_CONFIGS.OTHER;
}

/** Get the currency config. */
export function getCurrencyConfig(currency: CurrencyCode): CurrencyConfig {
  return CURRENCY_CONFIGS[currency] ?? CURRENCY_CONFIGS.USD;
}

/* ── Locale-aware format helpers ───────────────────────────────────── */

/** Format a monetary amount (in cents) according to regional settings. */
export function formatCurrencyRegional(cents: number, currency: CurrencyCode, compact = false): string {
  const cfg = getCurrencyConfig(currency);
  const amount = cents / Math.pow(10, cfg.decimals);
  try {
    return new Intl.NumberFormat(cfg.locale, {
      style: "currency",
      currency: cfg.code,
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 1 : cfg.decimals,
    }).format(amount);
  } catch {
    // Fallback for environments that don't support the locale
    return `${cfg.symbol}${(amount / 100).toFixed(cfg.decimals)}`;
  }
}

/** Format a date string according to regional settings. */
export function formatDateRegional(
  iso: string,
  settings: RegionalSettings,
  opts?: Intl.DateTimeFormatOptions,
): string {
  const locale = getDateLocale(settings);
  return new Date(iso).toLocaleDateString(locale, opts ?? {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format a time string according to regional settings. */
export function formatTimeRegional(
  iso: string,
  settings: RegionalSettings,
  opts?: Intl.DateTimeFormatOptions,
): string {
  const locale = getDateLocale(settings);
  return new Date(iso).toLocaleTimeString(locale, opts ?? {
    hour: "numeric",
    minute: "2-digit",
    hour12: settings.timeFormat === "12h",
  });
}

/** Format a date+time string according to regional settings. */
export function formatDateTimeRegional(
  iso: string,
  settings: RegionalSettings,
): string {
  const locale = getDateLocale(settings);
  return new Date(iso).toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: settings.timeFormat === "12h",
  });
}

/** Get the best Intl locale for a given regional settings. */
function getDateLocale(settings: RegionalSettings): string {
  const localeByCountry: Record<string, string> = {
    CA: "en-CA",
    US: "en-US",
    NZ: "en-NZ",
    AU: "en-AU",
    GB: "en-GB",
    IE: "en-IE",
  };
  return localeByCountry[settings.country] ?? "en-US";
}

/** Get the country label for the given country code. */
export function countryLabel(code: CountryCode): string {
  return COUNTRY_CONFIGS[code]?.name ?? code;
}

/* ── Date format tokens ────────────────────────────────────────────── */

/** Get a format token string for date inputs (e.g., "dd/mm/yyyy"). */
export function dateFormatToken(df: DateFormat): string {
  switch (df) {
    case "DD/MM/YYYY": return "dd/mm/yyyy";
    case "MM/DD/YYYY": return "mm/dd/yyyy";
    case "YYYY-MM-DD": return "yyyy-mm-dd";
  }
}

/** Format a date string using a specific date format pattern. */
export function formatDateWithPattern(iso: string, df: DateFormat): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  switch (df) {
    case "DD/MM/YYYY": return `${dd}/${mm}/${yyyy}`;
    case "MM/DD/YYYY": return `${mm}/${dd}/${yyyy}`;
    case "YYYY-MM-DD": return `${yyyy}-${mm}-${dd}`;
  }
}

/* ── Measurement format helpers ────────────────────────────────────── */

/** Format height display based on measurement system. */
export function formatHeight(cm: number | undefined, system: MeasurementSystem): string {
  if (cm === undefined || cm === null) return "—";
  if (system === "imperial") {
    const totalInches = cm / 2.54;
    const ft = Math.floor(totalInches / 12);
    const inch = Math.round(totalInches % 12);
    if (inch === 12) return `${ft + 1} ft 0 in`;
    return `${ft} ft ${inch} in`;
  }
  return `${Math.round(cm)} cm`;
}

/** Format weight display based on measurement system. */
export function formatWeight(kg: number | undefined, system: MeasurementSystem): string {
  if (kg === undefined || kg === null) return "—";
  if (system === "imperial") {
    return `${Math.round(kg * 2.20462)} lb`;
  }
  return `${Math.round(kg)} kg`;
}

/** Format a measurement in cm to display units. */
export function formatCm(cm: number | undefined, system: MeasurementSystem): string {
  if (cm === undefined || cm === null) return "—";
  if (system === "imperial") {
    const inches = cm / 2.54;
    return `${inches.toFixed(1)} in`;
  }
  return `${Math.round(cm)} cm`;
}

/* ── Phone number helpers ──────────────────────────────────────────── */

/** Strip all non-digit characters from a phone string (keep leading +). */
export function stripPhoneFormatting(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  return `+${cleaned}`;
}

/** Check if a string looks like a valid international phone number (E.164-ish). */
export function looksLikeInternationalPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/** Format an E.164 phone for display with country-aware spacing. */
export function formatPhoneForDisplay(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) return cleaned;
  // Simple grouping: country code + spaced groups
  if (cleaned.startsWith("+1")) {
    // NANP: +1 XXX XXX XXXX
    const rest = cleaned.slice(2);
    if (rest.length === 10) return `+1 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
    return `+1 ${rest}`;
  }
  if (cleaned.startsWith("+44")) {
    const rest = cleaned.slice(3);
    if (rest.length >= 10) return `+44 ${rest.slice(0, 4)} ${rest.slice(4)}`;
    return `+44 ${rest}`;
  }
  if (cleaned.startsWith("+64")) {
    const rest = cleaned.slice(3);
    return `+64 ${rest}`;
  }
  // Generic: just return with + prefix
  return cleaned;
}
