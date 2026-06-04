import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  FileSignature,
  FileText,
  Globe,
  Layers,
  Pencil,
  Plus,
  Send,
  Shield,
  ShieldCheck,
  ShieldOff,
  Tag,
  Users,
  X,
} from "lucide-react";

import { useWaivers, useStudents } from "@/data/store";
import { WAIVER_TYPE_LABELS } from "@/data/types";
import type {
  WaiverTemplate,
  WaiverTemplateType,
  TemplateStatus,
  WaiverVersion,
} from "@/data/types";
import { cn } from "@/lib/utils";

/* ── Colour tokens per template status ─────────────────────────── */

const statusStyles: Record<TemplateStatus, string> = {
  draft: "bg-amber-100 text-amber-700 border-amber-200",
  published: "bg-emerald-100 text-emerald-700 border-emerald-200",
  archived: "bg-slate-100 text-slate-500 border-slate-200",
};

const typeIcons: Record<WaiverTemplateType, typeof FileText> = {
  liability: Shield,
  medical_consent: BookOpen,
  photo_video: Eye,
  code_of_conduct: Users,
  privacy_data: ShieldCheck,
  payment_auth: FileText,
  travel_consent: Globe,
  event_release: Tag,
  custom: FileSignature,
};

/* ── Create / Edit modal ──────────────────────────────────────── */

