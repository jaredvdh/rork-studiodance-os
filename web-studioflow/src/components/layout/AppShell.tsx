import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CalendarDays,
  Check,
  CreditCard,
  DollarSign,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Megaphone,
  Menu,
  Palette,
  Search,
  Settings,
  Shirt,
  Signature,
  Sparkles,
  Store,
  Trophy,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { DemoBadge, isDemoSession } from "@/components/DemoBadge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useStudio, useTerminology } from "@/data/store";
import { useAuth } from "@/hooks/useAuth";
import type { VerticalTerminology } from "@/data/terminology";
import { ALL_VERTICALS, VERTICAL_LABELS } from "@/data/terminology";
import { cn } from "@/lib/utils";

type NavKey = "dashboard" | "classes" | "students" | "schedule" | "recitals" | "costumes" | "instructors" | "instructorPay" | "announcements" | "payments" | "waivers" | "migration";

interface NavItem {
  to: string;
  key: NavKey;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { to: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { to: "/classes", key: "classes", icon: CalendarDays },
  { to: "/students", key: "students", icon: Users },
  { to: "/schedule", key: "schedule", icon: GraduationCap },
  { to: "/recitals", key: "recitals", icon: Trophy },
  { to: "/costumes", key: "costumes", icon: Shirt },
  { to: "/instructors", key: "instructors", icon: UserRound },
  { to: "/instructor-pay", key: "instructorPay", icon: DollarSign },
  { to: "/announcements", key: "announcements", icon: Megaphone },
  { to: "/payments", key: "payments", icon: CreditCard },
  { to: "/waivers", key: "waivers", icon: Signature },
  { to: "/migration", key: "migration", icon: Upload },
];

function navLabel(key: NavKey, term: VerticalTerminology): string {
  switch (key) {
    case "dashboard": return "Dashboard";
    case "classes": return "Classes";
    case "students": return `${term.participantPlural} & Parents`;
    case "schedule": return "Schedule";
    case "recitals": return term.eventPlural;
    case "costumes": return "Costumes";
    case "instructors": return term.instructorPlural;
    case "instructorPay": return `${term.instructor} Pay`;
    case "announcements": return "Announcements";
    case "payments": return "Payments";
    case "waivers": return "Waivers & Docs";
    case "migration": return "Migration Assistant";
  }
}

function StudioBrand() {
  const { studio } = useStudio();
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sidebar-primary font-display text-lg font-semibold text-sidebar-primary-foreground overflow-hidden">
        {studio.logoUrl ? (
          <img src={studio.logoUrl} alt={studio.name} className="h-full w-full object-cover" />
        ) : (
          studio.initials
        )}
      </div>
      <div className="leading-tight">
        <p className="font-display text-base font-semibold text-sidebar-accent-foreground">{studio.name}</p>
        <p className="text-xs text-sidebar-foreground/60">{studio.city}</p>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate, term }: { onNavigate?: () => void; term: VerticalTerminology }) {
  return (
    <div className="flex h-full flex-col gap-1 px-4 py-6">
      <NavLink to="/" className="mb-6 block px-2">
        <StudioBrand />
      </NavLink>

      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
        Manage
      </p>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, key, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lift"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            {navLabel(key, term)}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 border-t border-sidebar-border pt-4">
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lift"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )
          }
        >
          <Settings className="h-[18px] w-[18px]" strokeWidth={2} />
          Settings
        </NavLink>
      </div>

      <div className="mt-auto rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/60 p-4">
        <div className="mb-2 flex items-center gap-2 text-rose">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">Studio AI</span>
        </div>
        <p className="text-xs leading-relaxed text-sidebar-foreground/70">
          Auto-build {term.event.toLowerCase()} running orders and spot attendance dips. Coming soon to your studio.
        </p>
      </div>
    </div>
  );
}

const BRAND_COLORS = [
  { label: "Ballet rose", value: "350 74% 60%", swatch: "hsl(350 74% 60%)" },
  { label: "Plum", value: "268 30% 40%", swatch: "hsl(268 30% 40%)" },
  { label: "Indigo", value: "245 48% 48%", swatch: "hsl(245 48% 48%)" },
  { label: "Teal", value: "178 42% 42%", swatch: "hsl(178 42% 42%)" },
  { label: "Gold", value: "38 64% 54%", swatch: "hsl(38 64% 54%)" },
  { label: "Amber", value: "32 82% 48%", swatch: "hsl(32 82% 48%)" },
  { label: "Forest", value: "152 46% 36%", swatch: "hsl(152 46% 36%)" },
  { label: "Slate", value: "220 12% 40%", swatch: "hsl(220 12% 40%)" },
];

