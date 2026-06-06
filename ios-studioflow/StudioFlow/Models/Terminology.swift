import SwiftUI

enum ModuleKey: String {
    case family, classes, schedule, costumes, recitals, payments, waivers, instructors, announcements
}

/// User-facing labels that change based on the studio vertical.
struct Terminology {
    var participant: String
    var participantPlural: String
    var instructor: String
    var instructorPlural: String
    var classSingular: String
    var classPlural: String
    var classStyle: String
    var event: String
    var eventPlural: String
    var verticalAdjective: String
    var enabledModules: [ModuleKey]
    var styleCategories: [String]

    func hasModule(_ key: ModuleKey) -> Bool { enabledModules.contains(key) }
}

enum Terminologies {
    static func of(_ v: Vertical) -> Terminology {
        switch v {
        case .dance:
            return Terminology(participant: "Student", participantPlural: "Students",
                instructor: "Instructor", instructorPlural: "Instructors",
                classSingular: "Class", classPlural: "Classes", classStyle: "Dance Style",
                event: "Recital", eventPlural: "Recitals", verticalAdjective: "dance",
                enabledModules: [.family, .classes, .schedule, .costumes, .recitals, .payments, .waivers, .instructors, .announcements],
                styleCategories: ["Ballet", "Jazz", "Hip Hop", "Contemporary", "Tap", "Lyrical", "Acro"])
        case .yoga:
            return Terminology(participant: "Member", participantPlural: "Members",
                instructor: "Teacher", instructorPlural: "Teachers",
                classSingular: "Class", classPlural: "Classes", classStyle: "Practice Style",
                event: "Workshop", eventPlural: "Workshops", verticalAdjective: "yoga",
                enabledModules: [.family, .classes, .schedule, .payments, .waivers, .instructors, .announcements],
                styleCategories: ["Vinyasa", "Hatha", "Yin", "Restorative", "Power Yoga"])
        case .crossfit:
            return Terminology(participant: "Athlete", participantPlural: "Athletes",
                instructor: "Coach", instructorPlural: "Coaches",
                classSingular: "WOD", classPlural: "WODs", classStyle: "Workout Type",
                event: "Competition", eventPlural: "Competitions", verticalAdjective: "CrossFit",
                enabledModules: [.family, .classes, .schedule, .payments, .waivers, .instructors, .announcements],
                styleCategories: ["Strength", "Conditioning", "Olympic Lifting", "Gymnastics", "Mobility"])
        case .gym:
            return Terminology(participant: "Member", participantPlural: "Members",
                instructor: "Trainer", instructorPlural: "Trainers",
                classSingular: "Class", classPlural: "Classes", classStyle: "Class Type",
                event: "Event", eventPlural: "Events", verticalAdjective: "gym",
                enabledModules: [.family, .classes, .schedule, .payments, .waivers, .instructors, .announcements],
                styleCategories: ["Strength", "Conditioning", "Olympic Lifting", "Gymnastics", "Mobility"])
        case .martial_arts:
            return Terminology(participant: "Student", participantPlural: "Students",
                instructor: "Sensei", instructorPlural: "Senseis",
                classSingular: "Class", classPlural: "Classes", classStyle: "Discipline",
                event: "Tournament", eventPlural: "Tournaments", verticalAdjective: "martial arts",
                enabledModules: [.family, .classes, .schedule, .payments, .waivers, .instructors, .announcements],
                styleCategories: ["Beginner", "Intermediate", "Advanced", "Sparring", "Grading Prep"])
        case .music_school:
            return Terminology(participant: "Student", participantPlural: "Students",
                instructor: "Teacher", instructorPlural: "Teachers",
                classSingular: "Class", classPlural: "Classes", classStyle: "Instrument",
                event: "Recital", eventPlural: "Recitals", verticalAdjective: "music",
                enabledModules: [.family, .classes, .schedule, .recitals, .payments, .waivers, .instructors, .announcements],
                styleCategories: ["Piano", "Guitar", "Voice", "Violin", "Drums"])
        }
    }

    static func label(_ v: Vertical) -> String {
        switch v {
        case .dance: "Dance Studio"
        case .yoga: "Yoga Studio"
        case .crossfit: "CrossFit Box"
        case .gym: "Gym"
        case .martial_arts: "Martial Arts School"
        case .music_school: "Music School"
        }
    }
}

/// Accent dot colors per class style, mirroring the web `styleStyles` map.
enum StyleColors {
    static func dot(_ style: String) -> Color {
        switch style {
        case "Ballet", "Lyrical", "Strength", "Advanced", "Voice", "Power Yoga": return Theme.rose
        case "Jazz", "Olympic Lifting", "Restorative", "Intermediate", "Guitar": return Theme.gold
        case "Hip Hop", "Yin", "Gymnastics", "Sparring", "Violin": return Theme.plum
        case "Contemporary", "Acro", "Vinyasa", "Conditioning", "Beginner", "Drums": return Theme.teal
        default: return Theme.foreground
        }
    }
}
