import type { ImportError } from "@/data/migrationTypes";
import type { Class, Student, Teacher } from "@/data/types";

export interface ValidationContext {
  existingStudents: Student[];
  existingClasses: Class[];
  existingTeachers: Teacher[];
  mappedRows: Array<{ index: number; mapped: Record<string, string> }>;
  category: string;
}

/** Normalize an email for comparison. */
function normEmail(e: string): string {
  return e.toLowerCase().trim();
}

/** Basic email format check. */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Validate phone format internationally (E.164-compatible, lenient).
 *  Accepts: +1 formats, local formats, spaces, dashes. */
function looksLikePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/** Check if a DOB string is a valid date and the person is between 0–100 years old. */
function isValidDob(dob: string): boolean {
  if (!dob) return true; // Optional field
  const d = new Date(dob);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const ageYears = (now.getTime() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return ageYears >= 0 && ageYears <= 100;
}

/** Run all validation checks on mapped rows against existing data. */
export function validateImport(ctx: ValidationContext): ImportError[] {
  const errors: ImportError[] = [];

  // --- Student validations ---
  if (ctx.category === "students") {
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

  return errors;
}

function validateStudents(ctx: ValidationContext, errors: ImportError[]): void {
  const seenEmails = new Map<string, number>(); // email → first row index
  const seenNames = new Map<string, number>();

  for (const row of ctx.mappedRows) {
    const { index, mapped } = row;

    // Required: student name
    if (!mapped.name || mapped.name.trim() === "") {
      errors.push({ row: index, field: "name", message: "Student name is required", severity: "error" });
    } else {
      const nameNorm = mapped.name.trim().toLowerCase();
      if (seenNames.has(nameNorm)) {
        errors.push({ row: index, field: "name", message: `Duplicate student name — also found in row ${seenNames.get(nameNorm)}`, severity: "warning" });
      }
      seenNames.set(nameNorm, index);

      // Check against existing students
      const existingMatch = ctx.existingStudents.find(
        (s) => s.name.toLowerCase().trim() === nameNorm,
      );
      if (existingMatch) {
        errors.push({ row: index, field: "name", message: `"${mapped.name}" already exists in your studio`, severity: "error" });
      }
    }

    // Required: parent email
    if (!mapped.parentEmail || mapped.parentEmail.trim() === "") {
      errors.push({ row: index, field: "parentEmail", message: "Parent email is required", severity: "error" });
    } else if (!isValidEmail(mapped.parentEmail.trim())) {
      errors.push({ row: index, field: "parentEmail", message: `"${mapped.parentEmail}" doesn't look like a valid email`, severity: "error" });
    } else {
      const emailNorm = normEmail(mapped.parentEmail);
      if (seenEmails.has(emailNorm)) {
        errors.push({ row: index, field: "parentEmail", message: `Duplicate email — also used in row ${seenEmails.get(emailNorm)}`, severity: "warning" });
      }
      seenEmails.set(emailNorm, index);

      // Parent emails CAN be shared (siblings), so only flag as info, not error
      const parentShared = ctx.mappedRows.filter(
        (r) => r.index !== index && normEmail(r.mapped.parentEmail ?? "") === emailNorm,
      );
      if (parentShared.length > 0 && !mapped.parentName) {
        errors.push({ row: index, field: "parentEmail", message: "Shared caregiver email — consider adding caregiver name for clarity", severity: "warning" });
      }
    }

    // Optional: phone format (international, lenient)
    if (mapped.parentPhone && mapped.parentPhone.trim() !== "") {
      if (!looksLikePhone(mapped.parentPhone.trim())) {
        errors.push({ row: index, field: "parentPhone", message: `"${mapped.parentPhone}" doesn't look like a valid phone number`, severity: "warning" });
      }
    }

    // Optional: DOB validity
    if (mapped.dob && mapped.dob.trim() !== "") {
      if (!isValidDob(mapped.dob.trim())) {
        errors.push({ row: index, field: "dob", message: `"${mapped.dob}" is not a valid date of birth`, severity: "warning" });
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

    if (!mapped.name || mapped.name.trim() === "") {
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

/** Auto-fix common issues (trim whitespace, normalize empty fields). Returns cleaned rows. */
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
