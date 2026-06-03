import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  CreditCard,
  FileSignature,
  Heart,
  Home,
  Megaphone,
  Menu,
  Search,
  Shield,
  Users,
  X,
} from "lucide-react";

import { useStudio } from "@/data/store";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/parent", label: "Dashboard", icon: Home, exact: true },
  { to: "/parent/family", label: "Family", icon: Users },
  { to: "/parent/classes", label: "Classes", icon: CalendarDays },
  { to: "/parent/schedule", label: "Schedule", icon: Heart },
  { to: "/parent/payments", label: "Payments", icon: CreditCard },
  { to: "/parent/announcements", label: "Updates", icon: Megaphone },
  { to: "/parent/waivers", label: "Waivers", icon: FileSignature },
];

function StudioLogoMark() {
  const { studio } = useStudio();
  if (studio.logoUrl) {
    return <img src={studio.logoUrl} alt={studio.name} className="h-full w-full object-cover" />;
  }
  return <>{studio.initials}</>;
}

function StudioName() {
  const { studio } = useStudio();
  return <>{studio.name}</>;
}

function StudioLogo() {
  const { studio } = useStudio();
  return (
    <NavLink to="/parent" className="flex items-center gap-2.5 shrink-0">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400 text-amber-900 font-display text-base font-semibold overflow-hidden">
        <StudioLogoMark />
      </div>
      <span className="font-display text-lg font-semibold tracking-tight hidden sm:block">
        <StudioName />
      </span>
    </NavLink>
  );
}

interface ParentShellProps {
  children: React.ReactNode;
}

export default function ParentShell({ children }: ParentShellProps) {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const location = useLocation();

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  return (
    <div className="min-h-screen bg-parent text-foreground">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-amber-200/60 bg-cream/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg text-foreground/60 hover:bg-amber-100/60 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <StudioLogo />

          {/* Desktop nav */}
          <nav className="ml-8 hidden items-center gap-1 lg:flex">
            {nav.map(({ to, label, icon: Icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                className={() =>
                  cn(
                    "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                    isActive(to, exact)
                      ? "bg-amber-100 text-amber-900"
                      : "text-foreground/60 hover:text-foreground hover:bg-amber-50",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-amber-200 bg-white/60 px-3 py-1.5 text-sm text-muted-foreground sm:flex">
              <Search className="h-3.5 w-3.5" />
              <input
                placeholder="Find a class…"
                className="w-32 bg-transparent outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            <button
              className="relative grid h-9 w-9 place-items-center rounded-full border border-amber-200 bg-white/60 text-foreground/60 transition hover:bg-amber-50"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose ring-2 ring-white" />
            </button>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-amber-400 text-sm font-semibold text-amber-900">
              DW
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-cream animate-float-up">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 grid h-9 w-9 place-items-center rounded-full text-foreground/60 hover:bg-amber-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col gap-1 px-4 py-6 pt-14">
              <NavLink
                to="/parent"
                onClick={() => setMobileOpen(false)}
                className="mb-4 flex items-center gap-3 px-2"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400 font-display text-lg font-semibold text-amber-900 overflow-hidden">
                  <StudioLogoMark />
                </div>
                <div className="leading-tight">
                  <p className="font-display text-base font-semibold"><StudioName /></p>
                  <p className="text-xs text-muted-foreground">Parent/Student Portal</p>
                </div>
              </NavLink>
              <p className="px-3 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Menu
              </p>
              {nav.map(({ to, label, icon: Icon, exact }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={() =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      isActive(to, exact)
                        ? "bg-amber-100 text-amber-900 shadow-sm"
                        : "text-foreground/60 hover:bg-amber-50 hover:text-foreground",
                    )
                  }
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-amber-200/60 bg-cream/90 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-around py-1.5">
          {nav.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              className={() =>
                cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] font-medium transition-colors rounded-lg min-w-0",
                  isActive(to, exact)
                    ? "text-amber-700"
                    : "text-muted-foreground",
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span className="truncate max-w-[56px]">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
