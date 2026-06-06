import SwiftUI

struct ScheduleView: View {
    @Environment(AppStore.self) private var store
    @State private var selectedDay: WeekDay = {
        let idx = Calendar.current.component(.weekday, from: Date())
        let map: [Int: WeekDay] = [1: .Sun, 2: .Mon, 3: .Tue, 4: .Wed, 5: .Thu, 6: .Fri, 7: .Sat]
        return map[idx] ?? .Mon
    }()

    private var dayClasses: [StudioClass] {
        store.classes.filter { $0.day == selectedDay }.sorted { $0.startTime < $1.startTime }
    }

    /// Each hour rendered for the 24-hour timeline.
    private let hours = Array(0..<24)

    private func minutesFromMidnight(_ hhmm: String) -> Int {
        let p = hhmm.split(separator: ":")
        return (Int(p.first ?? "0") ?? 0) * 60 + (Int(p.last ?? "0") ?? 0)
    }

    var body: some View {
        VStack(spacing: 0) {
            daySelector
            ScrollViewReader { proxy in
                ScrollView {
                    timeline
                        .padding(.horizontal, 16)
                        .padding(.bottom, 24)
                }
                .onAppear { proxy.scrollTo(7, anchor: .top) }
                .onChange(of: selectedDay) { _, _ in
                    withAnimation { proxy.scrollTo(max(0, (dayClasses.first.map { minutesFromMidnight($0.startTime) / 60 } ?? 7) - 1), anchor: .top) }
                }
            }
        }
        .background(Theme.background)
        .navigationTitle("Schedule")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var daySelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(WeekDay.allCases) { d in
                    let count = store.classes.filter { $0.day == d }.count
                    Button { selectedDay = d } label: {
                        VStack(spacing: 2) {
                            Text(d.rawValue).font(.system(size: 14, weight: .semibold))
                            Text("\(count)").font(.system(size: 11))
                                .foregroundStyle(selectedDay == d ? .white.opacity(0.8) : Theme.mutedForeground)
                        }
                        .frame(width: 52, height: 52)
                        .background(selectedDay == d ? store.accentColor : Theme.card)
                        .foregroundStyle(selectedDay == d ? .white : Theme.foreground)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .overlay { RoundedRectangle(cornerRadius: 14).stroke(Theme.border, lineWidth: selectedDay == d ? 0 : 1) }
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16).padding(.vertical, 12)
        }
        .background(Theme.background)
    }

    private var timeline: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(hours, id: \.self) { hour in
                let classesAtHour = dayClasses.filter { minutesFromMidnight($0.startTime) / 60 == hour }
                HStack(alignment: .top, spacing: 12) {
                    Text(hourLabel(hour))
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(Theme.mutedForeground)
                        .frame(width: 42, alignment: .trailing)
                        .padding(.top, 4)
                    VStack(spacing: 8) {
                        if classesAtHour.isEmpty {
                            Rectangle().fill(Theme.border.opacity(0.4)).frame(height: 1)
                                .padding(.top, 9)
                        } else {
                            ForEach(classesAtHour) { c in scheduleBlock(c) }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .frame(minHeight: 56, alignment: .top)
                .id(hour)
            }
        }
    }

    private func scheduleBlock(_ c: StudioClass) -> some View {
        HStack(spacing: 10) {
            RoundedRectangle(cornerRadius: 3).fill(StyleColors.dot(c.style)).frame(width: 4)
            VStack(alignment: .leading, spacing: 3) {
                Text(c.name).font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Theme.foreground)
                Text("\(Fmt.time12(c.startTime)) – \(Fmt.time12(c.endTime)) · \(c.room)")
                    .font(.system(size: 12)).foregroundStyle(Theme.mutedForeground)
                Text("\(store.teacherName(c.teacherId)) · \(c.enrolled)/\(c.capacity)")
                    .font(.system(size: 11)).foregroundStyle(Theme.mutedForeground)
            }
            Spacer()
        }
        .padding(10)
        .background(StyleColors.dot(c.style).opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func hourLabel(_ h: Int) -> String {
        if h == 0 { return "12a" }
        if h == 12 { return "12p" }
        return h < 12 ? "\(h)a" : "\(h - 12)p"
    }
}
