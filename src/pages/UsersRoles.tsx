import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Users, 
  UserCog, 
  Shield, 
  Search, 
  Filter,
  MoreHorizontal,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Mail,
  Phone,
  Calendar,
  Edit,
  Trash2,
  Eye,
  Key
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Types for user data
interface FacilityInfo {
  name: string;
  facility_type: string;
}

interface FacilityStaffInfo {
  id: string;
  role: string;
  is_active: boolean;
  facility_id: string;
  facilities: FacilityInfo | null;
}

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  national_id: string | null;
  phone: string | null;
  created_at: string;
  system_role: string | null; // Role from user_roles table (admin, doctor, nurse, patient)
  facility_staff: FacilityStaffInfo[] | null;
}

export default function UsersRoles() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    national_id: '',
  });

  // Redirect if not admin - use useEffect for navigation
  useEffect(() => {
    if (role !== 'admin') {
      navigate('/');
    }
  }, [role, navigate]);

  // Fetch all users with their profiles and roles
  const { data: users, isLoading, refetch, error: usersError } = useQuery({
    queryKey: ['admin-users', searchQuery, roleFilter],
    queryFn: async () => {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Get user_roles (admin, doctor, nurse, patient from auth system)
      const { data: userRolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Get staff info separately
      const { data: staffData } = await supabase
        .from('facility_staff')
        .select(`
          id,
          user_id,
          role,
          is_active,
          facility_id,
          facilities (name, facility_type)
        `);

      // Merge all data with profiles
      const result: UserProfile[] = (profiles || []).map(profile => {
        const staff = staffData?.filter(s => s.user_id === profile.user_id) || [];
        const userRole = userRolesData?.find(r => r.user_id === profile.user_id);
        
        return {
          ...profile,
          system_role: userRole?.role || null, // Role from user_roles table (admin, doctor, nurse, patient)
          facility_staff: staff.length > 0 ? staff.map(s => ({
            id: s.id,
            role: s.role,
            is_active: s.is_active,
            facility_id: s.facility_id,
            facilities: s.facilities as FacilityInfo | null
          })) : null
        } as UserProfile;
      });

      // Apply search filter
      let filtered = result;
      if (searchQuery) {
        filtered = filtered.filter(u => 
          u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.national_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.phone?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Filter by role if needed
      if (roleFilter !== 'all') {
        filtered = filtered.filter(u => {
          const actualRole = u.system_role || u.facility_staff?.[0]?.role || 'patient';
          return actualRole === roleFilter;
        });
      }

      return filtered;
    },
    enabled: role === 'admin',
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: totalStaff },
        { count: doctors },
        { count: nurses },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('facility_staff').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('facility_staff').select('*', { count: 'exact', head: true }).eq('role', 'doctor'),
        supabase.from('facility_staff').select('*', { count: 'exact', head: true }).eq('role', 'nurse'),
      ]);

      return {
        totalUsers: totalUsers || 0,
        totalStaff: totalStaff || 0,
        doctors: doctors || 0,
        nurses: nurses || 0,
      };
    },
    enabled: role === 'admin',
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { userId: string; updates: { full_name?: string; phone?: string; national_id?: string } }) => {
      const { error } = await supabase
        .from('profiles')
        .update(data.updates)
        .eq('user_id', data.userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowEditDialog(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update user: ${error.message}`);
    },
  });

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async (data: { userId: string; newRole: 'admin' | 'doctor' | 'nurse' | 'patient' }) => {
      // First, update or create user_roles entry
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', data.userId)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: data.newRole })
          .eq('user_id', data.userId);
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: data.userId, role: data.newRole }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowRoleDialog(false);
      setSelectedUser(null);
      setNewRole('');
    },
    onError: (error: Error) => {
      toast.error(`Failed to change role: ${error.message}`);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Delete from facility_staff first
      await supabase.from('facility_staff').delete().eq('user_id', userId);
      // Delete from user_roles
      await supabase.from('user_roles').delete().eq('user_id', userId);
      // Delete profile
      const { error } = await supabase.from('profiles').delete().eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });

  // Handle action clicks
  const handleViewUser = (user: UserProfile) => {
    setSelectedUser(user);
    setShowViewDialog(true);
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || '',
      phone: user.phone || '',
      national_id: user.national_id || '',
    });
    setShowEditDialog(true);
  };

  const handleChangeRole = (user: UserProfile) => {
    setSelectedUser(user);
    setNewRole(getUserRole(user));
    setShowRoleDialog(true);
  };

  const handleDeleteUser = (user: UserProfile) => {
    if (window.confirm(`Are you sure you want to delete ${user.full_name}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(user.user_id);
    }
  };

  const getUserRole = (user: UserProfile) => {
    // First check system_role from user_roles table (admin, doctor, nurse, patient)
    if (user.system_role) return user.system_role;
    // Fall back to facility_staff role
    const staffRole = user.facility_staff?.[0]?.role;
    if (staffRole) return staffRole;
    return 'patient';
  };

  const getRoleBadge = (roleType: string) => {
    const config: Record<string, { color: string; label: string }> = {
      admin: { color: 'bg-purple-600/20 text-purple-600 border-purple-600/40 font-semibold', label: 'System Admin' },
      facility_admin: { color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30', label: 'Facility Admin' },
      doctor: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', label: 'Doctor' },
      nurse: { color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', label: 'Nurse' },
      receptionist: { color: 'bg-amber-500/10 text-amber-500 border-amber-500/30', label: 'Receptionist' },
      lab_technician: { color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30', label: 'Lab Tech' },
      patient: { color: 'bg-slate-500/10 text-slate-500 border-slate-500/30', label: 'Patient' },
    };
    const c = config[roleType] || config.patient;
    return <Badge variant="outline" className={c.color}>{c.label}</Badge>;
  };

  // Don't render if not admin
  if (role !== 'admin') {
    return null;
  };

  return (
    <DashboardLayout activeTab="users">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserCog className="h-6 w-6 text-primary" />
              Users & Roles
            </h1>
            <p className="text-muted-foreground">Manage user accounts and role assignments</p>
          </div>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalStaff || 0}</p>
                  <p className="text-xs text-muted-foreground">Active Staff</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <UserCog className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.doctors || 0}</p>
                  <p className="text-xs text-muted-foreground">Doctors</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Users className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.nurses || 0}</p>
                  <p className="text-xs text-muted-foreground">Nurses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or National ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">System Admins</SelectItem>
                  <SelectItem value="doctor">Doctors</SelectItem>
                  <SelectItem value="nurse">Nurses</SelectItem>
                  <SelectItem value="receptionist">Receptionists</SelectItem>
                  <SelectItem value="lab_technician">Lab Technicians</SelectItem>
                  <SelectItem value="patient">Patients</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              {users?.length || 0} users found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : users && users.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>National ID</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.full_name || 'No name'}</p>
                            <p className="text-xs text-muted-foreground">{user.phone || 'No phone'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(getUserRole(user))}</TableCell>
                      <TableCell>
                        {user.system_role === 'admin' ? (
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-medium text-purple-600">All Facilities</span>
                          </div>
                        ) : user.facility_staff?.[0]?.facilities?.name ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{user.facility_staff[0].facilities.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">{user.national_id || '—'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewUser(user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeRole(user)}>
                              <Key className="h-4 w-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteUser(user)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View User Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>Complete user information</DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedUser.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {selectedUser.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedUser.full_name || 'No name'}</h3>
                    {getRoleBadge(getUserRole(selectedUser))}
                  </div>
                </div>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedUser.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>National ID: {selectedUser.national_id || 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined: {format(new Date(selectedUser.created_at), 'PPP')}</span>
                  </div>
                  {selectedUser.facility_staff?.[0]?.facilities?.name && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>Facility: {selectedUser.facility_staff[0].facilities.name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
              <Button onClick={() => { setShowViewDialog(false); handleEditUser(selectedUser!); }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (selectedUser) {
                updateProfileMutation.mutate({
                  userId: selectedUser.user_id,
                  updates: editForm,
                });
              }
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">National ID</label>
                <Input
                  value={editForm.national_id}
                  onChange={(e) => setEditForm({ ...editForm, national_id: e.target.value })}
                  placeholder="Enter national ID"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Change Role Dialog */}
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>
                Update role for {selectedUser?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select New Role</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">System Admin</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="lab_technician">Lab Technician</SelectItem>
                    <SelectItem value="patient">Patient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRoleDialog(false)}>Cancel</Button>
                <Button 
                  onClick={() => {
                    if (selectedUser && newRole && ['admin', 'doctor', 'nurse', 'patient'].includes(newRole)) {
                      changeRoleMutation.mutate({
                        userId: selectedUser.user_id,
                        newRole: newRole as 'admin' | 'doctor' | 'nurse' | 'patient',
                      });
                    }
                  }}
                  disabled={changeRoleMutation.isPending || !newRole}
                >
                  {changeRoleMutation.isPending ? 'Updating...' : 'Update Role'}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
