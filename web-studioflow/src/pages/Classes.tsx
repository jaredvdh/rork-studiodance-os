import { useEffect, useMemo, useState } from "react";
import { Clock, Copy, Edit3, MapPin, Plus, Trash2, Trophy, Users } from "lucide-react";

import Modal from "@/components/Modal";
import { styleStyles, teacherName, useStudio, useEnrichedClasses, useClasses, useTeachers, useTerminology } from "@/data/store";
import type { ModuleKey } from "@/data/terminology";
import type { AgeGroup, Class, ClassStyle, WeekDay } from "@/data/types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const AGES: AgeGroup[] = ["Tiny Tots", "Junior", "Intermediate", "Senior", "Adult"];
const DAYS: WeekDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ROOM_OPTIONS = ["Studio A", "Studio B", "Studio C"];
const DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 120, 150, 180];

type ModalMode = "create" | "edit";

function endTime(startTime: string, durationMins: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + durationMins;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
}

function timeDisplay(startTime: string, durationMins: number): string {
  return `${startTime} – ${endTime(startTime, durationMins)}`;
}

export default function Classes() {
  const { studio } = useStudio();
  const term = useTerminology();
  const classes = useEnrichedClasses();
  const { addClass, removeClass, updateClass } = useClasses();
  const { teachers } = useTeachers();

  const [styleFilter, setStyleFilter] = useState<ClassStyle | "All">("All");
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Reset style filter when vertical changes
  useEffect(() => {
    if (styleFilter !== "All" && !(term.styleCategories as readonly string[]).includes(styleFilter)) {
      setStyleFilter("All");
    }
  }, [studio.vertical, term.styleCategories]);

  const defaultForm = useMemo(
    () => ({
      name: "",
      style: term.styleCategories[0] as ClassStyle,
      ageGroup: "Junior" as AgeGroup,
      day: "Mon" as WeekDay,
      startTime: "16:00",
      durationMins: 60,
      room: "Studio A",
      teacherId: teachers[0]?.id ?? "",
      capacity: 16,
      inRecital: true,
      price: 95,
      description: "",
    }),
    [term.styleCategories, teachers],
  );

  const [form, setForm] = useState(defaultForm);

  // Reset form when vertical / teachers change
  useEffect(() => {
    const validStyles = term.styleCategories as readonly string[];
    const styleOk = validStyles.includes(form.style);
    const teacherOk = teachers.length > 0 && teachers.some((t) => t.id === form.teacherId);
    setForm((f) => ({
      ...f,
      style: styleOk ? f.style : (validStyles[0] as ClassStyle),
      teacherId: teacherOk ? f.teacherId : (teachers[0]?.id ?? ""),
    }));
  }, [studio.vertical, teachers]);

  const filtered = useMemo(
    () => (styleFilter === "All" ? classes : classes.filter((c) => c.style === styleFilter)),
    [classes, styleFilter],
  );

  // ── Open create modal ──
  function openCreate() {
    setModalMode("create");
    setEditingClassId(null);
    setForm(defaultForm);
    setOpen(true);
  }

  // ── Open edit modal ──
  function openEdit(cls: Class) {
    setModalMode("edit");
    setEditingClassId(cls.id);
    setForm({
      name: cls.name,
      style: cls.style,
      ageGroup: cls.ageGroup,
      day: cls.day,
      startTime: cls.startTime,
      durationMins: cls.durationMins,
      room: cls.room,
      teacherId: cls.teacherId,
      capacity: cls.capacity,
      inRecital: cls.inRecital,
      price: Math.round(cls.priceCents / 100),
      description: cls.description ?? "",
    });
    setOpen(true);
  }

  // ── Submit (create or edit) ──
  async function handleSubmit() {
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      style: form.style,
      ageGroup: form.ageGroup,
      day: form.day,
      startTime: form.startTime,
      durationMins: form.durationMins,
      room: form.room,
      teacherId: form.teacherId,
      capacity: form.capacity,
      inRecital: form.inRecital,
      priceCents: form.price * 100,
      description: form.description.trim() || undefined,
    };

    if (modalMode === "edit" && editingClassId) {
      updateClass(editingClassId, payload);
    } else {
      addClass(payload);
    }

    // Brief delay for perceived save
    await new Promise((r) => setTimeout(r, 150));
    setSaving(false);
    setOpen(false);
    setForm((f) => ({ ...f, name: "" }));
  }

  // ── Duplicate a class ──
  function handleDuplicate(cls: Class) {
    addClass({
      name: `${cls.name} (copy)`,
      style: cls.style,
      ageGroup: cls.ageGroup,
      day: cls.day,
      startTime: cls.startTime,
      durationMins: cls.durationMins,
      room: cls.room,
      teacherId: cls.teacherId,
      capacity: cls.capacity,
      inRecital: cls.inRecital,
      priceCents: cls.priceCents,
      description: cls.description,
    });
  }

  function handleDelete(id: string) {
    removeClass(id);
    setConfirmDeleteId(null);
  }

  // ── Card actions (kebab-like inline) ──
  function cardActions(cls: Class) {
    return (
      <div className="flex items-center gap-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); handleDuplicate(cls); }}
          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-blue-50 hover:text-blue-600"
          aria-label={`Duplicate ${cls.name}`}
          title="Duplicate class"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); openEdit(cls); }}
          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-amber-50 hover:text-amber-600"
          aria-label={`Edit ${cls.name}`}
          title="Edit class"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(cls.id); }}
          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-rose/10 hover:text-rose"
          aria-label={`Delete ${cls.name}`}
          title="Delete class"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">{term.classPlural}</h2>
          <p className="text-sm text-muted-foreground">
            {classes.length} active {term.classPlural.toLowerCase()} ·{" "}
            {classes.reduce((a, c) => a + c.enrolled, 0)} enrolled
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full bg-rose px-4 py-2.5 text-sm font-semibold text-rose-foreground shadow-soft transition hover:opacity-90 active:scale-95"
        >
          <Plus className="h-4 w-4" /> New {term.class.toLowerCase()}
        </button>
      </div>

      {/* ── Style filters ── */}
      <div className="flex flex-wrap gap-2">
        {(["All", ...term.styleCategories] as (ClassStyle | "All")[]).map((s) => (
          <button
            key={s}
            onClick={() => setStyleFilter(s)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition active:scale-95",
              styleFilter === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground/70 hover:bg-secondary",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="rounded-full bg-secondary p-5 text-muted-foreground">
            <Clock className="h-8 w-8" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold">No {term.classPlural.toLowerCase()} yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {styleFilter !== "All"
                ? `No ${styleFilter} ${term.classPlural.toLowerCase()} found. Try a different filter.`
                : `Create your first ${term.class.toLowerCase()} to build your schedule.`}
            </p>
          </div>
          {styleFilter === "All" && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-full bg-rose px-4 py-2 text-sm font-semibold text-rose-foreground transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Create {term.class.toLowerCase()}
            </button>
          )}
        </div>
      )}

      {/* ── Class cards grid ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c, i) => {
          const pct = Math.round((c.enrolled / c.capacity) * 100);
          const full = c.enrolled >= c.capacity;
          return (
            <div
              key={c.id}
              className="group animate-float-up rounded-2xl border border-border/70 bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Top row: style chip + recital badge + actions */}
              <div className="flex items-start justify-between">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      (styleStyles[c.style] ?? styleStyles.Ballet).chip,
                    )}
                  >
                    {c.style}
                  </span>
                  {c.inRecital &&
                    term.enabledModules.includes("recitals" as ModuleKey) && (
                      <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2 py-1 text-xs font-semibold text-gold">
                        <Trophy className="h-3 w-3" /> {term.event}
                      </span>
                    )}
                </div>
                {/* Show actions on hover (desktop) / always on mobile */}
                <div className="opacity-0 transition group-hover:opacity-100 sm:opacity-0">
                  {cardActions(c)}
                </div>
              </div>

              {/* Class name + age + teacher */}
              <h3 className="mt-3 font-display text-lg font-semibold">{c.name}</h3>
              <p className="text-sm text-muted-foreground">
                {c.ageGroup} · {teacherName(teachers, c.teacherId)}
              </p>

              {/* Description preview */}
              {c.description && (
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground/70">
                  {c.description}
                </p>
              )}

              {/* Time + room */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <span className="flex items-center gap-1.5 text-foreground/70">
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />{" "}
                  <span className="truncate">{c.day} {timeDisplay(c.startTime, c.durationMins)}</span>
                </span>
                <span className="flex items-center gap-1.5 text-foreground/70">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />{" "}
                  <span className="truncate">{c.room}</span>
                </span>
              </div>

              {/* Capacity bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-foreground/70">
                    <Users className="h-4 w-4 text-muted-foreground" />{" "}
                    {c.enrolled}/{c.capacity}
                  </span>
                  <span className={cn("font-semibold", full ? "text-rose" : "text-foreground/80")}>
                    {full ? `Full · ${c.waitlist} waitlist` : `${pct}%`}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      (styleStyles[c.style] ?? styleStyles.Ballet).dot,
                    )}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Footer: price + mobile actions */}
              <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                <span className="font-display text-base font-semibold">
                  {formatCurrency(c.priceCents)}
                  <span className="text-xs font-normal text-muted-foreground">/mo</span>
                </span>
                <div className="flex items-center gap-1 sm:hidden">
                  {cardActions(c)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Delete confirmation modal ── */}
      <Modal
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        title="Remove class"
        description="This class will be removed from the schedule. Students enrolled in this class will need to be reassigned."
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-secondary"
            >
              Keep class
            </button>
            <button
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
              className="rounded-full bg-rose px-5 py-2 text-sm font-semibold text-rose-foreground transition hover:opacity-90 active:scale-95"
            >
              Yes, remove
            </button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          This action cannot be undone. Student enrolment records for this class will be preserved.
        </p>
      </Modal>

      {/* ── Create / Edit modal ── */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={modalMode === "edit" ? "Edit class" : "Create a class"}
        description={
          modalMode === "edit"
            ? `Editing ${form.name || "class"}. Changes take effect immediately.`
            : "Add a new recurring class to your schedule."
        }
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim() || saving}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition",
                saving || !form.name.trim()
                  ? "cursor-not-allowed bg-rose/40 text-rose-foreground/60"
                  : "bg-rose text-rose-foreground hover:opacity-90 active:scale-95",
              )}
            >
              {saving ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Saving…
                </>
              ) : modalMode === "edit" ? (
                "Save changes"
              ) : (
                "Create class"
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Class name" required>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={`e.g. ${
                term.verticalAdjective === "dance"
                  ? "Tiny Tots Ballet"
                  : term.verticalAdjective === "yoga"
                    ? "Morning Vinyasa Flow"
                    : term.verticalAdjective === "CrossFit"
                      ? "Monday Strength WOD"
                      : term.verticalAdjective === "music"
                        ? "Beginner Piano Group"
                        : `Intro ${term.class} A`
              }`}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={term.classStyle}>
              <Select
                value={form.style}
                onChange={(v) => setForm({ ...form, style: v as ClassStyle })}
                options={term.styleCategories as string[]}
              />
            </Field>
            <Field label="Age group">
              <Select
                value={form.ageGroup}
                onChange={(v) => setForm({ ...form, ageGroup: v as AgeGroup })}
                options={AGES}
              />
            </Field>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <Field label="Day">
              <Select
                value={form.day}
                onChange={(v) => setForm({ ...form, day: v as WeekDay })}
                options={DAYS}
              />
            </Field>
            <Field label="Start">
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
              />
            </Field>
            <Field label="Duration">
              <Select
                value={String(form.durationMins)}
                onChange={(v) => setForm({ ...form, durationMins: Number(v) })}
                options={DURATION_OPTIONS.map(String)}
                labels={Object.fromEntries(DURATION_OPTIONS.map((m) => [String(m), `${m} min`]))}
              />
            </Field>
            <Field label="Ends">
              <input
                type="text"
                readOnly
                value={endTime(form.startTime, form.durationMins)}
                className="w-full rounded-xl border border-input bg-secondary/50 px-3 py-2.5 text-sm text-muted-foreground outline-none"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Teacher">
              <Select
                value={form.teacherId}
                onChange={(v) => setForm({ ...form, teacherId: v })}
                options={teachers.map((t) => t.id)}
                labels={Object.fromEntries(teachers.map((t) => [t.id, t.name]))}
              />
            </Field>
            <Field label="Room">
              <RoomSelect
                value={form.room}
                onChange={(v) => setForm({ ...form, room: v })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Capacity">
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) =>
                  setForm({ ...form, capacity: Math.max(1, Number(e.target.value)) })
                }
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
              />
            </Field>
            <Field label="Monthly price ($)">
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
              />
            </Field>
          </div>

          <Field label="Description" optional>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe this class — what students will learn, prerequisites, what to bring, etc."
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
            <div className="mt-1 text-right text-xs text-muted-foreground">
              {form.description.length}/500
            </div>
          </Field>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3 transition hover:border-rose/30">
            <span className="text-sm font-medium">Participates in {term.event.toLowerCase()}</span>
            <input
              type="checkbox"
              checked={form.inRecital}
              onChange={(e) => setForm({ ...form, inRecital: e.target.checked })}
              className="h-5 w-5 accent-rose"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}

/* ── Reusable field label ── */

function Field({
  label,
  children,
  required,
  optional,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
        {required && <span className="text-rose">*</span>}
        {optional && <span className="font-normal normal-case tracking-normal">(optional)</span>}
      </span>
      {children}
    </label>
  );
}

/* ── Select with optional label map ── */

function Select({
  value,
  onChange,
  options,
  labels,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {labels?.[o] ?? o}
        </option>
      ))}
    </select>
  );
}

/* ── Room select with custom option ── */

function RoomSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [customRoom, setCustomRoom] = useState<string>("");
  const [showCustom, setShowCustom] = useState<boolean>(false);

  const isCustom = !ROOM_OPTIONS.includes(value) && value !== "";

  return (
    <div className="relative">
      {!showCustom && !isCustom ? (
        <div className="flex gap-1">
          <select
            value={value}
            onChange={(e) => {
              if (e.target.value === "__custom__") {
                setShowCustom(true);
              } else {
                onChange(e.target.value);
              }
            }}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
          >
            {ROOM_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
            <option value="__custom__">+ Add room…</option>
          </select>
        </div>
      ) : (
        <div className="flex gap-1">
          <input
            value={showCustom ? customRoom : value}
            onChange={(e) => {
              if (showCustom) setCustomRoom(e.target.value);
              else onChange(e.target.value);
            }}
            onBlur={() => {
              if (showCustom && customRoom.trim()) {
                onChange(customRoom.trim());
              }
              setShowCustom(false);
              setCustomRoom("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (showCustom && customRoom.trim()) {
                  onChange(customRoom.trim());
                }
                setShowCustom(false);
                setCustomRoom("");
              }
              if (e.key === "Escape") {
                setShowCustom(false);
                setCustomRoom("");
              }
            }}
            placeholder="Room name"
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
            autoFocus
          />
          <button
            type="button"
            onClick={() => {
              setShowCustom(false);
              setCustomRoom("");
            }}
            className="rounded-xl border border-input px-3 py-2 text-xs text-muted-foreground transition hover:bg-secondary"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
