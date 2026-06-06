import Foundation

/// Seed data mirroring the web app's "Aurora Dance Academy" demo studio.
enum DemoData {
    static func daysAgo(_ n: Int) -> Date { Calendar.current.date(byAdding: .day, value: -n, to: Date()) ?? Date() }
    static func daysAhead(_ n: Int) -> Date { Calendar.current.date(byAdding: .day, value: n, to: Date()) ?? Date() }

    static let studio = Studio(
        id: "stu_aurora",
        name: "Aurora Dance Academy",
        tagline: "Where every dancer finds their light",
        city: "Portland, OR",
        brandColor: "350 74% 60%",
        initials: "AD",
        vertical: .dance,
        address: Address(line1: "1422 NW Irving St", line2: nil, city: "Portland",
                         stateOrProvince: "OR", postalCode: "97209", country: "US"),
        featureToggles: [
            "costumes": true, "recitals": true, "payments": true,
            "waivers": true, "instructors": true, "announcements": true,
        ]
    )

    static let teachers: [Teacher] = [
        Teacher(id: "t1", studioId: studio.id, name: "Mara Delgado", preferredName: "Mara",
                styles: ["Ballet", "Lyrical"],
                skills: [Skill(name: "Ballet", category: "Dance"), Skill(name: "Lyrical", category: "Dance"), Skill(name: "Pointe", category: "Dance")],
                email: "mara@aurora.dance", phone: "+1 503 555 0101",
                address: "1422 NW Irving St, Portland, OR 97209",
                emergencyContact: EmergencyContact(name: "Carlos Delgado", relationship: "Spouse", phone: "+1 503 555 0102"),
                status: .active, hireDate: "2020-08-15", employeeId: "EMP-001",
                certifications: [Certification(name: "Dance Teacher Certification", issuedAt: "2024-06-01", expiresAt: "2027-06-01"),
                                 Certification(name: "First Aid / CPR", issuedAt: "2025-09-15", expiresAt: "2027-09-15")],
                hourlyRateCents: 4500, payType: .employee),
        Teacher(id: "t2", studioId: studio.id, name: "Theo Nakamura", preferredName: nil,
                styles: ["Hip Hop", "Jazz"],
                skills: [Skill(name: "Hip Hop", category: "Dance"), Skill(name: "Jazz", category: "Dance"), Skill(name: "Breaking", category: "Dance")],
                email: "theo@aurora.dance", phone: "+1 503 555 0201",
                address: "825 NW 23rd Ave, Portland, OR 97210",
                emergencyContact: EmergencyContact(name: "Yuki Nakamura", relationship: "Partner", phone: "+1 503 555 0202"),
                status: .active, hireDate: "2021-03-01", employeeId: "EMP-002",
                certifications: [Certification(name: "First Aid / CPR", issuedAt: "2025-08-20", expiresAt: "2027-08-20")],
                hourlyRateCents: 5000, payType: .contractor),
        Teacher(id: "t3", studioId: studio.id, name: "Priya Anand", preferredName: nil,
                styles: ["Contemporary", "Lyrical"],
                skills: [Skill(name: "Contemporary", category: "Dance"), Skill(name: "Lyrical", category: "Dance")],
                email: "priya@aurora.dance", phone: "+1 503 555 0301",
                address: "310 NE Multnomah St, Portland, OR 97232",
                emergencyContact: nil,
                status: .active, hireDate: "2022-09-01", employeeId: "EMP-003",
                certifications: [Certification(name: "Dance Teacher Certification", issuedAt: "2024-11-01", expiresAt: "2027-11-01")],
                hourlyRateCents: 4000, payType: .employee),
        Teacher(id: "t4", studioId: studio.id, name: "Jules Romano", preferredName: "Jules",
                styles: ["Tap", "Jazz"],
                skills: [Skill(name: "Tap", category: "Dance"), Skill(name: "Jazz", category: "Dance"), Skill(name: "Musical Theatre", category: "Dance")],
                email: "jules@aurora.dance", phone: "+1 503 555 0401",
                address: "55 SW Yamhill St, Portland, OR 97204",
                emergencyContact: EmergencyContact(name: "Marie Romano", relationship: "Mother", phone: "+1 503 555 0402"),
                status: .on_leave, hireDate: "2023-01-15", employeeId: "EMP-004",
                certifications: [Certification(name: "First Aid / CPR", issuedAt: "2024-12-01", expiresAt: "2026-12-01")],
                hourlyRateCents: 3500, payType: .contractor),
        Teacher(id: "t5", studioId: studio.id, name: "Sasha Berg", preferredName: nil,
                styles: ["Acro", "Ballet"],
                skills: [Skill(name: "Acro", category: "Dance"), Skill(name: "Ballet", category: "Dance"), Skill(name: "Partnering", category: "Dance")],
                email: "sasha@aurora.dance", phone: "+1 503 555 0501",
                address: "721 NW 9th Ave, Portland, OR 97209",
                emergencyContact: EmergencyContact(name: "David Berg", relationship: "Spouse", phone: "+1 503 555 0502"),
                status: .active, hireDate: "2019-06-01", employeeId: "EMP-005",
                certifications: [Certification(name: "Dance Teacher Certification", issuedAt: "2025-02-01", expiresAt: "2028-02-01"),
                                 Certification(name: "First Aid / CPR", issuedAt: "2025-10-01", expiresAt: "2027-10-01")],
                hourlyRateCents: 5500, payType: .employee),
    ]

