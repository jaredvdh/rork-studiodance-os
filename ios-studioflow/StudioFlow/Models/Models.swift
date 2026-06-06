import Foundation

/// Core domain models for StudioFlow, mirroring the web TypeScript types.

enum Vertical: String, CaseIterable, Identifiable, Codable {
    case dance, yoga, crossfit, gym, martial_arts, music_school
    var id: String { rawValue }
}

enum WeekDay: String, CaseIterable, Identifiable, Codable {
    case Mon, Tue, Wed, Thu, Fri, Sat, Sun
    var id: String { rawValue }
    var fullName: String {
        switch self {
        case .Mon: "Monday"
        case .Tue: "Tuesday"
        case .Wed: "Wednesday"
        case .Thu: "Thursday"
        case .Fri: "Friday"
        case .Sat: "Saturday"
        case .Sun: "Sunday"
        }
    }
}

enum AgeGroup: String, CaseIterable, Identifiable, Codable {
    case tinyTots = "Tiny Tots"
    case junior = "Junior"
    case intermediate = "Intermediate"
    case senior = "Senior"
    case adult = "Adult"
    case allLevels = "All Levels"
    var id: String { rawValue }
}

enum InstructorStatus: String, CaseIterable, Codable {
    case active, on_leave, archived
    var label: String {
        switch self {
        case .active: "Active"
        case .on_leave: "On Leave"
        case .archived: "Archived"
        }
    }
}

enum WaiverStatus: String, Codable {
    case signed, pending, missing
    var label: String { rawValue.capitalized }
}

enum PaymentStatus: String, Codable {
    case paid, due, overdue
    var label: String { rawValue.capitalized }
}

enum AnnouncementScope: String, CaseIterable, Codable {
    case studioWide = "Studio-wide"
    case classScope = "Class"
    case recital = "Recital"
    case emergency = "Emergency"
    var id: String { rawValue }
}

struct Address: Identifiable, Codable, Hashable {
    var id = UUID()
    var line1: String
    var line2: String?
    var city: String
    var stateOrProvince: String
    var postalCode: String
    var country: String

    var shortText: String {
        [line1, line2, city, stateOrProvince, postalCode]
            .compactMap { $0 }
            .filter { !$0.isEmpty }
            .joined(separator: ", ")
    }
}

struct Studio: Identifiable, Hashable {
    var id: String
    var name: String
    var tagline: String
    var city: String
    /// Stored brand color in HSL string form, e.g. "350 74% 60%".
    var brandColor: String
    var initials: String
    var vertical: Vertical
    var address: Address?
    var featureToggles: [String: Bool] = [:]
}

struct Skill: Identifiable, Hashable {
    var id = UUID()
    var name: String
    var category: String?
}

struct Certification: Identifiable, Hashable {
    var id = UUID()
    var name: String
    var issuedAt: String?
    var expiresAt: String?
}

struct EmergencyContact: Hashable {
    var name: String
    var relationship: String
    var phone: String
}

enum PayType: String, Codable { case employee, contractor = "1099" }

struct Teacher: Identifiable, Hashable {
    var id: String
    var studioId: String
    var name: String
    var preferredName: String?
    var styles: [String]
    var skills: [Skill]
    var email: String
    var phone: String?
    var address: String?
    var emergencyContact: EmergencyContact?
    var status: InstructorStatus
    var hireDate: String?
    var employeeId: String?
    var certifications: [Certification]
    var hourlyRateCents: Int?
    var payType: PayType?
}

struct StudioClass: Identifiable, Hashable {
    var id: String
    var studioId: String
    var name: String
    var style: String
    var ageGroup: AgeGroup
    var day: WeekDay
    var startTime: String   // "16:30"
    var durationMins: Int
    var room: String
    var teacherId: String
    var capacity: Int
    var enrolled: Int
    var waitlist: Int
    var inRecital: Bool
    var priceCents: Int
    var description: String?

    /// Returns the end time string computed from start time + duration.
    var endTime: String {
        let parts = startTime.split(separator: ":")
        guard parts.count == 2, let h = Int(parts[0]), let m = Int(parts[1]) else { return startTime }
        let total = h * 60 + m + durationMins
        return String(format: "%02d:%02d", (total / 60) % 24, total % 60)
    }
}

struct Student: Identifiable, Hashable {
    var id: String
    var studioId: String
    var name: String
    var dob: String
    var caregiverId: String
    var caregiverName: String
    var caregiverEmail: String
    var classIds: [String]
    var attendanceRate: Double
    var waiver: WaiverStatus
    var payment: PaymentStatus
    var balanceCents: Int
    var medicalNotes: String?
    var allergies: String?
}

struct Announcement: Identifiable, Hashable {
    var id: String
    var studioId: String
    var title: String
    var body: String
    var scope: AnnouncementScope
    var sentAt: Date
    var audience: String
    var reach: Int
}

struct Invoice: Identifiable, Hashable {
    var id: String
    var studioId: String
    var studentName: String
    var caregiverName: String
    var description: String
    var amountCents: Int
    var status: PaymentStatus
    var dueDate: Date
}

struct RecitalPerformance: Identifiable, Hashable {
    var id: String
    var name: String
    var classIds: [String]
    var order: Int
    var startTime: String?
    var costumeNote: String?
}

struct RecitalEvent: Identifiable, Hashable {
    var id: String
    var studioId: String
    var name: String
    var date: Date
    var venue: String
    var costumeDeadline: Date?
    var performances: [RecitalPerformance]
}

struct RevenuePoint: Identifiable, Hashable {
    var id = UUID()
    var month: String
    var revenueCents: Int
    var enrollments: Int
}
