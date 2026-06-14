import { useMemo, useState, useContext } from "react";
import {
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  History,
  Ruler,
  Signature,
  GraduationCap,
  KeyRound,
  Mail,
  Megaphone,
  Phone,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Stethoscope,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import InviteDialog from "@/components/InviteDialog";
import AddMemberModal from "@/components/AddMemberModal";

import { useEnrichedClasses, useStudents, useStudioData, useTerminology, CostumesContext } from "@/data/store";
import type { Caregiver, CaregiverStatus, ParentAccount, PaymentStatus, Student, StudentMeasurement, WaiverStatus } from "@/data/types";
import { caregiverFullName } from "@/data/types";
import { parentAccounts } from "@/data/demo";
import { ageFromDob, formatCurrency, formatDate, initials } from "@/lib/format";
import { classPriceInline } from "@/lib/classPricing";
import { formatCm, formatWeight } from "@/lib/locale";
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
  const { students, enrolStudentInClass, withdrawStudentFromClass } = useStudents();
  const classes = useEnrichedClasses();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const term = useTerminology();
  const [query, setQuery] = useState<string>("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Student | null>(null);
  const [enrolOpen, setEnrolOpen] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<"profile" | "measurements">("profile");
  const [csvToast, setCsvToast] = useState<string | null>(null);

  const rows = useMemo(() => {
    return students.filter((s) => {
      const q = query.toLowerCase();
      const match = s.name.toLowerCase().includes(q) || s.caregiverName.toLowerCase().includes(q);
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
          <h2 className="font-display text-3xl font-semibold tracking-tight">{term.participantPlural} &amp; Caregivers</h2>
          <p className="text-sm text-muted-foreground">{students.length} enrolled {term.participantPlural.toLowerCase()} across {students.reduce((a, s) => a + s.classIds.length, 0)} class spots</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border-2 border-gold/30 bg-gold/5 px-4 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/10 hover:border-gold/50"
          >
            <Megaphone className="h-4 w-4" /> Invite {term.guardianPlural}
          </button>
          <button
            onClick={() => { setCsvToast("CSV import coming soon — add members manually for now."); setTimeout(() => setCsvToast(null), 3000); }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-secondary"
          >
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <button
            onClick={() => setAddMemberOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-rose px-4 py-2.5 text-sm font-semibold text-rose-foreground shadow-soft transition hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" /> Add {term.participant.toLowerCase()}
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
            placeholder="Search by student or caregiver name…"
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
          <span>{term.participant}</span>
          <span>Caregiver / Guardian</span>
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
                <p className="truncate text-sm">{s.caregiverName}</p>
                <p className="truncate text-xs text-muted-foreground">{s.caregiverEmail}</p>
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
          {rows.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted-foreground">No {term.participantPlural.toLowerCase()} match your search.</p>}
        </div>
      </div>

      {/* Enrolment modal */}
      {enrolOpen && (
        <EnrolModal
          studentId={enrolOpen}
          students={students}
          classes={classes}
          onEnrol={enrolStudentInClass}
          onWithdraw={withdrawStudentFromClass}
          onClose={() => setEnrolOpen(null)}
        />
      )}

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
            <div className="px-6 pt-4 pb-0">
              {/* Drawer tabs */}
              <div className="flex gap-1 bg-secondary/40 rounded-xl p-1">
                {([
                  { key: "profile", label: "Profile", icon: Shield },
                  { key: "measurements", label: "Measurements", icon: Ruler },
                ] as const).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setDrawerTab(tab.key)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition",
                      drawerTab === tab.key
                        ? "bg-white shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            {drawerTab === "profile" ? (
            <div className="space-y-5 px-6 py-6">
              <DetailRow label="Caregiver / Guardian" value={selected.caregiverName} sub={selected.caregiverEmail} />
              <CaregiverSection student={selected} />
              <DetailRow label="Attendance rate" value={`${Math.round(selected.attendanceRate * 100)}%`} />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Enrolled classes</p>
                  <button
                    onClick={() => { setSelected(null); setEnrolOpen(selected.id); }}
                    className="inline-flex items-center gap-1 rounded-full bg-rose/10 px-3 py-1 text-xs font-semibold text-rose transition hover:bg-rose/20"
                  >
                    <Plus className="h-3 w-3" /> Enrol
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.classIds.map((id) => {
                    const cls = classes.find((c) => c.id === id);
                    return (
                      <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-medium">
                        {cls?.name ?? "Class"}
                        <button
                          onClick={(e) => { e.stopPropagation(); withdrawStudentFromClass(selected.id, id); }}
                          className="grid h-4 w-4 place-items-center rounded-full text-muted-foreground transition hover:text-rose"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                  {selected.classIds.length === 0 && (
                    <button
                      onClick={() => { setSelected(null); setEnrolOpen(selected.id); }}
                      className="rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:border-rose hover:text-rose"
                    >
                      <Plus className="mr-1 inline h-3 w-3" /> Enrol in a class
                    </button>
                  )}
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
            ) : (
            <MeasurementsTabPanel studentId={selected.id} />
            )}
          </div>
        </div>
      )}

      {/* CSV toast */}
      {csvToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-float-up rounded-full border border-border bg-card px-5 py-3 text-sm font-medium shadow-lift">
          {csvToast}
        </div>
      )}

      {/* Add member modal */}
      <AddMemberModal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
      />

      {/* Invite dialog */}
      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        term={term}
      />
    </div>
  );
}

/* ── Enrolment modal ──────────────────────────────────────────────── */

function EnrolModal({
  studentId,
  students,
  classes,
  onEnrol,
  onWithdraw,
  onClose,
}: {
  studentId: string;
  students: Student[];
  classes: { id: string; name: string; style: string; teacherId: string; enrolled: number; capacity: number; day: string; startTime: string; priceCents: number; pricingMode?: "price" | "included" | "none"; billingFrequency?: string; includedLabel?: string }[];
  onEnrol: (studentId: string, classId: string, forceWaitlist?: boolean) => void;
  onWithdraw: (studentId: string, classId: string) => void;
  onClose: () => void;
}) {
  const term = useTerminology();
  const student = students.find((s) => s.id === studentId);
  if (!student) return null;

  const enrolledIds = new Set(student.classIds);
  const availableClasses = classes.filter((c) => !enrolledIds.has(c.id));
  const currentClasses = classes.filter((c) => enrolledIds.has(c.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl border border-border/70 bg-card p-6 shadow-lift">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-xl font-semibold">Manage enrolments</h3>
            <p className="text-sm text-muted-foreground">{student.name}</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Currently enrolled */}
        {currentClasses.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Currently enrolled</p>
            <div className="space-y-1.5">
              {currentClasses.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg bg-success/5 border border-success/10 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.day} {c.startTime}{classPriceInline(c, formatCurrency) ? ` · ${classPriceInline(c, formatCurrency)}` : ""}</p>
                  </div>
                  <button
                    onClick={() => onWithdraw(studentId, c.id)}
                    className="shrink-0 rounded-full bg-rose/10 px-3 py-1 text-xs font-semibold text-rose transition hover:bg-rose/20"
                  >
                    Withdraw
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available to enrol */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Available classes</p>
          {availableClasses.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">{term.participant} is enrolled in all available classes.</p>
          ) : (
            <div className="space-y-1.5">
              {availableClasses.map((c) => {
                const full = c.enrolled >= c.capacity;
                return (
                  <div key={c.id} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.day} {c.startTime} · {c.enrolled}/{c.capacity}{classPriceInline(c, formatCurrency) ? ` · ${classPriceInline(c, formatCurrency)}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => onEnrol(studentId, c.id, full)}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition",
                        full
                          ? "bg-gold/15 text-gold hover:bg-gold/25"
                          : "bg-rose/10 text-rose hover:bg-rose/20",
                      )}
                    >
                      {full ? "Waitlist" : "Enrol"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button onClick={onClose} className="mt-5 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
          Done
        </button>
      </div>
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

/* ── Measurements tab panel in admin student drawer ──────────────── */

const MEASUREMENT_LABELS: { key: keyof StudentMeasurement; label: string; format: (v: number | undefined) => string }[] = [
  { key: "heightCm", label: "Height", format: (v) => formatCm(v, "metric") },
  { key: "weightKg", label: "Weight", format: (v) => formatWeight(v, "metric") },
  { key: "chestCm", label: "Chest", format: (v) => v != null ? `${Math.round(v)} cm` : "—" },
  { key: "waistCm", label: "Waist", format: (v) => v != null ? `${Math.round(v)} cm` : "—" },
  { key: "hipsCm", label: "Hips", format: (v) => v != null ? `${Math.round(v)} cm` : "—" },
  { key: "girthCm", label: "Girth", format: (v) => v != null ? `${Math.round(v)} cm` : "—" },
  { key: "inseamCm", label: "Inseam", format: (v) => v != null ? `${Math.round(v)} cm` : "—" },
];

const STATUS_COLORS: Record<string, string> = {
  approved: "bg-success/10 text-success border-success/20",
  pending: "bg-gold/15 text-gold border-gold/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  draft: "bg-muted text-muted-foreground border-border",
};

function MeasurementsTabPanel({ studentId, onBack }: { studentId: string; onBack?: () => void; onClose?: () => void }) {
  const costumesCtx = useContext(CostumesContext);
  const measurementRecord = costumesCtx?.measurementForStudent(studentId) ?? null;
  const historyList = costumesCtx?.measurementHistory(studentId) ?? [];

  if (!measurementRecord) {
    return (
      <div className="px-6 py-6 space-y-5">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <Ruler className="h-7 w-7" />
          </div>
          <h4 className="mt-3 font-display text-base font-semibold">No measurements on file</h4>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Measurements can be submitted by caregivers through the portal or entered by admin staff.
          </p>
        </div>
        <button onClick={onBack} className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
          Back to Profile
        </button>
      </div>
    );
  }

  const allMeasurements = historyList.length > 0 ? historyList : [measurementRecord];
  const latest = allMeasurements[0];
  const hasMultiple = allMeasurements.length > 1;

  return (
    <div className="space-y-5 px-6 py-6">
      {/* Latest measurement card */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Latest measurement
          </p>
          <span className={cn(
            "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
            STATUS_COLORS[latest.status] ?? STATUS_COLORS.draft,
          )}>
            {latest.status}
          </span>
        </div>
        <div className="rounded-xl border border-border/70 bg-white p-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {MEASUREMENT_LABELS.map(({ key, label, format }) => {
              const val = latest[key as keyof StudentMeasurement];
              return (
                <div key={key} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{format(val as number | undefined)}</span>
                </div>
              );
            })}
            {latest.shoeSize && (
              <div className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                <span className="text-muted-foreground">Shoe</span>
                <span className="font-medium">{latest.shoeSize}</span>
              </div>
            )}
          </div>
          {latest.measuredAt && (
            <p className="mt-3 text-xs text-muted-foreground">
              Measured {formatDate(latest.measuredAt, { month: "short", day: "numeric", year: "numeric" })}
              {latest.measuredBy && ` by ${latest.measuredBy}`}
              {latest.submittedBy && ` · Submitted by ${latest.submittedBy}`}
            </p>
          )}
        </div>
      </div>

      {/* Measurement history */}
      {hasMultiple && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Measurement history ({allMeasurements.length})
          </p>
          <div className="space-y-2">
            {allMeasurements.slice(1).map((m) => (
              <div key={m.id} className="rounded-xl border border-border/60 bg-secondary/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <History className="h-3 w-3" />
                    {formatDate(m.measuredAt ?? m.createdAt, { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <span className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    STATUS_COLORS[m.status] ?? STATUS_COLORS.draft,
                  )}>
                    {m.status}
                  </span>
                </div>
                {/* Growth delta */}
                {m.heightCm != null && latest.heightCm != null && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Height:</span>
                    <span className="font-medium">{formatCm(m.heightCm, "metric")}</span>
                    <span className={cn(
                      "text-[10px] font-medium",
                      latest.heightCm >= m.heightCm ? "text-success" : "text-rose",
                    )}>
                      {latest.heightCm >= m.heightCm ? "↑" : "↓"}{" "}
                      {Math.abs(latest.heightCm - m.heightCm).toFixed(1)} cm since
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onBack} className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
        Back to Profile
      </button>
    </div>
  );
}

/* ── Caregiver section in admin student drawer ────────────────────── */

const cgStatusMeta: Record<
  CaregiverStatus,
  { label: string; icon: typeof CheckCircle2; color: string }
> = {
  active: { label: "Active", icon: CheckCircle2, color: "bg-success/10 text-success border-success/20" },
  invited: { label: "Invited", icon: Clock, color: "bg-amber-100 text-amber-700 border-amber-200" },
  disabled: { label: "Disabled", icon: ShieldOff, color: "bg-muted text-muted-foreground border-border" },
  removed: { label: "Removed", icon: EyeOff, color: "bg-destructive/10 text-destructive border-destructive/20" },
};

function CaregiverMini({ caregiver, label }: { caregiver: Caregiver; label: string }) {
  const meta = cgStatusMeta[caregiver.status];
  const StatusIcon = meta.icon;
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", meta.color)}>
          <StatusIcon className="h-3 w-3" />{meta.label}
        </span>
      </div>
      <p className="text-sm font-semibold">{caregiverFullName(caregiver)}</p>
      <p className="text-xs text-muted-foreground">{caregiver.relationship_to_student}{caregiver.household_label ? ` · ${caregiver.household_label}` : ""}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Mail className="h-3 w-3" /><span className="truncate">{caregiver.email}</span></div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><Phone className="h-3 w-3" /><span>{caregiver.phone}</span></div>
      <div className="mt-3 flex flex-wrap gap-1">
        {caregiver.authorized_pickup && <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success"><KeyRound className="h-2.5 w-2.5" /> Pickup</span>}
        {caregiver.receives_emergency_messages && <span className="inline-flex items-center gap-1 rounded-full bg-rose/10 px-2 py-0.5 text-[10px] font-medium text-rose"><ShieldAlert className="h-2.5 w-2.5" /> Emergency</span>}
        {caregiver.can_view_billing && <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-medium text-gold"><Eye className="h-2.5 w-2.5" /> Billing</span>}
        {caregiver.can_view_medical_notes && <span className="inline-flex items-center gap-1 rounded-full bg-plum/10 px-2 py-0.5 text-[10px] font-medium text-plum"><Stethoscope className="h-2.5 w-2.5" /> Medical</span>}
        {caregiver.can_sign_waivers && <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-medium text-teal"><Signature className="h-2.5 w-2.5" /> Waivers</span>}
      </div>
      {(caregiver.custody_restriction || caregiver.court_order_on_file || caregiver.communication_only) && (
        <div className="mt-2 border-t border-border pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Admin flags</p>
          <div className="flex flex-wrap gap-1">
            {caregiver.custody_restriction && <span className="inline-flex items-center gap-1 rounded-full bg-rose/10 px-2 py-0.5 text-[10px] font-semibold text-rose"><ShieldAlert className="h-2.5 w-2.5" /> Custody restriction</span>}
            {caregiver.court_order_on_file && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700"><Shield className="h-2.5 w-2.5" /> Court order on file</span>}
            {caregiver.communication_only && <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"><Megaphone className="h-2.5 w-2.5" /> Communication only</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function CaregiverSection({ student }: { student: Student }) {
  const parentAcct: ParentAccount | undefined = parentAccounts.find((p) => p.id === student.caregiverId);
  if (!parentAcct) return null;
  const additional = parentAcct.additionalCaregivers ?? [];
  const allCaregivers = additional.filter((a) => a.status !== "removed");
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Caregivers</p>
      <div className="space-y-3">
        <CaregiverMini caregiver={parentAcct.primaryCaregiver} label="Primary caregiver" />
        {allCaregivers.map((cg, i) => (
          <CaregiverMini key={cg.id} caregiver={cg} label={cg.household_label ?? `Additional caregiver ${allCaregivers.length > 1 ? i + 1 : ""}`.trim()} />
        ))}
      </div>
    </div>
  );
}
