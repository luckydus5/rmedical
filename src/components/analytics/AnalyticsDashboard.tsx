// ================================
// Sanovia Analytics Dashboard
// Comprehensive health analytics for facilities
// ================================

import React, { useMemo } from 'react';
import { 
  Users, 
  Syringe, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  Pill,
  Heart,
  FileText,
  Building2,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface AnalyticsData {
  totalPatients: number;
  patientsThisMonth: number;
  patientGrowth: number;
  
  totalVisits: number;
  visitsThisMonth: number;
  visitGrowth: number;
  
  prescriptionsFilled: number;
  prescriptionsGrowth: number;
  
  vaccinationsGiven: number;
  vaccinationCoverage: number;
  
  commonConditions: { name: string; count: number; percentage: number }[];
  commonMedications: { name: string; count: number }[];
  ageDistribution: { range: string; count: number; percentage: number }[];
  
  alerts: {
    criticalLabResults: number;
    expiredMedications: number;
    overdueVaccinations: number;
    missedAppointments: number;
  };
  
  recentActivity: {
    type: 'patient' | 'visit' | 'prescription' | 'vaccination' | 'lab';
    description: string;
    time: string;
  }[];
}

// Default empty data (real data should come from props)
const defaultData: AnalyticsData = {
  totalPatients: 0,
  patientsThisMonth: 0,
  patientGrowth: 0,
  
  totalVisits: 0,
  visitsThisMonth: 0,
  visitGrowth: 0,
  
  prescriptionsFilled: 0,
  prescriptionsGrowth: 0,
  
  vaccinationsGiven: 0,
  vaccinationCoverage: 0,
  
  commonConditions: [],
  
  commonMedications: [],
  
  ageDistribution: [],
  
  alerts: {
    criticalLabResults: 0,
    expiredMedications: 0,
    overdueVaccinations: 0,
    missedAppointments: 0,
  },
  
  recentActivity: [],
};

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  growth?: number;
  icon: React.ReactNode;
  iconBg?: string;
}

function StatCard({ title, value, subValue, growth, icon, iconBg = 'bg-green-100' }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {(subValue || growth !== undefined) && (
              <div className="flex items-center gap-2 mt-2">
                {subValue && (
                  <span className="text-sm text-muted-foreground">{subValue}</span>
                )}
                {growth !== undefined && (
                  <Badge variant={growth >= 0 ? "default" : "destructive"} className="gap-1">
                    {growth >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(growth)}%
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${iconBg}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AnalyticsDashboardProps {
  facilityId?: string;
  facilityName?: string;
  data?: Partial<AnalyticsData>;
}

export function AnalyticsDashboard({ 
  facilityName = 'Analytics',
  data: providedData 
}: AnalyticsDashboardProps) {
  const data = useMemo(() => ({
    ...defaultData,
    ...providedData,
  }), [providedData]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'patient': return <Users className="h-4 w-4 text-blue-500" />;
      case 'visit': return <Calendar className="h-4 w-4 text-green-500" />;
      case 'prescription': return <Pill className="h-4 w-4 text-purple-500" />;
      case 'vaccination': return <Syringe className="h-4 w-4 text-orange-500" />;
      case 'lab': return <FileText className="h-4 w-4 text-cyan-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold">{facilityName}</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Analytics Dashboard • Updated just now
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <BarChart3 className="h-3 w-3" />
            Last 30 days
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value={data.totalPatients.toLocaleString()}
          subValue={`+${data.patientsThisMonth} this month`}
          growth={data.patientGrowth}
          icon={<Users className="h-5 w-5 text-green-600" />}
        />
        <StatCard
          title="Patient Visits"
          value={data.visitsThisMonth.toLocaleString()}
          subValue="This month"
          growth={data.visitGrowth}
          icon={<Calendar className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Prescriptions"
          value={data.prescriptionsFilled.toLocaleString()}
          growth={data.prescriptionsGrowth}
          icon={<Pill className="h-5 w-5 text-purple-600" />}
          iconBg="bg-purple-100"
        />
        <StatCard
          title="Vaccination Coverage"
          value={`${data.vaccinationCoverage}%`}
          subValue={`${data.vaccinationsGiven} administered`}
          icon={<Syringe className="h-5 w-5 text-orange-600" />}
          iconBg="bg-orange-100"
        />
      </div>

      {/* Alerts Section */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Action Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-red-600">
                {data.alerts.criticalLabResults}
              </div>
              <div className="text-sm text-muted-foreground">Critical Labs</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">
                {data.alerts.expiredMedications}
              </div>
              <div className="text-sm text-muted-foreground">Expired Meds</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-amber-600">
                {data.alerts.overdueVaccinations}
              </div>
              <div className="text-sm text-muted-foreground">Overdue Vaccines</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">
                {data.alerts.missedAppointments}
              </div>
              <div className="text-sm text-muted-foreground">Missed Visits</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Common Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Common Conditions
            </CardTitle>
            <CardDescription>
              Most diagnosed conditions this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.commonConditions.map((condition, index) => (
                <div key={condition.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{condition.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {condition.count} ({condition.percentage}%)
                    </span>
                  </div>
                  <Progress 
                    value={condition.percentage} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Patient Demographics
            </CardTitle>
            <CardDescription>
              Age distribution of registered patients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.ageDistribution.map((age) => (
                <div key={age.range}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{age.range} years</span>
                    <span className="text-sm text-muted-foreground">
                      {age.count} ({age.percentage}%)
                    </span>
                  </div>
                  <Progress 
                    value={age.percentage} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Medications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-purple-500" />
              Most Prescribed Medications
            </CardTitle>
            <CardDescription>
              Top medications dispensed this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.commonMedications.map((med, index) => (
                <div 
                  key={med.name}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-600">
                      {index + 1}
                    </div>
                    <span className="font-medium">{med.name}</span>
                  </div>
                  <Badge variant="secondary">{med.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates from your facility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-full">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Public Health Insights */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Public Health Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/70 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                ↓ 23%
              </div>
              <p className="text-sm font-medium">Malaria Cases</p>
              <p className="text-xs text-muted-foreground">
                Compared to same period last year
              </p>
            </div>
            <div className="p-4 bg-white/70 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                76.4%
              </div>
              <p className="text-sm font-medium">Childhood Immunization</p>
              <p className="text-xs text-muted-foreground">
                On track with WHO targets
              </p>
            </div>
            <div className="p-4 bg-white/70 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                89%
              </div>
              <p className="text-sm font-medium">ARV Adherence Rate</p>
              <p className="text-xs text-muted-foreground">
                Above regional average
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AnalyticsDashboard;
