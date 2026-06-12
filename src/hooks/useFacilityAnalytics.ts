import { useQuery } from '@tanstack/react-query';
import { differenceInYears, format, formatDistanceToNow, startOfMonth, subMonths } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export interface FacilityAnalytics {
  totalPatients: number;
  patientsThisMonth: number;
  patientGrowth: number;
  totalVisits: number;
  visitsThisMonth: number;
  visitsToday: number;
  visitGrowth: number;
  prescriptionsFilled: number;
  prescriptionsGrowth: number;
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

const AGE_BUCKETS = [
  { range: '0-12', min: 0, max: 12 },
  { range: '13-25', min: 13, max: 25 },
  { range: '26-40', min: 26, max: 40 },
  { range: '41-60', min: 41, max: 60 },
  { range: '61+', min: 61, max: Infinity },
];

function growthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function topCounts(values: Array<string | null>, limit: number): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();
  for (const value of values) {
    const name = value?.trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function useFacilityAnalytics(facilityId?: string) {
  return useQuery({
    queryKey: ['facility-analytics', facilityId],
    enabled: !!facilityId,
    queryFn: async (): Promise<FacilityAnalytics> => {
      const now = new Date();
      const monthStartDay = format(startOfMonth(now), 'yyyy-MM-dd');
      const lastMonthStartDay = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
      const today = format(now, 'yyyy-MM-dd');

      const [patientsRes, visitsRes, missedRes] = await Promise.all([
        supabase
          .from('facility_patients')
          .select('patient_id, registered_at')
          .eq('facility_id', facilityId!),
        supabase
          .from('visit_history')
          .select('visit_type, visit_date, diagnosis, chief_complaint')
          .eq('facility_id', facilityId!)
          .order('visit_date', { ascending: false }),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('facility_id', facilityId!)
          .eq('status', 'no_show'),
      ]);

      const facilityPatients = patientsRes.data ?? [];
      const visits = visitsRes.data ?? [];
      const patientIds = facilityPatients.map((p) => p.patient_id);

      let medications: Array<{
        medication_name: string;
        is_active: boolean;
        end_date: string | null;
        created_at: string;
      }> = [];
      let patientProfiles: Array<{ date_of_birth: string | null }> = [];
      if (patientIds.length > 0) {
        const [medsRes, profilesRes] = await Promise.all([
          supabase
            .from('medications')
            .select('medication_name, is_active, end_date, created_at')
            .in('patient_id', patientIds),
          supabase.from('profiles').select('date_of_birth').in('user_id', patientIds),
        ]);
        medications = medsRes.data ?? [];
        patientProfiles = profilesRes.data ?? [];
      }

      const registeredSince = (day: string) =>
        facilityPatients.filter((p) => p.registered_at.slice(0, 10) >= day).length;
      const patientsThisMonth = registeredSince(monthStartDay);
      const patientsLastMonth = registeredSince(lastMonthStartDay) - patientsThisMonth;

      const visitDay = (visit: { visit_date: string }) => visit.visit_date.slice(0, 10);
      const visitsThisMonth = visits.filter((v) => visitDay(v) >= monthStartDay).length;
      const visitsLastMonth = visits.filter((v) => visitDay(v) >= lastMonthStartDay).length - visitsThisMonth;
      const visitsToday = visits.filter((v) => visitDay(v) === today).length;

      const prescriptionsThisMonth = medications.filter((m) => m.created_at.slice(0, 10) >= monthStartDay).length;
      const prescriptionsLastMonth =
        medications.filter((m) => m.created_at.slice(0, 10) >= lastMonthStartDay).length - prescriptionsThisMonth;

      const diagnosedVisits = visits.filter((v) => v.diagnosis?.trim()).length;
      const commonConditions = topCounts(visits.map((v) => v.diagnosis), 5).map(({ name, count }) => ({
        name,
        count,
        percentage: diagnosedVisits > 0 ? Math.round((count / diagnosedVisits) * 100) : 0,
      }));

      const commonMedications = topCounts(medications.map((m) => m.medication_name), 5);

      const ages = patientProfiles
        .filter((p) => p.date_of_birth)
        .map((p) => differenceInYears(now, new Date(p.date_of_birth!)));
      const ageDistribution = AGE_BUCKETS.map(({ range, min, max }) => {
        const count = ages.filter((age) => age >= min && age <= max).length;
        return {
          range,
          count,
          percentage: ages.length > 0 ? Math.round((count / ages.length) * 100) : 0,
        };
      });

      const expiredMedications = medications.filter(
        (m) => m.is_active && m.end_date && m.end_date.slice(0, 10) < today
      ).length;

      const recentActivity = visits.slice(0, 5).map((visit) => {
        const detail = visit.diagnosis?.trim() || visit.chief_complaint?.trim();
        return {
          type: 'visit' as const,
          description: detail ? `${visit.visit_type} visit — ${detail}` : `${visit.visit_type} visit`,
          time: formatDistanceToNow(new Date(visit.visit_date), { addSuffix: true }),
        };
      });

      return {
        totalPatients: facilityPatients.length,
        patientsThisMonth,
        patientGrowth: growthRate(patientsThisMonth, patientsLastMonth),
        totalVisits: visits.length,
        visitsThisMonth,
        visitsToday,
        visitGrowth: growthRate(visitsThisMonth, visitsLastMonth),
        prescriptionsFilled: medications.length,
        prescriptionsGrowth: growthRate(prescriptionsThisMonth, prescriptionsLastMonth),
        commonConditions,
        commonMedications,
        ageDistribution,
        alerts: {
          criticalLabResults: 0,
          expiredMedications,
          overdueVaccinations: 0,
          missedAppointments: missedRes.count ?? 0,
        },
        recentActivity,
      };
    },
  });
}
