import SwiftUI

struct AnnouncementsView: View {
    @Environment(AppStore.self) private var store
    @State private var showCompose = false

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                ForEach(store.announcements) { a in
                    AnnouncementCard(announcement: a)
                }
            }
            .padding(20)
        }
        .background(Theme.background)
        .navigationTitle("Announcements")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showCompose = true } label: { Image(systemName: "square.and.pencil") }
            }
        }
        .sheet(isPresented: $showCompose) {
            AnnouncementComposer { store.addAnnouncement($0) }
        }
    }
}

struct AnnouncementCard: View {
    let announcement: Announcement
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Chip(text: announcement.scope.rawValue, color: scopeColor(announcement.scope))
                Spacer()
                Text(Fmt.relative(announcement.sentAt))
                    .font(.system(size: 11)).foregroundStyle(Theme.mutedForeground)
            }
            Text(announcement.title).font(.system(size: 16, weight: .semibold))
                .foregroundStyle(Theme.foreground)
            Text(announcement.body).font(.system(size: 13))
                .foregroundStyle(Theme.foreground.opacity(0.75))
            HStack(spacing: 14) {
                Label(announcement.audience, systemImage: "person.2.fill")
                Label("\(announcement.reach) reached", systemImage: "paperplane.fill")
            }
            .font(.system(size: 12)).foregroundStyle(Theme.mutedForeground)
            .padding(.top, 2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .softCard()
    }

    private func scopeColor(_ s: AnnouncementScope) -> Color {
        switch s {
        case .studioWide: Theme.teal
        case .classScope: Theme.plum
        case .recital: Theme.rose
        case .emergency: Theme.destructive
        }
    }
}

struct AnnouncementComposer: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    var onSend: (Announcement) -> Void

    @State private var title = ""
    @State private var body_ = ""
    @State private var scope: AnnouncementScope = .studioWide

    var body: some View {
        NavigationStack {
            Form {
                Section("Message") {
                    TextField("Title", text: $title)
                    TextField("Body", text: $body_, axis: .vertical).lineLimit(4...8)
                }
                Section("Audience") {
                    Picker("Scope", selection: $scope) {
                        ForEach(AnnouncementScope.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                    }
                }
            }
            .navigationTitle("New announcement")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Send") {
                        let a = Announcement(
                            id: "a\(Int(Date().timeIntervalSince1970))", studioId: store.studio.id,
                            title: title, body: body_, scope: scope, sentAt: Date(),
                            audience: scope == .studioWide ? "All families" : "Selected", reach: 0
                        )
                        onSend(a)
                        dismiss()
                    }
                    .fontWeight(.semibold)
                    .disabled(title.isEmpty || body_.isEmpty)
                }
            }
        }
    }
}
