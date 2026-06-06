import SwiftUI

struct PaymentsView: View {
    @Environment(AppStore.self) private var store
    @State private var statusFilter: PaymentStatus? = nil

    private var filtered: [Invoice] {
        store.invoices.filter { statusFilter == nil || $0.status == statusFilter }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                kpis
                RevenueChartView(data: store.revenueSeries).softCard()
                filterChips
                SectionCard(title: "Invoices", subtitle: "\(filtered.count) shown") {
                    VStack(spacing: 10) {
                        ForEach(filtered) { inv in InvoiceRow(invoice: inv) }
                        if filtered.isEmpty {
                            Text("No invoices.").font(.system(size: 13))
                                .foregroundStyle(Theme.mutedForeground)
                                .frame(maxWidth: .infinity).padding(.vertical, 20)
                        }
                    }
                }
            }
            .padding(20)
        }
        .background(Theme.background)
        .navigationTitle("Payments")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var kpis: some View {
        let cols = [GridItem(.flexible(), spacing: 14), GridItem(.flexible(), spacing: 14)]
        return LazyVGrid(columns: cols, spacing: 14) {
            StatCard(label: "Revenue this month", value: Fmt.currency(store.monthRevenueCents, compact: true), hint: "from enrolments", icon: "dollarsign.circle.fill", accent: Theme.gold)
            StatCard(label: "Outstanding", value: Fmt.currency(store.outstandingCents, compact: true), hint: "\(store.invoices.filter { $0.status != .paid }.count) invoices", icon: "exclamationmark.circle.fill", accent: Theme.rose)
        }
    }

    private var filterChips: some View {
        HStack(spacing: 8) {
            chip("All", nil)
            chip("Due", .due)
            chip("Overdue", .overdue)
        }
    }

    private func chip(_ label: String, _ status: PaymentStatus?) -> some View {
        Button { statusFilter = status } label: {
            Text(label).font(.system(size: 13, weight: .semibold))
                .padding(.horizontal, 14).padding(.vertical, 8)
                .background(statusFilter == status ? store.accentColor : Theme.card)
                .foregroundStyle(statusFilter == status ? .white : Theme.foreground)
                .clipShape(Capsule())
                .overlay { Capsule().stroke(Theme.border, lineWidth: statusFilter == status ? 0 : 1) }
        }
        .buttonStyle(.plain)
    }
}

struct InvoiceRow: View {
    let invoice: Invoice
    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text(invoice.studentName).font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Theme.foreground)
                Text(invoice.description).font(.system(size: 12))
                    .foregroundStyle(Theme.mutedForeground)
                Text("Due \(invoice.dueDate.formatted(date: .abbreviated, time: .omitted))")
                    .font(.system(size: 11)).foregroundStyle(Theme.mutedForeground)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                Text(Fmt.currency(invoice.amountCents))
                    .font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.foreground)
                StatusBadge(text: invoice.status.label, color: paymentColor(invoice.status))
            }
        }
        .padding(12)
        .background(Theme.secondary.opacity(0.3))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
