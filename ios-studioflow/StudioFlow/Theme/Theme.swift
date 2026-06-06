import SwiftUI

/// StudioFlow design system — editorial, premium, warm.
/// Cream canvas · deep plum-ink · ballet-rose accent. Colors mirror the web HSL tokens.
extension Color {
    /// Create a Color from HSL values. Hue 0–360, saturation/lightness 0–100.
    init(h: Double, s: Double, l: Double, opacity: Double = 1) {
        let sN = s / 100
        let lN = l / 100
        let c = (1 - abs(2 * lN - 1)) * sN
        let hp = h / 60
        let x = c * (1 - abs(hp.truncatingRemainder(dividingBy: 2) - 1))
        var r = 0.0, g = 0.0, b = 0.0
        switch hp {
        case 0..<1: (r, g, b) = (c, x, 0)
        case 1..<2: (r, g, b) = (x, c, 0)
        case 2..<3: (r, g, b) = (0, c, x)
        case 3..<4: (r, g, b) = (0, x, c)
        case 4..<5: (r, g, b) = (x, 0, c)
        default: (r, g, b) = (c, 0, x)
        }
        let m = lN - c / 2
        self.init(.sRGB, red: r + m, green: g + m, blue: b + m, opacity: opacity)
    }

    /// Parse an HSL string like "350 74% 60%" (the stored brandColor format).
    init(hslString: String, opacity: Double = 1) {
        let parts = hslString.split(separator: " ").map {
            Double($0.replacingOccurrences(of: "%", with: "")) ?? 0
        }
        if parts.count == 3 {
            self.init(h: parts[0], s: parts[1], l: parts[2], opacity: opacity)
        } else {
            self.init(h: 350, s: 74, l: 60, opacity: opacity)
        }
    }
}

enum Theme {
    static let background = Color(h: 36, s: 33, l: 97)
    static let foreground = Color(h: 256, s: 22, l: 14)
    static let card = Color.white
    static let primary = Color(h: 254, s: 26, l: 16)
    static let secondary = Color(h: 30, s: 28, l: 93)
    static let muted = Color(h: 30, s: 24, l: 92)
    static let mutedForeground = Color(h: 256, s: 8, l: 44)

    static let rose = Color(h: 350, s: 74, l: 60)
    static let gold = Color(h: 38, s: 64, l: 54)
    static let plum = Color(h: 268, s: 30, l: 40)
    static let teal = Color(h: 178, s: 42, l: 42)

    static let destructive = Color(h: 4, s: 74, l: 53)
    static let success = Color(h: 152, s: 46, l: 42)
    static let border = Color(h: 32, s: 18, l: 88)

    static let sidebarBg = Color(h: 256, s: 30, l: 11)
    static let sidebarForeground = Color(h: 30, s: 20, l: 82)
    static let sidebarAccent = Color(h: 256, s: 24, l: 18)

    static let amber50 = Color(h: 48, s: 80, l: 96)
    static let amber100 = Color(h: 48, s: 75, l: 90)
    static let amber600 = Color(h: 38, s: 70, l: 48)
}

/// Soft, premium card style matching the web `.shadow-soft` rounded cards.
struct SoftCard: ViewModifier {
    var padding: CGFloat = 20
    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(Theme.card)
            .clipShape(.rect(cornerRadius: 18))
            .overlay {
                RoundedRectangle(cornerRadius: 18)
                    .stroke(Theme.border.opacity(0.7), lineWidth: 1)
            }
            .shadow(color: Color(h: 256, s: 26, l: 11, opacity: 0.08), radius: 14, x: 0, y: 8)
    }
}

extension View {
    func softCard(padding: CGFloat = 20) -> some View {
        modifier(SoftCard(padding: padding))
    }
}

/// Display serif font (Fraunces on web → New York / serif on iOS).
extension Font {
    static func display(_ size: CGFloat, weight: Font.Weight = .semibold) -> Font {
        .system(size: size, weight: weight, design: .serif)
    }
}
