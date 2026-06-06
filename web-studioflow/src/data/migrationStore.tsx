import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  FieldMapping,
  ImportCategory,
  ImportError,
  ImportJob,
  ImportSnapshot,
  ParsedRow,
  WizardStep,
} from "./migrationTypes";
import type { Caregiver, Class, Student, Teacher, ParentAccount } from "./types";
import { SAFE_SECONDARY_DEFAULTS } from "./types";
import { parseFile } from "@/lib/importer";
import { autoMapFields, applyMappings, missingRequiredFields } from "@/lib/fieldMapper";
import { validateImport } from "@/lib/validation";
import { useStudio, useTeachers } from "./store";
import { classes as demoClasses, students as demoStudents, teachers as demoTeachers, parentAccounts as demoParents } from "./demo";

/* ── State shape ──────────────────────────────────────────────────── */

export interface MigrationState {
  /** Current wizard step (1–7) */
  step: WizardStep;
  /** Selected import category */
  category: ImportCategory | null;
  /** Uploaded file reference */
  file: File | null;
  /** Parsed headers from the spreadsheet */
  headers: string[];
  /** Parsed rows from the spreadsheet */
  rows: ParsedRow[];
  /** Field mappings (spreadsheet column → StudioFlow field) */
  mappings: FieldMapping[];
  /** Mapped rows (after field mapping applied) */
  mappedRows: Array<{ index: number; mapped: Record<string, string> }>;
  /** Validation errors and warnings */
  errors: ImportError[];
  /** Preview of what will be imported */
  importPreview: ImportPreview | null;
  /** Whether the import has been confirmed */
  confirmed: boolean;
}

export interface ImportPreview {
  studentCount: number;
  parentCount: number;
  classCount: number;
  instructorCount: number;
  enrolmentCount: number;
  /** Students that will be linked to existing classes */
  linkedEnrolments: Array<{ studentName: string; className: string }>;
  /** Teachers that will be linked to existing classes */
  linkedAssignments: Array<{ teacherName: string; className: string }>;
}

/* ── Persistence (localStorage) ──────────────────────────────────── */

const HISTORY_KEY = "studioflow_import_history";
const IMPORTED_STUDENTS_KEY = "studioflow_imported_students";
const IMPORTED_CLASSES_KEY = "studioflow_imported_classes";
const IMPORTED_TEACHERS_KEY = "studioflow_imported_teachers";
const IMPORTED_PARENTS_KEY = "studioflow_imported_parents";
const IMPORTED_CAREGIVERS_KEY = "studioflow_imported_caregivers";

function loadHistory(): ImportJob[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw) as ImportJob[];
  } catch { /* ignore */ }
  return [];
}

function saveHistory(jobs: ImportJob[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(jobs));
}

function loadImported<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T[];
  } catch { /* ignore */ }
  return [];
}

function saveImported<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* ── Context ──────────────────────────────────────────────────────── */

interface MigrationCtx {
  state: MigrationState;
  /** Go to a specific step */
  goToStep: (step: WizardStep) => void;
  /** Select import category */
  selectCategory: (cat: ImportCategory) => void;
  /** Parse uploaded file */
  uploadFile: (file: File) => Promise<void>;
  /** Update a single field mapping (manual remap) */
  updateMapping: (col: string, targetField: string | null) => void;
  /** Run validation on mapped rows */
  runValidation: () => void;
  /** Build the import preview / relationship linking */
  buildPreview: () => void;
  /** Confirm and execute the import */
  confirmImport: () => ImportSnapshot;
  /** Reset wizard back to step 1 */
  resetWizard: () => void;
  /** Imported records (available to other pages) */
  importedStudents: Student[];
  importedClasses: Class[];
  importedTeachers: Teacher[];
  importedCaregivers: ParentAccount[];
  /** Import history */
  history: ImportJob[];
  /** Rollback the last import */
  rollbackImport: (jobId: string) => void;
}

const MigrationContext = createContext<MigrationCtx | null>(null);

const INITIAL_STATE: MigrationState = {
  step: 1,
  category: null,
  file: null,
  headers: [],
  rows: [],
  mappings: [],
  mappedRows: [],
  errors: [],
  importPreview: null,
  confirmed: false,
};

