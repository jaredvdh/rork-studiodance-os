import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Building2,
  Check,
  Heart,
  Home,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Shield,
  Star,
  Stethoscope,
  User,
  Wheat,
} from "lucide-react";
import type { FormEvent } from "react";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "@/data/store";
import { cn } from "@/lib/utils";
import { getFunctionUrl } from "@/lib/supabaseFunctions";

/* ── Types ─────────────────────────────────────────────────────────── */

interface AddressForm {
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface ChildForm {
  key: number;
  name: string;
  age: string;
  allergies: string;
  medicalNotes: string;
}

interface RegistrationForm {
  caregiverName: string;
  email: string;
  phone: string;
  password: string;
  address: AddressForm;
  children: ChildForm[];
}

const states = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

const totalSteps = 3;

/* ── Component ─────────────────────────────────────────────────────── */

interface InviteInfo {
  studioName: string;
  studioId: string;
  prefillEmail?: string;
}

export default function ParentRegister() {
  const { studio, updateStudio } = useStudio();
  const { user, signUpWithEmail, isSigningIn } = useAuth();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);

  // Resolve invite token on mount
  useEffect(() => {
    if (!inviteToken) {
      setInviteLoading(false);
      return;
    }
    let cancelled = false;
    async function resolveInvite() {
      try {
        const fnUrl = getFunctionUrl("get-invite");
        if (!fnUrl) { if (!cancelled) setInviteLoading(false); return; }
        const res = await fetch(`${fnUrl}?token=${encodeURIComponent(inviteToken!)}`);
        if (!res.ok) { if (!cancelled) setInviteLoading(false); return; }
        const data = await res.json();
        if (cancelled) return;
        setInviteInfo({
          studioName: data.studio.name,
          studioId: data.studio.id,
          prefillEmail: data.invite.email || undefined,
        });
        if (data.invite.email) {
          setForm((prev) => ({ ...prev, email: data.invite.email }));
        }
        updateStudio({
          name: data.studio.name,
          vertical: data.studio.vertical,
          city: data.studio.city,
        });
      } catch { /* invite check is non-blocking */
      } finally { if (!cancelled) setInviteLoading(false); }
    }
    resolveInvite();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteToken]);

  const effectiveStudioId = inviteInfo?.studioId || studio.id;

  const [form, setForm] = useState<RegistrationForm>({
    caregiverName: "",
    email: "",
    phone: "",
    password: "",
    address: { street: "", city: "", state: "OR", zip: "" },
    children: [{ key: Date.now(), name: "", age: "", allergies: "", medicalNotes: "" }],
  });

