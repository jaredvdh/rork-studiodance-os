import SwiftUI

struct DashboardView: View {
    @Environment(AppStore.self) private var store

    private var todayDay: WeekDay {
        let idx = Calendar.current.component(.weekday, from: Date()) // 1=Sun
        let map: [Int: WeekDay] = [1: .Sun, 2: .Mon, 3: .Tue, 4: .Wed, 5: .Thu, 6: .Fri, 7: .Sat]
        return map[idx] ?? .Mon
    }

    private var todayClasses: [StudioClass] {
        store.classes.filter { $0.day == todayDay }.sorted { $0.startTime < $1.startTime }
    }

    private var topClasses: [StudioClass] {
        store.classes.sorted {
            Double($0.enrolled) / Double($0.capacity) > Double($1.enrolled) / Double($1.capacity)
        }.prefix(5).map { $0 }
    }

    private var showPerformance: Bool {
        store.term.hasModule(.costumes) || store.term.hasModule(.recitals)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                greeting
                kpis
                if store.outstandingCents > 0 { outstandingAlert }
                todaysClasses
                studioHealth
                RevenueChartView(data: store.revenueSeries)
                    .softCard()
                fullestClasses
                if showPerformance { recitalStrip }
            }
            .padding(20)
        }
        .background(Theme.background)
        .navigationTitle("Dashboard")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var greeting: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Good afternoon, Studio Director")
                .font(.system(size: 14))
                .foregroundStyle(Theme.mutedForeground)
            Text(store.studio.name)
                .font(.display(28, weight: .semibold))
                .foregroundStyle(Theme.foreground)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var kpis: some View {
        let cols = [GridItem(.flexible(), spacing: 14), GridItem(.flexible(), spacing: 14)]
        return LazyVGrid(columns: cols, spacing: 14) {
            StatCard(label: "Active \(store.term.participantPlural.lowercased())", value: "\(store.students.count)", delta: 6, hint: "vs. last month", icon: "person.2.fill", accent: Theme.rose)
            StatCard(label: "Revenue this month", value: Fmt.currency(store.monthRevenueCents, compact: true), delta: 12, hint: "from enrolments", icon: "dollarsign.circle.fill", accent: Theme.gold)
            StatCard(label: "Capacity filled", value: "\(store.capacityPct)%", delta: 4, hint: "\(store.totalEnrolled)/\(store.totalCapacity) seats", icon: "chart.line.uptrend.xyaxis", accent: Theme.teal)
            StatCard(label: "Attendance rate", value: "\(store.avgAttendancePct)%", delta: 2, hint: "of \(store.students.count) \(store.term.participantPlural.lowercased())", icon: "checkmark.seal.fill", accent: Theme.plum)
        }
    }

    private var outstandingAlert: some View {
        let unpaid = store.invoices.filter { $0.status != .paid }
        let overdue = store.invoices.filter { $0.status == .overdue }
        return HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10).fill(Theme.rose.opacity(0.12))
                Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(Theme.rose)
            }
            .frame(width: 38, height: 38)
            VStack(alignment: .leading, spacing: 2) {
                Text("\(Fmt.currency(store.outstandingCents)) outstanding")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Theme.rose)
                Text("\(unpaid.count) invoices · \(overdue.count) overdue")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.mutedForeground)
            }
            Spacer()
        }
        .padding(14)
        .background(Theme.rose.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay { RoundedRectangle(cornerRadius: 16).stroke(Theme.rose.opacity(0.3)) }
    }

    private var todaysClasses: some View {
        SectionCard(title: "Today's \(store.term.classPlural.lowercased())",
                    subtitle: "\(todayDay.fullName) · \(todayClasses.count) scheduled") {
            if todayClasses.isEmpty {
                Text("No \(store.term.classPlural.lowercased()) scheduled today.")
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.mutedForeground)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 18)
            } else {
                VStack(spacing: 10) {
                    ForEach(todayClasses) { c in
                        HStack(alignment: .top, spacing: 10) {
                            Circle().fill(StyleColors.dot(c.style)).frame(width: 9, height: 9).padding(.top, 5)
                            VStack(alignment: .leading, spacing: 4) {
                                Text(c.name).font(.system(size: 14, weight: .semibold))
                                    .foregroundStyle(Theme.foreground)
                                Text("\(Fmt.time12(c.startTime)) · \(store.teacherName(c.teacherId)) · \(c.room)")
                                    .font(.system(size: 12))
                                    .foregroundStyle(Theme.mutedForeground)
                                CapacityBar(enrolled: c.enrolled, capacity: c.capacity)
                            }
                            Spacer()
                        }
                        .padding(12)
                        .background(Theme.secondary.opacity(0.35))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
            }
        }
    }

    private var studioHealth: some View {
        let paidPct = store.invoices.isEmpty ? 100 : Int(Double(store.invoices.filter { $0.status == .paid }.count) / Double(store.invoices.count) * 100)
        return SectionCard(title: "Studio health") {
            VStack(spacing: 16) {
                ProgressRow(label: "Waivers completed", value: store.waiverDonePct, icon: "signature", tone: Theme.teal)
                ProgressRow(label: "Capacity filled", value: store.capacityPct, icon: "chart.line.uptrend.xyaxis", tone: Theme.rose)
                ProgressRow(label: "Tuition collected", value: paidPct, icon: "creditcard", tone: Theme.gold)
            }
        }
    }

    private var fullestClasses: some View {
        SectionCard(title: "Fullest \(store.term.classPlural.lowercased())", subtitle: "\(store.classes.count) active") {
            VStack(spacing: 14) {
                ForEach(topClasses) { c in
                    HStack(spacing: 12) {
                        Circle().fill(StyleColors.dot(c.style)).frame(width: 9, height: 9)
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text(c.name).font(.system(size: 13, weight: .medium))
                                    .foregroundStyle(Theme.foreground)
                                Spacer()
                                Text("\(c.enrolled)/\(c.capacity)")
                                    .font(.system(size: 13, weight: .semibold)).monospacedDigit()
                            }
                            GeometryReader { geo in
                                ZStack(alignment: .leading) {
                                    Capsule().fill(Theme.secondary)
                                    Capsule().fill(StyleColors.dot(c.style))
                                        .frame(width: geo.size.width * min(Double(c.enrolled) / Double(c.capacity), 1))
                                }
                            }
                            .frame(height: 6)
                        }
                    }
                }
            }
        }
    }

    private var recitalStrip: some View {
        let recitalClasses = store.classes.filter { $0.inRecital }
        return HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 12).fill(Theme.plum.opacity(0.15))
                Image(systemName: "calendar.badge.clock").foregroundStyle(Theme.plum)
                    .font(.system(size: 22))
            }
            .frame(width: 48, height: 48)
            VStack(alignment: .leading, spacing: 2) {
                Text("\(store.term.event) season active").font(.display(17))
                    .foregroundStyle(Theme.foreground)
                Text("\(recitalClasses.count) classes performing · \(recitalClasses.reduce(0) { $0 + $1.enrolled }) \(store.term.participantPlural.lowercased())")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.mutedForeground)
            }
            Spacer()
        }
        .padding(18)
        .background(
            LinearGradient(colors: [Theme.plum.opacity(0.1), Theme.rose.opacity(0.1)], startPoint: .leading, endPoint: .trailing)
        )
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .overlay { RoundedRectangle(cornerRadius: 18).stroke(Theme.border.opacity(0.7)) }
    }
}

