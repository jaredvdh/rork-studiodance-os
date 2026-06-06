/** Types for the StudioFlow Migration Assistant. */

export type ImportCategory =
  | "students"
  | "classes"
  | "instructors"
  | "enrolments"
  | "payments"
  | "caregivers"
  | "costumes"
  | "attendance";

export type ImportStatus =
  | "uploading"
  | "mapping"
  | "validating"
  | "importing"
  | "completed"
  | "failed"
  | "rolled_back";

/** Now 8 wizard steps instead of 7. */
export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Source platform / provider for the migration. */
export type MigrationProvider =
  | "jackrabbit"
  | "mindbody"
  | "wellnessliving"
  | "dancestudio-pro"
  | "momence"
  | "acuity"
  | "spreadsheet"
  | "other";

/** Status badge for each importable data type. */
export type DataTypeStatus = "ready" | "optional" | "coming-soon";

/** A selectable data type in the migration wizard. */
export interface ImportableDataType {
  id: ImportCategory;
  label: string;
  description: string;
  status: DataTypeStatus;
  icon: string;
}

/** An uploaded file with parsed metadata. */
export interface UploadedFile {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  /** Detected row count after parsing */
  rowCount: number;
  /** Detected headers */
  headers: string[];
  /** Detected (or user-assigned) data type */
  detectedType: ImportCategory | null;
  /** Parsed rows */
  rows: ParsedRow[];
  /** Auto-mapped field mappings */
  mappings: FieldMapping[];
  /** Mapped rows after field mapping */
  mappedRows: Array<{ index: number; mapped: Record<string, string> }>;
  /** Validation errors for this file */
  errors: ImportError[];
}

/** A single field mapping between a spreadsheet column and a StudioFlow field. */
export interface FieldMapping {
  spreadsheetColumn: string;
  /** null means the column is unmapped / will be ignored */
  targetField: string | null;
  /** 0–100 confidence score for the auto-match */
  confidence: number;
  isRequired: boolean;
  /** First 3 sample values from the column for the user to verify */
  sampleValues: string[];
}

/** An error or warning for a specific row during validation. */
export interface ImportError {
  row: number;
  field: string;
  message: string;
  severity: "warning" | "error";
}

/** A parsed data row after field mapping has been applied. */
export interface ParsedRow {
  index: number;
  raw: Record<string, string>;
  mapped: Record<string, string>;
}

/** Provider-specific export instructions. */
export interface ProviderInfo {
  id: MigrationProvider;
  name: string;
  description: string;
  /** Steps to export data from this provider */
  exportSteps: string[];
  /** Supported file formats from this provider */
  formats: string[];
  /** Notes about this provider's export quirks */
  notes: string;
  /** Whether we have specific guidance */
  hasGuidance: boolean;
}

/** Snapshot of what was added during an import — used for rollback. */
export interface ImportSnapshot {
  addedStudentIds: string[];
  addedClassIds: string[];
  addedTeacherIds: string[];
  addedParentIds: string[];
  /** studentId → classId[] enrolments created */
  enrolments: Array<{ studentId: string; classId: string }>;
  /** Teacher → class assignments created */
  assignments: Array<{ teacherId: string; classId: string }>;
}

/** A single import job record. */
export interface ImportJob {
  id: string;
  startedAt: string;
  completedAt?: string;
  category: ImportCategory;
  fileName: string;
  fileType: "csv" | "xlsx";
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errorCount: number;
  errors: ImportError[];
  /** Set after a successful import so we can roll back */
  snapshot?: ImportSnapshot;
}

/** Template column definition for downloadable CSV templates. */
export interface TemplateColumn {
  field: string;
  label: string;
  required: boolean;
  description: string;
  example: string;
}

/** A downloadable CSV template. */
export interface ImportTemplate {
  category: ImportCategory;
  name: string;
  description: string;
  fileName: string;
  columns: TemplateColumn[];
  sampleRows: Record<string, string>[];
}

/** Validation summary for the import preview. */
export interface ValidationSummary {
  totalRows: number;
  cleanRows: number;
  blockingErrors: number;
  warnings: number;
  suggestions: number;
  categories: Array<{
    category: ImportCategory;
    ready: number;
    warnings: number;
    errors: number;
  }>;
}

