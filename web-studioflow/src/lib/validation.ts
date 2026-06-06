import type { FieldMapping, ImportError } from "@/data/migrationTypes";
import type { Class, Student, Teacher } from "@/data/types";

export interface ValidationContext {
  existingStudents: Student[];
  existingClasses: Class[];
  existingTeachers: Teacher[];
  mappedRows: Array<{ index: number; mapped: Record<string, string> }>;
  category: string;
  /** Mappings for cross-field validation */
  mappings?: FieldMapping[];
}

/* ── Normalisation helpers ───────────────────────────────────────── */

function normEmail(e: string): string {
  return e.toLowerCase().trim();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function looksLikePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function looksLikeEmail(val: string): boolean {
  return isValidEmail(val.trim());
}

function looksLikeDate(val: string): boolean {
  if (!val) return false;
  const d = new Date(val);
  if (!isNaN(d.getTime())) return true;
  // Also check common date patterns: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
  return /^\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4}$/.test(val.trim());
}

function looksLikeNumber(val: string): boolean {
  if (!val) return false;
  // Strip currency symbols and commas
  const cleaned = val.trim().replace(/[$€£,\s]/g, "");
  return !isNaN(Number(cleaned)) && cleaned.length > 0;
}

function looksLikeId(val: string): boolean {
  if (!val) return false;
  // IDs are typically alphanumeric, not natural language
  const trimmed = val.trim();
  // Has digits and is short (typical ID pattern)
  return /\d/.test(trimmed) && trimmed.length <= 20;
}

