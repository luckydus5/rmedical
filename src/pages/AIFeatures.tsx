import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Brain,
  MessageSquare,
  Stethoscope,
  FileSearch,
  TrendingUp,
  Shield,
  Zap,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Bot,
  Cpu,
  Activity
} from 'lucide-react';

export default function AIFeatures() {
  const { role } = useAuth();
  const navigate = useNavigate();

  const [features, setFeatures] = useState({
    diagnosticAssist: true,
    nlpSearch: true,
    predictiveAnalytics: false,
    chatAssistant: true,
    autoSuggestions: true,
    anomalyDetection: false,
  });

  if (role !== 'admin') {
    navigate('/');
    return null;
  }

  const aiModules = [
    {
      id: 'diagnosticAssist',
      name: 'Diagnostic Assistant',
      description: 'AI-powered symptom analysis and differential diagnosis suggestions',
      icon: Stethoscope,
      status: 'active',
      usage: 78,
      requests: '2.4K',
      color: 'blue',
    },
    {
      id: 'nlpSearch',
      name: 'Natural Language Search',
      description: 'Search medical records using natural language queries',
      icon: FileSearch,
      status: 'active',
      usage: 65,
      requests: '5.1K',
      color: 'emerald',
    },
    {
      id: 'predictiveAnalytics',
      name: 'Predictive Analytics',
      description: 'Predict patient outcomes and identify at-risk patients',
      icon: TrendingUp,
      status: 'beta',
      usage: 23,
      requests: '890',
      color: 'amber',
    },
    {
      id: 'chatAssistant',
      name: 'Chat Assistant',
      description: 'AI chatbot for patient queries and scheduling',
      icon: MessageSquare,
      status: 'active',
      usage: 89,
      requests: '8.3K',
      color: 'purple',
    },
    {
      id: 'autoSuggestions',
      name: 'Auto-Complete Suggestions',
      description: 'Smart suggestions for medical documentation',
      icon: Sparkles,
      status: 'active',
      usage: 92,
      requests: '12.1K',
      color: 'cyan',
    },
    {
      id: 'anomalyDetection',
      name: 'Anomaly Detection',
      description: 'Detect unusual patterns in patient data and lab results',
      icon: Shield,
      status: 'coming',
      usage: 0,
      requests: '—',
      color: 'rose',
    },
  ];

  const toggleFeature = (id: string) => {
    setFeatures((prev) => ({
      ...prev,
      [id]: !prev[id as keyof typeof prev],
    }));
  };

  return (
    <DashboardLayout activeTab="ai-features">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              AI Features
            </h1>
            <p className="text-muted-foreground">Manage AI-powered capabilities</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
              <Zap className="h-3 w-3 mr-1" />
              AI Engine Active
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">5</p>
                  <p className="text-xs text-muted-foreground">Active Modules</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Activity className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">28.8K</p>
                  <p className="text-xs text-muted-foreground">Requests/month</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Cpu className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">94%</p>
                  <p className="text-xs text-muted-foreground">Accuracy Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Zap className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">120ms</p>
                  <p className="text-xs text-muted-foreground">Avg Response</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Modules */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {aiModules.map((module) => {
            const isEnabled = features[module.id as keyof typeof features];
            return (
              <Card key={module.id} className={!isEnabled ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg bg-${module.color}-500/10`}>
                      <module.icon className={`h-5 w-5 text-${module.color}-500`} />
                    </div>
                    <div className="flex items-center gap-2">
                      {module.status === 'active' && (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                          Active
                        </Badge>
                      )}
                      {module.status === 'beta' && (
                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                          Beta
                        </Badge>
                      )}
                      {module.status === 'coming' && (
                        <Badge className="bg-muted text-muted-foreground">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-base mt-3">{module.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {module.status !== 'coming' && (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Usage</span>
                            <span className="font-medium">{module.usage}%</span>
                          </div>
                          <Progress value={module.usage} className="h-1.5" />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Requests</span>
                          <span className="font-medium">{module.requests}</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <Label htmlFor={module.id} className="text-sm">
                        {isEnabled ? 'Enabled' : 'Disabled'}
                      </Label>
                      <Switch
                        id={module.id}
                        checked={isEnabled}
                        onCheckedChange={() => toggleFeature(module.id)}
                        disabled={module.status === 'coming'}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* AI Usage Disclaimer */}
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-600">AI Disclaimer</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  AI features are designed to assist healthcare professionals and should not be used as the sole basis for clinical decisions. 
                  All AI-generated suggestions must be reviewed by qualified medical personnel. 
                  Sanovia AI complies with healthcare data protection regulations and HIPAA guidelines.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              AI Configuration
            </CardTitle>
            <CardDescription>Advanced settings for AI features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Auto-learning</p>
                  <p className="text-xs text-muted-foreground">Learn from user corrections</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Privacy Mode</p>
                  <p className="text-xs text-muted-foreground">Enhanced data protection</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Confidence Threshold</p>
                  <p className="text-xs text-muted-foreground">Show only high-confidence results</p>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
