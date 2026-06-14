import { useState, type FormEvent } from "react";
import {
  Baby,
  Cake,
  Calendar,
  Heart,
  Home,
  Mail,
  MapPin,
  Phone,
  Shield,
  Stethoscope,
  User,
  Wheat,
  X,
} from "lucide-react";

import { useStudents, useTerminology } from "@/data/store";
import type { Address, CountryCode } from "@/data/types";
import { getCountryConfig } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
}

/** Country options for the address dropdown. */
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

const GENDER_OPTIONS = [
  { value: "", label: "Prefer not to say" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
];

export default function AddMemberModal({ open, onClose }: AddMemberModalProps) {
  const { addStudent } = useStudents();
  const term = useTerminology();

  // Personal details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [pronouns, setPronouns] = useState("");

  // Guardian / caregiver
  const [caregiverName, setCaregiverName] = useState("");
  const [caregiverEmail, setCaregiverEmail] = useState("");
  const [caregiverPhone, setCaregiverPhone] = useState("");

  // Address
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressPostal, setAddressPostal] = useState("");
  const [addressCountry, setAddressCountry] = useState<CountryCode>("US");

  // Emergency contact
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // Medical & safety
  const [allergies, setAllergies] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [medications, setMedications] = useState("");
  const [safetyNotes, setSafetyNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = firstName.trim() !== "" && lastName.trim() !== "";

  const countryCfg = getCountryConfig(addressCountry);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);

    const displayName = `${firstName.trim()} ${lastName.trim()}`;

    // Build address
    const address: Address | undefined =
      addressLine1.trim()
        ? {
            line1: addressLine1.trim(),
            line2: addressLine2.trim() || undefined,
            city: addressCity.trim() || "",
            stateOrProvince: addressState.trim() || "",
            postalCode: addressPostal.trim() || "",
            country: addressCountry,
          }
        : undefined;

    // Build supplemental notes from address + phone for safety_notes
    const supplementalNotes = [
      caregiverPhone.trim()
        ? `[Guardian phone] ${caregiverPhone.trim()}`
        : null,
      address
        ? `[Address] ${[address.line1, address.line2, address.city, address.stateOrProvince, address.postalCode, address.country].filter(Boolean).join(", ")}`
        : null,
      safetyNotes.trim() || null,
    ]
      .filter(Boolean)
      .join(" | ");

    addStudent({
      name: displayName,
      legalFirstName: firstName.trim(),
      legalLastName: lastName.trim(),
      preferredName: preferredName.trim() || undefined,
      dob: dob ? new Date(dob).toISOString() : new Date(2000, 0, 1).toISOString(),
      gender: gender || undefined,
      pronouns: pronouns.trim() || undefined,
      caregiverId: "",
      caregiverName: caregiverName.trim() || displayName,
      caregiverEmail: caregiverEmail.trim() || "",
      caregiverPhone: caregiverPhone.trim() || undefined,
      caregiverAddress: address,
      classIds: [],
      attendanceRate: 0,
      waiver: "missing",
      payment: "due",
      balanceCents: 0,
      medicalNotes: [
        allergies.trim() ? `Allergies: ${allergies.trim()}` : null,
        medicalConditions.trim()
          ? `Conditions: ${medicalConditions.trim()}`
          : null,
        medications.trim() ? `Medications: ${medications.trim()}` : null,
        supplementalNotes || null,
      ]
        .filter(Boolean)
        .join(" | ") || undefined,
      allergies: allergies.trim() || undefined,
      emergencyContactName: emergencyName.trim() || undefined,
      emergencyContactRelationship: emergencyRelationship.trim() || undefined,
      emergencyContactPhone: emergencyPhone.trim() || undefined,
      emergencyContactCanPickup: !!emergencyName.trim(),
    });

    // Reset form
    setFirstName("");
    setLastName("");
    setPreferredName("");
    setDob("");
    setGender("");
    setPronouns("");
    setCaregiverName("");
    setCaregiverEmail("");
    setCaregiverPhone("");
    setAddressLine1("");
    setAddressLine2("");
    setAddressCity("");
    setAddressState("");
    setAddressPostal("");
    setAddressCountry("US");
    setEmergencyName("");
    setEmergencyRelationship("");
    setEmergencyPhone("");
    setAllergies("");
    setMedicalConditions("");
    setMedications("");
    setSafetyNotes("");
    setIsSubmitting(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg max-h-[85vh] animate-float-up rounded-3xl border border-border/70 bg-card shadow-lift flex flex-col">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-6 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose/10 text-rose">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold">
                Add {term.participant}
              </h2>
              <p className="text-sm text-muted-foreground">
                Enter their details below — you can update this info later
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 pt-4 space-y-6"
        >
          {/* ── Section: Personal Details ─────────────────────────── */}
          <fieldset className="space-y-4">
            <legend className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              <Baby className="h-3.5 w-3.5 text-rose" />
              Personal Details
            </legend>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  First Name <span className="text-rose">*</span>
                </label>
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoFocus
                  required
                  className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  Last Name <span className="text-rose">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  Preferred Name
                </label>
                <input
                  type="text"
                  placeholder="Nickname"
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  <Cake className="inline h-3.5 w-3.5 mr-1 text-rose" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 appearance-none"
                >
                  {GENDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  Pronouns
                </label>
                <input
                  type="text"
                  placeholder="e.g. she/her, they/them"
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
          </fieldset>

          {/* ── Section: Guardian/Caregiver ──────────────────────── */}
          <fieldset className="space-y-4">
            <legend className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              <Shield className="h-3.5 w-3.5 text-rose" />
              {term.guardian} Details
            </legend>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                {term.guardian} Name
              </label>
              <input
                type="text"
                placeholder={`Full name of ${term.guardian.toLowerCase()}`}
                value={caregiverName}
                onChange={(e) => setCaregiverName(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  <Mail className="inline h-3.5 w-3.5 mr-1 text-rose" />
                  Email
                </label>
                <input
                  type="email"
                  placeholder={`${term.guardian.toLowerCase()}@email.com`}
                  value={caregiverEmail}
                  onChange={(e) => setCaregiverEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  <Phone className="inline h-3.5 w-3.5 mr-1 text-rose" />
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={caregiverPhone}
                  onChange={(e) => setCaregiverPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
          </fieldset>

          {/* ── Section: Address ──────────────────────────────────── */}
          <fieldset className="space-y-4">
            <legend className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              <Home className="h-3.5 w-3.5 text-rose" />
              Address
            </legend>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Street Address
              </label>
              <input
                type="text"
                placeholder="123 Main Street"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Address Line 2{" "}
                <span className="text-muted-foreground/50 font-normal">
                  (optional)
                </span>
              </label>
              <input
                type="text"
                placeholder="Apt 4B"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  City
                </label>
                <input
                  type="text"
                  placeholder="City"
                  value={addressCity}
                  onChange={(e) => setAddressCity(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  {countryCfg.addressLabels.stateOrProvince}
                </label>
                <input
                  type="text"
                  placeholder={countryCfg.addressLabels.stateOrProvince}
                  value={addressState}
                  onChange={(e) => setAddressState(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  {countryCfg.addressLabels.postalCode}
                </label>
                <input
                  type="text"
                  placeholder={countryCfg.addressLabels.postalCode}
                  value={addressPostal}
                  onChange={(e) => setAddressPostal(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  Country
                </label>
                <select
                  value={addressCountry}
                  onChange={(e) =>
                    setAddressCountry(e.target.value as CountryCode)
                  }
                  className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 appearance-none"
                >
                  {COUNTRY_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          {/* ── Section: Emergency Contact ────────────────────────── */}
          <fieldset className="space-y-4">
            <legend className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              <Heart className="h-3.5 w-3.5 text-rose" />
              Emergency Contact
            </legend>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Contact Name
              </label>
              <input
                type="text"
                placeholder="Emergency contact name"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grandparent, Aunt"
                  value={emergencyRelationship}
                  onChange={(e) => setEmergencyRelationship(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="(555) 987-6543"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
          </fieldset>

          {/* ── Section: Medical & Safety ─────────────────────────── */}
          <fieldset className="space-y-4">
            <legend className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              <Stethoscope className="h-3.5 w-3.5 text-rose" />
              Medical &amp; Safety
            </legend>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                <Wheat className="inline h-3.5 w-3.5 mr-1 text-rose" />
                Allergies
              </label>
              <input
                type="text"
                placeholder="e.g. Peanuts, dairy, bee stings"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Medical Conditions
              </label>
              <input
                type="text"
                placeholder="e.g. Mild asthma, eczema"
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Medications
              </label>
              <input
                type="text"
                placeholder="e.g. Inhaler, EpiPen"
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">
                Activity / Safety Notes
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Needs inhaler before running, avoid peanuts"
                value={safetyNotes}
                onChange={(e) => setSafetyNotes(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2.5 px-3.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50 resize-none"
              />
            </div>
          </fieldset>

          {/* ── Actions ───────────────────────────────────────────── */}
          <div className="flex gap-3 pt-2 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-border bg-card py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={cn(
                "flex-1 rounded-full py-2.5 text-sm font-semibold shadow-soft transition-all",
                canSubmit && !isSubmitting
                  ? "bg-rose text-rose-foreground hover:opacity-90"
                  : "bg-rose/30 text-rose-foreground/50 cursor-not-allowed",
              )}
            >
              {isSubmitting
                ? "Adding…"
                : `Add ${term.participant.toLowerCase()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
