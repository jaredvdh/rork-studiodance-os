import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Download,
  FileDown,
  FileSpreadsheet,
  FileText,
  Plus,
  Printer,
  Truck,
} from "lucide-react";
import type { Costume, VendorOrder, SizeRecommendation } from "@/data/types";
import { generatePoNumber, groupByVendor, exportOrderToCsv, exportOrderToPdf } from "@/lib/exportOrders";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface VendorOrderingCentreProps {
  costumes: Costume[];
  existingOrders: VendorOrder[];
  recommendations: SizeRecommendation[];
  onAddOrder: (order: Omit<VendorOrder, "id" | "studioId" | "createdAt" | "updatedAt">) => Promise<void>;
  studioName: string;
}

export default function VendorOrderingCentre({
  costumes,
  existingOrders,
  recommendations,
  onAddOrder,
  studioName,
}: VendorOrderingCentreProps) {
  const [creating, setCreating] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string>("");

  // Group recommendations by costume+size for ordering
  const orderSummary = useMemo(() => {
    // For each costume, count how many of each size are recommended
    const sizeMap = new Map<string, Map<string, number>>(); // costumeId → size → count
    for (const rec of recommendations) {
      if (!rec.recommendedSize) continue;
      const sizes = sizeMap.get(rec.costumeId) ?? new Map();
      sizes.set(rec.recommendedSize, (sizes.get(rec.recommendedSize) ?? 0) + 1);
      sizeMap.set(rec.costumeId, sizes);
    }
    return sizeMap;
  }, [recommendations]);

  // Group by vendor
  const vendorGroups = useMemo(() => {
    const grouped = new Map<string, { costume: Costume; sizes: { size: string; quantity: number; unitCostCents: number }[] }[]>();

    for (const costume of costumes) {
      if (!costume.vendor) continue;
      const sizes = orderSummary.get(costume.id);
      if (!sizes || sizes.size === 0) continue;

      const entries = grouped.get(costume.vendor) ?? [];
      entries.push({
        costume,
        sizes: Array.from(sizes.entries()).map(([size, qty]) => ({
          size,
          quantity: qty,
          unitCostCents: costume.wholesaleCostCents,
        })),
      });
      grouped.set(costume.vendor, entries);
    }

    return Array.from(grouped.entries())
      .map(([vendor, items]) => ({ vendor, items }))
      .sort((a, b) => a.vendor.localeCompare(b.vendor));
  }, [costumes, orderSummary]);

  const handleCreateOrder = useCallback(async (vendor: string) => {
    const group = vendorGroups.find((g) => g.vendor === vendor);
    if (!group) return;

    setCreating(true);
    try {
      const poNumber = generatePoNumber(existingOrders);
      const items = group.items.flatMap((item) =>
        item.sizes.map((s) => ({
          id: `voi_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          vendorOrderId: "",
          costumeId: item.costume.id,
          size: s.size,
          quantity: s.quantity,
          unitCostCents: s.unitCostCents,
          createdAt: new Date().toISOString(),
        })),
      );

      const totalShipping = group.items.reduce((sum, item) => sum + item.costume.shippingAllocationCents * item.sizes.reduce((s, sz) => s + sz.quantity, 0), 0);

      await onAddOrder({
        vendor,
        poNumber,
        orderDate: new Date().toISOString(),
        status: "draft",
        shippingCostCents: totalShipping,
        items,
      });

      toast.success(`PO ${poNumber} created for ${vendor}`);
    } catch {
      toast.error("Failed to create purchase order");
    } finally {
      setCreating(false);
    }
  }, [vendorGroups, existingOrders, onAddOrder]);

  const handleExportOrder = useCallback((order: VendorOrder, format: "csv" | "pdf") => {
    if (format === "csv") {
      exportOrderToCsv(order, costumes);
    } else {
      exportOrderToPdf(order, costumes, studioName);
    }
    toast.success(`PO ${order.poNumber} exported as ${format.toUpperCase()}`);
  }, [costumes, studioName]);

  // Existing orders display
  const existingByVendor = useMemo(() => {
    const map = new Map<string, VendorOrder[]>();
    for (const o of existingOrders) {
      const list = map.get(o.vendor) ?? [];
      list.push(o);
      map.set(o.vendor, list);
    }
    return map;
  }, [existingOrders]);

  return (
    <div className="space-y-8">
      {/* Generate new POs section */}
      <div>
        <h3 className="font-display text-lg font-semibold mb-4">Generate Purchase Orders</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Orders are generated from approved size recommendations, grouped by vendor.
        </p>

        {vendorGroups.length === 0 ? (
          <div className="rounded-2xl border border-border/70 bg-card p-8 text-center">
            <Truck className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-semibold">Nothing to order yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Approve size recommendations for students to populate ordering data.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {vendorGroups.map((group) => {
              const totalQty = group.items.reduce((s, item) => s + item.sizes.reduce((ss, sz) => ss + sz.quantity, 0), 0);
              const totalCost = group.items.reduce((s, item) =>
                s + item.sizes.reduce((ss, sz) => ss + sz.quantity * sz.unitCostCents, 0), 0
              );
              const totalShipping = group.items.reduce((s, item) =>
                s + item.costume.shippingAllocationCents * item.sizes.reduce((ss, sz) => ss + sz.quantity, 0), 0
              );
              const hasExistingOrder = existingByVendor.has(group.vendor);

              return (
                <div key={group.vendor} className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-display text-base font-semibold flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {group.vendor}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {group.items.length} costume{group.items.length !== 1 ? "s" : ""} · {totalQty} total units · {formatCurrency(totalCost + totalShipping)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCreateOrder(group.vendor)}
                      disabled={creating}
                      className="inline-flex items-center gap-2 rounded-full bg-rose px-4 py-2.5 text-sm font-semibold text-white shadow-lift transition hover:opacity-90 disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      Create PO
                    </button>
                  </div>

                  {/* Line items preview */}
                  <div className="overflow-x-auto rounded-xl border border-border/60">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-secondary/40">
                          <th className="py-2 px-3 text-left font-semibold">Costume</th>
                          <th className="py-2 px-2 text-center font-semibold">Size</th>
                          <th className="py-2 px-2 text-center font-semibold">Qty</th>
                          <th className="py-2 px-2 text-right font-semibold">Unit</th>
                          <th className="py-2 px-2 text-right font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((item) =>
                          item.sizes.map((sz) => (
                            <tr key={`${item.costume.id}-${sz.size}`} className="border-t border-border/40">
                              <td className="py-2 px-3 font-medium">{item.costume.name}</td>
                              <td className="py-2 px-2 text-center">{sz.size}</td>
                              <td className="py-2 px-2 text-center">{sz.quantity}</td>
                              <td className="py-2 px-2 text-right text-muted-foreground">{formatCurrency(sz.unitCostCents)}</td>
                              <td className="py-2 px-2 text-right font-medium">{formatCurrency(sz.quantity * sz.unitCostCents)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Existing POs section */}
      {existingOrders.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-semibold mb-4">Existing Purchase Orders</h3>
          <div className="space-y-3">
            {existingOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4">
                <div>
                  <p className="text-sm font-semibold">
                    {order.poNumber} — {order.vendor}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.items.length} line items · {order.items.reduce((s, i) => s + i.quantity, 0)} units · Created {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportOrder(order, "csv")}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-secondary"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 inline mr-1" />
                    CSV
                  </button>
                  <button
                    onClick={() => handleExportOrder(order, "pdf")}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-secondary"
                  >
                    <Printer className="h-3.5 w-3.5 inline mr-1" />
                    PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
