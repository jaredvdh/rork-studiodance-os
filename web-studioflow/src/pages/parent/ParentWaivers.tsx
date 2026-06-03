import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  FileSignature,
  FileText,
  Shield,
} from "lucide-react";

import { useParent } from "@/data/parentStore";
import type { WaiverStatus } from "@/data/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const waiverForms = [
  {
    id: "w1",
    title: "General Liability Waiver",
    description:
      "Standard liability release for dance class participation and studio premises.",
    required: true,
  },
  {
    id: "w2",
    title: "Medical Information & Consent",
    description:
      "Emergency medical treatment authorization and health history disclosure.",
    required: true,
  },
  {
    id: "w3",
    title: "Media & Photo Release",
    description:
      "Permission for the studio to use photos and videos of your child for promotional purposes.",
    required: false,
  },
  {
    id: "w4",
    title: "Recital Participation Agreement",
    description:
      "Terms and conditions for recital participation including costume costs and rehearsal requirements.",
    required: false,
  },
];

export default function ParentWaivers() {
  const { children: myStudents } = useParent();
  const [signingId, setSigningId] = useState<string | null>(null);

  const pendingStudents = useMemo(
    () => myStudents.filter((s) => s.waiver !== "signed"),
    [myStudents],
  );

  const signedStudents = useMemo(
    () => myStudents.filter((s) => s.waiver === "signed"),
    [myStudents],
  );

  const handleSign = (studentId: string) => {
    setSigningId(studentId);
    setTimeout(() => setSigningId(null), 1500);
  };

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
            {waiverForms.length}
          </p>
          <p className="text-sm text-muted-foreground">Total forms</p>
        </div>
        <div className="rounded-2xl border border-amber-200/70 bg-white p-5 shadow-soft animate-float-up [animation-delay:60ms]">
          <CheckCircle2 className="h-5 w-5 text-success mb-3" />
          <p className="font-display text-2xl font-semibold text-success">
            {signedStudents.length}/{myStudents.length}
          </p>
          <p className="text-sm text-muted-foreground">Children complete</p>
        </div>
        <div
          className={cn(
            "rounded-2xl border p-5 shadow-soft animate-float-up [animation-delay:120ms]",
            pendingStudents.length > 0
              ? "border-amber-200 bg-amber-50/50"
              : "border-amber-200/70 bg-white",
          )}
        >
          <Clock className="h-5 w-5 text-amber-500 mb-3" />
          <p className="font-display text-2xl font-semibold">
            {pendingStudents.length}
          </p>
          <p className="text-sm text-muted-foreground">Pending signatures</p>
        </div>
      </div>

      {/* Waiver forms */}
      {myStudents.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-semibold">Required forms</h3>
          {waiverForms.map((form, i) => (
            <div
              key={form.id}
              className="animate-float-up rounded-2xl border border-amber-200/70 bg-white p-5 shadow-soft"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                  <FileSignature className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{form.title}</h4>
                    {form.required ? (
                      <span className="rounded-full bg-rose/10 px-2 py-0.5 text-xs font-semibold text-rose">
                        Required
                      </span>
                    ) : (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Optional
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {form.description}
                  </p>

                  <div className="mt-4 space-y-2">
                    {myStudents.map((s) => {
                      const isSigned = s.waiver === "signed";
                      const isSigning = signingId === s.id;

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
                            {isSigned ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                                <CheckCircle2 className="h-3 w-3" />
                                Signed
                              </span>
                            ) : isSigning ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                                <Clock className="h-3 w-3 animate-spin" />
                                Signing…
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSign(s.id)}
                                className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-amber-900 transition hover:opacity-90"
                              >
                                Sign now
                              </button>
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
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileSignature className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-display text-xl font-semibold">
            No children to sign for
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your children first, then come back to sign waivers.
          </p>
        </div>
      )}

      {/* Signed history */}
      {signedStudents.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-semibold mb-4">
            Signed documents
          </h3>
          <div className="space-y-3">
            {signedStudents.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-xl border border-amber-200/70 bg-white p-3"
              >
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {s.name} — All waivers signed
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Signed {formatDate(new Date().toISOString())} · IP logged
                  </p>
                </div>
                <button className="text-xs font-medium text-amber-700 hover:text-amber-900">
                  View PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
