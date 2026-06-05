import { useMemo, useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Baby,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  Signature,
  FileText,
  Heart,
  Home,
  Info,
  KeyRound,
  Mail,
  MailWarning,
  Megaphone,
  Phone,
  Plus,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Stethoscope,
  Trash2,
  UserPlus,
  Users,
  Wheat,
  X,
  Zap,
} from "lucide-react";

import { styleStyles, teacherName, useStudioData, useTeachers, useTerminology } from "@/data/store";
import { useParent } from "@/data/parentStore";
import {
  type AddressSource,
  type Caregiver,
  type CaregiverAuditEvent,
  type CaregiverPermissions,
  type CaregiverStatus,
  type FamilyContact,
  SAFE_SECONDARY_DEFAULTS,
  ADDRESS_SOURCE_LABELS,
  caregiverFullName,
  caregiverToContact,
  contactFullName,
  formatAddressMultiline,
  formatAddressShort,
  resolveAddressSource,
} from "@/data/types";
import { ageFromDob, formatDate } from "@/lib/format";
import { getCountryConfig } from "@/lib/locale";
import { cn } from "@/lib/utils";
import AddressForm, { AddressDisplay } from "@/components/AddressForm";
import ChildRegistrationWizard from "@/components/ChildRegistrationWizard";

/* ── Tab definitions ──────────────────────────────────────────────── */

