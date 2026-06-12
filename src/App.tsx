import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Dashboard from "./pages/DashboardNew";
import Auth from "./pages/Auth";
import MedicalRecords from "./pages/MedicalRecords";
import PatientView from "./pages/PatientView";
import AccessPage from "./pages/AccessPage";
import FacilityDashboard from "./pages/FacilityDashboard";
import ProfileSettings from "./pages/ProfileSettings";
import StaffPortal from "./pages/StaffPortal";
import Facilities from "./pages/Facilities";
import NotFound from "./pages/NotFound";
import Appointments from "./pages/Appointments";
import DoctorSchedule from "./pages/DoctorSchedule";

// Admin Pages
import UsersRoles from "./pages/UsersRoles";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Security from "./pages/Security";
import AuditLogs from "./pages/AuditLogs";
import AccessControl from "./pages/AccessControl";
import Database from "./pages/Database";
import AIFeatures from "./pages/AIFeatures";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/records" element={<MedicalRecords />} />
            <Route path="/patient/:patientId" element={<PatientView />} />
            <Route path="/access/:token" element={<AccessPage />} />
            <Route path="/facility/:facilityId" element={<FacilityDashboard />} />
            <Route path="/profile" element={<ProfileSettings />} />
            <Route path="/staff-portal" element={<StaffPortal />} />
            <Route path="/facilities" element={<Facilities />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/schedule" element={<DoctorSchedule />} />
            
            {/* Admin Routes */}
            <Route path="/users" element={<UsersRoles />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/security" element={<Security />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/access-control" element={<AccessControl />} />
            <Route path="/database" element={<Database />} />
            <Route path="/ai-features" element={<AIFeatures />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