/** Known target fields for the field mapping engine. */
export const STUDENT_FIELDS: Array<{ field: string; label: string; required: boolean; aliases: string[] }> = [
  { field: "name", label: "Student Name", required: true, aliases: ["student", "dancer", "child", "participant", "member", "athlete", "first name", "full name"] },
  { field: "parentName", label: "Caregiver Name", required: false, aliases: ["parent", "guardian", "mother", "father", "caregiver", "contact name"] },
  { field: "parentEmail", label: "Caregiver Email", required: true, aliases: ["email", "parent email", "guardian email", "contact email", "e-mail"] },
  { field: "parentPhone", label: "Caregiver Phone", required: false, aliases: ["phone", "telephone", "mobile", "cell", "contact phone", "phone number"] },
  { field: "parentAddress", label: "Parent Address", required: false, aliases: ["address", "street", "home address"] },
  { field: "dob", label: "Date of Birth", required: false, aliases: ["birthday", "birth date", "age", "date of birth", "born"] },
  { field: "allergies", label: "Allergies", required: false, aliases: ["allergy", "allergic", "food allergies"] },
  { field: "medicalNotes", label: "Medical Notes", required: false, aliases: ["medical", "health", "conditions", "medications", "notes", "health notes"] },
  { field: "emergencyContact", label: "Emergency Contact", required: false, aliases: ["emergency", "ice", "in case of emergency", "emergency name"] },
  { field: "emergencyPhone", label: "Emergency Phone", required: false, aliases: ["emergency phone", "ice phone", "emergency number"] },
  // Secondary caregiver fields
  { field: "secondaryFirstName", label: "Secondary Caregiver First Name", required: false, aliases: ["secondary first name", "second parent first name", "secondary caregiver first", "dad first name", "guardian 2 first name"] },
  { field: "secondaryLastName", label: "Secondary Caregiver Last Name", required: false, aliases: ["secondary last name", "second parent last name", "secondary caregiver last", "dad last name", "guardian 2 last name"] },
  { field: "secondaryRelationship", label: "Secondary Relationship", required: false, aliases: ["secondary relationship", "second parent relationship", "secondary caregiver relationship"] },
  { field: "secondaryEmail", label: "Secondary Caregiver Email", required: false, aliases: ["secondary email", "second parent email", "dad email", "guardian 2 email", "secondary caregiver email"] },
  { field: "secondaryPhone", label: "Secondary Caregiver Phone", required: false, aliases: ["secondary phone", "second parent phone", "dad phone", "guardian 2 phone"] },
  { field: "secondaryAddress", label: "Secondary Address", required: false, aliases: ["secondary address", "second parent address"] },
  { field: "secondaryReceivesEmails", label: "Secondary Receives Emails", required: false, aliases: ["secondary receives emails", "secondary email opt-in", "secondary announcements"] },
  { field: "secondaryReceivesSMS", label: "Secondary Receives SMS", required: false, aliases: ["secondary receives sms", "secondary sms opt-in", "secondary texts"] },
  { field: "secondaryReceivesBilling", label: "Secondary Receives Billing", required: false, aliases: ["secondary receives billing", "secondary billing", "secondary invoices"] },
];

export const CLASS_FIELDS: Array<{ field: string; label: string; required: boolean; aliases: string[] }> = [
  { field: "name", label: "Class Name", required: true, aliases: ["class", "course", "session", "program", "workshop", "class name"] },
  { field: "style", label: "Style / Type", required: false, aliases: ["style", "type", "dance style", "genre", "category", "discipline"] },
  { field: "ageGroup", label: "Age Group", required: false, aliases: ["age", "age group", "level", "age range", "ages"] },
  { field: "day", label: "Day of Week", required: false, aliases: ["day", "weekday", "day of week", "schedule day"] },
  { field: "startTime", label: "Start Time", required: false, aliases: ["time", "start", "start time", "begins", "begin time"] },
  { field: "durationMins", label: "Duration (minutes)", required: false, aliases: ["duration", "length", "minutes", "mins", "duration mins"] },
  { field: "room", label: "Room / Studio", required: false, aliases: ["room", "studio", "location", "space", "venue"] },
  { field: "capacity", label: "Capacity", required: false, aliases: ["max", "cap", "maximum", "limit", "spots"] },
  { field: "teacherName", label: "Instructor Name", required: false, aliases: ["teacher", "instructor", "coach", "trainer", "sensei", "led by"] },
  { field: "priceCents", label: "Price ($)", required: false, aliases: ["price", "cost", "fee", "tuition", "rate", "amount"] },
];

export const INSTRUCTOR_FIELDS: Array<{ field: string; label: string; required: boolean; aliases: string[] }> = [
  { field: "name", label: "Instructor Name", required: true, aliases: ["name", "instructor", "teacher", "coach", "trainer", "sensei", "staff"] },
  { field: "email", label: "Email", required: true, aliases: ["email", "e-mail", "contact"] },
  { field: "styles", label: "Styles / Specialties", required: false, aliases: ["styles", "style", "specialty", "specialties", "skills", "disciplines"] },
  { field: "hourlyRateCents", label: "Hourly Rate ($)", required: false, aliases: ["rate", "hourly", "pay", "wage", "salary", "hourly rate", "compensation"] },
  { field: "payType", label: "Pay Type", required: false, aliases: ["pay type", "type", "employee type", "classification", "1099", "w2", "contractor"] },
];
