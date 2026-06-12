import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { 
  MedicalConditionInsert, 
  MedicationInsert, 
  AllergyInsert, 
  LabResultInsert, 
  VisitHistoryInsert,
  EmergencyContactInsert
} from '@/types/medical';

export function useMedicalConditions(patientId?: string) {
  const { user } = useAuth();
  const targetId = patientId || user?.id;
  
  return useQuery({
    queryKey: ['medical_conditions', targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_conditions')
        .select('*')
        .eq('patient_id', targetId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!targetId,
  });
}

export function useMedications(patientId?: string) {
  const { user } = useAuth();
  const targetId = patientId || user?.id;
  
  return useQuery({
    queryKey: ['medications', targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('patient_id', targetId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!targetId,
  });
}

export function useAllergies(patientId?: string) {
  const { user } = useAuth();
  const targetId = patientId || user?.id;
  
  return useQuery({
    queryKey: ['allergies', targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('allergies')
        .select('*')
        .eq('patient_id', targetId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!targetId,
  });
}

export function useLabResults(patientId?: string) {
  const { user } = useAuth();
  const targetId = patientId || user?.id;
  
  return useQuery({
    queryKey: ['lab_results', targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_results')
        .select('*')
        .eq('patient_id', targetId!)
        .order('test_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!targetId,
  });
}

export function useVisitHistory(patientId?: string) {
  const { user } = useAuth();
  const targetId = patientId || user?.id;
  
  return useQuery({
    queryKey: ['visit_history', targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visit_history')
        .select('*')
        .eq('patient_id', targetId!)
        .order('visit_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!targetId,
  });
}

export function useEmergencyContacts(patientId?: string) {
  const { user } = useAuth();
  const targetId = patientId || user?.id;
  
  return useQuery({
    queryKey: ['emergency_contacts', targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('patient_id', targetId!)
        .order('is_primary', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!targetId,
  });
}

export function useAccessLogs(patientId?: string) {
  const { user } = useAuth();
  const targetId = patientId || user?.id;
  
  return useQuery({
    queryKey: ['access_logs', targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_logs')
        .select('*')
        .eq('patient_id', targetId!)
        .order('accessed_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!targetId,
  });
}

export function useAccessGrants() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['access_grants', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_grants')
        .select('*')
        .eq('patient_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// Mutations
export function useAddMedicalCondition() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (condition: Omit<MedicalConditionInsert, 'patient_id'>) => {
      const { data, error } = await supabase
        .from('medical_conditions')
        .insert({ ...condition, patient_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical_conditions'] });
    },
  });
}

export function useAddMedication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (medication: Omit<MedicationInsert, 'patient_id'>) => {
      const { data, error } = await supabase
        .from('medications')
        .insert({ ...medication, patient_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
  });
}

export function useAddAllergy() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (allergy: Omit<AllergyInsert, 'patient_id'>) => {
      const { data, error } = await supabase
        .from('allergies')
        .insert({ ...allergy, patient_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allergies'] });
    },
  });
}

export function useAddLabResult() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (labResult: Omit<LabResultInsert, 'patient_id'>) => {
      const { data, error } = await supabase
        .from('lab_results')
        .insert({ ...labResult, patient_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab_results'] });
    },
  });
}

export function useAddVisit() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (visit: Omit<VisitHistoryInsert, 'patient_id'>) => {
      const { data, error } = await supabase
        .from('visit_history')
        .insert({ ...visit, patient_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit_history'] });
    },
  });
}

export function useAddEmergencyContact() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (contact: Omit<EmergencyContactInsert, 'patient_id'>) => {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert({ ...contact, patient_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency_contacts'] });
    },
  });
}

export function useCreateAccessGrant() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (params: { expiresInMinutes: number; accessType: string }) => {
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + params.expiresInMinutes * 60 * 1000);
      
      const { data, error } = await supabase
        .from('access_grants')
        .insert({
          patient_id: user!.id,
          access_token: token,
          access_type: params.accessType,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access_grants'] });
    },
  });
}

export function useDeleteRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ table, id }: { table: string; id: string }) => {
      const { error } = await supabase
        .from(table as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [variables.table] });
    },
  });
}

export function useUpdateRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ table, id, data }: { table: string; id: string; data: any }) => {
      const { error } = await supabase
        .from(table as any)
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [variables.table] });
    },
  });
}
