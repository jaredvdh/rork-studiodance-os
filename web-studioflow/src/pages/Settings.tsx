import { useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Camera,
  Check,
  CheckCircle,
  CreditCard,
  ExternalLink,
  Globe,
  Image,
  Link2,
  Loader2,
  Palette,
  Pencil,
  RefreshCw,
  Save,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useStudio } from "@/data/store";
import { useAuth } from "@/hooks/useAuth";
import { deleteTestStudio } from "@/lib/testStudio";
import { FlaskConical } from "lucide-react";
import type { Vertical } from "@/data/types";
import { ALL_VERTICALS, VERTICAL_LABELS, getTerminology, MODULE_LABELS, type ModuleKey } from "@/data/terminology";
import { cn } from "@/lib/utils";
import { getStripeConnectState, startStripeConnect } from "@/lib/stripe";
import { uploadStudioLogo, removeStudioLogo, uploadFile, STORAGE_BUCKETS, deleteFile } from "@/lib/storage";
import {
  ALL_COUNTRIES,
  CURRENCY_CONFIGS,
  countryLabel,
  getCountryConfig,
} from "@/lib/locale";

function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3);
}

const BRAND_COLORS = [
  { label: "Ballet rose", value: "350 74% 60%", swatch: "hsl(350 74% 60%)" },
  { label: "Plum", value: "268 30% 40%", swatch: "hsl(268 30% 40%)" },
  { label: "Indigo", value: "245 48% 48%", swatch: "hsl(245 48% 48%)" },
  { label: "Teal", value: "178 42% 42%", swatch: "hsl(178 42% 42%)" },
  { label: "Gold", value: "38 64% 54%", swatch: "hsl(38 64% 54%)" },
  { label: "Amber", value: "32 82% 48%", swatch: "hsl(32 82% 48%)" },
  { label: "Forest", value: "152 46% 36%", swatch: "hsl(152 46% 36%)" },
  { label: "Slate", value: "220 12% 40%", swatch: "hsl(220 12% 40%)" },
  { label: "Rose gold", value: "350 25% 72%", swatch: "hsl(350 25% 72%)" },
  { label: "Lavender", value: "270 35% 58%", swatch: "hsl(270 35% 58%)" },
  { label: "Coral", value: "16 82% 52%", swatch: "hsl(16 82% 52%)" },
  { label: "Midnight", value: "240 16% 18%", swatch: "hsl(240 16% 18%)" },
];

