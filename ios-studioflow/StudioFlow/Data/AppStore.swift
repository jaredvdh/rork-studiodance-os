import SwiftUI

/// Central app state — equivalent to the web's React context providers.
/// Holds the studio, classes, students, instructors and supports edits.
@Observable
final class AppStore {
    var studio: Studio {
        didSet { _cachedTerm = Terminologies.of(studio.vertical) }
    }
    var classes: [StudioClass]
    var teachers: [Teacher]
    var students: [Student]
    var announcements: [Announcement]
    var invoices: [Invoice]
    var recitalEvents: [RecitalEvent]

    /// Cached terminology so TabView labels and other frequently-read
    /// computed properties don't re-create the struct on every access.
    private var _cachedTerm: Terminology

    init() {
        let s = DemoData.studio
        studio = s
        _cachedTerm = Terminologies.of(s.vertical)
        classes = DemoData.classes
        teachers = DemoData.teachers
        students = DemoData.students
        announcements = DemoData.announcements
        invoices = DemoData.invoices
        recitalEvents = DemoData.recitalEvents
    }

    // MARK: - Derived (stable)

    var term: Terminology { _cachedTerm }
    var accentColor: Color { Color(hslString: studio.brandColor) }

    func teacherName(_ id: String) -> String {
        teachers.first { $0.id == id }?.name ?? "Unassigned"
    }

    func enrolledCount(_ classId: String) -> Int {
        students.filter { $0.classIds.contains(classId) }.count
    }

    func studentsIn(_ classId: String) -> [Student] {
        students.filter { $0.classIds.contains(classId) }
    }

    func classesFor(_ teacherId: String) -> [StudioClass] {
        classes.filter { $0.teacherId == teacherId }
    }

    func isModuleEnabled(_ key: String) -> Bool {
        studio.featureToggles[key] ?? true
    }

    // MARK: - Dashboard metrics

    var totalCapacity: Int { classes.reduce(0) { $0 + $1.capacity } }
    var totalEnrolled: Int { classes.reduce(0) { $0 + $1.enrolled } }
    var capacityPct: Int { totalCapacity == 0 ? 0 : Int(Double(totalEnrolled) / Double(totalCapacity) * 100) }
    var monthRevenueCents: Int { classes.reduce(0) { $0 + $1.enrolled * $1.priceCents } }
    var avgAttendancePct: Int {
        guard !students.isEmpty else { return 0 }
        return Int(students.reduce(0) { $0 + $1.attendanceRate } / Double(students.count) * 100)
    }
    var waiverDonePct: Int {
        guard !students.isEmpty else { return 100 }
        return Int(Double(students.filter { $0.waiver == .signed }.count) / Double(students.count) * 100)
    }
    var outstandingCents: Int { invoices.filter { $0.status != .paid }.reduce(0) { $0 + $1.amountCents } }

    var revenueSeries: [RevenuePoint] {
        let base = monthRevenueCents
        let enr = totalEnrolled
        let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
        let mult = [0.76, 0.82, 0.88, 0.93, 0.97, 1.0]
        return months.enumerated().map { (i, m) in
            RevenuePoint(month: m, revenueCents: Int(Double(base) * mult[i]), enrollments: Int(Double(enr) * mult[i]))
        }
    }

    // MARK: - Mutations

    func addClass(_ c: StudioClass) { classes.insert(c, at: 0) }
    func updateClass(_ c: StudioClass) {
        if let idx = classes.firstIndex(where: { $0.id == c.id }) { classes[idx] = c }
    }
    func removeClass(_ id: String) { classes.removeAll { $0.id == id } }

    func addTeacher(_ t: Teacher) { teachers.append(t) }
    func updateTeacher(_ t: Teacher) {
        if let idx = teachers.firstIndex(where: { $0.id == t.id }) { teachers[idx] = t }
    }
    func removeTeacher(_ id: String) { teachers.removeAll { $0.id == id } }

    func addStudent(_ s: Student) { students.append(s) }
    func updateStudent(_ s: Student) {
        if let idx = students.firstIndex(where: { $0.id == s.id }) { students[idx] = s }
    }
    func removeStudent(_ id: String) { students.removeAll { $0.id == id } }

    func addAnnouncement(_ a: Announcement) { announcements.insert(a, at: 0) }
}

// MARK: - Formatting helpers

enum Fmt {
    static func currency(_ cents: Int, compact: Bool = false) -> String {
        let dollars = Double(cents) / 100
        if compact && dollars >= 1000 {
            return "$\(String(format: "%.1f", dollars / 1000))k"
        }
        let nf = NumberFormatter()
        nf.numberStyle = .currency
        nf.currencyCode = "USD"
        nf.maximumFractionDigits = dollars.truncatingRemainder(dividingBy: 1) == 0 ? 0 : 2
        return nf.string(from: NSNumber(value: dollars)) ?? "$0"
    }

    static func initials(_ name: String) -> String {
        let parts = name.split(separator: " ")
        if parts.count >= 2 { return "\(parts[0].prefix(1))\(parts[1].prefix(1))".uppercased() }
        return String(name.prefix(2)).uppercased()
    }

    /// Convert "16:30" → "4:30 PM".
    static func time12(_ hhmm: String) -> String {
        let parts = hhmm.split(separator: ":")
        guard parts.count == 2, let h = Int(parts[0]), let m = Int(parts[1]) else { return hhmm }
        let period = h >= 12 ? "PM" : "AM"
        let h12 = h % 12 == 0 ? 12 : h % 12
        return "\(h12):\(String(format: "%02d", m)) \(period)"
    }

    static func relative(_ date: Date) -> String {
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .full
        return f.localizedString(for: date, relativeTo: Date())
    }
}
