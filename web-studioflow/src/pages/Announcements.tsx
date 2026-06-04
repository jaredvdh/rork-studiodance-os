import { useState } from "react";
import { AlertTriangle, Loader2, Mail, Megaphone, Plus, Send, Sparkles, Target, Trophy, Users } from "lucide-react";

import Modal from "@/components/Modal";
import { supabase } from "@/lib/supabase";
import { aiDraftAnnouncement } from "@/lib/ai";
import { useAnnouncements, useClasses, useStudio, useStudents, useTeachers } from "@/data/store";
import type { AnnouncementScope } from "@/data/types";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const scopeMeta: Record<AnnouncementScope, { icon: typeof Megaphone; chip: string }> = {
  "Studio-wide": { icon: Users, chip: "bg-plum/10 text-plum" },
  "Class": { icon: Target, chip: "bg-teal/10 text-teal" },
  "Recital": { icon: Trophy, chip: "bg-gold/15 text-gold" },
  "Emergency": { icon: AlertTriangle, chip: "bg-destructive/10 text-destructive" },
};

const SCOPES: AnnouncementScope[] = ["Studio-wide", "Class", "Recital", "Emergency"];

/** Derive a human-readable audience string from scope + target */
function buildAudience(
  scope: AnnouncementScope,
  targetId: string,
  classes: { id: string; name: string }[],
  teachers: { id: string; name: string }[],
): string {
  if (!targetId) {
    if (scope === "Studio-wide") return "All families";
    if (scope === "Recital") return "All recital participants";
    if (scope === "Emergency") return "All families";
    if (scope === "Class") return "All classes";
  }
  const cls = classes.find((c) => c.id === targetId);
  if (cls) return cls.name;
  const tch = teachers.find((t) => t.id === targetId);
  if (tch) return `${tch.name}'s classes`;
  return targetId;
}

export default function Announcements() {
  const { studio } = useStudio();
  const { announcements: items, addAnnouncement } = useAnnouncements();
  const { classes } = useClasses();
  const { teachers } = useTeachers();
  const { students } = useStudents();
  const [open, setOpen] = useState<boolean>(false);
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent">("idle");
  const [draftLoading, setDraftLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    scope: "Studio-wide" as AnnouncementScope,
    targetId: "",
  });

  // Filter targets based on scope
  const targets = form.scope === "Class"
    ? classes.map((c) => ({ id: c.id, label: `${c.name} (${c.day} ${c.startTime})` }))
    : form.scope === "Recital"
    ? classes.filter((c) => c.inRecital).map((c) => ({ id: c.id, label: c.name }))
    : [];

  async function handleAiDraft() {
    setDraftLoading(true);
    try {
      const text = await aiDraftAnnouncement(
        `Studio: ${studio.name}. Type: ${form.scope} announcement. Studio is a ${studio.vertical} studio in ${studio.city}.`,
        form.scope,
      );
      if (text) setForm((prev) => ({ ...prev, body: prev.body ? `${prev.body}\n\n${text}` : text }));
    } catch {
      // Silently fail
    } finally {
      setDraftLoading(false);
    }
  }

  async function send() {
    if (!form.title.trim()) return;
    setSendState("sending");

    const audience = buildAudience(form.scope, form.targetId, classes, teachers);

    // addAnnouncement now persists to Supabase via the shared context mutation
    addAnnouncement({
      title: form.title.trim(),
      body: form.body.trim(),
      scope: form.scope,
      audience,
    });

    setSendState("sent");
    setOpen(false);
    setForm({ title: "", body: "", scope: "Studio-wide", targetId: "" });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Announcements</h2>
          <p className="text-sm text-muted-foreground">Delivered in-app and by email · targets {students.length} families</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-rose px-4 py-2.5 text-sm font-semibold text-rose-foreground shadow-soft transition hover:opacity-90">
          <Plus className="h-4 w-4" /> New message
        </button>
      </div>

      <div className="space-y-4">
        {items.map((a, i) => {
          const meta = scopeMeta[a.scope] ?? scopeMeta["Studio-wide"];
          return (
            <div key={a.id} className="animate-float-up rounded-2xl border border-border/70 bg-card p-5 shadow-soft" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start gap-4">
                <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", meta.chip)}>
                  <meta.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-semibold">{a.title}</h3>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", meta.chip)}>{a.scope}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {a.audience}</span>
                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {a.reach} delivered</span>
                    <span>{relativeTime(a.sentAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Compose announcement"
        description="Reach the right families with precision targeting."
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-secondary">Cancel</button>
            <button
              type="button"
              onClick={handleAiDraft}
              disabled={draftLoading}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose/30 bg-rose/5 px-4 py-2 text-sm font-semibold text-rose transition hover:bg-rose/10 disabled:opacity-60"
            >
              {draftLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              AI Draft
            </button>
            <button onClick={send} disabled={sendState === "sending"} className="inline-flex items-center gap-2 rounded-full bg-rose px-5 py-2 text-sm font-semibold text-rose-foreground transition hover:opacity-90 disabled:opacity-60">
              {sendState === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sendState === "sending" ? "Sending…" : "Send now"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Audience</span>
            <div className="flex flex-wrap gap-2">
              {SCOPES.map((s) => (
                <button
                  key={s}
                  onClick={() => setForm({ ...form, scope: s, targetId: "" })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                    form.scope === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground/70 hover:bg-secondary",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Targeted selection when Class or Recital scope is chosen */}
          {targets.length > 0 && (
            <div>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {form.scope === "Recital" ? "Select show" : "Target specific class"}
              </span>
              <select
                value={form.targetId}
                onChange={(e) => setForm({ ...form, targetId: e.target.value })}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
              >
                <option value="">{form.scope === "Recital" ? "All recital classes" : "All classes"}</option>
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
          )}

          {form.targetId && (
            <div className="rounded-xl border border-teal/20 bg-teal/5 px-4 py-2.5 text-sm text-teal">
              <Target className="mr-1.5 inline h-4 w-4" />
              Targeting: <span className="font-semibold">{buildAudience(form.scope, form.targetId, classes, teachers)}</span>
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={form.scope === "Emergency" ? "URGENT: " : form.scope === "Class" ? "e.g. Tuesday Ballet parents — rehearsal update" : "e.g. Recital rehearsal on May 25th"}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Message</span>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={4}
              placeholder="Write your message to families…"
              className="w-full resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