export default function Settings() {
  const { studio, updateStudio } = useStudio();
  const fileRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  // Track original studio state so we know what changed
  const original = useMemo(() => ({ ...studio, settings: { ...studio.settings } }), []);

  const [name, setName] = useState(studio.name);
  const [tagline, setTagline] = useState(studio.tagline);
  const [city, setCity] = useState(studio.city);
  const [brandColor, setBrandColor] = useState(studio.brandColor);
  const [customColorInput, setCustomColorInput] = useState("");
  const [featureToggles, setFeatureToggles] = useState<Record<string, boolean>>(
    studio.settings?.featureToggles ?? {},
  );

  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  // Payment configuration
  const paymentMethod = studio.settings?.paymentMethod ?? "stripe";
  const [manualPaymentNotes, setManualPaymentNotes] = useState(
    studio.settings?.manualPaymentNotes ?? "",
  );
  const [manualPaymentLink, setManualPaymentLink] = useState(
    studio.settings?.manualPaymentLink ?? "",
  );

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const url = await uploadStudioLogo(file, studio.id);
      updateStudio({ logoUrl: url });
      toast.success("Logo uploaded to cloud storage");
    } catch {
      const reader = new FileReader();
      reader.onload = () => updateStudio({ logoUrl: reader.result as string });
      reader.readAsDataURL(file);
      toast("Logo saved locally (cloud storage unavailable)");
    } finally {
      setLogoUploading(false);
    }
    e.target.value = "";
  };

  const handleRemoveLogo = async () => {
    try {
      if (studio.logoUrl?.includes("supabase")) {
        const path = studio.logoUrl.split("/").slice(-2).join("/");
        await removeStudioLogo(path);
      }
    } catch { /* ignore */ }
    updateStudio({ logoUrl: undefined });
    toast("Logo removed");
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    try {
      const result = await uploadFile(STORAGE_BUCKETS.STUDIO_LOGOS, file, studio.id, "banner");
      updateStudio({ bannerUrl: result.publicUrl });
      toast.success("Banner uploaded to cloud storage");
    } catch {
      const reader = new FileReader();
      reader.onload = () => updateStudio({ bannerUrl: reader.result as string });
      reader.readAsDataURL(file);
      toast("Banner saved locally (cloud storage unavailable)");
    } finally {
      setBannerUploading(false);
    }
    e.target.value = "";
  };

  const handleRemoveBanner = async () => {
    try {
      if (studio.bannerUrl?.includes("supabase")) {
        const path = studio.bannerUrl.split("/").slice(-2).join("/");
        await deleteFile(STORAGE_BUCKETS.STUDIO_LOGOS, path);
      }
    } catch { /* ignore */ }
    updateStudio({ bannerUrl: undefined });
    toast("Banner removed");
  };

  const handleCustomColorApply = () => {
    const trimmed = customColorInput.trim();
    if (!trimmed) return;

    // Support HSL format: "H S% L%" (e.g. "220 60% 45%")
    const hslMatch = trimmed.match(/^(\d{1,3})\s+(\d{1,3})%\s+(\d{1,3})%$/);
    if (hslMatch) {
      const [, h, s, l] = hslMatch;
      const color = `${h} ${s}% ${l}%`;
      setBrandColor(color);
      updateStudio({ brandColor: color });
      setCustomColorInput("");
      toast.success("Custom brand colour applied");
      return;
    }

    // Support hex: "#rrggbb"
    const hexMatch = trimmed.match(/^#?([0-9a-fA-F]{6})$/);
    if (hexMatch) {
      const hex = hexMatch[1];
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;
      let hVal = 0;
      let sVal = 0;
      if (max !== min) {
        const d = max - min;
        sVal = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) hVal = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        else if (max === g) hVal = ((b - r) / d + 2) * 60;
        else hVal = ((r - g) / d + 4) * 60;
      }
      const color = `${Math.round(hVal)} ${Math.round(sVal * 100)}% ${Math.round(l * 100)}%`;
      setBrandColor(color);
      updateStudio({ brandColor: color });
      setCustomColorInput("");
      toast.success("Custom brand colour applied");
      return;
    }

    toast.error("Enter a hex colour (#e85d75) or HSL (350 74% 60%)");
  };

  const handleToggleFeature = (key: ModuleKey, enabled: boolean) => {
    const next = { ...featureToggles, [key]: enabled };
    setFeatureToggles(next);
  };

  const handleSave = () => {
    const updates: Record<string, unknown> = {};
    const n = name.trim() || "StudioFlow";
    const t = tagline.trim();
    const c = city.trim();
    if (n !== studio.name) updates.name = n;
    if (t !== studio.tagline) updates.tagline = t;
    if (c !== studio.city) updates.city = c;
    if (n !== studio.name || t !== studio.tagline || c !== studio.city) {
      updates.initials = initialsFrom(n);
    }
    if (brandColor !== studio.brandColor) {
      updates.brandColor = brandColor;
    }

    // Check if feature toggles changed
    const origToggles = original.settings?.featureToggles ?? {};
    const togglesChanged = Object.keys({ ...origToggles, ...featureToggles }).some(
      (k) => (origToggles[k] ?? true) !== (featureToggles[k] ?? true),
    );
    if (togglesChanged) {
      updates.settings = {
        ...studio.settings,
        featureToggles: featureToggles,
      };
    }

    // Check if payment settings changed
    const paymentMethod = studio.settings?.paymentMethod ?? "stripe";
    const savedManualNotes = studio.settings?.manualPaymentNotes ?? "";
    const savedManualLink = studio.settings?.manualPaymentLink ?? "";
    if (
      manualPaymentNotes !== savedManualNotes ||
      manualPaymentLink !== savedManualLink
    ) {
      updates.settings = {
        ...(updates.settings as Record<string, unknown> ?? studio.settings),
        manualPaymentNotes: manualPaymentNotes || undefined,
        manualPaymentLink: manualPaymentLink || undefined,
      };
    }

    if (Object.keys(updates).length === 0) {
      toast("No changes to save");
      return;
    }

    updateStudio(updates as Parameters<typeof updateStudio>[0]);
    toast.success("Settings saved");
  };

  const changed =
    name !== studio.name ||
    tagline !== studio.tagline ||
    city !== studio.city ||
    brandColor !== studio.brandColor ||
    manualPaymentNotes !== (studio.settings?.manualPaymentNotes ?? "") ||
    manualPaymentLink !== (studio.settings?.manualPaymentLink ?? "") ||
    (() => {
      const origToggles = original.settings?.featureToggles ?? {};
      return Object.keys({ ...origToggles, ...featureToggles }).some(
        (k) => (origToggles[k] ?? true) !== (featureToggles[k] ?? true),
      );
    })();

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-12 animate-float-up">
      {/* Page heading */}
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Studio settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Customise how your studio appears across the dashboard and parent portal.
        </p>
      </div>

      {/* Logo */}
      <ImageUploadSection
        title="Studio logo"
        description="Appears in the sidebar, parent portal, and printed materials."
        imageUrl={studio.logoUrl}
        initials={studio.initials}
        uploading={logoUploading}
        onUpload={handleLogoUpload}
        onRemove={handleRemoveLogo}
        fileRef={fileRef}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        helpText="PNG, JPEG, WebP or SVG. Square images work best."
      />

      {/* Banner */}
      <ImageUploadSection
        title="Portal banner"
        description="Hero image shown on your public registration page and parent portal. Use a wide photo of your studio space or students."
        imageUrl={studio.bannerUrl}
        initials={undefined}
        uploading={bannerUploading}
        onUpload={handleBannerUpload}
        onRemove={handleRemoveBanner}
        fileRef={bannerRef}
        accept="image/png,image/jpeg,image/webp"
        helpText="PNG, JPEG or WebP. 1200×400 or wider recommended."
        wide
      />

      {/* Studio info */}
      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
        <div>
          <h3 className="text-sm font-semibold">Studio details</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            These details are shown throughout the app and in emails to parents / caregivers.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-[13px] font-medium" htmlFor="studio-name">
              Studio name
            </label>
            <input
              id="studio-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-1 focus:ring-ring"
              placeholder="Your studio name"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium" htmlFor="studio-tagline">
              Tagline
            </label>
            <input
              id="studio-tagline"
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-1 focus:ring-ring"
              placeholder="A short tagline"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium" htmlFor="studio-city">
              City
            </label>
            <input
              id="studio-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-1 focus:ring-ring"
              placeholder="City, State"
            />
          </div>
        </div>
      </section>

      {/* Studio type */}
      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
        <div>
          <h3 className="text-sm font-semibold">Studio type</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Changes how labels appear throughout the app — Student/Athlete/Member, Instructor/Coach/Teacher, and event naming.
          </p>
        </div>
        <div className="mt-4">
          <select
            value={studio.vertical}
            onChange={(e) => updateStudio({ vertical: e.target.value as Vertical })}
            className="w-full max-w-xs rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-1 focus:ring-ring"
          >
            {ALL_VERTICALS.map((v) => (
              <option key={v} value={v}>
                {VERTICAL_LABELS[v]}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Brand colour */}
      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
        <div className="flex items-center gap-3 mb-5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose/10">
            <Palette className="h-4.5 w-4.5 text-rose" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Brand colour</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Used for the sidebar accent, buttons, and key interactive elements across the app.
            </p>
          </div>
        </div>

        {/* Live preview */}
        <div className="mb-5 flex items-center gap-4 rounded-xl border border-border/60 bg-secondary/30 p-4">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide shrink-0">
            Preview
          </span>
          <div className="flex items-center gap-3">
            <span
              className="h-8 w-8 rounded-lg shadow-soft shrink-0"
              style={{ backgroundColor: `hsl(${brandColor})` }}
            />
            <button
              className="rounded-full px-4 py-1.5 text-[13px] font-semibold text-primary-foreground shadow-lift"
              style={{ backgroundColor: `hsl(${brandColor})` }}
            >
              Sample button
            </button>
            <span
              className="h-2 w-20 rounded-full shrink-0 opacity-60"
              style={{ backgroundColor: `hsl(${brandColor})` }}
            />
            <span className="font-mono text-xs text-muted-foreground">{brandColor}</span>
          </div>
        </div>

        {/* Preset swatches */}
        <div className="flex flex-wrap gap-2.5 mb-5">
          {BRAND_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                setBrandColor(c.value);
                updateStudio({ brandColor: c.value });
              }}
              className={cn(
                "relative grid h-10 w-10 place-items-center rounded-full transition",
                brandColor === c.value
                  ? "ring-2 ring-ring ring-offset-2 ring-offset-card"
                  : "hover:scale-110",
              )}
              title={c.label}
            >
              <span
                className="h-7 w-7 rounded-full shadow-soft"
                style={{ backgroundColor: c.swatch }}
              />
              {brandColor === c.value && (
                <Check className="absolute h-4 w-4 text-white drop-shadow" />
              )}
            </button>
          ))}
        </div>

        {/* Custom colour input */}
        <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Custom colour
          </p>
          <div className="flex items-center gap-2.5">
            <input
              type="text"
              value={customColorInput}
              onChange={(e) => setCustomColorInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomColorApply()}
              placeholder="e.g. #e85d75 or 220 60% 45%"
              className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-mono outline-none transition focus:border-ring focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={handleCustomColorApply}
              disabled={!customColorInput.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lift transition hover:opacity-90 disabled:opacity-40"
            >
              Apply
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Enter a hex code (#e85d75) or HSL values (350 74% 60%). Presets are applied instantly; this field lets you use any colour.
          </p>
        </div>
      </section>

      {/* Feature Toggles */}
      <FeatureTogglesSection
        featureToggles={featureToggles}
        vertical={studio.vertical}
        onToggle={handleToggleFeature}
      />

      {/* Enabled Modules Preview */}
      <EnabledModulesSection />

      {/* Regional Settings */}
      <RegionalSettingsSection />

      {/* Unit System */}
      <UnitPreferenceSection />

      {/* Payment Configuration */}
      <PaymentSection
        paymentMethod={paymentMethod}
        manualPaymentNotes={manualPaymentNotes}
        manualPaymentLink={manualPaymentLink}
        onPaymentMethodChange={(method) =>
          updateStudio({
            settings: { ...studio.settings, paymentMethod: method as "stripe" | "manual" },
          })
        }
        onManualNotesChange={setManualPaymentNotes}
        onManualLinkChange={setManualPaymentLink}
      />

      {/* Stripe Connect (shown when Stripe is active payment method) */}
      {paymentMethod === "stripe" && <StripeConnectSection />}

      {/* Test studio cleanup (sandbox studios only) */}
      {studio.isTest && <DeleteTestStudioSection />}

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!changed}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lift transition hover:opacity-90 disabled:opacity-40"
        >
          <Save className="h-4 w-4" />
          Save changes
        </button>
        {changed && (
          <span className="text-xs text-muted-foreground">You have unsaved changes</span>
        )}
        {!changed && (
          <span className="text-xs text-muted-foreground">All changes saved</span>
        )}
      </div>
    </div>
  );
}

