import SwiftUI

struct InstructorsView: View {
    @Environment(AppStore.self) private var store
    @State private var search = ""

    private var filtered: [Teacher] {
        store.teachers.filter { search.isEmpty || $0.name.localizedCaseInsensitiveContains(search) }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                ForEach(filtered) { t in
                    NavigationLink(destination: InstructorDetailView(teacher: t)) {
                        InstructorRow(teacher: t)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(20)
        }
        .background(Theme.background)
        .searchable(text: $search, prompt: "Search \(store.term.instructorPlural.lowercased())")
        .navigationTitle(store.term.instructorPlural)
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct InstructorRow: View {
    @Environment(AppStore.self) private var store
    let teacher: Teacher

    var body: some View {
        HStack(spacing: 12) {
            InitialsAvatar(name: teacher.name, bg: Theme.plum)
            VStack(alignment: .leading, spacing: 4) {
                Text(teacher.name).font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Theme.foreground)
                Text(teacher.skills.map { $0.name }.joined(separator: " · "))
                    .font(.system(size: 12)).foregroundStyle(Theme.mutedForeground)
                    .lineLimit(1)
            }
            Spacer()
            StatusBadge(text: teacher.status.label, color: statusColor(teacher.status))
        }
        .softCard(padding: 14)
    }

    private func statusColor(_ s: InstructorStatus) -> Color {
        switch s {
        case .active: Theme.success
        case .on_leave: Theme.gold
        case .archived: Theme.mutedForeground
        }
    }
}

struct InstructorDetailView: View {
    @Environment(AppStore.self) private var store
    let teacher: Teacher

    private var classes: [StudioClass] { store.classesFor(teacher.id) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 14) {
                    InitialsAvatar(name: teacher.name, size: 64, bg: Theme.plum)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(teacher.name).font(.display(24)).foregroundStyle(Theme.foreground)
                        if let emp = teacher.employeeId {
                            Text(emp).font(.system(size: 13)).foregroundStyle(Theme.mutedForeground)
                        }
                    }
                    Spacer()
                }

                SectionCard(title: "Contact") {
                    VStack(alignment: .leading, spacing: 8) {
                        Label(teacher.email, systemImage: "envelope.fill")
                        if let phone = teacher.phone { Label(phone, systemImage: "phone.fill") }
                        if let addr = teacher.address { Label(addr, systemImage: "mappin.and.ellipse") }
                    }
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.foreground.opacity(0.8))
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                SectionCard(title: "Skills & qualifications") {
                    FlowChips(items: teacher.skills.map { $0.name })
                }

                if !teacher.certifications.isEmpty {
                    SectionCard(title: "Certifications") {
                        VStack(spacing: 10) {
                            ForEach(teacher.certifications) { cert in
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(cert.name).font(.system(size: 14, weight: .medium))
                                            .foregroundStyle(Theme.foreground)
                                        if let exp = cert.expiresAt {
                                            Text("Expires \(exp)").font(.system(size: 12))
                                                .foregroundStyle(Theme.mutedForeground)
                                        }
                                    }
                                    Spacer()
                                    Image(systemName: "checkmark.seal.fill").foregroundStyle(Theme.success)
                                }
                            }
                        }
                    }
                }

                SectionCard(title: "\(store.term.classPlural) taught", subtitle: "\(classes.count) active") {
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
            }
            .padding(20)
        }
        .background(Theme.background)
        .navigationTitle(teacher.name)
        .navigationBarTitleDisplayMode(.inline)
    }
}

/// Simple wrapping chips layout.
struct FlowChips: View {
    let items: [String]
    var body: some View {
        let cols = [GridItem(.adaptive(minimum: 80), spacing: 8, alignment: .leading)]
        LazyVGrid(columns: cols, alignment: .leading, spacing: 8) {
            ForEach(items, id: \.self) { Chip(text: $0, color: Theme.teal) }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
