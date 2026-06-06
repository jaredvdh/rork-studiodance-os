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
  /** Instructor/coach/teacher label */
  instructor: string;
  /** Plural instructor */
  instructorPlural: string;
  /** Singular class label (e.g. "Class", "Session", "WOD") */
  class: string;
  /** Plural class label */
  classPlural: string;
  /** Class style label (e.g. "Dance Style", "Workout Type") */
  classStyle: string;
  /** Singular event label (e.g. "Recital", "Competition", "Workshop") */
  event: string;
  /** Plural event label */
  eventPlural: string;
  /** Adjective form of the vertical (e.g. "dance", "yoga", "CrossFit") */
  verticalAdjective: string;
  /** Modules that are enabled for this vertical type. Used for nav visibility and dashboard cards. */
  enabledModules: ModuleKey[];
  /** Available class/style categories for this vertical (used in filter dropdowns). */
  styleCategories: ClassStyle[];
}

const terminology: Record<Vertical, VerticalTerminology> = {
  dance: {
    participant: "Student",
    participantPlural: "Students",
    instructor: "Instructor",
    instructorPlural: "Instructors",
    class: "Class",
    classPlural: "Classes",
    classStyle: "Dance Style",
    event: "Recital",
    eventPlural: "Recitals",
    verticalAdjective: "dance",
    enabledModules: ["family", "classes", "schedule", "costumes", "recitals", "payments", "waivers", "instructors", "announcements"],
    styleCategories: ["Ballet", "Jazz", "Hip Hop", "Contemporary", "Tap", "Lyrical", "Acro"],
  },
  yoga: {
    participant: "Member",
    participantPlural: "Members",
    instructor: "Teacher",
    instructorPlural: "Teachers",
    class: "Class",
    classPlural: "Classes",
    classStyle: "Practice Style",
    event: "Workshop",
    eventPlural: "Workshops",
    verticalAdjective: "yoga",
    enabledModules: ["family", "classes", "schedule", "payments", "waivers", "instructors", "announcements"],
    styleCategories: ["Vinyasa", "Hatha", "Yin", "Restorative", "Power Yoga"],
  },
  crossfit: {
    participant: "Athlete",
    participantPlural: "Athletes",
    instructor: "Coach",
    instructorPlural: "Coaches",
    class: "WOD",
    classPlural: "WODs",
    classStyle: "Workout Type",
    event: "Competition",
    eventPlural: "Competitions",
    verticalAdjective: "CrossFit",
    enabledModules: ["family", "classes", "schedule", "payments", "waivers", "instructors", "announcements"],
    styleCategories: ["Strength", "Conditioning", "Olympic Lifting", "Gymnastics", "Mobility"],
  },
  gym: {
    participant: "Member",
    participantPlural: "Members",
    instructor: "Trainer",
    instructorPlural: "Trainers",
    class: "Class",
    classPlural: "Classes",
    classStyle: "Class Type",
    event: "Event",
    eventPlural: "Events",
    verticalAdjective: "gym",
    enabledModules: ["family", "classes", "schedule", "payments", "waivers", "instructors", "announcements"],
    styleCategories: ["Strength", "Conditioning", "Olympic Lifting", "Gymnastics", "Mobility"],
  },
  martial_arts: {
    participant: "Student",
    participantPlural: "Students",
    instructor: "Sensei",
    instructorPlural: "Senseis",
    class: "Class",
    classPlural: "Classes",
    classStyle: "Discipline",
    event: "Tournament",
    eventPlural: "Tournaments",
    verticalAdjective: "martial arts",
    enabledModules: ["family", "classes", "schedule", "payments", "waivers", "instructors", "announcements"],
    styleCategories: ["Beginner", "Intermediate", "Advanced", "Sparring", "Grading Prep"],
  },
  music_school: {
    participant: "Student",
    participantPlural: "Students",
    instructor: "Teacher",
    instructorPlural: "Teachers",
    class: "Class",
    classPlural: "Classes",
    classStyle: "Instrument",
    event: "Recital",
    eventPlural: "Recitals",
    verticalAdjective: "music",
    enabledModules: ["family", "classes", "schedule", "recitals", "payments", "waivers", "instructors", "announcements"],
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
