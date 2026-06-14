import { useState, type FormEvent } from "react";
import {
  Baby,
  Mail,
  Stethoscope,
  User,
  Wheat,
  X,
} from "lucide-react";

import { useStudents, useTerminology } from "@/data/store";
import { cn } from "@/lib/utils";

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddMemberModal({ open, onClose }: AddMemberModalProps) {
  const { addStudent } = useStudents();
  const term = useTerminology();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [caregiverName, setCaregiverName] = useState("");
  const [caregiverEmail, setCaregiverEmail] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = name.trim() !== "";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);

    const ageNum = parseInt(age, 10) || 0;
    const birthYear = new Date().getFullYear() - ageNum;
    const dob = new Date(birthYear, 0, 1).toISOString();

    addStudent({
      name: name.trim(),
      dob,
      caregiverId: "",
      caregiverName: caregiverName.trim() || "—",
      caregiverEmail: caregiverEmail.trim() || "—",
      classIds: [],
      attendanceRate: 0,
      waiver: "missing",
      payment: "due",
      balanceCents: 0,
      medicalNotes: medicalNotes.trim() || undefined,
      allergies: allergies.trim() || undefined,
    });

    setName("");
    setAge("");
    setCaregiverName("");
    setCaregiverEmail("");
    setAllergies("");
    setMedicalNotes("");
    setIsSubmitting(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md animate-float-up rounded-3xl border border-border/70 bg-card p-6 shadow-lift">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose/10 text-rose">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">
              Add {term.participant}
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter their details to create a record manually
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-1.5">
              <Baby className="h-4 w-4 text-rose" />
              Full name
            </label>
            <input
              type="text"
              placeholder={`${term.participant}'s full name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              className="w-full rounded-xl border border-border bg-background py-3 px-4 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Age */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-1.5">
              <User className="h-4 w-4 text-rose" />
              Age (optional)
            </label>
            <input
              type="number"
              min={2}
              max={99}
              placeholder="e.g. 12"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-3 px-4 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Approximate age is fine — you can update their full date of birth later.
            </p>
          </div>

          {/* Caregiver name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-1.5">
              <User className="h-4 w-4 text-rose" />
              {term.guardian} name (optional)
            </label>
            <input
              type="text"
              placeholder={`${term.guardian}'s full name`}
              value={caregiverName}
              onChange={(e) => setCaregiverName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-3 px-4 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Caregiver email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-1.5">
              <Mail className="h-4 w-4 text-rose" />
              {term.guardian} email (optional)
            </label>
            <input
              type="email"
              placeholder={`${term.guardian.toLowerCase()}@email.com`}
              value={caregiverEmail}
              onChange={(e) => setCaregiverEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-3 px-4 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Allergies */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-1.5">
              <Wheat className="h-4 w-4 text-rose" />
              Allergies (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Peanuts, dairy, bee stings"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-3 px-4 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Medical notes */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-1.5">
              <Stethoscope className="h-4 w-4 text-rose" />
              Medical notes (optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Mild asthma — inhaler in bag"
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-3 px-4 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20 placeholder:text-muted-foreground/50 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-border bg-card py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={cn(
                "flex-1 rounded-full py-2.5 text-sm font-semibold shadow-soft transition-all",
                canSubmit && !isSubmitting
                  ? "bg-rose text-rose-foreground hover:opacity-90"
                  : "bg-rose/30 text-rose-foreground/50 cursor-not-allowed",
              )}
            >
              {isSubmitting ? "Adding…" : `Add ${term.participant.toLowerCase()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