/* ── Image upload section (logo + banner) ───────────────────────── */

function DeleteTestStudioSection() {
  const { studio } = useStudio();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      toast.error('Type "DELETE" to confirm');
      return;
    }
    setDeleting(true);
    try {
      const { ok, removedUsers } = await deleteTestStudio(studio.id);
      if (!ok) throw new Error("Delete failed");
      toast.success(`Test studio deleted (${removedUsers} test account${removedUsers === 1 ? "" : "s"} removed)`);
      await signOut();
      localStorage.removeItem("studioflow_studio");
      localStorage.removeItem("studioflow_onboarding_completed");
      localStorage.removeItem("studioflow_setup_complete");
      navigate("/sandbox", { replace: true });
      window.location.href = "/sandbox";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete test studio");
      setDeleting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 shadow-soft">
      <div className="flex items-center gap-3 mb-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-destructive/10">
          <FlaskConical className="h-4.5 w-4.5 text-destructive" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Delete test studio</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            This is a sandbox studio. Deleting it permanently removes this studio and all of its
            data — participants, classes, caregivers, enrolments, invoices, waivers, attendance and
            announcements — plus the test login accounts. Real studios are never affected.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder='Type "DELETE" to confirm'
          className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-destructive focus:ring-1 focus:ring-destructive"
        />
        <button
          onClick={() => void handleDelete()}
          disabled={deleting || confirmText.trim().toUpperCase() !== "DELETE"}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-destructive px-6 py-2.5 text-sm font-semibold text-destructive-foreground shadow-lift transition hover:opacity-90 disabled:opacity-40"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {deleting ? "Deleting…" : "Delete test studio"}
        </button>
      </div>
    </section>
  );
}

