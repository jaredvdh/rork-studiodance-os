import { useMemo, useState } from "react";
import {
  Clock,
  Mail,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";

import Modal from "@/components/Modal";
import { styleStyles, useClasses, useTeachers, useTerminology } from "@/data/store";
import type { ClassStyle, Teacher } from "@/data/types";
import { cn } from "@/lib/utils";

const ALL_STYLES: ClassStyle[] = [
  "Ballet",
  "Jazz",
  "Hip Hop",
  "Contemporary",
  "Tap",
  "Lyrical",
  "Acro",
];

/** Weekly teaching hours for an instructor derived from their assigned classes. */
function weeklyHours(teacherId: string, classes: { teacherId: string; durationMins: number }[]): number {
  return classes
    .filter((c) => c.teacherId === teacherId)
    .reduce((a, c) => a + c.durationMins, 0) / 60;
}

/** Payroll estimate (pre-tax) based on hourly rate and weekly hours. */
function payrollEstimate(teacher: Teacher, hours: number): number | null {
  if (!teacher.hourlyRateCents) return null;
  return Math.round(teacher.hourlyRateCents * hours * 4.33); // monthly
}

export default function Instructors() {
  const { teachers, addTeacher, removeTeacher, updateTeacher } = useTeachers();
  const { classes } = useClasses();
  const term = useTerminology();
  const [open, setOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    styles: [] as ClassStyle[],
    hourlyRateCents: undefined as number | undefined,
  });

  function resetForm() {
    setForm({ name: "", email: "", styles: [], hourlyRateCents: undefined });
    setEditingId(null);
  }

  function openAdd() {
    resetForm();
    setOpen(true);
  }

  function openEdit(id: string) {
    const t = teachers.find((t) => t.id === id);
    if (!t) return;
    setForm({
      name: t.name,
      email: t.email,
      styles: [...t.styles],
      hourlyRateCents: t.hourlyRateCents,
    });
    setEditingId(id);
    setOpen(true);
  }

  function toggleStyle(s: ClassStyle) {
    setForm((f) => ({
      ...f,
      styles: f.styles.includes(s)
        ? f.styles.filter((x) => x !== s)
        : [...f.styles, s],
    }));
  }

  function save() {
    if (!form.name.trim() || !form.email.trim() || form.styles.length === 0) return;
    if (editingId) {
      updateTeacher(editingId, {
        name: form.name.trim(),
        email: form.email.trim(),
        styles: form.styles,
        hourlyRateCents: form.hourlyRateCents,
      });
    } else {
      addTeacher({
        name: form.name.trim(),
        email: form.email.trim(),
        styles: form.styles,
        hourlyRateCents: form.hourlyRateCents,
      });
    }
    setOpen(false);
    resetForm();
  }

  function confirmDelete(id: string) {
    removeTeacher(id);
    setConfirmDeleteId(null);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            {term.instructorPlural}
          </h2>
          <p className="text-sm text-muted-foreground">
            {teachers.length} {teachers.length !== 1 ? term.instructorPlural.toLowerCase() : term.instructor.toLowerCase()} on
            staff
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-full bg-rose px-4 py-2.5 text-sm font-semibold text-rose-foreground shadow-soft transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add {term.instructor.toLowerCase()}
        </button>
      </div>

      {teachers.length === 0 ? (
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
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((t, i) => {
            const assignedClasses = classes.filter((c) => c.teacherId === t.id);
            const hours = weeklyHours(t.id, classes);
            const payroll = payrollEstimate(t, hours);
            const isExpanded = expandedId === t.id;

            return (
              <div
                key={t.id}
                className="animate-float-up rounded-2xl border border-border/70 bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-plum/10 text-plum">
                    <span className="font-display text-lg font-semibold">
                      {t.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(t.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                      aria-label={`Edit ${t.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(t.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-rose/10 hover:text-rose"
                      aria-label={`Remove ${t.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="mt-3 font-display text-lg font-semibold">
                  {t.name}
                </h3>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  {t.email}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {t.styles.map((s) => (
                    <span
                      key={s}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        styleStyles[s].chip,
                      )}
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* Teaching load summary */}
                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Assigned</p>
                    <p className="mt-0.5 font-display text-lg font-semibold tabular-nums">
                      {assignedClasses.length}
                    </p>
                    <p className="text-[11px] text-muted-foreground">classes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Weekly</p>
                    <p className="mt-0.5 font-display text-lg font-semibold tabular-nums">
                      {hours.toFixed(1)}h
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {payroll ? `~$${(payroll / 100).toFixed(0)}/mo est.` : "no rate set"}
                    </p>
                  </div>
                </div>

                {/* Expandable class list */}
                {assignedClasses.length > 0 && (
                  <div className="mt-3">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : t.id)}
                      className="w-full text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground transition hover:text-foreground"
                    >
                      {isExpanded ? "Hide" : "Show"} assigned classes ({assignedClasses.length})
                    </button>
                    {isExpanded && (
                      <div className="mt-2 space-y-1.5">
                        {assignedClasses.map((c) => (
                          <div key={c.id} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2 text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={cn("h-2 w-2 shrink-0 rounded-full", styleStyles[c.style].dot)} />
                              <span className="truncate font-medium">{c.name}</span>
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                              {c.day} {c.startTime} · {c.durationMins}m
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title={editingId ? `Edit ${term.instructor.toLowerCase()}` : `Add ${term.instructor.toLowerCase()}`}
        description={
          editingId
            ? `Update this ${term.instructor.toLowerCase()}'s profile, ${term.classStyle.toLowerCase()}s, and pay rate.`
            : `Add a new ${term.instructor.toLowerCase()} to your studio.`
        }
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="rounded-full bg-rose px-5 py-2 text-sm font-semibold text-rose-foreground transition hover:opacity-90"
            >
              {editingId ? "Save changes" : `Add ${term.instructor.toLowerCase()}`}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Full name">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Mara Delgado"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="e.g. mara@aurora.dance"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
          </Field>
          <Field label={term.classStyle + "s"}>
            <div className="flex flex-wrap gap-2">
              {ALL_STYLES.map((s) => {
                const active = form.styles.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStyle(s)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground/70 hover:bg-secondary",
                    )}
                  >
                    {active && <Sparkles className="mr-1 inline h-3 w-3" />}
                    {s}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Hourly rate ($)">
            <input
              type="number"
              value={form.hourlyRateCents !== undefined ? (form.hourlyRateCents / 100).toFixed(2) : ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  hourlyRateCents: e.target.value ? Math.round(Number(e.target.value) * 100) : undefined,
                })
              }
              placeholder="e.g. 45.00"
              className="w-full max-w-[160px] rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
          </Field>
        </div>
      </Modal>

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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
