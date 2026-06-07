import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  EyeOff,
  Signature,
  Heart,
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
  Stethoscope,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { useParent, ParentLoadingSkeleton, NoCaregiverFound } from "@/data/parentStore";
import {
  type Caregiver,
  type CaregiverAuditEvent,
  type CaregiverPermissions,
  type CaregiverStatus,
  SAFE_SECONDARY_DEFAULTS,
  caregiverFullName,
} from "@/data/types";
import { cn } from "@/lib/utils";

/* ── Status helpers ──────────────────────────────────────────────── */

const statusMeta: Record<
  CaregiverStatus,
  { label: string; icon: typeof CheckCircle2; color: string }
> = {
  active: { label: "Active", icon: CheckCircle2, color: "bg-success/10 text-success border-success/20" },
  invited: { label: "Invited", icon: Clock, color: "bg-amber-100 text-amber-700 border-amber-200" },
  disabled: { label: "Disabled", icon: ShieldOff, color: "bg-muted text-muted-foreground border-border" },
  removed: { label: "Removed", icon: Trash2, color: "bg-destructive/10 text-destructive border-destructive/20" },
};

function StatusBadge({ status }: { status: CaregiverStatus }) {
  const m = statusMeta[status];
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        m.color,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {m.label}
    </span>
  );
}

/* ── Audit log entry ──────────────────────────────────────────────── */

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

function AuditEntry({ event }: { event: CaregiverAuditEvent }) {
  const [open, setOpen] = useState(false);
  const label = eventLabels[event.event] ?? event.event;
  return (
    <div className="text-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition hover:bg-amber-50"
      >
        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          {formatTimestamp(event.timestamp)}
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
      {open && event.details && (
        <p className="ml-9 mt-0.5 pb-2 text-xs text-muted-foreground">
          {event.details}
        </p>
      )}
    </div>
  );
}

/* ── Permission toggle chip ───────────────────────────────────────── */

function PermChip({
  label,
  checked,
  onChange,
  icon: Icon,
  disabled,
  tooltip,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  tooltip?: string;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      title={tooltip}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all",
        disabled && "cursor-not-allowed opacity-50",
        checked
          ? "border-amber-400 bg-amber-400 text-amber-900 shadow-sm"
          : "border-amber-200 bg-white text-muted-foreground hover:border-amber-300 hover:bg-amber-50",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
      {checked ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <div className="h-3.5 w-3.5 rounded-full border border-amber-200" />
      )}
    </button>
  );
}

/* ── Safety notice ────────────────────────────────────────────────── */

