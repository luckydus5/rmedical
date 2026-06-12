import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  FileText,
  Search,
  RefreshCw,
  Activity,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Download,
  Hash,
} from 'lucide-react';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface AuditLogRow {
  id: number;
  occurred_at: string;
  actor_user_id: string | null;
  actor_role: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  target_patient_id: string | null;
  facility_id: string | null;
  ip_address: string | null;
  metadata: Record<string, unknown>;
  prev_hash: string | null;
  entry_hash: string;
}

const severityFor = (action: string): 'info' | 'success' | 'warning' | 'danger' => {
  if (action.startsWith('record.delete') || action.includes('revoke') || action.includes('failed')) return 'danger';
  if (action.startsWith('record.update') || action.includes('deactivate')) return 'warning';
  if (action.startsWith('record.create') || action.includes('approve') || action.includes('grant')) return 'success';
  return 'info';
};

const severityClass = (sev: string) => {
  const config: Record<string, string> = {
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    danger: 'bg-red-500/10 text-red-500 border-red-500/30',
  };
  return config[sev] || config.info;
};

export default function AuditLogs() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7d');

  useEffect(() => {
    if (role && role !== 'admin') {
      navigate('/');
    }
  }, [role, navigate]);

  const sinceDate = (() => {
    switch (dateFilter) {
      case '24h': return subDays(new Date(), 1);
      case '7d': return subDays(new Date(), 7);
      case '30d': return subDays(new Date(), 30);
      case '90d': return subDays(new Date(), 90);
      default: return subDays(new Date(), 365 * 10);
    }
  })();

  const { data: logs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['audit-logs', dateFilter],
    enabled: role === 'admin',
    queryFn: async (): Promise<AuditLogRow[]> => {
      const { data, error } = await supabase
        .from('audit_log' as never)
        .select('*')
        .gte('occurred_at', sinceDate.toISOString())
        .order('id', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as AuditLogRow[];
    },
  });

  const verifyChain = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('verify_audit_chain' as never);
      if (error) throw error;
      return data as number | null;
    },
    onSuccess: (firstBroken) => {
      if (firstBroken === null) {
        toast({
          title: 'Audit chain intact',
          description: 'All entries verified — no tampering detected.',
        });
      } else {
        toast({
          title: 'Audit chain BROKEN',
          description: `First broken entry: #${firstBroken}. Investigate immediately.`,
          variant: 'destructive',
        });
      }
    },
    onError: (err: Error) => {
      toast({ title: 'Verification failed', description: err.message, variant: 'destructive' });
    },
  });

  if (role && role !== 'admin') {
    return null;
  }

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    if (q && !log.action.toLowerCase().includes(q) &&
        !(log.resource_type ?? '').toLowerCase().includes(q) &&
        !(log.actor_user_id ?? '').toLowerCase().includes(q)) {
      return false;
    }
    if (actionFilter !== 'all' && !log.action.startsWith(actionFilter)) return false;
    return true;
  });

  const stats = {
    total: logs.length,
    last24h: logs.filter((l) => new Date(l.occurred_at) > subDays(new Date(), 1)).length,
    sensitive: logs.filter((l) => l.action.startsWith('record.') || l.action.startsWith('access.')).length,
    failures: logs.filter((l) => l.action.includes('failed') || l.action.includes('delete')).length,
  };

  const exportCsv = () => {
    const header = ['id', 'occurred_at', 'actor_user_id', 'actor_role', 'action', 'resource_type', 'resource_id', 'target_patient_id', 'facility_id', 'entry_hash'];
    const rows = filteredLogs.map((l) => [
      l.id, l.occurred_at, l.actor_user_id ?? '', l.actor_role ?? '', l.action,
      l.resource_type ?? '', l.resource_id ?? '', l.target_patient_id ?? '',
      l.facility_id ?? '', l.entry_hash,
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanovia-audit-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout activeTab="audit-logs">
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Audit Logs
            </h1>
            <p className="text-muted-foreground">
              Tamper-evident, append-only record of every sensitive action
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={() => verifyChain.mutate()}
              disabled={verifyChain.isPending}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              {verifyChain.isPending ? 'Verifying…' : 'Verify chain'}
            </Button>
            <Button variant="outline" onClick={exportCsv} disabled={filteredLogs.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Alert className="border-primary/30 bg-primary/5">
          <Shield className="h-4 w-4" />
          <AlertTitle>Append-only audit trail</AlertTitle>
          <AlertDescription>
            Entries are hash-chained (SHA-256). Updates and deletes are blocked at the database
            level. Use <strong>Verify chain</strong> to detect any tampering.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total entries', value: stats.total, icon: Activity, color: 'text-primary' },
            { label: 'Last 24 hours', value: stats.last24h, icon: RefreshCw, color: 'text-blue-500' },
            { label: 'Sensitive actions', value: stats.sensitive, icon: ShieldAlert, color: 'text-amber-500' },
            { label: 'Deletes / failures', value: stats.failures, icon: Shield, color: 'text-red-500' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Narrow down the audit trail</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search action, resource, actor…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="patient">Patient</SelectItem>
                <SelectItem value="record">Medical record</SelectItem>
                <SelectItem value="access">Access / sharing</SelectItem>
                <SelectItem value="facility">Facility</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="export">Exports</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entries ({filteredLogs.length})</CardTitle>
            <CardDescription>Most recent first. Max 500 shown.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground py-8 text-center">Loading audit log…</p>
            ) : filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No audit entries match your filters.</p>
                <p className="text-xs mt-2">
                  Entries will appear here as users log in, view records, and make changes.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>When</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Hash</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => {
                      const sev = severityFor(log.action);
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {log.id}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDistanceToNow(new Date(log.occurred_at), { addSuffix: true })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(log.occurred_at), 'PPp')}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.actor_user_id ? log.actor_user_id.slice(0, 8) + '…' : '—'}
                          </TableCell>
                          <TableCell>
                            {log.actor_role ? (
                              <Badge variant="outline" className="text-xs">{log.actor_role}</Badge>
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={severityClass(sev)}>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {log.resource_type && (
                              <div>
                                <span className="font-medium">{log.resource_type}</span>
                                {log.resource_id && (
                                  <span className="text-muted-foreground font-mono ml-1">
                                    {log.resource_id.slice(0, 8)}…
                                  </span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground" title={log.entry_hash}>
                              <Hash className="h-3 w-3" />
                              {log.entry_hash.slice(0, 10)}…
                            </div>
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
      </div>
    </DashboardLayout>
  );
}