    static let classes: [StudioClass] = [
        StudioClass(id: "c1", studioId: studio.id, name: "Tiny Tots Ballet", style: "Ballet", ageGroup: .tinyTots, day: .Mon, startTime: "16:00", durationMins: 45, room: "Studio A", teacherId: "t1", capacity: 12, enrolled: 11, waitlist: 3, inRecital: true, priceCents: 8500, description: "A gentle introduction to ballet for our youngest dancers — focusing on coordination, musicality, and joy."),
        StudioClass(id: "c2", studioId: studio.id, name: "Junior Hip Hop", style: "Hip Hop", ageGroup: .junior, day: .Mon, startTime: "17:00", durationMins: 60, room: "Studio B", teacherId: "t2", capacity: 18, enrolled: 18, waitlist: 5, inRecital: true, priceCents: 9500, description: nil),
        StudioClass(id: "c3", studioId: studio.id, name: "Senior Contemporary", style: "Contemporary", ageGroup: .senior, day: .Tue, startTime: "18:30", durationMins: 75, room: "Studio A", teacherId: "t3", capacity: 16, enrolled: 13, waitlist: 0, inRecital: true, priceCents: 11000, description: nil),
        StudioClass(id: "c4", studioId: studio.id, name: "Intermediate Jazz", style: "Jazz", ageGroup: .intermediate, day: .Tue, startTime: "17:00", durationMins: 60, room: "Studio B", teacherId: "t4", capacity: 16, enrolled: 14, waitlist: 1, inRecital: true, priceCents: 9500, description: nil),
        StudioClass(id: "c5", studioId: studio.id, name: "Adult Tap Social", style: "Tap", ageGroup: .adult, day: .Wed, startTime: "19:30", durationMins: 60, room: "Studio C", teacherId: "t4", capacity: 20, enrolled: 9, waitlist: 0, inRecital: false, priceCents: 7500, description: nil),
        StudioClass(id: "c6", studioId: studio.id, name: "Junior Lyrical", style: "Lyrical", ageGroup: .junior, day: .Wed, startTime: "16:30", durationMins: 60, room: "Studio A", teacherId: "t1", capacity: 16, enrolled: 15, waitlist: 2, inRecital: true, priceCents: 9500, description: nil),
        StudioClass(id: "c7", studioId: studio.id, name: "Senior Hip Hop Crew", style: "Hip Hop", ageGroup: .senior, day: .Thu, startTime: "18:00", durationMins: 90, room: "Studio B", teacherId: "t2", capacity: 20, enrolled: 19, waitlist: 6, inRecital: true, priceCents: 12500, description: nil),
        StudioClass(id: "c8", studioId: studio.id, name: "Acro Foundations", style: "Acro", ageGroup: .intermediate, day: .Thu, startTime: "16:30", durationMins: 60, room: "Studio C", teacherId: "t5", capacity: 12, enrolled: 8, waitlist: 0, inRecital: false, priceCents: 10000, description: nil),
        StudioClass(id: "c9", studioId: studio.id, name: "Pre-Pro Ballet", style: "Ballet", ageGroup: .senior, day: .Fri, startTime: "17:30", durationMins: 90, room: "Studio A", teacherId: "t5", capacity: 14, enrolled: 14, waitlist: 4, inRecital: true, priceCents: 14000, description: nil),
        StudioClass(id: "c10", studioId: studio.id, name: "Saturday Combo Jr.", style: "Jazz", ageGroup: .junior, day: .Sat, startTime: "10:00", durationMins: 75, room: "Studio B", teacherId: "t3", capacity: 18, enrolled: 16, waitlist: 0, inRecital: true, priceCents: 10500, description: nil),
    ]

