import { Component, useCallback, useMemo, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Baby,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Signature,
  Heart,
  Home,
  Mail,
  MapPin,
  Phone,
  Plus,
  Shield,
  Stethoscope,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { useParent } from "@/data/parentStore";
import {
  type Address,
  type AuthorizedPickupContact,
  type Caregiver,
  type ChildMedicalInfo,
  type ChildRegistrationPayload,
  type EmergencyContact,
  DEFAULT_CHILD_WAIVERS,
  caregiverFullName,
} from "@/data/types";
import { AddressDisplay } from "@/components/AddressForm";
import { cn } from "@/lib/utils";

/* ── Inline error boundary for step content ─────────────────────── */

class StepErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("StepErrorBoundary caught:", error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="rounded-2xl border border-rose/30 bg-rose/5 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose mb-3" />
          <p className="text-sm font-medium text-rose">
            Something went wrong rendering this step.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {this.state.error?.message ?? "Unknown error"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 rounded-full border border-rose/30 bg-white px-4 py-2 text-xs font-semibold text-rose transition hover:bg-rose/10"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Step definitions ────────────────────────────────────────────── */

type StepKey = "child" | "guardian" | "emergency" | "medical" | "review";

interface Step {
  key: StepKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: Step[] = [
  { key: "child", label: "Child details", icon: Baby },
  { key: "guardian", label: "Guardian", icon: Shield },
  { key: "emergency", label: "Emergency", icon: Phone },
  { key: "medical", label: "Medical", icon: Stethoscope },
  { key: "review", label: "Review", icon: ClipboardList },
];

/* ── Props ────────────────────────────────────────────────────────── */

interface ChildRegistrationWizardProps {
  open: boolean;
  onClose: () => void;
}

/* ── Initial state helpers ────────────────────────────────────────── */

function emptyMedicalInfo(): ChildMedicalInfo {
  return {
    allergies: undefined,
    medications: undefined,
    medicalConditions: undefined,
    hasAsthma: false,
    hasInhaler: false,
    hasEpiPen: false,
    activityRestrictions: undefined,
    safetyNotes: undefined,
  };
}

function emptyEmergencyContact(): EmergencyContact {
  return {
    name: "",
    relationship: "",
    phone: "",
    secondaryPhone: undefined,
    canPickup: true,
  };
}

function emptyAddress(): Address {
  return {
    line1: "",
    line2: undefined,
    city: "",
    stateOrProvince: undefined,
    postalCode: "",
    country: "US",
  };
}

function emptyNewCaregiver(): {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  relationship: string;
} {
  return {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    relationship: "Parent",
  };
}

function todayForInput(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

/* ═══════════════════════════════════════════════════════════════════
   Wizard
   ═══════════════════════════════════════════════════════════════════ */

export default function ChildRegistrationWizard({
  open,
  onClose,
}: ChildRegistrationWizardProps) {
  const { parent, primaryCaregiver, additionalCaregivers, addChild } = useParent();
  const pc = primaryCaregiver;
  const householdAddress = parent?.householdAddress;
  const activeCaregivers = additionalCaregivers.filter(
    (a) => a.status === "active",
  );

  const [step, setStep] = useState<StepKey>("child");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 — Child details
  const [legalFirstName, setLegalFirstName] = useState("");
  const [legalLastName, setLegalLastName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [schoolGrade, setSchoolGrade] = useState("");
  const [useSeparateAddress, setUseSeparateAddress] = useState(false);
  const [childAddress, setChildAddress] = useState<Address>(emptyAddress());

  // Step 2 — Guardian
  const [guardianMode, setGuardianMode] = useState<"self" | "existing" | "new">("self");
  const [selectedCaregiverId, setSelectedCaregiverId] = useState("");
  const [guardianConfirmed, setGuardianConfirmed] = useState(false);
  const [guardianRelationship, setGuardianRelationship] = useState("Parent");
  const [newCaregiver, setNewCaregiver] = useState(emptyNewCaregiver());
  const [isBillingContact, setIsBillingContact] = useState(false);
  const [isPickupContact, setIsPickupContact] = useState(true);

  // Step 3 — Emergency & pickup
  const [emergency, setEmergency] = useState<EmergencyContact>(emptyEmergencyContact());
  const [pickupContacts, setPickupContacts] = useState<AuthorizedPickupContact[]>([]);

  // Step 4 — Medical
  const [medical, setMedical] = useState<ChildMedicalInfo>(emptyMedicalInfo());
  const [physicianClinic, setPhysicianClinic] = useState("");
  const [medicalInfoConfirmed, setMedicalInfoConfirmed] = useState(false);

  const age = useMemo(() => (dob ? calcAge(dob) : 0), [dob]);

  const currentStepIdx = STEPS.findIndex((s) => s.key === step);

  const goNext = useCallback(() => {
    const nextIdx = currentStepIdx + 1;
    if (nextIdx < STEPS.length) setStep(STEPS[nextIdx].key);
  }, [currentStepIdx]);

  const goPrev = useCallback(() => {
    const prevIdx = currentStepIdx - 1;
    if (prevIdx >= 0) setStep(STEPS[prevIdx].key);
  }, [currentStepIdx]);

  /* ── Validation per step ────────────────────────────────────── */
  const step1Valid = legalFirstName.trim() !== "" && legalLastName.trim() !== "" && dob !== "";
  const step2Valid = guardianConfirmed &&
    (guardianMode === "self" || guardianMode === "existing"
      ? true
      : newCaregiver.first_name.trim() !== "" && newCaregiver.last_name.trim() !== "" && newCaregiver.email.trim() !== "");
  const step3Valid = emergency.name.trim() !== "" && emergency.phone.trim() !== "";
  const step4Valid = medicalInfoConfirmed;

  const canAdvance =
    step === "child" ? step1Valid
    : step === "guardian" ? step2Valid
    : step === "emergency" ? step3Valid
    : step === "medical" ? step4Valid
    : true;

  /* ── Resolve the effective guardian ID ──────────────────────── */
  const effectiveGuardianId = useMemo(() => {
    if (guardianMode === "self") return pc.id;
    if (guardianMode === "existing") return selectedCaregiverId;
    return ""; // new caregiver — handled at submit
  }, [guardianMode, pc.id, selectedCaregiverId]);

  /* ── Submit ─────────────────────────────────────────────────── */
  const handleSubmit = useCallback(() => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const displayName = `${legalFirstName.trim()} ${legalLastName.trim()}`;

    const caregiverId =
      guardianMode === "self" ? pc.id
      : guardianMode === "existing" ? selectedCaregiverId
      : ""; // new caregiver — ID generated later

    addChild({
      name: displayName,
      dob: new Date(dob).toISOString(),
      legalFirstName: legalFirstName.trim(),
      legalLastName: legalLastName.trim(),
      preferredName: preferredName.trim() || undefined,
      ageAtRegistration: age,
      gender: gender || undefined,
      pronouns: pronouns.trim() || undefined,
      schoolGrade: schoolGrade.trim() || undefined,
      guardianConfirmed,
      guardianRelationship: guardianRelationship.trim(),
      guardianId: caregiverId,
      consentTimestamp: new Date().toISOString(),
      emergencyContactName: emergency.name.trim(),
      emergencyContactRelationship: emergency.relationship.trim(),
      emergencyContactPhone: emergency.phone.trim(),
      emergencyContactSecondaryPhone: emergency.secondaryPhone?.trim() || undefined,
      emergencyContactCanPickup: emergency.canPickup,
      authorizedPickupContacts: pickupContacts,
      medicalInfo: {
        ...medical,
        medicalConditions: [
          medical.medicalConditions,
          physicianClinic.trim() ? `Physician/Clinic: ${physicianClinic.trim()}` : null,
        ].filter(Boolean).join("; ") || undefined,
      },
      medicalInfoConfirmed,
      allergies: medical.allergies || undefined,
      medicalNotes: [
        medical.medications ? `Medications: ${medical.medications}` : null,
        medical.medicalConditions || null,
        physicianClinic.trim() ? `Physician/Clinic: ${physicianClinic.trim()}` : null,
        medical.safetyNotes || null,
      ].filter(Boolean).join("; ") || undefined,
      waivers: DEFAULT_CHILD_WAIVERS,
      waiver: "missing",
    });

    setTimeout(() => {
      setIsSubmitting(false);
      // Reset form
      setLegalFirstName("");
      setLegalLastName("");
      setPreferredName("");
      setDob("");
      setGender("");
      setPronouns("");
      setSchoolGrade("");
      setUseSeparateAddress(false);
      setChildAddress(emptyAddress());
      setGuardianMode("self");
      setSelectedCaregiverId("");
      setGuardianConfirmed(false);
      setGuardianRelationship("Parent");
      setNewCaregiver(emptyNewCaregiver());
      setIsBillingContact(false);
      setIsPickupContact(true);
      setEmergency(emptyEmergencyContact());
      setPickupContacts([]);
      setMedical(emptyMedicalInfo());
      setPhysicianClinic("");
      setMedicalInfoConfirmed(false);
      setStep("child");
      onClose();
    }, 700);
  }, [
    isSubmitting, legalFirstName, legalLastName, preferredName, dob, gender, pronouns,
    schoolGrade, guardianMode, selectedCaregiverId, guardianConfirmed,
    guardianRelationship, newCaregiver, pc.id, emergency,
    pickupContacts, medical, physicianClinic, medicalInfoConfirmed,
    age, addChild, onClose,
  ]);

  if (!open) return null;

  // Resolve the guardian display name for steps
  const guardianDisplayName =
    guardianMode === "self"
      ? caregiverFullName(pc)
      : guardianMode === "existing"
        ? (activeCaregivers.find((c) => c.id === selectedCaregiverId)
          ? caregiverFullName(activeCaregivers.find((c) => c.id === selectedCaregiverId)!)
          : "Selected caregiver")
        : `${newCaregiver.first_name} ${newCaregiver.last_name}`.trim() || "New caregiver";

  /* ═══════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════ */

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-parent/95">
      {/* ── Header bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200/40 bg-white/80 backdrop-blur-xl shrink-0">
        <button
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-amber-100"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-display text-lg font-semibold">Register a child</h2>
        <div className="w-9" />
      </div>

      {/* ── Progress indicator ──────────────────────────────────── */}
      <div className="px-4 py-3 bg-white/60 backdrop-blur-sm shrink-0 border-b border-amber-100/50">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {STEPS.map((s, i) => {
            const isActive = s.key === step;
            const isDone = currentStepIdx > i;
            const Icon = s.icon;
            return (
              <div key={s.key} className="flex flex-col items-center gap-1 flex-1">
                <div className="flex items-center w-full">
                  {i > 0 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 -mr-1",
                        isDone || currentStepIdx >= i ? "bg-amber-400" : "bg-amber-100",
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors",
                      isActive
                        ? "bg-amber-400 text-amber-900 ring-2 ring-amber-400/30"
                        : isDone
                          ? "bg-amber-200 text-amber-800"
                          : "bg-amber-100 text-amber-400",
                    )}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 -ml-1",
                        currentStepIdx > i ? "bg-amber-400" : "bg-amber-100",
                      )}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium text-center hidden sm:block",
                    isActive ? "text-amber-900" : isDone ? "text-amber-700" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Step content (scrollable) ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-6 min-h-[300px]">
          <StepErrorBoundary key={step}>
          {step === "child" && (
            <ChildDetailsStep
              legalFirstName={legalFirstName}
              setLegalFirstName={setLegalFirstName}
              legalLastName={legalLastName}
              setLegalLastName={setLegalLastName}
              preferredName={preferredName}
              setPreferredName={setPreferredName}
              dob={dob}
              setDob={setDob}
              age={age}
              gender={gender}
              setGender={setGender}
              pronouns={pronouns}
              setPronouns={setPronouns}
              schoolGrade={schoolGrade}
              setSchoolGrade={setSchoolGrade}
              householdAddress={householdAddress}
              useSeparateAddress={useSeparateAddress}
              setUseSeparateAddress={setUseSeparateAddress}
              childAddress={childAddress}
              setChildAddress={setChildAddress}
            />
          )}

          {step === "guardian" && (
            <GuardianStep
              parentName={caregiverFullName(pc)}
              parentEmail={pc.email}
              guardianMode={guardianMode}
              setGuardianMode={setGuardianMode}
              activeCaregivers={activeCaregivers}
              selectedCaregiverId={selectedCaregiverId}
              setSelectedCaregiverId={setSelectedCaregiverId}
              guardianConfirmed={guardianConfirmed}
              setGuardianConfirmed={setGuardianConfirmed}
              guardianRelationship={guardianRelationship}
              setGuardianRelationship={setGuardianRelationship}
              newCaregiver={newCaregiver}
              setNewCaregiver={setNewCaregiver}
              isBillingContact={isBillingContact}
              setIsBillingContact={setIsBillingContact}
              isPickupContact={isPickupContact}
              setIsPickupContact={setIsPickupContact}
            />
          )}

          {step === "emergency" && (
            <EmergencyStep
              emergency={emergency}
              setEmergency={setEmergency}
              pickupContacts={pickupContacts}
              setPickupContacts={setPickupContacts}
            />
          )}

          {step === "medical" && (
            <MedicalStep
              medical={medical}
              setMedical={setMedical}
              physicianClinic={physicianClinic}
              setPhysicianClinic={setPhysicianClinic}
              medicalInfoConfirmed={medicalInfoConfirmed}
              setMedicalInfoConfirmed={setMedicalInfoConfirmed}
            />
          )}

          {step === "review" && (
            <ReviewStep
              legalFirstName={legalFirstName}
              legalLastName={legalLastName}
              preferredName={preferredName}
              dob={dob}
              age={age}
              gender={gender}
              pronouns={pronouns}
              schoolGrade={schoolGrade}
              guardianConfirmed={guardianConfirmed}
              guardianRelationship={guardianRelationship}
              guardianDisplayName={guardianDisplayName}
              emergency={emergency}
              pickupContacts={pickupContacts}
              medical={medical}
              physicianClinic={physicianClinic}
              medicalInfoConfirmed={medicalInfoConfirmed}
              childAddress={useSeparateAddress ? childAddress : undefined}
              householdAddress={!useSeparateAddress ? householdAddress : undefined}
            />
          )}
          </StepErrorBoundary>
        </div>
      </div>

      {/* ── Bottom nav ──────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-amber-200/40 bg-white/80 backdrop-blur-xl px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {currentStepIdx > 0 ? (
            <button
              onClick={goPrev}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-amber-50 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-amber-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}

          <div className="flex-1" />

          {step === "review" ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-soft transition-all",
                isSubmitting
                  ? "bg-amber-100 text-amber-400 cursor-not-allowed"
                  : "bg-amber-400 text-amber-900 hover:opacity-90",
              )}
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-amber-400 border-t-amber-900 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Submit registration
                </>
              )}
            </button>
          ) : (
            <button
              onClick={goNext}
              disabled={!canAdvance}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-soft transition-all",
                canAdvance
                  ? "bg-amber-400 text-amber-900 hover:opacity-90"
                  : "bg-amber-100 text-amber-400 cursor-not-allowed",
              )}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Step 1 — Child Details
   ═══════════════════════════════════════════════════════════════════ */

function ChildDetailsStep({
  legalFirstName, setLegalFirstName,
  legalLastName, setLegalLastName,
  preferredName, setPreferredName,
  dob, setDob,
  age,
  gender, setGender,
  pronouns, setPronouns,
  schoolGrade, setSchoolGrade,
  householdAddress,
  useSeparateAddress, setUseSeparateAddress,
  childAddress, setChildAddress,
}: {
  legalFirstName: string; setLegalFirstName: (v: string) => void;
  legalLastName: string; setLegalLastName: (v: string) => void;
  preferredName: string; setPreferredName: (v: string) => void;
  dob: string; setDob: (v: string) => void;
  age: number;
  gender: string; setGender: (v: string) => void;
  pronouns: string; setPronouns: (v: string) => void;
  schoolGrade: string; setSchoolGrade: (v: string) => void;
  householdAddress?: Address;
  useSeparateAddress: boolean; setUseSeparateAddress: (v: boolean) => void;
  childAddress: Address; setChildAddress: (v: Address) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
          <Baby className="h-6 w-6" />
        </div>
        <h3 className="mt-3 font-display text-xl font-semibold">Child details</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the child's legal name and date of birth. All fields marked * are required.
        </p>
      </div>

      {/* Legal names */}
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Legal first name *" value={legalFirstName} onChange={setLegalFirstName} placeholder="First name as on birth certificate" required />
          <Field label="Legal last name *" value={legalLastName} onChange={setLegalLastName} placeholder="Last name" required />
        </div>
        <Field label="Preferred name" value={preferredName} onChange={setPreferredName} placeholder="Nickname or name they go by" optional />
      </div>

      {/* DOB */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-1.5">
          <Calendar className="h-4 w-4 text-amber-500" />
          Date of birth *
        </label>
        <input
          type="date"
          value={dob}
          max={todayForInput()}
          onChange={(e) => setDob(e.target.value)}
          className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-3 px-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
        />
        {dob && (
          <p className="mt-1.5 text-sm text-muted-foreground">
            Age: <span className="font-semibold text-foreground">{age} {age === 1 ? "year" : "years"}</span> old
          </p>
        )}
      </div>

      {/* Optional: gender, pronouns, grade */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Additional details (optional)</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-xl border border-amber-200 bg-white py-3 px-4 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            >
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Field label="Pronouns" value={pronouns} onChange={setPronouns} placeholder="e.g. she/her, he/him, they/them" optional />
        </div>
        <Field label="School grade" value={schoolGrade} onChange={setSchoolGrade} placeholder="e.g. 3rd grade, Kindergarten" optional />
      </div>

      {/* Address inheritance */}
      <div className="rounded-2xl border border-amber-200/70 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-amber-500" />
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Address</h4>
        </div>

        {!useSeparateAddress ? (
          <>
            <div className="rounded-xl bg-success/5 border border-success/10 p-4">
              <p className="text-sm font-medium text-success mb-1">Inherits household address</p>
              {householdAddress ? (
                <AddressDisplay address={householdAddress} country={householdAddress.country} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No household address on file. {" "}
                  <span className="text-amber-600">Please add one in Family → Overview.</span>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setUseSeparateAddress(true)}
              className="text-xs font-medium text-amber-700 hover:text-amber-900 transition"
            >
              + Add a separate address for this child
            </button>
          </>
        ) : (
          <>
            <div className="rounded-xl bg-teal/5 border border-teal/10 p-4">
              <p className="text-sm font-medium text-teal mb-3">Separate child address</p>
              <ChildAddressForm address={childAddress} setAddress={setChildAddress} />
            </div>
            <button
              type="button"
              onClick={() => setUseSeparateAddress(false)}
              className="text-xs font-medium text-amber-700 hover:text-amber-900 transition"
            >
              ← Use household address instead
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Inline child address form ────────────────────────────────── */

function ChildAddressForm({
  address,
  setAddress,
}: {
  address: Address;
  setAddress: (a: Address) => void;
}) {
  const update = (patch: Partial<Address>) => setAddress({ ...address, ...patch });
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Country</label>
        <select
          value={address.country}
          onChange={(e) => update({ country: e.target.value as Address["country"] })}
          className="w-full rounded-lg border border-amber-200 bg-white py-2.5 px-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
        >
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="GB">United Kingdom</option>
          <option value="AU">Australia</option>
          <option value="NZ">New Zealand</option>
          <option value="IE">Ireland</option>
          <option value="EU">European Union</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <Field label="Address Line 1" value={address.line1} onChange={(v) => update({ line1: v })} placeholder="Address Line 1" />
      <Field label="Address Line 2" value={address.line2 ?? ""} onChange={(v) => update({ line2: v || undefined })} placeholder="Address Line 2" optional />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="City / Town" value={address.city} onChange={(v) => update({ city: v })} placeholder="City / Town" />
        <Field label="State / Province" value={address.stateOrProvince ?? ""} onChange={(v) => update({ stateOrProvince: v || undefined })} placeholder="State / Province" optional />
      </div>
      <Field label="Postal Code" value={address.postalCode} onChange={(v) => update({ postalCode: v })} placeholder="Postal Code" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Step 2 — Guardian Confirmation
   ═══════════════════════════════════════════════════════════════════ */

function GuardianStep({
  parentName, parentEmail,
  guardianMode, setGuardianMode,
  activeCaregivers,
  selectedCaregiverId, setSelectedCaregiverId,
  guardianConfirmed, setGuardianConfirmed,
  guardianRelationship, setGuardianRelationship,
  newCaregiver, setNewCaregiver,
  isBillingContact, setIsBillingContact,
  isPickupContact, setIsPickupContact,
}: {
  parentName: string; parentEmail: string;
  guardianMode: "self" | "existing" | "new"; setGuardianMode: (v: "self" | "existing" | "new") => void;
  activeCaregivers: Caregiver[];
  selectedCaregiverId: string; setSelectedCaregiverId: (v: string) => void;
  guardianConfirmed: boolean; setGuardianConfirmed: (v: boolean) => void;
  guardianRelationship: string; setGuardianRelationship: (v: string) => void;
  newCaregiver: { first_name: string; last_name: string; email: string; phone: string; relationship: string };
  setNewCaregiver: (v: { first_name: string; last_name: string; email: string; phone: string; relationship: string }) => void;
  isBillingContact: boolean; setIsBillingContact: (v: boolean) => void;
  isPickupContact: boolean; setIsPickupContact: (v: boolean) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal/10 text-teal">
          <Shield className="h-6 w-6" />
        </div>
        <h3 className="mt-3 font-display text-xl font-semibold">Guardian confirmation</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Select who will be the primary guardian for this child.
        </p>
      </div>

      {/* Guardian mode selector */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registered as</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <GuardianModeBtn
            mode="self"
            label="Myself"
            description="You are the guardian"
            current={guardianMode}
            onClick={() => setGuardianMode("self")}
          />
          <GuardianModeBtn
            mode="existing"
            label="Existing caregiver"
            description="Select from family"
            current={guardianMode}
            onClick={() => setGuardianMode("existing")}
            disabled={activeCaregivers.length === 0}
          />
          <GuardianModeBtn
            mode="new"
            label="Add new"
            description="Register a new caregiver"
            current={guardianMode}
            onClick={() => setGuardianMode("new")}
          />
        </div>
      </div>

      {/* Self mode */}
      {guardianMode === "self" && (
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-200 text-amber-700 font-semibold text-sm">
              {(parentName[0] ?? "") + (parentName.split(" ")[1]?.[0] ?? "")}
            </div>
            <div>
              <p className="font-semibold text-sm">{parentName}</p>
              <p className="text-xs text-muted-foreground">{parentEmail}</p>
            </div>
          </div>
        </div>
      )}

      {/* Existing caregiver mode */}
      {guardianMode === "existing" && (
        <div>
          <label className="text-sm font-medium text-foreground/80 block mb-1.5">
            Select caregiver
          </label>
          <select
            value={selectedCaregiverId}
            onChange={(e) => setSelectedCaregiverId(e.target.value)}
            className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-3 px-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
          >
            <option value="">— Select a caregiver —</option>
            {activeCaregivers.map((cg) => (
              <option key={cg.id} value={cg.id}>
                {caregiverFullName(cg)} ({cg.relationship_to_student})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* New caregiver mode */}
      {guardianMode === "new" && (
        <div className="rounded-2xl border border-amber-200/70 bg-white p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="h-4 w-4 text-teal" />
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">New caregiver</h4>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="First name *"
              value={newCaregiver.first_name}
              onChange={(v) => setNewCaregiver({ ...newCaregiver, first_name: v })}
              placeholder="First name"
              required
            />
            <Field
              label="Last name *"
              value={newCaregiver.last_name}
              onChange={(v) => setNewCaregiver({ ...newCaregiver, last_name: v })}
              placeholder="Last name"
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Email *"
              value={newCaregiver.email}
              onChange={(v) => setNewCaregiver({ ...newCaregiver, email: v })}
              placeholder="email@example.com"
              type="email"
              required
            />
            <Field
              label="Phone"
              value={newCaregiver.phone}
              onChange={(v) => setNewCaregiver({ ...newCaregiver, phone: v })}
              placeholder="+1 555 123-4567"
              type="tel"
              optional
            />
          </div>
        </div>
      )}

      {/* Relationship */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-1.5">
          <Users className="h-4 w-4 text-amber-500" />
          Relationship to child *
        </label>
        <select
          value={guardianRelationship}
          onChange={(e) => setGuardianRelationship(e.target.value)}
          className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-3 px-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
        >
          <option value="Parent">Parent</option>
          <option value="Legal guardian">Legal guardian</option>
          <option value="Authorized caregiver">Authorized caregiver</option>
          <option value="Grandparent">Grandparent</option>
          <option value="Foster parent">Foster parent</option>
          <option value="Other family member">Other family member</option>
        </select>
      </div>

      {/* Toggles */}
      <div className="rounded-2xl border border-amber-200/70 bg-white p-4 space-y-3">
        <ToggleRow
          label="Authorized for pickup"
          description="This guardian can pick up the child from the studio"
          checked={isPickupContact}
          onChange={setIsPickupContact}
        />
        <ToggleRow
          label="Billing contact"
          description="This guardian receives and can pay invoices"
          checked={isBillingContact}
          onChange={setIsBillingContact}
        />
      </div>

      {/* Consent checkbox */}
      <div className="rounded-2xl border border-amber-200/70 bg-white p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={guardianConfirmed}
            onChange={(e) => setGuardianConfirmed(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-amber-300 text-amber-500 accent-amber-500 focus:ring-amber-400"
          />
          <div>
            <p className="text-sm font-medium">
              I confirm the guardian information above is correct.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              By checking this box, you attest that the selected guardian has the legal authority for this child.
            </p>
          </div>
        </label>
      </div>

      {!guardianConfirmed && (
        <div className="flex items-start gap-2 rounded-xl bg-rose/5 border border-rose/10 p-3">
          <AlertTriangle className="h-4 w-4 text-rose shrink-0 mt-0.5" />
          <p className="text-sm text-rose">You must confirm the guardian before continuing.</p>
        </div>
      )}

      {guardianMode === "existing" && !selectedCaregiverId && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">Please select a caregiver from the dropdown above.</p>
        </div>
      )}
    </div>
  );
}

function GuardianModeBtn({
  mode, label, description, current, onClick, disabled,
}: {
  mode: string; label: string; description: string; current: string;
  onClick: () => void; disabled?: boolean;
}) {
  const isActive = current === mode;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-xl border p-3 text-left transition-all",
        isActive
          ? "border-amber-400 bg-amber-50 ring-1 ring-amber-400/30"
          : "border-amber-200/70 bg-white hover:bg-amber-50/50",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <p className={cn("text-sm font-semibold", isActive ? "text-amber-900" : "text-foreground")}>
        {label}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Step 3 — Emergency & Pickup
   ═══════════════════════════════════════════════════════════════════ */

function EmergencyStep({
  emergency, setEmergency,
  pickupContacts, setPickupContacts,
}: {
  emergency: EmergencyContact; setEmergency: (e: EmergencyContact) => void;
  pickupContacts: AuthorizedPickupContact[]; setPickupContacts: (list: AuthorizedPickupContact[]) => void;
}) {
  const updateEmergency = (patch: Partial<EmergencyContact>) =>
    setEmergency({ ...emergency, ...patch });

  const addPickup = () => {
    setPickupContacts([...pickupContacts, { name: "", relationship: "", phone: "", authorized: true }]);
  };

  const updatePickup = (idx: number, patch: Partial<AuthorizedPickupContact>) => {
    setPickupContacts(pickupContacts.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const removePickup = (idx: number) => {
    setPickupContacts(pickupContacts.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose/10 text-rose">
          <Phone className="h-6 w-6" />
        </div>
        <h3 className="mt-3 font-display text-xl font-semibold">Emergency contact</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Who should we contact if we can't reach you?
        </p>
      </div>

      {/* Emergency contact */}
      <div className="rounded-2xl border border-amber-200/70 bg-white p-5 space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Primary emergency contact</h4>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name *" value={emergency.name} onChange={(v) => updateEmergency({ name: v })} placeholder="Emergency contact name" required />
          <Field label="Relationship *" value={emergency.relationship} onChange={(v) => updateEmergency({ relationship: v })} placeholder="e.g. Grandmother, Aunt" required />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Phone *" value={emergency.phone} onChange={(v) => updateEmergency({ phone: v })} placeholder="+1 555 123-4567" type="tel" required />
          <Field label="Alternate phone" value={emergency.secondaryPhone ?? ""} onChange={(v) => updateEmergency({ secondaryPhone: v || undefined })} placeholder="+1 555 987-6543" type="tel" optional />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={emergency.canPickup}
            onChange={(e) => updateEmergency({ canPickup: e.target.checked })}
            className="h-5 w-5 shrink-0 rounded border-amber-300 text-amber-500 accent-amber-500"
          />
          <span className="text-sm text-muted-foreground">This person is authorized to pick up the child</span>
        </label>
      </div>

      {/* Authorized pickup contacts */}
      <div className="rounded-2xl border border-amber-200/70 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Authorized pickup</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Studio staff may only release the child to authorized pickup contacts.
            </p>
          </div>
          <button
            onClick={addPickup}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>

        {pickupContacts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No additional pickup contacts added. The primary guardian and emergency contact (if authorized) can pick up.
          </p>
        )}

        {pickupContacts.map((c, idx) => (
          <div key={idx} className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Pickup contact #{idx + 1}</span>
              <button onClick={() => removePickup(idx)} className="text-muted-foreground hover:text-rose transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name" value={c.name} onChange={(v) => updatePickup(idx, { name: v })} placeholder="Full name" />
              <Field label="Relationship" value={c.relationship} onChange={(v) => updatePickup(idx, { relationship: v })} placeholder="e.g. Grandfather, Nanny" />
            </div>
            <Field label="Phone" value={c.phone} onChange={(v) => updatePickup(idx, { phone: v })} placeholder="+1 555 123-4567" type="tel" />
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={c.authorized}
                onChange={(e) => updatePickup(idx, { authorized: e.target.checked })}
                className="h-5 w-5 shrink-0 rounded border-amber-300 text-amber-500 accent-amber-500"
              />
              <span className="text-sm">Authorized to pick up</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Step 4 — Medical & Safety
   ═══════════════════════════════════════════════════════════════════ */

function MedicalStep({
  medical, setMedical,
  physicianClinic, setPhysicianClinic,
  medicalInfoConfirmed, setMedicalInfoConfirmed,
}: {
  medical: ChildMedicalInfo; setMedical: (m: ChildMedicalInfo) => void;
  physicianClinic: string; setPhysicianClinic: (v: string) => void;
  medicalInfoConfirmed: boolean; setMedicalInfoConfirmed: (v: boolean) => void;
}) {
  const update = (patch: Partial<ChildMedicalInfo>) => setMedical({ ...medical, ...patch });

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Stethoscope className="h-6 w-6" />
        </div>
        <h3 className="mt-3 font-display text-xl font-semibold">Medical & safety</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Please provide accurate medical information. This is shared with instructors for safety.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200/70 bg-white p-5 space-y-4">
        {/* Allergies */}
        <div>
          <label className="text-sm font-medium text-foreground/80 block mb-1.5">Allergies</label>
          <input
            type="text"
            value={medical.allergies ?? ""}
            onChange={(e) => update({ allergies: e.target.value || undefined })}
            placeholder="e.g. Peanuts, dairy, bee stings, latex"
            className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-3 px-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
          />
        </div>

        {/* Medications */}
        <div>
          <label className="text-sm font-medium text-foreground/80 block mb-1.5">Medications</label>
          <input
            type="text"
            value={medical.medications ?? ""}
            onChange={(e) => update({ medications: e.target.value || undefined })}
            placeholder="e.g. Loratadine 5mg daily"
            className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-3 px-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
          />
        </div>

        {/* Medical conditions */}
        <div>
          <label className="text-sm font-medium text-foreground/80 block mb-1.5">Medical conditions</label>
          <textarea
            rows={2}
            value={medical.medicalConditions ?? ""}
            onChange={(e) => update({ medicalConditions: e.target.value || undefined })}
            placeholder="e.g. Eczema, epilepsy, heart condition"
            className="w-full rounded-xl border border-amber-200 bg-white py-3 px-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 resize-none"
          />
        </div>

        {/* Physician / Clinic — NEW */}
        <div>
          <label className="text-sm font-medium text-foreground/80 block mb-1.5">Physician / clinic</label>
          <input
            type="text"
            value={physicianClinic}
            onChange={(e) => setPhysicianClinic(e.target.value)}
            placeholder="e.g. Dr. Smith, City Medical Clinic"
            className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-3 px-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
          />
        </div>

        {/* Toggles */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Specific conditions</p>
          <ToggleRow label="Asthma" checked={medical.hasAsthma} onChange={(v) => update({ hasAsthma: v })} />
          <ToggleRow label="Uses an inhaler" checked={medical.hasInhaler} onChange={(v) => update({ hasInhaler: v })} />
          <ToggleRow label="Requires EpiPen" checked={medical.hasEpiPen} onChange={(v) => update({ hasEpiPen: v })} />
        </div>

        {/* Activity restrictions */}
        <div>
          <label className="text-sm font-medium text-foreground/80 block mb-1.5">Activity restrictions</label>
          <textarea
            rows={2}
            value={medical.activityRestrictions ?? ""}
            onChange={(e) => update({ activityRestrictions: e.target.value || undefined })}
            placeholder="e.g. No contact sports, limit jumping, wheelchair access needed"
            className="w-full rounded-xl border border-amber-200 bg-white py-3 px-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 resize-none"
          />
        </div>

        {/* Additional safety notes */}
        <div>
          <label className="text-sm font-medium text-foreground/80 block mb-1.5">Emergency notes</label>
          <textarea
            rows={2}
            value={medical.safetyNotes ?? ""}
            onChange={(e) => update({ safetyNotes: e.target.value || undefined })}
            placeholder="e.g. Becomes anxious in loud environments, needs encouragement to participate"
            className="w-full rounded-xl border border-amber-200 bg-white py-3 px-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 resize-none"
          />
        </div>
      </div>

      {/* Medical info confirmation */}
      <div className="rounded-2xl border border-amber-200/70 bg-white p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={medicalInfoConfirmed}
            onChange={(e) => setMedicalInfoConfirmed(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-amber-300 text-amber-500 accent-amber-500 focus:ring-amber-400"
          />
          <div>
            <p className="text-sm font-medium">
              I confirm this information is accurate and will update the studio if it changes.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Inaccurate medical information may put the child at risk. The studio relies on this information for participant safety.
            </p>
          </div>
        </label>
      </div>

      {!medicalInfoConfirmed && (
        <div className="flex items-start gap-2 rounded-xl bg-rose/5 border border-rose/10 p-3">
          <AlertTriangle className="h-4 w-4 text-rose shrink-0 mt-0.5" />
          <p className="text-sm text-rose">You must confirm the medical information before continuing.</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Step 5 — Review & Submit
   ═══════════════════════════════════════════════════════════════════ */

function ReviewStep({
  legalFirstName, legalLastName, preferredName, dob, age,
  gender, pronouns, schoolGrade,
  guardianConfirmed, guardianRelationship, guardianDisplayName,
  emergency, pickupContacts, medical,
  physicianClinic, medicalInfoConfirmed,
  childAddress, householdAddress,
}: {
  legalFirstName: string; legalLastName: string; preferredName: string;
  dob: string; age: number;
  gender: string; pronouns: string; schoolGrade: string;
  guardianConfirmed: boolean; guardianRelationship: string; guardianDisplayName: string;
  emergency: EmergencyContact; pickupContacts: AuthorizedPickupContact[];
  medical: ChildMedicalInfo; physicianClinic: string; medicalInfoConfirmed: boolean;
  childAddress?: Address; householdAddress?: Address;
}) {
  const displayDob = dob ? new Date(dob + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";
  const hasMedicalFlags = !!(medical.allergies || medical.medications || medical.medicalConditions || medical.hasAsthma || medical.hasEpiPen || medical.activityRestrictions || physicianClinic);

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
          <ClipboardList className="h-6 w-6" />
        </div>
        <h3 className="mt-3 font-display text-xl font-semibold">Review & submit</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Please review all information before submitting. You'll be prompted to complete waivers after registration.
        </p>
      </div>

      {/* Child info summary */}
      <ReviewSection icon={Baby} title="Child details">
        <ReviewRow label="Legal name" value={`${legalFirstName} ${legalLastName}`} />
        {preferredName && <ReviewRow label="Preferred name" value={preferredName} />}
        <ReviewRow label="Date of birth" value={`${displayDob} (${age} years)`} />
        {gender && <ReviewRow label="Gender" value={gender} />}
        {pronouns && <ReviewRow label="Pronouns" value={pronouns} />}
        {schoolGrade && <ReviewRow label="School grade" value={schoolGrade} />}
        {householdAddress && (
          <div className="mt-2 pt-2 border-t border-amber-100">
            <ReviewRow label="Address" value="Inherits household address" />
          </div>
        )}
        {childAddress && (
          <div className="mt-2 pt-2 border-t border-amber-100">
            <ReviewRow label="Address" value={`${childAddress.line1}, ${childAddress.city} ${childAddress.postalCode}`} />
          </div>
        )}
      </ReviewSection>

      {/* Guardian summary */}
      <ReviewSection icon={Shield} title="Guardian confirmation">
        <ReviewRow label="Guardian" value={guardianDisplayName} />
        <ReviewRow label="Relationship" value={guardianRelationship} />
        <ReviewRow label="Guardianship confirmed" value={guardianConfirmed ? "Yes ✓" : "No ✗"} warn={!guardianConfirmed} />
      </ReviewSection>

      {/* Emergency summary */}
      <ReviewSection icon={Phone} title="Emergency contact">
        <ReviewRow label="Name" value={emergency.name} />
        {emergency.relationship && <ReviewRow label="Relationship" value={emergency.relationship} />}
        <ReviewRow label="Phone" value={emergency.phone} />
        {emergency.secondaryPhone && <ReviewRow label="Alternate phone" value={emergency.secondaryPhone} />}
        <ReviewRow label="Can pick up child" value={emergency.canPickup ? "Yes" : "No"} />
        {pickupContacts.length > 0 && (
          <div className="mt-2 pt-2 border-t border-amber-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Authorized pickup contacts</p>
            {pickupContacts.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-sm py-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>{c.name} — {c.relationship} — {c.phone}</span>
                {c.authorized && <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </ReviewSection>

      {/* Medical summary */}
      <ReviewSection icon={Stethoscope} title="Medical & safety">
        {hasMedicalFlags ? (
          <>
            {medical.allergies && <ReviewRow label="Allergies" value={medical.allergies} em />}
            {medical.medications && <ReviewRow label="Medications" value={medical.medications} />}
            {medical.medicalConditions && <ReviewRow label="Conditions" value={medical.medicalConditions} />}
            {physicianClinic && <ReviewRow label="Physician / clinic" value={physicianClinic} />}
            <div className="flex flex-wrap gap-2 pt-1">
              {medical.hasAsthma && <FlagPill label="Asthma" em />}
              {medical.hasInhaler && <FlagPill label="Uses inhaler" em />}
              {medical.hasEpiPen && <FlagPill label="EpiPen required" em />}
            </div>
            {medical.activityRestrictions && <ReviewRow label="Restrictions" value={medical.activityRestrictions} em />}
            {medical.safetyNotes && <ReviewRow label="Emergency notes" value={medical.safetyNotes} />}
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-1">No medical conditions reported.</p>
        )}
        <ReviewRow label="Medical info confirmed" value={medicalInfoConfirmed ? "Yes ✓" : "No ✗"} warn={!medicalInfoConfirmed} />
      </ReviewSection>

      {/* Waiver notice */}
      <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4 flex items-start gap-3">
        <Signature className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Waivers will be required after registration</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            After submitting, you'll need to complete: liability waiver, emergency medical consent, photo/video consent, code of conduct, and privacy/data consent.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Shared mini-components
   ═══════════════════════════════════════════════════════════════════ */

function Field({
  label, value, onChange, placeholder, type, optional, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; type?: string; optional?: boolean; required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">
        {label}
        {optional && <span className="font-normal text-muted-foreground/60 ml-1">(optional)</span>}
        {required && <span className="text-rose ml-0.5">*</span>}
      </label>
      <input
        type={type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-3 px-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 placeholder:text-muted-foreground/50"
      />
    </div>
  );
}

function ToggleRow({
  label, description, checked, onChange,
}: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between py-2 px-3 rounded-lg bg-amber-50/60 cursor-pointer hover:bg-amber-50 transition">
      <div>
        <span className="text-sm">{label}</span>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 rounded border-amber-300 text-amber-500 accent-amber-500 shrink-0 ml-3"
      />
    </label>
  );
}

function ReviewSection({
  icon: Icon, title, children,
}: {
  icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-amber-200/70 bg-white p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-amber-500" />
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value, em, warn }: { label: string; value: string; em?: boolean; warn?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-1">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={cn(
        "text-sm font-medium text-right",
        em && "text-rose",
        warn && "text-rose font-semibold",
      )}>
        {value}
      </span>
    </div>
  );
}

function FlagPill({ label, em }: { label: string; em?: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
      em ? "bg-rose/10 text-rose border border-rose/20" : "bg-amber-100 text-amber-700 border border-amber-200",
    )}>
      <AlertTriangle className="h-3 w-3" />
      {label}
    </span>
  );
}
