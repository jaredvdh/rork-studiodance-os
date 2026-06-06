import SwiftUI

struct SettingsView: View {
    @Environment(AppStore.self) private var store

    // Editable draft state
    @State private var name = ""
    @State private var tagline = ""
    @State private var city = ""
    @State private var vertical: Vertical = .dance
    @State private var brandColor = "350 74% 60%"
    @State private var toggles: [String: Bool] = [:]
    @State private var loaded = false
    @State private var showSaved = false

    private let brandColors: [(String, String)] = [
        ("Ballet rose", "350 74% 60%"),
        ("Plum", "268 30% 40%"),
        ("Indigo", "245 48% 48%"),
        ("Teal", "178 42% 42%"),
        ("Gold", "38 64% 54%"),
        ("Amber", "32 82% 48%"),
        ("Forest", "152 46% 36%"),
        ("Slate", "220 12% 40%"),
    ]

    private let modules: [(String, String, String)] = [
        ("costumes", "Costumes", "tshirt.fill"),
        ("recitals", "Recitals & Events", "trophy.fill"),
        ("payments", "Payments", "creditcard.fill"),
        ("waivers", "Waivers & Docs", "signature"),
        ("instructors", "Instructors", "person.crop.rectangle.stack.fill"),
        ("announcements", "Announcements", "megaphone.fill"),
    ]

    private var isDirty: Bool {
        name != store.studio.name || tagline != store.studio.tagline ||
        city != store.studio.city || vertical != store.studio.vertical ||
        brandColor != store.studio.brandColor || toggles != store.studio.featureToggles
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                logoSection
                profileSection
                themeSection
                featuresSection
                saveBar
            }
            .padding(20)
        }
        .background(Theme.background)
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear(perform: load)
        .overlay(alignment: .top) {
            if showSaved {
                Text("Changes saved")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16).padding(.vertical, 10)
                    .background(Theme.success)
                    .clipShape(Capsule())
                    .padding(.top, 8)
                    .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
    }

    private var logoSection: some View {
        SectionCard(title: "Branding", subtitle: "Logo & studio identity") {
            HStack(spacing: 16) {
                Text(initialsPreview)
                    .font(.display(24))
                    .foregroundStyle(.white)
                    .frame(width: 72, height: 72)
                    .background(Color(hslString: brandColor))
                    .clipShape(RoundedRectangle(cornerRadius: 18))
                VStack(alignment: .leading, spacing: 6) {
                    Text("Studio logo").font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Theme.foreground)
                    Text("Auto-generated from your initials. Upload available on web.")
                        .font(.system(size: 12)).foregroundStyle(Theme.mutedForeground)
                    Button {} label: {
                        Label("Upload logo", systemImage: "photo.badge.plus")
                            .font(.system(size: 13, weight: .semibold))
                    }
                    .buttonStyle(.bordered)
                    .tint(store.accentColor)
                }
                Spacer()
            }
        }
    }

    private var profileSection: some View {
        SectionCard(title: "Studio Profile") {
            VStack(spacing: 14) {
                labeledField("Studio name", text: $name)
                labeledField("Tagline", text: $tagline)
                labeledField("City", text: $city)
                VStack(alignment: .leading, spacing: 6) {
                    Text("Studio type").font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Theme.mutedForeground)
                    Picker("Studio type", selection: $vertical) {
                        ForEach(Vertical.allCases) { Text(Terminologies.label($0)).tag($0) }
                    }
                    .pickerStyle(.menu).tint(store.accentColor)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
    }

    private var themeSection: some View {
        SectionCard(title: "Theme", subtitle: "Brand accent colour") {
            let cols = [GridItem(.adaptive(minimum: 64), spacing: 12)]
            LazyVGrid(columns: cols, spacing: 12) {
                ForEach(brandColors, id: \.1) { (label, value) in
                    Button { brandColor = value } label: {
                        VStack(spacing: 6) {
                            Circle()
                                .fill(Color(hslString: value))
                                .frame(width: 40, height: 40)
                                .overlay {
                                    if brandColor == value {
                                        Image(systemName: "checkmark")
                                            .font(.system(size: 14, weight: .bold))
                                            .foregroundStyle(.white)
                                    }
                                }
                                .overlay {
                                    Circle().stroke(Theme.foreground.opacity(brandColor == value ? 0.3 : 0), lineWidth: 2)
                                        .padding(-4)
                                }
                            Text(label).font(.system(size: 10)).foregroundStyle(Theme.mutedForeground)
                                .lineLimit(1)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var featuresSection: some View {
        SectionCard(title: "Features", subtitle: "Enable or disable modules") {
            VStack(spacing: 4) {
                ForEach(modules, id: \.0) { (key, label, icon) in
                    Toggle(isOn: Binding(
                        get: { toggles[key] ?? true },
                        set: { toggles[key] = $0 }
                    )) {
                        Label {
                            Text(label).font(.system(size: 14)).foregroundStyle(Theme.foreground)
                        } icon: {
                            Image(systemName: icon).foregroundStyle(store.accentColor)
                        }
                    }
                    .tint(store.accentColor)
                    .padding(.vertical, 6)
                    if key != modules.last?.0 { Divider() }
                }
            }
        }
    }

    private var saveBar: some View {
        HStack(spacing: 12) {
            Button("Reset", role: .destructive, action: load)
                .buttonStyle(.bordered)
                .disabled(!isDirty)
            Spacer()
            Button("Save changes", action: save)
                .buttonStyle(.borderedProminent)
                .tint(store.accentColor)
                .fontWeight(.semibold)
                .disabled(!isDirty)
        }
    }

    private var initialsPreview: String {
        let parts = name.split(separator: " ")
        if parts.count >= 2 { return "\(parts[0].prefix(1))\(parts[1].prefix(1))".uppercased() }
        return String(name.prefix(2)).uppercased()
    }

    private func labeledField(_ label: String, text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).font(.system(size: 12, weight: .medium))
                .foregroundStyle(Theme.mutedForeground)
            TextField(label, text: text)
                .font(.system(size: 15))
                .padding(12)
                .background(Theme.secondary.opacity(0.4))
                .clipShape(RoundedRectangle(cornerRadius: 10))
        }
    }

    private func load() {
        name = store.studio.name
        tagline = store.studio.tagline
        city = store.studio.city
        vertical = store.studio.vertical
        brandColor = store.studio.brandColor
        toggles = store.studio.featureToggles
        loaded = true
    }

    private func save() {
        store.studio.name = name
        store.studio.tagline = tagline
        store.studio.city = city
        store.studio.vertical = vertical
        store.studio.brandColor = brandColor
        store.studio.featureToggles = toggles
        store.studio.initials = initialsPreview
        withAnimation { showSaved = true }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.6) {
            withAnimation { showSaved = false }
        }
    }
}
