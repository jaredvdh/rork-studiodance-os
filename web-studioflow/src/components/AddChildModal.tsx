import { useState } from "react";
import {
  Baby,
  Stethoscope,
  Star,
  Wheat,
  X,
} from "lucide-react";
import type { FormEvent } from "react";

import { useParent } from "@/data/parentStore";
import { cn } from "@/lib/utils";

interface AddChildModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddChildModal({ open, onClose }: AddChildModalProps) {
  const { addChild } = useParent();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = name.trim() !== "" && age.trim() !== "";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);

    const ageNum = parseInt(age, 10) || 0;
    const birthYear = new Date().getFullYear() - ageNum;
    const dob = new Date(birthYear, 0, 1).toISOString();

    addChild({
      name: name.trim(),
      dob,
      allergies: allergies.trim() || undefined,
      medicalNotes: medicalNotes.trim() || undefined,
    });

    setTimeout(() => {
      setName("");
      setAge("");
      setAllergies("");
      setMedicalNotes("");
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md animate-float-up rounded-3xl border border-amber-200/70 bg-white p-6 shadow-lift">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-amber-100"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
            <Baby className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">Add a child</h2>
            <p className="text-sm text-muted-foreground">
              Enter their details to get started
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-1.5">
              <Baby className="h-4 w-4 text-amber-500" />
              Full name
            </label>
            <input
              type="text"
              placeholder="Child's name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-3 px-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 placeholder:text-muted-foreground/50"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-1.5">
              <Star className="h-4 w-4 text-amber-500" />
              Age
            </label>
            <input
              type="number"
              min={2}
              max={99}
              placeholder="e.g. 7"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-3 px-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 placeholder:text-muted-foreground/50"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              We'll place them in the right age group automatically
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-1.5">
              <Wheat className="h-4 w-4 text-amber-500" />
              Allergies
            </label>
            <input
              type="text"
              placeholder="e.g. Peanuts, dairy, bee stings"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              className="w-full rounded-xl border border-amber-200 bg-white py-3 px-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 placeholder:text-muted-foreground/50"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-1.5">
              <Stethoscope className="h-4 w-4 text-amber-500" />
              Medical notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Mild asthma — inhaler in bag"
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              className="w-full rounded-xl border border-amber-200 bg-white py-3 px-4 text-sm outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 placeholder:text-muted-foreground/50 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-amber-200 bg-white py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-amber-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={cn(
                "flex-1 rounded-full py-2.5 text-sm font-semibold shadow-soft transition-all",
                canSubmit && !isSubmitting
                  ? "bg-amber-400 text-amber-900 hover:opacity-90"
                  : "bg-amber-100 text-amber-400 cursor-not-allowed",
              )}
            >
              {isSubmitting ? "Adding…" : "Add child"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
