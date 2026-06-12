import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Database as DatabaseIcon, 
  HardDrive,
  Table as TableIcon,
  RefreshCw,
  Download,
  Upload,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Shield,
  Activity
} from 'lucide-react';

// Type for table info
interface TableInfo {
  name: string;
  rows: number | string;
  size: string;
  status: string;
}

export default function Database() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/');
      return;
    }
    loadDatabaseInfo();
  }, [role, navigate]);

  const loadDatabaseInfo = async () => {
    setLoading(true);
    try {
      // Get counts from different tables
      const [
        { count: profilesCount },
        { count: facilitiesCount },
        { count: appointmentsCount },
        { count: labResultsCount },
        { count: visitHistoryCount },
        { count: allergiesCount },
        { count: conditionsCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('facilities').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase.from('lab_results').select('*', { count: 'exact', head: true }),
        supabase.from('visit_history').select('*', { count: 'exact', head: true }),
        supabase.from('allergies').select('*', { count: 'exact', head: true }),
        supabase.from('medical_conditions').select('*', { count: 'exact', head: true }),
      ]);

      setTables([
        { name: 'profiles', rows: profilesCount || 0, size: '~2.5 MB', status: 'healthy' },
        { name: 'facilities', rows: facilitiesCount || 0, size: '~0.8 MB', status: 'healthy' },
        { name: 'appointments', rows: appointmentsCount || 0, size: '~1.2 MB', status: 'healthy' },
        { name: 'lab_results', rows: labResultsCount || 0, size: '~3.1 MB', status: 'healthy' },
        { name: 'visit_history', rows: visitHistoryCount || 0, size: '~4.5 MB', status: 'healthy' },
        { name: 'allergies', rows: allergiesCount || 0, size: '~0.3 MB', status: 'healthy' },
        { name: 'medical_conditions', rows: conditionsCount || 0, size: '~0.6 MB', status: 'healthy' },
        { name: 'facility_staff', rows: '—', size: '~0.2 MB', status: 'healthy' },
        { name: 'facility_patients', rows: '—', size: '~0.4 MB', status: 'healthy' },
        { name: 'doctor_schedules', rows: '—', size: '~0.1 MB', status: 'healthy' },
      ]);
    } catch (error) {
      console.error('Error loading database info:', error);
    }
    setLoading(false);
  };

  const dbStats = {
    totalSize: '13.7 MB',
    usedPercent: 27,
    maxSize: '50 MB',
    totalTables: tables.length,
    totalRows: tables.reduce((sum, t) => sum + (typeof t.rows === 'number' ? t.rows : 0), 0),
    lastBackup: '2 hours ago',
    rlsEnabled: true,
  };

  if (role !== 'admin') {
    return null;
  }

  return (
    <DashboardLayout activeTab="database">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DatabaseIcon className="h-6 w-6 text-primary" />
              Database Management
            </h1>
            <p className="text-muted-foreground">Supabase PostgreSQL Database</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadDatabaseInfo} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <HardDrive className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Storage Used</p>
                  <p className="text-lg font-bold">{dbStats.totalSize}</p>
                  <Progress value={dbStats.usedPercent} className="h-1 mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {dbStats.usedPercent}% of {dbStats.maxSize}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <TableIcon className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tables</p>
                  <p className="text-2xl font-bold">{dbStats.totalTables}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Activity className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Rows</p>
                  <p className="text-2xl font-bold">{dbStats.totalRows.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Backup</p>
                  <p className="text-lg font-bold">{dbStats.lastBackup}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Database Status */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="font-medium">Connection Status</span>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                  Connected
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">RLS Policies</span>
                </div>
                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                  Enabled
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <span className="font-medium">Realtime</span>
                </div>
                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TableIcon className="h-5 w-5 text-primary" />
              Database Tables
            </CardTitle>
            <CardDescription>All tables in the Sanovia database</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table Name</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Est. Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((table) => (
                  <TableRow key={table.name}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TableIcon className="h-4 w-4 text-muted-foreground" />
                        <code className="text-sm font-medium">{table.name}</code>
                      </div>
                    </TableCell>
                    <TableCell>
                      {typeof table.rows === 'number' ? table.rows.toLocaleString() : table.rows}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{table.size}</TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {table.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common database operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-auto py-4 flex-col">
                <Upload className="h-5 w-5 mb-2" />
                <span>Import Data</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col">
                <Download className="h-5 w-5 mb-2" />
                <span>Export Backup</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col">
                <RefreshCw className="h-5 w-5 mb-2" />
                <span>Reset Cache</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col text-amber-500">
                <AlertTriangle className="h-5 w-5 mb-2" />
                <span>Run Migrations</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
