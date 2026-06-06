import { useMemo, useState, useCallback } from "react";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  ChevronDown,
  Clock,
  DollarSign,
  Download,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Shield,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  X,
  Award,
  AlertTriangle,
  Upload,
} from "lucide-react";

import Modal from "@/components/Modal";
import { styleStyles, useClasses, useTeachers, useTerminology } from "@/data/store";
import type { ClassStyle, Teacher, InstructorStatus, Certification, InstructorDocument } from "@/data/types";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: InstructorStatus; label: string; color: string }[] = [
  { value: "active", label: "Active", color: "bg-teal/10 text-teal border-teal/20" },
  { value: "on_leave", label: "On Leave", color: "bg-gold/15 text-gold border-gold/20" },
  { value: "archived", label: "Archived", color: "bg-muted text-muted-foreground border-border" },
];

type Period = "weekly" | "biweekly" | "monthly";

const PERIOD_LABELS: Record<Period, string> = {
  weekly: "This week",
  biweekly: "Bi-weekly",
  monthly: "This month",
};

const PERIOD_MULTIPLIER: Record<Period, number> = {
  weekly: 1,
  biweekly: 2,
  monthly: 4.33,
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/* ── Helpers ───────────────────────────────────────────────────────── */

function weeklyHours(teacherId: string, classes: { teacherId: string; durationMins: number }[]): number {
  return classes.filter((c) => c.teacherId === teacherId).reduce((a, c) => a + c.durationMins, 0) / 60;
}

function payrollEstimate(teacher: Teacher, hours: number): number | null {
  if (!teacher.hourlyRateCents) return null;
  return Math.round(teacher.hourlyRateCents * hours * 4.33);
}

function formatHours(h: number): string {
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  if (mins === 0) return `${whole}h`;
  return `${whole}h ${mins}m`;
}

function formatCents(c: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
}

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("");
}

function grossPay(hours: number, rateCents: number, multiplier: number): number {
  return Math.round(hours * (rateCents / 100) * multiplier * 100);
}

