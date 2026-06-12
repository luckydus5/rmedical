import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserCog, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useFacilityStaff } from '@/hooks/useFacilities';
import { format } from 'date-fns';
import type { FacilityRole } from '@/types/medical';

interface Props {
  facilityId: string;
  currentUserRole: FacilityRole;
}

export default function FacilityStaffList({ facilityId, currentUserRole }: Props) {
  const { data: staff, isLoading } = useFacilityStaff(facilityId);
  const [searchTerm, setSearchTerm] = useState('');

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'facility_admin': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'doctor': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'nurse': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'receptionist': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredStaff = staff?.filter(s => 
    (s.profiles as any)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="animate-pulse">Loading staff...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Staff Members
        </CardTitle>
        <CardDescription>Healthcare providers at this facility</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {!filteredStaff?.length ? (
          <p className="text-center text-muted-foreground py-8">No staff members yet</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => {
                  const profile = member.profiles as any;
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{profile?.full_name || 'Unknown'}</p>
                          {profile?.phone && (
                            <p className="text-sm text-muted-foreground">{profile.phone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRoleColor(member.role)}>
                          {member.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{member.department || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(member.created_at), 'MMM d, yyyy')}
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
