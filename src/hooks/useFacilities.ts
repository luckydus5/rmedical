import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { FacilityInsert, FacilityStaffInsert } from '@/types/medical';

export function useFacilities() {
  return useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUserFacilities() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user_facilities', user?.id],
    queryFn: async () => {
      // Get facilities where the user is staff
      const { data: staffRecords, error: staffError } = await supabase
        .from('facility_staff')
        .select('facility_id, role, facilities(*)')
        .eq('user_id', user!.id)
        .eq('is_active', true);
      
      if (staffError) throw staffError;
      return staffRecords;
    },
    enabled: !!user,
  });
}

export function useFacility(facilityId: string | undefined) {
  return useQuery({
    queryKey: ['facility', facilityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('id', facilityId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!facilityId,
  });
}

export function useFacilityStaff(facilityId: string | undefined) {
  return useQuery({
    queryKey: ['facility_staff', facilityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facility_staff')
        .select(`
          *,
          profiles:user_id (
            full_name,
            phone,
            avatar_url
          )
        `)
        .eq('facility_id', facilityId!)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!facilityId,
  });
}

export function useFacilityPatients(facilityId: string | undefined) {
  return useQuery({
    queryKey: ['facility_patients', facilityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facility_patients')
        .select(`
          *,
          profiles:patient_id (
            full_name,
            phone,
            date_of_birth,
            gender,
            national_id,
            avatar_url
          )
        `)
        .eq('facility_id', facilityId!)
        .order('last_visit_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!facilityId,
  });
}

export function useCreateFacility() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (facility: Omit<FacilityInsert, 'created_by'>) => {
      const { data, error } = await supabase
        .from('facilities')
        .insert({ ...facility, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      
      // Auto-add creator as facility admin
      await supabase.from('facility_staff').insert({
        facility_id: data.id,
        user_id: user!.id,
        role: 'facility_admin',
        is_active: true,
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      queryClient.invalidateQueries({ queryKey: ['user_facilities'] });
    },
  });
}

export function useApproveFacility() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (facilityId: string) => {
      const { error } = await supabase
        .from('facilities')
        .update({ 
          status: 'approved',
          approved_by: user!.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', facilityId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
    },
  });
}

export function useAddFacilityStaff() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (staff: FacilityStaffInsert) => {
      const { data, error } = await supabase
        .from('facility_staff')
        .insert(staff)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['facility_staff', variables.facility_id] });
    },
  });
}

export function useSearchPatientByNationalId() {
  return useMutation({
    mutationFn: async (nationalId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('national_id', nationalId)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useRegisterPatientToFacility() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ facilityId, patientId }: { facilityId: string; patientId: string }) => {
      const { data, error } = await supabase
        .from('facility_patients')
        .insert({
          facility_id: facilityId,
          patient_id: patientId,
          last_visit_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['facility_patients', variables.facilityId] });
    },
  });
}