function getInitials(user: { name?: string; email: string } | null): string {
  if (!user) return "??";
  if (user.name) {
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return user.name.slice(0, 2).toUpperCase();
  }
  return user.email.slice(0, 2).toUpperCase();
}

function UserMenu() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const { studio, updateStudio } = useStudio();
  const term = useTerminology();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
      queryClient.clear();
      navigate("/login", { replace: true });
    } catch {
      setIsSigningOut(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="grid h-9 w-9 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground transition hover:opacity-85"
          aria-label="User menu"
        >
          {getInitials(user)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent className="w-64" align="end" sideOffset={8}>
          {/* User info */}
          <div className="px-2 py-2">
            <p className="text-sm font-semibold">{user?.name ?? "Studio Admin"}</p>
            <p className="text-xs text-muted-foreground">{user?.email ?? ""}</p>
            {studio.name && (
              <p className="mt-1 text-[11px] text-muted-foreground/70">{studio.name}</p>
            )}
          </div>
          <DropdownMenuSeparator />

          {/* Quick jump to settings */}
          <DropdownMenuItem
            onClick={() => { navigate("/settings"); setOpen(false); }}
            className="gap-2.5"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            Open all settings
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
            Quick setup
          </DropdownMenuLabel>

          {/* Studio type */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2.5">
              <Store className="h-4 w-4 text-muted-foreground" />
              <span>Studio type</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {VERTICAL_LABELS[studio.vertical]}
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="w-52">
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                  Change how labels appear
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ALL_VERTICALS.map((v) => (
                  <DropdownMenuItem
                    key={v}
                    onClick={() => updateStudio({ vertical: v })}
                    className="flex items-center justify-between"
                  >
                    <span>{VERTICAL_LABELS[v]}</span>
                    {studio.vertical === v && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          {/* Brand color */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2.5">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <span>Brand colour</span>
              <span
                className="ml-auto h-3.5 w-3.5 rounded-full border border-border"
                style={{ backgroundColor: BRAND_COLORS.find((c) => c.value === studio.brandColor)?.swatch ?? "hsl(268 30% 40%)" }}
              />
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="w-44">
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                  Sidebar accent colour
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="grid grid-cols-4 gap-1.5 p-2">
                  {BRAND_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => updateStudio({ brandColor: c.value })}
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-full transition hover:scale-110",
                        studio.brandColor === c.value && "ring-2 ring-ring ring-offset-1 ring-offset-popover",
                      )}
                      title={c.label}
                    >
                      <span
                        className="h-5 w-5 rounded-full shadow-sm"
                        style={{ backgroundColor: c.swatch }}
                      />
                    </button>
                  ))}
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Terminology preview */}
          <div className="px-2 py-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Current labels
            </p>
            <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <span className="text-muted-foreground">{term.participantPlural}:</span>
              <span className="font-medium">{term.participantPlural}</span>
              <span className="text-muted-foreground">{term.instructorPlural}:</span>
              <span className="font-medium">{term.instructorPlural}</span>
              <span className="text-muted-foreground">{term.eventPlural}:</span>
              <span className="font-medium">{term.eventPlural}</span>
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Sign out */}
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="gap-2.5 text-muted-foreground"
          >
            {isSigningOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {isSigningOut ? "Signing out…" : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const demo = isDemoSession();
  const location = useLocation();
  const term = useTerminology();
  const current = navItems.find((n) => location.pathname.startsWith(n.to))
    ? navLabel(navItems.find((n) => location.pathname.startsWith(n.to))!.key, term)
    : "Dashboard";

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 bg-sidebar lg:block">
        <SidebarContent term={term} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-sidebar animate-float-up">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 grid h-9 w-9 place-items-center rounded-full text-sidebar-foreground/70 hover:bg-sidebar-accent"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent term={term} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-72">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg text-foreground/70 hover:bg-secondary lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-lg font-semibold tracking-tight">{current}</h1>
            {demo && <DemoBadge />}

            <div className="ml-auto flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm text-muted-foreground sm:flex">
                <Search className="h-4 w-4" />
                <input
                  placeholder="Search students, classes…"
                  className="w-44 bg-transparent outline-none placeholder:text-muted-foreground/70"
                />
              </div>
              <button className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground/70 transition hover:bg-secondary" aria-label="Notifications">
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose ring-2 ring-card" />
              </button>
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="bg-grain px-4 py-6 sm:px-6 lg:px-8">
          {demo && <DemoBadge variant="banner" className="-mx-4 -mt-6 mb-4 sm:-mx-6 lg:-mx-8" />}
          {children}
        </main>
      </div>
    </div>
  );
}
