import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Sidebar from '@/components/layout/Sidebar';
import TopHeader from '@/components/layout/TopHeader';
import {
  Search,
  UserPlus,
  Users,
  FileText,
  Phone,
  Calendar,
  Activity,
  Heart,
  AlertTriangle,
  ChevronRight,
  Eye,
  Stethoscope,
  CalendarPlus,
  Building2,
  Shield,
  Lock,
  XCircle,
  IdCard,
  Globe,
  Clock,
  TrendingUp,
  UserCheck,
  MoreHorizontal,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

// ================================
// Types
// ================================
interface PatientProfile {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  national_id: string | null;
  created_at: string;
  allergies?: Array<{ allergen: string; reaction: string; severity: string }>;
  medical_conditions?: Array<{ condition_name: string; diagnosis_date: string | null; status: string }>;
  emergency_contacts?: Array<{ contact_name: string; phone: string; relationship: string }>;
  visit_history?: Array<{ facility_name: string; visit_date: string; visit_type: string; diagnosis: string | null }>;
  facility_patients?: Array<{ facility_id: string }>;
}

interface DoctorInfo {
  user_id: string;
  full_name: string;
  specialization: string | null;
  department: string | null;
}

interface AvailableSlot {
  slot_start: string;
  slot_end: string;
  is_available: boolean;
}

// ================================
// Main Component
// ================================
export default function StaffPortal() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isVisitOpen, setIsVisitOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [registrationErrors, setRegistrationErrors] = useState<{ nationalId?: string; phone?: string }>({});
  const [visitForm, setVisitForm] = useState({
    visit_date: new Date().toISOString().slice(0, 16),
    visit_type: 'checkup',
    chief_complaint: '',
    diagnosis: '',
    treatment: '',
    notes: '',
  });

  // Get current user's facility role
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

  const facilityRole = staffInfo?.role;
  const facilityId = staffInfo?.facility_id;
  const isDoctor = facilityRole === 'doctor' || role === 'doctor';
  const isNurse = facilityRole === 'nurse' || role === 'nurse';
  const isAdmin = facilityRole === 'facility_admin' || role === 'admin';

  // ================================
  // Global Patient Search - Search across ALL facilities
  // ================================
  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ['global-patients-search', searchQuery],
    queryFn: async () => {
      let query = supabase.from('profiles').select('*');
      
      // If there's a search query, filter by it
      if (searchQuery.trim()) {
        query = query.or(`full_name.ilike.%${searchQuery}%,national_id.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
      }
      
      const { data: profilesData, error: profilesError } = await query
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (profilesError) throw profilesError;
      
      // Get related data for each profile
      const patientsWithData = await Promise.all(
        (profilesData || []).map(async (profile) => {
          // Get allergies
          const { data: allergies } = await supabase
            .from('allergies')
            .select('allergen, reaction, severity')
            .eq('patient_id', profile.user_id);
          
          // Get medical conditions
          const { data: conditions } = await supabase
            .from('medical_conditions')
            .select('condition_name, diagnosis_date, status')
            .eq('patient_id', profile.user_id);
          
          // Get emergency contacts
          const { data: contacts } = await supabase
            .from('emergency_contacts')
            .select('contact_name, phone, relationship')
            .eq('patient_id', profile.user_id);
          
          // Get visit history from ALL facilities (global records)
          const { data: visits } = await supabase
            .from('visit_history')
            .select('facility_name, visit_date, visit_type, diagnosis')
            .eq('patient_id', profile.user_id)
            .order('visit_date', { ascending: false })
            .limit(10);
          
          // Get facility enrollments to check if patient is enrolled in current facility
          const { data: facilityEnrollments } = await supabase
            .from('facility_patients')
            .select('facility_id')
            .eq('patient_id', profile.user_id);
          
          return {
            ...profile,
            allergies: allergies || [],
            medical_conditions: conditions || [],
            emergency_contacts: contacts || [],
            visit_history: visits || [],
            facility_patients: facilityEnrollments || [],
          } as PatientProfile;
        })
      );
      
      return patientsWithData;
    },
  });

  // Get doctors for appointment scheduling
  const { data: doctors } = useQuery({
    queryKey: ['facility-doctors', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const { data, error } = await supabase
        .from('facility_staff')
        .select('user_id, specialization, department')
        .eq('facility_id', facilityId)
        .eq('role', 'doctor')
        .eq('is_active', true);
      
      if (error) throw error;
      
      // Get profile names for each doctor
      const doctorsWithNames = await Promise.all(
        (data || []).map(async (d) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', d.user_id)
            .single();
          
          return {
            user_id: d.user_id,
            full_name: profile?.full_name || 'Unknown Doctor',
            specialization: d.specialization,
            department: d.department,
          };
        })
      );
      
      return doctorsWithNames as DoctorInfo[];
    },
    enabled: !!facilityId,
  });

  // Get available slots for selected doctor and date
  const { data: availableSlots } = useQuery({
    queryKey: ['available-slots', selectedDoctor, selectedDate, facilityId],
    queryFn: async () => {
      if (!selectedDoctor || !selectedDate || !facilityId) return [];
      
      // Get doctor's schedule for this day
      const dayOfWeek = new Date(selectedDate).getDay();
      const { data: schedule, error: scheduleError } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', selectedDoctor)
        .eq('facility_id', facilityId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .single();
      
      if (scheduleError || !schedule) return [];
      
      // Get existing appointments for this day
      const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('start_time')
        .eq('doctor_id', selectedDoctor)
        .eq('facility_id', facilityId)
        .eq('appointment_date', selectedDate)
        .not('status', 'in', '("cancelled","no_show")');
      
      const bookedTimes = new Set((existingAppointments || []).map(a => a.start_time));
      
      // Generate slots
      const slots: AvailableSlot[] = [];
      const startTime = parseISO(`2000-01-01T${schedule.start_time}`);
      const endTime = parseISO(`2000-01-01T${schedule.end_time}`);
      const slotDuration = schedule.slot_duration_minutes || 30;
      
      let currentTime = startTime;
      while (currentTime < endTime) {
        const slotStart = format(currentTime, 'HH:mm:ss');
        const slotEnd = format(new Date(currentTime.getTime() + slotDuration * 60000), 'HH:mm:ss');
        
        slots.push({
          slot_start: slotStart,
          slot_end: slotEnd,
          is_available: !bookedTimes.has(slotStart),
        });
        
        currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
      }
      
      return slots;
    },
    enabled: !!selectedDoctor && !!selectedDate && !!facilityId,
  });

  // Filter patients
  const filteredPatients = patients?.filter((patient) => {
    const matchesGender = filterGender === 'all' || patient.gender === filterGender;
    return matchesGender;
  }) || [];

  // ================================
  // Patient Registration with Duplicate Validation
  // ================================
  const registerPatientMutation = useMutation({
    mutationFn: async (patientData: Record<string, FormDataEntryValue>) => {
      setRegistrationErrors({});
      
      const nationalId = (patientData.national_id as string)?.trim();
      const phone = (patientData.phone as string)?.trim();
      
      // Check for duplicate national ID (REQUIRED - must be unique)
      if (nationalId) {
        const { data: existingNationalId } = await supabase
          .from('profiles')
          .select('id')
          .eq('national_id', nationalId)
          .single();
        
        if (existingNationalId) {
          setRegistrationErrors(prev => ({ ...prev, nationalId: 'This National ID is already registered in the system' }));
          throw new Error('Duplicate National ID');
        }
      }
      
      // Check for duplicate phone (if provided - phone is optional)
      if (phone) {
        const { data: existingPhone } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', phone)
          .single();
        
        if (existingPhone) {
          setRegistrationErrors(prev => ({ ...prev, phone: 'This phone number is already registered in the system' }));
          throw new Error('Duplicate Phone Number');
        }
      }
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: patientData.email as string,
        password: (patientData.password as string) || 'TempPassword123!',
        options: {
          data: {
            full_name: patientData.full_name as string,
          },
        },
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Update profile with additional details
      const { error: profileError } = await supabase.from('profiles').update({
        date_of_birth: patientData.date_of_birth as string || null,
        gender: patientData.gender as string || null,
        phone: phone || null,
        national_id: nationalId || null,
      }).eq('user_id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // Register patient at current facility
      if (facilityId) {
        await supabase.from('facility_patients').insert({
          facility_id: facilityId,
          patient_id: authData.user.id,
          patient_number: `PAT-${Date.now().toString(36).toUpperCase()}`,
        });
      }

      // Add allergies if provided
      if (patientData.allergies) {
        const allergiesList = (patientData.allergies as string).split(',').map((a: string) => a.trim()).filter(Boolean);
        for (const allergen of allergiesList) {
          await supabase.from('allergies').insert({
            patient_id: authData.user.id,
            allergen,
            reaction: 'Unknown',
            severity: 'moderate',
          });
        }
      }

      // Add medical conditions if provided
      if (patientData.chronic_conditions) {
        const conditionsList = (patientData.chronic_conditions as string).split(',').map((c: string) => c.trim()).filter(Boolean);
        for (const condition of conditionsList) {
          await supabase.from('medical_conditions').insert({
            patient_id: authData.user.id,
            condition_name: condition,
            status: 'active',
          });
        }
      }

      // Add emergency contact if provided
      if (patientData.emergency_contact_name && patientData.emergency_contact_phone) {
        await supabase.from('emergency_contacts').insert({
          patient_id: authData.user.id,
          contact_name: patientData.emergency_contact_name as string,
          phone: patientData.emergency_contact_phone as string,
          relationship: (patientData.emergency_contact_relationship as string) || 'Other',
          is_primary: true,
        });
      }

      return authData.user;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Patient registered successfully!' });
      queryClient.invalidateQueries({ queryKey: ['global-patients-search'] });
      setIsRegisterOpen(false);
      setRegistrationErrors({});
    },
    onError: (error: Error) => {
      if (!error.message.includes('Duplicate')) {
        toast({ 
          title: 'Error', 
          description: error.message || 'Failed to register patient',
          variant: 'destructive',
        });
      }
    },
  });

  // ================================
  // Create Appointment
  // ================================
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: {
      patientId: string;
      doctorId: string;
      date: string;
      startTime: string;
      endTime: string;
      type: string;
      complaint: string;
    }) => {
      if (!facilityId || !user?.id) throw new Error('Missing facility or user info');
      
      const { error } = await supabase.from('appointments').insert({
        patient_id: appointmentData.patientId,
        doctor_id: appointmentData.doctorId,
        facility_id: facilityId,
        scheduled_by: user.id,
        appointment_date: appointmentData.date,
        start_time: appointmentData.startTime,
        end_time: appointmentData.endTime,
        appointment_type: appointmentData.type as "consultation" | "follow_up" | "emergency" | "routine_checkup" | "lab_test" | "vaccination" | "other",
        chief_complaint: appointmentData.complaint,
        status: 'scheduled',
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Appointment scheduled successfully!' });
      setIsAppointmentOpen(false);
      setSelectedDoctor('');
      setSelectedDate('');
      setSelectedSlot('');
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to schedule appointment',
        variant: 'destructive',
      });
    },
  });

  // ================================
  // Add Visit Record
  // ================================
  const addVisitRecordMutation = useMutation({
    mutationFn: async (data: {
      patientId: string;
      visitDate: string;
      visitType: string;
      chiefComplaint: string;
      diagnosis: string;
      treatment: string;
      notes: string;
    }) => {
      if (!facilityId || !user?.id) throw new Error('Missing facility or user info');
      
      const { error } = await supabase.from('visit_history').insert({
        patient_id: data.patientId,
        facility_id: facilityId,
        facility_name: (staffInfo?.facilities as { name?: string })?.name || 'Unknown Facility',
        visit_date: data.visitDate,
        visit_type: data.visitType,
        chief_complaint: data.chiefComplaint || null,
        diagnosis: data.diagnosis || null,
        treatment: data.treatment || null,
        provider_id: user.id,
        notes: data.notes || null,
      });
      
      if (error) throw error;
      
      // Also update the last_visit_at on facility_patients
      await supabase
        .from('facility_patients')
        .update({ last_visit_at: new Date().toISOString() })
        .eq('facility_id', facilityId)
        .eq('patient_id', data.patientId);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Visit record added successfully!' });
      setIsVisitOpen(false);
      setVisitForm({
        visit_date: new Date().toISOString().slice(0, 16),
        visit_type: 'checkup',
        chief_complaint: '',
        diagnosis: '',
        treatment: '',
        notes: '',
      });
      queryClient.invalidateQueries({ queryKey: ['global-patients-search'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to add visit record',
        variant: 'destructive',
      });
    },
  });

  // ================================
  // Enroll Patient to Facility
  // ================================
  const enrollPatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      if (!facilityId) throw new Error('No facility selected');
      
      // Check if patient already enrolled
      const { data: existing } = await supabase
        .from('facility_patients')
        .select('id')
        .eq('facility_id', facilityId)
        .eq('patient_id', patientId)
        .single();
      
      if (existing) {
        throw new Error('Patient is already enrolled in this facility');
      }
      
      const { error } = await supabase.from('facility_patients').insert({
        facility_id: facilityId,
        patient_id: patientId,
        patient_number: `PAT-${Date.now().toString(36).toUpperCase()}`,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Patient enrolled in this facility!' });
      setIsEnrollOpen(false);
      queryClient.invalidateQueries({ queryKey: ['global-patients-search'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Info', 
        description: error.message,
      });
      setIsEnrollOpen(false);
    },
  });

  const handleAddVisitRecord = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast({ title: 'Error', description: 'Please select a patient first', variant: 'destructive' });
      return;
    }
    
    addVisitRecordMutation.mutate({
      patientId: selectedPatient.user_id,
      visitDate: visitForm.visit_date,
      visitType: visitForm.visit_type,
      chiefComplaint: visitForm.chief_complaint,
      diagnosis: visitForm.diagnosis,
      treatment: visitForm.treatment,
      notes: visitForm.notes,
    });
  };

  const handleRegisterPatient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    registerPatientMutation.mutate(data);
  };

  const handleCreateAppointment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPatient || !selectedDoctor || !selectedDate || !selectedSlot) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    
    const slot = availableSlots?.find(s => s.slot_start === selectedSlot);
    if (!slot) return;
    
    const formData = new FormData(e.currentTarget);
    
    createAppointmentMutation.mutate({
      patientId: selectedPatient.user_id,
      doctorId: selectedDoctor,
      date: selectedDate,
      startTime: slot.slot_start,
      endTime: slot.slot_end,
      type: formData.get('appointment_type') as string || 'consultation',
      complaint: formData.get('chief_complaint') as string || '',
    });
  };

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // ================================
  // Render
  // ================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar activeTab="staff-portal" onTabChange={() => {}} />
      <TopHeader />

      <main className="pt-20 pb-8 px-6 ml-72">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header with Role Badge */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Stethoscope className="h-8 w-8 text-primary" />
                </div>
                Staff Portal
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-muted-foreground">
                  Search patients globally, view records, and manage appointments
                </p>
                <Badge variant={isDoctor ? 'default' : isNurse ? 'secondary' : 'outline'} className="gap-1">
                  {isDoctor && <Stethoscope className="h-3 w-3" />}
                  {isNurse && <Heart className="h-3 w-3" />}
                  {isAdmin && <Shield className="h-3 w-3" />}
                  {facilityRole || role || 'Staff'}
                </Badge>
              </div>
            </div>

            <div className="flex gap-3">
              {/* Nurses can register patients */}
              {(isNurse || isAdmin) && (
                <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                  <DialogTrigger asChild>
                    <Button className="btn-professional gap-2">
                      <UserPlus className="h-4 w-4" />
                      Register Patient
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Register New Patient</DialogTitle>
                      <DialogDescription>
                        Fill in the patient's information. National ID is required and must be unique.
                        Phone number is optional.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleRegisterPatient} className="space-y-6 mt-4">
                      {/* Personal Information */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <IdCard className="h-4 w-4" />
                          Personal Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name *</Label>
                            <Input id="full_name" name="full_name" required placeholder="John Doe" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="national_id">National ID *</Label>
                            <Input 
                              id="national_id" 
                              name="national_id" 
                              required 
                              placeholder="1199XXXXXXXX" 
                              className={registrationErrors.nationalId ? 'border-destructive' : ''}
                            />
                            {registrationErrors.nationalId && (
                              <p className="text-sm text-destructive flex items-center gap-1">
                                <XCircle className="h-3 w-3" />
                                {registrationErrors.nationalId}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input id="email" name="email" type="email" required placeholder="patient@email.com" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number (Optional)</Label>
                            <Input 
                              id="phone" 
                              name="phone" 
                              placeholder="+250 xxx xxx xxx"
                              className={registrationErrors.phone ? 'border-destructive' : ''}
                            />
                            {registrationErrors.phone && (
                              <p className="text-sm text-destructive flex items-center gap-1">
                                <XCircle className="h-3 w-3" />
                                {registrationErrors.phone}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="date_of_birth">Date of Birth *</Label>
                            <Input id="date_of_birth" name="date_of_birth" type="date" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="gender">Gender *</Label>
                            <Select name="gender" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Medical Information */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Heart className="h-4 w-4" />
                          Medical Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                            <Input id="allergies" name="allergies" placeholder="Penicillin, Peanuts" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="chronic_conditions">Chronic Conditions (comma-separated)</Label>
                            <Input id="chronic_conditions" name="chronic_conditions" placeholder="Diabetes, Hypertension" />
                          </div>
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Emergency Contact
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="emergency_contact_name">Name</Label>
                            <Input id="emergency_contact_name" name="emergency_contact_name" placeholder="Jane Doe" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="emergency_contact_phone">Phone</Label>
                            <Input id="emergency_contact_phone" name="emergency_contact_phone" placeholder="+250 xxx xxx xxx" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                            <Select name="emergency_contact_relationship">
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Parent">Parent</SelectItem>
                                <SelectItem value="Spouse">Spouse</SelectItem>
                                <SelectItem value="Sibling">Sibling</SelectItem>
                                <SelectItem value="Friend">Friend</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsRegisterOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={registerPatientMutation.isPending}>
                          {registerPatientMutation.isPending ? 'Registering...' : 'Register Patient'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Stats Cards - Redesigned */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                    <p className="text-3xl font-bold mt-1">{patients?.length || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      Global database
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Enrolled Here</p>
                    <p className="text-3xl font-bold mt-1">
                      {patients?.filter(p => p.facility_patients?.some(fp => fp.facility_id === facilityId)).length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <UserCheck className="h-3 w-3 text-emerald-500" />
                      At this facility
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Doctors Available</p>
                    <p className="text-3xl font-bold mt-1">{doctors?.length || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-blue-500" />
                      On duty today
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/20">
                    <Stethoscope className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">With Allergies</p>
                    <p className="text-3xl font-bold mt-1">
                      {patients?.filter(p => (p.allergies?.length || 0) > 0).length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                      Requires attention
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Global Search Notice */}
          <Alert className="border-primary/20 bg-primary/5">
            <Globe className="h-4 w-4" />
            <AlertDescription>
              <strong>Global Patient Search:</strong> Search results include patients from all hospitals, clinics, and health centers. 
              This enables better diagnosis and treatment continuity across facilities.
            </AlertDescription>
          </Alert>

          {/* Main Content - Redesigned Layout */}
          <div className="grid gap-6 xl:grid-cols-3">
            {/* Patient Table - Full Width */}
            <div className="xl:col-span-2">
              <Card className="border-border/50">
                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">Patient Directory</CardTitle>
                      <CardDescription>Search and manage patients across all facilities</CardDescription>
                    </div>
                    
                    {/* Search & Filters */}
                    <div className="flex gap-3 flex-1 md:max-w-md">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, ID, or phone..."
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Select value={filterGender} onValueChange={setFilterGender}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Genders</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {patientsLoading ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      Loading patients...
                    </div>
                  ) : filteredPatients.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-1">No patients found</p>
                      <p className="text-sm">{searchQuery ? 'Try a different search term' : 'Enter a name, ID, or phone number to search'}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="w-[300px]">Patient</TableHead>
                            <TableHead>National ID</TableHead>
                            <TableHead>Age/Gender</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Visits</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPatients.map((patient) => {
                            const isEnrolled = patient.facility_patients?.some(fp => fp.facility_id === facilityId);
                            return (
                              <TableRow 
                                key={patient.id}
                                className={`cursor-pointer transition-colors ${
                                  selectedPatient?.id === patient.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                                }`}
                                onClick={() => setSelectedPatient(patient)}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                                      patient.gender === 'male' ? 'bg-blue-500' : patient.gender === 'female' ? 'bg-pink-500' : 'bg-gray-400'
                                    }`}>
                                      {patient.full_name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                      <p className="font-medium">{patient.full_name || 'Unknown'}</p>
                                      <p className="text-xs text-muted-foreground">{patient.phone || 'No phone'}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5">
                                    <IdCard className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="font-mono text-sm">{patient.national_id || '—'}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <span>{patient.date_of_birth ? `${getAge(patient.date_of_birth)} yrs` : '—'}</span>
                                    <span className="text-muted-foreground"> / </span>
                                    <span className="capitalize">{patient.gender || '—'}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {isEnrolled ? (
                                      <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                        <UserCheck className="h-3 w-3 mr-1" />
                                        Enrolled
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                        External
                                      </Badge>
                                    )}
                                    {patient.allergies && patient.allergies.length > 0 && (
                                      <Badge variant="destructive" className="text-xs px-1.5">
                                        <AlertTriangle className="h-3 w-3" />
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm font-medium">
                                    {patient.visit_history?.length || 0}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedPatient(patient);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  {/* Table Footer with count */}
                  {filteredPatients.length > 0 && (
                    <div className="px-4 py-3 border-t bg-muted/30 text-sm text-muted-foreground">
                      Showing {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
                      {searchQuery && ` matching "${searchQuery}"`}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Patient Details Panel */}
            <div className="space-y-4">
              {selectedPatient ? (
                <>
                  <Card className="border-border/50 sticky top-4">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Patient Details</CardTitle>
                        <div className="flex gap-2">
                          {/* Doctors can view full records */}
                          {(isDoctor || isAdmin) && (
                            <Button variant="ghost" size="icon" onClick={() => navigate(`/patient/${selectedPatient.user_id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Name & Photo */}
                      <div className="flex items-center gap-4 pb-4 border-b">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white text-xl font-bold">
                          {selectedPatient.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{selectedPatient.full_name}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {selectedPatient.gender || 'Unknown'} • {selectedPatient.date_of_birth ? `${getAge(selectedPatient.date_of_birth)} years old` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-3">
                        {selectedPatient.national_id && (
                          <div className="flex items-center gap-3">
                            <IdCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">ID: {selectedPatient.national_id}</span>
                          </div>
                        )}
                        {selectedPatient.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{selectedPatient.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Born: {selectedPatient.date_of_birth ? format(new Date(selectedPatient.date_of_birth), 'PPP') : 'Not specified'}
                          </span>
                        </div>
                      </div>

                      {/* Allergies - ALWAYS visible for safety */}
                      {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Allergies (Critical)
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedPatient.allergies.map((allergy, i) => (
                              <Badge key={i} variant="destructive" className="text-xs">
                                {allergy.allergen} ({allergy.severity})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Medical Conditions - Doctors only */}
                      {(isDoctor || isAdmin) && selectedPatient.medical_conditions && selectedPatient.medical_conditions.length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-sm font-semibold text-amber-600 mb-2 flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            Medical Conditions
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedPatient.medical_conditions.map((condition, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                {condition.condition_name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Visit History - Global records from all facilities */}
                      {(isDoctor || isAdmin) && selectedPatient.visit_history && selectedPatient.visit_history.length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Visit History (All Facilities)
                          </p>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {selectedPatient.visit_history.map((visit, i) => (
                              <div key={i} className="text-xs p-2 bg-muted rounded">
                                <div className="font-medium">{visit.facility_name}</div>
                                <div className="text-muted-foreground">
                                  {format(new Date(visit.visit_date), 'PP')} • {visit.visit_type}
                                </div>
                                {visit.diagnosis && <div className="mt-1">{visit.diagnosis}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Nurses see restricted message for detailed records */}
                      {isNurse && !isDoctor && !isAdmin && (
                        <div className="pt-3 border-t">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Lock className="h-4 w-4" />
                            Detailed medical records are visible to doctors only
                          </div>
                        </div>
                      )}

                      {/* Emergency Contact */}
                      {selectedPatient.emergency_contacts && selectedPatient.emergency_contacts.length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-sm font-semibold mb-2">Emergency Contact</p>
                          {selectedPatient.emergency_contacts.map((contact, i) => (
                            <div key={i} className="space-y-1 text-sm text-muted-foreground">
                              <p>{contact.contact_name} ({contact.relationship})</p>
                              <p className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                {contact.phone}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {/* Nurses can schedule appointments */}
                      {(isNurse || isAdmin) && (
                        <Dialog open={isAppointmentOpen} onOpenChange={setIsAppointmentOpen}>
                          <DialogTrigger asChild>
                            <Button className="w-full justify-start gap-3" variant="default">
                              <CalendarPlus className="h-4 w-4" />
                              Schedule Appointment
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Schedule Appointment</DialogTitle>
                              <DialogDescription>
                                Book an appointment for {selectedPatient.full_name}
                              </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleCreateAppointment} className="space-y-4 mt-4">
                              <div className="space-y-2">
                                <Label>Select Doctor *</Label>
                                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose a doctor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {doctors?.map((doctor) => (
                                      <SelectItem key={doctor.user_id} value={doctor.user_id}>
                                        Dr. {doctor.full_name} {doctor.specialization ? `(${doctor.specialization})` : ''}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Appointment Date *</Label>
                                <Input 
                                  type="date" 
                                  value={selectedDate}
                                  onChange={(e) => setSelectedDate(e.target.value)}
                                  min={format(new Date(), 'yyyy-MM-dd')}
                                />
                              </div>

                              {selectedDoctor && selectedDate && (
                                <div className="space-y-2">
                                  <Label>Available Time Slots</Label>
                                  {availableSlots && availableSlots.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                      {availableSlots.map((slot) => (
                                        <Button
                                          key={slot.slot_start}
                                          type="button"
                                          variant={selectedSlot === slot.slot_start ? 'default' : 'outline'}
                                          size="sm"
                                          disabled={!slot.is_available}
                                          onClick={() => setSelectedSlot(slot.slot_start)}
                                          className={!slot.is_available ? 'opacity-50' : ''}
                                        >
                                          {slot.slot_start.slice(0, 5)}
                                        </Button>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      No schedule available for this day
                                    </p>
                                  )}
                                </div>
                              )}

                              <div className="space-y-2">
                                <Label>Appointment Type</Label>
                                <Select name="appointment_type" defaultValue="consultation">
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="consultation">Consultation</SelectItem>
                                    <SelectItem value="follow_up">Follow-up</SelectItem>
                                    <SelectItem value="routine_checkup">Routine Checkup</SelectItem>
                                    <SelectItem value="lab_test">Lab Test</SelectItem>
                                    <SelectItem value="vaccination">Vaccination</SelectItem>
                                    <SelectItem value="emergency">Emergency</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Chief Complaint / Reason</Label>
                                <Textarea 
                                  name="chief_complaint" 
                                  placeholder="Brief description of the reason for visit..."
                                  rows={3}
                                />
                              </div>

                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsAppointmentOpen(false)}>
                                  Cancel
                                </Button>
                                <Button 
                                  type="submit" 
                                  disabled={!selectedDoctor || !selectedDate || !selectedSlot || createAppointmentMutation.isPending}
                                >
                                  {createAppointmentMutation.isPending ? 'Scheduling...' : 'Schedule'}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* Doctors can view full records */}
                      {(isDoctor || isAdmin) && (
                        <Button 
                          className="w-full justify-start gap-3" 
                          variant="outline"
                          onClick={() => navigate(`/patient/${selectedPatient.user_id}`)}
                        >
                          <FileText className="h-4 w-4" />
                          View Full Medical Records
                        </Button>
                      )}
                      
                      {/* Add Visit Record Dialog */}
                      {(isDoctor || isNurse || isAdmin) && (
                        <Dialog open={isVisitOpen} onOpenChange={setIsVisitOpen}>
                          <DialogTrigger asChild>
                            <Button className="w-full justify-start gap-3" variant="outline">
                              <Activity className="h-4 w-4" />
                              Add Visit Record
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Add Visit Record</DialogTitle>
                              <DialogDescription>
                                Record a new visit for {selectedPatient.full_name}
                              </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleAddVisitRecord} className="space-y-4 mt-4">
                              <div className="space-y-2">
                                <Label>Visit Date & Time *</Label>
                                <Input 
                                  type="datetime-local"
                                  value={visitForm.visit_date}
                                  onChange={(e) => setVisitForm(prev => ({ ...prev, visit_date: e.target.value }))}
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Visit Type *</Label>
                                <Select 
                                  value={visitForm.visit_type} 
                                  onValueChange={(value) => setVisitForm(prev => ({ ...prev, visit_type: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="checkup">Checkup</SelectItem>
                                    <SelectItem value="consultation">Consultation</SelectItem>
                                    <SelectItem value="follow_up">Follow-up</SelectItem>
                                    <SelectItem value="emergency">Emergency</SelectItem>
                                    <SelectItem value="lab_test">Lab Test</SelectItem>
                                    <SelectItem value="vaccination">Vaccination</SelectItem>
                                    <SelectItem value="inpatient">Inpatient</SelectItem>
                                    <SelectItem value="outpatient">Outpatient</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Chief Complaint</Label>
                                <Textarea 
                                  value={visitForm.chief_complaint}
                                  onChange={(e) => setVisitForm(prev => ({ ...prev, chief_complaint: e.target.value }))}
                                  placeholder="Patient's primary reason for visit..."
                                  rows={2}
                                />
                              </div>

                              {isDoctor && (
                                <>
                                  <div className="space-y-2">
                                    <Label>Diagnosis</Label>
                                    <Textarea 
                                      value={visitForm.diagnosis}
                                      onChange={(e) => setVisitForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                                      placeholder="Clinical diagnosis..."
                                      rows={2}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Treatment</Label>
                                    <Textarea 
                                      value={visitForm.treatment}
                                      onChange={(e) => setVisitForm(prev => ({ ...prev, treatment: e.target.value }))}
                                      placeholder="Treatment plan and prescriptions..."
                                      rows={2}
                                    />
                                  </div>
                                </>
                              )}

                              <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea 
                                  value={visitForm.notes}
                                  onChange={(e) => setVisitForm(prev => ({ ...prev, notes: e.target.value }))}
                                  placeholder="Additional notes..."
                                  rows={2}
                                />
                              </div>

                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsVisitOpen(false)}>
                                  Cancel
                                </Button>
                                <Button 
                                  type="submit" 
                                  disabled={addVisitRecordMutation.isPending}
                                >
                                  {addVisitRecordMutation.isPending ? 'Saving...' : 'Save Visit'}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* Enroll Patient to Facility - shows if patient found globally but not in this facility */}
                      {!selectedPatient.facility_patients?.some(
                        (fp: { facility_id: string }) => fp.facility_id === facilityId
                      ) && (
                        <Dialog open={isEnrollOpen} onOpenChange={setIsEnrollOpen}>
                          <DialogTrigger asChild>
                            <Button className="w-full justify-start gap-3" variant="secondary">
                              <UserPlus className="h-4 w-4" />
                              Enroll in This Facility
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Enroll Patient</DialogTitle>
                              <DialogDescription>
                                Add {selectedPatient.full_name} to this facility's patient list?
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <p className="text-sm text-muted-foreground mb-4">
                                This patient has visited other facilities before. Enrolling them will allow you to:
                              </p>
                              <ul className="text-sm space-y-2">
                                <li className="flex items-center gap-2">
                                  <Activity className="h-4 w-4 text-green-500" />
                                  Record visits at this facility
                                </li>
                                <li className="flex items-center gap-2">
                                  <CalendarPlus className="h-4 w-4 text-green-500" />
                                  Schedule appointments
                                </li>
                                <li className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-green-500" />
                                  Access their medical history (with consent)
                                </li>
                              </ul>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsEnrollOpen(false)}>
                                Cancel
                              </Button>
                              <Button 
                                onClick={() => enrollPatientMutation.mutate(selectedPatient.user_id)}
                                disabled={enrollPatientMutation.isPending}
                              >
                                {enrollPatientMutation.isPending ? 'Enrolling...' : 'Enroll Patient'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="border-border/50 border-dashed sticky top-4">
                  <CardContent className="py-20 text-center">
                    <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                      <Users className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <p className="font-medium text-muted-foreground mb-2">No Patient Selected</p>
                    <p className="text-sm text-muted-foreground/70">Click on a patient from the table to view their details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
