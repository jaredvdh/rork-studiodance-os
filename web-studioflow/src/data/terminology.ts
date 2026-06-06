import type { Vertical } from "./types";

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