function isValidDob(dob: string): boolean {
  if (!dob) return true;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const ageYears = (now.getTime() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return ageYears >= 0 && ageYears <= 100;
}

/* ── Cross-field mapping validation ─────────────────────────────── */

/**
 * Detect obviously incorrect field mappings by comparing the column header
 * semantics with the target field semantics, and by inspecting sample values.
 */
function validateMappingSemantics(
  mappings: FieldMapping[],
  sampleRows: Record<string, string>[],
  errors: ImportError[],
): void {
  for (const m of mappings) {
    if (!m.targetField) continue;

    const colLower = m.spreadsheetColumn.toLowerCase();
    const targetLower = m.targetField.toLowerCase();

    // 1. Email column mapped to a name field
    if (
      (colLower.includes("email") || colLower.includes("e-mail")) &&
      (targetLower.includes("name") && !targetLower.includes("email") && !targetLower.includes("contact"))
    ) {
      errors.push({
        row: -1,
        field: m.spreadsheetColumn,
        message: `Column "${m.spreadsheetColumn}" looks like an email field but is mapped to "${m.targetField}" (a name field). This is likely incorrect.`,
        severity: "error",
      });
    }

    // 2. Phone column mapped to a name field
    if (
      (colLower.includes("phone") || colLower.includes("mobile") || colLower.includes("cell")) &&
      (targetLower.includes("name") && !targetLower.includes("phone") && !targetLower.includes("emergency"))
    ) {
      errors.push({
        row: -1,
        field: m.spreadsheetColumn,
        message: `Column "${m.spreadsheetColumn}" looks like a phone field but is mapped to "${m.targetField}" (a name/contact-name field). Verify this mapping.`,
        severity: "warning",
      });
    }

    // 3. Date column mapped to a phone field
    if (
      (colLower.includes("date") || colLower.includes("dob") || colLower.includes("birth")) &&
      (targetLower.includes("phone") || targetLower.includes("mobile") || targetLower.includes("cell"))
    ) {
      errors.push({
        row: -1,
        field: m.spreadsheetColumn,
        message: `Column "${m.spreadsheetColumn}" looks like a date field but is mapped to "${m.targetField}" (a phone field). This is likely incorrect.`,
        severity: "error",
      });
    }

    // 4. ID column mapped to a name field
    if (
      (colLower.includes("id") || colLower.includes("number") || colLower.includes("#")) &&
      !colLower.includes("address") &&
      (targetLower.includes("name") && !targetLower.includes("id"))
    ) {
      errors.push({
        row: -1,
        field: m.spreadsheetColumn,
        message: `Column "${m.spreadsheetColumn}" looks like an identifier field but is mapped to "${m.targetField}" (a name field). Review this mapping.`,
        severity: "warning",
      });
    }

    // 5. Price/amount/rate column mapped to a contact field
    if (
      (colLower.includes("rate") || colLower.includes("price") || colLower.includes("amount") ||
       colLower.includes("cost") || colLower.includes("fee") || colLower.includes("pay")) &&
      (targetLower.includes("email") || targetLower.includes("phone") || targetLower.includes("contact"))
    ) {
      errors.push({
        row: -1,
        field: m.spreadsheetColumn,
        message: `Column "${m.spreadsheetColumn}" looks like a monetary/rate field but is mapped to "${m.targetField}" (a contact field). Verify this mapping.`,
        severity: "warning",
      });
    }
  }

  // 6. Check sample values to detect semantic mismatches
  for (const m of mappings) {
    if (!m.targetField || !m.sampleValues || m.sampleValues.length === 0) continue;

    const targetLower = m.targetField.toLowerCase();
    const firstVal = m.sampleValues[0] ?? "";

    // If target is email but sample doesn't look like email
    if (targetLower.includes("email") && firstVal && !looksLikeEmail(firstVal)) {
      const allNonEmail = m.sampleValues.every((v) => v && !looksLikeEmail(v));
      if (allNonEmail && m.sampleValues.length >= 2) {
        errors.push({
          row: -1,
          field: m.spreadsheetColumn,
          message: `"${m.spreadsheetColumn}" is mapped to "${m.targetField}" but sample values don't look like email addresses (e.g. "${firstVal.slice(0, 30)}"). Review this mapping.`,
          severity: "error",
        });
      }
    }

    // If target is phone but sample looks like a date
    if ((targetLower.includes("phone") || targetLower.includes("mobile")) && firstVal) {
      const allLooksDate = m.sampleValues.every((v) => v && looksLikeDate(v) && !looksLikePhone(v));
      if (allLooksDate && m.sampleValues.length >= 2) {
        errors.push({
          row: -1,
          field: m.spreadsheetColumn,
          message: `"${m.spreadsheetColumn}" is mapped to "${m.targetField}" but sample values look like dates (e.g. "${firstVal}"). Verify this mapping.`,
          severity: "error",
        });
      }
    }

    // If target is a name field but samples look like IDs
    if (targetLower.includes("name") && !targetLower.includes("id") && firstVal) {
      const allLookLikeIds = m.sampleValues.every((v) => v && looksLikeId(v) && !/^[a-zA-Z\s]{3,}$/.test(v));
      if (allLookLikeIds && m.sampleValues.length >= 2) {
        errors.push({
          row: -1,
          field: m.spreadsheetColumn,
          message: `"${m.spreadsheetColumn}" is mapped to "${m.targetField}" but sample values look like IDs (e.g. "${firstVal}"). A different mapping may be needed.`,
          severity: "warning",
        });
      }
    }
  }
}

/* ── Main validation entry point ─────────────────────────────────── */

export function validateImport(ctx: ValidationContext): ImportError[] {
  const errors: ImportError[] = [];

  // Run cross-field mapping validation first
  if (ctx.mappings && ctx.mappings.length > 0) {
    const sampleRows = ctx.mappedRows.slice(0, 5).map((r) => r.mapped);
    validateMappingSemantics(ctx.mappings, sampleRows, errors);
  }

  // --- Student validations ---
  if (ctx.category === "students" || ctx.category === "caregivers") {
    validateStudents(ctx, errors);
  }

  // --- Class validations ---
  if (ctx.category === "classes") {
    validateClasses(ctx, errors);
  }

  // --- Instructor validations ---
  if (ctx.category === "instructors") {
    validateInstructors(ctx, errors);
  }

  // --- Enrolment validations ---
  if (ctx.category === "enrolments") {
    validateEnrolments(ctx, errors);
  }

  // --- Payment validations ---
  if (ctx.category === "payments") {
    validatePayments(ctx, errors);
  }

  return errors;
}

/* ── Row-level validators ───────────────────────────────────────── */

function validateStudents(ctx: ValidationContext, errors: ImportError[]): void {
  const seenEmails = new Map<string, number>();
  const seenNames = new Map<string, number>();

  for (const row of ctx.mappedRows) {
    const { index, mapped } = row;

    // Determine the effective name: prefer firstName+lastName, fall back to full name
    const firstName = mapped.firstName?.trim();
    const lastName = mapped.lastName?.trim();
    const fullName = mapped.name?.trim();
    const effectiveName = (firstName && lastName)
      ? `${firstName} ${lastName}`
      : fullName;

    // Required: student name (either via firstName or name)
    if (!effectiveName && !firstName && !fullName) {
      errors.push({ row: index, field: "name", message: "Student name is required (map First Name + Last Name, or Full Name)", severity: "error" });
    } else if (effectiveName) {
      const nameNorm = effectiveName.toLowerCase();
      if (seenNames.has(nameNorm)) {
        errors.push({ row: index, field: "name", message: `Duplicate student name — also found in row ${seenNames.get(nameNorm)}`, severity: "warning" });
      }
      seenNames.set(nameNorm, index);

      const existingMatch = ctx.existingStudents.find(
        (s) => s.name.toLowerCase().trim() === nameNorm,
      );
      if (existingMatch) {
        errors.push({ row: index, field: "name", message: `"${effectiveName}" already exists in your studio`, severity: "error" });
      }
    }

    // Required: caregiver email (check both parentEmail and primary caregiver variants)
    const email = mapped.parentEmail?.trim() || mapped.email?.trim();
    if (!email) {
      errors.push({ row: index, field: "parentEmail", message: "Caregiver email is required", severity: "error" });
    } else if (!isValidEmail(email)) {
      errors.push({ row: index, field: "parentEmail", message: `"${email}" doesn't look like a valid email`, severity: "error" });
    } else {
      const emailNorm = normEmail(email);
      if (seenEmails.has(emailNorm)) {
        errors.push({ row: index, field: "parentEmail", message: `Duplicate email — also used in row ${seenEmails.get(emailNorm)}`, severity: "warning" });
      }
      seenEmails.set(emailNorm, index);

      const parentShared = ctx.mappedRows.filter(
        (r) => r.index !== index && normEmail(r.mapped.parentEmail ?? r.mapped.email ?? "") === emailNorm,
      );
      if (parentShared.length > 0 && !mapped.parentName) {
        errors.push({ row: index, field: "parentEmail", message: "Shared caregiver email — consider adding caregiver name for clarity", severity: "warning" });
      }
    }

    // Optional: phone format
    const phone = mapped.parentPhone?.trim() || mapped.phone?.trim();
    if (phone) {
      if (!looksLikePhone(phone)) {
        errors.push({ row: index, field: "parentPhone", message: `"${phone}" doesn't look like a valid phone number`, severity: "warning" });
      }
    }

    // Optional: DOB validity
    const dob = mapped.dob?.trim();
    if (dob) {
      if (!isValidDob(dob)) {
        errors.push({ row: index, field: "dob", message: `"${dob}" is not a valid date of birth`, severity: "warning" });
      }
    }
  }
}

function validateClasses(ctx: ValidationContext, errors: ImportError[]): void {
  const seenNames = new Map<string, number>();

  for (const row of ctx.mappedRows) {
    const { index, mapped } = row;

    if (!mapped.name || mapped.name.trim() === "") {
      errors.push({ row: index, field: "name", message: "Class name is required", severity: "error" });
    } else {
      const nameNorm = mapped.name.trim().toLowerCase();
      if (seenNames.has(nameNorm)) {
        errors.push({ row: index, field: "name", message: `Duplicate class name — also in row ${seenNames.get(nameNorm)}`, severity: "error" });
      }
      seenNames.set(nameNorm, index);

      const existing = ctx.existingClasses.find(
        (c) => c.name.toLowerCase().trim() === nameNorm,
      );
      if (existing) {
        errors.push({ row: index, field: "name", message: `"${mapped.name}" already exists`, severity: "error" });
      }
    }

    // Teacher name matching
    if (mapped.teacherName && mapped.teacherName.trim() !== "") {
      const teacherNorm = mapped.teacherName.trim().toLowerCase();
      const exists = ctx.existingTeachers.some(
        (t) => t.name.toLowerCase().trim() === teacherNorm,
      );
      if (!exists) {
        errors.push({ row: index, field: "teacherName", message: `Instructor "${mapped.teacherName}" not found — will be skipped`, severity: "warning" });
      }
    }

    // Duration should be a number
    if (mapped.durationMins && mapped.durationMins.trim() !== "") {
      const dur = Number(mapped.durationMins);
      if (isNaN(dur) || dur <= 0 || dur > 480) {
        errors.push({ row: index, field: "durationMins", message: `"${mapped.durationMins}" is not a valid duration (1–480 minutes)`, severity: "warning" });
      }
    }

    // Capacity should be a number
    if (mapped.capacity && mapped.capacity.trim() !== "") {
      const cap = Number(mapped.capacity);
      if (isNaN(cap) || cap < 1 || cap > 200) {
        errors.push({ row: index, field: "capacity", message: `"${mapped.capacity}" is not a valid capacity (1–200)`, severity: "warning" });
      }
    }

    // Price should parse as a dollar amount
    if (mapped.priceCents && mapped.priceCents.trim() !== "") {
      const p = Number(mapped.priceCents);
      if (isNaN(p) || p < 0) {
        errors.push({ row: index, field: "priceCents", message: `"${mapped.priceCents}" is not a valid price`, severity: "warning" });
      }
    }
  }
}

function validateInstructors(ctx: ValidationContext, errors: ImportError[]): void {
  const seenEmails = new Map<string, number>();

  for (const row of ctx.mappedRows) {
    const { index, mapped } = row;

    const effectiveName = (mapped.firstName && mapped.lastName)
      ? `${mapped.firstName.trim()} ${mapped.lastName.trim()}`
      : mapped.name?.trim();

    if (!effectiveName) {
      errors.push({ row: index, field: "name", message: "Instructor name is required", severity: "error" });
    }

    if (!mapped.email || mapped.email.trim() === "") {
      errors.push({ row: index, field: "email", message: "Email is required", severity: "error" });
    } else if (!isValidEmail(mapped.email.trim())) {
      errors.push({ row: index, field: "email", message: `"${mapped.email}" doesn't look like a valid email`, severity: "error" });
    } else {
      const emailNorm = normEmail(mapped.email);
      if (seenEmails.has(emailNorm)) {
        errors.push({ row: index, field: "email", message: `Duplicate email — also in row ${seenEmails.get(emailNorm)}`, severity: "error" });
      }
      seenEmails.set(emailNorm, index);

      const exists = ctx.existingTeachers.some(
        (t) => t.email.toLowerCase().trim() === emailNorm,
      );
      if (exists) {
        errors.push({ row: index, field: "email", message: `"${mapped.email}" already exists`, severity: "error" });
      }
    }
  }
}

function validateEnrolments(_ctx: ValidationContext, errors: ImportError[]): void {
  for (const row of _ctx.mappedRows) {
    const { index, mapped } = row;

    if (!mapped.studentName && !mapped.studentId) {
      errors.push({ row: index, field: "studentName", message: "Student name or ID is required for enrolment", severity: "error" });
    }

    if (!mapped.className && !mapped.classId) {
      errors.push({ row: index, field: "className", message: "Class name or ID is required for enrolment", severity: "error" });
    }
  }
}

function validatePayments(_ctx: ValidationContext, errors: ImportError[]): void {
  for (const row of _ctx.mappedRows) {
    const { index, mapped } = row;

    if (!mapped.studentName && !mapped.studentId) {
      errors.push({ row: index, field: "studentName", message: "Student name or ID is required for payment records", severity: "error" });
    }

    if (mapped.amount && mapped.amount.trim() !== "") {
      const amt = Number(mapped.amount.replace(/[$,\s]/g, ""));
      if (isNaN(amt)) {
        errors.push({ row: index, field: "amount", message: `"${mapped.amount}" is not a valid payment amount`, severity: "error" });
      }
    } else {
      errors.push({ row: index, field: "amount", message: "Payment amount is required", severity: "error" });
    }
  }
}

/* ── Auto-fix ────────────────────────────────────────────────────── */

export function autoFixRows(
  rows: Array<{ index: number; mapped: Record<string, string> }>,
): Array<{ index: number; mapped: Record<string, string> }> {
  return rows.map((row) => {
    const cleaned: Record<string, string> = {};
    for (const [key, val] of Object.entries(row.mapped)) {
      cleaned[key] = val.trim();
    }
    return { index: row.index, mapped: cleaned };
  });
}
