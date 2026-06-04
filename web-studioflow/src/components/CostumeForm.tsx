import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ImagePlus, Upload, X, Link as LinkIcon, Save, Loader2,
} from "lucide-react";
import { useCostumes } from "@/data/store";
import { useEnrichedClasses } from "@/data/store";
import { useStudents } from "@/data/store";
import {
  COSTUME_CATEGORY_LABELS,
  COSTUME_STATUS_LABELS,
} from "@/data/types";
import type {
  Costume,
  CostumeCategory,
  CostumeStatus,
  CostumeAssignment,
} from "@/data/types";
import Modal from "./Modal";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  edit?: Costume | null;
}

export default function CostumeForm({ open, onClose, edit }: Props) {
  const ctx = useCostumes();
  const classes = useEnrichedClasses();
  const { students } = useStudents();
  const isEdit = !!edit;
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [vendor, setVendor] = useState("");
  const [vendorWebsiteUrl, setVendorWebsiteUrl] = useState("");
  const [productPageUrl, setProductPageUrl] = useState("");
  const [style, setStyle] = useState("");
  const [season, setSeason] = useState("");
  const [category, setCategory] = useState<CostumeCategory>("other");
  const [colour, setColour] = useState("");
  const [description, setDescription] = useState("");
  const [wholesaleCostCents, setWholesaleCostCents] = useState(0);
  const [shippingAllocationCents, setShippingAllocationCents] = useState(0);
  const [markupPct, setMarkupPct] = useState(30);
  const [taxable, setTaxable] = useState(false);
  const [depositAmountCents, setDepositAmountCents] = useState(0);
  const [sizesAvailable, setSizesAvailable] = useState("");
  const [sizingNotes, setSizingNotes] = useState("");
  const [autoSizingEnabled, setAutoSizingEnabled] = useState(false);
  const [careInstructions, setCareInstructions] = useState("");
  const [vendorPdfUrl, setVendorPdfUrl] = useState("");
  const [sizingChartPdfUrl, setSizingChartPdfUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [isReusable, setIsReusable] = useState(false);
  const [quantityOwned, setQuantityOwned] = useState(0);
  const [storageLocation, setStorageLocation] = useState("");
  const [condition, setCondition] = useState("");
  const [status, setStatus] = useState<CostumeStatus>("active");

  // Assignments: simple class/routine/student picker
  const [assignToClassId, setAssignToClassId] = useState("");
  const [routineName, setRoutineName] = useState("");
  const [assignToStudentId, setAssignToStudentId] = useState("");

  useEffect(() => {
    if (edit) {
      setName(edit.name ?? "");
      setSku(edit.sku ?? "");
      setVendor(edit.vendor ?? "");
      setVendorWebsiteUrl(edit.vendorWebsiteUrl ?? "");
      setProductPageUrl(edit.productPageUrl ?? "");
      setStyle(edit.style ?? "");
      setSeason(edit.season ?? "");
      setCategory(edit.category ?? "other");
      setColour(edit.colour ?? "");
      setDescription(edit.description ?? "");
      setWholesaleCostCents(edit.wholesaleCostCents ?? 0);
      setShippingAllocationCents(edit.shippingAllocationCents ?? 0);
      setMarkupPct(edit.markupPct ?? 30);
      setTaxable(edit.taxable ?? false);
      setDepositAmountCents(edit.depositAmountCents ?? 0);
      setSizesAvailable(edit.sizesAvailable?.join(", ") ?? "");
      setSizingNotes(edit.sizingNotes ?? "");
      setAutoSizingEnabled(edit.autoSizingEnabled ?? false);
      setCareInstructions(edit.careInstructions ?? "");
      setVendorPdfUrl(edit.vendorPdfUrl ?? "");
      setSizingChartPdfUrl(edit.sizingChartPdfUrl ?? "");
      setImages(edit.images ?? []);
      setIsReusable(edit.isReusable ?? false);
      setQuantityOwned(edit.quantityOwned ?? 0);
      setStorageLocation(edit.storageLocation ?? "");
      setCondition(edit.condition ?? "");
      setStatus(edit.status ?? "active");
    } else {
      resetForm();
    }
  }, [edit, open]);

  function resetForm() {
    setName(""); setSku(""); setVendor(""); setVendorWebsiteUrl(""); setProductPageUrl("");
    setStyle(""); setSeason(""); setCategory("other"); setColour(""); setDescription("");
    setWholesaleCostCents(0); setShippingAllocationCents(0); setMarkupPct(30);
    setTaxable(false); setDepositAmountCents(0); setSizesAvailable(""); setSizingNotes("");
    setAutoSizingEnabled(false); setCareInstructions(""); setVendorPdfUrl("");
    setSizingChartPdfUrl(""); setImages([]); setImageUrl("");
    setIsReusable(false); setQuantityOwned(0); setStorageLocation(""); setCondition("");
    setStatus("active");
    setAssignToClassId(""); setRoutineName(""); setAssignToStudentId("");
  }

  function addImageUrl() {
    const trimmed = imageUrl.trim();
    if (!trimmed) return;
    if (!/^https?:\/\/.+/.test(trimmed)) {
      toast.error("Please enter a valid image URL (starting with https://)");
      return;
    }
    setImages((p) => [...p, trimmed]);
    setImageUrl("");
  }

  function removeImage(idx: number) {
    setImages((p) => p.filter((_, i) => i !== idx));
  }

  const retailCostCents = Math.round((wholesaleCostCents + shippingAllocationCents) * (1 + markupPct / 100));
  const marginCents = retailCostCents - wholesaleCostCents - shippingAllocationCents;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Costume name is required"); return; }
    setSaving(true);
    try {
      const sizesList = sizesAvailable.split(",").map((s) => s.trim()).filter(Boolean);
      const payload = {
        name: name.trim(),
        sku: sku.trim() || undefined,
        vendor: vendor.trim() || undefined,
        vendorWebsiteUrl: vendorWebsiteUrl.trim() || undefined,
        productPageUrl: productPageUrl.trim() || undefined,
        style: style.trim() || undefined,
        season: season.trim() || undefined,
        category,
        colour: colour.trim() || undefined,
        description: description.trim() || undefined,
        images,
        vendorPdfUrl: vendorPdfUrl.trim() || undefined,
        sizingChartPdfUrl: sizingChartPdfUrl.trim() || undefined,
        careInstructions: careInstructions.trim() || undefined,
        wholesaleCostCents,
        shippingAllocationCents,
        markupPct,
        taxable,
        depositAmountCents,
        sizesAvailable: sizesList,
        sizingNotes: sizingNotes.trim() || undefined,
        autoSizingEnabled,
        isReusable,
        quantityOwned,
        storageLocation: storageLocation.trim() || undefined,
        condition: condition.trim() || undefined,
        status,
      };

      if (isEdit && edit) {
        await ctx.updateCostume(edit.id, payload);
        toast.success("Costume updated successfully");
      } else {
        await ctx.addCostume(payload);
        toast.success("Costume added successfully");
      }

      // Handle assignment for new costumes — create assignment if class/student selected
      // (Assignment is a separate record, created independently via the Assignments workflow)
      resetForm();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save costume");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Costume" : "Add Costume"}
      description={isEdit ? `Editing "${edit?.name}"` : "Add a new costume to your library"}
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="costume-form"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-rose px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose/90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? "Save Changes" : "Add Costume"}
          </button>
        </div>
      }
    >
      <form id="costume-form" onSubmit={handleSubmit} className="space-y-6 text-sm">
        {/* Basic Details */}
        <section>
          <h4 className="font-display font-semibold text-base mb-4">Basic Details</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Costume Name *" value={name} onChange={setName} placeholder="e.g. Pink Sequin Tutu" />
            <Field label="SKU / Item #" value={sku} onChange={setSku} placeholder="COS-001" />
            <Field label="Vendor" value={vendor} onChange={setVendor} placeholder="Dancewear Co." />
            <Field label="Style" value={style} onChange={setStyle} placeholder="e.g. Tutu dress" />
            <Field label="Vendor Website" value={vendorWebsiteUrl} onChange={setVendorWebsiteUrl} placeholder="https://vendor.com" />
            <Field label="Product Page URL" value={productPageUrl} onChange={setProductPageUrl} placeholder="https://vendor.com/item" />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CostumeCategory)}
                className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-rose/50"
              >
                {(Object.keys(COSTUME_CATEGORY_LABELS) as CostumeCategory[]).map((k) => (
                  <option key={k} value={k}>{COSTUME_CATEGORY_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <Field label="Colour" value={colour} onChange={setColour} placeholder="e.g. Blush Pink" />
            <Field label="Season" value={season} onChange={setSeason} placeholder="e.g. Spring 2026" />
          </div>
          <div className="mt-3">
            <label className="text-xs font-semibold text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the costume including fabric, accessories, and any special features…"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-rose/50 resize-none"
            />
          </div>
        </section>

        {/* Pricing */}
        <section>
          <h4 className="font-display font-semibold text-base mb-4">Pricing</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldCurrency label="Wholesale Cost" value={wholesaleCostCents} onChange={setWholesaleCostCents} />
            <FieldCurrency label="Shipping Allocation" value={shippingAllocationCents} onChange={setShippingAllocationCents} />
            <Field label="Markup %" value={String(markupPct)} onChange={(v) => setMarkupPct(Number(v) || 0)} placeholder="30" type="number" />
            <FieldCurrency label="Deposit Amount" value={depositAmountCents} onChange={setDepositAmountCents} />
          </div>
          <div className="mt-3 rounded-xl bg-secondary/30 p-3 flex flex-wrap items-center gap-4 text-xs">
            <span className="text-muted-foreground">
              Retail: <span className="font-display font-semibold text-rose">${(retailCostCents / 100).toFixed(2)}</span>
            </span>
            <span className={cn("font-medium", marginCents >= 0 ? "text-teal" : "text-rose")}>
              Margin: ${(marginCents / 100).toFixed(2)}
            </span>
            <label className="flex items-center gap-2 ml-auto">
              <input type="checkbox" checked={taxable} onChange={(e) => setTaxable(e.target.checked)} className="rounded accent-rose" />
              <span className="text-muted-foreground">Taxable</span>
            </label>
          </div>
        </section>

        {/* Images */}
        <section>
          <h4 className="font-display font-semibold text-base mb-3">Images</h4>
          <div className="flex items-center gap-2">
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Paste image URL…"
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-rose/50"
            />
            <button
              type="button"
              onClick={addImageUrl}
              className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-muted-foreground transition hover:bg-rose/10 hover:text-rose"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
          </div>
          {images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {images.map((url, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border border-border">
                  <img src={url} alt={`Costume ${i + 1}`} className="h-20 w-20 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 grid h-5 w-5 place-items-center rounded-full bg-rose/80 text-white opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <ImagePlus className="h-3 w-3" /> Enter image URLs. Upload support coming in a future update.
          </p>
        </section>

        {/* Sizing */}
        <section>
          <h4 className="font-display font-semibold text-base mb-4">Sizing</h4>
          <Field
            label="Available Sizes"
            value={sizesAvailable}
            onChange={setSizesAvailable}
            placeholder="Child Small, Child Medium, Child Large"
          />
          <p className="mt-1 text-xs text-muted-foreground">Comma-separated list of sizes</p>
          <div className="mt-3">
            <label className="text-xs font-semibold text-muted-foreground">Sizing Notes</label>
            <textarea
              value={sizingNotes}
              onChange={(e) => setSizingNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Runs small, size up for dancers with longer torsos…"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-rose/50 resize-none"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={autoSizingEnabled} onChange={(e) => setAutoSizingEnabled(e.target.checked)} className="rounded accent-rose" />
              <span className="text-muted-foreground">Enable AI Auto-Sizing</span>
            </label>
          </div>
        </section>

        {/* Documents */}
        <section>
          <h4 className="font-display font-semibold text-base mb-4">Documents (URLs)</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Sizing Chart PDF URL" value={sizingChartPdfUrl} onChange={setSizingChartPdfUrl} placeholder="https://vendor.com/sizing.pdf" />
            <Field label="Vendor PDF URL" value={vendorPdfUrl} onChange={setVendorPdfUrl} placeholder="https://vendor.com/invoice.pdf" />
          </div>
          <div className="mt-3">
            <label className="text-xs font-semibold text-muted-foreground">Care Instructions</label>
            <textarea
              value={careInstructions}
              onChange={(e) => setCareInstructions(e.target.value)}
              rows={2}
              placeholder="e.g. Hand wash cold, hang dry, do not bleach…"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-rose/50 resize-none"
            />
          </div>
        </section>

        {/* Assignment (simple picker) */}
        <section>
          <h4 className="font-display font-semibold text-base mb-4">Assignment</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Assign to Class</label>
              <select
                value={assignToClassId}
                onChange={(e) => setAssignToClassId(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-rose/50"
              >
                <option value="">None</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <Field label="Routine Name" value={routineName} onChange={setRoutineName} placeholder="e.g. Act I — Shake It Off" />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Assign to Student</label>
              <select
                value={assignToStudentId}
                onChange={(e) => setAssignToStudentId(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-rose/50"
              >
                <option value="">None</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Inventory */}
        <section>
          <h4 className="font-display font-semibold text-base mb-4">Inventory & Status</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CostumeStatus)}
                className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-rose/50"
              >
                {(Object.keys(COSTUME_STATUS_LABELS) as CostumeStatus[]).map((k) => (
                  <option key={k} value={k}>{COSTUME_STATUS_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <Field label="Quantity Owned" value={String(quantityOwned)} onChange={(v) => setQuantityOwned(Number(v) || 0)} placeholder="0" type="number" />
            <Field label="Storage Location" value={storageLocation} onChange={setStorageLocation} placeholder="e.g. Bin 3, Rack A" />
            <Field label="Condition" value={condition} onChange={setCondition} placeholder="e.g. Like New" />
          </div>
          <div className="mt-3">
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={isReusable} onChange={(e) => setIsReusable(e.target.checked)} className="rounded accent-rose" />
              <span className="text-muted-foreground">Reusable costume (track in inventory)</span>
            </label>
          </div>
        </section>
      </form>
    </Modal>
  );
}

/* ── Field helpers ────────────────────────────────────────── */

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-rose/50"
      />
    </div>
  );
}

function FieldCurrency({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground">{label} ($)</label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value === 0 ? "" : (value / 100).toString()}
        onChange={(e) => onChange(Math.round(Number(e.target.value || "0") * 100))}
        placeholder="0.00"
        className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-rose/50"
      />
    </div>
  );
}
