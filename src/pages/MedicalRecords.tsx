import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Sidebar from '@/components/layout/Sidebar';
import TopHeader from '@/components/layout/TopHeader';
import MedicalConditionsList from '@/components/medical/MedicalConditionsList';
import MedicationsList from '@/components/medical/MedicationsList';
import AllergiesList from '@/components/medical/AllergiesList';
import LabResultsList from '@/components/medical/LabResultsList';
import VisitHistoryList from '@/components/medical/VisitHistoryList';
import EmergencyContactsList from '@/components/medical/EmergencyContactsList';
import DrugInteractionAlert from '@/components/ai/DrugInteractionAlert';
import VaccinationTracker from '@/components/vaccination/VaccinationTracker';
import ExportRecordsButton from '@/components/export/ExportRecordsButton';
import SmartHealthAlerts from '@/components/alerts/SmartHealthAlerts';
import EmergencyAccessCard from '@/components/emergency/EmergencyAccessCard';
import { Stethoscope, Pill, AlertTriangle, FlaskConical, Calendar, Phone, Info, Syringe, QrCode } from 'lucide-react';
import { useMedications, useAllergies, useMedicalConditions } from '@/hooks/useMedicalRecords';

export default function MedicalRecords() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('my-records');

  // Fetch patient data using proper hooks
  const { data: medications } = useMedications(user?.id);
  const { data: allergies } = useAllergies(user?.id);
  const { data: conditions } = useMedicalConditions(user?.id);

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

  const isPatient = role === 'patient';
  const readOnly = isPatient;

  // Extract medication names for components that need them
  const medicationNames = (medications || [])
    .filter((m: any) => m.is_active)
    .map((m: any) => m.medication_name);

  // Extract allergy names
  const allergyNames = (allergies || []).map((a: any) => a.allergen);
  
  // Extract condition names
  const conditionNames = (conditions || []).map((c: any) => c.condition_name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <TopHeader />
      
      <main className="pt-20 pb-8 px-6 ml-72">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header with Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Medical Records</h1>
              <p className="text-muted-foreground">View your complete health information</p>
            </div>
            <div className="flex items-center gap-3">
              <ExportRecordsButton 
                patientId={user.id} 
                patientProfile={{
                  fullName: user.email?.split('@')[0] || 'Patient',
                }}
              />
            </div>
          </div>

          {/* Smart Health Alerts */}
          <SmartHealthAlerts 
            medications={medications || []}
            allergies={allergyNames}
            conditions={conditionNames}
          />

          {/* Drug Interaction Alert */}
          {medications && medications.length > 1 && (
            <DrugInteractionAlert patientId={user.id} />
          )}

          {/* Info alert for patients */}
          {isPatient && (
            <Alert className="border-info bg-info/10">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Your medical records are managed by healthcare providers. 
                Visit a facility with your National ID to have a doctor add or update your records.
              </AlertDescription>
            </Alert>
          )}

        <Tabs defaultValue="conditions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
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
              <span className="hidden sm:inline">Vaccinations</span>
            </TabsTrigger>
            <TabsTrigger value="emergency" className="gap-2">
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">Emergency QR</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-2">
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">Contacts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conditions">
            <MedicalConditionsList readOnly={readOnly} />
          </TabsContent>
          <TabsContent value="medications">
            <MedicationsList readOnly={readOnly} />
          </TabsContent>
          <TabsContent value="allergies">
            <AllergiesList readOnly={readOnly} />
          </TabsContent>
          <TabsContent value="labs">
            <LabResultsList readOnly={readOnly} />
          </TabsContent>
          <TabsContent value="visits">
            <VisitHistoryList readOnly={readOnly} />
          </TabsContent>
          <TabsContent value="vaccinations">
            <VaccinationTracker 
              patientId={user.id} 
              readOnly={readOnly}
            />
          </TabsContent>
          <TabsContent value="emergency">
            <EmergencyAccessCard />
          </TabsContent>
          <TabsContent value="contacts">
            <EmergencyContactsList readOnly={readOnly} />
          </TabsContent>
        </Tabs>
        </div>
      </main>
    </div>
  );
}