  const update = <K extends keyof RegistrationForm>(
    key: K,
    value: RegistrationForm[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const updateAddress = (key: keyof AddressForm, value: string) =>
    setForm((prev) => ({
      ...prev,
      address: { ...prev.address, [key]: value },
    }));

  const updateChild = (idx: number, key: keyof ChildForm, value: string) =>
    setForm((prev) => ({
      ...prev,
      children: prev.children.map((c, i) =>
        i === idx ? { ...c, [key]: value } : c,
      ),
    }));

  const addChildForm = () =>
    setForm((prev) => ({
      ...prev,
      children: [
        ...prev.children,
        { key: Date.now(), name: "", age: "", allergies: "", medicalNotes: "" },
      ],
    }));

  const removeChildForm = (idx: number) =>
    setForm((prev) => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== idx),
    }));

  const canAdvance = (): boolean => {
    if (step === 0) return form.caregiverName.trim() !== "" && form.email.trim() !== "" && form.password.length >= 6;
    if (step === 1) return form.address.street.trim() !== "" && form.address.city.trim() !== "";
    if (step === 2) return form.children.length > 0 && form.children.every((c) => c.name.trim() !== "" && c.age.trim() !== "");
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      setIsPersisting(true);
      setRegisterError(null);
      try {
        // 1. Create Supabase Auth account
        await signUpWithEmail(form.email.trim(), form.password, {
          name: form.caregiverName.trim(),
          role: "parent",
          studio_id: studio.id,
        });

        // signUpWithEmail doesn't throw on email-confirmation-required;
        // it sets the user only if a session was returned. If the user
        // is still null after signUp, email confirmation is needed.
        // We check below via the `user` from useAuth which updates reactively.

        // 2. Persist caregiver + children to Supabase (runs regardless of confirmation)
        const address = `${form.address.street}, ${form.address.city}, ${form.address.state} ${form.address.zip}`;
        const caregiverId = `cg_${Date.now()}`;
        const [firstName, ...lastParts] = form.caregiverName.trim().split(" ");
        await supabase.from("caregivers").insert({
          id: caregiverId,
          studio_id: effectiveStudioId,
          name: form.caregiverName.trim(),
          first_name: firstName,
          last_name: lastParts.join(" ") || firstName,
          email: form.email.trim(),
          phone: form.phone.trim(),
          address,
          city: form.address.city,
          state: form.address.state,
          zip: form.address.zip,
          child_ids: [],
          role: "primary_caregiver",
          status: "active",
          relationship_to_student: "Parent",
        });

        const childIds: string[] = [];
        for (const child of form.children) {
          if (!child.name.trim()) continue;
          const childId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          childIds.push(childId);
          await supabase.from("students").insert({
            id: childId,
            studio_id: effectiveStudioId,
            name: child.name.trim(),
            dob: new Date(new Date().getFullYear() - Number(child.age || "0"), 0, 1).toISOString(),
            caregiver_id: caregiverId,
            caregiver_name: form.caregiverName.trim(),
            caregiver_email: form.email.trim(),
            class_ids: [],
            attendance_rate: 1,
            waiver: "missing",
            payment: "paid",
            balance_cents: 0,
            medical_notes: child.medicalNotes || null,
            allergies: child.allergies || null,
          });
        }
        if (childIds.length > 0) {
          await supabase.from("caregivers").update({ child_ids: childIds }).eq("id", caregiverId);
        }

        setSubmitted(true);
      } catch (err) {
        console.error("Registration failed:", err);
        setRegisterError(err instanceof Error ? err.message : "Registration failed. Please try again.");
      } finally {
        setIsPersisting(false);
      }
    }
  };

  /* ── Confirmation ─────────────────────────────────────────────── */
  if (submitted) {
    const isLoggedIn = !!user;
    return (
      <div className="min-h-screen bg-parent flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="rounded-3xl border border-amber-200/70 bg-white p-10 shadow-lift text-center animate-float-up">
            <div className={cn(
              "mx-auto grid h-16 w-16 place-items-center rounded-full",
              isLoggedIn ? "bg-success shadow-glow" : "bg-amber-100",
            )}>
              {isLoggedIn ? (
                <Check className="h-8 w-8 text-white" />
              ) : (
                <Mail className="h-8 w-8 text-amber-600" />
              )}
            </div>
            <h1 className="mt-6 font-display text-2xl font-semibold">
              {isLoggedIn ? `Welcome to ${inviteInfo?.studioName || studio.name}!` : "Check your email"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {isLoggedIn
                ? `Your account has been created. You can now manage your ${form.children.length} child${form.children.length !== 1 ? "ren" : ""}'s classes, waivers, and payments.`
                : `We've sent a confirmation link to ${form.email.trim()}. Please verify your email to complete registration.`}
            </p>

            <div className="mt-6 space-y-2 rounded-xl bg-amber-50/60 p-4 text-left">
              {form.children.map((c) => (
                <div key={c.key} className="flex items-center gap-3 text-sm">
                  <Baby className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="font-medium">{c.name || "Unnamed"}</span>
                  <span className="text-muted-foreground">{c.age} yrs</span>
                </div>
              ))}
            </div>

            {isLoggedIn && (
              <>
                <p className="mt-4 text-xs text-muted-foreground">
                  Signed in as {user?.email ?? user?.name}
                </p>
                <Link
                  to="/parent"
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-amber-900 shadow-soft transition hover:opacity-90"
                >
                  Go to dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}

            {!isLoggedIn && (
              <Link
                to="/parent/login"
                className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-amber-200 bg-white px-6 py-3 text-sm font-semibold text-amber-700 shadow-soft transition hover:bg-amber-50 hover:border-amber-300"
              >
                Go to sign in
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Steps header ─────────────────────────────────────────────── */
  const stepTitles = ["Your details", "Home address", "Add children"];
  const stepIcons = [User, Home, Baby];
  const StepIcon = stepIcons[step];

  return (
    <div className="min-h-screen bg-parent flex flex-col items-center justify-center px-4 py-12">
      <Link
        to="/parent/login"
        className="mb-8 flex items-center gap-2.5 animate-float-up"
      >
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400 font-display text-lg font-semibold text-amber-900">
          {studio.initials}
        </div>
        <span className="font-display text-xl font-semibold tracking-tight">
          StudioFlow
        </span>
      </Link>

      <div className="w-full max-w-lg animate-float-up [animation-delay:80ms]">
        <div className="rounded-3xl border border-amber-200/70 bg-white p-8 shadow-lift">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className="flex-1 flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 rounded-full flex-1 transition-all duration-300",
                    i <= step ? "bg-amber-400" : "bg-amber-100",
                  )}
                />
                {i < totalSteps - 1 && (
                  <div
                    className={cn(
                      "h-2 rounded-full flex-1 transition-all duration-300",
                      i < step ? "bg-amber-400" : "bg-amber-100",
                    )}
                  />
                )}
              </div>
            ))}
            <span className="text-xs font-medium text-muted-foreground ml-1">
              {step + 1}/{totalSteps}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <StepIcon className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl font-semibold">
              {stepTitles[step]}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ── Step 0: Parent details ──────────────────────── */}
            {step === 0 && (
              <>
                <Field
                  icon={User}
                  label="Your name"
                  placeholder="Full name"
                  value={form.caregiverName}
                  onChange={(v) => update("caregiverName", v)}
                  autoFocus
                />
                <Field
                  icon={Mail}
                  label="Email address"
                  type="email"
                  placeholder="you@email.com"
                  value={form.email}
                  onChange={(v) => update("email", v)}
                />
                <Field
                  icon={Phone}
                  label="Phone number"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={form.phone}
                  onChange={(v) => update("phone", v)}
                />
                <Field
                  icon={Shield}
                  label="Password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={(v) => update("password", v)}
                  hint="Min 6 characters"
                />
              </>
            )}

            {/* ── Step 1: Address ─────────────────────────────── */}
            {step === 1 && (
              <>
                <Field
                  icon={MapPin}
                  label="Street address"
                  placeholder="123 Main St"
                  value={form.address.street}
                  onChange={(v) => updateAddress("street", v)}
                  autoFocus
                />
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Field
                      icon={MapPin}
                      label="City"
                      placeholder="Portland"
                      value={form.address.city}
                      onChange={(v) => updateAddress("city", v)}
                    />
                  </div>
                  <Field
                    icon={Star}
                    label="ZIP"
                    placeholder="97209"
                    value={form.address.zip}
                    onChange={(v) => updateAddress("zip", v)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                    State
                  </label>
                  <select
                    value={form.address.state}
                    onChange={(e) => updateAddress("state", e.target.value)}
                    className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-3 px-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
                  >
                    {states.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* ── Step 2: Children ────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-5">
                {form.children.map((child, idx) => (
                  <div
                    key={child.key}
                    className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-amber-800">
                        Child {idx + 1}
                      </h4>
                      {form.children.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChildForm(idx)}
                          className="text-xs font-medium text-rose hover:text-rose/80"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <Field
                      icon={Baby}
                      label="Full name"
                      placeholder="Child's name"
                      value={child.name}
                      onChange={(v) => updateChild(idx, "name", v)}
                      autoFocus={idx === 0}
                    />

                    <Field
                      icon={Star}
                      label="Age"
                      placeholder="e.g. 7"
                      value={child.age}
                      onChange={(v) => updateChild(idx, "age", v)}
                      helper="We'll place them in the right age group automatically"
                    />

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-1.5">
                        <Wheat className="h-4 w-4 text-amber-500" />
                        Allergies
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Peanuts, dairy, bee stings"
                        value={child.allergies}
                        onChange={(e) => updateChild(idx, "allergies", e.target.value)}
                        className="w-full rounded-xl border border-amber-200 bg-white py-3 px-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 placeholder:text-muted-foreground/50"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-1.5">
                        <Stethoscope className="h-4 w-4 text-amber-500" />
                        Medical notes
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Mild asthma — inhaler in bag"
                        value={child.medicalNotes}
                        onChange={(e) => updateChild(idx, "medicalNotes", e.target.value)}
                        className="w-full rounded-xl border border-amber-200 bg-white py-3 px-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 placeholder:text-muted-foreground/50 resize-none"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addChildForm}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-200 py-4 text-sm font-medium text-amber-600 transition hover:border-amber-400 hover:bg-amber-50/50"
                >
                  <Baby className="h-4 w-4" />
                  Add another child
                </button>
              </div>
            )}

            {/* ── Navigation ──────────────────────────────────── */}
            <div className="flex items-center justify-between pt-4">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-amber-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {registerError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-700">{registerError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!canAdvance() || isPersisting || isSigningIn}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-soft transition-all",
                  canAdvance() && !isPersisting && !isSigningIn
                    ? "bg-amber-400 text-amber-900 hover:opacity-90"
                    : "bg-amber-100 text-amber-400 cursor-not-allowed",
                )}
              >
                {isPersisting || isSigningIn ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : step < totalSteps - 1 ? (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Complete registration
                    <Heart className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/parent/login"
            className="font-medium text-amber-700 hover:text-amber-900"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ── Reusable field ─────────────────────────────────────────────────── */

function Field({
  icon: Icon,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  autoFocus,
  hint,
  helper,
}: {
  icon: typeof User;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  hint?: string;
  helper?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-1.5">
        <Icon className="h-4 w-4 text-amber-500" />
        {label}
        {hint && (
          <span className="text-xs font-normal text-muted-foreground">
            ({hint})
          </span>
        )}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-3 px-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 placeholder:text-muted-foreground/50"
      />
      {helper && (
        <p className="mt-1.5 text-xs text-muted-foreground">{helper}</p>
      )}
    </div>
  );
}
