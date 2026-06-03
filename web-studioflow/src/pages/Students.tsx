import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileSignature,
  KeyRound,
  Mail,
  Megaphone,
  Phone,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Stethoscope,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";

import { classById, useStudioData, useTerminology } from "@/data/store";
import type { Caregiver, CaregiverStatus, ParentAccount, PaymentStatus, Student, WaiverStatus } from "@/data/types";
import { caregiverFullName } from "@/data/types";
import { parentAccounts } from "@/data/demo";
import { ageFromDob, formatCurrency, initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const waiverBadge: Record<WaiverStatus, string> = {
  signed: "bg-success/10 text-success",
  pending: "bg-gold/15 text-gold",
  missing: "bg-destructive/10 text-destructive",
};
const payBadge: Record<PaymentStatus, string> = {
  paid: "bg-success/10 text-success",
  due: "bg-gold/15 text-gold",
  overdue: "bg-destructive/10 text-destructive",
};

type Filter = "all" | "waiver" | "overdue";

export default function Students() {
  const { students } = useStudioData();
  const term = useTerminology();
  const [query, setQuery] = useState<string>("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Student | null>(null);

  const rows = useMemo(() => {
    return students.filter((s) => {
      const q = query.toLowerCase();
      const match = s.name.toLowerCase().includes(q) || s.parentName.toLowerCase().includes(q);
      if (!match) return false;
      if (filter === "waiver") return s.waiver !== "signed";
      if (filter === "overdue") return s.payment === "overdue";
      return true;
    });
  }, [students, query, filter]);

  const counts = {
    all: students.length,
    waiver: students.filter((s) => s.waiver !== "signed").length,
    overdue: students.filter((s) => s.payment === "overdue").length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">{term.participantPlural} &amp; Parents</h2>
          <p className="text-sm text-muted-foreground">{students.length} enrolled {term.participantPlural.toLowerCase()} across {students.reduce((a, s) => a + s.classIds.length, 0)} class spots</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-secondary">
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <button className="inline-flex items-center gap-2 rounded-full bg-rose px-4 py-2.5 text-sm font-semibold text-rose-foreground shadow-soft transition hover:opacity-90">
            <UserPlus className="h-4 w-4" /> Add student
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student or parent name…"
            className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "waiver", "overdue"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3.5 py-2 text-sm font-medium capitalize transition",
                filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground/70 hover:bg-secondary",
              )}
            >
              {f === "all" ? "All" : f === "waiver" ? "Waiver needed" : "Overdue"} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
        <div className="hidden grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 border-b border-border/70 bg-secondary/40 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
          <span>Student</span>
          <span>Parent / Guardian</span>
          <span>Classes</span>
          <span>Attendance</span>
          <span>Waiver</span>
          <span className="text-right">Balance</span>
        </div>
        <div className="divide-y divide-border/60">
          {rows.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="grid w-full grid-cols-2 items-center gap-4 px-5 py-3.5 text-left transition hover:bg-secondary/40 md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto]"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose/10 text-sm font-semibold text-rose">{initials(s.name)}</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">Age {ageFromDob(s.dob)}</p>
                </div>
              </div>
              <div className="hidden min-w-0 md:block">
                <p className="truncate text-sm">{s.parentName}</p>
                <p className="truncate text-xs text-muted-foreground">{s.parentEmail}</p>
              </div>
              <span className="hidden text-sm text-foreground/70 md:block">{s.classIds.length} {s.classIds.length === 1 ? "class" : "classes"}</span>
              <span className="hidden md:block">
                <span className={cn("text-sm font-semibold", s.attendanceRate >= 0.85 ? "text-success" : s.attendanceRate >= 0.75 ? "text-gold" : "text-rose")}>
                  {Math.round(s.attendanceRate * 100)}%
                </span>
              </span>
              <span className="hidden md:block">
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", waiverBadge[s.waiver])}>{s.waiver}</span>
              </span>
              <div className="text-right">
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", payBadge[s.payment])}>
                  {s.balanceCents > 0 ? formatCurrency(s.balanceCents) : "Paid"}
                </span>
              </div>
            </button>
          ))}
          {rows.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted-foreground">No students match your search.</p>}
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="animate-float-up relative z-10 h-full w-full overflow-y-auto border-l border-border bg-card shadow-lift sm:max-w-md">
            <div className="bg-gradient-to-br from-rose/15 to-plum/10 px-6 pb-6 pt-8">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose text-xl font-semibold text-rose-foreground">{initials(selected.name)}</div>
              <h3 className="mt-4 font-display text-2xl font-semibold">{selected.name}</h3>
              <p className="text-sm text-muted-foreground">Age {ageFromDob(selected.dob)} · {selected.classIds.length} classes enrolled</p>
            </div>
            <div className="space-y-5 px-6 py-6">
              <DetailRow label="Parent / Guardian" value={selected.parentName} sub={selected.parentEmail} />
              <CaregiverSection student={selected} />
              <DetailRow label="Attendance rate" value={`${Math.round(selected.attendanceRate * 100)}%`} />
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Enrolled classes</p>
                <div className="flex flex-wrap gap-2">
                  {selected.classIds.map((id) => (
                    <span key={id} className="rounded-full bg-secondary px-3 py-1 text-sm font-medium">{classById(id)?.name ?? "Class"}</span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-secondary/40 p-3">
                  <p className="text-xs text-muted-foreground">Waiver</p>
                  <span className={cn("mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize", waiverBadge[selected.waiver])}>{selected.waiver}</span>
                </div>
                <div className="rounded-xl border border-border bg-secondary/40 p-3">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <span className={cn("mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold", payBadge[selected.payment])}>
                    {selected.balanceCents > 0 ? formatCurrency(selected.balanceCents) : "Paid"}
                  </span>
                </div>
              </div>
              {selected.medicalNotes && (
                <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gold">Medical note</p>
                  <p className="mt-1 text-sm text-foreground/80">{selected.medicalNotes}</p>
                </div>
              )}
              <button onClick={() => setSelected(null)} className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/* ── Caregiver section in admin student drawer ────────────────────── */

const cgStatusMeta: Record<
  CaregiverStatus,
  { label: string; icon: typeof CheckCircle2; color: string }
> = {
  active: {
    label: "Active",
    icon: CheckCircle2,
    color: "bg-success/10 text-success border-success/20",
  },
  invited: {
    label: "Invited",
    icon: Clock,
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  disabled: {
    label: "Disabled",
    icon: ShieldOff,
    color: "bg-muted text-muted-foreground border-border",
  },
  removed: {
    label: "Removed",
    icon: EyeOff,
    color: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

function CaregiverMini({
  caregiver,
  label,
}: {
  caregiver: Caregiver;
  label: string;
}) {
  const meta = cgStatusMeta[caregiver.status];
  const StatusIcon = meta.icon;

  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            meta.color,
          )}
        >
          <StatusIcon className="h-3 w-3" />
          {meta.label}
        </span>
      </div>
      <p className="text-sm font-semibold">{caregiverFullName(caregiver)}</p>
      <p className="text-xs text-muted-foreground">
        {caregiver.relationship_to_student}
        {caregiver.household_label ? ` · ${caregiver.household_label}` : ""}
      </p>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Mail className="h-3 w-3" />
        <span className="truncate">{caregiver.email}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <Phone className="h-3 w-3" />
        <span>{caregiver.phone}</span>
      </div>

      {/* Key permission flags */}
      <div className="mt-3 flex flex-wrap gap-1">
        {caregiver.authorized_pickup && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
            <KeyRound className="h-2.5 w-2.5" /> Pickup
          </span>
        )}
        {caregiver.receives_emergency_messages && (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose/10 px-2 py-0.5 text-[10px] font-medium text-rose">
            <ShieldAlert className="h-2.5 w-2.5" /> Emergency
          </span>
        )}
        {caregiver.can_view_billing && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-medium text-gold">
            <Eye className="h-2.5 w-2.5" /> Billing
          </span>
        )}
        {caregiver.can_view_medical_notes && (
          <span className="inline-flex items-center gap-1 rounded-full bg-plum/10 px-2 py-0.5 text-[10px] font-medium text-plum">
            <Stethoscope className="h-2.5 w-2.5" /> Medical
          </span>
        )}
        {caregiver.can_sign_waivers && (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-medium text-teal">
            <FileSignature className="h-2.5 w-2.5" /> Waivers
          </span>
        )}
      </div>

      {/* Admin-only flags */}
      {(caregiver.custody_restriction ||
        caregiver.court_order_on_file ||
        caregiver.communication_only) && (
        <div className="mt-2 border-t border-border pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Admin flags
          </p>
          <div className="flex flex-wrap gap-1">
            {caregiver.custody_restriction && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose/10 px-2 py-0.5 text-[10px] font-semibold text-rose">
                <ShieldAlert className="h-2.5 w-2.5" /> Custody restriction
              </span>
            )}
            {caregiver.court_order_on_file && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                <Shield className="h-2.5 w-2.5" /> Court order on file
              </span>
            )}
            {caregiver.communication_only && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                <Megaphone className="h-2.5 w-2.5" /> Communication only
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CaregiverSection({ student }: { student: Student }) {
  const parentAcct: ParentAccount | undefined = parentAccounts.find(
    (p) => p.id === student.parentId,
  );

  if (!parentAcct) return null;

  const additional = parentAcct.additionalCaregivers ?? [];
  const allCaregivers = additional.filter((a) => a.status !== "removed");

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Caregivers
      </p>
      <div className="space-y-3">
        <CaregiverMini
          caregiver={parentAcct.primaryCaregiver}
          label="Primary caregiver"
        />
        {allCaregivers.map((cg, i) => (
          <CaregiverMini
            key={cg.id}
            caregiver={cg}
            label={cg.household_label ?? `Additional caregiver ${allCaregivers.length > 1 ? i + 1 : ""}`.trim()}
          />
        ))}
      </div>
    </div>
  );
}
