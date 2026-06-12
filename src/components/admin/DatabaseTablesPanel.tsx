import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Database, Search, RefreshCw, Users, Building2, FileText, Heart, Pill, AlertTriangle, TestTube, Calendar, Shield, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

type TableName = 'profiles' | 'user_roles' | 'facilities' | 'facility_staff' | 'facility_patients' | 'medical_conditions' | 'medications' | 'allergies' | 'lab_results' | 'visit_history' | 'emergency_contacts' | 'access_grants' | 'access_logs';

const TABLES: { name: TableName; label: string; icon: React.ReactNode; description: string }[] = [
  { name: 'profiles', label: 'Profiles', icon: <Users className="h-4 w-4" />, description: 'User profile information' },
  { name: 'user_roles', label: 'User Roles', icon: <Shield className="h-4 w-4" />, description: 'User role assignments' },
  { name: 'facilities', label: 'Facilities', icon: <Building2 className="h-4 w-4" />, description: 'Healthcare facilities' },
  { name: 'facility_staff', label: 'Facility Staff', icon: <Users className="h-4 w-4" />, description: 'Staff assignments' },
  { name: 'facility_patients', label: 'Facility Patients', icon: <Users className="h-4 w-4" />, description: 'Patient registrations' },
  { name: 'medical_conditions', label: 'Medical Conditions', icon: <Heart className="h-4 w-4" />, description: 'Diagnosed conditions' },
  { name: 'medications', label: 'Medications', icon: <Pill className="h-4 w-4" />, description: 'Patient medications' },
  { name: 'allergies', label: 'Allergies', icon: <AlertTriangle className="h-4 w-4" />, description: 'Patient allergies' },
  { name: 'lab_results', label: 'Lab Results', icon: <TestTube className="h-4 w-4" />, description: 'Laboratory results' },
  { name: 'visit_history', label: 'Visit History', icon: <Calendar className="h-4 w-4" />, description: 'Patient visits' },
  { name: 'emergency_contacts', label: 'Emergency Contacts', icon: <Users className="h-4 w-4" />, description: 'Emergency contact info' },
  { name: 'access_grants', label: 'Access Grants', icon: <Key className="h-4 w-4" />, description: 'Record sharing grants' },
  { name: 'access_logs', label: 'Access Logs', icon: <FileText className="h-4 w-4" />, description: 'Record access audit log' },
];

export default function DatabaseTablesPanel() {
  const [activeTable, setActiveTable] = useState<TableName>('profiles');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch table data
  const { data: tableData, isLoading, refetch } = useQuery({
    queryKey: ['admin_table_data', activeTable],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(activeTable)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch table counts
  const { data: tableCounts } = useQuery({
    queryKey: ['admin_table_counts'],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      
      for (const table of TABLES) {
        const { count, error } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          counts[table.name] = count || 0;
        }
      }
      
      return counts;
    },
  });

  const formatCellValue = (value: any, key: string): string => {
    if (value === null || value === undefined) return '-';
    
    // Format dates
    if (key.includes('_at') || key.includes('date') || key === 'created_at' || key === 'updated_at') {
      try {
        return format(new Date(value), 'MMM d, yyyy h:mm a');
      } catch {
        return String(value);
      }
    }
    
    // Truncate long strings
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    
    // Format booleans
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    // Format objects/arrays
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  const getColumns = (data: any[]): string[] => {
    if (!data || data.length === 0) return [];
    // Prioritize important columns first
    const priorityColumns = ['id', 'user_id', 'patient_id', 'full_name', 'name', 'email', 'role', 'status', 'created_at'];
    const allColumns = Object.keys(data[0]);
    
    return [
      ...priorityColumns.filter(col => allColumns.includes(col)),
      ...allColumns.filter(col => !priorityColumns.includes(col)),
    ];
  };

  const filteredData = tableData?.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const columns = getColumns(tableData || []);
  const activeTableInfo = TABLES.find(t => t.name === activeTable);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Database className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Database Tables</h2>
          <p className="text-muted-foreground">View and manage all system data</p>
        </div>
      </div>

      {/* Table Stats Overview */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        {TABLES.slice(0, 7).map(table => (
          <Card 
            key={table.name}
            className={`cursor-pointer transition-all ${activeTable === table.name ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
            onClick={() => setActiveTable(table.name)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className={`${activeTable === table.name ? 'text-primary' : 'text-muted-foreground'}`}>
                  {table.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{table.label}</p>
                  <p className="text-lg font-bold">{tableCounts?.[table.name] || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Selector */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-primary">
                {activeTableInfo?.icon}
              </div>
              <div>
                <CardTitle className="text-lg">{activeTableInfo?.label}</CardTitle>
                <CardDescription>{activeTableInfo?.description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Table Tabs */}
          <ScrollArea className="w-full">
            <div className="flex gap-1 pb-4">
              {TABLES.map(table => (
                <Button
                  key={table.name}
                  variant={activeTable === table.name ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTable(table.name)}
                  className="flex-shrink-0"
                >
                  {table.icon}
                  <span className="ml-2">{table.label}</span>
                  <Badge variant="secondary" className="ml-2">
                    {tableCounts?.[table.name] || 0}
                  </Badge>
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Data Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-muted-foreground">Loading data...</div>
            </div>
          ) : !filteredData?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No records found</p>
              <p className="text-sm text-muted-foreground/70">
                {searchTerm ? 'Try adjusting your search' : `The ${activeTableInfo?.label} table is empty`}
              </p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map(column => (
                        <TableHead key={column} className="whitespace-nowrap">
                          {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((row, idx) => (
                      <TableRow key={row.id || idx}>
                        {columns.map(column => (
                          <TableCell key={column} className="font-mono text-xs">
                            {column === 'id' || column === 'user_id' || column === 'patient_id' || column === 'facility_id' ? (
                              <span className="text-muted-foreground">
                                {String(row[column]).substring(0, 8)}...
                              </span>
                            ) : column === 'role' || column === 'status' || column === 'facility_type' ? (
                              <Badge variant="outline" className="capitalize">
                                {formatCellValue(row[column], column)}
                              </Badge>
                            ) : (
                              formatCellValue(row[column], column)
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}

          {filteredData && filteredData.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredData.length} of {tableCounts?.[activeTable] || 0} records (limited to 100)
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
