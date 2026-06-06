import SwiftUI

struct RecitalsView: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                ForEach(store.recitalEvents) { event in
                    RecitalEventCard(event: event)
                }
                if store.recitalEvents.isEmpty {
                    Text("No \(store.term.eventPlural.lowercased()) scheduled.")
                        .font(.system(size: 14)).foregroundStyle(Theme.mutedForeground)
                        .frame(maxWidth: .infinity).padding(.vertical, 40)
                }
            }
            .padding(20)
        }
        .background(Theme.background)
        .navigationTitle(store.term.eventPlural)
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct RecitalEventCard: View {
    @Environment(AppStore.self) private var store
    let event: RecitalEvent

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Hero header
            VStack(alignment: .leading, spacing: 6) {
                Text(event.name).font(.display(24)).foregroundStyle(.white)
                HStack(spacing: 14) {
                    Label(event.date.formatted(date: .abbreviated, time: .shortened), systemImage: "calendar")
                    Label(event.venue, systemImage: "mappin.and.ellipse")
                }
                .font(.system(size: 13)).foregroundStyle(.white.opacity(0.8))
                if let deadline = event.costumeDeadline {
                    Label("Costume deadline \(deadline.formatted(date: .abbreviated, time: .omitted))", systemImage: "scissors")
                        .font(.system(size: 12)).foregroundStyle(Theme.gold)
                        .padding(.top, 2)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(18)
            .background(
                LinearGradient(colors: [Theme.plum, Theme.rose], startPoint: .topLeading, endPoint: .bottomTrailing)
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))

            // Running order
            Text("Running order").font(.display(17)).foregroundStyle(Theme.foreground)
            VStack(spacing: 10) {
                ForEach(event.performances.sorted { $0.order < $1.order }) { p in
                    HStack(alignment: .top, spacing: 12) {
                        Text("\(p.order)")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(width: 30, height: 30)
                            .background(store.accentColor)
                            .clipShape(Circle())
                        VStack(alignment: .leading, spacing: 3) {
                            Text(p.name).font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(Theme.foreground)
                            if let t = p.startTime {
                                Text(Fmt.time12(t)).font(.system(size: 12)).foregroundStyle(Theme.mutedForeground)
                            }
                            if let note = p.costumeNote {
                                Label(note, systemImage: "tshirt.fill")
                                    .font(.system(size: 12)).foregroundStyle(Theme.plum)
                            }
                        }
                        Spacer()
                    }
                    .padding(12)
                    .background(Theme.secondary.opacity(0.35))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .softCard()
    }
}
