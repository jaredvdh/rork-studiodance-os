import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ProtectedRoute, GuestRoute } from "@/components/ProtectedRoute";
import AdminLogin from "@/pages/AdminLogin";
import AuthCallback from "@/pages/AuthCallback";
import AppShell from "./components/layout/AppShell";
import Announcements from "./pages/Announcements";
import Classes from "./pages/Classes";
import Dashboard from "./pages/Dashboard";
import InstructorPay from "./pages/InstructorPay";
import Instructors from "./pages/Instructors";
import Landing from "./pages/Landing";
import MigrationWizard from "./pages/MigrationWizard";
import MigrationHistory from "./pages/MigrationHistory";
import DemoLogin from "./pages/DemoLogin";
import NotFound from "./pages/NotFound";
import Payments from "./pages/Payments";
import Recitals from "./pages/Recitals";
import Schedule from "./pages/Schedule";
import Settings from "./pages/Settings";
import Students from "./pages/Students";

import { StudioProvider, TeachersProvider } from "./data/store";
import { MigrationProvider } from "./data/migrationStore";
import { ParentProvider } from "./data/parentStore";

import ParentShell from "./components/layout/ParentShell";
import ParentAnnouncements from "./pages/parent/ParentAnnouncements";
import ParentClasses from "./pages/parent/ParentClasses";
import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentFamily from "./pages/parent/ParentFamily";
import ParentLogin from "./pages/parent/ParentLogin";
import ParentPayments from "./pages/parent/ParentPayments";
import ParentRegister from "./pages/parent/ParentRegister";
import ParentSchedule from "./pages/parent/ParentSchedule";
import ParentWaivers from "./pages/parent/ParentWaivers";

const queryClient = new QueryClient();

const withShell = (Page: React.ComponentType) => (
  <StudioProvider>
    <TeachersProvider>
      <MigrationProvider>
        <AppShell>
          <Page />
        </AppShell>
      </MigrationProvider>
    </TeachersProvider>
  </StudioProvider>
);

const withParentShell = (Page: React.ComponentType) => (
  <StudioProvider>
    <TeachersProvider>
      <ParentProvider>
        <ParentShell>
          <Page />
        </ParentShell>
      </ParentProvider>
    </TeachersProvider>
  </StudioProvider>
);

const withStudio = (Page: React.ComponentType) => (
  <StudioProvider>
    <Page />
  </StudioProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={withStudio(Landing)} />
          <Route path="/demo" element={<DemoLogin />} />
          <Route path="/auth/callback" element={withStudio(AuthCallback)} />
          <Route path="/login" element={withStudio(AdminLogin)} />

          {/* Protected admin routes */}
          <Route path="/dashboard" element={<ProtectedRoute>{withShell(Dashboard)}</ProtectedRoute>} />
          <Route path="/classes" element={<ProtectedRoute>{withShell(Classes)}</ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute>{withShell(Students)}</ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute>{withShell(Schedule)}</ProtectedRoute>} />
          <Route path="/announcements" element={<ProtectedRoute>{withShell(Announcements)}</ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute>{withShell(Payments)}</ProtectedRoute>} />
          <Route path="/recitals" element={<ProtectedRoute>{withShell(Recitals)}</ProtectedRoute>} />
          <Route path="/instructors" element={<ProtectedRoute>{withShell(Instructors)}</ProtectedRoute>} />
          <Route path="/instructor-pay" element={<ProtectedRoute>{withShell(InstructorPay)}</ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute>{withShell(Settings)}</ProtectedRoute>} />
          <Route path="/migration" element={<ProtectedRoute>{withShell(MigrationWizard)}</ProtectedRoute>} />
          <Route path="/migration-history" element={<ProtectedRoute>{withShell(MigrationHistory)}</ProtectedRoute>} />

          {/* Parent/Student Portal — public auth pages */}
          <Route path="/parent/login" element={<GuestRoute>{withStudio(ParentLogin)}</GuestRoute>} />
          <Route path="/parent/register" element={<GuestRoute>{withStudio(ParentRegister)}</GuestRoute>} />

          {/* Parent/Student Portal — protected routes */}
          <Route path="/parent" element={<ProtectedRoute>{withParentShell(ParentDashboard)}</ProtectedRoute>} />
          <Route path="/parent/family" element={<ProtectedRoute>{withParentShell(ParentFamily)}</ProtectedRoute>} />
          <Route path="/parent/classes" element={<ProtectedRoute>{withParentShell(ParentClasses)}</ProtectedRoute>} />
          <Route path="/parent/schedule" element={<ProtectedRoute>{withParentShell(ParentSchedule)}</ProtectedRoute>} />
          <Route path="/parent/children" element={<ProtectedRoute>{withParentShell(ParentFamily)}</ProtectedRoute>} />
          <Route path="/parent/caregivers" element={<ProtectedRoute>{withParentShell(ParentFamily)}</ProtectedRoute>} />
          <Route path="/parent/payments" element={<ProtectedRoute>{withParentShell(ParentPayments)}</ProtectedRoute>} />
          <Route path="/parent/announcements" element={<ProtectedRoute>{withParentShell(ParentAnnouncements)}</ProtectedRoute>} />
          <Route path="/parent/waivers" element={<ProtectedRoute>{withParentShell(ParentWaivers)}</ProtectedRoute>} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
