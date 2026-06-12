import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Users, Search, Eye, Calendar, Phone } from 'lucide-react';
import { useFacilityPatients } from '@/hooks/useFacilities';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Props {
  facilityId: string;
}

export default function FacilityPatientList({ facilityId }: Props) {
  const { data: patients, isLoading } = useFacilityPatients(facilityId);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredPatients = patients?.filter(p => 
    (p.profiles as any)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.profiles as any)?.national_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="animate-pulse">Loading patients...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Facility Patients
        </CardTitle>
        <CardDescription>Patients registered at this facility</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {!filteredPatients?.length ? (
          <p className="text-center text-muted-foreground py-8">
            No patients registered yet. Use Patient Search to find and register patients.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>National ID</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => {
                  const profile = patient.profiles as any;
                  return (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{profile?.full_name || 'Unknown'}</p>
                          {profile?.phone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {profile.phone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{profile?.national_id || '-'}</TableCell>
                      <TableCell className="capitalize">{profile?.gender || '-'}</TableCell>
                      <TableCell>
                        {patient.last_visit_at ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(patient.last_visit_at), { addSuffix: true })}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/patient/${patient.patient_id}`)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View Records
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
