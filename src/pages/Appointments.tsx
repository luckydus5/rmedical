import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Sidebar from '@/components/layout/Sidebar';
import TopHeader from '@/components/layout/TopHeader';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  PlayCircle,
  AlertCircle,
  User,
  Building2,
  Phone,
  CalendarDays,
  MoreHorizontal,
  Eye,
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isPast, isFuture } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type AppointmentStatus = Database['public']['Enums']['appointment_status'];
type AppointmentType = Database['public']['Enums']['appointment_type'];

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  facility_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  appointment_type: AppointmentType;
  chief_complaint: string | null;
  notes: string | null;
  created_at: string;
  patient_profile?: {
    full_name: string;
    phone: string | null;
    national_id: string | null;
  };
  doctor_profile?: {
    full_name: string;
  };
  facility?: {
    name: string;
  };
}

export default function Appointments() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateNotes, setUpdateNotes] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');

  // Get user's facility info
  const { data: staffInfo } = useQuery({
    queryKey: ['staff-info', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('facility_staff')
        .select('*, facilities(name, id)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  const facilityId = staffInfo?.facility_id;
  const facilityRole = staffInfo?.role;
  const isDoctor = facilityRole === 'doctor' || role === 'doctor';

  // Fetch appointments
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', facilityId, user?.id, statusFilter, dateFilter],
    queryFn: async () => {
      let query = supabase.from('appointments').select('*');

      // If doctor, show only their appointments
      if (isDoctor && user?.id) {
        query = query.eq('doctor_id', user.id);
      } else if (facilityId) {
        // Otherwise show facility appointments
        query = query.eq('facility_id', facilityId);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as AppointmentStatus);
      }

      if (dateFilter) {
        query = query.eq('appointment_date', dateFilter);
      }

      const { data, error } = await query.order('appointment_date', { ascending: true }).order('start_time', { ascending: true });
      if (error) throw error;

      // Fetch related profiles
      const appointmentsWithProfiles = await Promise.all(
        (data || []).map(async (apt) => {
          const [patientRes, doctorRes, facilityRes] = await Promise.all([
            supabase.from('profiles').select('full_name, phone, national_id').eq('user_id', apt.patient_id).single(),
            supabase.from('profiles').select('full_name').eq('user_id', apt.doctor_id).single(),
            supabase.from('facilities').select('name').eq('id', apt.facility_id).single(),
          ]);

          return {
            ...apt,
            patient_profile: patientRes.data || undefined,
            doctor_profile: doctorRes.data || undefined,
            facility: facilityRes.data || undefined,
          } as Appointment;
        })
      );

      return appointmentsWithProfiles;
    },
    enabled: !!user?.id,
  });

  // Update appointment status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ appointmentId, status, notes, cancellationReason }: { appointmentId: string; status: AppointmentStatus; notes?: string; cancellationReason?: string }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (notes) updateData.notes = notes;
      if (status === 'confirmed') updateData.confirmed_at = new Date().toISOString();
      if (status === 'completed') updateData.completed_at = new Date().toISOString();
      if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancelled_by = user?.id;
        if (cancellationReason) updateData.cancellation_reason = cancellationReason;
      }
      if (status === 'in_progress') updateData.status = 'in_progress';

      const { error } = await supabase.from('appointments').update(updateData as never).eq('id', appointmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Appointment updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setIsUpdateDialogOpen(false);
      setSelectedAppointment(null);
      setUpdateNotes('');
      setCancellationReason('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-500 border-blue-500/20"><Clock className="h-3 w-3" />Scheduled</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="h-3 w-3" />Confirmed</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-500 border-amber-500/20"><PlayCircle className="h-3 w-3" />In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="h-3 w-3" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="gap-1 bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="h-3 w-3" />Cancelled</Badge>;
      case 'no_show':
        return <Badge variant="outline" className="gap-1 bg-gray-500/10 text-gray-500 border-gray-500/20"><AlertCircle className="h-3 w-3" />No Show</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: AppointmentType) => {
    const typeLabels: Record<AppointmentType, string> = {
      consultation: 'Consultation',
      follow_up: 'Follow-up',
      emergency: 'Emergency',
      routine_checkup: 'Checkup',
      lab_test: 'Lab Test',
      vaccination: 'Vaccination',
      other: 'Other',
    };
    return <Badge variant="secondary">{typeLabels[type]}</Badge>;
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return <span className="text-emerald-500 font-medium">Today</span>;
    if (isTomorrow(date)) return <span className="text-blue-500">Tomorrow</span>;
    if (isPast(date)) return <span className="text-muted-foreground">{format(date, 'MMM d, yyyy')}</span>;
    return format(date, 'MMM d, yyyy');
  };

  const filteredAppointments = appointments?.filter((apt) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      apt.patient_profile?.full_name?.toLowerCase().includes(searchLower) ||
      apt.patient_profile?.national_id?.toLowerCase().includes(searchLower) ||
      apt.chief_complaint?.toLowerCase().includes(searchLower)
    );
  });

  // Stats
  const todayAppointments = appointments?.filter(a => isToday(parseISO(a.appointment_date))) || [];
  const scheduledCount = appointments?.filter(a => a.status === 'scheduled').length || 0;
  const confirmedCount = appointments?.filter(a => a.status === 'confirmed').length || 0;
  const completedToday = todayAppointments.filter(a => a.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar activeTab="appointments" onTabChange={() => {}} />
      <TopHeader />

      <main className="pt-20 pb-8 px-6 ml-72">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                Appointments
              </h1>
              <p className="text-muted-foreground mt-1">
                {isDoctor ? 'Manage your patient appointments' : 'View and manage facility appointments'}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <CalendarDays className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{todayAppointments.length}</p>
                    <p className="text-sm text-muted-foreground">Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/10">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{scheduledCount}</p>
                    <p className="text-sm text-muted-foreground">Scheduled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{confirmedCount}</p>
                    <p className="text-sm text-muted-foreground">Confirmed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{completedToday}</p>
                    <p className="text-sm text-muted-foreground">Completed Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by patient name, ID, or complaint..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-[180px]"
                />
                {dateFilter && (
                  <Button variant="ghost" size="sm" onClick={() => setDateFilter('')}>
                    Clear Date
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Appointments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Appointment List</CardTitle>
              <CardDescription>
                {filteredAppointments?.length || 0} appointments found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading appointments...</div>
              ) : !filteredAppointments?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No appointments found. Appointments can be scheduled from the Staff Portal.
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Patient</TableHead>
                        {!isDoctor && <TableHead>Doctor</TableHead>}
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Complaint</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAppointments.map((apt) => (
                        <TableRow key={apt.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{getDateLabel(apt.appointment_date)}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {apt.start_time?.slice(0, 5)} - {apt.end_time?.slice(0, 5)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {apt.patient_profile?.full_name || 'Unknown'}
                              </div>
                              {apt.patient_profile?.phone && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {apt.patient_profile.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          {!isDoctor && (
                            <TableCell>
                              <span className="text-sm">{apt.doctor_profile?.full_name || 'Unknown'}</span>
                            </TableCell>
                          )}
                          <TableCell>{getTypeBadge(apt.appointment_type)}</TableCell>
                          <TableCell>{getStatusBadge(apt.status)}</TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
                              {apt.chief_complaint || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/patient/${apt.patient_id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                                <Dialog open={isUpdateDialogOpen && selectedAppointment?.id === apt.id} onOpenChange={(open) => {
                                  if (!open) {
                                    setSelectedAppointment(null);
                                    setUpdateNotes('');
                                    setCancellationReason('');
                                  }
                                  setIsUpdateDialogOpen(open);
                                }}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => setSelectedAppointment(apt)}>
                                      Update
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Update Appointment</DialogTitle>
                                      <DialogDescription>
                                        Patient: {apt.patient_profile?.full_name} | {format(parseISO(apt.appointment_date), 'MMM d, yyyy')} at {apt.start_time?.slice(0, 5)}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <div className="flex flex-wrap gap-2">
                                        {apt.status === 'scheduled' && (
                                          <Button
                                            variant="outline"
                                            className="gap-2 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                                            onClick={() => updateStatusMutation.mutate({ appointmentId: apt.id, status: 'confirmed' })}
                                          >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Confirm
                                          </Button>
                                        )}
                                        {(apt.status === 'scheduled' || apt.status === 'confirmed') && (
                                          <Button
                                            variant="outline"
                                            className="gap-2 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                                            onClick={() => updateStatusMutation.mutate({ appointmentId: apt.id, status: 'in_progress' })}
                                          >
                                            <PlayCircle className="h-4 w-4" />
                                            Start
                                          </Button>
                                        )}
                                        {apt.status === 'in_progress' && (
                                          <Button
                                            variant="outline"
                                            className="gap-2 border-green-500/30 text-green-600 hover:bg-green-500/10"
                                            onClick={() => updateStatusMutation.mutate({ appointmentId: apt.id, status: 'completed', notes: updateNotes })}
                                          >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Complete
                                          </Button>
                                        )}
                                        <Button
                                          variant="outline"
                                          className="gap-2 border-gray-500/30 text-gray-500 hover:bg-gray-500/10"
                                          onClick={() => updateStatusMutation.mutate({ appointmentId: apt.id, status: 'no_show' })}
                                        >
                                          <AlertCircle className="h-4 w-4" />
                                          No Show
                                        </Button>
                                      </div>

                                      <div className="space-y-2">
                                        <Label>Notes</Label>
                                        <Textarea
                                          value={updateNotes}
                                          onChange={(e) => setUpdateNotes(e.target.value)}
                                          placeholder="Add notes about the appointment..."
                                        />
                                      </div>

                                      <div className="border-t pt-4">
                                        <Label className="text-red-500">Cancel Appointment</Label>
                                        <div className="mt-2 space-y-2">
                                          <Input
                                            placeholder="Reason for cancellation..."
                                            value={cancellationReason}
                                            onChange={(e) => setCancellationReason(e.target.value)}
                                          />
                                          <Button
                                            variant="destructive"
                                            className="gap-2"
                                            disabled={!cancellationReason}
                                            onClick={() => updateStatusMutation.mutate({ appointmentId: apt.id, status: 'cancelled', cancellationReason })}
                                          >
                                            <XCircle className="h-4 w-4" />
                                            Cancel Appointment
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
