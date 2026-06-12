import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  Eye, 
  Calendar, 
  Phone,
  Building2,
  FileText,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  IdCard
} from 'lucide-react';
import { useFacilityPatients, useFacility } from '@/hooks/useFacilities';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface Props {
  facilityId: string;
}

export default function PatientRecordsTable({ facilityId }: Props) {
  const { data: patients, isLoading } = useFacilityPatients(facilityId);
  const { data: facility } = useFacility(facilityId);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch visit history for all patients
  const { data: visitStats } = useQuery({
    queryKey: ['facility_visit_stats', facilityId],
    queryFn: async () => {
      const patientIds = patients?.map(p => p.patient_id) || [];
      if (patientIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from('visit_history')
        .select('patient_id, id, visit_date, visit_type, facility_name')
        .in('patient_id', patientIds)
        .order('visit_date', { ascending: false });
      
      if (error) throw error;
      
      // Group by patient
      const stats: Record<string, { totalVisits: number; recentVisits: any[] }> = {};
      data.forEach(visit => {
        if (!stats[visit.patient_id]) {
          stats[visit.patient_id] = { totalVisits: 0, recentVisits: [] };
        }
        stats[visit.patient_id].totalVisits++;
        if (stats[visit.patient_id].recentVisits.length < 3) {
          stats[visit.patient_id].recentVisits.push(visit);
        }
      });
      return stats;
    },
    enabled: !!patients && patients.length > 0,
  });

  // Fetch condition counts
  const { data: conditionStats } = useQuery({
    queryKey: ['facility_condition_stats', facilityId],
    queryFn: async () => {
      const patientIds = patients?.map(p => p.patient_id) || [];
      if (patientIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from('medical_conditions')
        .select('patient_id, status')
        .in('patient_id', patientIds);
      
      if (error) throw error;
      
      const stats: Record<string, { active: number; total: number }> = {};
      data.forEach(condition => {
        if (!stats[condition.patient_id]) {
          stats[condition.patient_id] = { active: 0, total: 0 };
        }
        stats[condition.patient_id].total++;
        if (condition.status === 'active') {
          stats[condition.patient_id].active++;
        }
      });
      return stats;
    },
    enabled: !!patients && patients.length > 0,
  });

  const filteredPatients = patients?.filter(p => 
    (p.profiles as any)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.profiles as any)?.national_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patient_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="animate-pulse">Loading patient records...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Comprehensive Patient Records
        </CardTitle>
        <CardDescription>
          View all patient records from {facility?.name || 'this facility'} with their complete medical history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, National ID, or Patient Number..."
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
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Unique Patient ID</TableHead>
                  <TableHead>National ID</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Total Visits</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => {
                  const profile = patient.profiles as any;
                  const patientVisits = visitStats?.[patient.patient_id];
                  const patientConditions = conditionStats?.[patient.patient_id];
                  const isExpanded = expandedPatient === patient.id;

                  return (
                    <Collapsible key={patient.id} open={isExpanded} onOpenChange={() => setExpandedPatient(isExpanded ? null : patient.id)}>
                      <TableRow className="hover:bg-muted/30">
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{profile?.full_name || 'Unknown'}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="capitalize">{profile?.gender || '-'}</span>
                              {profile?.date_of_birth && (
                                <>
                                  <span>•</span>
                                  <span>{format(new Date(profile.date_of_birth), 'MMM d, yyyy')}</span>
                                </>
                              )}
                            </div>
                            {profile?.phone && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Phone className="h-3 w-3" />
                                {profile.phone}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {patient.patient_id.substring(0, 8).toUpperCase()}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-mono text-sm">
                            <IdCard className="h-3 w-3 text-muted-foreground" />
                            {profile?.national_id || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {patientConditions ? (
                            <div className="flex items-center gap-2">
                              <Badge variant={patientConditions.active > 0 ? "destructive" : "secondary"}>
                                {patientConditions.active} active
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                / {patientConditions.total} total
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {patientVisits?.totalVisits || 0} visits
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(patient.registered_at), { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm"
                            onClick={() => navigate(`/patient/${patient.patient_id}?facilityId=${facilityId}`)}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            View & Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                          <TableCell colSpan={8}>
                            <div className="py-4 px-2">
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Recent Visit History
                              </h4>
                              {patientVisits?.recentVisits?.length ? (
                                <div className="space-y-2">
                                  {patientVisits.recentVisits.map((visit: any) => (
                                    <div key={visit.id} className="flex items-center gap-4 text-sm p-2 rounded bg-background border">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <span>{format(new Date(visit.visit_date), 'MMM d, yyyy')}</span>
                                      <Badge variant="outline">{visit.visit_type}</Badge>
                                      <span className="text-muted-foreground flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        {visit.facility_name}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">No visit history recorded</p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </Collapsible>
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