function TemplateModal({
  open,
  onClose,
  onSave,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    type: WaiverTemplateType;
    required: boolean;
  }) => void;
  editing?: WaiverTemplate;
}) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [desc, setDesc] = useState(editing?.description ?? "");
  const [type, setType] = useState<WaiverTemplateType>(editing?.type ?? "liability");
  const [required, setRequired] = useState(editing?.required ?? false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-amber-200/70 bg-white p-6 shadow-2xl animate-float-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-semibold">
            {editing ? "Edit template" : "New waiver template"}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-amber-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. General Liability Waiver"
              className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              placeholder="What does this form cover?"
              className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as WaiverTemplateType)}
              className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
            >
              {Object.entries(WAIVER_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="accent-amber-500"
            />
            Required for all participants
          </label>

          <div className="flex items-center gap-3 pt-2">
            <button onClick={onClose} className="flex-1 rounded-lg border border-amber-200 px-4 py-2 text-sm font-medium">
              Cancel
            </button>
            <button
              onClick={() => { onSave({ title, description: desc, type, required }); onClose(); }}
              disabled={!title.trim()}
              className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {editing ? "Save" : "Create draft"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Version editor modal ─────────────────────────────────────── */

function VersionModal({
  open,
  onClose,
  onPublish,
  template,
  currentVersion,
}: {
  open: boolean;
  onClose: () => void;
  onPublish: (bodyMarkdown: string) => void;
  template: WaiverTemplate;
  currentVersion?: WaiverVersion;
}) {
  const [body, setBody] = useState(currentVersion?.bodyMarkdown ?? "");

  if (!open) return null;

  const isNew = !currentVersion;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-amber-200/70 bg-white p-6 shadow-2xl animate-float-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-xl font-semibold">{template.title}</h3>
            <p className="text-sm text-muted-foreground">
              {isNew ? "Create version 1" : `Editing version ${currentVersion.versionNumber}`}
              {isNew && " — publish when ready"}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-amber-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">
            Waiver body (Markdown)
            {template.status === "published" && (
              <span className="ml-2 text-xs text-amber-600 font-normal">
                Changes will create a new version — existing signed copies are preserved
              </span>
            )}
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={16}
            placeholder="# Waiver Title&#10;&#10;Write the full waiver text here..."
            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-mono focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-amber-200 px-4 py-2 text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={() => { onPublish(body); onClose(); }}
            disabled={!body.trim()}
            className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
          >
            <Send className="mr-1.5 inline-block h-4 w-4" />
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────── */

export default function Waivers() {
  const {
    templates,
    versions,
    signatures,
    addTemplate,
    updateTemplate,
    createVersion,
  } = useWaivers();
  const { students } = useStudents();
  const [showCreate, setShowCreate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WaiverTemplate | undefined>();
  const [versionTemplate, setVersionTemplate] = useState<WaiverTemplate | undefined>();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  /* ── Derived compliance stats ────────────────────────────────── */
  const stats = useMemo(() => {
    const published = templates.filter((t) => t.status === "published");
    const required = published.filter((t) => t.required);
    const totalStudents = students.length;
    const fullyCompliant = students.filter((s) =>
      required.every((t) =>
        signatures.some((sig) => sig.waiverTemplateId === t.id && sig.studentId === s.id && sig.status === "signed"),
      ),
    ).length;
    return {
      totalTemplates: templates.length,
      publishedTemplates: published.length,
      totalSignatures: signatures.length,
      compliantStudents: fullyCompliant,
      totalStudents,
      complianceRate: totalStudents > 0 ? Math.round((fullyCompliant / totalStudents) * 100) : 0,
    };
  }, [templates, signatures, students]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreate = (data: { title: string; description: string; type: WaiverTemplateType; required: boolean }) => {
    addTemplate({
      ...data,
      status: "draft",
      appliesTo: { scope: "all" },
      renewalPeriod: "once",
    });
  };

  const handlePublish = (templateId: string, bodyMarkdown: string) => {
    createVersion(templateId, bodyMarkdown, true);
  };

  const getVersionForTemplate = (templateId: string): WaiverVersion | undefined =>
    versions.filter((v) => v.waiverTemplateId === templateId).sort((a, b) => b.versionNumber - a.versionNumber)[0];

  const getSignatureCount = (templateId: string): number =>
    signatures.filter((s) => s.waiverTemplateId === templateId && s.status === "signed").length;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="animate-float-up">
          <p className="text-sm text-muted-foreground">Compliance</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Waivers & Documents
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.totalTemplates > 0
              ? `${stats.publishedTemplates} published · ${stats.complianceRate}% student compliance`
              : "Create your first waiver template to get started"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingTemplate(undefined);
              setShowCreate(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New template
          </button>
        </div>
      </div>

      {/* Compliance summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-amber-200/70 bg-white p-5 shadow-soft animate-float-up">
          <FileText className="h-5 w-5 text-muted-foreground mb-3" />
          <p className="font-display text-2xl font-semibold">{stats.publishedTemplates}</p>
          <p className="text-sm text-muted-foreground">Published templates</p>
        </div>
        <div className="rounded-2xl border border-amber-200/70 bg-white p-5 shadow-soft animate-float-up [animation-delay:60ms]">
          <FileSignature className="h-5 w-5 text-muted-foreground mb-3" />
          <p className="font-display text-2xl font-semibold">{stats.totalSignatures}</p>
          <p className="text-sm text-muted-foreground">Signed records</p>
        </div>
        <div className="rounded-2xl border border-amber-200/70 bg-white p-5 shadow-soft animate-float-up [animation-delay:120ms]">
          <CheckCircle2 className="h-5 w-5 text-success mb-3" />
          <p className="font-display text-2xl font-semibold text-success">{stats.compliantStudents}/{stats.totalStudents}</p>
          <p className="text-sm text-muted-foreground">Fully compliant students</p>
        </div>
        <div
          className={cn(
            "rounded-2xl border p-5 shadow-soft animate-float-up [animation-delay:180ms]",
            stats.totalStudents - stats.compliantStudents > 0
              ? "border-amber-200 bg-amber-50/50"
              : "border-amber-200/70 bg-white",
          )}
        >
          <AlertTriangle className="h-5 w-5 text-amber-500 mb-3" />
          <p className="font-display text-2xl font-semibold">{stats.totalStudents - stats.compliantStudents}</p>
          <p className="text-sm text-muted-foreground">Missing waivers</p>
        </div>
      </div>

      {/* Template list */}
      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileSignature className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-display text-xl font-semibold">No templates yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first waiver template to begin collecting digital signatures.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-display text-lg font-semibold">Templates</h3>
          {templates.map((template) => {
            const isExpanded = expandedIds.has(template.id);
            const ver = getVersionForTemplate(template.id);
            const sigCount = getSignatureCount(template.id);
            const Icon = typeIcons[template.type] ?? FileText;

            return (
              <div
                key={template.id}
                className="rounded-2xl border border-amber-200/70 bg-white shadow-soft overflow-hidden"
              >
                {/* Header row */}
                <div className="flex items-center gap-4 p-4">
                  <button onClick={() => toggleExpand(template.id)} className="shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold truncate">{template.title}</h4>
                      {template.required && (
                        <span className="shrink-0 rounded-full bg-rose/10 px-2 py-0.5 text-xs font-semibold text-rose">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {WAIVER_TYPE_LABELS[template.type]}
                      {ver ? ` · v${ver.versionNumber}` : ""}
                      {sigCount > 0 ? ` · ${sigCount} signed` : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize shrink-0",
                      statusStyles[template.status],
                    )}
                  >
                    {template.status}
                  </span>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {template.status !== "archived" && (
                      <>
                        <button
                          onClick={() => {
                            const currentVer = getVersionForTemplate(template.id);
                            setVersionTemplate(template);
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-amber-50 hover:text-amber-700"
                          title={template.status === "draft" ? "Write & publish" : "New version"}
                        >
                          {template.status === "draft" ? (
                            <Pencil className="h-4 w-4" />
                          ) : (
                            <Layers className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingTemplate(template);
                            setShowCreate(true);
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-amber-50 hover:text-amber-700"
                          title="Edit details"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        const newStatus: TemplateStatus =
                          template.status === "archived" ? "draft" : "archived";
                        updateTemplate(template.id, { status: newStatus });
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-amber-50 hover:text-amber-700"
                      title={template.status === "archived" ? "Restore" : "Archive"}
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-amber-200/40 bg-amber-50/30 p-5 space-y-4">
                    {template.description && (
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    )}

                    {/* Version info */}
                    {ver ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          Current version (v{ver.versionNumber})
                        </p>
                        <div className="rounded-lg border border-amber-200 bg-white p-4 max-h-64 overflow-y-auto">
                          <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/80">
                            {ver.bodyMarkdown ?? ver.bodyHtml ?? "(No content)"}
                          </pre>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {ver.publishedAt ? `Published ${new Date(ver.publishedAt).toLocaleDateString()}` : "Draft — not yet published"}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
                        <Clock className="mx-auto h-5 w-5 text-amber-400 mb-1" />
                        <p className="text-sm text-muted-foreground">No content yet — write and publish the first version.</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {template.status !== "archived" && (
                        <button
                          onClick={() => setVersionTemplate(template)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                        >
                          {template.status === "draft" ? (
                            <>
                              <Pencil className="h-3.5 w-3.5" />
                              Write & publish
                            </>
                          ) : (
                            <>
                              <Layers className="h-3.5 w-3.5" />
                              Create new version
                            </>
                          )}
                        </button>
                      )}
                      {sigCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {sigCount} signature{sigCount !== 1 ? "s" : ""} on record
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <TemplateModal
        open={showCreate}
        onClose={() => { setShowCreate(false); setEditingTemplate(undefined); }}
        onSave={(data) => {
          if (editingTemplate) {
            updateTemplate(editingTemplate.id, data);
          } else {
            handleCreate(data);
          }
        }}
        editing={editingTemplate}
      />

      {versionTemplate && (
        <VersionModal
          open={!!versionTemplate}
          onClose={() => setVersionTemplate(undefined)}
          onPublish={(body) => handlePublish(versionTemplate.id, body)}
          template={versionTemplate}
          currentVersion={getVersionForTemplate(versionTemplate.id)}
        />
      )}
    </div>
  );
}
