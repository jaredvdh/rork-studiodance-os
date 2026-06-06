import type { FieldMapping, FieldDef, MatchReason } from "@/data/migrationTypes";
import {
  STUDENT_FIELDS,
  CAREGIVER_FIELDS,
  CLASS_FIELDS,
  INSTRUCTOR_FIELDS,
  ENROLMENT_FIELDS,
  PAYMENT_FIELDS,
} from "@/data/migrationTypes";

/* ── Normalisation & similarity ─────────────────────────────────── */

/** Normalize a string for comparison: lowercase, trim, remove special chars. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Dice coefficient for word-level fuzzy matching (0–1). */
function diceCoefficient(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;

  const wordsA = na.split(" ").filter(Boolean);
  const wordsB = nb.split(" ").filter(Boolean);

  if (wordsA.length === 0 || wordsB.length === 0) {
    // Fall back to substring check
    return na.includes(nb) || nb.includes(na) ? 0.6 : 0;
  }

  // Build bigrams from each word set
  const bigramsA = new Set<string>();
  for (const w of wordsA) {
    for (let i = 0; i < w.length - 1; i++) {
      bigramsA.add(w.slice(i, i + 2));
    }
  }
  const bigramsB = new Set<string>();
  for (const w of wordsB) {
    for (let i = 0; i < w.length - 1; i++) {
      bigramsB.add(w.slice(i, i + 2));
    }
  }

  let overlap = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) overlap++;
  }

  const total = bigramsA.size + bigramsB.size;
  if (total === 0) return 0;
  return (2 * overlap) / total;
}

/* ── Field dictionaries by category ─────────────────────────────── */

const FIELD_DEFS: Record<string, FieldDef[]> = {
  students: STUDENT_FIELDS,
  caregivers: CAREGIVER_FIELDS,
  classes: CLASS_FIELDS,
  instructors: INSTRUCTOR_FIELDS,
  enrolments: ENROLMENT_FIELDS,
  payments: PAYMENT_FIELDS,
};

/** Build a lookup: normalized alias → field definition for a category. */
function buildAliasLookup(defs: FieldDef[]): Map<string, { def: FieldDef; isExact: boolean }> {
  const map = new Map<string, { def: FieldDef; isExact: boolean }>();

  for (const def of defs) {
    // Exact match on field name (e.g. "Student ID" → studentId)
    map.set(normalize(def.field), { def, isExact: true });
    // Exact match on label (e.g. "First Name" → firstName)
    map.set(normalize(def.label), { def, isExact: true });
    // Synonym matches from aliases
    for (const alias of def.aliases) {
      const norm = normalize(alias);
      if (!map.has(norm)) {
        map.set(norm, { def, isExact: false });
      }
    }
  }

  return map;
}

/* ── Core mapping engine ─────────────────────────────────────────── */

export interface AutoMapResult {
  targetField: string | null;
  confidence: number;
  matchReason: MatchReason;
  isRequired: boolean;
  matchedDef: FieldDef | null;
}

/**
 * Auto-map a single spreadsheet column header to a StudioFlow field.
 *
 * Matching tiers (in order of priority):
 * 1. **Exact Match** — normalized header exactly equals a field name, label, or alias (confidence 95–100)
 * 2. **Synonym Match** — normalized header matches an alias (confidence 85–94)
 * 3. **Fuzzy Match** — Dice coefficient similarity against all known labels/aliases (confidence 40–84)
 *
 * Only falls through to the next tier if no match was found in the current tier
 * above a minimum confidence threshold.
 */
