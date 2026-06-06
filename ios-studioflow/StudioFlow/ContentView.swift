import SwiftUI

struct ContentView: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        TabView {
            NavigationStack { DashboardView() }
                .tabItem { Label("Home", systemImage: "square.grid.2x2.fill") }

            NavigationStack { ClassesView() }
                .tabItem { Label(store.term.classPlural, systemImage: "calendar") }

            NavigationStack { ScheduleView() }
                .tabItem { Label("Schedule", systemImage: "clock.fill") }

            NavigationStack { StudentsView() }
                .tabItem { Label(store.term.participantPlural, systemImage: "person.2.fill") }

            NavigationStack { MoreView() }
                .tabItem { Label("More", systemImage: "ellipsis.circle.fill") }
        }
        .tint(store.accentColor)
    }
}

/// "More" hub linking to secondary sections, styled after the dark sidebar.
struct MoreView: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                brandHeader

                VStack(spacing: 10) {
                    if store.term.hasModule(.instructors) {
                        moreLink("Instructors", store.term.instructorPlural, "person.crop.rectangle.stack.fill", Theme.plum) { InstructorsView() }
                    }
                    if store.term.hasModule(.announcements) {
                        moreLink("Announcements", "Studio updates & alerts", "megaphone.fill", Theme.rose) { AnnouncementsView() }
                    }
                    if store.term.hasModule(.payments) {
                        moreLink("Payments", "Invoices & revenue", "creditcard.fill", Theme.gold) { PaymentsView() }
                    }
                    if store.term.hasModule(.recitals) {
                        moreLink(store.term.eventPlural, "Running order & performances", "trophy.fill", Theme.teal) { RecitalsView() }
                    }
                    moreLink("Settings", "Studio profile, branding & features", "gearshape.fill", Theme.foreground) { SettingsView() }
                }
            }
            .padding(20)
        }
        .background(Theme.background)
        .navigationTitle("More")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var brandHeader: some View {
        HStack(spacing: 14) {
            Text(store.studio.initials)
                .font(.display(20))
                .foregroundStyle(.white)
                .frame(width: 56, height: 56)
                .background(store.accentColor)
                .clipShape(RoundedRectangle(cornerRadius: 16))
            VStack(alignment: .leading, spacing: 2) {
                Text(store.studio.name).font(.display(20))
                    .foregroundStyle(.white)
                Text(store.studio.city).font(.system(size: 13))
                    .foregroundStyle(.white.opacity(0.6))
            }
            Spacer()
        }
        .padding(18)
        .frame(maxWidth: .infinity)
        .background(Theme.sidebarBg)
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }

    @ViewBuilder
    private func moreLink<Destination: View>(_ title: String, _ subtitle: String, _ icon: String, _ color: Color, @ViewBuilder destination: () -> Destination) -> some View {
        NavigationLink(destination: destination()) {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12).fill(color.opacity(0.12))
                    Image(systemName: icon).foregroundStyle(color)
                        .font(.system(size: 17, weight: .semibold))
                }
                .frame(width: 44, height: 44)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Theme.foreground)
                    Text(subtitle).font(.system(size: 12))
                        .foregroundStyle(Theme.mutedForeground)
                }
                Spacer()
                Image(systemName: "chevron.right").font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Theme.mutedForeground.opacity(0.5))
            }
            .softCard(padding: 14)
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    ContentView().environment(AppStore())
}
