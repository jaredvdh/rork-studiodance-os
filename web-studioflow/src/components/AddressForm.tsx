import { useState } from "react";
import {
  Check,
  Home,
  MapPin,
  X,
} from "lucide-react";

import type { Address, CountryCode } from "@/data/types";
import { getCountryConfig } from "@/lib/locale";
import { cn } from "@/lib/utils";

/** Country options for the address form dropdown. */
const COUNTRY_OPTIONS: { code: CountryCode; label: string }[] = [
  { code: "CA", label: "Canada" },
  { code: "US", label: "United States" },
  { code: "NZ", label: "New Zealand" },
  { code: "AU", label: "Australia" },
  { code: "GB", label: "United Kingdom" },
  { code: "IE", label: "Ireland" },
  { code: "EU", label: "European Union" },
  { code: "OTHER", label: "Other" },
];

interface AddressFormProps {
  /** The address being edited (or undefined for new). */
  address?: Address | null;
  /** The default country code (from studio settings). */
  defaultCountry?: CountryCode;
  /** Called when the user saves the address. */
  onSave: (addr: Address) => void;
  /** Called when the user cancels. */
  onCancel: () => void;
  /** Readonly mode — display only, no editing. */
  readonly?: boolean;
}

export default function AddressForm({
  address,
  defaultCountry,
  onSave,
  onCancel,
  readonly,
}: AddressFormProps) {
  const [country, setCountry] = useState<CountryCode>(
    address?.country ?? defaultCountry ?? "US",
  );
  const [line1, setLine1] = useState(address?.line1 ?? "");
  const [line2, setLine2] = useState(address?.line2 ?? "");
  const [city, setCity] = useState(address?.city ?? "");
  const [stateOrProvince, setStateOrProvince] = useState(
    address?.stateOrProvince ?? "",
  );
  const [postalCode, setPostalCode] = useState(address?.postalCode ?? "");

  const cfg = getCountryConfig(country);
  const canSave =
    line1.trim() !== "" && city.trim() !== "" && postalCode.trim() !== "";

  const handleSave = () => {
    if (!canSave && !readonly) return;
    onSave({
      line1: line1.trim(),
      line2: line2.trim() || undefined,
      city: city.trim(),
      stateOrProvince: stateOrProvince.trim() || undefined,
      postalCode: postalCode.trim(),
      country,
    });
  };

  if (readonly) {
    return (
      <div className="space-y-3">
        <AddressDisplay address={address ?? null} country={country} />
        <button
          onClick={onCancel}
          className="w-full rounded-full border border-border bg-card py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Country selector */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
          Country
        </label>
        <div className="relative">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as CountryCode)}
            className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 appearance-none"
          >
            {COUNTRY_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </select>
          <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Address Line 1 */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
          Address Line 1 <span className="text-rose">*</span>
        </label>
        <input
          type="text"
          value={line1}
          onChange={(e) => setLine1(e.target.value)}
          placeholder="Address Line 1"
          className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
        />
      </div>

      {/* Address Line 2 */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
          Address Line 2{" "}
          <span className="font-normal text-muted-foreground/60">
            (optional)
          </span>
        </label>
        <input
          type="text"
          value={line2}
          onChange={(e) => setLine2(e.target.value)}
          placeholder="Address Line 2"
          className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
        />
      </div>

      {/* City */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
          City / Town <span className="text-rose">*</span>
        </label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City / Town"
          className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
        />
      </div>

      {/* State/Province/Region + Postal Code */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
            {cfg.addressLabels.stateOrProvince}
          </label>
          <input
            type="text"
            value={stateOrProvince}
            onChange={(e) => setStateOrProvince(e.target.value)}
            placeholder={cfg.addressLabels.stateOrProvince}
            className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
            {cfg.addressLabels.postalCode}{" "}
            <span className="text-rose">*</span>
          </label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder={cfg.addressLabels.postalCode}
            className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full border border-amber-200 bg-white py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-amber-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            "flex-1 rounded-full py-2.5 text-sm font-semibold shadow-soft transition-all inline-flex items-center justify-center gap-2",
            canSave
              ? "bg-amber-400 text-amber-900 hover:opacity-90"
              : "bg-amber-100 text-amber-400 cursor-not-allowed",
          )}
        >
          <Check className="h-4 w-4" />
          Save address
        </button>
      </div>
    </div>
  );
}

/* ── Read-only address display ──────────────────────────────────── */

export function AddressDisplay({
  address,
  country,
}: {
  address: Address | string | null | undefined;
  country?: CountryCode;
}) {
  if (!address) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Home className="h-4 w-4 shrink-0" />
        <span>No address on file</span>
      </div>
    );
  }

  if (typeof address === "string") {
    return (
      <div className="flex items-start gap-2 text-sm py-1">
        <Home className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
        <span>{address}</span>
      </div>
    );
  }

  const cfg = country ? getCountryConfig(country) : null;

  return (
    <div className="flex items-start gap-2 text-sm py-1">
      <Home className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
      <div>
        <p>{address.line1}</p>
        {address.line2 && <p>{address.line2}</p>}
        <p>
          {[address.city, address.stateOrProvince, address.postalCode]
            .filter(Boolean)
            .join(" ")}
        </p>
        {address.country && cfg && (
          <p className="text-xs text-muted-foreground">{cfg.name}</p>
        )}
      </div>
    </div>
  );
}
