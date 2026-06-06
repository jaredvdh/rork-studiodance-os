import SwiftUI

struct ClassesView: View {
    @Environment(AppStore.self) private var store
    @State private var search = ""
    @State private var styleFilter: String? = nil
    @State private var editing: StudioClass?
    @State private var showAdd = false

    private var filtered: [StudioClass] {
        store.classes.filter { c in
            (search.isEmpty || c.name.localizedCaseInsensitiveContains(search)) &&
            (styleFilter == nil || c.style == styleFilter)
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                styleChips
                ForEach(filtered) { c in
                    ClassCard(c: c) { editing = c }
                }
                if filtered.isEmpty {
                    Text("No \(store.term.classPlural.lowercased()) found.")
                        .font(.system(size: 14)).foregroundStyle(Theme.mutedForeground)
                        .frame(maxWidth: .infinity).padding(.vertical, 40)
                }
            }
            .padding(20)
        }
        .background(Theme.background)
        .searchable(text: $search, prompt: "Search \(store.term.classPlural.lowercased())")
        .navigationTitle(store.term.classPlural)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showAdd = true } label: { Image(systemName: "plus") }
            }
        }
        .sheet(item: $editing) { c in
            ClassEditor(studioClass: c) { store.updateClass($0) }
        }
        .sheet(isPresented: $showAdd) {
            ClassEditor(studioClass: nil) { store.addClass($0) }
        }
    }

    private var styleChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                filterChip("All", isOn: styleFilter == nil) { styleFilter = nil }
                ForEach(store.term.styleCategories, id: \.self) { s in
                    filterChip(s, isOn: styleFilter == s) { styleFilter = s }
                }
            }
        }
        .scrollClipDisabled()
    }

    private func filterChip(_ label: String, isOn: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 13, weight: .semibold))
                .padding(.horizontal, 14).padding(.vertical, 8)
                .background(isOn ? store.accentColor : Theme.card)
                .foregroundStyle(isOn ? .white : Theme.foreground)
                .clipShape(Capsule())
                .overlay { Capsule().stroke(Theme.border, lineWidth: isOn ? 0 : 1) }
        }
        .buttonStyle(.plain)
    }
}

struct ClassCard: View {
    @Environment(AppStore.self) private var store
    let c: StudioClass
    var onEdit: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                Circle().fill(StyleColors.dot(c.style)).frame(width: 10, height: 10).padding(.top, 5)
                VStack(alignment: .leading, spacing: 3) {
                    Text(c.name).font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(Theme.foreground)
                    HStack(spacing: 6) {
                        Chip(text: c.style, color: StyleColors.dot(c.style))
                        Chip(text: c.ageGroup.rawValue, color: Theme.plum)
                    }
                }
                Spacer()
                Button(action: onEdit) {
                    Image(systemName: "pencil")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Theme.mutedForeground)
                        .frame(width: 32, height: 32)
                        .background(Theme.secondary)
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
            }
            HStack(spacing: 16) {
                infoItem("clock", "\(Fmt.time12(c.startTime)) – \(Fmt.time12(c.endTime))")
                infoItem("calendar", c.day.fullName)
            }
            HStack(spacing: 16) {
                infoItem("person.fill", store.teacherName(c.teacherId))
                infoItem("mappin.and.ellipse", c.room)
            }
            if let desc = c.description {
                Text(desc).font(.system(size: 13)).foregroundStyle(Theme.mutedForeground)
                    .lineLimit(2)
            }
            Divider()
            HStack {
                CapacityBar(enrolled: c.enrolled, capacity: c.capacity)
                Spacer()
                Text(Fmt.currency(c.priceCents))
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(Theme.foreground)
            }
            if c.waitlist > 0 || c.inRecital {
                HStack(spacing: 8) {
                    if c.waitlist > 0 { Chip(text: "\(c.waitlist) waitlisted", color: Theme.gold) }
                    if c.inRecital { Chip(text: "In \(store.term.event)", color: Theme.rose) }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .softCard()
    }

    private func infoItem(_ icon: String, _ text: String) -> some View {
        Label {
            Text(text).font(.system(size: 13)).foregroundStyle(Theme.foreground.opacity(0.8))
        } icon: {
            Image(systemName: icon).font(.system(size: 12)).foregroundStyle(Theme.mutedForeground)
        }
    }
}

