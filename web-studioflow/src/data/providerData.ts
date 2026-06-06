import type {
  MigrationProvider,
  ProviderInfo,
  ImportableDataType,
  ImportCategory,
} from "./migrationTypes";

/* ── Provider definitions ────────────────────────────────────────── */

export const PROVIDERS: ProviderInfo[] = [
  {
    id: "jackrabbit",
    name: "Jackrabbit",
    description:
      "Popular dance and gymnastics studio management software. Export your data from Jackrabbit's reporting section.",
    formats: ["CSV", "XLSX"],
    hasGuidance: true,
    notes:
      "Jackrabbit exports student names, parent emails, and class enrolments cleanly. Payment history may export as a separate report.",
    exportSteps: [
      'Go to <strong>Reports</strong> → <strong>Data Exports</strong> in Jackrabbit.',
      "Select <strong>Student/Family Export</strong> for students, caregivers, and contact info.",
      "Select <strong>Class Export</strong> for class names, schedules, instructors, and enrolments.",
      "Select <strong>Instructor Export</strong> for teacher names, emails, and specialties.",
      "Choose <strong>CSV</strong> format and click <strong>Download</strong>.",
      "Upload each exported CSV file in the next step.",
    ],
  },
  {
    id: "mindbody",
    name: "Mindbody",
    description:
      "Widely used by fitness studios, yoga studios, and wellness businesses. Export reports from the Mindbody dashboard.",
    formats: ["CSV", "XLSX"],
    hasGuidance: true,
    notes:
      "Mindbody exports client lists with contact info and membership status. Class schedules and attendance may come as separate reports. Instructor payroll exports are available on Business and Enterprise plans.",
    exportSteps: [
      'Go to <strong>Reports</strong> → <strong>Clients</strong> in Mindbody.',
      "Export <strong>Client List</strong> for members/students with contact details.",
      'Go to <strong>Reports</strong> → <strong>Classes & Appointments</strong> for schedules.',
      'Go to <strong>Reports</strong> → <strong>Staff</strong> for instructor data.',
      "Choose <strong>CSV</strong> and click <strong>Export</strong>.",
      "Upload each exported file in the next step.",
    ],
  },
  {
    id: "wellnessliving",
    name: "WellnessLiving",
    description:
      "All-in-one fitness and wellness management. Export your client and class data from the Reports dashboard.",
    formats: ["CSV", "XLSX"],
    hasGuidance: true,
    notes:
      "WellnessLiving exports include client profiles, class bookings, memberships, and payroll reports. Look under Reports → Export Data.",
    exportSteps: [
      'Go to <strong>Reports</strong> → <strong>Export Data</strong> in WellnessLiving.',
      "Select <strong>Clients</strong> for student/member profiles with contact info.",
      "Select <strong>Classes & Events</strong> for schedule data.",
      "Select <strong>Staff</strong> for instructor/coach information.",
      "Choose <strong>CSV</strong> format and download.",
      "Upload each exported file in the next step.",
    ],
  },
  {
    id: "dancestudio-pro",
    name: "DanceStudio-Pro",
    description:
      "Dance studio management trusted by thousands of studios. Export your data through the administrative reports.",
    formats: ["CSV", "XLSX"],
    hasGuidance: true,
    notes:
      "DSP exports student, family, and class data as separate CSV files. Costume and recital information may need manual export.",
    exportSteps: [
      'Go to <strong>Reports</strong> in DanceStudio-Pro.',
      'Export <strong>Students & Families</strong> for student names, caregiver info, and contacts.',
      'Export <strong>Classes & Schedule</strong> for class names, times, instructors, and enrolments.',
      'Export <strong>Instructors & Staff</strong> for instructor data.',
      "Select <strong>CSV</strong> format and download each report.",
      "Upload the exported files in the next step.",
    ],
  },
  {
    id: "momence",
    name: "Momence",
    description:
      "Modern studio platform for bookings, payments, and content. Export your data from the admin dashboard.",
    formats: ["CSV", "XLSX"],
    hasGuidance: true,
    notes:
      "Momence offers clean CSV exports for clients, bookings, and payments. Content and on-demand data exports are separate.",
    exportSteps: [
      'Go to <strong>Admin</strong> → <strong>Data Export</strong> in Momence.',
      "Select <strong>Customers</strong> for student/member profiles.",
      "Select <strong>Classes</strong> for schedules and bookings.",
      "Select <strong>Staff</strong> for instructor information.",
      "Download as <strong>CSV</strong>.",
      "Upload your exported files in the next step.",
    ],
  },
  {
    id: "acuity",
    name: "Acuity / Squarespace",
    description:
      "Squarespace Acuity scheduling platform. Export client and appointment data via the reporting tools.",
    formats: ["CSV"],
    hasGuidance: true,
    notes:
      "Acuity exports client lists and appointment history as CSV. You may need to restructure appointment data into a class format before uploading.",
    exportSteps: [
      'Go to <strong>Client & Appointment Reports</strong> in Acuity.',
      "Export <strong>Client List</strong> for student/member contact data.",
      "Export <strong>Appointment Export</strong> for class/appointment history.",
      "Download as <strong>CSV</strong>.",
      "Upload your files in the next step. We'll help map appointment data to class records.",
    ],
  },
  {
    id: "spreadsheet",
    name: "Spreadsheet / CSV",
    description:
      "Moving from Excel, Google Sheets, or another manual system? Upload your spreadsheet files directly.",
    formats: ["CSV", "XLSX"],
    hasGuidance: true,
    notes:
      "We recommend downloading our templates first to see the recommended format. You can then copy your data into the templates or upload your own formatted spreadsheets.",
    exportSteps: [
      "Download our StudioFlow templates to see the recommended column format.",
      "Open your existing spreadsheet (Excel, Google Sheets, or CSV).",
      "Copy your data columns to match the template format, or keep your own headers.",
      'Save as <strong>.csv</strong> or <strong>.xlsx</strong>.',
      "Upload your file — our smart mapping will detect your columns.",
      "Review and adjust field mappings in the next step.",
    ],
  },
  {
    id: "other",
    name: "Other Platform",
    description:
      "Moving from a different studio platform? We support CSV and XLSX uploads from any system — exports work today.",
    formats: ["CSV", "XLSX"],
    hasGuidance: false,
    notes:
      "Export your data as CSV or Excel from your current platform. Our smart field mapping works with any column headers. No API keys or developer setup needed — if you can export, you can migrate.",
    exportSteps: [
      "Export your data as CSV or Excel from your current platform.",
      "If your platform has separate exports for students, classes, and instructors, export each one.",
      "Download our templates to see the preferred column format.",
      "Upload your exported files in the next step.",
      "Our smart mapping will attempt to detect your column names automatically.",
      "You can manually remap any columns in the field mapping step.",
    ],
  },
];

