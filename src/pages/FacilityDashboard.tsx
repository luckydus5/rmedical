import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFacility, useFacilityStaff, useFacilityPatients } from '@/hooks/useFacilities';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import PatientSearch from '@/components/facility/PatientSearch';
import FacilityPatientList from '@/components/facility/FacilityPatientList';
import FacilityStaffList from '@/components/facility/FacilityStaffList';
import PatientRecordsTable from '@/components/doctor/PatientRecordsTable';
import AddPatientRecord from '@/components/doctor/AddPatientRecord';
import PatientRegistration from '@/components/nurse/PatientRegistration';
import { 
  Building2, 
  Users, 
  UserCog, 
  Search, 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail,
  Activity,
  FileText,
  Plus,
  UserPlus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { FacilityRole } from '@/types/medical';

export default function FacilityDashboard() {
  const { facilityId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const { data: facility, isLoading: facilityLoading } = useFacility(facilityId);
  const { data: patients } = useFacilityPatients(facilityId);
  const { data: staff } = useFacilityStaff(facilityId);

  // Get user's role at this facility
  const { data: userFacilityRole } = useQuery({
    queryKey: ['user_facility_role', facilityId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facility_staff')
        .select('role')
        .eq('facility_id', facilityId!)
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .single();
      if (error) throw error;
      return data?.role as FacilityRole;
    },
    enabled: !!facilityId && !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || facilityLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || !facility) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Facility Not Found</h2>
          <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'facility_admin': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'doctor': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'nurse': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'receptionist': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const isDoctor = userFacilityRole === 'doctor' || userFacilityRole === 'facility_admin';
  const isNurse = userFacilityRole === 'nurse';
  const canAddRecords = isDoctor;
  const canManageStaff = userFacilityRole === 'facility_admin' || userFacilityRole === 'doctor';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Facility Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{facility.name}</h1>
                <Badge variant="outline" className="capitalize">
                  {facility.facility_type.replace('_', ' ')}
                </Badge>
                {userFacilityRole && (
                  <Badge variant="outline" className={getRoleColor(userFacilityRole)}>
                    {userFacilityRole.replace('_', ' ')}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {facility.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {facility.city}, {facility.country}
                  </span>
                )}
                {facility.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {facility.phone}
                  </span>
                )}
                {facility.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {facility.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patients?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Registered Patients</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <UserCog className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{staff?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Staff Members</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Today's Visits</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Role-based Tabs */}
        <Tabs defaultValue={isDoctor ? "records" : isNurse ? "register" : "patients"} className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            {/* Doctor-specific tabs */}
            {isDoctor && (
              <>
                <TabsTrigger value="records" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Patient Records
                </TabsTrigger>
                <TabsTrigger value="add-record" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Record
                </TabsTrigger>
              </>
            )}
            
            {/* Nurse-specific tabs */}
            {isNurse && (
              <TabsTrigger value="register" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Register Patient
              </TabsTrigger>
            )}
            
            {/* Common tabs */}
            <TabsTrigger value="patients" className="gap-2">
              <Users className="h-4 w-4" />
              Patients
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </TabsTrigger>
            
            {/* Admin/Doctor staff management */}
            {canManageStaff && (
              <TabsTrigger value="staff" className="gap-2">
                <UserCog className="h-4 w-4" />
                Staff
              </TabsTrigger>
            )}
          </TabsList>

          {/* Doctor tabs content */}
          {isDoctor && (
            <>
              <TabsContent value="records">
                <PatientRecordsTable facilityId={facilityId!} />
              </TabsContent>
              <TabsContent value="add-record">
                <AddPatientRecord facilityId={facilityId!} />
              </TabsContent>
            </>
          )}

          {/* Nurse tabs content */}
          {isNurse && (
            <TabsContent value="register">
              <PatientRegistration facilityId={facilityId!} />
            </TabsContent>
          )}

          {/* Common tabs content */}
          <TabsContent value="patients">
            <FacilityPatientList facilityId={facilityId!} />
          </TabsContent>

          <TabsContent value="search">
            <PatientSearch facilityId={facilityId!} />
          </TabsContent>

          {canManageStaff && (
            <TabsContent value="staff">
              <FacilityStaffList facilityId={facilityId!} currentUserRole={userFacilityRole} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
