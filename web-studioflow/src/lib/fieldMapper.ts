import type { FieldMapping } from "@/data/migrationTypes";
import { STUDENT_FIELDS, CLASS_FIELDS, INSTRUCTOR_FIELDS } from "@/data/migrationTypes";

/** Normalize a string for comparison: lowercase, trim, remove special chars. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Compute a simple similarity score between two normalized strings (0–100). */
function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);

  // Exact match
  if (na === nb) return 100;

  // One contains the other
  if (na.includes(nb) || nb.includes(na)) {
    const shorter = na.length < nb.length ? na : nb;
    const longer = na.length < nb.length ? nb : na;
    return Math.round(85 + (shorter.length / longer.length) * 10);
  }

  // Word-level overlap
  const wordsA = new Set(na.split(" "));
  const wordsB = new Set(nb.split(" "));
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  const totalWords = Math.max(wordsA.size, wordsB.size);
  if (totalWords === 0) return 0;
  return Math.round((overlap / totalWords) * 70);
}

/** Field definition with aliases for matching. */
interface FieldDef {
  field: string;
  label: string;
  required: boolean;
  aliases: string[];
}

const FIELD_DEFS: Record<string, FieldDef[]> = {
  students: STUDENT_FIELDS,
  classes: CLASS_FIELDS,
  instructors: INSTRUCTOR_FIELDS,
};

/** Auto-map spreadsheet columns to target fields based on the import category. */
export function autoMapFields(
  headers: string[],
  sampleRows: Record<string, string>[],
  category: string,
): FieldMapping[] {
  const defs = FIELD_DEFS[category] ?? [];

  return headers.map((header) => {
    let bestField: string | null = null;
    let bestConfidence = 0;
    let bestRequired = false;

    for (const def of defs) {
      // Check exact alias match
      for (const alias of def.aliases) {
        const score = similarity(header, alias);
        if (score > bestConfidence) {
          bestConfidence = score;
          bestField = def.field;
          bestRequired = def.required;
        }
      }

      // Also check against the field name itself
      const directScore = similarity(header, def.field);
      if (directScore > bestConfidence) {
        bestConfidence = directScore;
        bestField = def.field;
        bestRequired = def.required;
      }
    }

    // If no match found with confidence > 40, leave unmapped
    if (bestConfidence < 40) {
      bestField = null;
      bestRequired = false;
    }

    // Collect sample values (up to 3)
    const sampleValues = sampleRows
      .slice(0, 3)
      .map((row) => row[header] ?? "")
      .filter(Boolean);

    return {
      spreadsheetColumn: header,
      targetField: bestField,
      confidence: Math.max(0, Math.min(100, bestConfidence)),
      isRequired: bestRequired,
      sampleValues,
    };
  });
}

/** Apply mappings to raw rows, producing mapped records. */
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

/** Check which required fields are missing from the mappings. */
export function missingRequiredFields(mappings: FieldMapping[]): string[] {
  const mappedFields = new Set(
    mappings.filter((m) => m.targetField).map((m) => m.targetField),
  );

  const allDefs = Object.values(FIELD_DEFS).flat();
  const required = allDefs.filter((d) => d.required).map((d) => d.field);
  return required.filter((f) => !mappedFields.has(f));
}