/// Add / edit class form sheet.
struct ClassEditor: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let studioClass: StudioClass?
    var onSave: (StudioClass) -> Void

    @State private var name = ""
    @State private var style = "Ballet"
    @State private var ageGroup: AgeGroup = .junior
    @State private var day: WeekDay = .Mon
    @State private var startHour = 16
    @State private var startMinute = 0
    @State private var durationMins = 60
    @State private var room = ""
    @State private var teacherId = ""
    @State private var capacity = 16
    @State private var enrolled = 0
    @State private var priceDollars = 95
    @State private var inRecital = false
    @State private var descriptionText = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Details") {
                    TextField("Name", text: $name)
                    Picker(store.term.classStyle, selection: $style) {
                        ForEach(store.term.styleCategories, id: \.self) { Text($0).tag($0) }
                    }
                    Picker("Age group", selection: $ageGroup) {
                        ForEach(AgeGroup.allCases) { Text($0.rawValue).tag($0) }
                    }
                    TextField("Room", text: $room)
                    if !descriptionText.isEmpty || true {
                        TextField("Description", text: $descriptionText, axis: .vertical)
                            .lineLimit(2...4)
                    }
                }
                Section("Schedule") {
                    Picker("Day", selection: $day) {
                        ForEach(WeekDay.allCases) { Text($0.fullName).tag($0) }
                    }
                    Stepper("Start: \(String(format: "%02d:%02d", startHour, startMinute))", value: $startHour, in: 0...23)
                    Picker("Minutes", selection: $startMinute) {
                        ForEach([0, 15, 30, 45], id: \.self) { Text(String(format: ":%02d", $0)).tag($0) }
                    }.pickerStyle(.segmented)
                    Stepper("Duration: \(durationMins) min", value: $durationMins, in: 15...180, step: 15)
                }
                Section("Teacher & capacity") {
                    Picker(store.term.instructor, selection: $teacherId) {
                        ForEach(store.teachers) { Text($0.name).tag($0.id) }
                    }
                    Stepper("Capacity: \(capacity)", value: $capacity, in: 1...60)
                    Stepper("Enrolled: \(enrolled)", value: $enrolled, in: 0...capacity)
                    Stepper("Price: $\(priceDollars)", value: $priceDollars, in: 0...500, step: 5)
                    Toggle("In \(store.term.event.lowercased())", isOn: $inRecital)
                }
            }
            .navigationTitle(studioClass == nil ? "New \(store.term.classSingular)" : "Edit \(store.term.classSingular)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save", action: save).fontWeight(.semibold).disabled(name.isEmpty)
                }
            }
            .onAppear(perform: load)
        }
    }

    private func load() {
        guard let c = studioClass else {
            teacherId = store.teachers.first?.id ?? ""
            style = store.term.styleCategories.first ?? "Ballet"
            return
        }
        name = c.name; style = c.style; ageGroup = c.ageGroup; day = c.day
        let parts = c.startTime.split(separator: ":")
        startHour = Int(parts.first ?? "16") ?? 16
        startMinute = Int(parts.last ?? "0") ?? 0
        durationMins = c.durationMins; room = c.room; teacherId = c.teacherId
        capacity = c.capacity; enrolled = c.enrolled; priceDollars = c.priceCents / 100
        inRecital = c.inRecital; descriptionText = c.description ?? ""
    }

    private func save() {
        let id = studioClass?.id ?? "c\(Int(Date().timeIntervalSince1970))"
        let c = StudioClass(
            id: id, studioId: store.studio.id, name: name, style: style, ageGroup: ageGroup,
            day: day, startTime: String(format: "%02d:%02d", startHour, startMinute),
            durationMins: durationMins, room: room, teacherId: teacherId, capacity: capacity,
            enrolled: enrolled, waitlist: studioClass?.waitlist ?? 0, inRecital: inRecital,
            priceCents: priceDollars * 100,
            description: descriptionText.isEmpty ? nil : descriptionText
        )
        onSave(c)
        dismiss()
    }
}
