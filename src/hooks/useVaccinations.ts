import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// The `vaccinations` table is newer than the generated Supabase types, so the
// client is cast where it references the table (same pattern as audit_log).

export function useVaccinations(patientId?: string) {
  const { user } = useAuth();
  const targetId = patientId || user?.id;

  return useQuery({
    queryKey: ['vaccinations', targetId],
    enabled: !!targetId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vaccinations' as never)
        .select('*')
        .eq('patient_id', targetId!)
        .order('date_administered', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<Record<string, unknown>>;
    },
  });
}

export interface NewVaccination {
  vaccine_name: string;
  dose_number: number;
  total_doses: number;
  date_administered: string;
  next_dose_date?: string | null;
  batch_number?: string;
  facility?: string;
}

export function useAddVaccination(patientId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const targetId = patientId || user?.id;

  return useMutation({
    mutationFn: async (vax: NewVaccination) => {
      const { facility, ...rest } = vax;
      const { error } = await supabase.from('vaccinations' as never).insert({
        ...rest,
        facility_name: facility || null,
        patient_id: targetId!,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations', targetId] });
    },
  });
}
