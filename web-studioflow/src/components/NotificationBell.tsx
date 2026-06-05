import { useCallback, useMemo, useState } from "react";
import {
  Bell,
  Check,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  Ruler,
  Shirt,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AppNotification {
  id: string;
  type: "measurement_requested" | "measurement_approved" | "measurement_rejected" | "costume_assigned" | "costume_delivered" | "costume_distributed" | "fee_due" | "fee_paid" | "fee_overdue" | "announcement" | "system";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  link?: string;
  metadata?: Record<string, string>;
}

const NOTIFICATION_ICONS: Record<AppNotification["type"], typeof Bell> = {
  measurement_requested: Ruler,
  measurement_approved: Check,
  measurement_rejected: X,
  costume_assigned: Shirt,
  costume_delivered: Truck,
  costume_distributed: Check,
  fee_due: DollarSign,
  fee_paid: Check,
  fee_overdue: DollarSign,
  announcement: MessageSquare,
  system: Sparkles,
};

interface NotificationBellProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (link: string) => void;
}

export function NotificationBell({ notifications, onMarkRead, onMarkAllRead, onNavigate }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative grid h-10 w-10 place-items-center rounded-xl transition hover:bg-secondary"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-rose text-[10px] font-bold text-white shadow-sm">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-40 w-80 sm:w-96 rounded-2xl border border-border/70 bg-card shadow-lift overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h4 className="text-sm font-semibold">Notifications</h4>
              {unread > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="text-xs font-medium text-rose hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="mx-auto h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = NOTIFICATION_ICONS[n.type] ?? Bell;
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        onMarkRead(n.id);
                        if (n.link) onNavigate(n.link);
                      }}
                      className={cn(
                        "flex items-start gap-3 w-full px-4 py-3 text-left transition hover:bg-secondary/50 border-b border-border/30",
                        !n.read && "bg-rose/5",
                      )}
                    >
                      <div className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-lg mt-0.5",
                        !n.read ? "bg-rose/10 text-rose" : "bg-secondary text-muted-foreground",
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{n.body}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-rose shrink-0 mt-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}


