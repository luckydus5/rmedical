import { Card, CardContent } from '@/components/ui/card';
import { FileText, Calendar, Pill, AlertTriangle } from 'lucide-react';
import { useMedicalConditions, useMedications, useAllergies, useVisitHistory } from '@/hooks/useMedicalRecords';

export default function StatsCards() {
  const { data: conditions } = useMedicalConditions();
  const { data: medications } = useMedications();
  const { data: allergies } = useAllergies();
  const { data: visits } = useVisitHistory();

  const stats = [
    {
      icon: FileText,
      count: conditions?.length || 0,
      label: 'Medical Records',
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: Calendar,
      count: visits?.length || 0,
      label: 'Visits',
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      icon: Pill,
      count: medications?.filter(m => m.is_active)?.length || 0,
      label: 'Active Medications',
      color: 'bg-green-500/10 text-green-500',
    },
    {
      icon: AlertTriangle,
      count: allergies?.length || 0,
      label: 'Allergies',
      color: 'bg-amber-500/10 text-amber-500',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="border-border/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.count}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
