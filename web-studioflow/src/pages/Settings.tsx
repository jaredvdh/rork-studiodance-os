import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Camera, Check, ExternalLink, Loader2, RefreshCw, Save, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useStudio } from "@/data/store";
import type { Vertical } from "@/data/types";
import { ALL_VERTICALS, VERTICAL_LABELS } from "@/data/terminology";
import { cn } from "@/lib/utils";
import { getStripeConnectState, startStripeConnect } from "@/lib/stripe";
import { uploadStudioLogo, removeStudioLogo } from "@/lib/storage";

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
];

export default function Settings() {
  const { studio, updateStudio } = useStudio();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(studio.name);
  const [tagline, setTagline] = useState(studio.tagline);
  const [city, setCity] = useState(studio.city);

  const [logoUploading, setLogoUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const url = await uploadStudioLogo(file, studio.id);
      updateStudio({ logoUrl: url });
      toast.success("Logo uploaded to cloud storage");
    } catch {
      // Fallback to base64 for development
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        updateStudio({ logoUrl: url });
      };
      reader.readAsDataURL(file);
      toast("Logo saved locally (cloud storage unavailable)");
    } finally {
      setLogoUploading(false);
    }
    e.target.value = "";
  };

  const handleRemoveLogo = async () => {
    try {
      // Try to remove from storage if it's a Supabase URL
      if (studio.logoUrl?.includes("supabase")) {
        const path = studio.logoUrl.split("/").slice(-2).join("/");
        await removeStudioLogo(path);
      }
    } catch { /* ignore */ }
    updateStudio({ logoUrl: undefined });
    toast("Logo removed");
  };

  const handleSave = () => {
    updateStudio({
      name: name.trim() || "StudioFlow",
      tagline: tagline.trim(),
      city: city.trim(),
      initials: initialsFrom(name.trim() || "SF"),
    });
    toast("Studio branding updated");
  };

  const changed =
    name !== studio.name ||
    tagline !== studio.tagline ||
    city !== studio.city;

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-float-up">
      {/* Page heading */}
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Studio settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Customise how your studio appears across the dashboard and parent portal.
        </p>
      </div>

      {/* Logo */}
      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Studio logo</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Appears in the sidebar, parent portal, and printed materials.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-5">
          {/* Preview */}
          <div
            className={cn(
              "grid h-20 w-20 shrink-0 place-items-center rounded-2xl overflow-hidden",
              !studio.logoUrl && "bg-primary",
            )}
          >
            {studio.logoUrl ? (
              <img
                src={studio.logoUrl}
                alt="Studio logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-display text-2xl font-semibold text-primary-foreground">
                {studio.initials}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={logoUploading}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-secondary disabled:opacity-60"
            >
              {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {logoUploading ? "Uploading…" : studio.logoUrl ? "Change logo" : "Upload logo"}
            </button>
            {studio.logoUrl && (
              <button
                onClick={handleRemoveLogo}
                className="ml-2 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
            <p className="text-[12px] text-muted-foreground">
              PNG, JPEG, WebP or SVG. Square images work best.
            </p>
          </div>
        </div>
      </section>

      {/* Studio info */}
      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
        <div>
          <h3 className="text-sm font-semibold">Studio details</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            These details are shown throughout the app and in emails to parents.
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
            Changes how labels appear throughout the app — Student/Athlete/Member, Instructor/Coach/Teacher, and recital/competition/workshop naming.
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

      {/* Stripe Connect */}
      <StripeConnectSection />

      {/* Brand color */}
      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
        <div>
          <h3 className="text-sm font-semibold">Brand colour</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Used for the sidebar accent and key interactive elements.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {BRAND_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => updateStudio({ brandColor: c.value })}
              className={cn(
                "relative grid h-10 w-10 place-items-center rounded-full transition",
                studio.brandColor === c.value
                  ? "ring-2 ring-ring ring-offset-2 ring-offset-card"
                  : "hover:scale-110",
              )}
              title={c.label}
            >
              <span
                className="h-7 w-7 rounded-full shadow-soft"
                style={{ backgroundColor: c.swatch }}
              />
              {studio.brandColor === c.value && (
                <Check className="absolute h-4 w-4 text-white drop-shadow" />
              )}
            </button>
          ))}
        </div>
      </section>

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
      </div>
    </div>
  );
}

/* ── Stripe Connect section ───────────────────────────────────────── */

function StripeConnectSection() {
  const { studio } = useStudio();
  const { data: state, isLoading, refetch } = useQuery({
    queryKey: ["stripe-connect", studio.id],
    queryFn: () => getStripeConnectState(studio.id),
    refetchInterval: state?.status === "pending" ? 5000 : false,
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
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <StatusIcon className={cn("h-5 w-5", state?.status === "pending" && "animate-spin")} />}
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
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">Charges enabled</span>
                  )}
                  {state?.payoutsEnabled && (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">Payouts enabled</span>
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
