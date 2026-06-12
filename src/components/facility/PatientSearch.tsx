import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, User, Calendar, Phone, IdCard, CheckCircle, AlertCircle } from 'lucide-react';
import { useSearchPatientByNationalId, useRegisterPatientToFacility } from '@/hooks/useFacilities';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { Profile } from '@/types/medical';

interface Props {
  facilityId: string;
}

export default function PatientSearch({ facilityId }: Props) {
  const [nationalId, setNationalId] = useState('');
  const [searchResult, setSearchResult] = useState<Profile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const searchPatient = useSearchPatientByNationalId();
  const registerPatient = useRegisterPatientToFacility();
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nationalId.trim()) {
      toast.error('Please enter a National ID');
      return;
    }

    setNotFound(false);
    setSearchResult(null);

    try {
      const result = await searchPatient.mutateAsync(nationalId.trim());
      setSearchResult(result);
      setShowDialog(true);
    } catch (error) {
      setNotFound(true);
      toast.error('Patient not found with this National ID');
    }
  };

  const handleRegisterAndView = async () => {
    if (!searchResult) return;

    try {
      // Register patient to facility
      await registerPatient.mutateAsync({
        facilityId,
        patientId: searchResult.user_id,
      });
      
      toast.success('Patient registered to facility');
      setShowDialog(false);
      
      // Navigate to patient view
      navigate(`/patient/${searchResult.user_id}`);
    } catch (error: any) {
      // If already registered, just navigate
      if (error.message?.includes('duplicate')) {
        navigate(`/patient/${searchResult.user_id}`);
      } else {
        toast.error('Failed to register patient');
      }
    }
  };

  const handleViewOnly = () => {
    if (!searchResult) return;
    setShowDialog(false);
    navigate(`/patient/${searchResult.user_id}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IdCard className="h-5 w-5" />
          Patient Search
        </CardTitle>
        <CardDescription>Search for patients by their National ID (Government ID)</CardDescription>
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
            <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>No patient found with National ID: {nationalId}</span>
            </div>
          )}
        </form>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Patient Found
              </DialogTitle>
              <DialogDescription>Review patient information</DialogDescription>
            </DialogHeader>

            {searchResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{searchResult.full_name}</h3>
                    <p className="text-sm text-muted-foreground">ID: {searchResult.national_id}</p>
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
                      <span>Gender: {searchResult.gender}</span>
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
                  <Button onClick={handleRegisterAndView} className="flex-1" disabled={registerPatient.isPending}>
                    {registerPatient.isPending ? 'Registering...' : 'Register & View Records'}
                  </Button>
                  <Button onClick={handleViewOnly} variant="outline" className="flex-1">
                    View Records Only
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
