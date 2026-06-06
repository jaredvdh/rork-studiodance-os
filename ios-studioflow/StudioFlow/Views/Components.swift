import SwiftUI

/// KPI stat card mirroring the web StatCard.
struct StatCard: View {
    let label: String
    let value: String
    var delta: Int? = nil
    var hint: String
    let icon: String
    let accent: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(accent.opacity(0.12))
                    Image(systemName: icon)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(accent)
                }
                .frame(width: 40, height: 40)
                Spacer()
                if let delta {
                    HStack(spacing: 2) {
                        Image(systemName: delta >= 0 ? "arrow.up.right" : "arrow.down.right")
                            .font(.system(size: 10, weight: .bold))
                        Text("\(abs(delta))%")
                            .font(.system(size: 12, weight: .semibold))
                    }
                    .foregroundStyle(delta >= 0 ? Theme.success : Theme.destructive)
                }
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(value)
                    .font(.display(26, weight: .semibold))
                    .foregroundStyle(Theme.foreground)
                Text(label)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Theme.foreground.opacity(0.7))
                Text(hint)
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.mutedForeground)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .softCard()
    }
}

/// Labeled progress bar used in Studio Health.
struct ProgressRow: View {
    let label: String
    let value: Int
    let icon: String
    let tone: Color

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Label {
                    Text(label).font(.system(size: 13))
                } icon: {
                    Image(systemName: icon).font(.system(size: 12))
                        .foregroundStyle(Theme.mutedForeground)
                }
                .foregroundStyle(Theme.foreground.opacity(0.8))
                Spacer()
                Text("\(value)%")
                    .font(.system(size: 13, weight: .semibold))
                    .monospacedDigit()
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Theme.secondary)
                    Capsule().fill(tone)
                        .frame(width: geo.size.width * CGFloat(min(value, 100)) / 100)
                }
            }
            .frame(height: 8)
        }
    }
}

/// Small colored pill / chip.
struct Chip: View {
    let text: String
    var color: Color = Theme.plum
    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .semibold))
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(color.opacity(0.12))
            .foregroundStyle(color)
            .clipShape(Capsule())
    }
}

/// Section header with title and optional trailing action.
struct SectionCard<Content: View>: View {
    let title: String
    var subtitle: String? = nil
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.display(18))
                    .foregroundStyle(Theme.foreground)
                if let subtitle {
                    Text(subtitle).font(.system(size: 13))
                        .foregroundStyle(Theme.mutedForeground)
                }
            }
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .softCard()
    }
}

/// Capacity fill bar with count.
struct CapacityBar: View {
    let enrolled: Int
    let capacity: Int
    var color: Color = Theme.teal
    var body: some View {
        let pct = capacity == 0 ? 0 : Double(enrolled) / Double(capacity)
        let full = enrolled >= capacity
        HStack(spacing: 8) {
            Text("\(enrolled)/\(capacity)")
                .font(.system(size: 12, weight: .medium))
                .monospacedDigit()
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Theme.secondary)
                    Capsule().fill(full ? Theme.rose : color)
                        .frame(width: geo.size.width * min(pct, 1))
                }
            }
            .frame(height: 6)
            if full {
                Text("Full").font(.system(size: 10, weight: .bold)).foregroundStyle(Theme.rose)
            }
        }
    }
}

/// Avatar circle with initials.
struct InitialsAvatar: View {
    let name: String
    var size: CGFloat = 38
    var bg: Color = Theme.rose
    var body: some View {
        Text(Fmt.initials(name))
            .font(.system(size: size * 0.34, weight: .semibold))
            .foregroundStyle(bg)
            .frame(width: size, height: size)
            .background(bg.opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: size * 0.28))
    }
}

/// Status badge for waiver / payment.
struct StatusBadge: View {
    let text: String
    let color: Color
    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .semibold))
            .padding(.horizontal, 9)
            .padding(.vertical, 3)
            .background(color.opacity(0.14))
            .foregroundStyle(color)
            .clipShape(Capsule())
    }
}

func waiverColor(_ s: WaiverStatus) -> Color {
    switch s {
    case .signed: Theme.success
    case .pending: Theme.gold
    case .missing: Theme.destructive
    }
}

func paymentColor(_ s: PaymentStatus) -> Color {
    switch s {
    case .paid: Theme.success
    case .due: Theme.gold
    case .overdue: Theme.destructive
    }
}
