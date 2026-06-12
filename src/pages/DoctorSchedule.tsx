import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Sidebar from '@/components/layout/Sidebar';
import TopHeader from '@/components/layout/TopHeader';
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  Edit,
  Save,
  AlertCircle,
  CheckCircle2,
  Settings,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

interface Schedule {
  id: string;
  doctor_id: string;
  facility_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  max_patients_per_slot: number;
  is_active: boolean;
  notes: string | null;
}

interface ScheduleForm {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  max_patients_per_slot: number;
  is_active: boolean;
  notes: string;
}

const defaultForm: ScheduleForm = {
  day_of_week: 1,
  start_time: '09:00',
  end_time: '17:00',
  slot_duration_minutes: 30,
  max_patients_per_slot: 1,
  is_active: true,
  notes: '',
};

export default function DoctorSchedule() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [form, setForm] = useState<ScheduleForm>(defaultForm);

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

  // Redirect if not a doctor
  useEffect(() => {
    if (staffInfo && !isDoctor) {
      toast({ title: 'Access Denied', description: 'Only doctors can manage schedules', variant: 'destructive' });
      navigate('/');
    }
  }, [staffInfo, isDoctor, navigate]);

  // Fetch doctor's schedules
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['doctor-schedules', user?.id, facilityId],
    queryFn: async () => {
      if (!user?.id || !facilityId) return [];
      const { data, error } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', user.id)
        .eq('facility_id', facilityId)
        .order('day_of_week', { ascending: true });
      if (error) throw error;
      return data as Schedule[];
    },
    enabled: !!user?.id && !!facilityId,
  });

  // Create schedule
  const createMutation = useMutation({
    mutationFn: async (data: ScheduleForm) => {
      if (!user?.id || !facilityId) throw new Error('Missing user or facility');

      // Check if schedule already exists for this day
      const existingSchedule = schedules?.find(s => s.day_of_week === data.day_of_week);
      if (existingSchedule) {
        throw new Error(`A schedule for ${DAYS_OF_WEEK[data.day_of_week].label} already exists`);
      }

      const { error } = await supabase.from('doctor_schedules').insert({
        doctor_id: user.id,
        facility_id: facilityId,
        day_of_week: data.day_of_week,
        start_time: data.start_time + ':00',
        end_time: data.end_time + ':00',
        slot_duration_minutes: data.slot_duration_minutes,
        max_patients_per_slot: data.max_patients_per_slot,
        is_active: data.is_active,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Schedule created successfully' });
      queryClient.invalidateQueries({ queryKey: ['doctor-schedules'] });
      setIsAddDialogOpen(false);
      setForm(defaultForm);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update schedule
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ScheduleForm> }) => {
      const updateData: Record<string, unknown> = {};
      if (data.start_time) updateData.start_time = data.start_time + ':00';
      if (data.end_time) updateData.end_time = data.end_time + ':00';
      if (data.slot_duration_minutes !== undefined) updateData.slot_duration_minutes = data.slot_duration_minutes;
      if (data.max_patients_per_slot !== undefined) updateData.max_patients_per_slot = data.max_patients_per_slot;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      if (data.notes !== undefined) updateData.notes = data.notes || null;

      const { error } = await supabase.from('doctor_schedules').update(updateData as never).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Schedule updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['doctor-schedules'] });
      setEditingSchedule(null);
      setForm(defaultForm);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete schedule
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('doctor_schedules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Schedule deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['doctor-schedules'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from('doctor_schedules').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-schedules'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSchedule) {
      updateMutation.mutate({ id: editingSchedule.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setForm({
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time.slice(0, 5),
      end_time: schedule.end_time.slice(0, 5),
      slot_duration_minutes: schedule.slot_duration_minutes,
      max_patients_per_slot: schedule.max_patients_per_slot,
      is_active: schedule.is_active,
      notes: schedule.notes || '',
    });
    setIsAddDialogOpen(true);
  };

  const calculateSlots = (startTime: string, endTime: string, duration: number) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return Math.floor((endMinutes - startMinutes) / duration);
  };

  const activeSchedules = schedules?.filter(s => s.is_active) || [];
  const inactiveSchedules = schedules?.filter(s => !s.is_active) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar activeTab="schedule" onTabChange={() => {}} />
      <TopHeader />

      <main className="pt-20 pb-8 px-6 ml-72">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                My Schedule
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your weekly availability for appointments at {(staffInfo?.facilities as { name?: string })?.name}
              </p>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              if (!open) {
                setEditingSchedule(null);
                setForm(defaultForm);
              }
              setIsAddDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}</DialogTitle>
                  <DialogDescription>
                    {editingSchedule ? 'Update your availability for this day' : 'Set your availability for a day of the week'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  {!editingSchedule && (
                    <div className="space-y-2">
                      <Label>Day of Week</Label>
                      <Select
                        value={form.day_of_week.toString()}
                        onValueChange={(v) => setForm({ ...form, day_of_week: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day) => (
                            <SelectItem
                              key={day.value}
                              value={day.value.toString()}
                              disabled={schedules?.some(s => s.day_of_week === day.value)}
                            >
                              {day.label}
                              {schedules?.some(s => s.day_of_week === day.value) && ' (Already set)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={form.start_time}
                        onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={form.end_time}
                        onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Slot Duration (minutes)</Label>
                      <Select
                        value={form.slot_duration_minutes.toString()}
                        onValueChange={(v) => setForm({ ...form, slot_duration_minutes: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="20">20 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Max Patients per Slot</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={form.max_patients_per_slot}
                        onChange={(e) => setForm({ ...form, max_patients_per_slot: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>

                  {form.start_time && form.end_time && (
                    <div className="p-3 rounded-lg bg-muted/50 text-sm">
                      <span className="font-medium">Available slots: </span>
                      {calculateSlots(form.start_time, form.end_time, form.slot_duration_minutes)} slots per day
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Any special notes about this schedule..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.is_active}
                      onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                    />
                    <Label>Active</Label>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingSchedule ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeSchedules.length}</p>
                    <p className="text-sm text-muted-foreground">Active Days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {activeSchedules.reduce((sum, s) => sum + calculateSlots(s.start_time.slice(0, 5), s.end_time.slice(0, 5), s.slot_duration_minutes), 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Weekly Slots</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/10">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{inactiveSchedules.length}</p>
                    <p className="text-sm text-muted-foreground">Inactive Days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Schedules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Weekly Schedule
              </CardTitle>
              <CardDescription>
                Your availability schedule for patient appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading schedules...</div>
              ) : !schedules?.length ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No schedules set</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your availability to allow patients to book appointments
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Schedule
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const schedule = schedules.find(s => s.day_of_week === day.value);
                    
                    return (
                      <Card key={day.value} className={!schedule ? 'opacity-50' : schedule.is_active ? '' : 'opacity-70'}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{day.label}</h4>
                              {schedule && (
                                <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                                  {schedule.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              )}
                            </div>
                            {schedule && (
                              <div className="flex items-center gap-1">
                                <Switch
                                  checked={schedule.is_active}
                                  onCheckedChange={(isActive) => toggleActiveMutation.mutate({ id: schedule.id, isActive })}
                                />
                              </div>
                            )}
                          </div>

                          {schedule ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {schedule.slot_duration_minutes} min slots • {calculateSlots(schedule.start_time.slice(0, 5), schedule.end_time.slice(0, 5), schedule.slot_duration_minutes)} available
                              </div>
                              {schedule.notes && (
                                <p className="text-sm text-muted-foreground italic">{schedule.notes}</p>
                              )}
                              <div className="flex gap-2 mt-3">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(schedule)}>
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                  onClick={() => deleteMutation.mutate(schedule.id)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-sm text-muted-foreground mb-2">Not available</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setForm({ ...defaultForm, day_of_week: day.value });
                                  setIsAddDialogOpen(true);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
