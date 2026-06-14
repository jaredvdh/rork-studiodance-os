import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  ClipboardCopy,
  Loader2,
  Mail,
  Megaphone,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { getFunctionUrl } from "@/lib/supabaseFunctions";
import { cn } from "@/lib/utils";
import type { VerticalTerminology } from "@/data/terminology";

interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
  term: VerticalTerminology;
}

export default function InviteDialog({ open, onClose, term }: InviteDialogProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = useCallback(async () => {
    setIsGenerating(true);
    try {
      const fnUrl = getFunctionUrl("create-invite");
      if (!fnUrl) {
        // Fallback: build link client-side
        const origin = window.location.origin;
        const link = `${origin}/parent/register`;
        setGeneratedLink(link);
        await navigator.clipboard.writeText(link);
        setCopied(true);
        toast.success("Registration link copied!", {
          description: "Share this with parents to register.",
        });
        setTimeout(() => setCopied(false), 2500);
        return;
      }

      const res = await fetch(fnUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error ?? "Failed to create invite");
      }

      const data = await res.json();
      const link = data.register_url;
      setGeneratedLink(link);
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Invite link copied!", {
        description: inviteEmail
          ? `Link for ${inviteEmail} is ready.`
          : "Send this link to parents to register.",
      });
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error("Couldn't create invite", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [inviteEmail]);

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card shadow-2xl animate-float-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">
                Invite {term.guardianPlural}
              </h2>
              <p className="text-xs text-muted-foreground">
                Generate a registration link to share
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/80">
              <Mail className="h-4 w-4 text-gold" />
              Parent email (optional)
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="parent@email.com"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-rose focus:ring-2 focus:ring-rose/20"
            />
            <p className="text-xs text-muted-foreground">
              Pre-fills the registration form with this email.
            </p>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerateLink}
            disabled={isGenerating}
            className={cn(
              "w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-soft transition-all",
              isGenerating
                ? "bg-rose/50 text-white cursor-not-allowed"
                : generatedLink
                  ? "bg-success text-white hover:opacity-90"
                  : "bg-rose text-rose-foreground hover:opacity-90",
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating invite…
              </>
            ) : generatedLink ? (
              <>
                <ClipboardCopy className="h-4 w-4" />
                {copied ? "Copied to clipboard!" : "Copy again"}
              </>
            ) : (
              <>
                <ClipboardCopy className="h-4 w-4" />
                Generate & copy link
              </>
            )}
          </button>

          {/* Generated link display */}
          {generatedLink && (
            <div className="rounded-xl border border-success/20 bg-success/5 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Check className="h-4 w-4 text-success" />
                <p className="text-xs font-semibold text-success">
                  Link copied — ready to share
                </p>
              </div>
              <p className="text-sm font-mono text-foreground break-all select-all">
                {generatedLink}
              </p>
            </div>
          )}

          {/* How it works */}
          <div className="rounded-xl bg-secondary/30 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              What happens next
            </p>
            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Share this link with {term.guardianPlural.toLowerCase()} via email, SMS, or your studio app</li>
              <li>{term.guardianPlural} click the link and create an account with their email</li>
              <li>They add their {term.participantPlural.toLowerCase()} and sign waivers</li>
              <li>They can view schedules, pay invoices, and receive announcements</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/40 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
