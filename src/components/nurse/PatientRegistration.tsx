import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Search, 
  User, 
  Calendar, 
  Phone, 
  IdCard, 
  CheckCircle, 
  AlertCircle,
  UserPlus,
  AlertTriangle
} from 'lucide-react';
import { useSearchPatientByNationalId, useRegisterPatientToFacility, useFacilityPatients, useFacility } from '@/hooks/useFacilities';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Profile } from '@/types/medical';
import { logAuditEvent } from '@/lib/audit';

interface Props {
  facilityId: string;
}

export default function PatientRegistration({ facilityId }: Props) {
  const [nationalId, setNationalId] = useState('');
  const [searchResult, setSearchResult] = useState<Profile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  
  const searchPatient = useSearchPatientByNationalId();
  const registerPatient = useRegisterPatientToFacility();
  const { data: facilityPatients } = useFacilityPatients(facilityId);
  const { data: facility } = useFacility(facilityId);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nationalId.trim()) {
      toast.error('Please enter a National ID');
      return;
    }

    setNotFound(false);
    setSearchResult(null);
    setDuplicateWarning(null);

    try {
      const result = await searchPatient.mutateAsync(nationalId.trim());
      setSearchResult(result);
      
      // Check if patient is already registered at this facility
      const isAlreadyRegistered = facilityPatients?.some(
        (p) => p.patient_id === result.user_id
      );
      
      if (isAlreadyRegistered) {
        setDuplicateWarning('This patient is already registered at this facility.');
      }
      
      // Check for potential name duplicates with different IDs
      const nameMatch = facilityPatients?.find(
        (p) => {
          const profile = p.profiles as any;
          return profile?.full_name?.toLowerCase() === result.full_name?.toLowerCase() && 
                 p.patient_id !== result.user_id;
        }
      );
      
      if (nameMatch && !isAlreadyRegistered) {
        setDuplicateWarning(`Note: A patient with a similar name "${result.full_name}" already exists. This is allowed since National IDs are different.`);
      }
      
      setShowDialog(true);
    } catch (error) {
      setNotFound(true);
      toast.error('Patient not found with this National ID');
    }
  };

  const handleRegister = async () => {
    if (!searchResult) return;

    // Check if already registered
    const isAlreadyRegistered = facilityPatients?.some(
      (p) => p.patient_id === searchResult.user_id
    );

    if (isAlreadyRegistered) {
      toast.info('Patient is already registered at this facility');
      setShowDialog(false);
      return;
    }

    try {
      await registerPatient.mutateAsync({
        facilityId,
        patientId: searchResult.user_id,
      });
      
      void logAuditEvent({
        action: 'patient.register',
        resourceType: 'facility_patient',
        targetPatientId: searchResult.user_id,
        facilityId,
        metadata: { national_id_last4: nationalId.trim().slice(-4) },
      });

      toast.success(`Successfully registered ${searchResult.full_name} to ${facility?.name}`);
      setShowDialog(false);
      setSearchResult(null);
      setNationalId('');
      setDuplicateWarning(null);
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        toast.info('Patient is already registered at this facility');
        setShowDialog(false);
      } else {
        toast.error('Failed to register patient');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Patient Registration
        </CardTitle>
        <CardDescription>
          Search for patients by National ID and register them to {facility?.name || 'this facility'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="national_id">National ID</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="national_id"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="Enter patient's National ID..."
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={searchPatient.isPending}>
                {searchPatient.isPending ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          {notFound && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Patient Not Found</AlertTitle>
              <AlertDescription>
                No patient found with National ID: <strong>{nationalId}</strong>. 
                The patient must first create an account in the Sanovia system.
              </AlertDescription>
            </Alert>
          )}
        </form>

        {/* Quick lookup info */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <IdCard className="h-4 w-4" />
            Registration Guidelines
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Search patients using their National ID (Government ID)</li>
            <li>• Patients must have a Sanovia account with their National ID registered</li>
            <li>• Duplicate registrations with the same National ID are prevented</li>
            <li>• Patients with the same name but different National IDs can be registered</li>
          </ul>
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Patient Found
              </DialogTitle>
              <DialogDescription>Review patient information before registration</DialogDescription>
            </DialogHeader>

            {searchResult && (
              <div className="space-y-4">
                {duplicateWarning && (
                  <Alert variant={duplicateWarning.includes('already registered') ? 'destructive' : 'default'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{duplicateWarning}</AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{searchResult.full_name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <IdCard className="h-3 w-3" />
                      <span>{searchResult.national_id}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {searchResult.date_of_birth && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>DOB: {format(new Date(searchResult.date_of_birth), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {searchResult.gender && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Gender: <span className="capitalize">{searchResult.gender}</span></span>
                    </div>
                  )}
                  {searchResult.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{searchResult.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleRegister} 
                    className="flex-1" 
                    disabled={registerPatient.isPending || duplicateWarning?.includes('already registered')}
                  >
                    {registerPatient.isPending ? 'Registering...' : 'Register Patient'}
                  </Button>
                  <Button 
                    onClick={() => setShowDialog(false)} 
                    variant="outline" 
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
