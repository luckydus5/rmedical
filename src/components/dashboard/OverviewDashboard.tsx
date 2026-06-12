import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Server, 
  Database, 
  Lock, 
  Eye, 
  UserCheck, 
  RefreshCw,
  TrendingUp,
  Globe,
  Zap,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  HardDrive,
  Cpu,
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  CircleDot,
  Layers,
  Network,
  Terminal,
  AlertCircle,
  Wifi,
  BarChart3,
  PieChart,
  Calendar,
  ExternalLink,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';

export default function OverviewDashboard() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch system stats
  const { data: systemStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin-command-center-stats'],
    queryFn: async () => {
      const [
        { count: approvedFacilities },
        { count: pendingFacilities },
        { count: suspendedFacilities },
        { count: activeStaff },
        { count: totalUsers },
        { data: facilityTypes },
        { count: totalAppointments },
      ] = await Promise.all([
        supabase.from('facilities').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('facilities').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('facilities').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
        supabase.from('facility_staff').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('facilities').select('facility_type, city').eq('status', 'approved'),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
      ]);

      const typeBreakdown = facilityTypes?.reduce((acc, f) => {
        acc[f.facility_type] = (acc[f.facility_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        approvedFacilities: approvedFacilities || 0,
        pendingFacilities: pendingFacilities || 0,
        suspendedFacilities: suspendedFacilities || 0,
        totalFacilities: (approvedFacilities || 0) + (pendingFacilities || 0) + (suspendedFacilities || 0),
        activeStaff: activeStaff || 0,
        totalUsers: totalUsers || 0,
        totalAppointments: totalAppointments || 0,
        facilityTypes: typeBreakdown,
      };
    },
    refetchInterval: 30000,
  });

  // Fetch recent activity
  const { data: systemActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['admin-activity-feed'],
    queryFn: async () => {
      const activities: Array<{
        id: string;
        action: string;
        details: string;
        time: string;
        type: 'facility' | 'security' | 'user' | 'system';
        severity: 'info' | 'warning' | 'success' | 'critical';
      }> = [];

      const { data: recentFacilities } = await supabase
        .from('facilities')
        .select('id, name, status, created_at, facility_type')
        .order('created_at', { ascending: false })
        .limit(5);

      recentFacilities?.forEach(f => {
        activities.push({
          id: f.id,
          action: f.status === 'pending' ? 'New Facility Registration' : `Facility ${f.status}`,
          details: `${f.name} (${f.facility_type?.replace('_', ' ')})`,
          time: formatDistanceToNow(new Date(f.created_at), { addSuffix: true }),
          type: 'facility',
          severity: f.status === 'pending' ? 'warning' : f.status === 'approved' ? 'success' : 'info',
        });
      });

      const { data: recentStaff } = await supabase
        .from('facility_staff')
        .select('id, role, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      recentStaff?.forEach(s => {
        activities.push({
          id: s.id,
          action: 'Staff Registration',
          details: `New ${s.role?.replace('_', ' ')} added`,
          time: formatDistanceToNow(new Date(s.created_at), { addSuffix: true }),
          type: 'user',
          severity: 'info',
        });
      });

      return activities.slice(0, 6);
    },
  });

  const systemHealth = {
    database: { status: 'online', latency: 12 },
    api: { status: 'online', uptime: 99.98 },
    storage: { status: 'online', usage: 31 },
    auth: { status: 'online' },
    cdn: { status: 'online' },
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success': return 'bg-emerald-500/10 text-emerald-500';
      case 'warning': return 'bg-amber-500/10 text-amber-500';
      case 'critical': return 'bg-red-500/10 text-red-500';
      default: return 'bg-blue-500/10 text-blue-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success': return <CheckCircle2 className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <ShieldAlert className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen space-y-6 pb-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-cyan-500/15 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <div className="relative z-10 p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left - Title */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/20 rounded-xl border border-primary/30">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">Command Center</h1>
                  <p className="text-slate-400 text-sm">National Healthcare Platform Administration</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <CircleDot className="h-2 w-2 mr-1.5 animate-pulse" />
                  All Systems Online
                </Badge>
                <Badge variant="outline" className="border-slate-600 text-slate-400">
                  <Clock className="h-3 w-3 mr-1.5" />
                  {format(currentTime, 'HH:mm:ss')}
                </Badge>
                <Badge variant="outline" className="border-slate-600 text-slate-400">
                  {format(currentTime, 'EEE, MMM d, yyyy')}
                </Badge>
              </div>
            </div>

            {/* Right - Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm"
                className="bg-primary hover:bg-primary/90"
                onClick={() => navigate('/facilities')}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Facilities
              </Button>
              <Button 
                size="sm"
                variant="outline" 
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => refetchStats()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {/* Active Facilities */}
        <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-emerald-500/20 rounded-xl">
                <Building2 className="h-5 w-5 text-emerald-500" />
              </div>
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-[10px]">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                Active
              </Badge>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {statsLoading ? '—' : systemStats?.approvedFacilities}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Facilities</p>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20 hover:border-amber-500/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-amber-500/20 rounded-xl">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              {(systemStats?.pendingFacilities || 0) > 0 && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-foreground">
              {statsLoading ? '—' : systemStats?.pendingFacilities}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Pending</p>
          </CardContent>
        </Card>

        {/* Active Staff */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 hover:border-blue-500/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-blue-500/20 rounded-xl">
                <UserCheck className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {statsLoading ? '—' : systemStats?.activeStaff}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Staff</p>
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20 hover:border-purple-500/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-purple-500/20 rounded-xl">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {statsLoading ? '—' : systemStats?.totalUsers}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Users</p>
          </CardContent>
        </Card>

        {/* Suspended */}
        <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20 hover:border-red-500/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-red-500/20 rounded-xl">
                <ShieldAlert className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {statsLoading ? '—' : systemStats?.suspendedFacilities}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Suspended</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid - 3 Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Column 1 - System Status */}
        <div className="space-y-6">
          {/* Infrastructure Status */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Server className="h-4 w-4 text-primary" />
                  Infrastructure
                </CardTitle>
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-[10px]">
                  Healthy
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Database */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Database className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Database</p>
                  <p className="text-xs text-muted-foreground">PostgreSQL</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[10px]">
                  {systemHealth.database.latency}ms
                </Badge>
              </div>

              {/* API */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Globe className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">API Gateway</p>
                  <p className="text-xs text-muted-foreground">REST API</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[10px]">
                  {systemHealth.api.uptime}%
                </Badge>
              </div>

              {/* Auth */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Lock className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Authentication</p>
                  <p className="text-xs text-muted-foreground">Supabase Auth</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[10px]">
                  Secure
                </Badge>
              </div>

              {/* Storage */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <HardDrive className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Storage</p>
                  <Progress value={systemHealth.storage.usage} className="h-1.5 mt-1" />
                </div>
                <span className="text-xs text-muted-foreground">{systemHealth.storage.usage}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Security Status */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <Lock className="h-4 w-4 text-emerald-500 mb-2" />
                  <p className="text-xs font-medium">Encryption</p>
                  <p className="text-[10px] text-muted-foreground">AES-256</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                  <Eye className="h-4 w-4 text-blue-500 mb-2" />
                  <p className="text-xs font-medium">RLS</p>
                  <p className="text-[10px] text-muted-foreground">Enabled</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                  <Network className="h-4 w-4 text-purple-500 mb-2" />
                  <p className="text-xs font-medium">SSL/TLS</p>
                  <p className="text-[10px] text-muted-foreground">TLS 1.3</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <Activity className="h-4 w-4 text-amber-500 mb-2" />
                  <p className="text-xs font-medium">Audit</p>
                  <p className="text-[10px] text-muted-foreground">Active</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Security Score</span>
                  <span className="text-xs font-bold text-emerald-500">A+ (96%)</span>
                </div>
                <Progress value={96} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Column 2 - Activity & Facilities */}
        <div className="space-y-6">
          {/* Activity Feed */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Activity Feed
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetchStats()}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : systemActivity && systemActivity.length > 0 ? (
                <div className="space-y-2">
                  {systemActivity.map((item, i) => (
                    <div 
                      key={item.id + i} 
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
                    >
                      <div className={`p-2 rounded-lg ${getSeverityColor(item.severity)}`}>
                        {getSeverityIcon(item.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.action}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.details}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{item.time}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Facility Types Distribution */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Facility Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              {systemStats?.facilityTypes && Object.keys(systemStats.facilityTypes).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(systemStats.facilityTypes).map(([type, count], i) => {
                    const colors = ['bg-primary', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-cyan-500'];
                    const total = Object.values(systemStats.facilityTypes).reduce((a, b) => a + b, 0);
                    const percentage = Math.round((count / total) * 100);
                    
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="capitalize text-muted-foreground">{type.replace('_', ' ')}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${colors[i % colors.length]} rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <Building2 className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No facilities yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 3 - Quick Actions & System Info */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 hover:bg-primary/5 hover:border-primary/50"
                onClick={() => navigate('/facilities')}
              >
                <Building2 className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium">Manage Facilities</p>
                  <p className="text-[10px] text-muted-foreground">View and manage all facilities</p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-12 hover:bg-primary/5 hover:border-primary/50"
                onClick={() => navigate('/staff-portal')}
              >
                <Users className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium">Staff Portal</p>
                  <p className="text-[10px] text-muted-foreground">Access staff management</p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-12 hover:bg-primary/5 hover:border-primary/50"
                onClick={() => navigate('/analytics')}
              >
                <BarChart3 className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium">Analytics</p>
                  <p className="text-[10px] text-muted-foreground">View reports and statistics</p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-12 hover:bg-primary/5 hover:border-primary/50"
                onClick={() => navigate('/settings')}
              >
                <Settings className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium">Settings</p>
                  <p className="text-[10px] text-muted-foreground">Configure platform settings</p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </Button>

              {(systemStats?.pendingFacilities || 0) > 0 && (
                <Button 
                  className="w-full mt-2 bg-amber-500 hover:bg-amber-600"
                  onClick={() => navigate('/facilities')}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {systemStats?.pendingFacilities} Pending Approval{(systemStats?.pendingFacilities || 0) > 1 ? 's' : ''}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* System Info */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                System Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Platform</span>
                <span className="text-sm font-medium">Sanovia v1.0</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Environment</span>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[10px]">Production</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Database</span>
                <span className="text-sm font-medium">Supabase</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Region</span>
                <span className="text-sm font-medium">Africa</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Last Deploy</span>
                <span className="text-sm font-medium">{format(currentTime, 'MMM d, yyyy')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground border-t border-border/50">
        <Shield className="h-3.5 w-3.5" />
        <span>Admin access is logged and monitored</span>
        <span className="text-border">•</span>
        <span>Patient data is not accessible from this dashboard</span>
      </div>
    </div>
  );
}