export function MigrationProvider({ children }: { children: React.ReactNode }) {
  const { studio } = useStudio();
  const teachersCtx = useTeachers();

  const [wizard, setWizard] = useState<MigrationState>(INITIAL_STATE);
  const [importedStudents, setImportedStudents] = useState<Student[]>(() => loadImported<Student>(IMPORTED_STUDENTS_KEY));
  const [importedClasses, setImportedClasses] = useState<Class[]>(() => loadImported<Class>(IMPORTED_CLASSES_KEY));
  const [importedTeachers, setImportedTeachers] = useState<Teacher[]>(() => loadImported<Teacher>(IMPORTED_TEACHERS_KEY));
  const [importedCaregivers, setImportedCaregivers] = useState<ParentAccount[]>(() => {
    const fromCaregivers = loadImported<ParentAccount>(IMPORTED_CAREGIVERS_KEY);
    if (fromCaregivers.length > 0) return fromCaregivers;

    /* Backwards-compatible migration: load from old parents key once */
    const fromParents = loadImported<ParentAccount>(IMPORTED_PARENTS_KEY);
    if (fromParents.length > 0) {
      saveImported(IMPORTED_CAREGIVERS_KEY, fromParents);
      try { localStorage.removeItem(IMPORTED_PARENTS_KEY); } catch { /* ignore */ }
      return fromParents;
    }

    return [];
  });
  const [history, setHistory] = useState<ImportJob[]>(loadHistory);
  /** Snapshot of state before the most recent import (for rollback) */
  const [lastSnapshot, setLastSnapshot] = useState<ImportSnapshot | null>(null);

  const goToStep = useCallback((step: WizardStep) => {
    setWizard((prev) => ({ ...prev, step }));
  }, []);

  const selectCategory = useCallback((cat: ImportCategory) => {
    setWizard((prev) => ({ ...prev, category: cat }));
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    setWizard((prev) => ({ ...prev, file, step: 3 }));
    try {
      const { rows, headers } = await parseFile(file);
      setWizard((prev) => ({
        ...prev,
        headers,
        rows,
        step: 4,
      }));

      // Auto-map fields
      const sampleRows = rows.slice(0, 5).map((r) => r.raw);
      const mappings = autoMapFields(headers, sampleRows, wizard.category ?? "students");
      setWizard((prev) => ({ ...prev, mappings }));

      // Apply mappings
      const mappedRows = applyMappings(rows, mappings);
      setWizard((prev) => ({ ...prev, mappedRows }));
    } catch (err) {
      console.error("File parse error:", err);
      setWizard((prev) => ({ ...prev, step: 3, errors: [{ row: 0, field: "file", message: err instanceof Error ? err.message : "Failed to parse file", severity: "error" }] }));
    }
  }, [wizard.category]);

  const updateMapping = useCallback((col: string, targetField: string | null) => {
    setWizard((prev) => {
      const mappings = prev.mappings.map((m) =>
        m.spreadsheetColumn === col
          ? { ...m, targetField, confidence: targetField === null ? 0 : 50 }
          : m,
      );
      const mappedRows = applyMappings(prev.rows, mappings);
      return { ...prev, mappings, mappedRows, errors: [] };
    });
  }, []);

  const runValidation = useCallback(() => {
    setWizard((prev) => {
      const ctx = {
        existingStudents: [...demoStudents, ...importedStudents],
        existingClasses: [...demoClasses, ...importedClasses],
        existingTeachers: [...demoTeachers, ...importedTeachers, ...teachersCtx.teachers],
        mappedRows: prev.mappedRows,
        category: prev.category ?? "students",
      };
      const errors = validateImport(ctx);
      return { ...prev, errors, step: 5 as WizardStep };
    });
  }, [importedStudents, importedClasses, importedTeachers, teachersCtx.teachers]);

  const buildPreview = useCallback(() => {
    setWizard((prev) => {
      const preview: ImportPreview = {
        studentCount: 0,
        parentCount: 0,
        classCount: 0,
        instructorCount: 0,
        enrolmentCount: 0,
        linkedEnrolments: [],
        linkedAssignments: [],
      };

      if (prev.category === "students") {
        const validRows = prev.mappedRows.filter((r) => r.mapped.name?.trim());
        preview.studentCount = validRows.length;

        // Count unique caregiver emails
        const caregiverEmails = new Set(
          validRows.map((r) => r.mapped.parentEmail?.toLowerCase().trim()).filter(Boolean),
        );
        preview.caregiverCount = caregiverEmails.size;

        // Try linking to existing classes by matching class names in enrolment data
        const allClasses = [...demoClasses, ...importedClasses];
        const allStudents = [...demoStudents, ...importedStudents];

        for (const row of validRows) {
          const className = row.mapped.className?.trim();
          if (className) {
            const matchedClass = allClasses.find(
              (c) => c.name.toLowerCase().trim() === className.toLowerCase().trim(),
            );
            if (matchedClass) {
              preview.enrolmentCount++;
              preview.linkedEnrolments.push({
                studentName: row.mapped.name.trim(),
                className: matchedClass.name,
              });
            }
          }
        }
      }

      if (prev.category === "classes") {
        const validRows = prev.mappedRows.filter((r) => r.mapped.name?.trim());
        preview.classCount = validRows.length;

        const allTeachers = [...demoTeachers, ...importedTeachers, ...teachersCtx.teachers];
        for (const row of validRows) {
          if (row.mapped.teacherName?.trim()) {
            const matched = allTeachers.find(
              (t) => t.name.toLowerCase().trim() === row.mapped.teacherName!.trim().toLowerCase(),
            );
            if (matched) {
              preview.linkedAssignments.push({
                teacherName: matched.name,
                className: row.mapped.name.trim(),
              });
            }
          }
        }
      }

      if (prev.category === "instructors") {
        const validRows = prev.mappedRows.filter((r) => r.mapped.name?.trim());
        preview.instructorCount = validRows.length;
      }

      return { ...prev, importPreview: preview, step: 6 as WizardStep };
    });
  }, [importedClasses, importedStudents, importedTeachers, teachersCtx.teachers]);

  const confirmImport = useCallback((): ImportSnapshot => {
    const snapshot: ImportSnapshot = {
      addedStudentIds: [],
      addedClassIds: [],
      addedTeacherIds: [],
      addedParentIds: [],
      enrolments: [],
      assignments: [],
    };

    const ts = Date.now();
    const { category, mappedRows, file } = wizard;

    if (category === "students") {
      const newStudents: Student[] = [];
      const newCaregivers: ParentAccount[] = [];
      const caregiverMap = new Map<string, string>(); // email → caregiverId

      for (const row of mappedRows) {
        const name = row.mapped.name?.trim();
        const caregiverName = row.mapped.parentName?.trim() || "Unknown Caregiver";
        const caregiverEmail = row.mapped.parentEmail?.trim();
        const caregiverPhone = row.mapped.parentPhone?.trim() || "";
        const caregiverAddress = row.mapped.parentAddress?.trim() || "";
        const dob = row.mapped.dob?.trim() || "";
        const allergies = row.mapped.allergies?.trim() || undefined;
        const medicalNotes = row.mapped.medicalNotes?.trim() || undefined;

        if (!name || !caregiverEmail) continue;

        // Create or reuse caregiver
        const emailNorm = caregiverEmail.toLowerCase();
        let caregiverId = caregiverMap.get(emailNorm);
        if (!caregiverId) {
          caregiverId = `cg_mig_${ts}_${newCaregivers.length}`;
          caregiverMap.set(emailNorm, caregiverId);

          // Build the primary caregiver from imported data
          const [firstName, ...lastParts] = caregiverName.split(" ");
          const lastName = lastParts.join(" ") || firstName;
          const primaryCg: Caregiver = {
            id: `cg_primary_${caregiverId}`,
            first_name: firstName,
            last_name: lastName,
            relationship_to_student: "Parent",
            email: caregiverEmail,
            phone: caregiverPhone,
            address: caregiverAddress || undefined,
            status: "active",
            role: "primary_caregiver",
            receives_announcements: true,
            receives_emergency_messages: true,
            can_view_schedule: true,
            can_view_billing: true,
            can_pay_invoices: true,
            can_manage_enrolments: true,
            can_sign_waivers: true,
            can_view_medical_notes: true,
            authorized_pickup: true,
            accepted_at: new Date().toISOString(),
          };

          // Build secondary caregiver if CSV has those fields
          const secFirstName = row.mapped.secondaryFirstName?.trim();
          const secEmail = row.mapped.secondaryEmail?.trim();
          let secondaryCg: Caregiver | undefined;
          if (secFirstName && secEmail) {
            const secLastName = row.mapped.secondaryLastName?.trim() || "";
            secondaryCg = {
              id: `cg_secondary_${caregiverId}`,
              first_name: secFirstName,
              last_name: secLastName,
              relationship_to_student: row.mapped.secondaryRelationship?.trim() || "Parent",
              email: secEmail,
              phone: row.mapped.secondaryPhone?.trim() || "",
              address: row.mapped.secondaryAddress?.trim() || undefined,
              status: "active",
              role: "secondary_caregiver",
              ...SAFE_SECONDARY_DEFAULTS,
              receives_announcements: row.mapped.secondaryReceivesEmails?.toLowerCase() !== "false",
              receives_emergency_messages: row.mapped.secondaryReceivesSMS?.toLowerCase() !== "false",
              can_view_billing: row.mapped.secondaryReceivesBilling?.toLowerCase() === "true",
              can_pay_invoices: row.mapped.secondaryReceivesBilling?.toLowerCase() === "true",
              accepted_at: new Date().toISOString(),
            };
          }

          const parent: ParentAccount = {
            id: caregiverId,
            studioId: studio.id,
            primaryContact: {
              firstName,
              lastName,
              relationshipToStudent: "Parent",
              email: caregiverEmail,
              phone: caregiverPhone,
              address: caregiverAddress || undefined,
              receivesEmails: true,
              receivesSMS: true,
              receivesBilling: true,
              emergencyContact: true,
            },
            secondaryContact: secondaryCg
              ? {
                  firstName: secondaryCg.first_name,
                  lastName: secondaryCg.last_name,
                  relationshipToStudent: secondaryCg.relationship_to_student,
                  email: secondaryCg.email,
                  phone: secondaryCg.phone,
                  address: secondaryCg.address,
                  receivesEmails: secondaryCg.receives_announcements,
                  receivesSMS: secondaryCg.receives_emergency_messages,
                  receivesBilling: secondaryCg.can_view_billing || secondaryCg.can_pay_invoices,
                  emergencyContact: secondaryCg.authorized_pickup || secondaryCg.receives_emergency_messages,
                }
              : undefined,
            primaryCaregiver: primaryCg,
            secondaryCaregiver: secondaryCg,
            additionalCaregivers: secondaryCg ? [secondaryCg] : [],
            childIds: [],
          };
          newParents.push(parent);
          snapshot.addedParentIds.push(caregiverId);
        }

        const studentId = `s_mig_${ts}_${newStudents.length}`;
        const student: Student = {
          id: studentId,
          studioId: studio.id,
          name,
          dob: dob || new Date("2015-01-01").toISOString(),
          caregiverId,
          caregiverName,
          caregiverEmail,
          classIds: [],
          attendanceRate: 0,
          waiver: "pending",
          payment: "due",
          balanceCents: 0,
          medicalNotes,
          allergies,
        };
        newStudents.push(student);
        snapshot.addedStudentIds.push(studentId);

        // Link student to caregiver
        const parent = newParents.find((p) => p.id === caregiverId)!;
        parent.childIds.push(studentId);
      }

      setImportedStudents((prev) => {
        const next = [...prev, ...newStudents];
        saveImported(IMPORTED_STUDENTS_KEY, next);
        return next;
      });
      setImportedCaregivers((prev) => {
        const next = [...prev, ...newParents];
        saveImported(IMPORTED_CAREGIVERS_KEY, next);
        return next;
      });
    }

    if (category === "classes") {
      const newClasses: Class[] = [];
      const allTeachers = [...demoTeachers, ...importedTeachers, ...teachersCtx.teachers];

      for (const row of mappedRows) {
        const name = row.mapped.name?.trim();
        if (!name) continue;

        let teacherId = "t1";
        if (row.mapped.teacherName?.trim()) {
          const matched = allTeachers.find(
            (t) => t.name.toLowerCase().trim() === row.mapped.teacherName!.trim().toLowerCase(),
          );
          if (matched) {
            teacherId = matched.id;
            snapshot.assignments.push({ teacherId: matched.id, classId: "" });
          }
        }

        const classId = `c_mig_${ts}_${newClasses.length}`;
        const cls: Class = {
          id: classId,
          studioId: studio.id,
          name,
          style: (row.mapped.style?.trim() || "Ballet") as Class["style"],
          ageGroup: (row.mapped.ageGroup?.trim() || "Junior") as Class["ageGroup"],
          day: (row.mapped.day?.trim() || "Mon") as Class["day"],
          startTime: row.mapped.startTime?.trim() || "17:00",
          durationMins: Number(row.mapped.durationMins) || 60,
          room: row.mapped.room?.trim() || "Studio A",
          teacherId,
          capacity: Number(row.mapped.capacity) || 15,
          enrolled: 0,
          waitlist: 0,
          inRecital: false,
          priceCents: Math.round((Number(row.mapped.priceCents) || 95) * 100),
        };
        newClasses.push(cls);
        snapshot.addedClassIds.push(classId);

        // Fix assignment link
        const assignIdx = snapshot.assignments.findIndex((a) => a.classId === "");
        if (assignIdx >= 0) snapshot.assignments[assignIdx].classId = classId;
      }

      setImportedClasses((prev) => {
        const next = [...prev, ...newClasses];
        saveImported(IMPORTED_CLASSES_KEY, next);
        return next;
      });
    }

    if (category === "instructors") {
      const newTeachers: Teacher[] = [];

      for (const row of mappedRows) {
        const name = row.mapped.name?.trim();
        const email = row.mapped.email?.trim();
        if (!name || !email) continue;

        const teacher: Teacher = {
          id: `t_mig_${ts}_${newTeachers.length}`,
          studioId: studio.id,
          name,
          email,
          styles: (row.mapped.styles?.split(",").map((s) => s.trim()).filter(Boolean) || ["Ballet"]) as Teacher["styles"],
          hourlyRateCents: Math.round((Number(row.mapped.hourlyRateCents) || 40) * 100),
          payType: (row.mapped.payType?.trim().toLowerCase() === "1099" ? "1099" : "employee") as Teacher["payType"],
        };
        newTeachers.push(teacher);
        snapshot.addedTeacherIds.push(teacher.id);
      }

      // Add to the shared teachers provider
      for (const t of newTeachers) {
        teachersCtx.addTeacher(t);
      }
      setImportedTeachers((prev) => {
        const next = [...prev, ...newTeachers];
        saveImported(IMPORTED_TEACHERS_KEY, next);
        return next;
      });
    }

    // Record the job in history
    const job: ImportJob = {
      id: `job_${ts}`,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      category: category ?? "students",
      fileName: file?.name ?? "unknown",
      fileType: file?.name?.endsWith(".xlsx") ? "xlsx" : "csv",
      totalRows: mappedRows.length,
      importedRows: snapshot.addedStudentIds.length + snapshot.addedClassIds.length + snapshot.addedTeacherIds.length,
      skippedRows: mappedRows.length - (snapshot.addedStudentIds.length + snapshot.addedClassIds.length + snapshot.addedTeacherIds.length),
      errorCount: wizard.errors.filter((e) => e.severity === "error").length,
      errors: wizard.errors,
      snapshot,
    };

    const newHistory = [job, ...history];
    setHistory(newHistory);
    saveHistory(newHistory);
    setLastSnapshot(snapshot);

    setWizard((prev) => ({ ...prev, confirmed: true, step: 7 }));
    return snapshot;
  }, [wizard, history, studio.id, importedTeachers, teachersCtx, importedStudents, importedClasses]);

  const resetWizard = useCallback(() => {
    setWizard(INITIAL_STATE);
  }, []);

  const rollbackImport = useCallback((jobId: string) => {
    const job = history.find((j) => j.id === jobId);
    if (!job?.snapshot) return;

    // Remove imported records
    const snap = job.snapshot;
    setImportedStudents((prev) => {
      const next = prev.filter((s) => !snap.addedStudentIds.includes(s.id));
      saveImported(IMPORTED_STUDENTS_KEY, next);
      return next;
    });
    setImportedClasses((prev) => {
      const next = prev.filter((c) => !snap.addedClassIds.includes(c.id));
      saveImported(IMPORTED_CLASSES_KEY, next);
      return next;
    });
    setImportedTeachers((prev) => {
      const next = prev.filter((t) => !snap.addedTeacherIds.includes(t.id));
      saveImported(IMPORTED_TEACHERS_KEY, next);
      return next;
    });
    setImportedCaregivers((prev) => {
      const next = prev.filter((p) => !snap.addedParentIds.includes(p.id));
      saveImported(IMPORTED_CAREGIVERS_KEY, next);
      return next;
    });

    // TODO: also remove from teachersCtx if needed

    // Mark job as rolled back
    const newHistory = history.map((j) =>
      j.id === jobId ? { ...j, snapshot: undefined } : j,
    );
    setHistory(newHistory);
    saveHistory(newHistory);
    setLastSnapshot(null);
  }, [history]);

  const ctx: MigrationCtx = useMemo(
    () => ({
      state: wizard,
      goToStep,
      selectCategory,
      uploadFile,
      updateMapping,
      runValidation,
      buildPreview,
      confirmImport,
      resetWizard,
      importedStudents,
      importedClasses,
      importedTeachers,
      importedCaregivers,
      history,
      rollbackImport,
    }),
    [wizard, importedStudents, importedClasses, importedTeachers, importedCaregivers, history, goToStep, selectCategory, uploadFile, updateMapping, runValidation, buildPreview, confirmImport, resetWizard, rollbackImport],
  );

  return (
    <MigrationContext.Provider value={ctx}>
      {children}
    </MigrationContext.Provider>
  );
}

export function useMigration(): MigrationCtx {
  const ctx = useContext(MigrationContext);
  if (!ctx) throw new Error("useMigration must be used within MigrationProvider");
  return ctx;
}

/** Lightweight hook: safely returns migration context or null if not wrapped. */
export function useOptionalMigration(): MigrationCtx | null {
  return useContext(MigrationContext);
}