const TABS = [
  { key: "overview", label: "Overview", icon: Heart },
  { key: "children", label: "Children", icon: Users },
  { key: "caregivers", label: "Caregivers", icon: Shield },
  { key: "medical", label: "Medical", icon: Stethoscope },
  { key: "waivers", label: "Waivers", icon: Signature },
  { key: "activity", label: "Activity", icon: Activity },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ── Permission presets ──────────────────────────────────────────── */

type PresetId = "communication_only" | "standard" | "full" | "emergency_only" | "custom";

interface Preset {
  id: PresetId;
  label: string;
  description: string;
  icon: typeof Megaphone;
  permissions: CaregiverPermissions;
}

const PERMISSION_PRESETS: Preset[] = [
  {
    id: "communication_only",
    label: "Communication only",
    description: "Receives announcements and emergency alerts. No access to schedules, billing, or student details.",
    icon: Megaphone,
    permissions: {
      receives_announcements: true,
      receives_emergency_messages: true,
      can_view_schedule: false,
      can_view_billing: false,
      can_pay_invoices: false,
      can_manage_enrolments: false,
      can_sign_waivers: false,
      can_view_medical_notes: false,
      authorized_pickup: false,
    },
  },
  {
    id: "standard",
    label: "Standard caregiver",
    description: "View schedules, receive updates, and see basic student info. Cannot access billing or medical notes.",
    icon: ShieldCheck,
    permissions: {
      receives_announcements: true,
      receives_emergency_messages: true,
      can_view_schedule: true,
      can_view_billing: false,
      can_pay_invoices: false,
      can_manage_enrolments: false,
      can_sign_waivers: true,
      can_view_medical_notes: false,
      authorized_pickup: true,
    },
  },
  {
    id: "full",
    label: "Full caregiver",
    description: "Full access to schedules, billing, enrolments, waivers, and medical notes. Equivalent to primary caregiver.",
    icon: Shield,
    permissions: {
      receives_announcements: true,
      receives_emergency_messages: true,
      can_view_schedule: true,
      can_view_billing: true,
      can_pay_invoices: true,
      can_manage_enrolments: true,
      can_sign_waivers: true,
      can_view_medical_notes: true,
      authorized_pickup: true,
    },
  },
  {
    id: "emergency_only",
    label: "Emergency contact only",
    description: "Only receives emergency messages. Can be authorized for pickup. No other access.",
    icon: ShieldAlert,
    permissions: {
      receives_announcements: false,
      receives_emergency_messages: true,
      can_view_schedule: false,
      can_view_billing: false,
      can_pay_invoices: false,
      can_manage_enrolments: false,
      can_sign_waivers: false,
      can_view_medical_notes: false,
      authorized_pickup: false,
    },
  },
];

/** Detect which preset matches the current permission set (or "custom" for none). */
function detectPreset(perms: CaregiverPermissions): PresetId {
  for (const p of PERMISSION_PRESETS) {
    if (
      perms.receives_announcements === p.permissions.receives_announcements &&
      perms.receives_emergency_messages === p.permissions.receives_emergency_messages &&
      perms.can_view_schedule === p.permissions.can_view_schedule &&
      perms.can_view_billing === p.permissions.can_view_billing &&
      perms.can_pay_invoices === p.permissions.can_pay_invoices &&
      perms.can_manage_enrolments === p.permissions.can_manage_enrolments &&
      perms.can_sign_waivers === p.permissions.can_sign_waivers &&
      perms.can_view_medical_notes === p.permissions.can_view_medical_notes &&
      perms.authorized_pickup === p.permissions.authorized_pickup
    ) {
      return p.id;
    }
  }
  return "custom";
}

/* ── Helpers ──────────────────────────────────────────────────────── */

function emptyContact(): FamilyContact {
  return {
    firstName: "",
    lastName: "",
    relationshipToStudent: "Parent",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    receivesEmails: true,
    receivesSMS: true,
    receivesBilling: false,
    emergencyContact: false,
  };
}

const statusMeta: Record<
  CaregiverStatus,
  { label: string; icon: typeof CheckCircle2; color: string }
> = {
  active: { label: "Active", icon: CheckCircle2, color: "bg-success/10 text-success border-success/20" },
  invited: { label: "Invited", icon: Clock, color: "bg-amber-100 text-amber-700 border-amber-200" },
  disabled: { label: "Disabled", icon: ShieldOff, color: "bg-muted text-muted-foreground border-border" },
  removed: { label: "Removed", icon: Trash2, color: "bg-destructive/10 text-destructive border-destructive/20" },
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ── Main Page ────────────────────────────────────────────────────── */

export default function ParentFamily() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const tabScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = tabScrollRef.current;
    if (!container) return;
    const activeEl = container.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeTab]);

  return (
    <div className="space-y-0 pb-20 lg:pb-0">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5 animate-float-up">
        <div>
          <p className="text-sm text-muted-foreground">Household management</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Family
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage children, caregivers, medical info, and waivers
          </p>
        </div>
      </div>

      {/* ── Sticky tab bar ────────────────────────────────────────── */}
      <div className="sticky top-16 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-0 bg-parent/90 backdrop-blur-xl border-b border-amber-200/40">
        <div
          ref={tabScrollRef}
          className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px"
        >
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              data-tab={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex items-center gap-2 shrink-0 rounded-t-xl px-4 py-3 text-sm font-medium transition-all border-b-2",
                activeTab === key
                  ? "border-amber-400 text-amber-900 bg-amber-50/80"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-amber-50/40",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────────── */}
      <div className="pt-6 animate-float-up">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "children" && <ChildrenTab />}
        {activeTab === "caregivers" && <CaregiversTab />}
        {activeTab === "medical" && <MedicalTab />}
        {activeTab === "waivers" && <WaiversTab />}
        {activeTab === "activity" && <ActivityTab />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Tab: Overview — Household snapshot & relationship map
   ═══════════════════════════════════════════════════════════════════ */

function OverviewTab() {
  const { parent, children: myStudents, primaryCaregiver, additionalCaregivers, updateCaregiver } = useParent();
  const { classes, students: allStudents } = useStudioData();
  const teachers = useTeachers().teachers;
  const term = useTerminology();

  const [showAddressEdit, setShowAddressEdit] = useState(false);

  const unsignedWaivers = useMemo(
    () => myStudents.filter((s) => s.waiver !== "signed"),
    [myStudents],
  );

  const allWaiversCurrent = unsignedWaivers.length === 0;
  const activeAdditional = additionalCaregivers.filter((a) => a.status === "active");
  const caregiverCount = 1 + activeAdditional.length;
  const totalEnrolments = myStudents.reduce((a, s) => a + s.classIds.length, 0);
  const medicalFlags = myStudents.filter((s) => s.allergies || s.medicalNotes).length;

  // Authorized pickup summary
  const pickupPeople: string[] = [];
  if (primaryCaregiver.authorized_pickup) pickupPeople.push(caregiverFullName(primaryCaregiver));
  for (const a of additionalCaregivers) {
    if (a.authorized_pickup && a.status === "active") {
      pickupPeople.push(caregiverFullName(a));
    }
  }

  // Separate-household caregivers
  const separateHouseholds = activeAdditional.filter(
    (a) => a.addressSource === "separate",
  );

  const householdAddress = parent.householdAddress;
  const billingAddress = parent.billingAddress;
  const hasBillingDiff = billingAddress && (
    !householdAddress ||
    billingAddress.line1 !== householdAddress.line1 ||
    billingAddress.city !== householdAddress.city ||
    billingAddress.postalCode !== householdAddress.postalCode
  );
  const countryCfg = householdAddress
    ? getCountryConfig(householdAddress.country)
    : getCountryConfig("US");

  // Recent activity: caregiver audit log
  const recentActivity = (parent.caregiverAuditLog ?? []).slice().reverse().slice(0, 4);

  return (
    <div className="space-y-6">
      {/* ── Household Summary card ───────────────────────────────── */}
      <div className="rounded-2xl border border-amber-200/70 bg-white shadow-soft overflow-hidden">
        <div className="bg-amber-50/60 px-6 py-4 border-b border-amber-100">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">
                {primaryCaregiver.first_name}'s household
              </h3>
              <p className="text-sm text-muted-foreground">
                {caregiverCount} caregiver{caregiverCount !== 1 ? "s" : ""} · {myStudents.length} {term.participant.toLowerCase()}{myStudents.length !== 1 ? "s" : ""} · {totalEnrolments} enrolment{totalEnrolments !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetaBadge
              icon={Users}
              label={term.participantPlural}
              value={String(myStudents.length)}
              color="amber"
            />
            <MetaBadge
              icon={Shield}
              label="Caregivers"
              value={String(caregiverCount)}
              color="teal"
            />
            <MetaBadge
              icon={Signature}
              label="Waivers"
              value={allWaiversCurrent ? "All signed" : `${unsignedWaivers.length} needed`}
              color={allWaiversCurrent ? "success" : "rose"}
            />
            <MetaBadge
              icon={Stethoscope}
              label="Medical flags"
              value={medicalFlags > 0 ? `${medicalFlags} flagged` : "None"}
              color={medicalFlags > 0 ? "rose" : "muted"}
            />
          </div>
        </div>
      </div>

      {/* ── Household Address card ───────────────────────────────── */}
      <div className="rounded-2xl border border-amber-200/70 bg-white shadow-soft overflow-hidden">
        <div className="bg-amber-50/60 px-6 py-4 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal/10 text-teal">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">
                Household Address
              </h3>
              <p className="text-xs text-muted-foreground">
                {householdAddress
                  ? `${householdAddress.city}, ${householdAddress.stateOrProvince ?? householdAddress.country} · ${countryCfg.name}`
                  : "No address on file"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddressEdit(!showAddressEdit)}
            className="rounded-full border border-amber-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
          >
            {showAddressEdit ? "Cancel" : "Edit"}
          </button>
        </div>
        <div className="p-5 sm:p-6">
          {showAddressEdit ? (
            <AddressForm
              address={householdAddress ?? undefined}
              defaultCountry={householdAddress?.country ?? "US"}
              onSave={(addr) => {
                updateCaregiver(primaryCaregiver.id, { address: addr });
                setShowAddressEdit(false);
              }}
              onCancel={() => setShowAddressEdit(false)}
            />
          ) : (
            <div className="space-y-3">
              <AddressDisplay address={householdAddress ?? null} country={householdAddress?.country} />
              {hasBillingDiff && billingAddress && (
                <div className="mt-3 rounded-xl bg-amber-50/60 border border-amber-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Billing Address
                  </p>
                  <AddressDisplay address={billingAddress} country={billingAddress.country} />
                </div>
              )}
              {parent.addressUpdatedAt && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-amber-50">
                  <Clock className="h-3 w-3" />
                  Last updated {formatDate(parent.addressUpdatedAt, { month: "short", day: "numeric", year: "numeric" })}
                  {parent.addressUpdatedBy && parent.addressUpdatedBy !== "admin"
                    ? ` by ${primaryCaregiver.first_name}`
                    : parent.addressUpdatedBy === "admin"
                      ? " by admin"
                      : ""}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Caregivers card ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-amber-200/70 bg-white shadow-soft overflow-hidden">
        <div className="bg-amber-50/60 px-6 py-4 border-b border-amber-100">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal/10 text-teal">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">Caregivers</h3>
              <p className="text-xs text-muted-foreground">
                {caregiverCount} total · {separateHouseholds.length} at separate address{separateHouseholds.length !== 1 ? "es" : ""}
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 sm:p-6 space-y-3">
          <CaregiverAddressRow
            caregiver={primaryCaregiver}
            householdAddress={householdAddress}
            isPrimary
          />
          {activeAdditional.map((cg) => (
            <CaregiverAddressRow
              key={cg.id}
              caregiver={cg}
              householdAddress={householdAddress}
            />
          ))}
          {additionalCaregivers.filter((a) => a.status === "invited").length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-4">
              <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {additionalCaregivers.filter((a) => a.status === "invited").length} invitation{additionalCaregivers.filter((a) => a.status === "invited").length !== 1 ? "s" : ""} pending
                </p>
                <p className="text-xs text-amber-600/80">
                  They'll appear here once they accept.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Students card ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-amber-200/70 bg-white shadow-soft overflow-hidden">
        <div className="bg-amber-50/60 px-6 py-4 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">{term.participantPlural}</h3>
              <p className="text-xs text-muted-foreground">
                {myStudents.length} registered · {totalEnrolments} enrolment{totalEnrolments !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const tab = document.querySelector('[data-tab="children"]') as HTMLElement | null;
              tab?.click();
            }}
            className="rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
          >
            View all
          </button>
        </div>
        <div className="p-5 sm:p-6 space-y-2">
          {myStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2 text-center">No children registered yet.</p>
          ) : (
            myStudents.map((s) => {
              const enrolledClasses = classes.filter((c) => s.classIds.includes(c.id));
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-xl bg-amber-50/60 px-4 py-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
                    {(s.name[0] ?? "")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ageFromDob(s.dob)} yrs · {enrolledClasses.length} class{enrolledClasses.length !== 1 ? "es" : ""}
                      {householdAddress && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px]">
                          <Home className="h-2.5 w-2.5" /> Inherits household address
                        </span>
                      )}
                    </p>
                  </div>
                  {s.waiver !== "signed" && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      Waiver
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Waiver & Medical strip ───────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Waiver compliance */}
        <div className="rounded-2xl border border-amber-200/70 bg-white shadow-soft p-5">
          <div className="flex items-center gap-2 mb-3">
            <Signature className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Waiver Status
            </h4>
          </div>
          {allWaiversCurrent ? (
            <div className="flex items-center gap-3 rounded-lg bg-success/5 px-3 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-success">All waivers signed</span>
            </div>
          ) : (
            <div className="space-y-2">
              {unsignedWaivers.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg bg-amber-50/60 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">{s.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      const tab = document.querySelector('[data-tab="waivers"]') as HTMLElement | null;
                      tab?.click();
                    }}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-900"
                  >
                    Sign →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medical flags */}
        <div className="rounded-2xl border border-amber-200/70 bg-white shadow-soft p-5">
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Medical Flags
            </h4>
          </div>
          {medicalFlags === 0 ? (
            <div className="flex items-center gap-3 rounded-lg bg-success/5 px-3 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-success">No medical flags</span>
            </div>
          ) : (
            <div className="space-y-2">
              {myStudents.filter((s) => s.allergies || s.medicalNotes).map((s) => (
                <div key={s.id} className="flex items-start gap-2 rounded-lg bg-amber-50/60 px-3 py-2.5">
                  {s.allergies && <Wheat className="h-4 w-4 text-rose shrink-0 mt-0.5" />}
                  {!s.allergies && <Stethoscope className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.allergies ?? s.medicalNotes}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Activity card ─────────────────────────────────── */}
      {recentActivity.length > 0 && (
        <div className="rounded-2xl border border-amber-200/70 bg-white shadow-soft overflow-hidden">
          <div className="bg-amber-50/60 px-6 py-4 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">Recent Activity</h3>
                <p className="text-xs text-muted-foreground">
                  Last {recentActivity.length} event{recentActivity.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
          <div className="p-5 sm:p-6 divide-y divide-amber-50">
            {recentActivity.map((event) => (
              <div key={event.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm">{event.details ?? event.event}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(event.timestamp, { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick actions ────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            action: () => {
              const tab = document.querySelector('[data-tab="children"]') as HTMLElement | null;
              tab?.click();
            },
            icon: Plus,
            label: "Add child",
            body: "Register a new student.",
            accent: "bg-amber-100 text-amber-700",
          },
          {
            action: () => {
              const tab = document.querySelector('[data-tab="caregivers"]') as HTMLElement | null;
              tab?.click();
            },
            icon: UserPlus,
            label: "Add caregiver",
            body: "Invite another parent or guardian.",
            accent: "bg-teal/10 text-teal",
          },
          {
            action: () => {
              const tab = document.querySelector('[data-tab="waivers"]') as HTMLElement | null;
              tab?.click();
            },
            icon: Signature,
            label: "Sign waivers",
            body: unsignedWaivers.length > 0
              ? `${unsignedWaivers.length} waiver${unsignedWaivers.length !== 1 ? "s" : ""} need attention.`
              : "All waivers are signed.",
            accent: unsignedWaivers.length > 0 ? "bg-rose/10 text-rose" : "bg-success/10 text-success",
          },
        ].map((link) => (
          <button
            key={link.label}
            onClick={link.action}
            className="rounded-2xl border border-amber-200/70 bg-white p-4 shadow-soft text-left transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <div className={cn("grid h-9 w-9 place-items-center rounded-lg", link.accent)}>
              <link.icon className="h-4 w-4" />
            </div>
            <h4 className="mt-2.5 font-display text-sm font-semibold">{link.label}</h4>
            <p className="mt-0.5 text-xs text-muted-foreground">{link.body}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Meta badge ───────────────────────────────────────────────────── */

function MetaBadge({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: "amber" | "teal" | "rose" | "success" | "muted";
  href?: string;
  tabArg?: string;
}) {
  const colorMap = {
    amber: "bg-amber-100 text-amber-700",
    teal: "bg-teal/10 text-teal",
    rose: "bg-rose/10 text-rose",
    success: "bg-success/10 text-success",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl bg-amber-50/60 p-3">
      <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", colorMap[color])}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-display text-base font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/* ── Caregiver address row ─────────────────────────────────────── */

function CaregiverAddressRow({
  caregiver,
  householdAddress,
  isPrimary,
}: {
  caregiver: Caregiver;
  householdAddress?: import("@/data/types").Address;
  isPrimary?: boolean;
}) {
  const src = caregiver.addressSource ?? resolveAddressSource(caregiver, householdAddress);
  const label = ADDRESS_SOURCE_LABELS[src] ?? "Address not specified";
  const sourceColors: Record<AddressSource, string> = {
    household: "bg-success/10 text-success border-success/20",
    separate: "bg-teal/10 text-teal border-teal/20",
    billing: "bg-gold/15 text-gold border-gold/20",
    emergency_only: "bg-muted text-muted-foreground border-border",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl bg-amber-50/60 px-4 py-3">
      <div
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-semibold",
          isPrimary ? "bg-amber-400 text-amber-900" : "bg-amber-100 text-amber-700",
        )}
      >
        {(caregiver.first_name[0] ?? "") + (caregiver.last_name[0] ?? "")}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">
          {caregiverFullName(caregiver)}
          {isPrimary && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
              Account owner
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {caregiver.relationship_to_student}
          {caregiver.household_label && ` \u00b7 ${caregiver.household_label}`}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium",
          sourceColors[src] ?? sourceColors.emergency_only,
        )}
      >
        <Home className="h-3 w-3" />
        {label}
      </span>
    </div>
  );
}

/* ── Relationship row ─────────────────────────────────────────────── */

function RelationshipRow({
  caregiver,
  isPrimary,
  myStudents,
}: {
  caregiver: Caregiver;
  isPrimary: boolean;
  myStudents: ReturnType<typeof useParent>["children"];
}) {
  const roleLabel = isPrimary ? "Primary caregiver" : "Secondary caregiver";
  const presetId = isPrimary ? "full" : detectPreset(caregiver);
  const preset = PERMISSION_PRESETS.find((p) => p.id === presetId);
  const PresetIcon = preset?.icon ?? Shield;

  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl font-semibold text-sm",
              isPrimary ? "bg-amber-400 text-amber-900" : "bg-amber-100 text-amber-700",
            )}
          >
            {(caregiver.first_name[0] ?? "") + (caregiver.last_name[0] ?? "")}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{caregiverFullName(caregiver)}</p>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                isPrimary ? "bg-amber-400/20 text-amber-800" : "bg-secondary text-muted-foreground",
              )}>
                {roleLabel}
              </span>
              {!isPrimary && preset && presetId !== "custom" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  <PresetIcon className="h-3 w-3" />
                  {preset.label}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {caregiver.relationship_to_student} · {caregiver.email}
            </p>
            {caregiver.household_label && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {caregiver.household_label}
              </p>
            )}
          </div>
        </div>
        {/* Connected children */}
        <div className="flex flex-wrap gap-1.5">
          {myStudents.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 rounded-full bg-white border border-amber-200 px-2.5 py-1 text-xs font-medium"
            >
              <Heart className="h-3 w-3 text-amber-400" />
              {s.name.split(" ")[0]}
            </span>
          ))}
        </div>
      </div>

      {/* Sensitive permission warnings */}
      {!isPrimary && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {caregiver.can_view_billing && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose/5 border border-rose/10 px-2 py-0.5 text-[10px] font-medium text-rose">
              <ShieldAlert className="h-3 w-3" />
              Billing access
            </span>
          )}
          {caregiver.can_view_medical_notes && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose/5 border border-rose/10 px-2 py-0.5 text-[10px] font-medium text-rose">
              <ShieldAlert className="h-3 w-3" />
              Medical access
            </span>
          )}
          {caregiver.can_manage_enrolments && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose/5 border border-rose/10 px-2 py-0.5 text-[10px] font-medium text-rose">
              <ShieldAlert className="h-3 w-3" />
              Enrolment control
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Tab: Children (compact redesign)
   ═══════════════════════════════════════════════════════════════════ */

function ChildrenTab() {
  const { classes } = useStudioData();
  const { teachers } = useTeachers();
  const { parent, children: myStudents, primaryContact, secondaryContact } = useParent();
  const householdAddress = parent?.householdAddress;

  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (myStudents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-500">
          <Baby className="h-8 w-8" />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold">
          No children added yet
        </h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Add your first child to get started with classes, waivers, and more.
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-900"
        >
          Add child
        </button>
        <ChildRegistrationWizard open={showAddModal} onClose={() => setShowAddModal(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {myStudents.length} {myStudents.length === 1 ? "child" : "children"} in your family
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold shadow-soft transition hover:bg-amber-50"
        >
          <Plus className="h-4 w-4" />
          Add child
        </button>
      </div>

      {myStudents.map((s, i) => {
        const isExpanded = expandedId === s.id;
        const enrolledClasses = classes.filter((c) =>
          s.classIds.includes(c.id),
        );
        const age = ageFromDob(s.dob);

        return (
          <div
            key={s.id}
            className="rounded-2xl border border-amber-200/70 bg-white shadow-soft overflow-hidden"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Compact header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : s.id)}
              className="w-full flex items-center gap-3 p-4 text-left transition hover:bg-amber-50/50"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                <Heart className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-semibold">{s.name}</h3>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {age} yrs
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {enrolledClasses.length} class
                  {enrolledClasses.length !== 1 ? "es" : ""} · DOB{" "}
                  {formatDate(s.dob, { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {s.waiver === "signed" ? (
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success hidden sm:inline-flex">
                    Signed
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 hidden sm:inline-flex">
                    Waiver
                  </span>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Expanded details — nested panels */}
            {isExpanded && (
              <div className="border-t border-amber-100 px-4 pb-4 space-y-4">
                {/* Classes */}
                <div className="pt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Enrolled classes
                  </h4>
                  {enrolledClasses.length > 0 ? (
                    <div className="space-y-1.5">
                      {enrolledClasses.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-3 rounded-lg bg-amber-50/60 px-3 py-2"
                        >
                          <span
                            className={cn("h-2 w-2 shrink-0 rounded-full", styleStyles[c.style].dot)}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{c.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {c.day} {c.startTime} · {teacherName(teachers, c.teacherId)} · {c.room}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-amber-50/60 px-3 py-3 text-center">
                      <p className="text-xs text-muted-foreground">Not enrolled in any classes yet.</p>
                    </div>
                  )}
                </div>

                {/* Attendance + Waiver inline */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-amber-50/60 px-3 py-2.5 flex items-center gap-3">
                    <CalendarClock className="h-4 w-4 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{Math.round(s.attendanceRate * 100)}%</p>
                      <p className="text-xs text-muted-foreground">Attendance (30d)</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-amber-50/60 px-3 py-2.5 flex items-center gap-3">
                    <Signature className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className={cn(
                        "text-sm font-medium",
                        s.waiver === "signed" ? "text-success" : s.waiver === "pending" ? "text-amber-600" : "text-rose",
                      )}>
                        {s.waiver === "signed" ? "Signed" : s.waiver === "pending" ? "Pending" : "Missing"}
                      </p>
                      <p className="text-xs text-muted-foreground">Waiver</p>
                    </div>
                  </div>
                </div>

                {/* Allergies / Medical (expandable) */}
                {(s.allergies || s.medicalNotes) && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Medical
                    </h4>
                    <div className="space-y-1.5">
                      {s.allergies && (
                        <div className="flex items-start gap-2 rounded-lg bg-rose/5 px-3 py-2">
                          <Wheat className="h-4 w-4 text-rose shrink-0 mt-0.5" />
                          <p className="text-sm font-medium text-rose">{s.allergies}</p>
                        </div>
                      )}
                      {s.medicalNotes && (
                        <div className="flex items-start gap-2 rounded-lg bg-amber-50/60 px-3 py-2">
                          <Stethoscope className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-sm">{s.medicalNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <ChildRegistrationWizard open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Tab: Caregivers — with presets & refined UX
   ═══════════════════════════════════════════════════════════════════ */

function CaregiversTab() {
  const {
    primaryCaregiver,
    additionalCaregivers,
    inviteCaregiver,
    acceptCaregiverInvite,
    resendCaregiverInvite,
    updateCaregiverPermissions,
    disableCaregiver,
    enableCaregiver,
    removeCaregiver,
  } = useParent();

  const [showInvite, setShowInvite] = useState(false);
  const visibleCaregivers = additionalCaregivers.filter((a) => a.status !== "removed");

  return (
    <div className="space-y-6">
      <SafetyNotice />

      {/* Primary caregiver */}
      <CaregiverCard caregiver={primaryCaregiver} isPrimary />

      {/* All additional caregivers */}
      {visibleCaregivers.map((cg) => (
        <CaregiverCard
          key={cg.id}
          caregiver={cg}
          isPrimary={false}
          onUpdatePermissions={(patch) => updateCaregiverPermissions(cg.id, patch)}
          onAcceptInvite={() => acceptCaregiverInvite(cg.id)}
          onResendInvite={() => resendCaregiverInvite(cg.id)}
          onDisable={() => disableCaregiver(cg.id)}
          onEnable={() => enableCaregiver(cg.id)}
          onRemove={() => removeCaregiver(cg.id)}
        />
      ))}

      {/* Invite form */}
      {showInvite ? (
        <InviteForm
          onSave={(data) => {
            inviteCaregiver(data);
            setShowInvite(false);
          }}
          onCancel={() => setShowInvite(false)}
        />
      ) : (
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/30 p-5 text-left w-full transition hover:bg-amber-50/60"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {visibleCaregivers.length > 0
                ? "Add another caregiver"
                : "Add a caregiver"}
            </p>
            <p className="text-xs text-amber-600/80">
              Invite another parent, guardian, or adult contact. They'll get their own login with permission-based access.
            </p>
          </div>
        </button>
      )}
    </div>
  );
}

/* ── Safety notice (compact) ──────────────────────────────────────── */

function SafetyNotice() {
  return (
    <div className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-4">
      <div className="flex items-start gap-3">
        <Info className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-800/80 space-y-1">
          <p>
            Each caregiver must have <strong>their own login</strong>. Shared family passwords are not supported.
          </p>
          <p>
            Secondary caregivers start with <strong>safe default permissions</strong>. Billing, medical notes, and enrolment controls require explicit approval.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Invite form ──────────────────────────────────────────────────── */

function InviteForm({
  onSave,
  onCancel,
}: {
  onSave: (data: Omit<Caregiver, "id" | "status" | "role">) => void;
  onCancel: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("Parent");
  const [household, setHousehold] = useState("");

  const canSave = firstName.trim() !== "" && lastName.trim() !== "" && email.trim() !== "";

  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-white p-6 shadow-lift">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-xl font-semibold">
          Invite a secondary caregiver
        </h3>
        <button
          onClick={onCancel}
          className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-amber-50"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <p className="mb-5 text-sm text-muted-foreground">
        Enter the details of the second parent, guardian, or adult contact. They
        will receive an invitation email and must create their own account.
      </p>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="First name *" value={firstName} onChange={setFirstName} placeholder="First name" />
          <Field label="Last name *" value={lastName} onChange={setLastName} placeholder="Last name" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Email *" value={email} onChange={setEmail} placeholder="email@example.com" type="email" />
          <Field label="Phone" value={phone} onChange={setPhone} placeholder="(555) 123-4567" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Relationship to student" value={relationship} onChange={setRelationship} placeholder="e.g. Parent, Guardian" />
          <Field label="Household label" value={household} onChange={setHousehold} placeholder="e.g. Dad's house" optional />
        </div>

        <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-4">
          <h4 className="text-sm font-semibold text-amber-900 mb-1">
            Safe default permissions applied
          </h4>
          <p className="text-xs text-amber-700/80 mb-3">
            The caregiver will start with "Standard caregiver" permissions. You can adjust after they accept.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "Announcements", icon: Megaphone },
              { label: "Emergency alerts", icon: ShieldAlert },
              { label: "View schedule", icon: CalendarClock },
              { label: "Sign waivers", icon: Signature },
              { label: "Authorized pickup", icon: KeyRound },
            ].map((p) => (
              <span
                key={p.label}
                className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success"
              >
                <p.icon className="h-3 w-3" />
                {p.label}
              </span>
            ))}
          </div>
        </div>

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
            onClick={() => {
              if (!canSave) return;
              onSave({
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                email: email.trim(),
                phone: phone.trim(),
                relationship_to_student: relationship.trim() || "Parent",
                household_label: household.trim() || undefined,
                address: undefined,
                ...SAFE_SECONDARY_DEFAULTS,
              });
            }}
            disabled={!canSave}
            className={cn(
              "flex-1 rounded-full py-2.5 text-sm font-semibold shadow-soft transition-all inline-flex items-center justify-center gap-2",
              canSave
                ? "bg-amber-400 text-amber-900 hover:opacity-90"
                : "bg-amber-100 text-amber-400 cursor-not-allowed",
            )}
          >
            <Mail className="h-4 w-4" />
            Send invitation
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
        {label}{" "}
        {optional && <span className="font-normal text-muted-foreground/60">(optional)</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
      />
    </div>
  );
}

/* ── Status badge ─────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: CaregiverStatus }) {
  const m = statusMeta[status];
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", m.color)}>
      <Icon className="h-3.5 w-3.5" />
      {m.label}
    </span>
  );
}

/* ── Caregiver card with presets ──────────────────────────────────── */

function CaregiverCard({
  caregiver,
  isPrimary,
  onUpdatePermissions,
  onAcceptInvite,
  onResendInvite,
  onDisable,
  onEnable,
  onRemove,
}: {
  caregiver: Caregiver;
  isPrimary: boolean;
  onUpdatePermissions?: (patch: Partial<CaregiverPermissions>) => void;
  onAcceptInvite?: () => void;
  onResendInvite?: () => void;
  onDisable?: () => void;
  onEnable?: () => void;
  onRemove?: () => void;
}) {
  const [showPerms, setShowPerms] = useState(false);
  const status = caregiver.status;
  const activePresetId = isPrimary ? "full" : detectPreset(caregiver);
  const activePreset = PERMISSION_PRESETS.find((p) => p.id === activePresetId);

  const perms = [
    { key: "receives_announcements" as const, label: "Announcements", icon: Megaphone, desc: "Receive studio-wide announcements and class updates" },
    { key: "receives_emergency_messages" as const, label: "Emergency alerts", icon: ShieldAlert, desc: "Receive urgent messages, closures, and safety alerts" },
    { key: "can_view_schedule" as const, label: "View schedule", icon: CalendarClock, desc: "See class times and locations" },
    { key: "can_view_billing" as const, label: "View billing", icon: Eye, desc: "See invoice amounts and payment history", sensitive: true },
    { key: "can_pay_invoices" as const, label: "Pay invoices", icon: CreditCard, desc: "Make payments on behalf of the family", sensitive: true },
    { key: "can_manage_enrolments" as const, label: "Manage enrolments", icon: Users, desc: "Add or drop classes for students", sensitive: true },
    { key: "can_sign_waivers" as const, label: "Sign waivers", icon: Signature, desc: "Complete liability waivers for students", sensitive: true },
    { key: "can_view_medical_notes" as const, label: "Medical notes", icon: Stethoscope, desc: "View allergies, medical conditions, and health notes", sensitive: true },
    { key: "authorized_pickup" as const, label: "Authorized pickup", icon: KeyRound, desc: "Can pick up students from the studio", sensitive: true },
  ];

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white shadow-soft overflow-hidden",
        isPrimary
          ? "border-amber-300"
          : status === "invited"
            ? "border-amber-200/70 border-dashed"
            : "border-amber-200/70",
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 p-5">
        <div
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-xl font-semibold text-sm",
            isPrimary ? "bg-amber-400 text-amber-900" : "bg-amber-100 text-amber-700",
          )}
        >
          {(caregiver.first_name[0] ?? "") + (caregiver.last_name[0] ?? "")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl font-semibold">
              {caregiverFullName(caregiver)}
            </h3>
            {isPrimary && (
              <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                Account owner
              </span>
            )}
            <StatusBadge status={status} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />{caregiver.email}
            </span>
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />{caregiver.phone}
            </span>
            {caregiver.household_label && (
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />{caregiver.household_label}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {!isPrimary && status === "invited" && (
            <>
              <button
                onClick={onAcceptInvite}
                className="rounded-full bg-success px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:opacity-90 inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                Simulate accept
              </button>
              <button
                onClick={onResendInvite}
                className="rounded-full border border-amber-200 bg-white px-3.5 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50 inline-flex items-center gap-1.5"
              >
                <RefreshCw className="h-4 w-4" />
                Resend
              </button>
            </>
          )}
          {!isPrimary && status === "active" && (
            <button
              onClick={onDisable}
              className="rounded-full border border-amber-200 bg-white px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-amber-50 hover:text-rose inline-flex items-center gap-1.5"
            >
              <ShieldOff className="h-4 w-4" />
              Disable
            </button>
          )}
          {!isPrimary && status === "disabled" && (
            <button
              onClick={onEnable}
              className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:opacity-90 inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" />
              Re-enable
            </button>
          )}
          {!isPrimary && (status === "active" || status === "disabled") && (
            <button
              onClick={onRemove}
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-rose/10 hover:text-rose"
              title="Remove caregiver"
              aria-label="Remove caregiver"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {!isPrimary && status === "invited" && (
            <button
              onClick={onRemove}
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-rose/10 hover:text-rose"
              title="Cancel invitation"
              aria-label="Cancel invitation"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Invitation status message */}
      {status === "invited" && (
        <div className="mx-5 mb-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="font-medium text-amber-900">Invitation pending</p>
              <p className="mt-0.5 text-sm text-amber-700/80">
                {caregiver.first_name} has been sent an invitation to{" "}
                {caregiver.email}. They need to accept and create their own
                account before they can access the portal.
              </p>
              {caregiver.invited_at && (
                <p className="mt-1 text-xs text-amber-600/60">
                  Invited {formatTimestamp(caregiver.invited_at)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Permission preset indicator ───────────────────────────── */}
      <div className="mx-5 mb-4">
        {isPrimary ? (
          <div className="rounded-xl bg-amber-50/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">Full access — primary caregiver</span>
            </div>
            <p className="mt-0.5 text-xs text-amber-700/70 ml-6">
              Unrestricted access to all family features including billing, enrolment, medical notes, and waivers.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-amber-50/60 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(() => {
                  const ActiveIcon = activePreset?.icon ?? Shield;
                  return <ActiveIcon className="h-4 w-4 text-amber-600" />;
                })()}
                <span className="text-sm font-medium text-amber-900">
                  {activePreset?.label ?? "Custom permissions"}
                </span>
              </div>
              {onUpdatePermissions && status === "active" && (
                <button
                  onClick={() => setShowPerms(!showPerms)}
                  className="text-xs font-medium text-amber-700 hover:text-amber-900 inline-flex items-center gap-1"
                >
                  {showPerms ? "Close" : "Manage"}
                  {showPerms ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
            {activePreset && (
              <p className="mt-0.5 text-xs text-amber-700/70 ml-6">
                {activePreset.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Permission presets (non-primary only) ─────────────────── */}
      {!isPrimary && onUpdatePermissions && showPerms && status === "active" && (
        <div className="mx-5 mb-4 space-y-4">
          {/* Preset selector */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">
              Permission preset
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {PERMISSION_PRESETS.map((preset) => {
                const PresetIcon = preset.icon;
                const isActive = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onUpdatePermissions(preset.permissions)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all",
                      isActive
                        ? "border-amber-400 bg-amber-50 ring-1 ring-amber-400/30"
                        : "border-amber-200/70 bg-white hover:bg-amber-50/50",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <PresetIcon className={cn("h-4 w-4", isActive ? "text-amber-600" : "text-muted-foreground")} />
                      <span className={cn("text-sm font-semibold", isActive ? "text-amber-900" : "text-foreground")}>
                        {preset.label}
                      </span>
                      {isActive && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 ml-auto" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Individual toggles for custom fine-tuning */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">
              Fine-tune permissions
            </p>
            <div className="space-y-1">
              {perms.map((p) => (
                <div
                  key={p.key}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition hover:bg-amber-50/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-sm font-medium">{p.label}</span>
                      {p.sensitive && (
                        <ShieldAlert className="h-3 w-3 shrink-0 text-amber-500" />
                      )}
                    </div>
                    <p className="mt-0.5 ml-5.5 text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                  <button
                    onClick={() =>
                      onUpdatePermissions({
                        [p.key]: !caregiver[p.key],
                      } as Partial<CaregiverPermissions>)
                    }
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                      caregiver[p.key] ? "bg-amber-400" : "bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                        caregiver[p.key] ? "translate-x-5.5" : "translate-x-0.5",
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Tab: Medical & Emergency
   ═══════════════════════════════════════════════════════════════════ */

function MedicalTab() {
  const { children: myStudents, primaryCaregiver, additionalCaregivers } = useParent();

  const studentsWithMedical = useMemo(
    () => myStudents.filter((s) => s.allergies || s.medicalNotes),
    [myStudents],
  );

  const emergencyContacts = useMemo(() => {
    const contacts: { name: string; phone: string; role: string; type: string }[] = [];
    contacts.push({
      name: caregiverFullName(primaryCaregiver),
      phone: primaryCaregiver.phone,
      role: primaryCaregiver.relationship_to_student,
      type: "Primary caregiver",
    });
    for (const a of additionalCaregivers) {
      if (a.status === "active") {
        contacts.push({
          name: caregiverFullName(a),
          phone: a.phone,
          role: a.relationship_to_student,
          type: a.household_label ?? "Additional caregiver",
        });
      }
    }
    return contacts;
  }, [primaryCaregiver, additionalCaregivers]);

  return (
    <div className="space-y-6">
      {/* Emergency contacts — compact */}
      <div>
        <h3 className="font-display text-lg font-semibold mb-3">Emergency contacts</h3>
        {emergencyContacts.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {emergencyContacts.map((c) => (
              <div key={c.name} className="rounded-xl border border-amber-200/70 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose/10 text-rose">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.role} · {c.type}</p>
                    <p className="text-sm font-medium text-amber-700 mt-0.5">{c.phone}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-amber-50/60 p-6 text-center">
            <ShieldAlert className="mx-auto h-8 w-8 text-amber-300" />
            <p className="mt-2 text-sm text-muted-foreground">
              No emergency contacts configured. Add caregivers in the Caregivers tab.
            </p>
          </div>
        )}
      </div>

      {/* Medical info per child — nested cards */}
      <div>
        <h3 className="font-display text-lg font-semibold mb-3">Medical information</h3>
        {myStudents.length === 0 ? (
          <div className="rounded-xl bg-amber-50/60 p-6 text-center">
            <Stethoscope className="mx-auto h-8 w-8 text-amber-300" />
            <p className="mt-2 text-sm text-muted-foreground">
              Add children to record allergies, medications, and medical notes.
            </p>
          </div>
        ) : studentsWithMedical.length === 0 ? (
          <div className="rounded-xl bg-amber-50/60 p-6 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-success/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              No medical conditions or allergies on file for any child.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {studentsWithMedical.map((s) => (
              <div key={s.id} className="rounded-2xl border border-amber-200/70 bg-white p-5 shadow-soft">
                <h4 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-amber-500" />
                  {s.name}
                </h4>
                <div className="space-y-2">
                  {s.allergies && (
                    <div className="flex items-start gap-3 rounded-lg bg-rose/5 px-3 py-2.5">
                      <Wheat className="h-4 w-4 text-rose shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-rose mb-0.5">Allergies</p>
                        <p className="text-sm font-medium text-rose">{s.allergies}</p>
                      </div>
                    </div>
                  )}
                  {s.medicalNotes && (
                    <div className="flex items-start gap-3 rounded-lg bg-amber-50/60 px-3 py-2.5">
                      <Stethoscope className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Medical notes</p>
                        <p className="text-sm">{s.medicalNotes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Authorized pickup */}
      <div>
        <h3 className="font-display text-lg font-semibold mb-3">Authorized pickup</h3>
        <div className="rounded-xl border border-amber-200/70 bg-white p-5">
          {(() => {
            const authorized = additionalCaregivers.filter((a) => a.authorized_pickup && a.status === "active");
            if (authorized.length > 0) {
              return (
                <div className="space-y-2">
                  {authorized.map((a) => (
                    <div key={a.id} className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-success/10 text-success">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{caregiverFullName(a)}</p>
                        <p className="text-xs text-muted-foreground">
                          Authorized for student pickup{a.household_label ? ` · ${a.household_label}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            }
            return (
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">No additional pickup authorizations</p>
                  <p className="text-xs text-muted-foreground">
                    Only the primary caregiver is authorized for pickup. Grant pickup
                    permissions to additional caregivers in the Caregivers tab.
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Tab: Waivers & Documents
   ═══════════════════════════════════════════════════════════════════ */

const waiverForms = [
  { id: "w1", title: "General Liability Waiver", description: "Standard liability release for class participation and studio premises.", required: true },
  { id: "w2", title: "Medical Information & Consent", description: "Emergency medical treatment authorization and health history.", required: true },
  { id: "w3", title: "Media & Photo Release", description: "Permission for the studio to use photos and videos for promotional purposes.", required: false },
  { id: "w4", title: "Recital Participation Agreement", description: "Terms for recital participation including costume costs and rehearsal requirements.", required: false },
];

function WaiversTab() {
  const { children: myStudents } = useParent();
  const [signingId, setSigningId] = useState<string | null>(null);

  const pendingStudents = useMemo(
    () => myStudents.filter((s) => s.waiver !== "signed"),
    [myStudents],
  );

  const signedStudents = useMemo(
    () => myStudents.filter((s) => s.waiver === "signed"),
    [myStudents],
  );

  const handleSign = (studentId: string) => {
    setSigningId(studentId);
    setTimeout(() => setSigningId(null), 1500);
  };

  if (myStudents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Signature className="h-12 w-12 text-muted-foreground/30" />
        <h3 className="mt-4 font-display text-xl font-semibold">No children to sign for</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your children first, then come back to sign waivers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compact status summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryStat
          icon={FileText}
          value={String(waiverForms.length)}
          label="Total forms"
          color="muted"
        />
        <SummaryStat
          icon={CheckCircle2}
          value={`${signedStudents.length}/${myStudents.length}`}
          label="Children complete"
          color="success"
        />
        <SummaryStat
          icon={Clock}
          value={String(pendingStudents.length)}
          label="Pending"
          color={pendingStudents.length > 0 ? "amber" : "muted"}
        />
      </div>

      {/* Waiver forms */}
      <div className="space-y-4">
        <h3 className="font-display text-lg font-semibold">Required forms</h3>
        {waiverForms.map((form, i) => (
          <div
            key={form.id}
            className="rounded-2xl border border-amber-200/70 bg-white p-5 shadow-soft"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="flex items-start gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                <Signature className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{form.title}</h4>
                  {form.required ? (
                    <span className="rounded-full bg-rose/10 px-2 py-0.5 text-xs font-semibold text-rose">Required</span>
                  ) : (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">Optional</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{form.description}</p>

                <div className="mt-4 space-y-1.5">
                  {myStudents.map((s) => {
                    const isSigned = s.waiver === "signed";
                    const isSigning = signingId === s.id;
                    return (
                      <div key={s.id} className="flex items-center justify-between rounded-lg bg-amber-50/60 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">{s.name}</span>
                        </div>
                        <div>
                          {isSigned ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                              <CheckCircle2 className="h-3 w-3" />Signed
                            </span>
                          ) : isSigning ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                              <Clock className="h-3 w-3 animate-spin" />Signing…
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSign(s.id)}
                              className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-amber-900 transition hover:opacity-90"
                            >
                              Sign now
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Signed history */}
      {signedStudents.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-semibold mb-3">Signed documents</h3>
          <div className="space-y-2">
            {signedStudents.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border border-amber-200/70 bg-white p-3">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.name} — All waivers signed</p>
                  <p className="text-xs text-muted-foreground">
                    Signed {formatDate(new Date().toISOString())} · IP logged
                  </p>
                </div>
                <button className="text-xs font-medium text-amber-700 hover:text-amber-900">
                  View PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryStat({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  color: "amber" | "success" | "muted";
}) {
  const iconColors = {
    amber: "bg-amber-100 text-amber-600",
    success: "bg-success/10 text-success",
    muted: "bg-muted text-muted-foreground",
  };
  const textColors = {
    amber: "text-foreground",
    success: "text-success",
    muted: "text-foreground",
  };
  return (
    <div className="rounded-2xl border border-amber-200/70 bg-white p-4 shadow-soft">
      <Icon className={cn("h-4 w-4 mb-2", iconColors[color].split(" ")[1])} />
      <p className={cn("font-display text-xl font-semibold", textColors[color])}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Tab: Activity
   ═══════════════════════════════════════════════════════════════════ */

const eventLabels: Record<string, string> = {
  caregiver_nominated: "Caregiver nominated",
  invitation_sent: "Invitation sent",
  invitation_accepted: "Invitation accepted",
  invitation_resent: "Invitation resent",
  permission_changed: "Permissions updated",
  caregiver_disabled: "Caregiver disabled",
  caregiver_enabled: "Caregiver re-enabled",
  caregiver_removed: "Caregiver removed",
  billing_access_changed: "Billing access changed",
  pickup_authorization_changed: "Pickup authorization changed",
  waiver_signed: "Waiver signed",
  enrolment_changed: "Enrolment changed",
};

function ActivityTab() {
  const { auditLog, children: myStudents } = useParent();

  const activities = useMemo(() => {
    const items: { id: string; timestamp: string; label: string; details?: string; icon: typeof Activity }[] = [];

    for (const e of auditLog) {
      items.push({
        id: e.id,
        timestamp: e.timestamp,
        label: eventLabels[e.event] ?? e.event,
        details: e.details,
        icon: Activity,
      });
    }

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return items;
  }, [auditLog]);

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Activity className="h-12 w-12 text-muted-foreground/30" />
        <h3 className="mt-4 font-display text-xl font-semibold">No activity yet</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Activity from caregiver invitations, permission changes, waiver signatures,
          and enrolment updates will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {activities.map((a) => (
        <div key={a.id} className="flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-amber-50/50">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700 mt-0.5">
            <a.icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{a.label}</p>
            {a.details && (
              <p className="mt-0.5 text-xs text-muted-foreground">{a.details}</p>
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatTimestamp(a.timestamp)}
          </span>
        </div>
      ))}
    </div>
  );
}
