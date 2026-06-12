import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, FileText, Heart } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TopHeader from '@/components/layout/TopHeader';
import OverviewDashboard from '@/components/dashboard/OverviewDashboard';
import StatsCards from '@/components/dashboard/StatsCards';
import QRCodeGenerator from '@/components/sharing/QRCodeGenerator';
import QRScanner from '@/components/sharing/QRScanner';
import AccessLogViewer from '@/components/access/AccessLogViewer';
import SmartHealthAlerts from '@/components/alerts/SmartHealthAlerts';
import EmergencyAccessCard from '@/components/emergency/EmergencyAccessCard';
import { useUserFacilities } from '@/hooks/useFacilities';
import sanoviaLogo from '@/assets/sanovia-logo.png';

export default function Dashboard() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { data: userFacilities, isLoading: facilitiesLoading } = useUserFacilities();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Listen for sidebar collapse events
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-primary/25 animate-pulse">
              <img src={sanoviaLogo} alt="Loading" className="h-10 w-10" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">Loading Sanovia</p>
            <p className="text-sm text-muted-foreground">Preparing your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isFacilityStaff = !!userFacilities && userFacilities.length > 0;

  // Render content based on active tab
  const renderContent = () => {
    if (role === 'admin') {
      return <OverviewDashboard />;
    }

    if (activeTab === 'sharing') {
      return <SharingDashboard isFacilityStaff={isFacilityStaff} />;
    }

    // Patient or Facility Staff Dashboard
    return <PatientDashboard navigate={navigate} isFacilityStaff={isFacilityStaff} userFacilities={userFacilities} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Top Header */}
      <TopHeader sidebarCollapsed={sidebarCollapsed} />

      {/* Main Content */}
      <main
        className="pt-20 pb-8 px-6 transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '5rem' : '18rem' }}
      >
        {renderContent()}
      </main>
    </div>
  );
}

// Share Access view (patient sidebar "Share Access" tab)
function SharingDashboard({ isFacilityStaff }: { isFacilityStaff: boolean }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Share Access</h1>
        <p className="text-muted-foreground">
          Generate a QR code to share your records with a provider, and review who has accessed them.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <QRCodeGenerator />
        <AccessLogViewer />
        {isFacilityStaff && <QRScanner />}
      </div>

      <EmergencyAccessCard />
    </div>
  );
}

// Patient Dashboard
interface PatientDashboardProps {
  navigate: (path: string) => void;
  isFacilityStaff: boolean;
  userFacilities: Array<{
    facility_id: string;
    role: string;
    facilities: {
      name: string;
      facility_type: string;
      city?: string | null;
    };
  }> | null;
}

function PatientDashboard({ navigate, isFacilityStaff, userFacilities }: PatientDashboardProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-emerald-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">Welcome to Your Health Portal</h1>
          <p className="text-white/80 max-w-lg">
            Manage your medical records, share them securely with healthcare providers, and stay on top of your health.
          </p>
        </div>
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Smart Health Alerts */}
      <SmartHealthAlerts />

      {/* Emergency Access Card */}
      <EmergencyAccessCard />

      {/* Facility Staff Section */}
      {isFacilityStaff && userFacilities && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">My Facilities</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userFacilities.map((staffRecord) => {
              const facility = staffRecord.facilities;
              return (
                <Card
                  key={staffRecord.facility_id}
                  className="border-border/50 cursor-pointer card-hover"
                  onClick={() => navigate(`/facility/${staffRecord.facility_id}`)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {staffRecord.role.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4">{facility?.name}</CardTitle>
                    <CardDescription className="capitalize">
                      {facility?.facility_type?.replace('_', ' ')} • {facility?.city}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full btn-professional">Open Dashboard</Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Patient Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 card-hover">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
            <CardTitle className="mt-4">My Medical Records</CardTitle>
            <CardDescription>
              View and manage all your health information in one place
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/records')} className="w-full btn-professional">
              View Records
            </Button>
          </CardContent>
        </Card>

        <QRCodeGenerator />

        {isFacilityStaff && <QRScanner />}

        <AccessLogViewer />

        <Card className="border-border/50 card-hover">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Heart className="h-6 w-6" />
            </div>
            <CardTitle className="mt-4">Health Summary</CardTitle>
            <CardDescription>
              View your complete health summary and recent activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate('/records')} className="w-full">
              View Summary
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
