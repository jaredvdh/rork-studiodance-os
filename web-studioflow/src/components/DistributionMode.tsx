import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  Package,
  Pen,
  Printer,
  Search,
  Shirt,
  Siren,
  User,
  X,
} from "lucide-react";
import type { Costume, CostumeDistribution, Student, UploadedDocument } from "@/data/types";
import SignatureCanvas from "@/components/SignatureCanvas";
import { cn } from "@/lib/utils";
import { useDocuments } from "@/data/store";

interface DistributionModeProps {
  students: Student[];
  costumes: Costume[];
  distributions: CostumeDistribution[];
  onAddDistribution: (d: Omit<CostumeDistribution, "id" | "studioId" | "createdAt">) => Promise<void>;
  onClose: () => void;
  studioName: string;
}

const DEFAULT_CHECKLIST = [
  { label: "Costume", checked: false },
  { label: "Headpiece", checked: false },
  { label: "Tights", checked: false },
  { label: "Accessories", checked: false },
  { label: "Shoes", checked: false },
];

export default function DistributionMode({
  students,
  costumes,
  distributions,
  onAddDistribution,
  onClose,
  studioName,
}: DistributionModeProps) {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedCostume, setSelectedCostume] = useState<string | null>(null);
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST.map((i) => ({ ...i })));
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [showSignature, setShowSignature] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set(distributions.map((d) => d.studentId)));

  const filtered = students.filter((s) => {
    if (completed.has(s.id)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q);
  });

  const toggleChecklist = useCallback((idx: number) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, checked: !item.checked } : item)),
    );
  }, []);

  const allChecked = checklist.every((i) => i.checked);

  const { addDocument } = useDocuments();

  const handleSaveDistribution = useCallback(async (signatureData?: string) => {
    if (!selectedStudent || !selectedCostume) {
      toast.error("Select a student and costume first");
      return;
    }
    setSaving(true);
    try {
      const missing = checklist.filter((i) => !i.checked).map((i) => i.label);
      await onAddDistribution({
        studentId: selectedStudent,
        costumeId: selectedCostume,
        itemsChecklist: checklist,
        signatureData,
        signedBy: selectedStudent
          ? students.find((s) => s.id === selectedStudent)?.name
          : undefined,
        signedAt: signatureData ? new Date().toISOString() : undefined,
        missingItems: missing,
        notes: notes || undefined,
        distributedBy: "Staff",
      });

      // Auto-create receipt document in student profile when signed
      if (signatureData) {
        const student = students.find((s) => s.id === selectedStudent);
        const costume = costumes.find((c) => c.id === selectedCostume);
        addDocument({
          studentId: selectedStudent,
          documentType: "custom",
          title: `Costume Distribution Receipt — ${costume?.name ?? "Costume"}`,
          fileUrl: signatureData,
          fileName: `distribution-${selectedStudent}-${Date.now()}.png`,
          mimeType: "image/png",
          verificationStatus: "verified",
          verifiedBy: "System (Distribution Mode)",
          verifiedAt: new Date().toISOString(),
          visibility: "admin_only",
          notes: `Costume: ${costume?.name ?? "N/A"} for ${student?.name ?? "N/A"}. Missing items: ${missing.length > 0 ? missing.join(", ") : "None"}`,
        });
      }

      setCompleted((prev) => new Set([...prev, selectedStudent]));
      toast.success("Distribution recorded");
      resetForm();
    } catch {
      toast.error("Failed to save distribution");
    } finally {
      setSaving(false);
    }
  }, [selectedStudent, selectedCostume, checklist, notes, onAddDistribution, students, costumes, addDocument]);

  const resetForm = useCallback(() => {
    setSelectedStudent(null);
    setSelectedCostume(null);
    setChecklist(DEFAULT_CHECKLIST.map((i) => ({ ...i })));
    setMissingItems([]);
    setNotes("");
    setShowSignature(false);
  }, []);

  const studentRecord = selectedStudent ? students.find((s) => s.id === selectedStudent) : null;
  const costumeRecord = selectedCostume ? costumes.find((c) => c.id === selectedCostume) : null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl hover:bg-secondary transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="font-display text-lg font-semibold">Distribution Mode</h2>
            <p className="text-xs text-muted-foreground">
              {completed.size} completed · {students.length - completed.size} remaining
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {studioName}
          </span>
          <div className={cn(
            "h-2.5 w-2.5 rounded-full",
            completed.size === students.filter((s) => s.classIds.length > 0).length
              ? "bg-teal"
              : "bg-gold",
          )} />
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Student queue */}
        <div className="lg:w-80 shrink-0 border-r border-border bg-card/50 overflow-y-auto">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students..."
                className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:border-rose"
              />
            </div>
          </div>
          <div className="px-2 pb-2 space-y-1">
            {filtered.length === 0 && !search ? (
              <div className="p-6 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-teal/50" />
                <p className="mt-2 text-sm font-medium text-teal">All done!</p>
                <p className="text-xs text-muted-foreground">Every student has received their distribution.</p>
              </div>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">No students match</p>
            ) : (
              filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStudent(s.id); setSelectedCostume(null); resetForm(); }}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl p-3 text-left transition",
                    selectedStudent === s.id
                      ? "bg-rose/10 border border-rose/30"
                      : "hover:bg-secondary border border-transparent",
                  )}
                >
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary shrink-0">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.classIds.length} class{s.classIds.length !== 1 ? "es" : ""}
                    </p>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Distribution form */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {!selectedStudent ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ClipboardCheck className="h-16 w-16 text-muted-foreground/30" />
              <h3 className="mt-6 text-xl font-semibold">Select a Student</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                Tap a student from the queue on the left to begin their distribution checklist.
              </p>
            </div>
          ) : (
            <div className="max-w-lg mx-auto space-y-6">
              {/* Student info */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-rose/5 border border-rose/20">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-rose/10">
                  <User className="h-7 w-7 text-rose" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold">{studentRecord?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {studentRecord?.classIds.length} class{studentRecord?.classIds.length !== 1 ? "es" : ""} enrolled
                  </p>
                </div>
              </div>

              {/* Costume selector */}
              <div>
                <label className="block text-sm font-semibold mb-2">Costume</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {costumes.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCostume(c.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-3 text-left transition",
                        selectedCostume === c.id
                          ? "border-rose bg-rose/5"
                          : "border-border hover:bg-secondary",
                      )}
                    >
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary shrink-0">
                        <Shirt className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.colour ?? ""}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Checklist */}
              {selectedCostume && (
                <>
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Items Checklist</h4>
                    <div className="space-y-2">
                      {checklist.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => toggleChecklist(idx)}
                          className={cn(
                            "w-full flex items-center gap-3 rounded-xl border p-4 text-left transition active:scale-[0.98]",
                            item.checked
                              ? "border-teal/30 bg-teal/5"
                              : "border-border hover:bg-secondary",
                          )}
                        >
                          <div className={cn(
                            "grid h-9 w-9 place-items-center rounded-lg shrink-0 transition",
                            item.checked ? "bg-teal text-white" : "bg-secondary text-muted-foreground",
                          )}>
                            {item.checked ? <Check className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                          </div>
                          <span className={cn(
                            "text-base font-medium flex-1",
                            item.checked && "text-teal",
                          )}>
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    {allChecked && (
                      <div className="mt-3 flex items-center gap-2 rounded-xl bg-teal/10 px-4 py-3 text-sm text-teal font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        All items checked — ready for signature!
                      </div>
                    )}
                  </div>

                  {/* Missing items */}
                  {!allChecked && (
                    <div className="flex items-center gap-2 rounded-xl bg-gold/10 px-4 py-3">
                      <Siren className="h-4 w-4 text-gold shrink-0" />
                      <p className="text-sm text-gold font-medium">
                        {checklist.filter((i) => !i.checked).length} item{checklist.filter((i) => !i.checked).length !== 1 ? "s" : ""} not yet checked
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Notes (optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any notes about this distribution..."
                      className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-rose resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <button
                      onClick={() => setShowSignature(true)}
                      disabled={!allChecked || saving}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-rose px-5 py-3 text-sm font-semibold text-white shadow-lift transition hover:opacity-90 disabled:opacity-50"
                    >
                      <Pen className="h-4 w-4" />
                      Capture Signature
                    </button>
                    <button
                      onClick={() => resetForm()}
                      className="grid h-12 w-12 place-items-center rounded-full border border-border text-muted-foreground hover:bg-secondary transition"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Signature modal */}
      {showSignature && (
        <SignatureCanvas
          onSave={(dataUrl) => {
            setShowSignature(false);
            handleSaveDistribution(dataUrl);
          }}
          onClose={() => setShowSignature(false)}
          title={`${studentRecord?.name ?? "Student"} — Distribution Signature`}
        />
      )}
    </div>
  );
}