export function mapColumn(
  header: string,
  aliasLookup: Map<string, { def: FieldDef; isExact: boolean }>,
  allDefs: FieldDef[],
): AutoMapResult {
  const normHeader = normalize(header);
  if (!normHeader) {
    return { targetField: null, confidence: 0, matchReason: null, isRequired: false, matchedDef: null };
  }

  // ── Tier 1: Exact match (dictionary lookup) ──
  const exact = aliasLookup.get(normHeader);
  if (exact && exact.isExact) {
    return {
      targetField: exact.def.field,
      confidence: 100,
      matchReason: "exact",
      isRequired: exact.def.required,
      matchedDef: exact.def,
    };
  }

  // ── Tier 2: Synonym match (alias, not exact field name) ──
  if (exact && !exact.isExact) {
    return {
      targetField: exact.def.field,
      confidence: 90,
      matchReason: "synonym",
      isRequired: exact.def.required,
      matchedDef: exact.def,
    };
  }

  // Check for partial containment within aliases (e.g. "Student Name" contains "name")
  for (const def of allDefs) {
    const allTerms = [def.label, ...def.aliases];
    for (const term of allTerms) {
      const normTerm = normalize(term);
      if (normTerm === normHeader) {
        // This should've been caught by tier 1, but just in case
        return { targetField: def.field, confidence: 98, matchReason: "exact", isRequired: def.required, matchedDef: def };
      }
      // One contains the other entirely (e.g. "Primary Caregiver Email" contains "email")
      if (normHeader.includes(normTerm) && normTerm.length >= 4) {
        return { targetField: def.field, confidence: 85, matchReason: "synonym", isRequired: def.required, matchedDef: def };
      }
      if (normTerm.includes(normHeader) && normHeader.length >= 4) {
        return { targetField: def.field, confidence: 85, matchReason: "synonym", isRequired: def.required, matchedDef: def };
      }
    }
  }

  // ── Tier 3: Fuzzy matching (only when no dictionary match) ──
  let bestDef: FieldDef | null = null;
  let bestScore = 0;

  for (const def of allDefs) {
    const allTerms = [def.label, ...def.aliases];
    for (const term of allTerms) {
      const score = diceCoefficient(header, term);
      if (score > bestScore) {
        bestScore = score;
        bestDef = def;
      }
    }
  }

  // Fuzzy match confidence: scale Dice 0–1 → 40–84 range
  // Dice ≥0.75 → 80+, Dice ≥0.5 → 65+, Dice ≥0.35 → 50+, else unmapped
  if (bestDef && bestScore >= 0.5) {
    const confidence = Math.round(45 + bestScore * 45); // 45 + (0.5*45=22.5) → 67.5 min, 45 + (1*45) → 90 max
    return {
      targetField: bestDef.field,
      confidence: Math.min(84, confidence), // Cap fuzzy at 84
      matchReason: "fuzzy",
      isRequired: bestDef.required,
      matchedDef: bestDef,
    };
  }

  if (bestDef && bestScore >= 0.35) {
    const confidence = Math.round(40 + bestScore * 20); // 40 + (0.35*20=7) → 47 min
    return {
      targetField: bestDef.field,
      confidence: Math.min(50, confidence),
      matchReason: "fuzzy",
      isRequired: bestDef.required,
      matchedDef: bestDef,
    };
  }

  // No match found
  return { targetField: null, confidence: 0, matchReason: null, isRequired: false, matchedDef: null };
}

/* ── Public API ──────────────────────────────────────────────────── */

/**
 * Auto-map all spreadsheet column headers to StudioFlow fields for a given category.
 * Uses tiered matching: exact → synonym → fuzzy.
 */
export function autoMapFields(
  headers: string[],
  sampleRows: Record<string, string>[],
  category: string,
): FieldMapping[] {
  const defs = FIELD_DEFS[category] ?? STUDENT_FIELDS;
  const aliasLookup = buildAliasLookup(defs);

  return headers.map((header) => {
    const result = mapColumn(header, aliasLookup, defs);

    // Collect sample values (up to 3)
    const sampleValues = sampleRows
      .slice(0, 3)
      .map((row) => row[header] ?? "")
      .filter(Boolean);

    return {
      spreadsheetColumn: header,
      targetField: result.targetField,
      confidence: result.confidence,
      isRequired: result.isRequired,
      sampleValues,
      matchReason: result.matchReason,
    };
  });
}

/**
 * Run cross-field validation on mappings to detect obviously incorrect matches.
 * Returns a revised mapping with downgraded confidence for suspicious matches.
 */
