import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Download,
  Calendar,
  Building2,
  Users,
  Activity,
  FileCheck,
  Clock,
  TrendingUp,
  BarChart3,
  PieChart,
  Filter
} from 'lucide-react';

export default function Reports() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [reportType, setReportType] = useState('all');

  if (role !== 'admin') {
    navigate('/');
    return null;
  }

  const reports = [
    {
      id: 1,
      name: 'Facility Performance Report',
      description: 'Overview of all facility metrics and performance indicators',
      type: 'facilities',
      icon: Building2,
      color: 'primary',
      lastGenerated: '2 hours ago',
      status: 'ready',
    },
    {
      id: 2,
      name: 'User Activity Report',
      description: 'Detailed user engagement and activity statistics',
      type: 'users',
      icon: Users,
      color: 'emerald',
      lastGenerated: '1 day ago',
      status: 'ready',
    },
    {
      id: 3,
      name: 'Appointment Analytics',
      description: 'Appointment trends, completion rates, and scheduling patterns',
      type: 'appointments',
      icon: Calendar,
      color: 'blue',
      lastGenerated: '3 hours ago',
      status: 'ready',
    },
    {
      id: 4,
      name: 'System Health Report',
      description: 'Infrastructure performance and uptime statistics',
      type: 'system',
      icon: Activity,
      color: 'amber',
      lastGenerated: '30 minutes ago',
      status: 'ready',
    },
    {
      id: 5,
      name: 'Compliance Report',
      description: 'Data protection and regulatory compliance status',
      type: 'compliance',
      icon: FileCheck,
      color: 'purple',
      lastGenerated: '1 week ago',
      status: 'pending',
    },
    {
      id: 6,
      name: 'Growth Analytics',
      description: 'Platform growth metrics and trend analysis',
      type: 'growth',
      icon: TrendingUp,
      color: 'cyan',
      lastGenerated: '5 hours ago',
      status: 'ready',
    },
  ];

  const filteredReports = reportType === 'all' 
    ? reports 
    : reports.filter(r => r.type === reportType);

  const ReportCard = ({ report }: { report: typeof reports[0] }) => {
    const Icon = report.icon;
    return (
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl bg-${report.color}-500/10`}>
              <Icon className={`h-6 w-6 text-${report.color}-500`} />
            </div>
            <Badge 
              variant="outline" 
              className={report.status === 'ready' 
                ? 'text-emerald-500 border-emerald-500/30' 
                : 'text-amber-500 border-amber-500/30'
              }
            >
              {report.status === 'ready' ? 'Ready' : 'Generating...'}
            </Badge>
          </div>
          <h3 className="font-semibold mb-1">{report.name}</h3>
          <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {report.lastGenerated}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <BarChart3 className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout activeTab="reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Reports
            </h1>
            <p className="text-muted-foreground">Generate and download platform reports</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter reports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="facilities">Facilities</SelectItem>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="appointments">Appointments</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Generate New Report
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{reports.length}</p>
                  <p className="text-xs text-muted-foreground">Available Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <FileCheck className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{reports.filter(r => r.status === 'ready').length}</p>
                  <p className="text-xs text-muted-foreground">Ready to Download</p>
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
                  <p className="text-2xl font-bold">{reports.filter(r => r.status === 'pending').length}</p>
                  <p className="text-xs text-muted-foreground">Generating</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Download className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">24</p>
                  <p className="text-xs text-muted-foreground">Downloads (30d)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>

        {filteredReports.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No reports found for this category</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