function buildCsv(rows: PayRow[], period: Period): string {
  const header = "Name,Email,Pay Type,Period Hours,Hourly Rate,Gross Pay,Period Start,Period End";
  const today = new Date();
  const start = new Date(today);
  const diff = start.getDay() === 0 ? -6 : 1 - start.getDay();
  start.setDate(start.getDate() + diff);
  const end = new Date(start);
  if (period === "weekly") end.setDate(end.getDate() + 6);
  else if (period === "biweekly") end.setDate(end.getDate() + 13);
  else end.setMonth(end.getMonth() + 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const lines = rows.map((r) => {
    const hrs = formatHours(r.weeklyHrs * PERIOD_MULTIPLIER[period]).replace("h ", ".");
    const rate = (r.rateCents / 100).toFixed(2);
    const pay = (r.grossPayCents / 100).toFixed(2);
    return [r.name, r.email, r.payType === "1099" ? "1099 Contractor" : "Employee", hrs, rate, pay, fmt(start), fmt(end)].join(",");
  });
  return [header, ...lines].join("\n");
}

interface PayRow {
  id: string;
  name: string;
  email: string;
  rateCents: number;
  payType: string;
  weeklyHrs: number;
  classCount: number;
  grossPayCents: number;
}

/* ── Sub-components ────────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function SectionHeading({ icon: Icon, title }: { icon: typeof UserRound; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-rose/10 text-rose">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-2 py-1.5">
      <span className="w-28 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

/* ── Add/Edit Instructor Modal ─────────────────────────────────────── */

interface InstructorFormData {
  name: string;
  preferredName: string;
  email: string;
  phone: string;
  address: string;
  styles: ClassStyle[];
  status: InstructorStatus;
  hireDate: string;
  employeeId: string;
  certifications: Certification[];
  hourlyRateCents: number | undefined;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
}

function emptyForm(): InstructorFormData {
  return {
    name: "", preferredName: "", email: "", phone: "", address: "",
    styles: [], status: "active", hireDate: "", employeeId: "",
    certifications: [],
    hourlyRateCents: undefined,
    emergencyContactName: "", emergencyContactRelationship: "", emergencyContactPhone: "",
  };
}

function teacherToForm(t: Teacher): InstructorFormData {
  return {
    name: t.name,
    preferredName: t.preferredName ?? "",
    email: t.email,
    phone: t.phone ?? "",
    address: t.address ?? "",
    styles: [...t.styles],
    status: t.status,
    hireDate: t.hireDate ?? "",
    employeeId: t.employeeId ?? "",
    certifications: [...t.certifications],
    hourlyRateCents: t.hourlyRateCents,
    emergencyContactName: t.emergencyContact?.name ?? "",
    emergencyContactRelationship: t.emergencyContact?.relationship ?? "",
    emergencyContactPhone: t.emergencyContact?.phone ?? "",
  };
}

function InstructorModal({
  open,
  editingId,
  onClose,
  onSave,
}: {
  open: boolean;
  editingId: string | null;
  onClose: () => void;
  onSave: (form: InstructorFormData) => void;
}) {
  const { teachers } = useTeachers();
  const term = useTerminology();
  const [form, setForm] = useState<InstructorFormData>(emptyForm());

  useState(() => {
    if (editingId) {
      const t = teachers.find((x) => x.id === editingId);
      if (t) setForm(teacherToForm(t));
    } else {
      setForm(emptyForm());
    }
  });

  // Keep form in sync when editingId changes
  const [lastEditingId, setLastEditingId] = useState<string | null>(null);
  if (editingId !== lastEditingId) {
    setLastEditingId(editingId);
    if (editingId) {
      const t = teachers.find((x) => x.id === editingId);
      if (t) setForm(teacherToForm(t));
    } else {
      setForm(emptyForm());
    }
  }

  function toggleStyle(s: ClassStyle) {
    setForm((f) => ({
      ...f,
      styles: f.styles.includes(s) ? f.styles.filter((x) => x !== s) : [...f.styles, s],
    }));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingId ? `Edit ${term.instructor.toLowerCase()}` : `Add ${term.instructor.toLowerCase()}`}
      description={editingId ? "Update profile, teaching styles, and pay rate." : "Add a new instructor to your studio."}
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-secondary">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name.trim() || !form.email.trim() || form.styles.length === 0}
            className="rounded-full bg-rose px-5 py-2 text-sm font-semibold text-rose-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {editingId ? "Save changes" : `Add ${term.instructor.toLowerCase()}`}
          </button>
        </div>
      }
    >
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {/* Basic info */}
        <SectionHeading icon={UserRound} title="Basic Information" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name *">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Sarah Johnson"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
          </Field>
          <Field label="Preferred name">
            <input
              value={form.preferredName}
              onChange={(e) => setForm({ ...form, preferredName: e.target.value })}
              placeholder="e.g. Sarah"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email *">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="e.g. sarah@studio.com"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="e.g. (555) 123-4567"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
          </Field>
        </div>
        <Field label="Address">
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="e.g. 123 Main St, Portland, OR"
            className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
          />
        </Field>

        {/* Studio info */}
        <SectionHeading icon={Briefcase} title="Studio Information" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as InstructorStatus })}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Hire date">
            <input
              type="date"
              value={form.hireDate}
              onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
          </Field>
          <Field label="Employee ID">
            <input
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              placeholder="e.g. EMP-001"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
          </Field>
        </div>

        {/* Teaching styles */}
        <Field label={`${term.classStyle}s *`}>
          <div className="flex flex-wrap gap-2">
            {term.styleCategories.map((s) => {
              const active = form.styles.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStyle(s)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground/70 hover:bg-secondary",
                  )}
                >
                  {active && <Sparkles className="mr-1 inline h-3 w-3" />}
                  {s}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Pay */}
        <SectionHeading icon={DollarSign} title="Pay Rate" />
        <Field label="Hourly rate ($)">
          <input
            type="number"
            value={form.hourlyRateCents !== undefined ? (form.hourlyRateCents / 100).toFixed(2) : ""}
            onChange={(e) =>
              setForm({ ...form, hourlyRateCents: e.target.value ? Math.round(Number(e.target.value) * 100) : undefined })
            }
            placeholder="e.g. 45.00"
            className="w-full max-w-[160px] rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
          />
        </Field>

        {/* Emergency contact */}
        <SectionHeading icon={AlertTriangle} title="Emergency Contact" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Name">
            <input
              value={form.emergencyContactName}
              onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
              placeholder="e.g. Mark Johnson"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
          </Field>
          <Field label="Relationship">
            <input
              value={form.emergencyContactRelationship}
              onChange={(e) => setForm({ ...form, emergencyContactRelationship: e.target.value })}
              placeholder="e.g. Spouse"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              value={form.emergencyContactPhone}
              onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
              placeholder="e.g. (555) 999-8888"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

