import type { Vertical, ClassStyle } from "./types";

/** Modules that can be enabled/disabled per vertical via enabledModules config. */
export type ModuleKey =
  | "family"
  | "classes"
  | "schedule"
  | "costumes"
  | "recitals"
  | "payments"
  | "waivers"
  | "instructors"
  | "announcements";

/** Human-readable labels for module keys (used in settings preview). */
export const MODULE_LABELS: Record<ModuleKey, string> = {
  family: "Family & Participants",
  classes: "Classes",
  schedule: "Schedule",
  costumes: "Costumes",
  recitals: "Recitals & Events",
  payments: "Payments",
  waivers: "Waivers & Docs",
  instructors: "Instructors",
  announcements: "Announcements",
};

/** User-facing labels that change based on studio vertical. */
export interface VerticalTerminology {
  /** Singular participant label (e.g. "Student", "Athlete", "Member") */
  participant: string;
  /** Plural participant label */
  participantPlural: string;
  /** Guardian / parent label (e.g. "Parent", "Guardian") */
  guardian: string;
  /** Plural guardian */
  guardianPlural: string;
  /** Instructor/coach/teacher label */
  instructor: string;
  /** Plural instructor */
  instructorPlural: string;
  /** Singular class label (e.g. "Class", "Session", "Program") */
  class: string;
  /** Plural class label */
  classPlural: string;
  /** Class style label (e.g. "Dance Style", "Workout Type", "Program Type") */
  classStyle: string;
  /** Singular event label (e.g. "Recital", "Competition", "Workshop") */
  event: string;
  /** Plural event label */
  eventPlural: string;
  /** Adjective form of the vertical (e.g. "dance", "yoga", "CrossFit") */
  verticalAdjective: string;
  /** Modules that are enabled for this vertical type. Used for nav visibility and dashboard cards. */
  enabledModules: ModuleKey[];
  /** Suggested class/program types for this vertical. These are optional suggestions only —
   * studio owners can create custom types freely. */
  styleSuggestions: string[];
  /** @deprecated Use styleSuggestions instead. Kept for backward compatibility. */
  styleCategories: string[];
}

const terminology: Record<Vertical, VerticalTerminology> = {
  dance: {
    participant: "Student",
    participantPlural: "Students",
    guardian: "Parent",
    guardianPlural: "Parents",
    instructor: "Instructor",
    instructorPlural: "Instructors",
    class: "Class",
    classPlural: "Classes",
    classStyle: "Dance Style",
    event: "Recital",
    eventPlural: "Recitals",
    verticalAdjective: "dance",
    enabledModules: ["family", "classes", "schedule", "costumes", "recitals", "payments", "waivers", "instructors", "announcements"],
    styleSuggestions: ["Ballet", "Jazz", "Tap", "Contemporary", "Acro", "Hip Hop", "Lyrical"],
    styleCategories: ["Ballet", "Jazz", "Tap", "Contemporary", "Acro", "Hip Hop", "Lyrical"],
  },
  yoga: {
    participant: "Member",
    participantPlural: "Members",
    guardian: "Guardian",
    guardianPlural: "Guardians",
    instructor: "Instructor",
    instructorPlural: "Instructors",
    class: "Class",
    classPlural: "Classes",
    classStyle: "Practice Style",
    event: "Workshop",
    eventPlural: "Workshops",
    verticalAdjective: "yoga",
    enabledModules: ["family", "classes", "schedule", "payments", "waivers", "instructors", "announcements"],
    styleSuggestions: ["Vinyasa", "Hatha", "Yin", "Hot Yoga", "Restorative", "Power Yoga"],
    styleCategories: ["Vinyasa", "Hatha", "Yin", "Hot Yoga", "Restorative", "Power Yoga"],
  },
  crossfit: {
    participant: "Member",
    participantPlural: "Members",
    guardian: "Guardian",
    guardianPlural: "Guardians",
    instructor: "Coach",
    instructorPlural: "Coaches",
    class: "Session",
    classPlural: "Sessions",
    classStyle: "Program Type",
    event: "Competition",
    eventPlural: "Competitions",
    verticalAdjective: "CrossFit",
    enabledModules: ["family", "classes", "schedule", "payments", "waivers", "instructors", "announcements"],
    styleSuggestions: ["CrossFit", "Functional Fitness", "Strength", "Conditioning", "Olympic Lifting", "Mobility", "Open Gym"],
    styleCategories: ["CrossFit", "Functional Fitness", "Strength", "Conditioning", "Olympic Lifting", "Mobility", "Open Gym"],
  },
  gym: {
    participant: "Member",
    participantPlural: "Members",
    guardian: "Guardian",
    guardianPlural: "Guardians",
    instructor: "Trainer",
    instructorPlural: "Trainers",
    class: "Class",
    classPlural: "Classes",
    classStyle: "Class Type",
    event: "Event",
    eventPlural: "Events",
    verticalAdjective: "gym",
    enabledModules: ["family", "classes", "schedule", "payments", "waivers", "instructors", "announcements"],
    styleSuggestions: ["Strength", "Conditioning", "Olympic Lifting", "Gymnastics", "Mobility"],
    styleCategories: ["Strength", "Conditioning", "Olympic Lifting", "Gymnastics", "Mobility"],
  },
  martial_arts: {
    participant: "Student",
    participantPlural: "Students",
    guardian: "Guardian",
    guardianPlural: "Guardians",
    instructor: "Instructor",
    instructorPlural: "Instructors",
    class: "Class",
    classPlural: "Classes",
    classStyle: "Program",
    event: "Tournament",
    eventPlural: "Tournaments",
    verticalAdjective: "martial arts",
    enabledModules: ["family", "classes", "schedule", "payments", "waivers", "instructors", "announcements"],
    styleSuggestions: ["Fundamentals", "Sparring", "Kids Program", "Grading Prep", "Advanced"],
    styleCategories: ["Fundamentals", "Sparring", "Kids Program", "Grading Prep", "Advanced"],
  },
  music_school: {
    participant: "Student",
    participantPlural: "Students",
    guardian: "Parent",
    guardianPlural: "Parents",
    instructor: "Teacher",
    instructorPlural: "Teachers",
    class: "Class",
    classPlural: "Classes",
    classStyle: "Instrument",
    event: "Recital",
    eventPlural: "Recitals",
    verticalAdjective: "music",
    enabledModules: ["family", "classes", "schedule", "recitals", "payments", "waivers", "instructors", "announcements"],
    styleSuggestions: ["Piano", "Guitar", "Voice", "Violin", "Drums"],
    styleCategories: ["Piano", "Guitar", "Voice", "Violin", "Drums"],
  },
};

/** Human-readable labels for the vertical selector dropdown. */
export const VERTICAL_LABELS: Record<Vertical, string> = {
  dance: "Dance Studio",
  yoga: "Yoga Studio",
  crossfit: "CrossFit Box",
  gym: "Gym",
  martial_arts: "Martial Arts School",
  music_school: "Music School",
};

/** Returns the terminology config for a given vertical. */
export function getTerminology(v: Vertical): VerticalTerminology {
  return terminology[v];
}

/** All vertical options for dropdowns. */
export const ALL_VERTICALS: Vertical[] = [
  "dance",
  "yoga",
  "crossfit",
  "gym",
  "martial_arts",
  "music_school",
];
