import { useCallback, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Eye,
  MessageSquare,
  Ruler,
  Shirt,
  Truck,
} from "lucide-react";

import { useStudents, useCostumes } from "@/data/store";
import { COSTUME_FEE_TYPE_LABELS } from "@/data/types";
import type { CostumeFee, SizeRecommendation } from "@/data/types";
import { formatCurrency } from "@/lib/format";
import { formatHeight, formatWeight, formatCm } from "@/lib/units";
import { useUnitPreference } from "@/hooks/useUnitPreference";
import { cn } from "@/lib/utils";
import MeasurementWizard from "@/components/MeasurementWizard";
import type { MeasurementSubmission } from "@/components/MeasurementWizard";

type Tab = "costumes" | "measurements" | "fees";

export default function ParentCostumes() {
  const [tab, setTab] = useState<Tab>("costumes");
  const { students } = useStudents();
  const ctx = useCostumes();
  const { preferredUnits: units } = useUnitPreference();

  const [showWizard, setShowWizard] = useState(false);
  const [wizardStudentId, setWizardStudentId] = useState<string>();

  // In a real app, we'd filter by the logged-in parent's children
  // For demo, show all students that have costume assignments
  const parentStudents = useMemo(() => {
    const assignedIds = new Set(ctx.assignments.map((a) => a.studentId));
    return students.filter((s) => assignedIds.has(s.id));
  }, [students, ctx.assignments]);

  const handleOpenWizard = useCallback((studentId?: string) => {
    setWizardStudentId(studentId);
    setShowWizard(true);
  }, []);

  const handleSubmitMeasurement = useCallback(async (data: MeasurementSubmission) => {
    const draft = ctx.measurements.find(
      (m) => m.studentId === data.studentId && (m.status === "draft" || m.status === "pending"),
    );
    await ctx.submitMeasurement({
      ...data,
      id: draft?.id,
      status: "pending",
      submittedBy: "parent",
      measuredAt: new Date().toISOString(),
    });
  }, [ctx]);

  const handleSaveDraftMeasurement = useCallback(async (data: MeasurementSubmission) => {
    const draft = ctx.measurements.find(
      (m) => m.studentId === data.studentId && m.status === "draft",
    );
    await ctx.submitMeasurement({
      ...data,
      id: draft?.id,
      status: "draft",
      submittedBy: "parent",
    });
  }, [ctx]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground">Costume Portal</p>
        <h2 className="font-display text-2xl font-semibold tracking-tight">My Costumes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          View assigned costumes, measurements, and payment status for your family.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-amber-200/60 bg-cream/80 p-1.5">
        {([
          { key: "costumes" as const, label: "Costumes", icon: Shirt },
          { key: "measurements" as const, label: "Measurements", icon: Ruler },
          { key: "fees" as const, label: "Costume Fees", icon: DollarSign },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
              tab === key
                ? "bg-amber-400 text-amber-900 shadow-sm"
                : "text-foreground/60 hover:bg-amber-50 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: My Costumes ────────────────────────────────────── */}
      {tab === "costumes" && (
        <div className="space-y-6">
          {parentStudents.length === 0 ? (
            <div className="rounded-2xl border border-amber-200/60 bg-cream/80 p-12 text-center">
              <Shirt className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-semibold">No costumes assigned yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Costumes will appear here once your studio assigns them to your family's routines.
              </p>
            </div>
          ) : (
            parentStudents.map((student) => {
              const studentCostumes = ctx.costumesForStudent(student.id);
              if (studentCostumes.length === 0) return null;
              return (
                <div key={student.id} className="rounded-2xl border border-amber-200/60 bg-cream/80 p-6 shadow-soft">
                  <h3 className="font-display text-lg font-semibold mb-4">{student.name}</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {studentCostumes.map((costume) => {
                      const assignment = ctx.assignments.find(
                        (a) => a.costumeId === costume.id && a.studentId === student.id,
                      );
                      const sizeRec = ctx.sizeRecForStudentCostume(student.id, costume.id);
                      const fee = ctx.costumeFees.find(
                        (f) => f.studentId === student.id && f.costumeId === costume.id,
                      );
                      return (
                        <div
                          key={costume.id}
                          className="rounded-xl border border-amber-200/50 bg-white/60 p-4 transition hover:shadow-md"
                        >
                          {/* Costume image placeholder + name */}
                          <div className="grid h-24 place-items-center rounded-lg bg-amber-100/50 mb-3">
                            <Shirt className="h-8 w-8 text-amber-400" />
                          </div>
                          <h4 className="font-display text-sm font-semibold">{costume.name}</h4>
                          {costume.colour && (
                            <p className="text-xs text-muted-foreground">{costume.colour}</p>
                          )}
                          {assignment?.routineName && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Routine: {assignment.routineName}
                            </p>
                          )}

                          {/* Size recommendation */}
                          {sizeRec && (
                            <div className="mt-3 rounded-lg bg-amber-50 p-3">
                              <p className="text-xs font-semibold">Recommended Size</p>
                              <p className="font-display text-lg font-semibold text-amber-700">
                                {sizeRec.recommendedSize ?? "Pending"}
                              </p>
                              {sizeRec.confidencePct != null && (
                                <p className="text-xs text-muted-foreground">
                                  {sizeRec.confidencePct}% confidence
                                </p>
                              )}
                              {sizeRec.parentApproved ? (
                                <div className="mt-1 flex items-center gap-1 text-xs text-teal">
                                  <CheckCircle2 className="h-3 w-3" /> Approved
                                </div>
                              ) : (
                                <button className="mt-2 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-500">
                                  Approve Size
                                </button>
                              )}
                            </div>
                          )}

                          {/* Fee status */}
                          {fee && (
                            <div className="mt-2 flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Fee:</span>
                              <span className={cn(
                                "font-semibold",
                                fee.status === "paid" ? "text-teal" :
                                fee.status === "partial" ? "text-amber-700" :
                                "text-rose",
                              )}>
                                {fee.status === "paid"
                                  ? "Paid"
                                  : `${formatCurrency(fee.paidCents)} / ${formatCurrency(fee.totalCents)}`}
                              </span>
                            </div>
                          )}

                          {/* Delivery status */}
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Truck className="h-3 w-3" />
                            <span>In transit</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Tab: Measurements ──────────────────────────────────── */}
      {tab === "measurements" && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Submit measurements for your children. The studio uses these for costume sizing.
            </p>
            <button
              onClick={() => handleOpenWizard()}
              className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-500"
            >
              <Ruler className="inline-block mr-1.5 h-4 w-4" />
              New Measurement
            </button>
          </div>
          <div className="space-y-6">
          {parentStudents.length === 0 ? (
            <div className="rounded-2xl border border-amber-200/60 bg-cream/80 p-12 text-center">
              <Ruler className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-semibold">No measurements needed yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Submit measurements for your children here. Your studio will use these for costume sizing.
              </p>
            </div>
          ) : (
            parentStudents.map((student) => {
              const measurement = ctx.measurementForStudent(student.id);
              const draft = ctx.measurements.find(
                (m) => m.studentId === student.id && m.status === "draft",
              );
              const pending = ctx.measurements.find(
                (m) => m.studentId === student.id && m.status === "pending",
              );
              const recs = ctx.sizeRecommendations.filter((r) => r.studentId === student.id);
              return (
                <div key={student.id} className="rounded-2xl border border-amber-200/60 bg-cream/80 p-6 shadow-soft">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg font-semibold">{student.name}</h3>
                    <div className="flex items-center gap-2">
                      {draft && (
                        <button
                          onClick={() => handleOpenWizard(student.id)}
                          className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 transition"
                        >
                          Resume Draft
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenWizard(student.id)}
                        className="rounded-full bg-amber-400 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-500"
                      >
                        {measurement || pending ? "Update" : "Submit"}
                      </button>
                    </div>
                  </div>

                  {pending && (
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 mb-4">
                      <Clock className="h-3.5 w-3.5" />
                      Pending studio approval
                    </div>
                  )}

                  {draft && !measurement && !pending && (
                    <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground mb-4">
                      <Clock className="h-3.5 w-3.5" />
                      Draft saved
                    </div>
                  )}

                  {measurement ? (
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {measurement.heightCm != null && <MeasBlock label="Height" value={formatHeight(measurement.heightCm, units)} />}
                      {measurement.weightKg != null && <MeasBlock label="Weight" value={formatWeight(measurement.weightKg, units)} />}
                      {measurement.chestCm != null && <MeasBlock label="Chest" value={formatCm(measurement.chestCm, units)} />}
                      {measurement.waistCm != null && <MeasBlock label="Waist" value={formatCm(measurement.waistCm, units)} />}
                      {measurement.hipsCm != null && <MeasBlock label="Hips" value={formatCm(measurement.hipsCm, units)} />}
                      {measurement.girthCm != null && <MeasBlock label="Girth" value={formatCm(measurement.girthCm, units)} />}
                      {measurement.inseamCm != null && <MeasBlock label="Inseam" value={formatCm(measurement.inseamCm, units)} />}
                      {measurement.shoeSize && <MeasBlock label="Shoe Size" value={measurement.shoeSize} />}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-amber-50 p-4 mb-4 text-center">
                      <p className="text-sm text-muted-foreground">No approved measurements on file.</p>
                      <button
                        onClick={() => handleOpenWizard(student.id)}
                        className="mt-3 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-500"
                      >
                        Submit Measurements
                      </button>
                    </div>
                  )}

                  {/* Sizing recommendations */}
                  {recs.length > 0 && (
                    <div className="border-t border-amber-200 pt-4">
                      <p className="text-sm font-semibold mb-3">Size Recommendations</p>
                      {recs.map((rec) => {
                        const costume = ctx.costumes.find((c) => c.id === rec.costumeId);
                        return (
                          <div key={rec.id} className="flex items-center justify-between rounded-lg bg-white/60 p-3 mb-2">
                            <div>
                              <p className="text-sm font-medium">{costume?.name ?? "Costume"}</p>
                              <p className="text-xs text-muted-foreground">Recommended: {rec.recommendedSize ?? "—"}</p>
                            </div>
                            <div className="text-right">
                              {rec.parentApproved ? (
                                <span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-semibold text-teal">
                                  Approved
                                </span>
                              ) : (
                                <button className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-500">
                                  Review
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
          </div>
          {showWizard && (
            <MeasurementWizard
              students={parentStudents}
              existingMeasurements={ctx.measurements}
              preselectedStudentId={wizardStudentId}
              draftMeasurement={
                wizardStudentId
                  ? ctx.measurements.find(
                      (m) => m.studentId === wizardStudentId && m.status === "draft",
                    )
                  : undefined
              }
              onSubmit={handleSubmitMeasurement}
              onSaveDraft={handleSaveDraftMeasurement}
              onClose={() => setShowWizard(false)}
            />
          )}
        </>
      )}

      {/* ── Tab: Costume Fees ──────────────────────────────────── */}
      {tab === "fees" && (
        <div className="space-y-6">
          {parentStudents.length === 0 ? (
            <div className="rounded-2xl border border-amber-200/60 bg-cream/80 p-12 text-center">
              <CreditCard className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-semibold">No costume fees yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Costume fees will appear here once costumes are assigned to your family.
              </p>
            </div>
          ) : (
            parentStudents.map((student) => {
              const fees = ctx.feesForStudent(student.id);
              if (fees.length === 0) return null;
              return (
                <div key={student.id} className="rounded-2xl border border-amber-200/60 bg-cream/80 p-6 shadow-soft">
                  <h3 className="font-display text-lg font-semibold mb-4">{student.name}</h3>
                  <div className="space-y-3">
                    {fees.map((fee) => {
                      const costume = ctx.costumes.find((c) => c.id === fee.costumeId);
                      const remaining = fee.totalCents - fee.paidCents;
                      return (
                        <div key={fee.id} className="flex items-center justify-between rounded-xl bg-white/60 p-4">
                          <div>
                            <p className="text-sm font-semibold">{costume?.name ?? "Costume"}</p>
                            <p className="text-xs text-muted-foreground">
                              {COSTUME_FEE_TYPE_LABELS[fee.feeType]}
                              {fee.dueDate && ` · Due ${new Date(fee.dueDate).toLocaleDateString()}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "text-sm font-semibold",
                              fee.status === "paid" ? "text-teal" :
                              fee.status === "partial" ? "text-amber-700" :
                              "text-rose",
                            )}>
                              {fee.status === "paid"
                                ? `Paid ${formatCurrency(fee.totalCents)}`
                                : `${formatCurrency(fee.paidCents)} / ${formatCurrency(fee.totalCents)}`}
                            </p>
                            {fee.status !== "paid" && fee.status !== "waived" && remaining > 0 && (
                              <button className="mt-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-500">
                                Pay {formatCurrency(remaining)}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function MeasBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/60 px-3 py-2.5 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