function ImageUploadSection({
  title,
  description,
  imageUrl,
  initials,
  uploading,
  onUpload,
  onRemove,
  fileRef,
  accept,
  helpText,
  wide = false,
}: {
  title: string;
  description: string;
  imageUrl?: string;
  initials?: string;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  accept: string;
  helpText: string;
  wide?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      {imageUrl ? (
        <div className="mt-5 space-y-3">
          <div
            className={cn(
              "overflow-hidden rounded-xl border border-border/60",
              wide ? "aspect-[3/1]" : "h-20 w-20",
            )}
          >
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={onUpload}
            />
            <button
              onClick={() => (fileRef as React.RefObject<HTMLInputElement>).current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-secondary disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {uploading ? "Uploading…" : "Change image"}
            </button>
            <button
              onClick={onRemove}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5">
          {initials ? (
            <div className="flex items-start gap-5">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-primary">
                <span className="font-display text-2xl font-semibold text-primary-foreground">
                  {initials}
                </span>
              </div>
              <div className="space-y-2">
                <input
                  ref={fileRef as React.RefObject<HTMLInputElement>}
                  type="file"
                  accept={accept}
                  className="hidden"
                  onChange={onUpload}
                />
                <button
                  onClick={() => (fileRef as React.RefObject<HTMLInputElement>).current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-secondary disabled:opacity-60"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  {uploading ? "Uploading…" : "Upload image"}
                </button>
                <p className="text-[12px] text-muted-foreground">{helpText}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-secondary/30">
                <div className="text-center">
                  <Image className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-1 text-xs text-muted-foreground">No banner set</p>
                </div>
              </div>
              <input
                ref={fileRef as React.RefObject<HTMLInputElement>}
                type="file"
                accept={accept}
                className="hidden"
                onChange={onUpload}
              />
              <button
                onClick={() => (fileRef as React.RefObject<HTMLInputElement>).current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-secondary disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {uploading ? "Uploading…" : "Upload banner"}
              </button>
              <p className="text-[12px] text-muted-foreground">{helpText}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ── Feature Toggles section ────────────────────────────────────── */

function FeatureTogglesSection({
  featureToggles,
  vertical,
  onToggle,
}: {
  featureToggles: Record<string, boolean>;
  vertical: Vertical;
  onToggle: (key: ModuleKey, enabled: boolean) => void;
}) {
  const term = getTerminology(vertical);
  const allModules = term.enabledModules;

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
      <div className="flex items-center gap-3 mb-5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber/10">
          <CheckCircle className="h-4.5 w-4.5 text-amber" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Feature toggles</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Enable or disable modules throughout your dashboard. Hidden modules won't appear in the sidebar or navigation.
          </p>
        </div>
      </div>

      <div className="space-y-1">
        {allModules.map((key) => {
          const isToggled = featureToggles[key] ?? true; // default to enabled
          return (
            <div
              key={key}
              className="flex items-center justify-between rounded-xl px-4 py-3 transition hover:bg-secondary/50"
            >
              <div>
                <span className="text-sm font-medium">{MODULE_LABELS[key]}</span>
                <span className="ml-2 text-[11px] text-muted-foreground">
                  {isToggled ? "Visible in sidebar" : "Hidden"}
                </span>
              </div>
              <button
                onClick={() => onToggle(key, !isToggled)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                  isToggled ? "bg-primary" : "bg-muted",
                )}
                role="switch"
                aria-checked={isToggled}
              >
                <span
                  className={cn(
                    "inline-block h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform",
                    isToggled ? "translate-x-5.5" : "translate-x-1",
                  )}
                />
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground">
        Your default modules are determined by your studio type. You can override them here. Hidden modules won't lose any data — they're just hidden from view.
      </p>
    </section>
  );
}

/* ── Unit Preference section ────────────────────────────────────── */

function UnitPreferenceSection() {
  const { studio, updateStudio } = useStudio();

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
      <div>
        <h3 className="text-sm font-semibold">Measurement units</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Sets the default unit system for all measurements in the studio and parent portal.
          Parents can override this preference individually. All values are stored internally as metric.
        </p>
      </div>
      <div className="mt-4 flex gap-4">
        {([
          { value: "metric" as const, label: "Metric", desc: "cm · kg", icon: "🇪🇺" },
          { value: "imperial" as const, label: "Imperial", desc: "ft/in · lb", icon: "🇺🇸" },
        ]).map((opt) => {
          const current = (studio.settings?.preferredUnits ?? "metric") as string;
          const active = current === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() =>
                updateStudio({
                  settings: { ...studio.settings, preferredUnits: opt.value },
                })
              }
              className={cn(
                "flex flex-1 max-w-60 flex-col items-center gap-2 rounded-2xl border p-5 transition-all",
                active
                  ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                  : "border-border/70 bg-card hover:bg-secondary/50",
              )}
            >
              <span className="text-2xl">{opt.icon}</span>
              <div className="text-center">
                <p className={cn("text-sm font-semibold", active && "text-primary")}>{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
              {active && (
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Active
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ── Stripe Connect section ─────────────────────────────────────── */

function StripeConnectSection() {
  const { studio } = useStudio();
  const { data: state, isLoading, refetch } = useQuery({
    queryKey: ["stripe-connect", studio.id],
    queryFn: () => getStripeConnectState(studio.id),
    refetchInterval: (query) =>
      query.state.data &&
      typeof query.state.data === "object" &&
      (query.state.data as Awaited<ReturnType<typeof getStripeConnectState>>).status === "pending"
        ? 5000
        : false,
  });

  const handleConnect = async () => {
    try {
      const { url } = await startStripeConnect(studio.id, studio.name);
      if (url !== "#") window.open(url, "_blank");
      else toast.info("Stripe Connect onboarding — simulated mode");
    } catch {
      toast.error("Failed to start Stripe onboarding");
    }
  };

  const statusConfig = {
    not_connected: {
      icon: Building2,
      label: "Not connected",
      desc: "Connect your Stripe account to accept payments from families.",
      chip: "bg-muted text-muted-foreground",
      action: { label: "Connect Stripe", onClick: handleConnect },
    },
    pending: {
      icon: Loader2,
      label: "Onboarding in progress",
      desc: "Complete your Stripe account setup. This usually takes 1-2 business days for verification.",
      chip: "bg-amber-100 text-amber-700",
      action: { label: "Resume onboarding", onClick: handleConnect },
    },
    connected: {
      icon: Check,
      label: "Connected",
      desc: `Payments are live. Payouts ${state?.payoutsEnabled ? "enabled" : "pending"}.`,
      chip: "bg-success/10 text-success",
      action: undefined,
    },
    restricted: {
      icon: ShieldAlert,
      label: "Restricted",
      desc: "Your Stripe account has restrictions. Visit the Stripe dashboard to resolve them.",
      chip: "bg-destructive/10 text-destructive",
      action: { label: "View in Stripe", onClick: () => window.open("https://dashboard.stripe.com", "_blank") },
    },
  };

  const config = statusConfig[state?.status ?? "not_connected"];
  const StatusIcon = config.icon;

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", config.chip)}>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <StatusIcon className={cn("h-5 w-5", state?.status === "pending" && "animate-spin")} />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold">Stripe Connect</h3>
            <p className="mt-0.5 text-xs text-muted-foreground max-w-md">{config.desc}</p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", config.chip)}>
                {config.label}
              </span>
              {state?.status === "connected" && (
                <>
                  {state?.chargesEnabled && (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                      Charges enabled
                    </span>
                  )}
                  {state?.payoutsEnabled && (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                      Payouts enabled
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {config.action && (
            <button
              onClick={config.action.onClick}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-secondary"
            >
              {config.action.label}
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}
          {state?.status === "connected" && (
            <button
              onClick={() => refetch()}
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary"
              title="Refresh status"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Regional Settings section ──────────────────────────────────── */

function RegionalSettingsSection() {
  const { studio, updateStudio } = useStudio();
  const regional = studio.settings?.regional;
  const country = regional?.country ?? "US";
  const countryCfg = getCountryConfig(country);

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
      <div className="flex items-center gap-3 mb-5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal/10">
          <Globe className="h-4.5 w-4.5 text-teal" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Regional settings</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Configures date formats, currency, time display, and measurement units across the platform.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium">Country</label>
          <select
            value={country}
            onChange={(e) => {
              const code = e.target.value as typeof country;
              const cfg = getCountryConfig(code);
              updateStudio({
                settings: {
                  ...studio.settings,
                  regional: {
                    country: code,
                    timezone: cfg.defaultTimezone,
                    currency: cfg.currency,
                    dateFormat: cfg.dateFormat,
                    timeFormat: cfg.timeFormat,
                    measurementSystem: (studio.settings?.preferredUnits ?? cfg.measurementSystem) as "metric" | "imperial",
                  },
                  preferredUnits: cfg.measurementSystem,
                },
              });
              toast.success(`Regional settings set to ${countryLabel(code)}`);
            }}
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-1 focus:ring-ring"
          >
            {ALL_COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {countryLabel(c)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium">Currency</label>
          <select
            value={regional?.currency ?? "USD"}
            onChange={(e) => {
              if (!regional) return;
              updateStudio({
                settings: { ...studio.settings, regional: { ...regional, currency: e.target.value as typeof regional.currency } },
              });
              toast.success(`Currency set to ${e.target.value}`);
            }}
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-1 focus:ring-ring"
          >
            {(Object.entries(CURRENCY_CONFIGS) as [string, typeof CURRENCY_CONFIGS[keyof typeof CURRENCY_CONFIGS]][]).map(
              ([code, cfg]) => (
                <option key={code} value={code}>
                  {cfg.symbol} {code} — {cfg.name}
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border/60 bg-secondary/30 p-3.5">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          Address labels for {countryLabel(country)}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">State/Province:</span>
          <span className="font-medium">{countryCfg.addressLabels.stateOrProvince}</span>
          <span className="text-muted-foreground">Postal code:</span>
          <span className="font-medium">{countryCfg.addressLabels.postalCode}</span>
          <span className="text-muted-foreground">Phone example:</span>
          <span className="font-medium font-mono">{countryCfg.phoneExample}</span>
        </div>
      </div>
    </section>
  );
}

/* ── Enabled Modules Preview section ────────────────────────────── */

function EnabledModulesSection() {
  const { studio } = useStudio();
  const term = getTerminology(studio.vertical);

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
      <div className="flex items-center gap-3 mb-5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10">
          <CheckCircle className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Enabled modules</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            These modules are active for {VERTICAL_LABELS[studio.vertical]}. Determined by your studio type.
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-border/60 bg-secondary/30 p-3.5">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          Terminology — how labels appear throughout the app
        </p>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">Participants:</span>
          <span className="font-medium">
            {term.participant} / {term.participantPlural}
          </span>
          <span className="text-muted-foreground">Instructors:</span>
          <span className="font-medium">
            {term.instructor} / {term.instructorPlural}
          </span>
          <span className="text-muted-foreground">{term.classStyle}:</span>
          <span className="font-medium">{term.styleCategories.join(", ")}</span>
          <span className="text-muted-foreground">Events:</span>
          <span className="font-medium">
            {term.event} / {term.eventPlural}
          </span>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {term.enabledModules.map((key) => (
          <div
            key={key}
            className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background px-3.5 py-2.5"
          >
            <CheckCircle className="h-4 w-4 shrink-0 text-teal" />
            <span className="text-sm font-medium">{MODULE_LABELS[key]}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground">
        Navigation menus and dashboard cards reflect only enabled modules. To change which modules are available, select
        a different studio type above.
      </p>
    </section>
  );
}

/* ── Payment Configuration section ──────────────────────────────── */

function PaymentSection({
  paymentMethod,
  manualPaymentNotes,
  manualPaymentLink,
  onPaymentMethodChange,
  onManualNotesChange,
  onManualLinkChange,
}: {
  paymentMethod: string;
  manualPaymentNotes: string;
  manualPaymentLink: string;
  onPaymentMethodChange: (method: string) => void;
  onManualNotesChange: (notes: string) => void;
  onManualLinkChange: (link: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
      <div className="flex items-center gap-3 mb-5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose/10">
          <CreditCard className="h-4.5 w-4.5 text-rose" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Payment method</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Choose how families pay. Stripe Connect processes real payments; Manual tracking is for studios using external billing.
          </p>
        </div>
      </div>

      {/* Payment method selector */}
      <div className="grid gap-3 sm:grid-cols-2 mb-5">
        {[
          {
            value: "stripe",
            label: "Stripe Connect",
            desc: "Accept credit cards, ACH, and digital wallets. Funds deposited directly to your bank.",
            icon: Building2,
          },
          {
            value: "manual",
            label: "Manual / External tracking",
            desc: "Track payments manually. Use for cash, cheque, bank transfer, or third-party processors.",
            icon: Pencil,
          },
        ].map((opt) => {
          const active = paymentMethod === opt.value;
          const OptIcon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => onPaymentMethodChange(opt.value)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all",
                active
                  ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                  : "border-border/70 bg-card hover:bg-secondary/50",
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                    active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  <OptIcon className="h-4 w-4" />
                </div>
                <span className={cn("text-sm font-semibold", active && "text-primary")}>
                  {opt.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{opt.desc}</p>
              {active && (
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Active
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Manual payment fields — only shown when manual is selected */}
      {paymentMethod === "manual" && (
        <div className="space-y-4 rounded-xl border border-border/60 bg-secondary/30 p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Manual payment configuration
          </p>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium" htmlFor="manual-payment-link">
              External payment link
            </label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="manual-payment-link"
                type="url"
                value={manualPaymentLink}
                onChange={(e) => onManualLinkChange(e.target.value)}
                placeholder="https://your-payment-processor.com/pay"
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3.5 text-sm outline-none transition focus:border-ring focus:ring-1 focus:ring-ring"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Link to your external payment page (Stripe Payment Links, PayPal, Square, etc.)
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium" htmlFor="manual-payment-notes">
              Payment instructions for families
            </label>
            <textarea
              id="manual-payment-notes"
              value={manualPaymentNotes}
              onChange={(e) => onManualNotesChange(e.target.value)}
              rows={3}
              placeholder="e.g. Please make cheques payable to 'Studio Name' or send e-transfer to billing@studio.com"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-1 focus:ring-ring resize-none"
            />
            <p className="text-[11px] text-muted-foreground">
              These instructions appear on invoices and the parent portal payment page.
            </p>
          </div>
        </div>
      )}

      {/* RevenueCat note — future mobile app only */}
      <div className="mt-4 rounded-xl border border-border/60 bg-secondary/30 p-3.5">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground/70">Mobile app subscriptions</span> — RevenueCat integration for native iOS and Android subscription management is planned for a future release. For now, use Stripe Connect or Manual tracking for all billing.
        </p>
      </div>
    </section>
  );
}
