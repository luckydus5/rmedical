import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, FileText, Activity, AlertTriangle, Wifi, Languages, Syringe, Brain, QrCode, Heart, Shield } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TopHeader from '@/components/layout/TopHeader';
import OverviewDashboard from '@/components/dashboard/OverviewDashboard';
import StatsCards from '@/components/dashboard/StatsCards';
import QRCodeGenerator from '@/components/sharing/QRCodeGenerator';
import AccessLogViewer from '@/components/access/AccessLogViewer';
import AdminPanel from '@/components/admin/AdminPanel';
import FacilityManagement from '@/components/admin/FacilityManagement';
import DatabaseTablesPanel from '@/components/admin/DatabaseTablesPanel';
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

  const isFacilityStaff = userFacilities && userFacilities.length > 0;

  // Render content based on active tab
  const renderContent = () => {
    if (role === 'admin') {
      switch (activeTab) {
        case 'overview':
          return <OverviewDashboard />;
        case 'facilities':
          return <FacilityManagement />;
        case 'users':
          return <AdminPanel />;
        case 'database':
          return <DatabaseTablesPanel />;
        case 'analytics':
          return <AnalyticsDashboardPlaceholder />;
        case 'features':
          return <AIFeaturesPanel />;
        default:
          return <OverviewDashboard />;
      }
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

// Analytics Dashboard Placeholder
function AnalyticsDashboardPlaceholder() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Health analytics and insights</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20">Coming Soon</Badge>
      </div>
      
      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: 'Total Patients', value: '—', color: 'text-emerald-600' },
          { label: 'Visits This Month', value: '—', color: 'text-blue-600' },
          { label: 'Prescriptions', value: '—', color: 'text-purple-600' },
          { label: 'Vaccination Coverage', value: '—', color: 'text-amber-600' },
        ].map((stat, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-6 text-center">
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// AI Features Panel
function AIFeaturesPanel() {
  const features = [
    {
      icon: AlertTriangle,
      title: 'AI Drug Interactions',
      description: 'Automatic detection of dangerous drug combinations, allergy cross-reactivity, and condition contraindications.',
      color: 'purple',
      status: 'Active',
    },
    {
      icon: Wifi,
      title: 'Offline-First System',
      description: 'Full offline support with IndexedDB storage. Works in rural areas without internet connection.',
      color: 'blue',
      status: 'Active',
    },
    {
      icon: Languages,
      title: 'Multi-Language Support',
      description: 'Available in English, Kinyarwanda, Swahili, and French. Reaching all East Africans.',
      color: 'green',
      status: 'Active',
    },
    {
      icon: QrCode,
      title: 'Emergency Access Mode',
      description: 'Life-saving QR code with blood type, allergies, and medications. Works even if patient is unconscious.',
      color: 'red',
      status: 'Active',
    },
    {
      icon: Syringe,
      title: 'Vaccination Tracker',
      description: 'WHO/Rwanda immunization schedule tracking. BCG, OPV, Pentavalent, PCV, Measles-Rubella, Yellow Fever & more.',
      color: 'orange',
      status: 'Active',
    },
    {
      icon: Activity,
      title: 'Smart Health Alerts',
      description: 'Proactive alerts for medication refills, overdue vaccinations, abnormal labs, and chronic conditions.',
      color: 'cyan',
      status: 'Active',
    },
  ];

  const colorClasses: Record<string, { border: string; bg: string; icon: string; badge: string }> = {
    purple: { border: 'border-purple-200', bg: 'from-purple-50 to-white', icon: 'bg-purple-100 text-purple-600', badge: 'bg-purple-100 text-purple-700' },
    blue: { border: 'border-blue-200', bg: 'from-blue-50 to-white', icon: 'bg-blue-100 text-blue-600', badge: 'bg-blue-100 text-blue-700' },
    green: { border: 'border-green-200', bg: 'from-green-50 to-white', icon: 'bg-green-100 text-green-600', badge: 'bg-green-100 text-green-700' },
    red: { border: 'border-red-200', bg: 'from-red-50 to-white', icon: 'bg-red-100 text-red-600', badge: 'bg-red-100 text-red-700' },
    orange: { border: 'border-orange-200', bg: 'from-orange-50 to-white', icon: 'bg-orange-100 text-orange-600', badge: 'bg-orange-100 text-orange-700' },
    cyan: { border: 'border-cyan-200', bg: 'from-cyan-50 to-white', icon: 'bg-cyan-100 text-cyan-600', badge: 'bg-cyan-100 text-cyan-700' },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI-Powered Features</h2>
          <p className="text-muted-foreground">Game-changing healthcare technology for Africa</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => {
          const colors = colorClasses[feature.color];
          return (
            <Card 
              key={i} 
              className={`${colors.border} bg-gradient-to-br ${colors.bg} card-hover cursor-pointer`}
            >
              <CardHeader>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.icon}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="mt-4">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge className={`${colors.badge} hover:${colors.badge}`}>
                  ✅ {feature.status}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-primary to-emerald-600 text-white border-0 shadow-xl shadow-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Brain className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Sanovia AI-Powered Healthcare</h3>
              <p className="text-white/80">
                6 game-changing features active • Transforming healthcare in Africa
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
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
