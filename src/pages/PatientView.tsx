import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import MedicalConditionsList from '@/components/medical/MedicalConditionsList';
import MedicationsList from '@/components/medical/MedicationsList';
import AllergiesList from '@/components/medical/AllergiesList';
import LabResultsList from '@/components/medical/LabResultsList';
import VisitHistoryList from '@/components/medical/VisitHistoryList';
import EmergencyContactsList from '@/components/medical/EmergencyContactsList';
import VaccinationTracker from '@/components/vaccination/VaccinationTracker';
import { useVaccinations, useAddVaccination } from '@/hooks/useVaccinations';
import { toast } from 'sonner';
import { Stethoscope, Pill, AlertTriangle, FlaskConical, Calendar, Phone, ArrowLeft, User, IdCard, Building2, Info, Syringe } from 'lucide-react';

export default function PatientView() {
  const { patientId } = useParams();
  const [searchParams] = useSearchParams();
  const facilityId = searchParams.get('facilityId');
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  const { data: vaccinations } = useVaccinations(patientId);
  const addVaccination = useAddVaccination(patientId);

  // Fetch patient profile
  const { data: patientProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['patient_profile', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', patientId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  // Get user's facility role if viewing from a facility context
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
      if (error) return null;
      return data?.role;
    },
    enabled: !!facilityId && !!user,
  });

  // Fetch facility info if viewing from facility context
  const { data: facility } = useQuery({
    queryKey: ['facility', facilityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facilities')
        .select('name, facility_type')
        .eq('id', facilityId!)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!facilityId,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Check if user has access (healthcare provider or admin)
  const hasAccess = role === 'doctor' || role === 'nurse' || role === 'admin';
  
  // Determine if user can edit records
  // Doctors and facility admins can edit, nurses can only view
  const canEdit = role === 'doctor' || role === 'admin' || 
                  userFacilityRole === 'doctor' || userFacilityRole === 'facility_admin';
  const readOnly = !canEdit;

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || !hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You don't have permission to view this patient's records.</p>
          <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => facilityId ? navigate(`/facility/${facilityId}`) : navigate('/')} 
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {facilityId ? 'Back to Facility' : 'Back to Dashboard'}
        </Button>

        {/* Facility context indicator */}
        {facility && (
          <Alert className="mb-4">
            <Building2 className="h-4 w-4" />
            <AlertDescription>
              Viewing patient from <strong>{facility.name}</strong>
              {readOnly && (
                <span className="ml-2 text-muted-foreground">
                  (View only - Doctors can edit records)
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {patientProfile?.full_name || 'Patient Records'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground mt-1">
              <Badge variant="outline" className="font-mono">
                <IdCard className="h-3 w-3 mr-1" />
                {patientProfile?.national_id || 'No ID'}
              </Badge>
              <Badge variant="outline">
                ID: {patientId?.substring(0, 8).toUpperCase()}
              </Badge>
              {patientProfile?.date_of_birth && (
                <span className="text-sm">DOB: {patientProfile.date_of_birth}</span>
              )}
              {patientProfile?.gender && (
                <span className="text-sm capitalize">• {patientProfile.gender}</span>
              )}
              {patientProfile?.phone && (
                <span className="text-sm flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {patientProfile.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Access level indicator */}
        {readOnly && (
          <Alert className="mb-4 border-info bg-info/10">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>View-only access:</strong> You can view patient records but cannot make changes. 
              Only doctors can add or modify medical records.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="conditions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="conditions" className="gap-2">
              <Stethoscope className="h-4 w-4" />
              <span className="hidden sm:inline">Conditions</span>
            </TabsTrigger>
            <TabsTrigger value="medications" className="gap-2">
              <Pill className="h-4 w-4" />
              <span className="hidden sm:inline">Medications</span>
            </TabsTrigger>
            <TabsTrigger value="allergies" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Allergies</span>
            </TabsTrigger>
            <TabsTrigger value="labs" className="gap-2">
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">Lab Results</span>
            </TabsTrigger>
            <TabsTrigger value="visits" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Visits</span>
            </TabsTrigger>
            <TabsTrigger value="vaccinations" className="gap-2">
              <Syringe className="h-4 w-4" />
              <span className="hidden sm:inline">Vaccines</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-2">
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">Emergency</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conditions">
            <MedicalConditionsList patientId={patientId} readOnly={readOnly} />
          </TabsContent>
          <TabsContent value="medications">
            <MedicationsList patientId={patientId} readOnly={readOnly} />
          </TabsContent>
          <TabsContent value="allergies">
            <AllergiesList patientId={patientId} readOnly={readOnly} />
          </TabsContent>
          <TabsContent value="labs">
            <LabResultsList patientId={patientId} readOnly={readOnly} />
          </TabsContent>
          <TabsContent value="visits">
            <VisitHistoryList patientId={patientId} readOnly={readOnly} />
          </TabsContent>
          <TabsContent value="vaccinations">
            <VaccinationTracker
              patientId={patientId}
              readOnly={readOnly}
              vaccinations={vaccinations || []}
              onAddVaccination={(v) =>
                addVaccination.mutate(v, {
                  onSuccess: () => toast.success('Vaccination recorded'),
                  onError: () => toast.error('Failed to record vaccination'),
                })
              }
            />
          </TabsContent>
          <TabsContent value="contacts">
            <EmergencyContactsList patientId={patientId} readOnly={readOnly} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
