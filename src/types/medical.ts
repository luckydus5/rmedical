import { Database } from '@/integrations/supabase/types';

export type MedicalCondition = Database['public']['Tables']['medical_conditions']['Row'];
export type Medication = Database['public']['Tables']['medications']['Row'];
export type Allergy = Database['public']['Tables']['allergies']['Row'];
export type LabResult = Database['public']['Tables']['lab_results']['Row'];
export type VisitHistory = Database['public']['Tables']['visit_history']['Row'];
export type AccessGrant = Database['public']['Tables']['access_grants']['Row'];
export type AccessLog = Database['public']['Tables']['access_logs']['Row'];
export type EmergencyContact = Database['public']['Tables']['emergency_contacts']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Facility = Database['public']['Tables']['facilities']['Row'];
export type FacilityStaff = Database['public']['Tables']['facility_staff']['Row'];
export type FacilityPatient = Database['public']['Tables']['facility_patients']['Row'];

export type MedicalConditionInsert = Database['public']['Tables']['medical_conditions']['Insert'];
export type MedicationInsert = Database['public']['Tables']['medications']['Insert'];
export type AllergyInsert = Database['public']['Tables']['allergies']['Insert'];
export type LabResultInsert = Database['public']['Tables']['lab_results']['Insert'];
export type VisitHistoryInsert = Database['public']['Tables']['visit_history']['Insert'];
export type AccessGrantInsert = Database['public']['Tables']['access_grants']['Insert'];
export type EmergencyContactInsert = Database['public']['Tables']['emergency_contacts']['Insert'];
export type FacilityInsert = Database['public']['Tables']['facilities']['Insert'];
export type FacilityStaffInsert = Database['public']['Tables']['facility_staff']['Insert'];

export type FacilityType = Database['public']['Enums']['facility_type'];
export type FacilityStatus = Database['public']['Enums']['facility_status'];
export type FacilityRole = Database['public']['Enums']['facility_role'];
