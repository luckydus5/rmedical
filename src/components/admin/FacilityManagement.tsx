import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Plus, Check, X, Users, MapPin, Phone, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFacilities, useApproveFacility, useCreateFacility } from '@/hooks/useFacilities';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { FacilityType } from '@/types/medical';

export default function FacilityManagement() {
  const { role } = useAuth();
  const { data: facilities, isLoading } = useFacilities();
  const approveFacility = useApproveFacility();
  const createFacility = useCreateFacility();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    facility_type: 'clinic' as FacilityType,
    address: '',
    city: '',
    phone: '',
    email: '',
    license_number: '',
  });

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createFacility.mutateAsync(formData);
      toast.success('Facility registration submitted for approval');
      setOpen(false);
      setFormData({
        name: '',
        facility_type: 'clinic',
        address: '',
        city: '',
        phone: '',
        email: '',
        license_number: '',
      });
    } catch (error) {
      toast.error('Failed to register facility');
    }
  };

  const handleApprove = async (facilityId: string) => {
    try {
      await approveFacility.mutateAsync(facilityId);
      toast.success('Facility approved');
    } catch (error) {
      toast.error('Failed to approve facility');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'suspended': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    return <Building2 className="h-4 w-4" />;
  };

  const filteredFacilities = facilities?.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingFacilities = filteredFacilities?.filter(f => f.status === 'pending') || [];
  const approvedFacilities = filteredFacilities?.filter(f => f.status === 'approved') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Facility Management</h2>
            <p className="text-muted-foreground">Manage hospitals, clinics, and health centers</p>
          </div>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Register Facility
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Register New Facility</DialogTitle>
              <DialogDescription>Submit your facility for approval</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateFacility} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Facility Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., City General Hospital"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facility_type">Facility Type</Label>
                <Select 
                  value={formData.facility_type} 
                  onValueChange={(v: FacilityType) => setFormData({ ...formData, facility_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Kigali"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+250 xxx xxx xxx"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@facility.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license_number">License Number</Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  placeholder="MOH-XXXX-XXXX"
                />
              </div>
              <Button type="submit" className="w-full" disabled={createFacility.isPending}>
                {createFacility.isPending ? 'Submitting...' : 'Submit for Approval'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search facilities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="approved">
        <TabsList>
          <TabsTrigger value="approved">
            Approved ({approvedFacilities.length})
          </TabsTrigger>
          {role === 'admin' && (
            <TabsTrigger value="pending">
              Pending Approval ({pendingFacilities.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="approved">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="animate-pulse">Loading facilities...</div>
              ) : !approvedFacilities.length ? (
                <p className="text-center text-muted-foreground py-8">No approved facilities yet</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {approvedFacilities.map((facility) => (
                    <Card key={facility.id} className="border-border/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="capitalize">
                            {facility.facility_type.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(facility.status)}>
                            {facility.status}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg mt-2">{facility.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {facility.city && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {facility.city}, {facility.country}
                          </div>
                        )}
                        {facility.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            {facility.phone}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {role === 'admin' && (
          <TabsContent value="pending">
            <Card>
              <CardContent className="pt-6">
                {!pendingFacilities.length ? (
                  <p className="text-center text-muted-foreground py-8">No pending facilities</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Facility</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>License</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingFacilities.map((facility) => (
                        <TableRow key={facility.id}>
                          <TableCell className="font-medium">{facility.name}</TableCell>
                          <TableCell className="capitalize">{facility.facility_type.replace('_', ' ')}</TableCell>
                          <TableCell>{facility.city}</TableCell>
                          <TableCell>{facility.license_number || '-'}</TableCell>
                          <TableCell>{format(new Date(facility.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(facility.id)}
                                disabled={approveFacility.isPending}
                              >
                                <Check className="mr-1 h-4 w-4" />
                                Approve
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
