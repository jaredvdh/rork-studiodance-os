import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileSignature,
  FileText,
  Loader2,
  Lock,
  Shield,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";

import { useParent } from "@/data/parentStore";
import { useWaivers } from "@/data/store";
import { WAIVER_TYPE_LABELS } from "@/data/types";
import type { WaiverTemplate, WaiverVersion } from "@/data/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ── Digital signing wizard ─────────────────────────────────────── */

type SignStep = "view" | "sign" | "review" | "done";

function SigningWizard({
  template,
  version,
  studentName,
  studentId,
  onComplete,
  onClose,
}: {
  template: WaiverTemplate;
  version: WaiverVersion;
  studentName: string;
  studentId: string;
  onComplete: () => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<SignStep>("view");
  const [signerName, setSignerName] = useState("");
  const [relationship, setRelationship] = useState("Parent");
  const [eSignConsent, setESignConsent] = useState(false);
  const [guardianConfirmed, setGuardianConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { primaryCaregiver } = useParent();
  const { signWaiver } = useWaivers();

  const handleSubmit = async () => {
    if (!signerName.trim() || !eSignConsent || !guardianConfirmed) return;
    setIsSubmitting(true);
    try {
      signWaiver({
        waiverTemplateId: template.id,
        waiverVersionId: version.id,
        studentId,
        caregiverId: primaryCaregiver?.id,
        signerName: signerName.trim(),
        signerRelationship: relationship,
        guardianAuthorityConfirmed: guardianConfirmed,
      });
      setStep("done");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: SignStep[] = ["view", "sign", "review", "done"];
  const stepIdx = steps.indexOf(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-amber-200/70 bg-white shadow-2xl animate-float-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-amber-200/30">
          <div>
            <h3 className="font-display text-lg font-semibold">{template.title}</h3>
            <p className="text-xs text-muted-foreground">
              For {studentName} · {WAIVER_TYPE_LABELS[template.type]}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-amber-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-1 px-5 py-3 bg-amber-50/50 border-b border-amber-200/20">
          {["View", "Sign", "Review", "Done"].map((label, i) => (
            <div key={label} className="flex items-center gap-1 flex-1">
              <div
                className={cn(
                  "flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold",
                  i < stepIdx
                    ? "bg-success text-white"
                    : i === stepIdx
                      ? "bg-amber-500 text-white"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {i < stepIdx ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  i === stepIdx ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
              {i < 3 && <div className="flex-1 h-px bg-amber-200 mx-2" />}
            </div>
          ))}
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === "view" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-4">
                <Shield className="h-5 w-5 text-amber-600 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Please read this document carefully. You will be asked to confirm
                  your identity and consent before signing.
                </p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-white p-5 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/80">
                  {version.bodyMarkdown ?? version.bodyHtml ?? "Form content not available."}
                </pre>
              </div>

              <button
                onClick={() => setStep("sign")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600"
              >
                I have read and understood
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === "sign" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-4">
                <Lock className="h-5 w-5 text-amber-600 mb-2" />
                <p className="text-sm font-medium">Digital signature</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your typed name constitutes a legally binding electronic signature
                  under the ESIGN Act. By signing, you agree to the terms of this document.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Your full legal name
                    <span className="text-destructive ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder={primaryCaregiver ? `${primaryCaregiver.first_name} ${primaryCaregiver.last_name}` : "Type your full name"}
                    className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Relationship to participant</label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
                  >
                    <option>Parent</option>
                    <option>Legal Guardian</option>
                    <option>Grandparent</option>
                    <option>Other authorized caregiver</option>
                  </select>
                </div>

                <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-white p-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eSignConsent}
                    onChange={(e) => setESignConsent(e.target.checked)}
                    className="mt-0.5 accent-amber-500"
                  />
                  <div>
                    <p className="text-sm font-medium">
                      I consent to use an electronic signature
                      <span className="text-destructive ml-0.5">*</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      I agree that my typed name shall have the same legal effect as a
                      handwritten signature.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-white p-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={guardianConfirmed}
                    onChange={(e) => setGuardianConfirmed(e.target.checked)}
                    className="mt-0.5 accent-amber-500"
                  />
                  <div>
                    <p className="text-sm font-medium">
                      Guardian authority confirmation
                      <span className="text-destructive ml-0.5">*</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      I confirm I am the parent, legal guardian, or authorized caregiver
                      permitted to sign for this participant.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setStep("view")}
                  className="flex-1 rounded-lg border border-amber-200 px-4 py-2.5 text-sm font-medium"
                >
                  <ChevronLeft className="inline-block mr-1 h-4 w-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep("review")}
                  disabled={!signerName.trim() || !eSignConsent || !guardianConfirmed}
                  className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  Review
                  <ChevronRight className="inline-block ml-1 h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <h4 className="font-display text-lg font-semibold">Review before signing</h4>

              <div className="rounded-lg border border-amber-200 bg-white divide-y divide-amber-100">
                <div className="flex justify-between p-3 text-sm">
                  <span className="text-muted-foreground">Document</span>
                  <span className="font-medium">{template.title}</span>
                </div>
                <div className="flex justify-between p-3 text-sm">
                  <span className="text-muted-foreground">For</span>
                  <span className="font-medium">{studentName}</span>
                </div>
                <div className="flex justify-between p-3 text-sm">
                  <span className="text-muted-foreground">Signed by</span>
                  <span className="font-medium">{signerName}</span>
                </div>
                <div className="flex justify-between p-3 text-sm">
                  <span className="text-muted-foreground">Relationship</span>
                  <span className="font-medium">{relationship}</span>
                </div>
                <div className="flex justify-between p-3 text-sm">
                  <span className="text-muted-foreground">E-sign consent</span>
                  <span className="font-medium text-success">
                    <Check className="inline h-3.5 w-3.5 mr-0.5" />
                    Confirmed
                  </span>
                </div>
                <div className="flex justify-between p-3 text-sm">
                  <span className="text-muted-foreground">Guardian authority</span>
                  <span className="font-medium text-success">
                    <Check className="inline h-3.5 w-3.5 mr-0.5" />
                    Confirmed
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-4 text-sm">
                <p className="text-muted-foreground">
                  This form is provided by the studio. Contact the studio directly if you
                  have questions before signing. Once submitted, this signed record cannot
                  be deleted.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setStep("sign")}
                  className="flex-1 rounded-lg border border-amber-200 px-4 py-2.5 text-sm font-medium"
                >
                  <ChevronLeft className="inline-block mr-1 h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <FileSignature className="inline-block mr-1.5 h-4 w-4" />
                      Submit signed document
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-success/10 mb-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h4 className="font-display text-xl font-semibold">Document signed</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                The signed waiver has been recorded for {studentName}. Thank you.
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Digitally signed in StudioFlow · {new Date().toLocaleDateString()}
              </p>
              <button
                onClick={onComplete}
                className="mt-6 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────── */

export default function ParentWaivers() {
  const { children: myStudents, primaryCaregiver } = useParent();
  const { templates, versions: waiverVersions, signatures, hasOutstandingWaivers } = useWaivers();
  const [signing, setSigning] = useState<{
    template: WaiverTemplate;
    studentId: string;
    studentName: string;
  } | null>(null);

  const publishedTemplates = useMemo(
    () => templates.filter((t) => t.status === "published"),
    [templates],
  );

  const requiredTemplates = useMemo(
    () => publishedTemplates.filter((t) => t.required),
    [publishedTemplates],
  );

  const optionalTemplates = useMemo(
    () => publishedTemplates.filter((t) => !t.required),
    [publishedTemplates],
  );

  /* Per-student signature status */
  const getStudentTemplateStatus = (
    studentId: string,
    templateId: string,
  ): "signed" | "pending" => {
    const hasSig = signatures.some(
      (s) =>
        s.waiverTemplateId === templateId &&
        s.studentId === studentId &&
        s.status === "signed",
    );
    return hasSig ? "signed" : "pending";
  };

  /* Counts */
  const stats = useMemo(() => {
    if (myStudents.length === 0) return { pending: 0, signed: 0 };
    let pending = 0;
    let totalChecks = 0;
    for (const s of myStudents) {
      for (const t of requiredTemplates) {
        totalChecks++;
        if (getStudentTemplateStatus(s.id, t.id) === "pending") pending++;
      }
    }
    return { pending, signed: totalChecks - pending };
  }, [myStudents, requiredTemplates, signatures]);

  const handleSignComplete = () => setSigning(null);

  if (myStudents.length === 0) {
    return (
      <div className="space-y-6 pb-20 lg:pb-0">
        <div className="animate-float-up">
          <p className="text-sm text-muted-foreground">Legal & consent</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Waivers
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileSignature className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-display text-xl font-semibold">
            No children to sign for
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your children first, then come back to sign waivers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="animate-float-up">
          <p className="text-sm text-muted-foreground">Legal & consent</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Waivers
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and sign required forms for your children
          </p>
        </div>
      </div>

      {/* Status summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-200/70 bg-white p-5 shadow-soft animate-float-up">
          <FileText className="h-5 w-5 text-muted-foreground mb-3" />
          <p className="font-display text-2xl font-semibold">
            {requiredTemplates.length}
          </p>
          <p className="text-sm text-muted-foreground">Required forms</p>
        </div>
        <div className="rounded-2xl border border-amber-200/70 bg-white p-5 shadow-soft animate-float-up [animation-delay:60ms]">
          <CheckCircle2 className="h-5 w-5 text-success mb-3" />
          <p className="font-display text-2xl font-semibold text-success">
            {stats.signed}
          </p>
          <p className="text-sm text-muted-foreground">Signed</p>
        </div>
        <div
          className={cn(
            "rounded-2xl border p-5 shadow-soft animate-float-up [animation-delay:120ms]",
            stats.pending > 0
              ? "border-amber-200 bg-amber-50/50"
              : "border-amber-200/70 bg-white",
          )}
        >
          <Clock className="h-5 w-5 text-amber-500 mb-3" />
          <p className="font-display text-2xl font-semibold">
            {stats.pending}
          </p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>
      </div>

      {/* Required forms */}
      {requiredTemplates.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-semibold">
            Required forms
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              Must be completed for each child
            </span>
          </h3>
          {requiredTemplates.map((template) => (
            <div
              key={template.id}
              className="rounded-2xl border border-amber-200/70 bg-white p-5 shadow-soft"
            >
              <div className="flex items-start gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                  <FileSignature className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{template.title}</h4>
                    <span className="rounded-full bg-rose/10 px-2 py-0.5 text-xs font-semibold text-rose">
                      Required
                    </span>
                  </div>
                  {template.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  )}

                  <div className="mt-4 space-y-2">
                    {myStudents.map((s) => {
                      const status = getStudentTemplateStatus(s.id, template.id);
                      const version = publishingTemplateVersion(template.id);

                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-lg bg-amber-50/60 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{s.name}</span>
                          </div>
                          <div>
                            {status === "signed" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                                <CheckCircle2 className="h-3 w-3" />
                                Signed
                              </span>
                            ) : version ? (
                              <button
                                onClick={() =>
                                  setSigning({
                                    template,
                                    studentId: s.id,
                                    studentName: s.name,
                                  })
                                }
                                className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-amber-900 transition hover:opacity-90"
                              >
                                Sign now
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                Coming soon
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Optional forms */}
      {optionalTemplates.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-semibold">
            Optional forms
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              Complete if applicable
            </span>
          </h3>
          {optionalTemplates.map((template) => (
            <div
              key={template.id}
              className="rounded-2xl border border-amber-200/70 bg-white p-5 shadow-soft"
            >
              <div className="flex items-start gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{template.title}</h4>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Optional
                    </span>
                  </div>
                  {template.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  )}

                  <div className="mt-4 space-y-2">
                    {myStudents.map((s) => {
                      const status = getStudentTemplateStatus(s.id, template.id);
                      const version = publishingTemplateVersion(template.id);

                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-lg bg-amber-50/60 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{s.name}</span>
                          </div>
                          <div>
                            {status === "signed" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                                <CheckCircle2 className="h-3 w-3" />
                                Signed
                              </span>
                            ) : version ? (
                              <button
                                onClick={() =>
                                  setSigning({
                                    template,
                                    studentId: s.id,
                                    studentName: s.name,
                                  })
                                }
                                className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:opacity-90"
                              >
                                Sign
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Signed history */}
      <div>
        <h3 className="font-display text-lg font-semibold mb-4">
          Signed documents
        </h3>
        <div className="space-y-2">
          {myStudents.map((s) => {
            const signedFor = publishedTemplates.filter((t) =>
              getStudentTemplateStatus(s.id, t.id) === "signed",
            );
            if (signedFor.length === 0) return null;

            return (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-amber-200/70 bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {signedFor.length} form{signedFor.length !== 1 ? "s" : ""} signed
                      {" · "}
                      <span className="text-success/80 font-medium">
                        Digitally signed in StudioFlow
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Signing wizard modal */}
      {signing && (() => {
        const version = publishingTemplateVersion(signing.template.id);
        if (!version) return null;
        return (
          <SigningWizard
            template={signing.template}
            version={version}
            studentId={signing.studentId}
            studentName={signing.studentName}
            onComplete={handleSignComplete}
            onClose={() => setSigning(null)}
          />
        );
      })()}
    </div>
  );

  /* Helper: get current published version for a template */
  function publishingTemplateVersion(templateId: string): WaiverVersion | undefined {
    return waiverVersions
      .filter((v) => v.waiverTemplateId === templateId && !v.archivedAt)
      .sort((a, b) => b.versionNumber - a.versionNumber)[0];
  }
}
