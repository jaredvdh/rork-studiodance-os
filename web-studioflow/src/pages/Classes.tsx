import { useEffect, useMemo, useState } from "react";
import { Clock, MapPin, Plus, Trash2, Trophy, Users } from "lucide-react";

import Modal from "@/components/Modal";
import { styleStyles, teacherName, useStudio, useEnrichedClasses, useClasses, useTeachers, useTerminology } from "@/data/store";
import type { ModuleKey } from "@/data/terminology";
import type { AgeGroup, ClassStyle, WeekDay } from "@/data/types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
const AGES: AgeGroup[] = ["Tiny Tots", "Junior", "Intermediate", "Senior", "Adult"];
const DAYS: WeekDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Classes() {
  const { studio } = useStudio();
  const term = useTerminology();
  const classes = useEnrichedClasses();
  const { addClass, removeClass } = useClasses();
  const { teachers } = useTeachers();
  const [styleFilter, setStyleFilter] = useState<ClassStyle | "All">("All");
  const [open, setOpen] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Reset style filter when vertical changes to avoid stale/invalid selections
  useEffect(() => {
    if (styleFilter !== "All" && !(term.styleCategories as readonly string[]).includes(styleFilter)) {
      setStyleFilter("All");
    }
  }, [studio.vertical, term.styleCategories]);

  // Reset form style if it's no longer valid for the new vertical
  useEffect(() => {
    if (!(term.styleCategories as readonly string[]).includes(form.style)) {
      setForm((f) => ({ ...f, style: term.styleCategories[0] }));
    }
  }, [studio.vertical]);

  const filtered = useMemo(
    () => (styleFilter === "All" ? classes : classes.filter((c) => c.style === styleFilter)),
    [classes, styleFilter],
  );

  const [form, setForm] = useState({
    name: "",
    style: term.styleCategories[0] as ClassStyle,
    ageGroup: "Junior" as AgeGroup,
    day: "Mon" as WeekDay,
    startTime: "16:00",
    durationMins: 60,
    room: "Studio A",
    teacherId: teachers[0].id,
    capacity: 16,
    inRecital: true,
    price: 95,
  });

  function handleAddClass() {
    if (!form.name.trim()) return;
    addClass({
      name: form.name.trim(),
      style: form.style,
      ageGroup: form.ageGroup,
      day: form.day,
      startTime: form.startTime,
      durationMins: form.durationMins,
      room: form.room,
      teacherId: form.teacherId,
      capacity: form.capacity,
      enrolled: 0,
      waitlist: 0,
      inRecital: form.inRecital,
      priceCents: form.price * 100,
    });
    setOpen(false);
    setForm((f) => ({ ...f, name: "" }));
  }

  function handleDelete(id: string) {
    removeClass(id);
    setConfirmDeleteId(null);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">{term.classPlural}</h2>
          <p className="text-sm text-muted-foreground">{classes.length} active classes · {classes.reduce((a, c) => a + c.enrolled, 0)} enrollments</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-rose px-4 py-2.5 text-sm font-semibold text-rose-foreground shadow-soft transition hover:opacity-90">
          <Plus className="h-4 w-4" /> New class
        </button>
      </div>

      {/* Style filters */}
      <div className="flex flex-wrap gap-2">
        {(["All", ...term.styleCategories] as (ClassStyle | "All")[]).map((s) => (
          <button
            key={s}
            onClick={() => setStyleFilter(s)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
              styleFilter === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground/70 hover:bg-secondary",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c, i) => {
          const pct = Math.round((c.enrolled / c.capacity) * 100);
          const full = c.enrolled >= c.capacity;
          return (
            <div
              key={c.id}
              className="animate-float-up rounded-2xl border border-border/70 bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start justify-between">
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", styleStyles[c.style].chip)}>{c.style}</span>
                {c.inRecital && term.enabledModules.includes("recitals" as ModuleKey) && (
                  <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2 py-1 text-xs font-semibold text-gold">
                    <Trophy className="h-3 w-3" /> {term.event}
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold">{c.name}</h3>
              <p className="text-sm text-muted-foreground">{c.ageGroup} · {teacherName(teachers, c.teacherId)}</p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <span className="flex items-center gap-1.5 text-foreground/70"><Clock className="h-4 w-4 text-muted-foreground" /> {c.day} {c.startTime}</span>
                <span className="flex items-center gap-1.5 text-foreground/70"><MapPin className="h-4 w-4 text-muted-foreground" /> {c.room}</span>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-foreground/70"><Users className="h-4 w-4 text-muted-foreground" /> {c.enrolled}/{c.capacity}</span>
                  <span className={cn("font-semibold", full ? "text-rose" : "text-foreground/80")}>
                    {full ? `Full · ${c.waitlist} waitlist` : `${pct}%`}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className={cn("h-full rounded-full", styleStyles[c.style].dot)} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                <span className="font-display text-base font-semibold">{formatCurrency(c.priceCents)}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">{c.durationMins} min</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(c.id); }}
                    className="ml-2 grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-rose/10 hover:text-rose"
                    aria-label={`Delete ${c.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        title="Remove class"
        description="This class will be removed from the schedule. Students enrolled in this class will need to be reassigned."
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirmDeleteId(null)} className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-secondary">Keep class</button>
            <button onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)} className="rounded-full bg-rose px-5 py-2 text-sm font-semibold text-rose-foreground transition hover:opacity-90">Yes, remove</button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">This action cannot be undone. Student enrolment records for this class will be preserved.</p>
      </Modal>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create a class"
        description="Add a new recurring class to your schedule."
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-secondary">Cancel</button>
            <button onClick={handleAddClass} className="rounded-full bg-rose px-5 py-2 text-sm font-semibold text-rose-foreground transition hover:opacity-90">Create class</button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Class name">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={`e.g. ${term.verticalAdjective === "dance" ? "Tiny Tots Ballet" : term.verticalAdjective === "yoga" ? "Morning Vinyasa Flow" : term.verticalAdjective === "CrossFit" ? "Monday Strength WOD" : term.verticalAdjective === "music" ? "Beginner Piano Group" : `Intro ${term.class} A`}`}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={term.classStyle}>
              <Select value={form.style} onChange={(v) => setForm({ ...form, style: v as ClassStyle })} options={term.styleCategories as string[]} />
            </Field>
            <Field label="Age group">
              <Select value={form.ageGroup} onChange={(v) => setForm({ ...form, ageGroup: v as AgeGroup })} options={AGES} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Day">
              <Select value={form.day} onChange={(v) => setForm({ ...form, day: v as WeekDay })} options={DAYS} />
            </Field>
            <Field label="Start">
              <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-rose focus:ring-2 focus:ring-rose/20" />
            </Field>
            <Field label="Minutes">
              <input type="number" value={form.durationMins} onChange={(e) => setForm({ ...form, durationMins: Number(e.target.value) })} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-rose focus:ring-2 focus:ring-rose/20" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Teacher">
              <Select value={form.teacherId} onChange={(v) => setForm({ ...form, teacherId: v })} options={teachers.map((t) => t.id)} labels={Object.fromEntries(teachers.map((t) => [t.id, t.name]))} />
            </Field>
            <Field label="Room">
              <Select value={form.room} onChange={(v) => setForm({ ...form, room: v })} options={["Studio A", "Studio B", "Studio C"]} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Capacity">
              <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-rose focus:ring-2 focus:ring-rose/20" />
            </Field>
            <Field label="Monthly price ($)">
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-rose focus:ring-2 focus:ring-rose/20" />
            </Field>
          </div>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3">
            <span className="text-sm font-medium">Participates in {term.event.toLowerCase()}</span>
            <input type="checkbox" checked={form.inRecital} onChange={(e) => setForm({ ...form, inRecital: e.target.checked })} className="h-5 w-5 accent-rose" />
          </label>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, options, labels }: { value: string; onChange: (v: string) => void; options: string[]; labels?: Record<string, string> }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20">
      {options.map((o) => (
        <option key={o} value={o}>{labels?.[o] ?? o}</option>
      ))}
    </select>
  );
}
