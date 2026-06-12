import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Bell, 
  Pill, 
  Syringe, 
  Calendar,
  Heart,
  Activity,
  Clock,
  CheckCircle,
  Info
} from 'lucide-react';
import { differenceInDays, differenceInMonths, parseISO, isPast, addDays } from 'date-fns';

interface HealthAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'reminder';
  category: 'medication' | 'vaccination' | 'appointment' | 'condition' | 'general';
  title: string;
  message: string;
  actionRequired: boolean;
  expiresAt?: Date;
}

interface SmartHealthAlertsProps {
  medications?: any[];
  allergies?: any[];
  conditions?: any[];
  vaccinations?: any[];
  visits?: any[];
  labResults?: any[];
}

export default function SmartHealthAlerts({
  medications = [],
  allergies = [],
  conditions = [],
  vaccinations = [],
  visits = [],
  labResults = []
}: SmartHealthAlertsProps) {
  const { t } = useTranslation();

  const alerts = useMemo(() => {
    const generatedAlerts: HealthAlert[] = [];

    // Check for medication refill reminders
    medications.forEach((med: any) => {
      if (med.is_active && med.end_date) {
        const endDate = parseISO(med.end_date);
        const daysUntilEnd = differenceInDays(endDate, new Date());
        
        if (daysUntilEnd <= 7 && daysUntilEnd > 0) {
          generatedAlerts.push({
            id: `med-refill-${med.id}`,
            type: 'warning',
            category: 'medication',
            title: 'Medication Running Low',
            message: `Your ${med.medication_name} prescription ends in ${daysUntilEnd} days. Contact your doctor for a refill.`,
            actionRequired: true
          });
        } else if (daysUntilEnd <= 0) {
          generatedAlerts.push({
            id: `med-expired-${med.id}`,
            type: 'critical',
            category: 'medication',
            title: 'Prescription Expired',
            message: `Your ${med.medication_name} prescription has expired. Please consult your doctor before continuing.`,
            actionRequired: true
          });
        }
      }
    });

    // Check for potential medication interactions (simplified)
    const activeMeds = medications.filter((m: any) => m.is_active);
    if (activeMeds.length >= 5) {
      generatedAlerts.push({
        id: 'polypharmacy-warning',
        type: 'info',
        category: 'medication',
        title: 'Multiple Medications',
        message: `You are currently taking ${activeMeds.length} medications. Discuss with your doctor to review your medication list.`,
        actionRequired: false
      });
    }

    // Check for overdue vaccinations
    vaccinations.forEach((vax: any) => {
      if (vax.next_dose_date && isPast(parseISO(vax.next_dose_date))) {
        const daysOverdue = differenceInDays(new Date(), parseISO(vax.next_dose_date));
        generatedAlerts.push({
          id: `vax-overdue-${vax.id}`,
          type: daysOverdue > 30 ? 'critical' : 'warning',
          category: 'vaccination',
          title: 'Overdue Vaccination',
          message: `Your ${vax.vaccine_name} (Dose ${vax.dose_number + 1}) is ${daysOverdue} days overdue. Schedule an appointment.`,
          actionRequired: true
        });
      }
    });

    // Check for upcoming vaccination reminders
    vaccinations.forEach((vax: any) => {
      if (vax.next_dose_date) {
        const daysUntil = differenceInDays(parseISO(vax.next_dose_date), new Date());
        if (daysUntil > 0 && daysUntil <= 14) {
          generatedAlerts.push({
            id: `vax-upcoming-${vax.id}`,
            type: 'reminder',
            category: 'vaccination',
            title: 'Upcoming Vaccination',
            message: `${vax.vaccine_name} (Dose ${vax.dose_number + 1}) is due in ${daysUntil} days.`,
            actionRequired: true
          });
        }
      }
    });

    // Check for chronic condition monitoring
    conditions.forEach((condition: any) => {
      if (condition.status === 'active') {
        const conditionName = condition.condition_name.toLowerCase();
        
        // Diabetes monitoring reminder
        if (conditionName.includes('diabetes')) {
          const lastLabDate = labResults
            .filter((l: any) => l.test_name?.toLowerCase().includes('glucose') || l.test_name?.toLowerCase().includes('hba1c'))
            .sort((a: any, b: any) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime())[0];
          
          if (!lastLabDate || differenceInMonths(new Date(), parseISO(lastLabDate.test_date)) > 3) {
            generatedAlerts.push({
              id: `diabetes-check-${condition.id}`,
              type: 'warning',
              category: 'condition',
              title: 'Diabetes Monitoring Due',
              message: 'It\'s been over 3 months since your last blood glucose/HbA1c test. Schedule a check-up.',
              actionRequired: true
            });
          }
        }

        // Hypertension monitoring
        if (conditionName.includes('hypertension') || conditionName.includes('blood pressure')) {
          generatedAlerts.push({
            id: `bp-reminder-${condition.id}`,
            type: 'info',
            category: 'condition',
            title: 'Blood Pressure Reminder',
            message: 'Remember to check your blood pressure regularly and log your readings.',
            actionRequired: false
          });
        }
      }
    });

    // Check for follow-up appointments
    visits.forEach((visit: any) => {
      if (visit.follow_up_date) {
        const followUpDate = parseISO(visit.follow_up_date);
        const daysUntil = differenceInDays(followUpDate, new Date());
        
        if (daysUntil > 0 && daysUntil <= 7) {
          generatedAlerts.push({
            id: `followup-${visit.id}`,
            type: 'reminder',
            category: 'appointment',
            title: 'Follow-up Appointment',
            message: `You have a follow-up appointment in ${daysUntil} days for your ${visit.visit_type} visit.`,
            actionRequired: true
          });
        } else if (daysUntil < 0 && daysUntil >= -14) {
          generatedAlerts.push({
            id: `missed-followup-${visit.id}`,
            type: 'warning',
            category: 'appointment',
            title: 'Missed Follow-up',
            message: `You missed your follow-up appointment ${Math.abs(daysUntil)} days ago. Please reschedule.`,
            actionRequired: true
          });
        }
      }
    });

    // Critical lab results
    labResults.forEach((lab: any) => {
      if (lab.flag === 'critical' || lab.flag === 'high' || lab.flag === 'low') {
        const daysAgo = differenceInDays(new Date(), parseISO(lab.test_date));
        if (daysAgo <= 7) {
          generatedAlerts.push({
            id: `lab-critical-${lab.id}`,
            type: lab.flag === 'critical' ? 'critical' : 'warning',
            category: 'general',
            title: 'Abnormal Lab Result',
            message: `Your ${lab.test_name} result is ${lab.flag}. Consult your doctor about the findings.`,
            actionRequired: true
          });
        }
      }
    });

    // Sort alerts by priority
    const priorityOrder = { critical: 0, warning: 1, reminder: 2, info: 3 };
    return generatedAlerts.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);
  }, [medications, allergies, conditions, vaccinations, visits, labResults]);

  const alertConfig = {
    critical: {
      icon: AlertTriangle,
      className: 'border-red-300 bg-red-50',
      iconColor: 'text-red-600',
      titleColor: 'text-red-800',
      badgeClass: 'bg-red-100 text-red-800'
    },
    warning: {
      icon: Bell,
      className: 'border-orange-300 bg-orange-50',
      iconColor: 'text-orange-600',
      titleColor: 'text-orange-800',
      badgeClass: 'bg-orange-100 text-orange-800'
    },
    reminder: {
      icon: Clock,
      className: 'border-blue-300 bg-blue-50',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-800',
      badgeClass: 'bg-blue-100 text-blue-800'
    },
    info: {
      icon: Info,
      className: 'border-gray-300 bg-gray-50',
      iconColor: 'text-gray-600',
      titleColor: 'text-gray-800',
      badgeClass: 'bg-gray-100 text-gray-800'
    }
  };

  const categoryIcons = {
    medication: Pill,
    vaccination: Syringe,
    appointment: Calendar,
    condition: Heart,
    general: Activity
  };

  if (alerts.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-700">
            <CheckCircle className="h-6 w-6" />
            <div>
              <p className="font-medium">All Clear!</p>
              <p className="text-sm text-green-600">No health alerts at this time.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${criticalCount > 0 ? 'bg-red-100' : 'bg-amber-100'}`}>
              <Bell className={`h-6 w-6 ${criticalCount > 0 ? 'text-red-600' : 'text-amber-600'}`} />
            </div>
            <div>
              <CardTitle>Health Alerts</CardTitle>
              <CardDescription>
                {alerts.length} alert{alerts.length !== 1 ? 's' : ''} requiring attention
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive">{criticalCount} Critical</Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-orange-100 text-orange-800">{warningCount} Warning</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const config = alertConfig[alert.type];
          const Icon = config.icon;
          const CategoryIcon = categoryIcons[alert.category];
          
          return (
            <Alert key={alert.id} className={config.className}>
              <Icon className={`h-4 w-4 ${config.iconColor}`} />
              <AlertTitle className={`flex items-center gap-2 ${config.titleColor}`}>
                {alert.title}
                <Badge variant="outline" className="text-xs">
                  <CategoryIcon className="h-3 w-3 mr-1" />
                  {alert.category}
                </Badge>
              </AlertTitle>
              <AlertDescription className="text-sm mt-1">
                {alert.message}
              </AlertDescription>
            </Alert>
          );
        })}
      </CardContent>
    </Card>
  );
}
