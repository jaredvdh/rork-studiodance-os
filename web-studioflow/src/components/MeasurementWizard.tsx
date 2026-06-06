import { useCallback, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  Ruler,
  Save,
  Shirt,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react";

import type { Student, StudentMeasurement } from "@/data/types";
import { formatHeight, formatWeight, formatCm, cmToIn, kgToLb, inToCm, lbToKg, ftInToCm } from "@/lib/units";
import { useUnitPreference } from "@/hooks/useUnitPreference";
import { cn } from "@/lib/utils";

/* ── Types ───────────────────────────────────────────────────────── */

type WizardStep = "student" | "guide" | "measure" | "review" | "done";
type MeasurementDraft = Record<string, string>;

const STEP_LABELS = ["Student", "Guide", "Measure", "Review", "Done"] as const;

/** Which measurement mode the wizard operates in. */
export type WizardMode = "simple" | "full";

interface MeasurementWizardProps {
  students: Student[];
  existingMeasurements: StudentMeasurement[];
  onSubmit: (data: MeasurementSubmission) => Promise<void>;
  onSaveDraft: (data: MeasurementSubmission) => Promise<void>;
  onClose: () => void;
  /** If provided, pre-select this student and optionally load their draft */
  preselectedStudentId?: string;
  draftMeasurement?: StudentMeasurement;
  /** Controls which fields are shown. "simple" = clothing/leotard sizes only (parent-friendly). "full" = all body measurements (admin). */
  mode?: WizardMode;
}

export interface MeasurementSubmission {
  studentId: string;
  clothingSize?: string;
  leotardSize?: string;
  heightCm?: number;
  weightKg?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  girthCm?: number;
  inseamCm?: number;
  shoeSize?: string;
  notes?: string;
}

/* ── Component ───────────────────────────────────────────────────── */

export default function MeasurementWizard({
  students,
  existingMeasurements,
  onSubmit,
  onSaveDraft,
  onClose,
  preselectedStudentId,
  draftMeasurement,
  mode = "simple",
}: MeasurementWizardProps) {
  const { preferredUnits: units } = useUnitPreference();
  const isMetric = units === "metric";
  const isSimple = mode === "simple";

  const [step, setStep] = useState<WizardStep>(preselectedStudentId ? "guide" : "student");
  const [selectedStudentId, setSelectedStudentId] = useState<string>(preselectedStudentId ?? "");
  const [draft, setDraft] = useState<MeasurementDraft>(() => {
    if (draftMeasurement) {
      return measurementToDraft(draftMeasurement, units);
    }
    return {};
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const stepIdx = STEP_LABELS.indexOf(
    step === "done" ? "Done" : step === "student" ? "Student" : step === "guide" ? "Guide" : step === "measure" ? "Measure" : "Review",
  );

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId),
    [students, selectedStudentId],
  );

  const prevMeasurement = useMemo(
    () => existingMeasurements.find((m) => m.studentId === selectedStudentId),
    [existingMeasurements, selectedStudentId],
  );

  const buildSubmission = useCallback((): MeasurementSubmission => {
    const data: MeasurementSubmission = { studentId: selectedStudentId };
    
    // Simple sizing fields (always available)
    if (draft.clothingSize) data.clothingSize = draft.clothingSize;
    if (draft.leotardSize) data.leotardSize = draft.leotardSize;
    if (draft.shoeSize) data.shoeSize = draft.shoeSize;
    if (draft.notes) data.notes = draft.notes;
    
    // Height (optional in both modes)
    if (draft.height) {
      data.heightCm = isMetric
        ? Number(draft.height)
        : ftInToCm(...parseHeightImperial(draft.height));
    }
    
    // Full measurements (only in full mode)
    if (!isSimple) {
      if (draft.weight) {
        data.weightKg = isMetric
          ? Number(draft.weight)
          : lbToKg(Number(draft.weight));
      }
      if (draft.chest) data.chestCm = isMetric ? Number(draft.chest) : inToCm(Number(draft.chest));
      if (draft.waist) data.waistCm = isMetric ? Number(draft.waist) : inToCm(Number(draft.waist));
      if (draft.hips) data.hipsCm = isMetric ? Number(draft.hips) : inToCm(Number(draft.hips));
      if (draft.girth) data.girthCm = isMetric ? Number(draft.girth) : inToCm(Number(draft.girth));
      if (draft.inseam) data.inseamCm = isMetric ? Number(draft.inseam) : inToCm(Number(draft.inseam));
    }
    
    return data;
  }, [draft, isMetric, isSimple, selectedStudentId]);

  const validateMeasurements = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    
    // In simple mode, only height gets numeric validation (other fields are text)
    if (draft.height) {
      const range = isMetric ? [40, 250] as [number, number] : [16, 98] as [number, number];
      const n = Number(draft.height);
      if (isNaN(n) || n < range[0]) errors.height = "Height too low";
      else if (n > range[1]) errors.height = "Height too high";
    }
    
    // Full mode: validate all body measurements
    if (!isSimple) {
      const range = isMetric
        ? { height: [40, 250], weight: [2, 250], body: [10, 200] }
        : { height: [16, 98], weight: [4, 550], body: [4, 80] };
      
      const check = (key: string, val: string, [min, max]: [number, number], label: string) => {
        if (!val) return;
        const n = Number(val);
        if (isNaN(n) || n < min) errors[key] = `${label} too low`;
        else if (n > max) errors[key] = `${label} too high`;
      };

      check("weight", draft.weight, range.weight, isMetric ? "Weight" : "Weight");
      check("chest", draft.chest, range.body, "Chest");
      check("waist", draft.waist, range.body, "Waist");
      check("hips", draft.hips, range.body, "Hips");
      check("girth", draft.girth, range.body, "Girth");
      check("inseam", draft.inseam, range.body, "Inseam");
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [draft, isMetric, isSimple]);

  const handleSubmit = async () => {
    if (!validateMeasurements()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(buildSubmission());
      setStep("done");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      await onSaveDraft(buildSubmission());
      setStep("done");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateDraft = (key: string, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (validationErrors[key]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-amber-200/70 bg-white shadow-2xl animate-float-up max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-amber-200/30">
          <div>
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <Ruler className="h-5 w-5 text-amber-500" />
              Measurement Wizard
            </h3>
            {selectedStudent && step !== "student" && step !== "done" && (
              <p className="text-xs text-muted-foreground mt-0.5">For {selectedStudent.name}</p>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-amber-50 transition" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-1 px-5 py-3 bg-amber-50/50 border-b border-amber-200/20">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-1 flex-1">
              <div
                className={cn(
                  "flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold transition-colors",
                  i < stepIdx
                    ? "bg-teal text-white"
                    : i === stepIdx
                      ? "bg-amber-500 text-white"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {i < stepIdx ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:inline",
                  i === stepIdx ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
              {i < 4 && <div className="flex-1 h-px bg-amber-200 mx-2" />}
            </div>
          ))}
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ── Step 1: Select Student ──────────────────────────── */}
          {step === "student" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-4">
                <UserCheck className="h-5 w-5 text-amber-600 mb-2" />
                <p className="text-sm font-medium">Choose who to measure</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Select the student whose measurements you'd like to submit. Accurate measurements help the studio provide the best costume fit.
                </p>
              </div>

              <div className="grid gap-2">
                {students.map((student) => {
                  const hasExisting = existingMeasurements.some(
                    (m) => m.studentId === student.id && m.status === "approved",
                  );
                  return (
                    <button
                      key={student.id}
                      onClick={() => { setSelectedStudentId(student.id); setStep("guide"); }}
                      className={cn(
                        "flex items-center gap-4 rounded-xl border border-amber-200/60 p-4 text-left transition-all",
                        "hover:border-amber-400 hover:bg-amber-50/50 hover:shadow-md",
                      )}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-display font-bold text-sm">
                        {student.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {hasExisting ? "Has measurements on file" : "No measurements on file"}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>

              {students.length === 0 && (
                <div className="rounded-xl border border-amber-200/60 bg-cream/80 p-8 text-center">
                  <Ruler className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-4 font-semibold">No students to measure</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your family's students will appear here once enrolled in classes.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Measurement Guide ───────────────────────── */}
          {step === "guide" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-4">
                <Sparkles className="h-5 w-5 text-amber-600 mb-2" />
                <p className="text-sm font-medium">
                  {isSimple ? "Quick sizing for your child" : "How to measure your child"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isSimple
                    ? "Answer a few simple questions about your child's clothing sizes. The studio will use this to recommend the best costume fit. Full body measurements can be added by studio staff if needed."
                    : "Follow these guidelines for accurate measurements. Use a soft fabric measuring tape for best results. All values will be converted to the studio's preferred units automatically."}
                </p>
              </div>

              {/* Measurement guides — only in full mode */}
              {!isSimple && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {MEASUREMENT_GUIDES.map((guide) => (
                      <div key={guide.label} className="rounded-xl border border-amber-200/50 bg-white p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                            <guide.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{guide.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                              {guide.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick tips */}
                  <div className="rounded-xl border border-amber-200/50 bg-amber-50/30 p-4">
                    <p className="text-sm font-semibold mb-2">Tips for accuracy</p>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-teal mt-0.5 shrink-0" />
                        Have your child stand straight with feet together
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-teal mt-0.5 shrink-0" />
                        Measure over light clothing (leotard or thin t-shirt)
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-teal mt-0.5 shrink-0" />
                        Keep the tape snug but not tight — don't compress the skin
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-teal mt-0.5 shrink-0" />
                        For girth: measure from shoulder, down through crotch, back up to same shoulder
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-teal mt-0.5 shrink-0" />
                        Take each measurement twice and use the average
                      </li>
                    </ul>
                  </div>
                </>
              )}

              {/* In simple mode: a shorter tips section */}
              {isSimple && (
                <div className="rounded-xl border border-amber-200/50 bg-amber-50/30 p-4">
                  <p className="text-sm font-semibold mb-2">What you'll need</p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-teal mt-0.5 shrink-0" />
                      Your child's current clothing size (check tags on well-fitting clothes)
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-teal mt-0.5 shrink-0" />
                      Leotard or costume size if known (optional)
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-teal mt-0.5 shrink-0" />
                      Shoe size
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-teal mt-0.5 shrink-0" />
                      Approximate height if you know it (optional)
                    </li>
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setStep("student")}
                  className="flex-1 rounded-lg border border-amber-200 px-4 py-2.5 text-sm font-medium hover:bg-amber-50"
                >
                  <ChevronLeft className="inline-block mr-1 h-4 w-4" />
                  Change Student
                </button>
                <button
                  onClick={() => setStep("measure")}
                  className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
                >
                  {isSimple ? "Enter Sizes" : "Start Measuring"}
                  <ChevronRight className="inline-block mr-1 h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Enter Measurements / Sizing ─────────────── */}
          {step === "measure" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-4">
                <Ruler className="h-5 w-5 text-amber-600 mb-2" />
                <p className="text-sm font-medium">
                  {isSimple ? `Sizing info for ${selectedStudent?.name}` : `Enter measurements for ${selectedStudent?.name}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isSimple
                    ? <>Choose the closest match for your child's current sizes. Leave blank anything you're not sure about.</>
                    : <>All values are in <strong>{isMetric ? "centimetres (cm) & kilograms (kg)" : "inches (in) & pounds (lb)"}</strong>. You can change your unit preference in settings.</>}
                </p>
              </div>

              {/* Simple mode: sizing dropdowns */}
              {isSimple && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <SimpleSizingField
                    label="Clothing Size"
                    value={draft.clothingSize ?? ""}
                    onChange={(v) => updateDraft("clothingSize", v)}
                    options={CLOTHING_SIZE_OPTIONS}
                    icon={Shirt}
                  />
                  <SimpleSizingField
                    label="Leotard / Costume Size"
                    value={draft.leotardSize ?? ""}
                    onChange={(v) => updateDraft("leotardSize", v)}
                    options={CLOTHING_SIZE_OPTIONS}
                    icon={Shirt}
                    optional
                  />
                  <SimpleSizingField
                    label="Shoe Size"
                    value={draft.shoeSize ?? ""}
                    onChange={(v) => updateDraft("shoeSize", v)}
                    options={SHOE_SIZE_OPTIONS}
                    icon={Ruler}
                  />
                  {/* Height (optional numeric) */}
                  <div>
                    <label className="text-sm font-medium">Height <span className="text-xs text-muted-foreground">(optional)</span></label>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={draft.height ?? ""}
                        onChange={(e) => updateDraft("height", e.target.value)}
                        placeholder={isMetric ? "e.g. 135" : "e.g. 54"}
                        className={cn(
                          "w-full rounded-lg border bg-white px-3 py-2.5 pr-14 text-sm",
                          "focus:outline-none focus:ring-1",
                          validationErrors.height
                            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-400"
                            : "border-amber-200 focus:border-amber-400 focus:ring-amber-400",
                        )}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {isMetric ? "cm" : "in"}
                      </span>
                    </div>
                    {validationErrors.height && <p className="text-xs text-rose mt-1">{validationErrors.height}</p>}
                  </div>
                </div>
              )}

              {/* Full mode: all body measurement fields */}
              {!isSimple && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {MEASUREMENT_FIELDS.map((field) => {
                    const val = draft[field.key] ?? "";
                    const err = validationErrors[field.key];
                    const unitLabel = field.unitLabel(isMetric);
                    return (
                      <div key={field.key}>
                        <label className="text-sm font-medium">
                          {field.label}
                          {field.required && <span className="text-destructive ml-0.5">*</span>}
                        </label>
                        <div className="relative mt-1">
                          <input
                            type={field.type}
                            inputMode="decimal"
                            value={val}
                            onChange={(e) => updateDraft(field.key, e.target.value)}
                            placeholder={field.placeholder(isMetric)}
                            className={cn(
                              "w-full rounded-lg border bg-white px-3 py-2.5 pr-14 text-sm",
                              "focus:outline-none focus:ring-1",
                              err
                                ? "border-rose-300 focus:border-rose-400 focus:ring-rose-400"
                                : "border-amber-200 focus:border-amber-400 focus:ring-amber-400",
                            )}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            {unitLabel}
                          </span>
                        </div>
                        {err && <p className="text-xs text-rose mt-1">{err}</p>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Height helper for imperial (full mode only) */}
              {!isMetric && !isSimple && (
                <div className="rounded-lg border border-amber-200/30 bg-amber-50/20 p-3 text-xs text-muted-foreground">
                  <strong>Height in imperial:</strong> Enter total inches (e.g., 54 for 4 ft 6 in).
                  The wizard will convert this to feet/inches on the review screen.
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-sm font-medium">Notes for the studio (optional)</label>
                <textarea
                  value={draft.notes ?? ""}
                  onChange={(e) => updateDraft("notes", e.target.value)}
                  placeholder={isSimple ? "Any special sizing concerns or preferences..." : "E.g., measured wearing dance shoes, child was fidgety..."}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setStep("guide")}
                  className="flex-1 rounded-lg border border-amber-200 px-4 py-2.5 text-sm font-medium hover:bg-amber-50"
                >
                  <ChevronLeft className="inline-block mr-1 h-4 w-4" />
                  Back
                </button>
                <button
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="inline-block mr-1 h-4 w-4" />}
                  Save Draft
                </button>
                <button
                  onClick={() => {
                    if (validateMeasurements()) setStep("review");
                  }}
                  className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
                >
                  Review
                  <ChevronRight className="inline-block ml-1 h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Review ───────────────────────────────────── */}
          {step === "review" && (
            <div className="space-y-4">
              <h4 className="font-display text-lg font-semibold">
                {isSimple ? "Review sizing info" : "Review measurements"}
              </h4>
              <p className="text-sm text-muted-foreground">
                Please double-check these values before submitting to the studio.
              </p>

              <div className="rounded-lg border border-amber-200 bg-white divide-y divide-amber-100">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-50/50">
                  <UserCheck className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium">{selectedStudent?.name}</span>
                </div>

                {/* Simple sizing review */}
                {isSimple && <>
                  {draft.clothingSize && <ReviewRow icon={Shirt} label="Clothing Size" value={draft.clothingSize} />}
                  {draft.leotardSize && <ReviewRow icon={Shirt} label="Leotard / Costume Size" value={draft.leotardSize} />}
                  {draft.shoeSize && <ReviewRow icon={Ruler} label="Shoe Size" value={draft.shoeSize} />}
                  {draft.height && (
                    <ReviewRow
                      icon={Ruler}
                      label="Height"
                      value={(() => {
                        const prevH = prevMeasurement?.heightCm;
                        const currH = isMetric ? Number(draft.height) : ftInToCm(...parseHeightImperial(draft.height));
                        return formatHeight(currH, units);
                      })()}
                    />
                  )}
                </>}

                {/* Full measurement review */}
                {!isSimple && MEASUREMENT_FIELDS.map((field) => {
                  const rawVal = draft[field.key];
                  if (!rawVal) return null;
                  const numVal = Number(rawVal);
                  const formatted = field.formatDisplay(numVal, units, draft);
                  const prevFormatted = prevMeasurement
                    ? field.formatExisting(prevMeasurement, units, draft)
                    : null;

                  return (
                    <div key={field.key} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        <field.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{field.label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        {prevFormatted && prevFormatted !== formatted && (
                          <span className="text-xs text-muted-foreground/60 line-through">{prevFormatted}</span>
                        )}
                        <span className="text-sm font-semibold">{formatted}</span>
                        {prevMeasurement && field.getPrevValue(prevMeasurement) != null && numVal !== 0 && (
                          <GrowthArrow
                            current={numVal}
                            previous={field.getPrevValue(prevMeasurement)!}
                            isMetric={isMetric}
                            isHeight={field.key === "height"}
                            isWeight={field.key === "weight"}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                {draft.notes && (
                  <div className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">Notes: </span>
                    <span className="text-sm">{draft.notes}</span>
                  </div>
                )}

                {/* Empty state */}
                {Object.values(draft).filter((v) => v).length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    {isSimple ? "No sizing info entered. Go back to add some." : "No measurements entered. Go back to add some."}
                  </div>
                )}
              </div>

              {/* Previous measurements comparison */}
              {prevMeasurement && !isSimple && (
                <div className="rounded-xl border border-amber-200/50 bg-amber-50/20 p-4">
                  <p className="text-sm font-semibold mb-3">Previous Measurements</p>
                  <div className="grid grid-cols-4 gap-2">
                    {MEASUREMENT_FIELDS.map((field) => {
                      const prevVal = field.getPrevValue(prevMeasurement);
                      if (prevVal == null) return null;
                      return (
                        <div key={field.key} className="rounded-lg bg-white/60 p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">{field.label}</p>
                          <p className="text-xs font-semibold">
                            {field.formatExisting(prevMeasurement, units, draft)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {prevMeasurement.measuredAt
                              ? new Date(prevMeasurement.measuredAt).toLocaleDateString()
                              : "Unknown"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setStep("measure")}
                  className="flex-1 rounded-lg border border-amber-200 px-4 py-2.5 text-sm font-medium hover:bg-amber-50"
                >
                  <ChevronLeft className="inline-block mr-1 h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal/90 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Submit to Studio
                      <ArrowRight className="inline-block ml-1 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 5: Done ─────────────────────────────────────── */}
          {step === "done" && (
            <div className="space-y-5 text-center py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal/10">
                <Check className="h-8 w-8 text-teal" />
              </div>
              <div>
                <h4 className="font-display text-xl font-semibold">
                  {isSimple ? "Sizing info submitted!" : "Measurements submitted!"}
                </h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isSimple
                    ? `Your sizing info for ${selectedStudent?.name} has been sent to the studio. Staff will use this for costume sizing.`
                    : `Your measurements for ${selectedStudent?.name} have been sent to the studio for review. You'll be notified when they're approved.`}
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-4 text-left">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">What happens next?</p>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-teal mt-0.5 shrink-0" />
                    {isSimple
                      ? "Studio staff will review your sizing info and recommend costume sizes"
                      : "Studio staff will review and approve your measurements"}
                  </li>
                  {!isSimple && (
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-teal mt-0.5 shrink-0" />
                      AI auto-sizing will recommend the best costume size
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-teal mt-0.5 shrink-0" />
                    You'll be able to approve or request a different size
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-teal mt-0.5 shrink-0" />
                    Submit updated info any time your child grows
                  </li>
                </ul>
              </div>
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600"
              >
                Back to Costume Portal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Helper: Growth Arrow ────────────────────────────────────────── */

function GrowthArrow({
  current,
  previous,
  isMetric,
  isHeight,
  isWeight,
}: {
  current: number;
  previous: number;
  isMetric: boolean;
  isHeight?: boolean;
  isWeight?: boolean;
}) {
  if (previous === 0 || current === 0) return null;
  const pctChange = ((current - previous) / previous) * 100;
  if (Math.abs(pctChange) < 1) return null;

  const up = pctChange > 0;
  return (
    <span
      className={cn(
        "text-[10px] font-medium ml-1",
        up ? "text-teal" : "text-rose",
      )}
      title={`${up ? "+" : ""}${Math.round(pctChange)}% since last`}
    >
      {up ? "↑" : "↓"}{Math.abs(Math.round(pctChange))}%
    </span>
  );
}

/* ── Helper: Parse imperial height ───────────────────────────────── */

function parseHeightImperial(raw: string): [number, number] {
  const num = Number(raw);
  if (!isNaN(num) && num > 0) {
    const ft = Math.floor(num / 12);
    const inches = Math.round(num % 12);
    return [ft, inches === 12 ? 0 : inches]; // 12 inches → next foot
  }
  // Try ft'in" format
  const match = raw.match(/^(\d+)\s*(?:ft|')\s*(\d+)\s*(?:in|")?$/);
  if (match) return [Number(match[1]), Number(match[2])];
  return [0, 0];
}

/* ── Helper: Draft ↔ Measurement ─────────────────────────────────── */

function measurementToDraft(m: StudentMeasurement, units: "metric" | "imperial"): MeasurementDraft {
  const d: MeasurementDraft = {};
  // Simple sizing fields (always populate)
  if (m.clothingSize) d.clothingSize = m.clothingSize;
  if (m.leotardSize) d.leotardSize = m.leotardSize;
  if (m.shoeSize) d.shoeSize = m.shoeSize;
  if (m.notes) d.notes = m.notes;
  // Body measurements
  if (units === "metric") {
    if (m.heightCm != null) d.height = String(Math.round(m.heightCm));
    if (m.weightKg != null) d.weight = String(Math.round(m.weightKg));
    if (m.chestCm != null) d.chest = String(Math.round(m.chestCm));
    if (m.waistCm != null) d.waist = String(Math.round(m.waistCm));
    if (m.hipsCm != null) d.hips = String(Math.round(m.hipsCm));
    if (m.girthCm != null) d.girth = String(Math.round(m.girthCm));
    if (m.inseamCm != null) d.inseam = String(Math.round(m.inseamCm));
  } else {
    if (m.heightCm != null) d.height = String(Math.round(m.heightCm / 2.54));
    if (m.weightKg != null) d.weight = String(kgToLb(m.weightKg));
    if (m.chestCm != null) d.chest = String(cmToIn(m.chestCm));
    if (m.waistCm != null) d.waist = String(cmToIn(m.waistCm));
    if (m.hipsCm != null) d.hips = String(cmToIn(m.hipsCm));
    if (m.girthCm != null) d.girth = String(cmToIn(m.girthCm));
    if (m.inseamCm != null) d.inseam = String(cmToIn(m.inseamCm));
  }
  return d;
}

/* ── Measurement field definitions ───────────────────────────────── */

interface MeasurementFieldDef {
  key: string;
  label: string;
  type: string;
  required: boolean;
  icon: typeof Ruler;
  placeholder: (isMetric: boolean) => string;
  unitLabel: (isMetric: boolean) => string;
  formatDisplay: (value: number, units: "metric" | "imperial", draft: MeasurementDraft) => string;
  formatExisting: (m: StudentMeasurement, units: "metric" | "imperial", draft: MeasurementDraft) => string;
  getPrevValue: (m: StudentMeasurement) => number | undefined;
}

const MEASUREMENT_FIELDS: MeasurementFieldDef[] = [
  {
    key: "height", label: "Height", type: "number", required: true,
    icon: Ruler,
    placeholder: (m) => m ? "e.g. 135" : "e.g. 54",
    unitLabel: (m) => m ? "cm" : "in",
    formatDisplay: (v, u) => formatHeight(v, u),
    formatExisting: (m, u) => formatHeight(m.heightCm, u),
    getPrevValue: (m) => m.heightCm,
  },
  {
    key: "weight", label: "Weight", type: "number", required: false,
    icon: Heart,
    placeholder: (m) => m ? "e.g. 32" : "e.g. 70",
    unitLabel: (m) => m ? "kg" : "lb",
    formatDisplay: (v, u) => formatWeight(v, u),
    formatExisting: (m, u) => formatWeight(m.weightKg, u),
    getPrevValue: (m) => m.weightKg,
  },
  {
    key: "chest", label: "Chest", type: "number", required: false,
    icon: Shirt,
    placeholder: (m) => m ? "e.g. 64" : "e.g. 25",
    unitLabel: (m) => m ? "cm" : "in",
    formatDisplay: (v, u) => formatCm(v, u),
    formatExisting: (m, u) => formatCm(m.chestCm, u),
    getPrevValue: (m) => m.chestCm,
  },
  {
    key: "waist", label: "Waist", type: "number", required: false,
    icon: Ruler,
    placeholder: (m) => m ? "e.g. 56" : "e.g. 22",
    unitLabel: (m) => m ? "cm" : "in",
    formatDisplay: (v, u) => formatCm(v, u),
    formatExisting: (m, u) => formatCm(m.waistCm, u),
    getPrevValue: (m) => m.waistCm,
  },
  {
    key: "hips", label: "Hips", type: "number", required: false,
    icon: Ruler,
    placeholder: (m) => m ? "e.g. 68" : "e.g. 27",
    unitLabel: (m) => m ? "cm" : "in",
    formatDisplay: (v, u) => formatCm(v, u),
    formatExisting: (m, u) => formatCm(m.hipsCm, u),
    getPrevValue: (m) => m.hipsCm,
  },
  {
    key: "girth", label: "Girth", type: "number", required: false,
    icon: Ruler,
    placeholder: (m) => m ? "e.g. 118" : "e.g. 46",
    unitLabel: (m) => m ? "cm" : "in",
    formatDisplay: (v, u) => formatCm(v, u),
    formatExisting: (m, u) => formatCm(m.girthCm, u),
    getPrevValue: (m) => m.girthCm,
  },
  {
    key: "inseam", label: "Inseam", type: "number", required: false,
    icon: Ruler,
    placeholder: (m) => m ? "e.g. 58" : "e.g. 23",
    unitLabel: (m) => m ? "cm" : "in",
    formatDisplay: (v, u) => formatCm(v, u),
    formatExisting: (m, u) => formatCm(m.inseamCm, u),
    getPrevValue: (m) => m.inseamCm,
  },
  {
    key: "shoeSize", label: "Shoe Size", type: "text", required: false,
    icon: Ruler,
    placeholder: () => "e.g. 1",
    unitLabel: () => "",
    formatDisplay: (v) => String(v),
    formatExisting: (m) => m.shoeSize ?? "—",
    getPrevValue: () => undefined,
  },
];

/* ── Measurement guide content ───────────────────────────────────── */

const MEASUREMENT_GUIDES = [
  {
    label: "Chest / Bust",
    icon: Shirt,
    description:
      "Measure around the fullest part of the chest, keeping the tape horizontal. Have your child breathe normally — don't measure on an inhale.",
  },
  {
    label: "Waist",
    icon: Ruler,
    description:
      "Find the natural waistline (narrowest part of the torso, usually just above the belly button). Measure with the tape snug but not tight.",
  },
  {
    label: "Hips",
    icon: Ruler,
    description:
      "Measure around the fullest part of the hips and buttocks. Keep feet together and tape horizontal.",
  },
  {
    label: "Girth",
    icon: Ruler,
    description:
      "Start at the shoulder, run the tape down the front, through the crotch, and back up to the same shoulder. This is the most important measurement for dance costumes.",
  },
  {
    label: "Inseam",
    icon: Ruler,
    description:
      "Measure from the crotch seam to the ankle bone along the inside of the leg. Best taken with child standing straight.",
  },
  {
    label: "Height",
    icon: Ruler,
    description:
      "Have your child stand against a wall without shoes. Mark the highest point of their head and measure from the floor up.",
  },
];
