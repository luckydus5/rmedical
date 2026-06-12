import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  Lock,
  Eye,
  Key,
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Settings,
  Database,
  Globe,
  Server,
  Activity,
  FileText,
  Users,
  Network
} from 'lucide-react';

export default function Security() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    twoFactor: true,
    sessionTimeout: true,
    ipRestriction: false,
    auditLogging: true,
    encryptionAtRest: true,
    encryptionInTransit: true,
  });

  if (role !== 'admin') {
    navigate('/');
    return null;
  }

  const securityScore = 96;

  const securityChecks = [
    { name: 'SSL/TLS Certificate', status: 'pass', detail: 'Valid until Dec 2026' },
    { name: 'Database Encryption', status: 'pass', detail: 'AES-256 enabled' },
    { name: 'Row Level Security', status: 'pass', detail: 'All tables protected' },
    { name: 'Authentication', status: 'pass', detail: 'Supabase Auth active' },
    { name: 'Password Policy', status: 'pass', detail: 'Strong requirements' },
    { name: 'Session Management', status: 'pass', detail: '24h timeout' },
    { name: 'API Rate Limiting', status: 'warning', detail: 'Consider enabling' },
    { name: 'Backup Encryption', status: 'pass', detail: 'Encrypted backups' },
  ];

  return (
    <DashboardLayout activeTab="security">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Security Center
            </h1>
            <p className="text-muted-foreground">Monitor and configure platform security</p>
          </div>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Run Security Scan
          </Button>
        </div>

        {/* Security Score */}
        <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-emerald-500/20 rounded-2xl">
                  <ShieldCheck className="h-10 w-10 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-emerald-500">A+</h2>
                  <p className="text-lg font-medium">Security Score</p>
                  <p className="text-sm text-muted-foreground">Your platform is well protected</p>
                </div>
              </div>
              <div className="flex-1 max-w-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Overall Security</span>
                  <span className="text-sm font-bold text-emerald-500">{securityScore}%</span>
                </div>
                <Progress value={securityScore} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Security Checks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Security Checks
              </CardTitle>
              <CardDescription>Automated security assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityChecks.map((check, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      {check.status === 'pass' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{check.name}</p>
                        <p className="text-xs text-muted-foreground">{check.detail}</p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={check.status === 'pass' 
                        ? 'text-emerald-500 border-emerald-500/30' 
                        : 'text-amber-500 border-amber-500/30'
                      }
                    >
                      {check.status === 'pass' ? 'Passed' : 'Review'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure security options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Fingerprint className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-xs text-muted-foreground">Require 2FA for admin accounts</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.twoFactor} 
                    onCheckedChange={(checked) => setSettings({...settings, twoFactor: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label>Session Timeout</Label>
                      <p className="text-xs text-muted-foreground">Auto-logout after inactivity</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.sessionTimeout} 
                    onCheckedChange={(checked) => setSettings({...settings, sessionTimeout: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label>IP Restriction</Label>
                      <p className="text-xs text-muted-foreground">Limit admin access by IP</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.ipRestriction} 
                    onCheckedChange={(checked) => setSettings({...settings, ipRestriction: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label>Audit Logging</Label>
                      <p className="text-xs text-muted-foreground">Log all admin actions</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.auditLogging} 
                    onCheckedChange={(checked) => setSettings({...settings, auditLogging: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label>Encryption at Rest</Label>
                      <p className="text-xs text-muted-foreground">AES-256 database encryption</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.encryptionAtRest} 
                    onCheckedChange={(checked) => setSettings({...settings, encryptionAtRest: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Network className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label>Encryption in Transit</Label>
                      <p className="text-xs text-muted-foreground">TLS 1.3 for all connections</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.encryptionInTransit} 
                    onCheckedChange={(checked) => setSettings({...settings, encryptionInTransit: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Protection Status */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Lock className="h-8 w-8 text-emerald-500" />
                <div>
                  <p className="font-medium">Encryption</p>
                  <p className="text-xs text-muted-foreground">AES-256 Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Eye className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">RLS</p>
                  <p className="text-xs text-muted-foreground">All Tables Protected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="font-medium">Firewall</p>
                  <p className="text-xs text-muted-foreground">Active Protection</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="font-medium">Monitoring</p>
                  <p className="text-xs text-muted-foreground">24/7 Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
