import SwiftUI

struct StudentsView: View {
    @Environment(AppStore.self) private var store
    @State private var search = ""
    @State private var filter: Filter = .all

    enum Filter: String, CaseIterable, Identifiable {
        case all = "All", waiver = "Waiver due", overdue = "Overdue"
        var id: String { rawValue }
    }

    private var filtered: [Student] {
        store.students.filter { s in
            (search.isEmpty || s.name.localizedCaseInsensitiveContains(search) || s.caregiverName.localizedCaseInsensitiveContains(search)) &&
            (filter == .all ||
             (filter == .waiver && s.waiver != .signed) ||
             (filter == .overdue && s.payment == .overdue))
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                summaryRow
                Picker("Filter", selection: $filter) {
                    ForEach(Filter.allCases) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)
                ForEach(filtered) { s in
                    NavigationLink(destination: StudentDetailView(student: s)) {
                        StudentRow(student: s)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(20)
        }
        .background(Theme.background)
        .searchable(text: $search, prompt: "Search \(store.term.participantPlural.lowercased()) & caregivers")
        .navigationTitle(store.term.participantPlural)
    }

    private var summaryRow: some View {
        HStack(spacing: 12) {
            miniStat("\(store.students.count)", "Active", Theme.rose)
            miniStat("\(store.students.filter { $0.waiver != .signed }.count)", "Waiver due", Theme.gold)
            miniStat("\(store.students.filter { $0.payment == .overdue }.count)", "Overdue", Theme.destructive)
        }
    }

    private func miniStat(_ value: String, _ label: String, _ color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.display(22)).foregroundStyle(color)
            Text(label).font(.system(size: 11)).foregroundStyle(Theme.mutedForeground)
        }
        .frame(maxWidth: .infinity)
        .softCard(padding: 14)
    }
}

struct StudentRow: View {
    let student: Student
    var body: some View {
        HStack(spacing: 12) {
            InitialsAvatar(name: student.name)
            VStack(alignment: .leading, spacing: 3) {
                Text(student.name).font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Theme.foreground)
                Text(student.caregiverName).font(.system(size: 12))
                    .foregroundStyle(Theme.mutedForeground)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                StatusBadge(text: student.payment.label, color: paymentColor(student.payment))
                StatusBadge(text: "Waiver \(student.waiver.rawValue)", color: waiverColor(student.waiver))
            }
        }
        .softCard(padding: 14)
    }
}

struct StudentDetailView: View {
    @Environment(AppStore.self) private var store
    let student: Student

    private var classes: [StudioClass] {
        store.classes.filter { student.classIds.contains($0.id) }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 14) {
                    InitialsAvatar(name: student.name, size: 64)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(student.name).font(.display(24))
                            .foregroundStyle(Theme.foreground)
                        Text("\(Int(student.attendanceRate * 100))% attendance")
                            .font(.system(size: 13)).foregroundStyle(Theme.mutedForeground)
                    }
                    Spacer()
                }

                SectionCard(title: "Status") {
                    VStack(spacing: 10) {
                        detailRow("Waiver") { StatusBadge(text: student.waiver.rawValue.capitalized, color: waiverColor(student.waiver)) }
                        detailRow("Payment") { StatusBadge(text: student.payment.label, color: paymentColor(student.payment)) }
                        if student.balanceCents > 0 {
                            detailRow("Balance") { Text(Fmt.currency(student.balanceCents)).font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.destructive) }
                        }
                    }
                }

                SectionCard(title: "Caregiver") {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(student.caregiverName).font(.system(size: 15, weight: .medium))
                            .foregroundStyle(Theme.foreground)
                        Text(student.caregiverEmail).font(.system(size: 13))
                            .foregroundStyle(Theme.mutedForeground)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                SectionCard(title: "Enrolled \(store.term.classPlural.lowercased())", subtitle: "\(classes.count) active") {
                    VStack(spacing: 10) {
                        ForEach(classes) { c in
                            HStack(spacing: 10) {
                                Circle().fill(StyleColors.dot(c.style)).frame(width: 8, height: 8)
                                VStack(alignment: .leading, spacing: 1) {
                                    Text(c.name).font(.system(size: 14, weight: .medium))
                                        .foregroundStyle(Theme.foreground)
                                    Text("\(c.day.fullName) · \(Fmt.time12(c.startTime))")
                                        .font(.system(size: 12)).foregroundStyle(Theme.mutedForeground)
                                }
                                Spacer()
                            }
                        }
                    }
                }

                if student.medicalNotes != nil || student.allergies != nil {
                    SectionCard(title: "Medical & safety") {
                        VStack(alignment: .leading, spacing: 8) {
                            if let m = student.medicalNotes {
                                Label(m, systemImage: "cross.case.fill").font(.system(size: 13))
                                    .foregroundStyle(Theme.foreground.opacity(0.8))
                            }
                            if let a = student.allergies {
                                Label("Allergies: \(a)", systemImage: "exclamationmark.triangle.fill")
                                    .font(.system(size: 13)).foregroundStyle(Theme.destructive)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }
            .padding(20)
        }
        .background(Theme.background)
        .navigationTitle(student.name)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func detailRow<V: View>(_ label: String, @ViewBuilder value: () -> V) -> some View {
        HStack {
            Text(label).font(.system(size: 14)).foregroundStyle(Theme.mutedForeground)
            Spacer()
            value()
        }
    }
}
