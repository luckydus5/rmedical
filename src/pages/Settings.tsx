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
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings as SettingsIcon, 
  Save,
  Bell,
  Moon,
  Sun,
  Globe,
  Mail,
  Shield,
  Database,
  Clock,
  Palette,
  Building2,
  Users,
  Lock,
  RefreshCw,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export default function Settings() {
  const { role } = useAuth();
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    systemName: 'Sanovia Health',
    systemEmail: 'admin@sanovia.health',
    timezone: 'Africa/Kigali',
    language: 'en',
    darkMode: false,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    maintenanceMode: false,
    autoBackup: true,
    sessionTimeout: 30,
  });

  if (role !== 'admin') {
    navigate('/');
    return null;
  }

  const handleSave = () => {
    // Save settings logic would go here
    console.log('Settings saved:', settings);
  };

  return (
    <DashboardLayout activeTab="settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <SettingsIcon className="h-6 w-6 text-primary" />
              System Settings
            </h1>
            <p className="text-muted-foreground">Configure system preferences</p>
          </div>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>Basic system configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="systemName">System Name</Label>
                <Input
                  id="systemName"
                  value={settings.systemName}
                  onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="systemEmail">System Email</Label>
                <Input
                  id="systemEmail"
                  type="email"
                  value={settings.systemEmail}
                  onChange={(e) => setSettings({ ...settings, systemEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                >
                  <option value="Africa/Kigali">Africa/Kigali (CAT)</option>
                  <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                  <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                  <option value="Africa/Cairo">Africa/Cairo (EET)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <select
                  id="language"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                >
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="sw">Swahili</option>
                  <option value="rw">Kinyarwanda</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Theme and display preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  {settings.darkMode ? (
                    <Moon className="h-5 w-5 text-primary" />
                  ) : (
                    <Sun className="h-5 w-5 text-amber-500" />
                  )}
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">Use dark theme</p>
                  </div>
                </div>
                <Switch
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, darkMode: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex gap-2">
                  {['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'].map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full ${color} ring-2 ring-offset-2 ring-transparent hover:ring-primary transition-all`}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <Button variant="outline" size="sm">
                    Upload Logo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive email alerts</p>
                  </div>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Browser push alerts</p>
                  </div>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">Text message alerts</p>
                  </div>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security & System */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & System
              </CardTitle>
              <CardDescription>Security and maintenance settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Session Timeout</p>
                    <p className="text-sm text-muted-foreground">{settings.sessionTimeout} minutes</p>
                  </div>
                </div>
                <Input
                  type="number"
                  className="w-20"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Auto Backup</p>
                    <p className="text-sm text-muted-foreground">Daily automatic backups</p>
                  </div>
                </div>
                <Switch
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoBackup: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-amber-500/5 border-amber-500/20">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium text-amber-600">Maintenance Mode</p>
                    <p className="text-sm text-muted-foreground">Disable user access temporarily</p>
                  </div>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Helpful resources and documentation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-auto py-4 flex-col">
                <HelpCircle className="h-5 w-5 mb-2" />
                <span>Help Center</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col">
                <ExternalLink className="h-5 w-5 mb-2" />
                <span>Documentation</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col">
                <RefreshCw className="h-5 w-5 mb-2" />
                <span>Check Updates</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col">
                <Mail className="h-5 w-5 mb-2" />
                <span>Contact Support</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Version Info */}
        <div className="text-center text-sm text-muted-foreground py-4 border-t">
          <p>Sanovia Health Platform v1.0.0</p>
          <p className="mt-1">© 2024 Sanovia. All rights reserved.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
