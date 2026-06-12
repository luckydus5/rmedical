import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Activity, Search, UserCog } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export default function AdminPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Fetch all users with their roles
  const { data: usersWithRoles, isLoading } = useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Get profiles for these users
      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      return roles.map(role => ({
        ...role,
        profile: profiles?.find(p => p.user_id === role.user_id),
      }));
    },
  });

  // Fetch system stats
  const { data: stats } = useQuery({
    queryKey: ['admin_stats'],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: totalConditions },
        { count: totalVisits },
        { count: totalAccessLogs },
      ] = await Promise.all([
        supabase.from('user_roles').select('*', { count: 'exact', head: true }),
        supabase.from('medical_conditions').select('*', { count: 'exact', head: true }),
        supabase.from('visit_history').select('*', { count: 'exact', head: true }),
        supabase.from('access_logs').select('*', { count: 'exact', head: true }),
      ]);

      return {
        totalUsers: totalUsers || 0,
        totalConditions: totalConditions || 0,
        totalVisits: totalVisits || 0,
        totalAccessLogs: totalAccessLogs || 0,
      };
    },
  });

  // Fetch recent access logs
  const { data: recentLogs } = useQuery({
    queryKey: ['admin_access_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_logs')
        .select('*')
        .order('accessed_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Update user role mutation
  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      toast.success('Role updated successfully');
    },
    onError: () => {
      toast.error('Failed to update role');
    },
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'doctor': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'nurse': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const filteredUsers = usersWithRoles?.filter(user => 
    user.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <p className="text-muted-foreground">Manage users, roles, and system settings</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Activity className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats?.totalConditions || 0}</p>
              <p className="text-sm text-muted-foreground">Medical Records</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Activity className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats?.totalVisits || 0}</p>
              <p className="text-sm text-muted-foreground">Total Visits</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Shield className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{stats?.totalAccessLogs || 0}</p>
              <p className="text-sm text-muted-foreground">Access Events</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">
            <UserCog className="mr-2 h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Shield className="mr-2 h-4 w-4" />
            Access Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage user roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="animate-pulse">Loading users...</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Current Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.profile?.full_name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground font-mono">{user.user_id.substring(0, 8)}...</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(user.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value: AppRole) => 
                                updateRole.mutate({ userId: user.user_id, newRole: value })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="patient">Patient</SelectItem>
                                <SelectItem value="nurse">Nurse</SelectItem>
                                <SelectItem value="doctor">Doctor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>System Access Logs</CardTitle>
              <CardDescription>All record access events across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {!recentLogs?.length ? (
                <p className="text-center text-muted-foreground py-8">No access logs yet</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Accessor</TableHead>
                        <TableHead>Patient ID</TableHead>
                        <TableHead>Access Type</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {log.accessor_name || log.accessor_id?.substring(0, 8) || 'Unknown'}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {log.patient_id.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.access_type}</Badge>
                          </TableCell>
                          <TableCell>{log.resource_type}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(log.accessed_at), 'MMM d, h:mm a')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
