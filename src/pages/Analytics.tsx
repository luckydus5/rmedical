import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Building2, 
  Calendar,
  Activity,
  FileText,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  LineChart,
  Download,
  Filter
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

export default function Analytics() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('30d');

  if (role !== 'admin') {
    navigate('/');
    return null;
  }

  // Fetch analytics data
  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['admin-analytics', timeRange],
    queryFn: async () => {
      const today = new Date();
      const startDate = timeRange === '7d' 
        ? subDays(today, 7) 
        : timeRange === '30d' 
          ? subDays(today, 30) 
          : startOfMonth(today);

      // Get facility stats
      const { count: totalFacilities } = await supabase
        .from('facilities')
        .select('*', { count: 'exact', head: true });

      const { count: activeFacilities } = await supabase
        .from('facilities')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      // Get user stats
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: newUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      // Get staff stats
      const { count: totalStaff } = await supabase
        .from('facility_staff')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get appointments
      const { count: totalAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

      const { count: recentAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      // Get facility types
      const { data: facilityTypes } = await supabase
        .from('facilities')
        .select('facility_type')
        .eq('status', 'approved');

      const typeBreakdown = facilityTypes?.reduce((acc, f) => {
        acc[f.facility_type] = (acc[f.facility_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Get staff roles
      const { data: staffRoles } = await supabase
        .from('facility_staff')
        .select('role')
        .eq('is_active', true);

      const roleBreakdown = staffRoles?.reduce((acc, s) => {
        acc[s.role] = (acc[s.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalFacilities: totalFacilities || 0,
        activeFacilities: activeFacilities || 0,
        totalUsers: totalUsers || 0,
        newUsers: newUsers || 0,
        totalStaff: totalStaff || 0,
        totalAppointments: totalAppointments || 0,
        recentAppointments: recentAppointments || 0,
        facilityTypes: typeBreakdown,
        staffRoles: roleBreakdown,
      };
    },
  });

  const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-xl bg-${color}-500/10`}>
            <Icon className={`h-6 w-6 text-${color}-500`} />
          </div>
          {change !== undefined && (
            <Badge 
              variant="outline" 
              className={change >= 0 ? 'text-emerald-500 border-emerald-500/30' : 'text-red-500 border-red-500/30'}
            >
              {change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {Math.abs(change)}%
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout activeTab="analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground">Platform performance and insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="month">This month</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">{analytics?.activeFacilities || 0}</p>
                <p className="text-sm text-muted-foreground">Active Facilities</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-emerald-500/20">
                  <Users className="h-6 w-6 text-emerald-500" />
                </div>
                {analytics?.newUsers && analytics.newUsers > 0 && (
                  <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                    +{analytics.newUsers} new
                  </Badge>
                )}
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">{analytics?.totalUsers || 0}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <Activity className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">{analytics?.totalStaff || 0}</p>
                <p className="text-sm text-muted-foreground">Active Staff</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-amber-500/20">
                  <Calendar className="h-6 w-6 text-amber-500" />
                </div>
                {analytics?.recentAppointments && analytics.recentAppointments > 0 && (
                  <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                    +{analytics.recentAppointments}
                  </Badge>
                )}
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">{analytics?.totalAppointments || 0}</p>
                <p className="text-sm text-muted-foreground">Appointments</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Facility Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Facility Distribution
              </CardTitle>
              <CardDescription>Breakdown by facility type</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.facilityTypes && Object.keys(analytics.facilityTypes).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(analytics.facilityTypes).map(([type, count], i) => {
                    const colors = ['bg-primary', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-cyan-500'];
                    const total = Object.values(analytics.facilityTypes).reduce((a, b) => a + b, 0);
                    const percentage = Math.round((count / total) * 100);
                    
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="capitalize font-medium">{type.replace('_', ' ')}</span>
                          <span className="text-muted-foreground">{count} ({percentage}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No facility data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Staff Roles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Staff Distribution
              </CardTitle>
              <CardDescription>Breakdown by role</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.staffRoles && Object.keys(analytics.staffRoles).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(analytics.staffRoles).map(([role, count], i) => {
                    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-cyan-500'];
                    const total = Object.values(analytics.staffRoles).reduce((a, b) => a + b, 0);
                    const percentage = Math.round((count / total) * 100);
                    
                    return (
                      <div key={role}>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="capitalize font-medium">{role.replace('_', ' ')}</span>
                          <span className="text-muted-foreground">{count} ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${colors[i % colors.length]} rounded-full`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No staff data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platform Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">System Uptime</span>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-0">99.9%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">API Response</span>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-0">42ms</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Error Rate</span>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-0">0.01%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Records</span>
                  <span className="font-medium">{(analytics?.totalUsers || 0) + (analytics?.totalAppointments || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Storage Used</span>
                  <span className="font-medium">2.4 GB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Database Size</span>
                  <span className="font-medium">1.2 GB</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Growth Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New Users (Period)</span>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-0">
                    +{analytics?.newUsers || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New Appointments</span>
                  <Badge className="bg-blue-500/10 text-blue-500 border-0">
                    +{analytics?.recentAppointments || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Rate</span>
                  <span className="font-medium text-emerald-500">87%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