export function validateMappings(mappings: FieldMapping[], _sampleRows: Record<string, string>[]): FieldMapping[] {
  const mappedFields = new Map<string, string>(); // targetField → spreadsheetColumn

  for (const m of mappings) {
    if (m.targetField) {
      mappedFields.set(m.targetField, m.spreadsheetColumn);
    }
  }

  return mappings.map((m) => {
    if (!m.targetField || !m.matchReason) return m;

    let downgrade = false;
    let reason = "";

    // Check: email-like column mapped to name field
    const headerLower = m.spreadsheetColumn.toLowerCase();
    const targetLower = m.targetField.toLowerCase();

    // Email → Name mismatch
    if (
      (headerLower.includes("email") || headerLower.includes("e-mail")) &&
      (targetLower.includes("name") && !targetLower.includes("email"))
    ) {
      downgrade = true;
      reason = "Email column mapped to name field";
    }

    // Name → Email mismatch
    if (
      (headerLower.includes("name") && !headerLower.includes("email")) &&
      (targetLower.includes("email") || targetLower.includes("e-mail"))
    ) {
      downgrade = true;
      reason = "Name column mapped to email field";
    }

    // Phone → Name mismatch
    if (
      (headerLower.includes("phone") || headerLower.includes("mobile") || headerLower.includes("cell")) &&
      (targetLower.includes("name") && !targetLower.includes("phone"))
    ) {
      downgrade = true;
      reason = "Phone column mapped to name field";
    }

    // Date → Phone mismatch
    if (
      (headerLower.includes("date") || headerLower.includes("dob") || headerLower.includes("birth")) &&
      (targetLower.includes("phone") || targetLower.includes("mobile"))
    ) {
      downgrade = true;
      reason = "Date column mapped to phone field";
    }

    // ID → Name mismatch (Student ID mapped to Student Name)
    if (
      headerLower.includes("id") &&
      !headerLower.includes("address") &&
      (targetLower.includes("name") && !targetLower.includes("id"))
    ) {
      downgrade = true;
      reason = "ID column mapped to name field";
    }

    // Rate/price → email mismatch
    if (
      (headerLower.includes("rate") || headerLower.includes("price") || headerLower.includes("amount") || headerLower.includes("cost")) &&
      (targetLower.includes("email") || targetLower.includes("phone"))
    ) {
      downgrade = true;
      reason = "Amount/price column mapped to contact field";
    }

    if (downgrade) {
      return {
        ...m,
        confidence: Math.max(0, m.confidence - 40),
        matchReason: "fuzzy" as MatchReason,
      };
    }

    return m;
  });
}

/**
 * Apply mappings to raw rows, producing mapped records.
 */
export function applyMappings(
  rows: Array<{ index: number; raw: Record<string, string> }>,
  mappings: FieldMapping[],
): Array<{ index: number; mapped: Record<string, string> }> {
  const columnToField: Record<string, string> = {};
  for (const m of mappings) {
    if (m.targetField) {
      columnToField[m.spreadsheetColumn] = m.targetField;
    }
  }

  return rows.map((row) => {
    const mapped: Record<string, string> = {};
    for (const [col, val] of Object.entries(row.raw)) {
      const field = columnToField[col];
      if (field) {
        mapped[field] = val;
      }
    }
    return { index: row.index, mapped };
  });
}

/**
 * Check which required fields are missing from the mappings.
 */
export function missingRequiredFields(mappings: FieldMapping[], category: string): string[] {
  const mappedFields = new Set(
    mappings.filter((m) => m.targetField).map((m) => m.targetField),
  );

  const defs = FIELD_DEFS[category] ?? STUDENT_FIELDS;
  const required = defs.filter((d) => d.required).map((d) => d.field);
  return required.filter((f) => !mappedFields.has(f));
}

/**
 * Get all field definitions for a given category.
 */
export function getFieldDefs(category: string): FieldDef[] {
  return FIELD_DEFS[category] ?? STUDENT_FIELDS;
}
