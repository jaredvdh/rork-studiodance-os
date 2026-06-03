import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ProtectedRoute, GuestRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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

          {/* Protected admin routes — wrapped in ErrorBoundary for crash resilience */}
          <Route path="/dashboard" element={<ProtectedRoute><ErrorBoundary>{withShell(Dashboard)}</ErrorBoundary></ProtectedRoute>} />
          <Route path="/classes" element={<ProtectedRoute><ErrorBoundary>{withShell(Classes)}</ErrorBoundary></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><ErrorBoundary>{withShell(Students)}</ErrorBoundary></ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute><ErrorBoundary>{withShell(Schedule)}</ErrorBoundary></ProtectedRoute>} />
          <Route path="/announcements" element={<ProtectedRoute><ErrorBoundary>{withShell(Announcements)}</ErrorBoundary></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><ErrorBoundary>{withShell(Payments)}</ErrorBoundary></ProtectedRoute>} />
          <Route path="/recitals" element={<ProtectedRoute><ErrorBoundary>{withShell(Recitals)}</ErrorBoundary></ProtectedRoute>} />
          <Route path="/instructors" element={<ProtectedRoute><ErrorBoundary>{withShell(Instructors)}</ErrorBoundary></ProtectedRoute>} />
          <Route path="/instructor-pay" element={<ProtectedRoute><ErrorBoundary>{withShell(InstructorPay)}</ErrorBoundary></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><ErrorBoundary>{withShell(Settings)}</ErrorBoundary></ProtectedRoute>} />
          <Route path="/migration" element={<ProtectedRoute><ErrorBoundary>{withShell(MigrationWizard)}</ErrorBoundary></ProtectedRoute>} />
          <Route path="/migration-history" element={<ProtectedRoute><ErrorBoundary>{withShell(MigrationHistory)}</ErrorBoundary></ProtectedRoute>} />

          {/* Parent/Student Portal — public auth pages */}
          <Route path="/parent/login" element={<GuestRoute>{withStudio(ParentLogin)}</GuestRoute>} />
          <Route path="/parent/register" element={<GuestRoute>{withStudio(ParentRegister)}</GuestRoute>} />

          {/* Parent/Student Portal — protected routes */}
          <Route path="/parent" element={<ProtectedRoute><ErrorBoundary>{withParentShell(ParentDashboard)}</ErrorBoundary></ProtectedRoute>} />
          <Route path="/parent/family" element={<ProtectedRoute><ErrorBoundary>{withParentShell(ParentFamily)}</ErrorBoundary></ProtectedRoute>} />
          <Route path="/parent/classes" element={<ProtectedRoute><ErrorBoundary>{withParentShell(ParentClasses)}</ErrorBoundary></ProtectedRoute>} />
          <Route path="/parent/schedule" element={<ProtectedRoute><ErrorBoundary>{withParentShell(ParentSchedule)}</ErrorBoundary></ProtectedRoute>} />
          <Route path="/parent/children" element={<ProtectedRoute><ErrorBoundary>{withParentShell(ParentFamily)}</ErrorBoundary></ProtectedRoute>} />
          <Route path="/parent/caregivers" element={<ProtectedRoute><ErrorBoundary>{withParentShell(ParentFamily)}</ErrorBoundary></ProtectedRoute>} />
          <Route path="/parent/payments" element={<ProtectedRoute><ErrorBoundary>{withParentShell(ParentPayments)}</ErrorBoundary></ProtectedRoute>} />
          <Route path="/parent/announcements" element={<ProtectedRoute><ErrorBoundary>{withParentShell(ParentAnnouncements)}</ErrorBoundary></ProtectedRoute>} />
          <Route path="/parent/waivers" element={<ProtectedRoute><ErrorBoundary>{withParentShell(ParentWaivers)}</ErrorBoundary></ProtectedRoute>} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
