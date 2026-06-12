import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Lock, 
  Shield,
  Users,
  Key,
  Eye,
  Edit,
  Trash2,
  Plus,
  CheckCircle2,
  XCircle,
  Settings,
  UserCog,
  Building2,
  FileText,
  Activity
} from 'lucide-react';

export default function AccessControl() {
  const { role } = useAuth();
  const navigate = useNavigate();

  if (role !== 'admin') {
    navigate('/');
    return null;
  }

  const roles = [
    {
      id: 1,
      name: 'System Admin',
      description: 'Full system access across all facilities',
      users: 2,
      permissions: ['all'],
      color: 'purple',
    },
    {
      id: 2,
      name: 'Facility Admin',
      description: 'Full control of assigned facility',
      users: 5,
      permissions: ['manage_facility_staff', 'manage_facility_patients', 'view_patients', 'edit_records', 'prescriptions', 'appointments', 'register_patients', 'edit_vitals', 'view_schedule', 'edit_lab_results', 'view_records', 'manage_facility'],
      color: 'indigo',
    },
    {
      id: 3,
      name: 'Doctor',
      description: 'Medical records and patient care',
      users: 15,
      permissions: ['view_patients', 'edit_records', 'prescriptions', 'appointments'],
      color: 'blue',
    },
    {
      id: 4,
      name: 'Nurse',
      description: 'Patient care and vitals',
      users: 28,
      permissions: ['view_patients', 'edit_vitals', 'appointments'],
      color: 'emerald',
    },
    {
      id: 5,
      name: 'Receptionist',
      description: 'Scheduling and registration',
      users: 12,
      permissions: ['register_patients', 'appointments', 'view_schedule'],
      color: 'amber',
    },
    {
      id: 6,
      name: 'Lab Technician',
      description: 'Lab results and tests',
      users: 8,
      permissions: ['view_patients', 'edit_lab_results', 'view_records'],
      color: 'cyan',
    },
  ];

  const permissions = [
    { id: 'view_patients', name: 'View Patients', category: 'Patients' },
    { id: 'register_patients', name: 'Register Patients', category: 'Patients' },
    { id: 'edit_records', name: 'Edit Medical Records', category: 'Records' },
    { id: 'view_records', name: 'View Records', category: 'Records' },
    { id: 'prescriptions', name: 'Write Prescriptions', category: 'Records' },
    { id: 'edit_vitals', name: 'Edit Vitals', category: 'Records' },
    { id: 'edit_lab_results', name: 'Edit Lab Results', category: 'Lab' },
    { id: 'appointments', name: 'Manage Appointments', category: 'Scheduling' },
    { id: 'view_schedule', name: 'View Schedule', category: 'Scheduling' },
    { id: 'manage_facility_staff', name: 'Manage Facility Staff', category: 'Admin' },
    { id: 'manage_facility_patients', name: 'Manage Facility Patients', category: 'Admin' },
    { id: 'manage_facility', name: 'Facility Settings', category: 'Admin' },
    { id: 'manage_staff', name: 'Manage All Staff', category: 'System' },
    { id: 'manage_facilities', name: 'Manage All Facilities', category: 'System' },
    { id: 'system_settings', name: 'System Settings', category: 'System' },
  ];

  return (
    <DashboardLayout activeTab="access-control">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Lock className="h-6 w-6 text-primary" />
              Access Control
            </h1>
            <p className="text-muted-foreground">Manage roles and permissions</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{roles.length}</p>
                  <p className="text-xs text-muted-foreground">Roles</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Key className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{permissions.length}</p>
                  <p className="text-xs text-muted-foreground">Permissions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{roles.reduce((a, r) => a + r.users, 0)}</p>
                  <p className="text-xs text-muted-foreground">Assigned Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Activity className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">RLS</p>
                  <p className="text-xs text-muted-foreground">Row Level Security</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Roles Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              System Roles
            </CardTitle>
            <CardDescription>Define what each role can access</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`bg-${role.color}-500/10 text-${role.color}-500 border-${role.color}-500/30`}
                      >
                        {role.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {role.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {role.users}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((perm) => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {perm === 'all' ? 'Full Access' : perm.replace('_', ' ')}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{role.permissions.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {role.name !== 'Administrator' && (
                          <Button variant="ghost" size="icon" className="text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Permissions Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Permissions Matrix
            </CardTitle>
            <CardDescription>Overview of role permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background">Permission</TableHead>
                    {roles.map((role) => (
                      <TableHead key={role.id} className="text-center">
                        {role.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((perm) => (
                    <TableRow key={perm.id}>
                      <TableCell className="sticky left-0 bg-background font-medium">
                        <div>
                          <p>{perm.name}</p>
                          <p className="text-xs text-muted-foreground">{perm.category}</p>
                        </div>
                      </TableCell>
                      {roles.map((role) => {
                        const hasPermission = role.permissions.includes('all') || role.permissions.includes(perm.id);
                        return (
                          <TableCell key={role.id} className="text-center">
                            {hasPermission ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