    static let students: [Student] = {
        let firstNames = ["Ava", "Liam", "Sofia", "Noah", "Mia", "Ethan", "Isla", "Leo", "Maya", "Kai", "Zoe", "Eli", "Nora", "Owen", "Lila", "Jude", "Ruby", "Finn", "Iris", "Theo", "June", "Cole", "Wren", "Asa"]
        let lastNames = ["Carter", "Nguyen", "Patel", "Rivera", "Kim", "Brooks", "Hassan", "Lopez", "Walsh", "Okafor", "Stein", "Ferraro", "Moss", "Diaz", "Pruitt", "Vance"]
        let parentFirst = ["Diane", "Marcus", "Anita", "Greg", "Lena", "Sam", "Yara", "Paul", "Nadia", "Cliff", "Bea", "Omar"]
        let allergyOptions: [String?] = [nil, nil, nil, "Peanuts", "Dairy", "Gluten", "Bee stings", "Latex"]
        let caregiverIds = ["p1", "p2", "p3"]

        return (0..<42).map { i in
            let first = firstNames[i % firstNames.count]
            let last = lastNames[(i * 3 + 1) % lastNames.count]
            let name = "\(first) \(last)"
            let caregiverName = "\(parentFirst[(i * 2) % parentFirst.count]) \(last)"
            let enrolled = classes.enumerated().filter { (i + $0.offset) % 4 == 0 }.prefix(2).map { $0.element.id }
            let waiverRoll = (i * 7) % 10
            let payRoll = (i * 5) % 10
            let attendance = min(0.99, 0.72 + Double((i * 13) % 26) / 100)
            let waiver: WaiverStatus = waiverRoll < 7 ? .signed : (waiverRoll < 9 ? .pending : .missing)
            let payment: PaymentStatus = payRoll < 7 ? .paid : (payRoll < 9 ? .due : .overdue)
            let year = 2008 + (i % 12)
            return Student(
                id: "s\(i + 1)", studioId: studio.id, name: name,
                dob: "\(year)-01-01", caregiverId: caregiverIds[i % caregiverIds.count],
                caregiverName: caregiverName,
                caregiverEmail: "\(parentFirst[i % parentFirst.count].lowercased()).parent@email.com",
                classIds: enrolled.isEmpty ? [classes[i % classes.count].id] : Array(enrolled),
                attendanceRate: attendance, waiver: waiver, payment: payment,
                balanceCents: payRoll < 7 ? 0 : (payRoll < 9 ? 9500 : 19000),
                medicalNotes: i % 6 == 0 ? "Mild asthma — inhaler in bag" : nil,
                allergies: allergyOptions[i % allergyOptions.count]
            )
        }
    }()

    static let announcements: [Announcement] = [
        Announcement(id: "a1", studioId: studio.id, title: "Spring Recital rehearsal — May 25th", body: "All recital classes have a mandatory dress rehearsal at the Benson Theatre. Arrive 30 minutes early with full costume and hair done.", scope: .recital, sentAt: daysAgo(1), audience: "8 recital classes", reach: 121),
        Announcement(id: "a2", studioId: studio.id, title: "Jazz Class cancelled tonight", body: "Due to a facilities issue, tonight's Intermediate Jazz is cancelled. A make-up class will be scheduled next week.", scope: .emergency, sentAt: daysAgo(2), audience: "Intermediate Jazz", reach: 14),
        Announcement(id: "a3", studioId: studio.id, title: "Costumes due next week", body: "Final costume payments are due Friday. Please complete your balance in the parent portal to secure your dancer's costume.", scope: .studioWide, sentAt: daysAgo(4), audience: "All families", reach: 42),
        Announcement(id: "a4", studioId: studio.id, title: "New Acro Foundations spots open", body: "We've opened 4 additional spots in Acro Foundations on Thursdays. Enrol now through the portal.", scope: .studioWide, sentAt: daysAgo(8), audience: "All families", reach: 42),
    ]

    static let invoices: [Invoice] = {
        students.filter { $0.payment != .paid }.prefix(9).enumerated().map { (i, s) in
            Invoice(id: "inv\(i + 1)", studioId: studio.id, studentName: s.name, caregiverName: s.caregiverName,
                    description: i % 2 == 0 ? "May tuition" : "Recital costume + tuition",
                    amountCents: s.balanceCents == 0 ? 9500 : s.balanceCents,
                    status: s.payment, dueDate: s.payment == .overdue ? daysAgo(6) : daysAhead(5 + i))
        }
    }()

    static let recitalEvents: [RecitalEvent] = [
        RecitalEvent(id: "r1", studioId: studio.id, name: "Spring Showcase 2026",
                     date: ISO8601DateFormatter().date(from: "2026-06-15T19:00:00Z") ?? Date(),
                     venue: "Benson Theatre",
                     costumeDeadline: ISO8601DateFormatter().date(from: "2026-05-30T00:00:00Z"),
                     performances: [
                        RecitalPerformance(id: "p1", name: "Act I — Little Stars", classIds: ["c1"], order: 1, startTime: "19:00", costumeNote: "Pink tutus and ballet slippers"),
                        RecitalPerformance(id: "p2", name: "Act II — Rising Energy", classIds: ["c2", "c6", "c10"], order: 2, startTime: "19:20", costumeNote: "Neon accents and white sneakers"),
                        RecitalPerformance(id: "p3", name: "Act III — Grace & Flow", classIds: ["c3", "c4"], order: 3, startTime: "20:00", costumeNote: "Flowing earth-tone fabrics"),
                        RecitalPerformance(id: "p4", name: "Finale — Senior Spotlight", classIds: ["c7", "c9"], order: 4, startTime: "20:30", costumeNote: "Black and gold formal attire"),
                     ])
    ]
}
