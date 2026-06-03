import { useState } from "react";
import { AlertTriangle, Loader2, Mail, Megaphone, Plus, Send, Sparkles, Trophy, Users } from "lucide-react";

import Modal from "@/components/Modal";
import { supabase } from "@/lib/supabase";
import { aiDraftAnnouncement } from "@/lib/ai";
import { useStudio, useStudioData } from "@/data/store";
import type { Announcement, AnnouncementScope } from "@/data/types";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const scopeMeta: Record<AnnouncementScope, { icon: typeof Megaphone; chip: string }> = {
  "Studio-wide": { icon: Users, chip: "bg-plum/10 text-plum" },
  Class: { icon: Megaphone, chip: "bg-teal/10 text-teal" },
  Recital: { icon: Trophy, chip: "bg-gold/15 text-gold" },
  Emergency: { icon: AlertTriangle, chip: "bg-destructive/10 text-destructive" },
};

const SCOPES: AnnouncementScope[] = ["Studio-wide", "Class", "Recital", "Emergency"];

export default function Announcements() {
  const { studio } = useStudio();
  const { announcements: initial } = useStudioData();
  const [items, setItems] = useState<Announcement[]>(initial);
  const [open, setOpen] = useState<boolean>(false);
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent">("idle");
  const [draftLoading, setDraftLoading] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", scope: "Studio-wide" as AnnouncementScope });

  async function handleAiDraft() {
    setDraftLoading(true);
    try {
      const text = await aiDraftAnnouncement(
        `Studio: ${studio.name}. Type: ${form.scope} announcement. Studio is a ${studio.vertical} studio in ${studio.city}.`,
        form.scope,
      );
      if (text) setForm((prev) => ({ ...prev, body: prev.body ? `${prev.body}

${text}` : text }));
    } catch {
      // Silently fail
    } finally {
      setDraftLoading(false);
    }
  }

  async function send() {
    if (!form.title.trim()) return;
    setSendState("sending");
    const id = `a${Date.now()}`;
    const a: Announcement = {
      id,
      studioId: studio.id,
      title: form.title.trim(),
      body: form.body.trim(),
      scope: form.scope,
      sentAt: new Date().toISOString(),
      audience: form.scope === "Studio-wide" ? "All families" : form.scope,
      reach: 0,
    };
    setItems((prev) => [a, ...prev]);
    try {
      // Persist to Supabase
      await supabase.from("announcements").insert({
        id, studio_id: studio.id, title: a.title, body: a.body,
        scope: a.scope, sent_at: a.sentAt, audience: a.audience, reach: 0,
      });
      // Trigger edge function for delivery
      const token = localStorage.getItem("rork:access_token");
      await fetch("https://qhourrdjhxwofweowkal.supabase.co/functions/v1/send-announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ announcementId: id }),
      });
    } catch {
      // Graceful degradation — announcement is shown locally even if delivery fails
    }
    setSendState("sent");
    setOpen(false);
    setForm({ title: "", body: "", scope: "Studio-wide" });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Announcements</h2>
          <p className="text-sm text-muted-foreground">Delivered in-app and by email · push notifications coming soon</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-rose px-4 py-2.5 text-sm font-semibold text-rose-foreground shadow-soft transition hover:opacity-90">
          <Plus className="h-4 w-4" /> New message
        </button>
      </div>

      <div className="space-y-4">
        {items.map((a, i) => {
          const meta = scopeMeta[a.scope];
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
        description="Reach the right families instantly."
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
                  onClick={() => setForm({ ...form, scope: s })}
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
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Recital rehearsal on May 25th"
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