/// Simple animated bar chart for revenue.
struct RevenueChartView: View {
    let data: [RevenuePoint]
    @State private var appeared = false

    private var maxRevenue: Int { max(data.map { $0.revenueCents }.max() ?? 1, 1) }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Revenue overview").font(.display(18))
                    .foregroundStyle(Theme.foreground)
                Text("Based on active enrolments · Stripe Connect")
                    .font(.system(size: 13)).foregroundStyle(Theme.mutedForeground)
            }
            HStack(alignment: .bottom, spacing: 10) {
                ForEach(data) { p in
                    VStack(spacing: 6) {
                        Text(Fmt.currency(p.revenueCents, compact: true))
                            .font(.system(size: 9, weight: .semibold))
                            .foregroundStyle(Theme.mutedForeground)
                        RoundedRectangle(cornerRadius: 6)
                            .fill(LinearGradient(colors: [Theme.rose, Theme.rose.opacity(0.55)], startPoint: .top, endPoint: .bottom))
                            .frame(height: appeared ? max(8, 120 * CGFloat(p.revenueCents) / CGFloat(maxRevenue)) : 0)
                        Text(p.month).font(.system(size: 11)).foregroundStyle(Theme.mutedForeground)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 160, alignment: .bottom)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .onAppear {
            withAnimation(.spring(response: 0.7, dampingFraction: 0.8)) { appeared = true }
        }
    }
}