function SafetyNotice() {
  return (
    <div className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-200 text-amber-700">
          <Info className="h-4 w-4" />
        </div>
        <div>
          <h4 className="font-semibold text-amber-900">
            About caregiver access
          </h4>
          <ul className="mt-2 space-y-1.5 text-sm text-amber-800/80">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span>
                Each caregiver must have <strong>their own login</strong>.
                Shared family passwords are not supported.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span>
                Secondary caregivers start with{" "}
                <strong>safe default permissions</strong> and cannot access
                billing, medical notes, or enrolment controls unless explicitly
                granted by the primary caregiver.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span>
                The studio may <strong>override permissions</strong> for safety
                or legal reasons. Custody restrictions and court orders are
                never visible in the parent portal.
              </span>
            </li>
          </ul>
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

  const canSave =
    firstName.trim() !== "" && lastName.trim() !== "" && email.trim() !== "";

  const handleSave = () => {
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
  };

  return (
    <div className="animate-float-up rounded-2xl border-2 border-amber-300 bg-white p-6 shadow-lift">
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
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
              First name *
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
              Last name *
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
              Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
              Relationship to student
            </label>
            <input
              type="text"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="e.g. Parent, Guardian, Grandparent"
              className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
              Household label{" "}
              <span className="font-normal text-muted-foreground/60">
                (optional)
              </span>
            </label>
            <input
              type="text"
              value={household}
              onChange={(e) => setHousehold(e.target.value)}
              placeholder="e.g. Dad's house"
              className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
            />
          </div>
        </div>

        <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-4">
          <h4 className="text-sm font-semibold text-amber-900 mb-3">
            Default permissions for {firstName || "the caregiver"}
          </h4>
          <p className="text-xs text-amber-700/80 mb-3">
            These safe defaults will be applied. You can adjust them after the
            invitation is accepted.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              {
                label: "Announcements",
                checked: SAFE_SECONDARY_DEFAULTS.receives_announcements,
                icon: Megaphone,
              },
              {
                label: "Emergency",
                checked: SAFE_SECONDARY_DEFAULTS.receives_emergency_messages,
                icon: ShieldAlert,
              },
              {
                label: "View schedule",
                checked: SAFE_SECONDARY_DEFAULTS.can_view_schedule,
                icon: CalendarDays,
              },
            ].map((p) => (
              <span
                key={p.label}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                  p.checked
                    ? "border-success/20 bg-success/10 text-success"
                    : "border-amber-200 bg-white text-muted-foreground",
                )}
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
            onClick={handleSave}
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

/* ── Caregiver card ────────────────────────────────────────────────── */

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

  const perms = [
    {
      key: "receives_announcements" as const,
      label: "Announcements",
      icon: Megaphone,
      desc: "Receive studio-wide announcements and class updates",
    },
    {
      key: "receives_emergency_messages" as const,
      label: "Emergency alerts",
      icon: ShieldAlert,
      desc: "Receive urgent messages, closures, and safety alerts",
    },
    {
      key: "can_view_schedule" as const,
      label: "View schedule",
      icon: CalendarDays,
      desc: "See class times and locations",
    },
    {
      key: "can_view_billing" as const,
      label: "View billing",
      icon: Eye,
      desc: "See invoice amounts and payment history",
      sensitive: true,
    },
    {
      key: "can_pay_invoices" as const,
      label: "Pay invoices",
      icon: CreditCard,
      desc: "Make payments on behalf of the family",
      sensitive: true,
    },
    {
      key: "can_manage_enrolments" as const,
      label: "Manage enrolments",
      icon: Users,
      desc: "Add or drop classes for students",
      sensitive: true,
    },
    {
      key: "can_sign_waivers" as const,
      label: "Sign waivers",
      icon: Signature,
      desc: "Complete liability waivers for students",
      sensitive: true,
    },
    {
      key: "can_view_medical_notes" as const,
      label: "Medical notes",
      icon: Stethoscope,
      desc: "View allergies, medical conditions, and health notes",
      sensitive: true,
    },
    {
      key: "authorized_pickup" as const,
      label: "Authorized pickup",
      icon: KeyRound,
      desc: "Can pick up students from the studio",
      sensitive: true,
    },
  ];

  const visiblePerms = perms;

  return (
    <div
      className={cn(
        "animate-float-up rounded-2xl border bg-white shadow-soft overflow-hidden",
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
            isPrimary
              ? "bg-amber-400 text-amber-900"
              : "bg-amber-100 text-amber-700",
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
              <Mail className="h-3.5 w-3.5" />
              {caregiver.email}
            </span>
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {caregiver.phone}
            </span>
            {caregiver.household_label && (
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {caregiver.household_label}
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
            <>
              <button
                onClick={onDisable}
                className="rounded-full border border-amber-200 bg-white px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-amber-50 hover:text-rose inline-flex items-center gap-1.5"
              >
                <ShieldOff className="h-4 w-4" />
                Disable
              </button>
            </>
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
          {!isPrimary &&
            (status === "active" || status === "disabled") && (
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
              <p className="font-medium text-amber-900">
                Invitation pending
              </p>
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

      {/* Permission summary chips */}
      <div className="mx-5 mb-4 flex flex-wrap gap-1.5">
        {perms.slice(0, 3).map((p) => (
          <span
            key={p.key}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
              caregiver[p.key]
                ? "border-success/20 bg-success/10 text-success"
                : "border-muted bg-muted/40 text-muted-foreground",
            )}
          >
            <p.icon className="h-3 w-3" />
            {p.label}
          </span>
        ))}
        {perms.slice(3).some((p) => caregiver[p.key]) && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            + sensitive permissions
          </span>
        )}
      </div>

      {/* Expandable permission panel (non-primary only) */}
      {!isPrimary && onUpdatePermissions && (
        <div className="mx-5 mb-4">
          <button
            onClick={() => setShowPerms(!showPerms)}
            className="flex w-full items-center justify-between rounded-xl bg-amber-50/60 px-4 py-3 text-left text-sm font-medium transition hover:bg-amber-100/60"
          >
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-600" />
              Manage permissions
            </span>
            {showPerms ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {showPerms && (
            <div className="mt-3 space-y-3 px-1">
              <p className="text-xs text-muted-foreground px-1">
                Toggle each permission on or off. Sensitive permissions marked
                with{" "}
                <ShieldAlert className="inline h-3 w-3 text-amber-500" />.
              </p>
              {visiblePerms.map((p) => (
                <div
                  key={p.key}
                  className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm font-medium">{p.label}</span>
                      {p.sensitive && (
                        <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      )}
                    </div>
                    <p className="mt-0.5 ml-6 text-xs text-muted-foreground">
                      {p.desc}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      onUpdatePermissions({
                        [p.key]: !caregiver[p.key],
                      } as Partial<CaregiverPermissions>)
                    }
                    className={cn(
                      "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
                      caregiver[p.key] ? "bg-amber-400" : "bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                        caregiver[p.key]
                          ? "translate-x-6"
                          : "translate-x-0.5",
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Primary caregiver permission summary (read-only) */}
      {isPrimary && (
        <div className="mx-5 mb-4">
          <div className="rounded-xl bg-amber-50/60 px-4 py-3">
            <p className="text-sm font-medium text-amber-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Full access — primary caregiver
            </p>
            <p className="mt-0.5 text-xs text-amber-700/70">
              As the account owner, you have unrestricted access to all family
              features including billing, enrolment, medical notes, and waivers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────── */

export default function ParentCaregivers() {
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
    auditLog,
    isLoading,
    loadState,
  } = useParent();

  if (isLoading) return <ParentLoadingSkeleton lines={5} />;
  if (loadState === "empty" || !primaryCaregiver) return <NoCaregiverFound />;

  const [showInvite, setShowInvite] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  const visibleCaregivers = additionalCaregivers.filter((a) => a.status !== "removed");

  const handleInvite = (
    data: Omit<Caregiver, "id" | "status" | "role">,
  ) => {
    inviteCaregiver(data);
    setShowInvite(false);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4 animate-float-up">
        <div>
          <p className="text-sm text-muted-foreground">Family access</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Caregivers
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage who can access your family account and what they can see
          </p>
        </div>
      </div>

      {/* Safety notice */}
      <SafetyNotice />

      {/* Primary caregiver card */}
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

      {/* Invite form or add button */}
      {showInvite ? (
        <InviteForm
          onSave={handleInvite}
          onCancel={() => setShowInvite(false)}
        />
      ) : (
        <button
          onClick={() => setShowInvite(true)}
          className="animate-float-up flex items-center gap-3 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/30 p-5 text-left w-full transition hover:bg-amber-50/60"
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

      {/* Audit log */}
      {auditLog.length > 0 && (
        <div className="animate-float-up rounded-2xl border border-amber-200/70 bg-white shadow-soft overflow-hidden">
          <button
            onClick={() => setShowAudit(!showAudit)}
            className="flex w-full items-center justify-between p-5 text-left transition hover:bg-amber-50/50"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-display text-lg font-semibold">
                  Activity log
                </h4>
                <p className="text-sm text-muted-foreground">
                  {auditLog.length} caregiver event
                  {auditLog.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            {showAudit ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          {showAudit && (
            <div className="border-t border-amber-100 divide-y divide-amber-50 px-2 pb-3">
              {auditLog
                .slice()
                .reverse()
                .map((e) => (
                  <AuditEntry key={e.id} event={e} />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Re-import CalendarDays and CreditCard since they're used in the
 * InviteForm and CaregiverCard components. We import them inline. */
import { CalendarDays, CreditCard } from "lucide-react";
