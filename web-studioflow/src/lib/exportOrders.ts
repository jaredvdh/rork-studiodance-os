/**
 * Vendor Ordering Centre — bulk PO generation, export, and auto-numbering utilities.
 */

import type { VendorOrder, VendorOrderItem, Costume } from "@/data/types";

/**
 * Generate a purchase order number (e.g. PO-2026-0001).
 */
export function generatePoNumber(existingPOs: VendorOrder[]): string {
  const year = new Date().getFullYear();
  const last = existingPOs
    .filter((o) => o.poNumber?.startsWith(`PO-${year}-`))
    .map((o) => parseInt(o.poNumber!.split("-")[2], 10))
    .filter((n) => !isNaN(n));
  const next = last.length > 0 ? Math.max(...last) + 1 : 1;
  return `PO-${year}-${String(next).padStart(4, "0")}`;
}

/**
 * Group assignments by vendor+size for bulk ordering.
 */
export interface VendorGroup {
  vendor: string;
  costumes: {
    costume: Costume;
    sizes: { size: string; quantity: number; unitCostCents: number }[];
  }[];
}

export function groupByVendor(
  costumes: Costume[],
  sizeMap: Map<string, string[]>, // costumeId → sizes needed
): VendorGroup[] {
  const groups = new Map<string, VendorGroup>();

  for (const c of costumes) {
    const vendor = c.vendor || "Unknown Vendor";
    if (!groups.has(vendor)) {
      groups.set(vendor, { vendor, costumes: [] });
    }
    const group = groups.get(vendor)!;
    const sizes = sizeMap.get(c.id) ?? [];
    if (sizes.length === 0) continue;
    const sizeCounts = new Map<string, number>();
    for (const s of sizes) sizeCounts.set(s, (sizeCounts.get(s) ?? 0) + 1);
    group.costumes.push({
      costume: c,
      sizes: Array.from(sizeCounts.entries()).map(([size, quantity]) => ({
        size,
        quantity,
        unitCostCents: c.wholesaleCostCents,
      })),
    });
  }

  return Array.from(groups.values()).filter((g) => g.costumes.length > 0);
}

/**
 * Export a vendor order as CSV.
 */
export function exportOrderToCsv(order: VendorOrder, costumes: Costume[]): void {
  const headers = ["Costume", "SKU", "Size", "Quantity", "Unit Cost", "Total"];
  const rows = order.items.map((item) => {
    const costume = costumes.find((c) => c.id === item.costumeId);
    return [
      costume?.name ?? "Unknown",
      costume?.sku ?? "",
      item.size,
      String(item.quantity),
      `$${(item.unitCostCents / 100).toFixed(2)}`,
      `$${((item.quantity * item.unitCostCents) / 100).toFixed(2)}`,
    ];
  });

  const totalsRow = [
    "TOTAL", "", "",
    String(order.items.reduce((s, i) => s + i.quantity, 0)),
    "",
    `$${((order.items.reduce((s, i) => s + i.quantity * i.unitCostCents, 0) + order.shippingCostCents) / 100).toFixed(2)}`,
  ];

  const csv = [headers, ...rows, totalsRow]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${order.poNumber ?? "order"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export a vendor order as a printable PDF (HTML-based).
 */
export function exportOrderToPdf(order: VendorOrder, costumes: Costume[], studioName: string): void {
  const items = order.items.map((item) => {
    const costume = costumes.find((c) => c.id === item.costumeId);
    return {
      name: costume?.name ?? "Unknown",
      sku: costume?.sku ?? "",
      size: item.size,
      quantity: item.quantity,
      unitCost: (item.unitCostCents / 100).toFixed(2),
      total: ((item.quantity * item.unitCostCents) / 100).toFixed(2),
    };
  });

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + Number(i.total), 0);
  const shipping = (order.shippingCostCents / 100).toFixed(2);
  const grandTotal = (subtotal + Number(shipping)).toFixed(2);

  const rowsHtml = items.map((i) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #ece5e0;">${i.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #ece5e0;">${i.sku}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #ece5e0;text-align:center;">${i.size}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #ece5e0;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #ece5e0;text-align:right;">$${i.unitCost}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #ece5e0;text-align:right;">$${i.total}</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${order.poNumber ?? "Purchase Order"}</title>
<style>body{font-family:Georgia,serif;color:#1a1423;margin:40px;}
h1{font-size:18pt;margin-bottom:4pt;}
table{width:100%;border-collapse:collapse;margin-top:16pt;}
th{text-align:left;padding:8px 12px;background:#f7f5f3;border-bottom:2px solid #d4c5c0;font-size:9pt;text-transform:uppercase;letter-spacing:0.5pt;color:#6b5e68;}
.totals{margin-top:16pt;text-align:right;}
.totals td{padding:4px 12px;font-size:10pt;}
.grand{font-size:12pt;font-weight:700;border-top:2px solid #1a1423;padding-top:8pt;}
</style></head><body>
<h1>${studioName} — Purchase Order</h1>
<p style="color:#6b5e68;margin-top:0;">${order.poNumber ?? "PO"} · Vendor: ${order.vendor} · Date: ${order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "—"}</p>
<table><thead><tr><th>Costume</th><th>SKU</th><th>Size</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead><tbody>${rowsHtml}</tbody></table>
<table class="totals"><tr><td>Subtotal (${totalItems} items):</td><td style="padding-left:24pt;">$${subtotal.toFixed(2)}</td></tr><tr><td>Shipping:</td><td style="padding-left:24pt;">$${shipping}</td></tr><tr class="grand"><td>Grand Total:</td><td style="padding-left:24pt;">$${grandTotal}</td></tr></table>
${order.vendorNotes ? `<p style="margin-top:24pt;font-size:9pt;color:#6b5e68;">Notes: ${order.vendorNotes}</p>` : ""}
<p style="margin-top:32pt;font-size:8pt;color:#b5a39c;text-align:center;">Generated by StudioFlow · ${new Date().toLocaleDateString()}</p>
</body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => win.print();
  }
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
