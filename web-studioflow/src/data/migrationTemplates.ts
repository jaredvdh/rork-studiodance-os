import type { ImportTemplate } from "./migrationTypes";

/** Pre-built CSV templates users can download to format their data correctly. */
export const IMPORT_TEMPLATES: ImportTemplate[] = [
  {
    category: "students",
    name: "Students & Families",
    description: "Import your students along with their parent/guardian details, medical notes, and emergency contacts.",
    fileName: "studioflow_students_template.csv",
    columns: [
      { field: "name", label: "Student Name", required: true, description: "Full name of the student", example: "Emily Walsh" },
      { field: "parentName", label: "Caregiver Name", required: false, description: "Primary parent or guardian", example: "Diane Walsh" },
      { field: "parentEmail", label: "Caregiver Email", required: true, description: "Email for communications and portal access", example: "diane@example.com" },
      { field: "parentPhone", label: "Caregiver Phone", required: false, description: "Best contact number", example: "(555) 123-4567" },
      { field: "parentAddress", label: "Caregiver Address", required: false, description: "Street address", example: "1428 NW Lovejoy St" },
      { field: "dob", label: "Date of Birth", required: false, description: "YYYY-MM-DD format (e.g. 2016-04-12)", example: "2016-04-12" },
      { field: "allergies", label: "Allergies", required: false, description: "Known allergies (food, environmental, etc.)", example: "Peanuts" },
      { field: "medicalNotes", label: "Medical Notes", required: false, description: "Any medical conditions or notes for instructors", example: "Mild asthma — inhaler in bag" },
      { field: "emergencyContact", label: "Emergency Contact Name", required: false, description: "Name of emergency contact", example: "Greg Walsh" },
      { field: "emergencyPhone", label: "Emergency Contact Phone", required: false, description: "Phone number for emergency contact", example: "(555) 987-6543" },
    ],
    sampleRows: [
      { name: "Emily Walsh", parentName: "Diane Walsh", parentEmail: "diane@example.com", parentPhone: "(555) 123-4567", parentAddress: "1428 NW Lovejoy St", dob: "2016-04-12", allergies: "Peanuts", medicalNotes: "Mild asthma", emergencyContact: "Greg Walsh", emergencyPhone: "(555) 987-6543" },
      { name: "Liam Carter", parentName: "Marcus Carter", parentEmail: "marcus@example.com", parentPhone: "(555) 234-5678", parentAddress: "3821 SE Hawthorne Blvd", dob: "2014-09-23", allergies: "", medicalNotes: "", emergencyContact: "Anita Carter", emergencyPhone: "(555) 876-5432" },
      { name: "Sofia Patel", parentName: "Anita Patel", parentEmail: "anita@example.com", parentPhone: "(555) 345-6789", parentAddress: "720 SW Broadway Dr", dob: "2015-01-17", allergies: "Gluten", medicalNotes: "", emergencyContact: "Raj Patel", emergencyPhone: "(555) 765-4321" },
    ],
  },
  {
    category: "classes",
    name: "Classes & Schedule",
    description: "Import your class list along with schedule details, instructor assignments, and pricing.",
    fileName: "studioflow_classes_template.csv",
    columns: [
      { field: "name", label: "Class Name", required: true, description: "Name of the class", example: "Junior Jazz" },
      { field: "style", label: "Style / Type", required: false, description: "Dance style, workout type, or discipline", example: "Jazz" },
      { field: "ageGroup", label: "Age Group", required: false, description: "Target age group for the class", example: "Junior" },
      { field: "day", label: "Day of Week", required: false, description: "Mon, Tue, Wed, Thu, Fri, Sat, or Sun", example: "Tue" },
      { field: "startTime", label: "Start Time", required: false, description: "24-hour format (e.g. 17:00 for 5pm)", example: "17:00" },
      { field: "durationMins", label: "Duration (mins)", required: false, description: "Length of each class in minutes", example: "60" },
      { field: "room", label: "Room / Studio", required: false, description: "Room name or number", example: "Studio B" },
      { field: "capacity", label: "Capacity", required: false, description: "Maximum number of students", example: "18" },
      { field: "teacherName", label: "Instructor", required: false, description: "Name of the instructor leading the class", example: "Mara Delgado" },
      { field: "priceCents", label: "Monthly Price ($)", required: false, description: "Monthly tuition in dollars", example: "95.00" },
    ],
    sampleRows: [
      { name: "Junior Jazz", style: "Jazz", ageGroup: "Junior", day: "Tue", startTime: "17:00", durationMins: "60", room: "Studio B", capacity: "18", teacherName: "Mara Delgado", priceCents: "95.00" },
      { name: "Tiny Tots Ballet", style: "Ballet", ageGroup: "Tiny Tots", day: "Mon", startTime: "16:00", durationMins: "45", room: "Studio A", capacity: "12", teacherName: "Theo Nakamura", priceCents: "85.00" },
      { name: "Senior Contemporary", style: "Contemporary", ageGroup: "Senior", day: "Tue", startTime: "18:30", durationMins: "75", room: "Studio A", capacity: "16", teacherName: "Priya Anand", priceCents: "110.00" },
    ],
  },
  {
    category: "instructors",
    name: "Instructors",
    description: "Import your teaching staff with their specialties, hourly rates, and pay classification.",
    fileName: "studioflow_instructors_template.csv",
    columns: [
      { field: "name", label: "Instructor Name", required: true, description: "Full name of the instructor", example: "Mara Delgado" },
      { field: "email", label: "Email", required: true, description: "Instructor's email address", example: "mara@studio.com" },
      { field: "styles", label: "Styles / Specialties", required: false, description: "Comma-separated list of specialties", example: "Ballet, Lyrical" },
      { field: "hourlyRateCents", label: "Hourly Rate ($)", required: false, description: "Hourly pay rate in dollars", example: "45.00" },
      { field: "payType", label: "Pay Type", required: false, description: "employee or 1099", example: "employee" },
    ],
    sampleRows: [
      { name: "Mara Delgado", email: "mara@studio.com", styles: "Ballet, Lyrical", hourlyRateCents: "45.00", payType: "employee" },
      { name: "Theo Nakamura", email: "theo@studio.com", styles: "Hip Hop, Jazz", hourlyRateCents: "50.00", payType: "1099" },
      { name: "Priya Anand", email: "priya@studio.com", styles: "Contemporary, Lyrical", hourlyRateCents: "40.00", payType: "employee" },
    ],
  },
  {
    category: "enrolments",
    name: "Enrolments",
    description: "Link your students to their classes. Match by student name/email and class name.",
    fileName: "studioflow_enrolments_template.csv",
    columns: [
      { field: "studentName", label: "Student Name", required: true, description: "Full name of the student (must match imported students)", example: "Emily Walsh" },
      { field: "studentEmail", label: "Parent Email", required: false, description: "Parent email to help match students", example: "diane@example.com" },
      { field: "className", label: "Class Name", required: true, description: "Name of the class (must match imported classes)", example: "Junior Jazz" },
    ],
    sampleRows: [
      { studentName: "Emily Walsh", studentEmail: "diane@example.com", className: "Junior Jazz" },
      { studentName: "Liam Carter", studentEmail: "marcus@example.com", className: "Junior Hip Hop" },
      { studentName: "Sofia Patel", studentEmail: "anita@example.com", className: "Tiny Tots Ballet" },
    ],
  },
];
