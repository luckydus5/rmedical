import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { createNotification } from '@/hooks/useNotifications';
import Sidebar from '@/components/layout/Sidebar';
import TopHeader from '@/components/layout/TopHeader';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Eye,
  Filter,
  MoreVertical,
  Stethoscope,
  Heart,
  Activity,
  Shield,
  FileText,
  Globe,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

// Types
interface Facility {
  id: string;
  name: string;
  facility_type: 'hospital' | 'clinic' | 'health_center' | 'pharmacy' | 'laboratory';
  status: 'pending' | 'approved' | 'suspended';
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  license_number: string | null;
  logo_url: string | null;
  created_at: string;
  approved_at: string | null;
  staff_count?: number;
  patient_count?: number;
}

interface FacilityStats {
  total: number;
  approved: number;
  pending: number;
  suspended: number;
  hospitals: number;
  clinics: number;
  healthCenters: number;
}

export default function Facilities() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const isAdmin = role === 'admin';

  // Fetch all facilities
  const { data: facilities, isLoading } = useQuery({
    queryKey: ['facilities', searchQuery, filterType, filterStatus],
    queryFn: async () => {
      let query = supabase.from('facilities').select('*');
      
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`);
      }
      if (filterType !== 'all') {
        query = query.eq('facility_type', filterType as Facility['facility_type']);
      }
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus as Facility['status']);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      // Get staff and patient counts for each facility
      const facilitiesWithCounts = await Promise.all(
        (data || []).map(async (facility) => {
          const { count: staffCount } = await supabase
            .from('facility_staff')
            .select('*', { count: 'exact', head: true })
            .eq('facility_id', facility.id)
            .eq('is_active', true);
          
          const { count: patientCount } = await supabase
            .from('facility_patients')
            .select('*', { count: 'exact', head: true })
            .eq('facility_id', facility.id);

          return {
            ...facility,
            staff_count: staffCount || 0,
            patient_count: patientCount || 0,
          } as Facility;
        })
      );

      return facilitiesWithCounts;
    },
  });

  // Calculate stats
  const stats: FacilityStats = {
    total: facilities?.length || 0,
    approved: facilities?.filter(f => f.status === 'approved').length || 0,
    pending: facilities?.filter(f => f.status === 'pending').length || 0,
    suspended: facilities?.filter(f => f.status === 'suspended').length || 0,
    hospitals: facilities?.filter(f => f.facility_type === 'hospital').length || 0,
    clinics: facilities?.filter(f => f.facility_type === 'clinic').length || 0,
    healthCenters: facilities?.filter(f => f.facility_type === 'health_center').length || 0,
  };

  // Bypass TypeScript until Supabase types are regenerated for new tables
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any;

  // Add facility mutation - also creates facility admin
  const addFacilityMutation = useMutation({
    mutationFn: async (data: Record<string, FormDataEntryValue>) => {
      // Step 1: Create the facility
      const { data: newFacility, error: facilityError } = await supabase
        .from('facilities')
        .insert({
          name: data.name as string,
          facility_type: data.facility_type as Facility['facility_type'],
          address: data.address as string || null,
          city: data.city as string || null,
          country: data.country as string || 'Rwanda',
          phone: data.phone as string || null,
          email: data.email as string || null,
          license_number: data.license_number as string || null,
          status: isAdmin ? 'approved' : 'pending',
          created_by: user?.id,
          approved_by: isAdmin ? user?.id : null,
          approved_at: isAdmin ? new Date().toISOString() : null,
        })
        .select()
        .single();
      
      if (facilityError) throw facilityError;

      // Step 2: Check if admin details were provided
      const adminEmail = data.admin_email as string;
      const adminName = data.admin_name as string;
      
      if (adminEmail && adminName) {
        // Check if user with this email already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('user_id')
          .ilike('email', adminEmail)
          .maybeSingle();

        if (existingProfile) {
          // User exists - add them as facility admin
          const { error: adminError } = await supabaseAny
            .from('facility_admins')
            .insert({
              user_id: existingProfile.user_id,
              facility_id: newFacility.id,
              granted_by: user?.id,
              granted_at: new Date().toISOString(),
              is_active: true,
            });

          if (adminError && !adminError.message?.includes('duplicate')) {
            console.error('Error adding facility admin:', adminError);
          }

          // Also add to facility_staff with their role
          const adminRole = data.admin_role as string || 'facility_admin';
          const validRoles = ['facility_admin', 'doctor', 'nurse', 'receptionist'];
          const roleToUse = validRoles.includes(adminRole) ? adminRole : 'facility_admin';
          
          await supabase.from('facility_staff').insert({
            user_id: existingProfile.user_id,
            facility_id: newFacility.id,
            role: roleToUse as 'facility_admin' | 'doctor' | 'nurse' | 'receptionist',
            hired_at: new Date().toISOString(),
          });

          // Send notification to the admin
          try {
            await createNotification(
              existingProfile.user_id,
              'Facility Admin Access Granted',
              `You have been assigned as ${adminRole.replace('_', ' ')} for ${newFacility.name}`,
              'facility',
              '/admin/facilities'
            );
          } catch (e) {
            console.error('Failed to send notification:', e);
          }

          toast({
            title: 'Admin Assigned',
            description: `${adminName} has been assigned as admin for ${newFacility.name}`,
          });
        } else {
          // User doesn't exist - we'll need to invite them
          // For now, show a message that they need to register first
          toast({
            title: 'Admin Not Found',
            description: `No user found with email ${adminEmail}. They need to register first, then you can assign them as admin.`,
            variant: 'destructive',
          });
          
          // Still create facility, just without admin
          console.log('Facility created, but admin user not found. They can be assigned later.');
        }
      }

      return newFacility;
    },
    onSuccess: (newFacility) => {
      toast({ title: 'Success', description: `${newFacility.name} has been registered successfully!` });
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      setIsAddOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update facility mutation
  const updateFacilityMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Facility> }) => {
      const { patient_count: _pc, staff_count: _sc, ...cleanUpdates } = data.updates as Partial<Facility> & { patient_count?: number; staff_count?: number };
      const { error } = await supabase
        .from('facilities')
        .update(cleanUpdates as never)
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Facility updated successfully!' });
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      setIsEditOpen(false);
      setSelectedFacility(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Approve facility mutation
  const approveFacilityMutation = useMutation({
    mutationFn: async (facilityId: string) => {
      const { error } = await supabase
        .from('facilities')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', facilityId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Facility approved!' });
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
    },
  });

  // Suspend facility mutation
  const suspendFacilityMutation = useMutation({
    mutationFn: async (facilityId: string) => {
      const { error } = await supabase
        .from('facilities')
        .update({ status: 'suspended' })
        .eq('id', facilityId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Facility Suspended', description: 'The facility has been suspended.' });
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
    },
  });

  // Delete facility mutation
  const deleteFacilityMutation = useMutation({
    mutationFn: async (facilityId: string) => {
      const { error } = await supabase.from('facilities').delete().eq('id', facilityId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Deleted', description: 'Facility has been removed.' });
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleAddFacility = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    addFacilityMutation.mutate(data);
  };

  const handleEditFacility = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFacility) return;
    const formData = new FormData(e.currentTarget);
    const updates = {
      name: formData.get('name') as string,
      facility_type: formData.get('facility_type') as Facility['facility_type'],
      address: formData.get('address') as string || null,
      city: formData.get('city') as string || null,
      country: formData.get('country') as string || null,
      phone: formData.get('phone') as string || null,
      email: formData.get('email') as string || null,
      license_number: formData.get('license_number') as string || null,
    };
    updateFacilityMutation.mutate({ id: selectedFacility.id, updates });
  };

  const getStatusBadge = (status: Facility['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'suspended':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="h-3 w-3 mr-1" />Suspended</Badge>;
    }
  };

  const getFacilityIcon = (type: Facility['facility_type']) => {
    switch (type) {
      case 'hospital':
        return <Building2 className="h-5 w-5" />;
      case 'clinic':
        return <Stethoscope className="h-5 w-5" />;
      case 'health_center':
        return <Heart className="h-5 w-5" />;
      case 'pharmacy':
        return <Activity className="h-5 w-5" />;
      case 'laboratory':
        return <FileText className="h-5 w-5" />;
      default:
        return <Building2 className="h-5 w-5" />;
    }
  };

  const getFacilityTypeLabel = (type: Facility['facility_type']) => {
    switch (type) {
      case 'hospital': return 'Hospital';
      case 'clinic': return 'Clinic';
      case 'health_center': return 'Health Center';
      case 'pharmacy': return 'Pharmacy';
      case 'laboratory': return 'Laboratory';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar activeTab="facilities" onTabChange={() => {}} />
      <TopHeader />

      <main className="pt-20 pb-8 px-6 ml-72">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                Facilities Management
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage hospitals, clinics, and health centers across the network
              </p>
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Facility
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Facility</DialogTitle>
                  <DialogDescription>
                    Register a new healthcare facility to the Sanovia network
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddFacility} className="space-y-6 mt-4">
                  {/* Facility Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Facility Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Facility Name *</Label>
                        <Input id="name" name="name" required placeholder="King Faisal Hospital" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="facility_type">Facility Type *</Label>
                        <Select name="facility_type" required defaultValue="hospital">
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hospital">Hospital</SelectItem>
                            <SelectItem value="clinic">Clinic</SelectItem>
                            <SelectItem value="health_center">Health Center</SelectItem>
                            <SelectItem value="pharmacy">Pharmacy</SelectItem>
                            <SelectItem value="laboratory">Laboratory</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="license_number">License Number *</Label>
                        <Input id="license_number" name="license_number" required placeholder="MOH-XXXX-XXXX" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" name="phone" placeholder="+250 xxx xxx xxx" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Facility Email</Label>
                        <Input id="email" name="email" type="email" placeholder="info@facility.rw" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" name="city" placeholder="Kigali" />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea id="address" name="address" placeholder="Full address..." rows={2} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" name="country" defaultValue="Rwanda" />
                      </div>
                    </div>
                  </div>

                  {/* Facility Admin Section */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Facility Administrator
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Assign an administrator who will manage this facility and its staff
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin_name">Admin Full Name *</Label>
                        <Input id="admin_name" name="admin_name" required placeholder="Dr. Jean Baptiste" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin_email">Admin Email *</Label>
                        <Input id="admin_email" name="admin_email" type="email" required placeholder="admin@facility.rw" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin_phone">Admin Phone</Label>
                        <Input id="admin_phone" name="admin_phone" placeholder="+250 xxx xxx xxx" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin_role">Admin Role *</Label>
                        <Select name="admin_role" required defaultValue="facility_admin">
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="facility_admin">Facility Admin</SelectItem>
                            <SelectItem value="doctor">Doctor</SelectItem>
                            <SelectItem value="nurse">Head Nurse</SelectItem>
                            <SelectItem value="receptionist">Receptionist</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin_national_id">National ID</Label>
                        <Input id="admin_national_id" name="admin_national_id" placeholder="1XXXXXXXXXXXX" />
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addFacilityMutation.isPending}>
                      {addFacilityMutation.isPending ? 'Adding...' : 'Add Facility'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-100">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-100">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-100">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.suspended}</p>
                  <p className="text-sm text-muted-foreground">Suspended</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-100">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.hospitals}</p>
                  <p className="text-sm text-muted-foreground">Hospitals</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-pink-100">
                  <Stethoscope className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.clinics}</p>
                  <p className="text-sm text-muted-foreground">Clinics</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-cyan-100">
                  <Heart className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.healthCenters}</p>
                  <p className="text-sm text-muted-foreground">Health Centers</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search facilities by name, city..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="hospital">Hospital</SelectItem>
                    <SelectItem value="clinic">Clinic</SelectItem>
                    <SelectItem value="health_center">Health Center</SelectItem>
                    <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="laboratory">Laboratory</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Facilities Grid */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading facilities...</div>
          ) : facilities && facilities.length === 0 ? (
            <Card className="border-border/50 border-dashed">
              <CardContent className="py-16 text-center">
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Facilities Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                    ? 'No facilities match your search criteria.'
                    : 'Get started by adding your first healthcare facility.'}
                </p>
                <Button onClick={() => setIsAddOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Facility
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {facilities?.map((facility) => (
                <Card key={facility.id} className="border-border/50 hover:border-primary/50 transition-all hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${
                          facility.facility_type === 'hospital' ? 'bg-purple-100 text-purple-600' :
                          facility.facility_type === 'clinic' ? 'bg-pink-100 text-pink-600' :
                          facility.facility_type === 'health_center' ? 'bg-cyan-100 text-cyan-600' :
                          facility.facility_type === 'pharmacy' ? 'bg-green-100 text-green-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          {getFacilityIcon(facility.facility_type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{facility.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {getFacilityTypeLabel(facility.facility_type)}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.location.href = `/facility/${facility.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedFacility(facility);
                            setIsEditOpen(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {isAdmin && facility.status === 'pending' && (
                            <DropdownMenuItem onClick={() => approveFacilityMutation.mutate(facility.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {isAdmin && facility.status === 'approved' && (
                            <DropdownMenuItem onClick={() => suspendFacilityMutation.mutate(facility.id)}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {isAdmin && facility.status === 'suspended' && (
                            <DropdownMenuItem onClick={() => approveFacilityMutation.mutate(facility.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Reactivate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this facility?')) {
                                deleteFacilityMutation.mutate(facility.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(facility.status)}
                      {facility.license_number && (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          {facility.license_number}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      {(facility.city || facility.address) && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                          <span>{facility.city}{facility.address ? `, ${facility.address}` : ''}</span>
                        </div>
                      )}
                      {facility.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{facility.phone}</span>
                        </div>
                      )}
                      {facility.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{facility.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{facility.staff_count}</span>
                        <span className="text-xs text-muted-foreground">Staff</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{facility.patient_count}</span>
                        <span className="text-xs text-muted-foreground">Patients</span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Registered {format(new Date(facility.created_at), 'PP')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Edit Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Facility</DialogTitle>
                <DialogDescription>
                  Update facility information
                </DialogDescription>
              </DialogHeader>

              {selectedFacility && (
                <form onSubmit={handleEditFacility} className="space-y-6 mt-4">
                  {/* Facility Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Facility Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit_name">Facility Name *</Label>
                        <Input 
                          id="edit_name" 
                          name="name" 
                          required 
                          defaultValue={selectedFacility.name} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_facility_type">Facility Type *</Label>
                        <Select name="facility_type" defaultValue={selectedFacility.facility_type}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hospital">Hospital</SelectItem>
                            <SelectItem value="clinic">Clinic</SelectItem>
                            <SelectItem value="health_center">Health Center</SelectItem>
                            <SelectItem value="pharmacy">Pharmacy</SelectItem>
                            <SelectItem value="laboratory">Laboratory</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_license_number">License Number *</Label>
                        <Input 
                          id="edit_license_number" 
                          name="license_number" 
                          required
                          defaultValue={selectedFacility.license_number || ''} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_phone">Phone Number</Label>
                        <Input 
                          id="edit_phone" 
                          name="phone" 
                          defaultValue={selectedFacility.phone || ''} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_email">Facility Email</Label>
                        <Input 
                          id="edit_email" 
                          name="email" 
                          type="email" 
                          defaultValue={selectedFacility.email || ''} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_city">City</Label>
                        <Input 
                          id="edit_city" 
                          name="city" 
                          defaultValue={selectedFacility.city || ''} 
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="edit_address">Address</Label>
                        <Textarea 
                          id="edit_address" 
                          name="address" 
                          defaultValue={selectedFacility.address || ''} 
                          rows={2} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_country">Country</Label>
                        <Input 
                          id="edit_country" 
                          name="country" 
                          defaultValue={selectedFacility.country || 'Rwanda'} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Facility Admin Section */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Facility Administrator
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Update the facility administrator or assign a new one
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit_admin_name">Admin Full Name</Label>
                        <Input id="edit_admin_name" name="admin_name" placeholder="Dr. Jean Baptiste" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_admin_email">Admin Email</Label>
                        <Input id="edit_admin_email" name="admin_email" type="email" placeholder="admin@facility.rw" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_admin_phone">Admin Phone</Label>
                        <Input id="edit_admin_phone" name="admin_phone" placeholder="+250 xxx xxx xxx" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_admin_role">Admin Role</Label>
                        <Select name="admin_role" defaultValue="facility_admin">
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="facility_admin">Facility Admin</SelectItem>
                            <SelectItem value="doctor">Doctor</SelectItem>
                            <SelectItem value="nurse">Head Nurse</SelectItem>
                            <SelectItem value="receptionist">Receptionist</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateFacilityMutation.isPending}>
                      {updateFacilityMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