/* ── Instructor Detail — Profile Tab ───────────────────────────────── */

function ProfileTab({ teacher }: { teacher: Teacher }) {
  const status = STATUS_OPTIONS.find((s) => s.value === teacher.status) ?? STATUS_OPTIONS[0];
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-5 rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-rose/10 font-display text-2xl font-bold text-rose">
          {initials(teacher.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-2xl font-semibold">{teacher.preferredName || teacher.name}</h2>
            <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", status.color)}>
              {status.label}
            </span>
          </div>
          {teacher.preferredName && (
            <p className="text-sm text-muted-foreground">Legal name: {teacher.name}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            {teacher.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {teacher.email}
              </span>
            )}
            {teacher.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {teacher.phone}
              </span>
            )}
            {teacher.address && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {teacher.address}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Personal information */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <SectionHeading icon={UserRound} title="Personal Information" />
          <div className="space-y-0.5">
            <InfoRow label="Full name" value={teacher.name} />
            <InfoRow label="Preferred name" value={teacher.preferredName} />
            <InfoRow label="Email" value={teacher.email} />
            <InfoRow label="Phone" value={teacher.phone} />
            <InfoRow label="Address" value={teacher.address} />
          </div>
        </div>

        {/* Studio information */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <SectionHeading icon={Briefcase} title="Studio Information" />
          <div className="space-y-0.5">
            <InfoRow label="Status" value={status.label} />
            <InfoRow label="Hire date" value={teacher.hireDate} />
            <InfoRow label="Employee ID" value={teacher.employeeId} />
            <InfoRow label="Pay type" value={(teacher.payType ?? "employee") === "1099" ? "1099 Contractor" : "Employee"} />
            <InfoRow label="Hourly rate" value={teacher.hourlyRateCents ? formatCents(teacher.hourlyRateCents) : "Not set"} />
          </div>
        </div>

        {/* Emergency contact */}
        {(teacher.emergencyContact?.name || teacher.emergencyContact?.phone) && (
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <SectionHeading icon={AlertTriangle} title="Emergency Contact" />
            <div className="space-y-0.5">
              <InfoRow label="Name" value={teacher.emergencyContact?.name} />
              <InfoRow label="Relationship" value={teacher.emergencyContact?.relationship} />
              <InfoRow label="Phone" value={teacher.emergencyContact?.phone} />
            </div>
          </div>
        )}

        {/* Certifications */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <SectionHeading icon={Award} title="Certifications" />
          {teacher.certifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No certifications on file.</p>
          ) : (
            <div className="space-y-2.5">
              {teacher.certifications.map((cert, i) => (
                <div key={i} className="rounded-xl border border-border/60 bg-secondary/30 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{cert.name}</p>
                    {cert.expiresAt && (
                      <span className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        new Date(cert.expiresAt) < new Date()
                          ? "bg-rose/10 text-rose"
                          : new Date(cert.expiresAt) < new Date(Date.now() + 90 * 864e5)
                            ? "bg-gold/15 text-gold"
                            : "bg-teal/10 text-teal",
                      )}>
                        {new Date(cert.expiresAt) < new Date()
                          ? "Expired"
                          : `Expires ${new Date(cert.expiresAt).toLocaleDateString()}`}
                      </span>
                    )}
                  </div>
                  {cert.notes && <p className="mt-0.5 text-xs text-muted-foreground">{cert.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Instructor Detail — Classes Tab ───────────────────────────────── */

function ClassesTab({ teacher }: { teacher: Teacher }) {
  const { classes } = useClasses();
  const term = useTerminology();
  const assignedClasses = useMemo(() => classes.filter((c) => c.teacherId === teacher.id), [classes, teacher.id]);
  const hours = weeklyHours(teacher.id, classes);

  const classCount = assignedClasses.length;
  const thisMonth = new Date().getMonth();
  const monthlyCount = assignedClasses.filter(() => true).length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-teal/20 bg-teal/5 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned classes</p>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-teal/10 text-teal"><GraduationCap className="h-4 w-4" /></div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight text-teal">{classCount}</p>
          <p className="text-xs text-muted-foreground">classes this semester</p>
        </div>
        <div className="rounded-2xl border border-plum/20 bg-plum/5 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weekly hours</p>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-plum/10 text-plum"><Clock className="h-4 w-4" /></div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight text-plum">{formatHours(hours)}</p>
          <p className="text-xs text-muted-foreground">teaching per week</p>
        </div>
        <div className="rounded-2xl border border-rose/20 bg-rose/5 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly classes</p>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-rose/10 text-rose"><Calendar className="h-4 w-4" /></div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight text-rose">{monthlyCount}</p>
          <p className="text-xs text-muted-foreground">this month</p>
        </div>
      </div>

      {/* Class list */}
      <div className="rounded-2xl border border-border/70 bg-card shadow-soft overflow-hidden">
        <div className="border-b border-border/60 bg-secondary/40 px-6 py-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned {term.classPlural.toLowerCase()}</span>
        </div>
        {assignedClasses.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary">
              <GraduationCap className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No classes assigned yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {assignedClasses.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition hover:bg-secondary/20">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", styleStyles[c.style].dot)} />
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.style} · {c.ageGroup}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium tabular-nums">{c.day}</span>
                  <span className="tabular-nums text-muted-foreground">{c.startTime} · {c.durationMins}m</span>
                  <span className="text-xs text-muted-foreground">{c.room}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule mini-calendar */}
      {assignedClasses.length > 0 && (
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <SectionHeading icon={Calendar} title="Weekly Schedule" />
          <div className="grid grid-cols-7 gap-2 text-center">
            {DAYS.map((day) => {
              const dayClasses = assignedClasses.filter((c) => c.day === day);
              return (
                <div key={day} className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{day}</p>
                  {dayClasses.length === 0 ? (
                    <div className="rounded-lg bg-secondary/30 py-3 text-xs text-muted-foreground">—</div>
                  ) : (
                    dayClasses.map((c) => (
                      <div key={c.id} className="rounded-lg bg-rose/10 px-1.5 py-2">
                        <p className="text-[11px] font-semibold text-rose leading-tight">{c.startTime}</p>
                        <p className="text-[10px] text-rose/70 leading-tight truncate">{c.name}</p>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Instructor Detail — Availability Tab ──────────────────────────── */

function AvailabilityTab({ teacher }: { teacher: Teacher }) {
  const [availability, setAvailability] = useState<Record<string, "available" | "unavailable" | "preferred">>(
    DAYS.reduce((acc, d) => ({ ...acc, [d]: d === "Sun" ? "unavailable" : "available" }), {}),
  );

  const statusColor: Record<string, string> = {
    available: "bg-teal/10 text-teal border-teal/20",
    unavailable: "bg-muted text-muted-foreground border-border",
    preferred: "bg-gold/15 text-gold border-gold/20",
  };

  const statusLabel: Record<string, string> = {
    available: "Available",
    unavailable: "Unavailable",
    preferred: "Preferred",
  };

  function cycle(day: string) {
    setAvailability((prev) => {
      const order: Array<"available" | "unavailable" | "preferred"> = ["available", "preferred", "unavailable"];
      const idx = order.indexOf(prev[day] as "available" | "unavailable" | "preferred");
      return { ...prev, [day]: order[(idx + 1) % 3] };
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
        <SectionHeading icon={Calendar} title="Weekly Availability" />
        <p className="mb-4 text-sm text-muted-foreground">Click each day to cycle through: Available → Preferred → Unavailable</p>
        <div className="grid gap-3 sm:grid-cols-7">
          {DAYS.map((day) => {
            const status = availability[day];
            return (
              <button
                key={day}
                onClick={() => cycle(day)}
                className={cn(
                  "rounded-2xl border p-4 text-center transition hover:-translate-y-0.5 hover:shadow-lift",
                  statusColor[status],
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{day}</p>
                <p className="mt-2 font-display text-sm font-bold">{statusLabel[status]}</p>
              </button>
            );
          })}
        </div>
        <p className="mt-4 rounded-xl bg-gold/10 border border-gold/20 p-3 text-xs text-gold">
          Availability is stored per-instructor. Recurring schedules coming soon — set default weekly patterns and override for specific dates.
        </p>
      </div>
    </div>
  );
}

/* ── Instructor Detail — Pay Tab ───────────────────────────────────── */

function PayTab({ teacher }: { teacher: Teacher }) {
  const { classes } = useClasses();
  const { updateTeacher } = useTeachers();
  const [period, setPeriod] = useState<Period>("biweekly");
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [editRate, setEditRate] = useState(((teacher.hourlyRateCents ?? 0) / 100).toFixed(2));
  const [editPayType, setEditPayType] = useState(teacher.payType ?? "employee" as "employee" | "1099");
  const [isEditing, setIsEditing] = useState(false);
  const [expandedPeriods, setExpandedPeriods] = useState(false);

  const wh = weeklyHours(teacher.id, classes);
  const classCount = classes.filter((c) => c.teacherId === teacher.id).length;
  const rate = teacher.hourlyRateCents ?? 0;
  const multiplier = PERIOD_MULTIPLIER[period];
  const gross = grossPay(wh, rate, multiplier);

  const row: PayRow = {
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
    rateCents: rate,
    payType: teacher.payType ?? "employee",
    weeklyHrs: wh,
    classCount,
    grossPayCents: gross,
  };

  function savePayChanges() {
    const newRate = Math.round(parseFloat(editRate) * 100);
    if (isNaN(newRate) || newRate < 0) return;
    updateTeacher(teacher.id, { hourlyRateCents: newRate, payType: editPayType });
    setIsEditing(false);
  }

  function cancelEdit() {
    setEditRate(((teacher.hourlyRateCents ?? 0) / 100).toFixed(2));
    setEditPayType(teacher.payType ?? "employee");
    setIsEditing(false);
  }

  const exportCsv = useCallback(() => {
    const csv = buildCsv([row], period);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `instructor-pay-${teacher.name.replace(/\s+/g, "-")}-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [row, period, teacher.name]);

  const setForPeriod = useCallback((p: Period) => {
    setPeriod(p);
    setPeriodMenuOpen(false);
  }, []);

  return (
    <div className="space-y-6">
      {/* Pay configuration */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
        <SectionHeading icon={DollarSign} title="Pay Configuration" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Pay type">
            {isEditing ? (
              <select
                value={editPayType}
                onChange={(e) => setEditPayType(e.target.value as "employee" | "1099")}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
              >
                <option value="employee">Employee (W-2)</option>
                <option value="1099">1099 Contractor</option>
              </select>
            ) : (
              <span className={cn(
                "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                (teacher.payType ?? "employee") === "1099" ? "bg-gold/15 text-gold" : "bg-teal/10 text-teal",
              )}>
                {(teacher.payType ?? "employee") === "1099" ? "1099 Contractor" : "Employee (W-2)"}
              </span>
            )}
          </Field>
          <Field label="Hourly rate">
            {isEditing ? (
              <div className="flex items-center gap-1">
                <span className="text-sm">$</span>
                <input
                  type="number"
                  value={editRate}
                  onChange={(e) => setEditRate(e.target.value)}
                  step="0.25"
                  min="0"
                  className="w-24 rounded-xl border border-input bg-background px-3 py-2 text-sm tabular-nums outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
                  onKeyDown={(e) => { if (e.key === "Enter") savePayChanges(); if (e.key === "Escape") cancelEdit(); }}
                  autoFocus
                />
                <span className="text-sm text-muted-foreground">/hr</span>
              </div>
            ) : (
              <span className="font-display text-lg font-semibold tabular-nums">
                {rate > 0 ? formatCents(rate) + "/hr" : "Not set"}
              </span>
            )}
          </Field>
          <div className="flex items-end gap-2">
            {isEditing ? (
              <>
                <button onClick={savePayChanges} className="rounded-full bg-rose px-4 py-2 text-sm font-semibold text-rose-foreground transition hover:opacity-90">
                  Save
                </button>
                <button onClick={cancelEdit} className="rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-secondary">
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-secondary"
              >
                <Pencil className="h-3.5 w-3.5" />
                Change rate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pay summary dashboard */}
      <div className="grid gap-4 sm:grid-cols-4">
        <SummaryCard label="Hours worked / wk" value={formatHours(wh)} icon={Clock} variant="teal" />
        <SummaryCard label="Classes / wk" value={`${classCount}`} icon={GraduationCap} variant="plum" />
        <SummaryCard label={`Gross (${PERIOD_LABELS[period].toLowerCase()})`} value={formatCents(gross)} icon={DollarSign} variant="rose" />
        <SummaryCard label="Next payment" value="Jun 15" icon={Calendar} variant="teal" />
      </div>

      {/* Pay period detail */}
      <div className="rounded-2xl border border-border/70 bg-card shadow-soft overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 bg-secondary/40 px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Earnings</span>
            <div className="relative">
              <button
                onClick={() => setPeriodMenuOpen(!periodMenuOpen)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold transition hover:bg-secondary"
              >
                {PERIOD_LABELS[period]}
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
              {periodMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setPeriodMenuOpen(false)} />
                  <div className="absolute left-0 z-20 mt-1 w-40 rounded-xl border border-border/70 bg-card p-1 shadow-lift">
                    {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([k, v]) => (
                      <button
                        key={k}
                        onClick={() => setForPeriod(k)}
                        className={cn("w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition", period === k ? "bg-rose/10 text-rose" : "hover:bg-secondary")}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-full bg-rose px-3 py-1.5 text-xs font-semibold text-rose-foreground transition hover:opacity-90">
            <Download className="h-3 w-3" /> Export CSV
          </button>
        </div>

        {/* Earnings table */}
        <div className="hidden border-b border-border/60 bg-secondary/20 px-6 py-2 sm:grid sm:grid-cols-[1.2fr_0.8fr_100px_100px_120px]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Period</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Classes</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Hours</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Rate</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Gross</span>
        </div>
        <div className="px-6 py-5 sm:grid sm:grid-cols-[1.2fr_0.8fr_100px_100px_120px] sm:items-center sm:gap-0 flex flex-col gap-2">
          <span className="text-sm font-semibold">{PERIOD_LABELS[period]}</span>
          <span className="text-sm">{classCount} classes</span>
          <span className="text-sm font-semibold tabular-nums sm:text-right">{formatHours(wh * multiplier)}</span>
          <span className="text-sm tabular-nums sm:text-right">{rate > 0 ? formatCents(rate) + "/hr" : "—"}</span>
          <span className="text-sm font-display font-semibold tabular-nums sm:text-right">{formatCents(gross)}</span>
        </div>
      </div>

      {/* Earnings history placeholder */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
        <button
          onClick={() => setExpandedPeriods(!expandedPeriods)}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-plum/10 text-plum">
              <FileText className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Earnings history</p>
              <p className="text-xs text-muted-foreground">Full history available when payroll integrations launch</p>
            </div>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition", expandedPeriods && "rotate-180")} />
        </button>
        {expandedPeriods && (
          <div className="mt-4 rounded-xl border border-border/60 bg-secondary/20 p-4 text-center">
            <p className="text-xs text-muted-foreground">Payroll history will appear here when more pay periods are recorded.</p>
          </div>
        )}
      </div>

      {/* Future payroll roadmap */}
      <div className="rounded-2xl border border-border/70 bg-secondary/30 p-5 shadow-soft opacity-70">
        <div className="flex items-center gap-3 mb-4">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-muted">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="font-display text-sm font-semibold">Coming Soon</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {["Payroll Integrations (Gusto, ADP, QuickBooks)", "Contractor Payments", "Tax Reporting", "Revenue Share Automation"].map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Instructor Detail — Documents Tab ─────────────────────────────── */

function DocumentsTab({ teacher }: { teacher: Teacher }) {
  const [documents, setDocuments] = useState<InstructorDocument[]>([
    { id: "doc_1", studioId: "", instructorId: teacher.id, title: "Employment Agreement", documentType: "employment_agreement", uploadedAt: "2025-08-15T00:00:00Z" },
    { id: "doc_2", studioId: "", instructorId: teacher.id, title: "CPR / First Aid Certificate", documentType: "certification", uploadedAt: "2025-09-01T00:00:00Z", expiresAt: "2026-09-01T00:00:00Z" },
    { id: "doc_3", studioId: "", instructorId: teacher.id, title: "Background Check Report", documentType: "background_check", uploadedAt: "2025-07-20T00:00:00Z" },
  ]);

  const docTypeLabels: Record<string, string> = {
    employment_agreement: "Employment Agreement",
    certification: "Certification",
    background_check: "Background Check",
    first_aid: "First Aid Certificate",
    insurance: "Insurance Document",
  };

  const docTypeIcons: Record<string, typeof FileText> = {
    employment_agreement: Briefcase,
    certification: Award,
    background_check: Shield,
    first_aid: Shield,
    insurance: Shield,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{documents.length} document{documents.length !== 1 ? "s" : ""} on file</p>
        <button className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-secondary">
          <Upload className="h-4 w-4" /> Upload document
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center rounded-2xl border border-border/70 bg-card">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold">No documents yet</p>
          <p className="max-w-xs text-xs text-muted-foreground">Upload employment agreements, certifications, background checks, and other important documents.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const Icon = docTypeIcons[doc.documentType] ?? FileText;
            const isExpired = doc.expiresAt && new Date(doc.expiresAt) < new Date();
            const isExpiringSoon = doc.expiresAt && !isExpired && new Date(doc.expiresAt) < new Date(Date.now() + 90 * 864e5);
            return (
              <div key={doc.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">{docTypeLabels[doc.documentType] ?? doc.documentType} · Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isExpired && (
                    <span className="rounded-full bg-rose/10 px-2 py-0.5 text-[11px] font-semibold text-rose">Expired</span>
                  )}
                  {isExpiringSoon && (
                    <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-semibold text-gold">Expires {new Date(doc.expiresAt!).toLocaleDateString()}</span>
                  )}
                  <button className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground" aria-label={`Download ${doc.title}`}>
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="rounded-xl bg-plum/5 border border-plum/20 p-3 text-xs text-plum">
        Documents are stored securely in your studio&apos;s Supabase storage. Expiry dates are tracked automatically — you&apos;ll see warnings when certifications are due for renewal.
      </p>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────────────── */

function SummaryCard({
  label, value, icon: Icon, variant,
}: {
  label: string; value: string; icon: typeof DollarSign; variant: "rose" | "plum" | "teal";
}) {
  const colors: Record<string, { bg: string; text: string; iconBg: string }> = {
    rose: { bg: "bg-rose/5 border-rose/20", text: "text-rose", iconBg: "bg-rose/10" },
    plum: { bg: "bg-plum/5 border-plum/20", text: "text-plum", iconBg: "bg-plum/10" },
    teal: { bg: "bg-teal/5 border-teal/20", text: "text-teal", iconBg: "bg-teal/10" },
  };
  const c = colors[variant];
  return (
    <div className={cn("rounded-2xl border p-4 shadow-soft", c.bg)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className={cn("grid h-7 w-7 place-items-center rounded-lg", c.iconBg, c.text)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className={cn("mt-2 font-display text-xl font-bold tracking-tight", c.text)}>{value}</p>
    </div>
  );
}

/* ── Main Instructor List Card ─────────────────────────────────────── */

function InstructorCard({
  teacher,
  onSelect,
  onEdit,
  onDelete,
}: {
  teacher: Teacher;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { classes } = useClasses();
  const hours = weeklyHours(teacher.id, classes);
  const assignedClasses = classes.filter((c) => c.teacherId === teacher.id);
  const payroll = payrollEstimate(teacher, hours);
  const statusColor = STATUS_OPTIONS.find((s) => s.value === teacher.status)?.color ?? STATUS_OPTIONS[0].color;

  return (
    <div
      onClick={onSelect}
      className="group cursor-pointer rounded-2xl border border-border/70 bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex items-start justify-between">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-rose/10 text-rose">
          <span className="font-display text-lg font-semibold">{initials(teacher.name)}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            aria-label={`Edit ${teacher.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-rose/10 hover:text-rose"
            aria-label={`Remove ${teacher.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <h3 className="mt-3 font-display text-lg font-semibold">{teacher.preferredName || teacher.name}</h3>
      {teacher.preferredName && <p className="text-xs text-muted-foreground">{teacher.name}</p>}

      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", statusColor)}>
          {STATUS_OPTIONS.find((s) => s.value === teacher.status)?.label ?? "Active"}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Mail className="h-3 w-3" /> {teacher.email}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {teacher.styles.map((s) => (
          <span key={s} className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", styleStyles[s].chip)}>{s}</span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Classes</p>
          <p className="mt-0.5 font-display text-lg font-semibold tabular-nums">{assignedClasses.length}</p>
          <p className="text-[11px] text-muted-foreground">assigned</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Weekly</p>
          <p className="mt-0.5 font-display text-lg font-semibold tabular-nums">{hours.toFixed(1)}h</p>
          <p className="text-[11px] text-muted-foreground">
            {payroll ? `~$${(payroll / 100).toFixed(0)}/mo` : "no rate set"}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────── */

type Tab = "profile" | "classes" | "availability" | "pay" | "documents";

const TABS: { key: Tab; label: string; icon: typeof UserRound }[] = [
  { key: "profile", label: "Profile", icon: UserRound },
  { key: "classes", label: "Classes", icon: GraduationCap },
  { key: "availability", label: "Availability", icon: Calendar },
  { key: "pay", label: "Pay", icon: DollarSign },
  { key: "documents", label: "Documents", icon: FileText },
];

export default function Instructors() {
  const { teachers, addTeacher, removeTeacher, updateTeacher } = useTeachers();
  const term = useTerminology();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<InstructorStatus | "all">("all");

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || (t.phone ?? "").includes(q);
      }
      return true;
    });
  }, [teachers, search, filterStatus]);

  const activeCount = teachers.filter((t) => t.status === "active").length;
  const archivedCount = teachers.filter((t) => t.status === "archived").length;

  const selectedTeacher = selectedId ? teachers.find((t) => t.id === selectedId) : undefined;

  function openAdd() {
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setModalOpen(true);
  }

  function handleSave(form: InstructorFormData) {
    const payload = {
      name: form.name.trim(),
      preferredName: form.preferredName.trim() || undefined,
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      styles: form.styles,
      status: form.status,
      hireDate: form.hireDate || undefined,
      employeeId: form.employeeId.trim() || undefined,
      certifications: form.certifications,
      hourlyRateCents: form.hourlyRateCents,
      emergencyContact: (form.emergencyContactName || form.emergencyContactPhone) ? {
        name: form.emergencyContactName.trim(),
        relationship: form.emergencyContactRelationship.trim(),
        phone: form.emergencyContactPhone.trim(),
      } : undefined,
    };

    if (editingId) {
      updateTeacher(editingId, payload as Partial<Omit<Teacher, "id" | "studioId">>);
    } else {
      addTeacher(payload as Omit<Teacher, "id" | "studioId">);
    }
    setModalOpen(false);
  }

  function confirmDelete(id: string) {
    removeTeacher(id);
    setConfirmDeleteId(null);
    if (selectedId === id) setSelectedId(null);
  }

  // Detail view for a selected instructor
  if (selectedTeacher) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Back button */}
        <button
          onClick={() => { setSelectedId(null); setActiveTab("profile"); }}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {term.instructorPlural.toLowerCase()}
        </button>

        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl border border-border/70 bg-card p-1.5 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition",
                activeTab === key
                  ? "bg-rose text-rose-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "profile" && <ProfileTab teacher={selectedTeacher} />}
        {activeTab === "classes" && <ClassesTab teacher={selectedTeacher} />}
        {activeTab === "availability" && <AvailabilityTab teacher={selectedTeacher} />}
        {activeTab === "pay" && <PayTab teacher={selectedTeacher} />}
        {activeTab === "documents" && <DocumentsTab teacher={selectedTeacher} />}
      </div>
    );
  }

  // List view
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            {term.instructorPlural}
          </h2>
          <p className="text-sm text-muted-foreground">
            {activeCount} active · {archivedCount} archived
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-full bg-rose px-4 py-2.5 text-sm font-semibold text-rose-foreground shadow-soft transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add {term.instructor.toLowerCase()}
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] max-w-md">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search by name, email, or phone…`}
              className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-secondary">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-1.5 rounded-xl bg-secondary p-1">
          {([{ value: "all", label: "All" }, ...STATUS_OPTIONS] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value as InstructorStatus | "all")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                filterStatus === opt.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filteredTeachers.length === 0 && teachers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary">
            <UserRound className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-xl font-semibold">
            No {term.instructorPlural.toLowerCase()} yet
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add your first {term.instructor.toLowerCase()} to start assigning them to classes.
          </p>
          <button
            onClick={openAdd}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-rose px-5 py-2.5 text-sm font-semibold text-rose-foreground shadow-soft transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Add your first {term.instructor.toLowerCase()}
          </button>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold">No results found</p>
          <p className="text-xs text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeachers.map((t, i) => (
            <div key={t.id} style={{ animationDelay: `${i * 40}ms` }} className="animate-float-up">
              <InstructorCard
                teacher={t}
                onSelect={() => { setSelectedId(t.id); setActiveTab("profile"); }}
                onEdit={() => openEdit(t.id)}
                onDelete={() => setConfirmDeleteId(t.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      <InstructorModal
        open={modalOpen}
        editingId={editingId}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      {/* Delete confirmation modal */}
      <Modal
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        title={`Remove ${term.instructor.toLowerCase()}`}
        description={`This ${term.instructor.toLowerCase()} will be removed from your studio. Classes they are assigned to will show as 'Unassigned'.`}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-secondary"
            >
              Keep {term.instructor.toLowerCase()}
            </button>
            <button
              onClick={() => confirmDeleteId && confirmDelete(confirmDeleteId)}
              className="rounded-full bg-rose px-5 py-2 text-sm font-semibold text-rose-foreground transition hover:opacity-90"
            >
              Yes, remove
            </button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          This action cannot be undone. Classes currently taught by this{" "}
          {term.instructor.toLowerCase()} will need to be reassigned.
        </p>
      </Modal>
    </div>
  );
}
