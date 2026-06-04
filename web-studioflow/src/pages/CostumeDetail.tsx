import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  DollarSign,
  ExternalLink,
  FileText,
  Hash,
  Pencil,
  Ruler,
  Shirt,
  Sparkles,
  Store,
  Trash2,
  Truck,
  Users,
} from "lucide-react";
import { useCostumes } from "@/data/store";
import { useEnrichedClasses } from "@/data/store";
import { useStudents } from "@/data/store";
import {
  COSTUME_CATEGORY_LABELS,
  COSTUME_STATUS_LABELS,
} from "@/data/types";
import type { Costume, CostumeCategory } from "@/data/types";
import CostumeForm from "@/components/CostumeForm";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function CostumeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ctx = useCostumes();
  const classes = useEnrichedClasses();
  const { students } = useStudents();

  const costume = ctx.costumes.find((c) => c.id === id);
  const [formOpen, setFormOpen] = useState(false);

  if (!costume) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link to="/costumes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-4 w-4" /> Back to Library
        </Link>
        <div className="rounded-2xl border border-border/70 bg-card p-12 text-center">
          <Shirt className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-semibold">Costume not found</p>
          <p className="mt-1 text-sm text-muted-foreground">The costume you're looking for may have been deleted.</p>
        </div>
      </div>
    );
  }

  const relatedAssignments = ctx.assignments.filter((a) => a.costumeId === costume.id);
  const assignedClasses = relatedAssignments
    .filter((a) => a.classId)
    .map((a) => classes.find((cl) => cl.id === a.classId))
    .filter(Boolean);
  const assignedStudents = relatedAssignments
    .filter((a) => a.studentId)
    .map((a) => students.find((s) => s.id === a.studentId))
    .filter(Boolean);
  const totalAssigned = relatedAssignments.reduce((s, a) => s + a.assignedCount, 0);
  const margin = costume.retailCostCents - costume.wholesaleCostCents - costume.shippingAllocationCents;

  const sizeRecsForCostume = ctx.sizeRecommendations.filter((r) => r.costumeId === costume.id);
  const ordersForCostume = ctx.vendorOrders.filter((o) =>
    o.items.some((item) => item.costumeId === costume.id),
  );
  const alterationsForCostume = ctx.alterations.filter((a) => a.costumeId === costume.id);
  const inventoryItems = ctx.reusableInventory.filter((r) => r.costumeId === costume.id);

  async function handleDelete() {
    if (!confirm(`Delete "${costume!.name}"? This cannot be undone.`)) return;
    toast.promise(ctx.deleteCostume(costume!.id).then(() => navigate("/costumes")), {
      loading: "Deleting…",
      success: `"${costume!.name}" deleted`,
      error: "Failed to delete",
    });
  }

  async function handleDuplicate() {
    toast.promise(ctx.duplicateCostume(costume!.id), {
      loading: "Duplicating…",
      success: `"${costume!.name}" duplicated`,
      error: "Failed to duplicate",
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumb + actions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Link
          to="/costumes"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Costume Library
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button
            onClick={handleDuplicate}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <Copy className="h-4 w-4" /> Duplicate
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 rounded-full border border-rose/30 bg-rose/5 px-4 py-2 text-sm font-medium text-rose transition hover:bg-rose/10"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      {/* Hero: name, category, vendor */}
      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="rounded-full bg-rose/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose">
                {COSTUME_CATEGORY_LABELS[costume.category]}
              </span>
              {costume.status !== "active" && (
                <span className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                  costume.status === "draft" ? "bg-secondary text-muted-foreground" :
                  costume.status === "retired" ? "bg-muted/20 text-muted-foreground" :
                  "bg-gold/10 text-gold",
                )}>
                  {COSTUME_STATUS_LABELS[costume.status]}
                </span>
              )}
              {costume.colour && (
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground">
                  {costume.colour}
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">{costume.name}</h1>
            {costume.description && (
              <p className="mt-2 text-sm text-muted-foreground">{costume.description}</p>
            )}
          </div>
          {/* Images */}
          {costume.images.length > 0 && (
            <div className="flex gap-2 shrink-0">
              {costume.images.slice(0, 3).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`${costume.name} ${i + 1}`}
                  className="h-24 w-24 rounded-xl object-cover border border-border"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Two-column detail grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: pricing + specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pricing card */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
            <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" /> Pricing
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <PricingRow label="Wholesale" value={formatCurrency(costume.wholesaleCostCents)} />
              <PricingRow label="Shipping" value={formatCurrency(costume.shippingAllocationCents)} />
              <PricingRow label="Markup" value={`${costume.markupPct}%`} />
              <PricingRow label="Retail" value={formatCurrency(costume.retailCostCents)} highlight />
              <PricingRow label="Margin" value={formatCurrency(margin)} tone={margin >= 0 ? "text-teal" : "text-rose"} />
              {costume.depositAmountCents > 0 && (
                <PricingRow label="Deposit" value={formatCurrency(costume.depositAmountCents)} />
              )}
            </div>
            {costume.taxable && (
              <p className="mt-3 text-xs text-muted-foreground">Taxable</p>
            )}
          </div>

          {/* Vendor info */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
            <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Store className="h-5 w-5 text-muted-foreground" /> Vendor
            </h3>
            <div className="space-y-3 text-sm">
              {costume.vendor && <InfoRow label="Vendor" value={costume.vendor} />}
              {costume.sku && <InfoRow label="SKU" value={costume.sku} />}
              {costume.style && <InfoRow label="Style" value={costume.style} />}
              {costume.season && <InfoRow label="Season" value={costume.season} />}
              {costume.vendorWebsiteUrl && (
                <div className="flex items-center gap-2">
                  <a
                    href={costume.vendorWebsiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-rose hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Vendor Website
                  </a>
                </div>
              )}
              {costume.productPageUrl && (
                <div className="flex items-center gap-2">
                  <a
                    href={costume.productPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-rose hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Product Page
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Sizing */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
            <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Ruler className="h-5 w-5 text-muted-foreground" /> Sizing
            </h3>
            {costume.sizesAvailable.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {costume.sizesAvailable.map((s) => (
                  <span key={s} className="rounded-full bg-plum/10 px-3 py-1 text-xs font-medium text-plum">
                    {s}
                  </span>
                ))}
              </div>
            )}
            {costume.sizingNotes && (
              <p className="text-sm text-muted-foreground">{costume.sizingNotes}</p>
            )}
            <div className="mt-3 flex items-center gap-3">
              {costume.autoSizingEnabled && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-semibold text-teal">
                  <Sparkles className="h-3 w-3" /> AI Auto-Sizing Enabled
                </span>
              )}
            </div>
            {costume.sizingChartPdfUrl && (
              <a
                href={costume.sizingChartPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-rose hover:underline"
              >
                <FileText className="h-3.5 w-3.5" /> Sizing Chart PDF
              </a>
            )}
            {costume.vendorPdfUrl && (
              <div className="mt-2">
                <a
                  href={costume.vendorPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
                >
                  <FileText className="h-3.5 w-3.5" /> Vendor Order Sheet
                </a>
              </div>
            )}
            {costume.careInstructions && (
              <div className="mt-3 rounded-xl bg-secondary/30 p-3 text-xs text-muted-foreground">
                <span className="font-semibold">Care Instructions: </span>
                {costume.careInstructions}
              </div>
            )}
          </div>

          {/* Orders */}
          {ordersForCostume.length > 0 && (
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
              <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-muted-foreground" /> Related Orders
              </h3>
              {ordersForCostume.map((order) => {
                const item = order.items.find((it) => it.costumeId === costume.id);
                return (
                  <div key={order.id} className="rounded-xl border border-border/60 p-3 mb-2 last:mb-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{order.vendor}</span>
                      <span className="text-xs text-muted-foreground">
                        {item ? `${item.quantity} × ${item.size} @ ${formatCurrency(item.unitCostCents)}` : ""}
                      </span>
                    </div>
                    {order.poNumber && <p className="text-xs text-muted-foreground">PO #{order.poNumber}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right sidebar: assignments + inventory */}
        <div className="space-y-6">
          {/* Assignments */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
            <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" /> Assignments
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {totalAssigned} assigned across {relatedAssignments.length} {relatedAssignments.length === 1 ? "entry" : "entries"}
            </p>
            {assignedClasses.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Classes</p>
                {assignedClasses.map((cls) => (
                  <div key={cls!.id} className="flex items-center gap-2 text-sm">
                    <span className="rounded-full bg-plum/10 px-2 py-0.5 text-xs font-medium text-plum">{cls!.name}</span>
                  </div>
                ))}
              </div>
            )}
            {relatedAssignments.filter((a) => a.routineName).length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Routines</p>
                {relatedAssignments.filter((a) => a.routineName).map((a) => (
                  <div key={a.id} className="text-sm text-muted-foreground">{a.routineName}</div>
                ))}
              </div>
            )}
            {assignedStudents.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Students</p>
                {assignedStudents.map((s) => (
                  <div key={s!.id} className="text-sm">{s!.name}</div>
                ))}
              </div>
            )}
            {relatedAssignments.length === 0 && (
              <p className="text-sm text-muted-foreground italic">Not yet assigned to any class, routine, or student.</p>
            )}
          </div>

          {/* Size recommendations */}
          {sizeRecsForCostume.length > 0 && (
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
              <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-muted-foreground" /> Size Recs
              </h3>
              <div className="space-y-2">
                {sizeRecsForCostume.map((r) => {
                  const s = students.find((st) => st.id === r.studentId);
                  return (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{s?.name ?? "Unknown"}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="font-semibold">{r.recommendedSize ?? "—"}</span>
                        {r.confidencePct != null && (
                          <span className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                            r.confidencePct >= 90 ? "bg-teal/10 text-teal" :
                            r.confidencePct >= 75 ? "bg-gold/10 text-gold" : "bg-rose/10 text-rose",
                          )}>
                            {r.confidencePct}%
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inventory */}
          {(costume.isReusable || inventoryItems.length > 0) && (
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
              <h3 className="font-display text-lg font-semibold mb-4">Inventory</h3>
              {costume.quantityOwned > 0 && (
                <p className="text-sm text-muted-foreground">Quantity Owned: {costume.quantityOwned}</p>
              )}
              {costume.storageLocation && (
                <p className="text-sm text-muted-foreground">Location: {costume.storageLocation}</p>
              )}
              {costume.condition && (
                <p className="text-sm text-muted-foreground">Condition: {costume.condition}</p>
              )}
              {inventoryItems.length > 0 && (
                <div className="mt-3 space-y-2">
                  {inventoryItems.map((r) => (
                    <div key={r.id} className="rounded-lg bg-secondary/30 p-2 text-xs">
                      <span className="font-medium">Size {r.size}</span>
                      <span className="text-muted-foreground"> · {r.status}</span>
                      {r.storageBin && <span className="text-muted-foreground"> · Bin {r.storageBin}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Alterations */}
          {alterationsForCostume.length > 0 && (
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
              <h3 className="font-display text-lg font-semibold mb-4">Alterations</h3>
              {alterationsForCostume.map((a) => {
                const s = students.find((st) => st.id === a.studentId);
                return (
                  <div key={a.id} className="rounded-lg bg-secondary/30 p-2 text-xs mb-1.5">
                    <span className="font-medium">{s?.name ?? "Unknown"}</span>
                    <span className="text-muted-foreground"> · {a.alterationType} · {a.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      <CostumeForm open={formOpen} onClose={() => setFormOpen(false)} edit={costume} />
    </div>
  );
}

/* ── Detail helpers ─────────────────────────────────────────────────── */

function PricingRow({ label, value, highlight, tone }: {
  label: string; value: string; highlight?: boolean; tone?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium", highlight && "font-display font-semibold text-rose", tone)}>
        {value}
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-muted-foreground w-16 shrink-0">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