/* ── Importable data types ───────────────────────────────────────── */

export const IMPORTABLE_DATA_TYPES: ImportableDataType[] = [
  {
    id: "students",
    label: "Students / Members",
    description:
      "Student profiles, member info, and personal details.",
    status: "ready",
    icon: "users",
  },
  {
    id: "caregivers",
    label: "Parents / Caregivers",
    description:
      "Primary and secondary caregiver contacts, emails, phones, and address info.",
    status: "ready",
    icon: "heart",
  },
  {
    id: "classes",
    label: "Classes / Sessions",
    description:
      "Class names, styles, schedule, room, capacity, and instructor assignments.",
    status: "ready",
    icon: "calendar",
  },
  {
    id: "enrolments",
    label: "Enrolments",
    description:
      "Link students to their classes. Import after both students and classes are uploaded.",
    status: "ready",
    icon: "link",
  },
  {
    id: "instructors",
    label: "Instructors / Staff",
    description:
      "Teaching staff with specialties, hourly rates, and pay classification.",
    status: "ready",
    icon: "briefcase",
  },
  {
    id: "payments",
    label: "Payments / Balances",
    description:
      "Payment history, outstanding balances, and membership/pass data.",
    status: "optional",
    icon: "credit-card",
  },
  {
    id: "costumes",
    label: "Costumes / Measurements",
    description:
      "Costume assignments, size charts, and student measurement records.",
    status: "coming-soon",
    icon: "shirt",
  },
  {
    id: "attendance",
    label: "Attendance History",
    description:
      "Historical attendance records for students and classes.",
    status: "coming-soon",
    icon: "clipboard-check",
  },
];

/* ── Helpers ─────────────────────────────────────────────────────── */

export function getProvider(id: MigrationProvider): ProviderInfo {
  return (
    PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[PROVIDERS.length - 1]
  );
}

export function getImportableType(id: ImportCategory): ImportableDataType {
  return (
    IMPORTABLE_DATA_TYPES.find((t) => t.id === id) ??
    IMPORTABLE_DATA_TYPES[0]
  );
}

/** Guess which data type a file likely contains based on header names. */
export function guessDataType(headers: string[]): ImportCategory {
  const h = headers.map((s) => s.toLowerCase());

  const signals: Record<ImportCategory, string[]> = {
    students: ["student", "dancer", "child", "participant", "member", "athlete", "dob", "birth", "allerg"],
    caregivers: ["parent", "guardian", "mother", "father", "caregiver", "emergency"],
    classes: ["class", "course", "session", "workshop", "program", "duration", "room", "capacity", "day of week", "start time"],
    enrolments: ["enrol", "enrollment", "registered"],
    instructors: ["instructor", "teacher", "coach", "trainer", "sensei", "staff", "hourly", "pay type", "specialt"],
    payments: ["payment", "invoice", "balance", "amount", "paid", "outstanding", "fee", "billing"],
    costumes: ["costume", "measur", "size", "fitting", "alter"],
    attendance: ["attendance", "check-in", "checkin", "present", "absent"],
  };

  let bestCategory: ImportCategory = "students";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(signals)) {
    let score = 0;
    for (const kw of keywords) {
      if (h.some((header) => header.includes(kw))) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category as ImportCategory;
    }
  }

  // If we found caregiver-specific columns but no student columns on their own,
  // it's probably students+cargivers combined
  if (bestScore === 0 && h.some((x) => x.includes("email") && x.includes("phone"))) {
    return "students";
  }

  return bestCategory;
}
