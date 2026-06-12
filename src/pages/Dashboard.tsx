import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, QrCode, Activity, Shield, FileText, Users, Plus, Database, BarChart3, Languages, Wifi, AlertTriangle, Syringe, Brain } from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCards from '@/components/dashboard/StatsCards';
import QRCodeGenerator from '@/components/sharing/QRCodeGenerator';
import AccessLogViewer from '@/components/access/AccessLogViewer';
import AdminPanel from '@/components/admin/AdminPanel';
import FacilityManagement from '@/components/admin/FacilityManagement';
import DatabaseTablesPanel from '@/components/admin/DatabaseTablesPanel';
import { useUserFacilities } from '@/hooks/useFacilities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Dashboard() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { data: userFacilities, isLoading: facilitiesLoading } = useUserFacilities();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  // Check if user is facility staff
  const isFacilityStaff = userFacilities && userFacilities.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back{role === 'admin' ? ', Admin' : isFacilityStaff ? '' : '!'}
          </h1>
          <p className="text-muted-foreground">
            {role === 'admin'
              ? 'Manage facilities, users, and monitor system activity.'
              : isFacilityStaff
              ? 'Access your facility dashboard to manage patients and records.'
              : 'Manage your medical records and share them securely with healthcare providers.'}
          </p>
        </div>

        {/* Admin Dashboard */}
        {role === 'admin' && (
          <Tabs defaultValue="facilities" className="flex gap-6" orientation="vertical">
            {/* Left Sidebar Navigation */}
            <div className="w-64 shrink-0">
              <div className="sticky top-24 rounded-lg border bg-card p-2 shadow-sm">
                <nav className="flex flex-col gap-1">
                  <TabsList className="flex flex-col h-auto bg-transparent p-0 gap-1">
                    <TabsTrigger 
                      value="facilities" 
                      className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Building2 className="h-5 w-5" />
                      Facilities
                    </TabsTrigger>
                    <TabsTrigger 
                      value="users" 
                      className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Users className="h-5 w-5" />
                      Users & Roles
                    </TabsTrigger>
                    <TabsTrigger 
                      value="database" 
                      className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Database className="h-5 w-5" />
                      Database
                    </TabsTrigger>
                    <TabsTrigger 
                      value="analytics" 
                      className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <BarChart3 className="h-5 w-5" />
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger 
                      value="features" 
                      className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Brain className="h-5 w-5" />
                      AI Features
                    </TabsTrigger>
                  </TabsList>
                </nav>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              <TabsContent value="facilities" className="mt-0">
                <FacilityManagement />
              </TabsContent>

              <TabsContent value="users" className="mt-0">
                <AdminPanel />
              </TabsContent>

              <TabsContent value="database" className="mt-0">
                <DatabaseTablesPanel />
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    Analytics Dashboard
                  </CardTitle>
                  <CardDescription>
                    Health analytics - Full dashboard coming soon!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-green-600">—</div>
                        <div className="text-sm text-muted-foreground">Total Patients</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-blue-600">—</div>
                        <div className="text-sm text-muted-foreground">Visits This Month</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-purple-600">—</div>
                        <div className="text-sm text-muted-foreground">Prescriptions</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-orange-600">—</div>
                        <div className="text-sm text-muted-foreground">Vaccination Coverage</div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
              </TabsContent>

              <TabsContent value="features" className="mt-0">
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* AI Drug Interaction Card */}
                  <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <CardTitle className="mt-4">AI Drug Interactions</CardTitle>
                      <CardDescription>
                        Automatic detection of dangerous drug combinations, allergy cross-reactivity, and condition contraindications.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                        ✅ Active
                      </Badge>
                    </CardContent>
                  </Card>

                  {/* Offline Support Card */}
                  <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <Wifi className="h-6 w-6" />
                      </div>
                      <CardTitle className="mt-4">Offline-First System</CardTitle>
                      <CardDescription>
                        Full offline support with IndexedDB storage. Works in rural areas without internet connection.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                          ✅ Active
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Multi-Language Card */}
                  <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
                        <Languages className="h-6 w-6" />
                      </div>
                      <CardTitle className="mt-4">Multi-Language Support</CardTitle>
                      <CardDescription>
                        Available in English, Kinyarwanda, Swahili, and French. Reaching all East Africans.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                          ✅ Active
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Emergency Access Card */}
                  <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600">
                        <QrCode className="h-6 w-6" />
                      </div>
                      <CardTitle className="mt-4">Emergency Access Mode</CardTitle>
                      <CardDescription>
                        Life-saving QR code with blood type, allergies, and medications. Works even if patient is unconscious.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-200">
                        ✅ Active
                      </Badge>
                    </CardContent>
                  </Card>

                  {/* Vaccination Tracker Card */}
                  <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                        <Syringe className="h-6 w-6" />
                      </div>
                      <CardTitle className="mt-4">Vaccination Tracker</CardTitle>
                      <CardDescription>
                        WHO/Rwanda immunization schedule tracking. BCG, OPV, Pentavalent, PCV, Measles-Rubella, Yellow Fever & more.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200">
                        ✅ Active
                      </Badge>
                    </CardContent>
                  </Card>

                  {/* Smart Health Alerts Card */}
                  <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-white">
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
                        <Activity className="h-6 w-6" />
                      </div>
                      <CardTitle className="mt-4">Smart Health Alerts</CardTitle>
                      <CardDescription>
                        Proactive alerts for medication refills, overdue vaccinations, abnormal labs, and chronic conditions.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-200">
                        ✅ Active
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                {/* Summary Card */}
                <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-full">
                        <Brain className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Sanovia AI-Powered Healthcare</h3>
                        <p className="text-green-100">
                          6 game-changing features active • Transforming healthcare in Africa
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              </TabsContent>
            </div>
          </Tabs>
        )}

        {/* Facility Staff Dashboard */}
        {role !== 'admin' && isFacilityStaff && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">My Facilities</h2>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userFacilities.map((staffRecord: any) => {
                const facility = staffRecord.facilities;
                return (
                  <Card 
                    key={staffRecord.facility_id} 
                    className="border-border/50 cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg"
                    onClick={() => navigate(`/facility/${staffRecord.facility_id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
                      <Button className="w-full">Open Dashboard</Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Also show patient features if they have records */}
            {role === 'patient' && (
              <>
                <div className="border-t pt-8 mt-8">
                  <h2 className="text-xl font-semibold mb-4">My Health Records</h2>
                  <StatsCards />
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="border-border/50 transition-all hover:border-primary/50 hover:shadow-lg">
                    <CardHeader>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                        <FileText className="h-6 w-6" />
                      </div>
                      <CardTitle className="mt-4">My Medical Records</CardTitle>
                      <CardDescription>
                        View and manage all your health information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => navigate('/records')} className="w-full">
                        View Records
                      </Button>
                    </CardContent>
                  </Card>
                  <QRCodeGenerator />
                </div>
              </>
            )}
          </div>
        )}

        {/* Patient Dashboard (not facility staff) */}
        {role === 'patient' && !isFacilityStaff && (
          <>
            <div className="mb-8">
              <StatsCards />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/50 transition-all hover:border-primary/50 hover:shadow-lg">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <FileText className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-4">My Medical Records</CardTitle>
                  <CardDescription>
                    View and manage all your health information in one place
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate('/records')} className="w-full">
                    View Records
                  </Button>
                </CardContent>
              </Card>

              <QRCodeGenerator />
              
              <AccessLogViewer />

              <Card className="border-border/50 transition-all hover:border-primary/50 hover:shadow-lg">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                    <Activity className="h-6 w-6" />
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
          </>
        )}
      </main>
    </div>
  );
}
