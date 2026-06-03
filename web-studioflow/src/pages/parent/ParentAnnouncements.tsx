import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Calendar,
  Megaphone,
  Music,
  Users,
} from "lucide-react";

import { useStudioData } from "@/data/store";
import type { AnnouncementScope } from "@/data/types";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const scopeIcon: Record<AnnouncementScope, typeof Megaphone> = {
  "Studio-wide": Megaphone,
  Class: Users,
  Recital: Music,
  Emergency: AlertTriangle,
};

const scopeColors: Record<AnnouncementScope, string> = {
  "Studio-wide": "bg-amber-100 text-amber-700",
  Class: "bg-teal/10 text-teal",
  Recital: "bg-plum/10 text-plum",
  Emergency: "bg-rose/10 text-rose",
};

export default function ParentAnnouncements() {
  const { announcements } = useStudioData();
  const [selectedScope, setSelectedScope] = useState<AnnouncementScope | null>(
    null,
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      selectedScope
        ? announcements.filter((a) => a.scope === selectedScope)
        : announcements,
    [announcements, selectedScope],
  );

  const scopes: AnnouncementScope[] = [
    "Studio-wide",
    "Class",
    "Recital",
    "Emergency",
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="animate-float-up">
        <p className="text-sm text-muted-foreground">Stay informed</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          Studio updates
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Announcements, reminders & important notices
        </p>
      </div>

      {/* Scope filter */}
      <div className="flex flex-wrap gap-2">
        {scopes.map((scope) => {
          const Icon = scopeIcon[scope];
          return (
            <button
              key={scope}
              onClick={() =>
                setSelectedScope(selectedScope === scope ? null : scope)
              }
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                selectedScope === scope
                  ? scopeColors[scope]
                  : "border border-amber-200 bg-white text-muted-foreground hover:bg-amber-50",
              )}
            >
              <Icon className="h-4 w-4" />
              {scope}
            </button>
          );
        })}
        {selectedScope && (
          <button
            onClick={() => setSelectedScope(null)}
            className="rounded-full px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Announcements list */}
      <div className="space-y-4">
        {filtered.map((a, i) => {
          const Icon = scopeIcon[a.scope];
          const isExpanded = expandedId === a.id;

          return (
            <div
              key={a.id}
              className="animate-float-up rounded-2xl border border-amber-200/70 bg-white shadow-soft overflow-hidden"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : a.id)}
                className="w-full flex items-start gap-4 p-5 text-left transition hover:bg-amber-50/50"
              >
                <div
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                    scopeColors[a.scope],
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        scopeColors[a.scope],
                      )}
                    >
                      {a.scope}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {relativeTime(a.sentAt)}
                    </span>
                  </div>
                  <h3 className="mt-1 font-display text-lg font-semibold">
                    {a.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {a.body}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Sent to {a.audience} · {a.reach} recipients
                  </p>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-display text-xl font-semibold">
            No announcements
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No updates match this filter. Check back later!
          </p>
        </div>
      )}
    </div>
  );
}
