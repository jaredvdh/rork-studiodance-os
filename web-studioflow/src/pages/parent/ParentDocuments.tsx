import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Clock,
  Download,
  FileText,
  FileWarning,
  FolderOpen,
  ShieldAlert,
  ShieldCheck,
  Upload,
  UserCheck,
} from "lucide-react";

import { useParent } from "@/data/parentStore";
import { useDocuments, useWaivers } from "@/data/store";
import { DOCUMENT_TYPE_LABELS } from "@/data/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type DocTab = "waivers" | "uploads" | "all";

export default function ParentDocuments() {
  const { children: myStudents } = useParent();
  const { signatures } = useWaivers();
  const { documents } = useDocuments();
  const [tab, setTab] = useState<DocTab>("all");

  const childIds = useMemo(() => myStudents.map((s) => s.id), [myStudents]);

  /* Signed waiver documents */
  const signedWaivers = useMemo(
    () =>
      signatures.filter(
        (s) => s.status === "signed" && childIds.includes(s.studentId ?? ""),
      ),
    [signatures, childIds],
  );

  /* Uploaded external documents for this family's children */
  const uploadedDocs = useMemo(
    () =>
      documents.filter(
        (d) =>
          (d.studentId && childIds.includes(d.studentId)) ||
          (d.familyId && d.visibility === "caregiver_visible"),
      ),
    [documents, childIds],
  );

  const allDocs = useMemo(
    () => [
      ...signedWaivers.map((s) => ({
        id: s.id,
        title: `Signed waiver — student #${s.studentId?.slice(0, 6) ?? "?"}`,
        type: "Digital waiver signature",
        date: s.signedAt,
        status: s.status as string,
        source: "digital" as const,
      })),
      ...uploadedDocs.map((d) => ({
        id: d.id,
        title: d.title,
        type: DOCUMENT_TYPE_LABELS[d.documentType] ?? d.documentType,
        date: d.uploadedAt,
        status: d.verificationStatus,
        source: "upload" as const,
      })),
    ],
    [signedWaivers, uploadedDocs],
  );

  const filteredDocs = useMemo(() => {
    if (tab === "waivers") return allDocs.filter((d) => d.source === "digital");
    if (tab === "uploads") return allDocs.filter((d) => d.source === "upload");
    return allDocs;
  }, [allDocs, tab]);

  if (myStudents.length === 0) {
    return (
      <div className="space-y-6 pb-20 lg:pb-0">
        <div className="animate-float-up">
          <p className="text-sm text-muted-foreground">Compliance</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Documents
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-display text-xl font-semibold">
            No children registered
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a child to view and manage their documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="animate-float-up">
          <p className="text-sm text-muted-foreground">Compliance</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Documents
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed waivers, uploaded forms, and family documents
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-amber-50/50 p-1 border border-amber-200/40 w-fit">
        {([
          { key: "all", label: "All", count: allDocs.length },
          { key: "waivers", label: "Signed waivers", count: signedWaivers.length },
          { key: "uploads", label: "Uploaded", count: uploadedDocs.length },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition",
              tab === t.key
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            <span className="ml-1.5 text-muted-foreground/60">{t.count}</span>
          </button>
        ))}
      </div>

      {filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-display text-xl font-semibold">
            No documents yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === "waivers"
              ? "Sign your waivers and they'll appear here."
              : tab === "uploads"
                ? "Documents uploaded by the studio will appear here."
                : "Your signed waivers and uploaded documents will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-xl border border-amber-200/70 bg-white px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {doc.source === "digital" ? (
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-success/10">
                    <ShieldCheck className="h-4 w-4 text-success" />
                  </div>
                ) : (
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-100">
                    <Upload className="h-4 w-4 text-amber-600" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.type}
                    {" · "}
                    {doc.date ? formatDate(doc.date) : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {doc.source === "digital" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                    <ShieldCheck className="h-3 w-3" />
                    Digitally signed in StudioFlow
                  </span>
                ) : (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      doc.status === "verified"
                        ? "bg-success/10 text-success"
                        : doc.status === "rejected"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {doc.status === "verified" ? (
                      <UserCheck className="h-3 w-3" />
                    ) : doc.status === "rejected" ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {doc.status === "unverified"
                      ? "Uploaded external document"
                      : doc.status === "verified"
                        ? "Verified by staff"
                        : "Rejected"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-4 text-xs text-muted-foreground">
        <p>
          Documents labelled "Digitally signed in StudioFlow" are electronic
          signatures recorded through the StudioFlow platform. Documents labelled
          "Uploaded external document" were provided to the studio outside of
          StudioFlow. Contact the studio directly if you have questions about any
          document.
        </p>
      </div>
    </div>
  );
}
