import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardCopy,
  Link2,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

import { getFunctionUrl } from "@/lib/supabaseFunctions";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { VerticalTerminology } from "@/data/terminology";

interface InviteRow {
  id: string;
  token: string;
  studio_id: string;
  email: string | null;
  status: "pending" | "accepted" | "expired";
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

interface InviteLinksSectionProps {
  term: VerticalTerminology;
  studioId: string;
}

export default function InviteLinksSection({ term, studioId }: InviteLinksSectionProps) {
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState("");

  const { data: invites, isLoading, isError, refetch } = useQuery<InviteRow[]>({
    queryKey: ["invites", studioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invites")
        .select("id, token, studio_id, email, status, created_at, expires_at, accepted_at")
        .eq("studio_id", studioId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as InviteRow[];
    },
    staleTime: 30_000,
  });

  const createInvite = useMutation({
    mutationFn: async (email?: string) => {
      const fnUrl = getFunctionUrl("create-invite");
      if (!fnUrl) throw new Error("Edge functions not configured");

      const res = await fetch(fnUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email?.trim() || undefined }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error ?? "Failed to create invite");
      }

      return res.json() as Promise<{
        ok: boolean;
        token: string;
        email: string | null;
        register_url: string;
        studio_name: string;
      }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invites", studioId] });
      const link = data.register_url.startsWith("http")
        ? data.register_url
        : `${window.location.origin}${data.register_url}`;

      navigator.clipboard.writeText(link).catch(() => {});
      toast.success("Invite link created and copied!", {
        description: data.email
          ? `Link for ${data.email} is ready to share.`
          : "Link is ready to share with parents.",
      });
      setNewEmail("");
    },
    onError: (err) => {
      toast.error("Couldn't create invite", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    },
  });

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/parent/register?invite=${token}`;
    navigator.clipboard.writeText(link).catch(() => {});
    toast.success("Registration link copied!");
  };

  const statusConfig: Record<string, { icon: typeof CheckCircle2; label: string; chipClass: string }> = {
    pending: { icon: Clock, label: "Pending", chipClass: "bg-amber/10 text-amber" },
    accepted: { icon: CheckCircle2, label: "Accepted", chipClass: "bg-teal/10 text-teal" },
    expired: { icon: XCircle, label: "Expired", chipClass: "bg-muted text-muted-foreground" },
  };

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
      <div className="flex items-center gap-3 mb-5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/10">
          <Link2 className="h-4.5 w-4.5 text-gold" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Invite links</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Generate shareable registration links for {term.guardianPlural.toLowerCase()}. Each link lets
            {term.guardianPlural.toLowerCase()} create an account and add their {term.participantPlural.toLowerCase()}.
          </p>
        </div>
      </div>

      {/* Create new invite */}
      <div className="mb-6 rounded-xl border border-border/60 bg-secondary/30 p-4">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-3">
          New invite link
        </p>
        <div className="flex items-center gap-2.5">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder={`${term.guardian} email (optional)`}
            className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-1 focus:ring-ring"
            onKeyDown={(e) => {
              if (e.key === "Enter") createInvite.mutate(newEmail.trim() || undefined);
            }}
          />
          <button
            onClick={() => createInvite.mutate(newEmail.trim() || undefined)}
            disabled={createInvite.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lift transition hover:opacity-90 disabled:opacity-40 shrink-0"
          >
            {createInvite.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {createInvite.isPending ? "Creating…" : "Generate link"}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Links expire after 30 days. Share via email, SMS, or your studio app.
        </p>
      </div>

      {/* Invite list */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          Existing invites
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-secondary"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center">
          <p className="text-sm text-muted-foreground">Couldn't load invites. Try refreshing.</p>
        </div>
      ) : !invites || invites.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-secondary/30 p-6 text-center">
          <Megaphone className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">No invites yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Generate your first link above to start inviting {term.guardianPlural.toLowerCase()}.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {invites.map((invite) => {
            const cfg = statusConfig[invite.status] ?? statusConfig.pending;
            const StatusIcon = cfg.icon;
            const isExpired = new Date(invite.expires_at) < new Date() && invite.status !== "accepted";

            return (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-4 py-3 transition hover:bg-secondary/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", cfg.chipClass)}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {invite.email || "No email specified"}
                      </span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0", cfg.chipClass)}>
                        {isExpired ? "Expired" : cfg.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Created {new Date(invite.created_at).toLocaleDateString()} · Expires{" "}
                      {new Date(invite.expires_at).toLocaleDateString()}
                      {invite.accepted_at && ` · Accepted ${new Date(invite.accepted_at).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopyLink(invite.token)}
                  disabled={isExpired || invite.status === "expired"}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium shrink-0 transition",
                    isExpired || invite.status === "expired"
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary/10 text-primary hover:bg-primary/20",
                  )}
                >
                  <Copy className="h-3 w-3" />
                  Copy link
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
