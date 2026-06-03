import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Baby,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  FileSignature,
  Heart,
  Mail,
  Megaphone,
  Phone,
  Plus,
  Shield,
  Stethoscope,
  Trash2,
  Wheat,
  X,
} from "lucide-react";

import { styleStyles, teacherName, useStudioData, useTeachers } from "@/data/store";
import { useParent } from "@/data/parentStore";
import { contactFullName, type FamilyContact } from "@/data/types";
import { ageFromDob, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import AddChildModal from "@/components/AddChildModal";

function emptyContact(): FamilyContact {
  return {
    firstName: "",
    lastName: "",
    relationshipToStudent: "Parent",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    receivesEmails: true,
    receivesSMS: true,
    receivesBilling: false,
    emergencyContact: false,
  };
}

export default function ParentChildren() {
  const { classes } = useStudioData();
  const { teachers } = useTeachers();
  const {
    parent,
    primaryContact,
    secondaryContact,
    children: myStudents,
    removeChild,
    updatePrimaryContact,
    setSecondaryContact,
    removeSecondaryContact,
  } = useParent();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Editing state for contacts
  const [editingPrimary, setEditingPrimary] = useState(false);
  const [editingSecondary, setEditingSecondary] = useState(false);
  const [addingSecondary, setAddingSecondary] = useState(false);

  const [primaryDraft, setPrimaryDraft] = useState<FamilyContact>(primaryContact);
  const [secondaryDraft, setSecondaryDraft] = useState<FamilyContact>(
    secondaryContact ?? emptyContact(),
  );

  // Sync drafts when contacts change
  const startEditPrimary = () => {
    setPrimaryDraft({ ...primaryContact });
    setEditingPrimary(true);
  };
  const startEditSecondary = () => {
    setSecondaryDraft({ ...(secondaryContact ?? emptyContact()) });
    setEditingSecondary(true);
  };
  const startAddSecondary = () => {
    setSecondaryDraft(emptyContact());
    setAddingSecondary(true);
  };

  const savePrimary = () => {
    updatePrimaryContact(primaryDraft);
    setEditingPrimary(false);
  };
  const saveSecondary = () => {
    setSecondaryContact(secondaryDraft);
    setEditingSecondary(false);
    setAddingSecondary(false);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="animate-float-up">
          <p className="text-sm text-muted-foreground">Family profiles</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            My family
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage parent/guardian contacts, children's profiles, medical notes &amp; emergency info
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-soft transition hover:bg-amber-50"
        >
          <Plus className="h-4 w-4" />
          Add child
        </button>
      </div>

      {/* ── Primary Contact Card ── */}
      <ContactCard
        label="Primary contact"
        contact={primaryContact}
        editing={editingPrimary}
        draft={primaryDraft}
        setDraft={setPrimaryDraft}
        onEdit={startEditPrimary}
        onSave={savePrimary}
        onCancel={() => setEditingPrimary(false)}
      />

      {/* ── Secondary Contact Card ── */}
      {secondaryContact || addingSecondary ? (
        <ContactCard
          label="Secondary contact"
          contact={secondaryContact ?? undefined}
          editing={editingSecondary || addingSecondary}
          draft={secondaryDraft}
          setDraft={setSecondaryDraft}
          onEdit={startEditSecondary}
          onSave={saveSecondary}
          onCancel={() => {
            setEditingSecondary(false);
            setAddingSecondary(false);
          }}
          onRemove={secondaryContact ? removeSecondaryContact : undefined}
        />
      ) : (
        <div className="animate-float-up rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/30 p-6 text-center">
          <Shield className="mx-auto h-8 w-8 text-amber-300" />
          <h4 className="mt-3 font-medium text-foreground/80">
            Add a second parent or guardian
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Useful for families with shared custody or two primary caregivers.
            They can receive studio communications and billing notices separately.
          </p>
          <button
            onClick={startAddSecondary}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add secondary contact
          </button>
        </div>
      )}

      {/* ── Children list ── */}
      {myStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-float-up">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-500">
            <Baby className="h-8 w-8" />
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold">
            No children added yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first child to get started with classes, waivers, and more.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-900"
          >
            Add child
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {myStudents.map((s, i) => {
            const isExpanded = expandedId === s.id;
            const enrolledClasses = classes.filter((c) =>
              s.classIds.includes(c.id),
            );
            const age = ageFromDob(s.dob);

            return (
              <div
                key={s.id}
                className="animate-float-up rounded-2xl border border-amber-200/70 bg-white shadow-soft overflow-hidden"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Header */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : s.id)
                  }
                  className="w-full flex items-center gap-4 p-5 text-left transition hover:bg-amber-50/50"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-xl font-semibold">
                        {s.name}
                      </h3>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {age} yrs
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {enrolledClasses.length} class
                      {enrolledClasses.length !== 1 ? "es" : ""} · DOB{" "}
                      {formatDate(s.dob, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {s.waiver === "signed" ? (
                      <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success hidden sm:inline-flex">
                        Waiver signed
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 hidden sm:inline-flex">
                        Waiver needed
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-amber-100 p-5 space-y-5">
                    {/* Classes */}
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                        Enrolled classes
                      </h4>
                      {enrolledClasses.length > 0 ? (
                        <div className="space-y-2">
                          {enrolledClasses.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center gap-3 rounded-xl bg-amber-50/60 p-3"
                            >
                              <span
                                className={cn(
                                  "h-2.5 w-2.5 shrink-0 rounded-full",
                                  styleStyles[c.style].dot,
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {c.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {c.day} {c.startTime} · {teacherName(teachers, c.teacherId)}{" "}
                                  · {c.room}
                                </p>
                              </div>
                              <Link
                                to="/parent/schedule"
                                className="text-xs font-medium text-amber-700 hover:text-amber-900"
                              >
                                Schedule
                              </Link>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl bg-amber-50/60 p-4 text-center">
                          <p className="text-sm text-muted-foreground">
                            Not enrolled in any classes yet.
                          </p>
                          <Link
                            to="/parent/classes"
                            className="mt-2 inline-block text-sm font-medium text-amber-700 hover:text-amber-900"
                          >
                            Browse classes →
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Attendance */}
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                        Attendance
                      </h4>
                      <div className="flex items-center gap-3 rounded-xl bg-amber-50/60 p-3">
                        <CalendarClock className="h-5 w-5 text-amber-500" />
                        <div>
                          <p className="text-sm font-medium">
                            {Math.round(s.attendanceRate * 100)}% attendance rate
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last 30 days
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Allergies */}
                    {s.allergies && (
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                          Allergies
                        </h4>
                        <div className="flex items-start gap-3 rounded-xl bg-rose/5 p-3">
                          <Wheat className="h-5 w-5 text-rose shrink-0 mt-0.5" />
                          <p className="text-sm font-medium text-rose">{s.allergies}</p>
                        </div>
                      </div>
                    )}

                    {/* Medical notes */}
                    {s.medicalNotes && (
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                          Medical notes
                        </h4>
                        <div className="flex items-start gap-3 rounded-xl bg-amber-50/60 p-3">
                          <Stethoscope className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm">{s.medicalNotes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Waiver */}
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                        Waiver status
                      </h4>
                      <div className="flex items-center justify-between rounded-xl bg-amber-50/60 p-3">
                        <div className="flex items-center gap-3">
                          <FileSignature className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p
                              className={cn(
                                "text-sm font-medium",
                                s.waiver === "signed"
                                  ? "text-success"
                                  : s.waiver === "pending"
                                    ? "text-amber-600"
                                    : "text-rose",
                              )}
                            >
                              {s.waiver === "signed"
                                ? "All waivers signed"
                                : s.waiver === "pending"
                                  ? "Waiver pending"
                                  : "Waiver missing"}
                            </p>
                          </div>
                        </div>
                        {s.waiver !== "signed" && (
                          <Link
                            to="/parent/waivers"
                            className="text-xs font-semibold text-amber-700 hover:text-amber-900"
                          >
                            Sign now →
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Family contacts summary */}
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                        Family contacts
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 rounded-xl bg-amber-50/60 p-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {contactFullName(primaryContact)}
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                Primary · {primaryContact.relationshipToStudent}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {primaryContact.phone} · {primaryContact.email}
                            </p>
                          </div>
                        </div>
                        {secondaryContact && (
                          <div className="flex items-center gap-3 rounded-xl bg-amber-50/60 p-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                {contactFullName(secondaryContact)}
                                <span className="ml-2 text-xs font-normal text-muted-foreground">
                                  Secondary · {secondaryContact.relationshipToStudent}
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {secondaryContact.phone} · {secondaryContact.email}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AddChildModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}

/* ── Contact Card Component ── */

function ContactCard({
  label,
  contact,
  editing,
  draft,
  setDraft,
  onEdit,
  onSave,
  onCancel,
  onRemove,
}: {
  label: string;
  contact?: FamilyContact;
  editing: boolean;
  draft: FamilyContact;
  setDraft: (c: FamilyContact) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onRemove?: () => void;
}) {
  const update = (patch: Partial<FamilyContact>) =>
    setDraft({ ...draft, ...patch });

  return (
    <div className="animate-float-up rounded-2xl border border-amber-200/70 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700 font-semibold text-sm">
            {editing
              ? (draft.firstName[0] ?? "") + (draft.lastName[0] ?? "")
              : contact
                ? (contact.firstName[0] ?? "") + (contact.lastName[0] ?? "")
                : "?"}
          </div>
          <div>
            <p className="font-medium">
              {contact ? contactFullName(contact) : "New contact"}
            </p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {onRemove && (
            <button
              onClick={onRemove}
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-rose/10 hover:text-rose"
              title="Remove contact"
              aria-label="Remove contact"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {!editing && (
            <button
              onClick={onEdit}
              className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-amber-50"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <EditingForm draft={draft} update={update} onSave={onSave} onCancel={onCancel} />
      ) : contact ? (
        <ContactDisplay contact={contact} />
      ) : null}
    </div>
  );
}

function ContactDisplay({ contact }: { contact: FamilyContact }) {
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-3 text-sm mb-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4 shrink-0" />
          <span className="truncate">{contact.email}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4 shrink-0" />
          <span>{contact.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Shield className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {contact.relationshipToStudent}
            {contact.householdLabel ? ` · ${contact.householdLabel}` : ""}
          </span>
        </div>
      </div>

      {/* Communication preferences */}
      <div className="flex flex-wrap gap-2">
        {contact.receivesEmails && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
            <Mail className="h-3 w-3" />
            Receives emails
          </span>
        )}
        {contact.receivesSMS && (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-3 py-1 text-xs font-medium text-teal">
            <Phone className="h-3 w-3" />
            Receives SMS
          </span>
        )}
        {contact.receivesBilling && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-gold">
            <Megaphone className="h-3 w-3" />
            Receives billing
          </span>
        )}
        {contact.emergencyContact && (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose/10 px-3 py-1 text-xs font-medium text-rose">
            <Shield className="h-3 w-3" />
            Emergency contact
          </span>
        )}
      </div>
    </>
  );
}

function EditingForm({
  draft,
  update,
  onSave,
  onCancel,
}: {
  draft: FamilyContact;
  update: (patch: Partial<FamilyContact>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const canSave =
    draft.firstName.trim() !== "" &&
    draft.lastName.trim() !== "" &&
    draft.email.trim() !== "";

  return (
    <div className="space-y-4">
      {/* Names */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
            First name
          </label>
          <input
            type="text"
            value={draft.firstName}
            onChange={(e) => update({ firstName: e.target.value })}
            placeholder="First name"
            className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
            Last name
          </label>
          <input
            type="text"
            value={draft.lastName}
            onChange={(e) => update({ lastName: e.target.value })}
            placeholder="Last name"
            className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
          />
        </div>
      </div>

      {/* Relationship & Household */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
            Relationship to student
          </label>
          <input
            type="text"
            value={draft.relationshipToStudent}
            onChange={(e) => update({ relationshipToStudent: e.target.value })}
            placeholder="e.g. Parent, Guardian, Grandparent"
            className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
            Household label{" "}
            <span className="font-normal text-muted-foreground/60">(optional)</span>
          </label>
          <input
            type="text"
            value={draft.householdLabel ?? ""}
            onChange={(e) =>
              update({ householdLabel: e.target.value || undefined })
            }
            placeholder="e.g. Mum's house, Dad's house"
            className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
          />
        </div>
      </div>

      {/* Email & Phone */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
            Email *
          </label>
          <input
            type="email"
            value={draft.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="email@example.com"
            className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
            Phone
          </label>
          <input
            type="text"
            value={draft.phone}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="(555) 123-4567"
            className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-2.5 px-3.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
          />
        </div>
      </div>

      {/* Address (optional) */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
          Address{" "}
          <span className="font-normal text-muted-foreground/60">(optional)</span>
        </label>
        <input
          type="text"
          value={draft.address ?? ""}
          onChange={(e) =>
            update({ address: e.target.value || undefined })
          }
          placeholder="Street address"
          className="w-full rounded-xl border border-amber-200 bg-white py-2.5 px-3.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
        />
      </div>

      {/* Communication preferences */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-2">
          Communication preferences
        </label>
        <div className="flex flex-wrap gap-2">
          <ToggleChip
            checked={draft.receivesEmails}
            onChange={(v) => update({ receivesEmails: v })}
            label="Emails"
            icon={Mail}
          />
          <ToggleChip
            checked={draft.receivesSMS}
            onChange={(v) => update({ receivesSMS: v })}
            label="SMS"
            icon={Phone}
          />
          <ToggleChip
            checked={draft.receivesBilling}
            onChange={(v) => update({ receivesBilling: v })}
            label="Billing"
            icon={Megaphone}
          />
          <ToggleChip
            checked={draft.emergencyContact}
            onChange={(v) => update({ emergencyContact: v })}
            label="Emergency"
            icon={Shield}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full border border-amber-200 bg-white py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-amber-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className={cn(
            "flex-1 rounded-full py-2.5 text-sm font-semibold shadow-soft transition-all",
            canSave
              ? "bg-amber-400 text-amber-900 hover:opacity-90"
              : "bg-amber-100 text-amber-400 cursor-not-allowed",
          )}
        >
          Save changes
        </button>
      </div>
    </div>
  );
}

function ToggleChip({
  checked,
  onChange,
  label,
  icon: Icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition border",
        checked
          ? "bg-amber-400 text-amber-900 border-amber-400"
          : "bg-white text-muted-foreground border-amber-200 hover:bg-amber-50",
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}
