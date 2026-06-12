export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      access_grants: {
        Row: {
          access_token: string
          access_type: string
          created_at: string
          expires_at: string
          granted_to_id: string | null
          granted_to_name: string | null
          id: string
          is_used: boolean
          patient_id: string
          used_at: string | null
        }
        Insert: {
          access_token: string
          access_type?: string
          created_at?: string
          expires_at: string
          granted_to_id?: string | null
          granted_to_name?: string | null
          id?: string
          is_used?: boolean
          patient_id: string
          used_at?: string | null
        }
        Update: {
          access_token?: string
          access_type?: string
          created_at?: string
          expires_at?: string
          granted_to_id?: string | null
          granted_to_name?: string | null
          id?: string
          is_used?: boolean
          patient_id?: string
          used_at?: string | null
        }
        Relationships: []
      }
      access_logs: {
        Row: {
          access_type: string
          accessed_at: string
          accessor_id: string | null
          accessor_name: string | null
          id: string
          ip_address: string | null
          patient_id: string
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          access_type: string
          accessed_at?: string
          accessor_id?: string | null
          accessor_name?: string | null
          id?: string
          ip_address?: string | null
          patient_id: string
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          access_type?: string
          accessed_at?: string
          accessor_id?: string | null
          accessor_name?: string | null
          id?: string
          ip_address?: string | null
          patient_id?: string
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: []
      }
      allergies: {
        Row: {
          allergen: string
          created_at: string
          first_observed: string | null
          id: string
          notes: string | null
          patient_id: string
          reaction: string
          severity: string
          updated_at: string
        }
        Insert: {
          allergen: string
          created_at?: string
          first_observed?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          reaction: string
          severity: string
          updated_at?: string
        }
        Update: {
          allergen?: string
          created_at?: string
          first_observed?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          reaction?: string
          severity?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_type: Database["public"]["Enums"]["appointment_type"]
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          chief_complaint: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          doctor_id: string
          end_time: string
          facility_id: string
          id: string
          notes: string | null
          patient_id: string
          scheduled_by: string
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_type?: Database["public"]["Enums"]["appointment_type"]
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          chief_complaint?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          doctor_id: string
          end_time: string
          facility_id: string
          id?: string
          notes?: string | null
          patient_id: string
          scheduled_by: string
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_type?: Database["public"]["Enums"]["appointment_type"]
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          chief_complaint?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          doctor_id?: string
          end_time?: string
          facility_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          scheduled_by?: string
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          ai_response: string
          created_at: string
          id: string
          is_maternal: boolean
          language: string
          risk_level: Database["public"]["Enums"]["risk_level"]
          session_id: string
          symptoms_text: string
        }
        Insert: {
          ai_response: string
          created_at?: string
          id?: string
          is_maternal?: boolean
          language?: string
          risk_level: Database["public"]["Enums"]["risk_level"]
          session_id: string
          symptoms_text: string
        }
        Update: {
          ai_response?: string
          created_at?: string
          id?: string
          is_maternal?: boolean
          language?: string
          risk_level?: Database["public"]["Enums"]["risk_level"]
          session_id?: string
          symptoms_text?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_role: string | null
          actor_user_id: string | null
          entry_hash: string
          facility_id: string | null
          id: number
          ip_address: string | null
          metadata: Json
          occurred_at: string
          prev_hash: string | null
          resource_id: string | null
          resource_type: string | null
          target_patient_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_role?: string | null
          actor_user_id?: string | null
          entry_hash: string
          facility_id?: string | null
          id?: number
          ip_address?: string | null
          metadata?: Json
          occurred_at?: string
          prev_hash?: string | null
          resource_id?: string | null
          resource_type?: string | null
          target_patient_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_role?: string | null
          actor_user_id?: string | null
          entry_hash?: string
          facility_id?: string | null
          id?: number
          ip_address?: string | null
          metadata?: Json
          occurred_at?: string
          prev_hash?: string | null
          resource_id?: string | null
          resource_type?: string | null
          target_patient_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      doctor_schedules: {
        Row: {
          created_at: string
          day_of_week: number
          doctor_id: string
          end_time: string
          facility_id: string
          id: string
          is_active: boolean
          max_patients_per_slot: number
          notes: string | null
          slot_duration_minutes: number
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          doctor_id: string
          end_time: string
          facility_id: string
          id?: string
          is_active?: boolean
          max_patients_per_slot?: number
          notes?: string | null
          slot_duration_minutes?: number
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          doctor_id?: string
          end_time?: string
          facility_id?: string
          id?: string
          is_active?: boolean
          max_patients_per_slot?: number
          notes?: string | null
          slot_duration_minutes?: number
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_schedules_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          contact_name: string
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          patient_id: string
          phone: string
          relationship: string
          updated_at: string
        }
        Insert: {
          contact_name: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          patient_id: string
          phone: string
          relationship: string
          updated_at?: string
        }
        Update: {
          contact_name?: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          patient_id?: string
          phone?: string
          relationship?: string
          updated_at?: string
        }
        Relationships: []
      }
      facilities: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          facility_type: Database["public"]["Enums"]["facility_type"]
          id: string
          license_number: string | null
          logo_url: string | null
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["facility_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          facility_type?: Database["public"]["Enums"]["facility_type"]
          id?: string
          license_number?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["facility_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          facility_type?: Database["public"]["Enums"]["facility_type"]
          id?: string
          license_number?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["facility_status"]
          updated_at?: string
        }
        Relationships: []
      }
      facility_admins: {
        Row: {
          created_at: string | null
          facility_id: string
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          facility_id: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          facility_id?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_admins_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_patients: {
        Row: {
          facility_id: string
          id: string
          last_visit_at: string | null
          notes: string | null
          patient_id: string
          patient_number: string | null
          registered_at: string
        }
        Insert: {
          facility_id: string
          id?: string
          last_visit_at?: string | null
          notes?: string | null
          patient_id: string
          patient_number?: string | null
          registered_at?: string
        }
        Update: {
          facility_id?: string
          id?: string
          last_visit_at?: string | null
          notes?: string | null
          patient_id?: string
          patient_number?: string | null
          registered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_patients_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_staff: {
        Row: {
          created_at: string
          department: string | null
          facility_id: string
          hired_at: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["facility_role"]
          specialization: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          facility_id: string
          hired_at?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["facility_role"]
          specialization?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          facility_id?: string
          hired_at?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["facility_role"]
          specialization?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_staff_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_results: {
        Row: {
          created_at: string
          facility_id: string | null
          id: string
          lab_name: string | null
          notes: string | null
          ordered_by: string | null
          patient_id: string
          reference_range: string | null
          result_value: string
          status: string | null
          test_date: string
          test_name: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          facility_id?: string | null
          id?: string
          lab_name?: string | null
          notes?: string | null
          ordered_by?: string | null
          patient_id: string
          reference_range?: string | null
          result_value: string
          status?: string | null
          test_date: string
          test_name: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          facility_id?: string | null
          id?: string
          lab_name?: string | null
          notes?: string | null
          ordered_by?: string | null
          patient_id?: string
          reference_range?: string | null
          result_value?: string
          status?: string | null
          test_date?: string
          test_name?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_conditions: {
        Row: {
          condition_name: string
          created_at: string
          diagnosed_by: string | null
          diagnosis_date: string | null
          icd_code: string | null
          id: string
          notes: string | null
          patient_id: string
          severity: string | null
          status: string
          updated_at: string
        }
        Insert: {
          condition_name: string
          created_at?: string
          diagnosed_by?: string | null
          diagnosis_date?: string | null
          icd_code?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          severity?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          condition_name?: string
          created_at?: string
          diagnosed_by?: string | null
          diagnosis_date?: string | null
          icd_code?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          severity?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      medications: {
        Row: {
          created_at: string
          dosage: string
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean
          medication_name: string
          notes: string | null
          patient_id: string
          prescribing_doctor: string | null
          purpose: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosage: string
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean
          medication_name: string
          notes?: string | null
          patient_id: string
          prescribing_doctor?: string | null
          purpose?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dosage?: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          medication_name?: string
          notes?: string | null
          patient_id?: string
          prescribing_doctor?: string | null
          purpose?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string
          gender: string | null
          id: string
          national_id: string | null
          phone: string | null
          preferred_language: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name: string
          gender?: string | null
          id?: string
          national_id?: string | null
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          national_id?: string | null
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visit_history: {
        Row: {
          chief_complaint: string | null
          created_at: string
          diagnosis: string | null
          facility_id: string | null
          facility_name: string
          follow_up_date: string | null
          id: string
          notes: string | null
          patient_id: string
          provider_id: string | null
          provider_name: string | null
          treatment: string | null
          updated_at: string
          visit_date: string
          visit_type: string
        }
        Insert: {
          chief_complaint?: string | null
          created_at?: string
          diagnosis?: string | null
          facility_id?: string | null
          facility_name: string
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          provider_id?: string | null
          provider_name?: string | null
          treatment?: string | null
          updated_at?: string
          visit_date: string
          visit_type: string
        }
        Update: {
          chief_complaint?: string | null
          created_at?: string
          diagnosis?: string | null
          facility_id?: string | null
          facility_name?: string
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          provider_id?: string | null
          provider_name?: string | null
          treatment?: string | null
          updated_at?: string
          visit_date?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_history_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_notification: {
        Args: {
          p_action_url?: string
          p_message: string
          p_metadata?: Json
          p_title: string
          p_type?: string
          p_user_id: string
        }
        Returns: string
      }
      get_available_slots: {
        Args: { p_date: string; p_doctor_id: string; p_facility_id: string }
        Returns: {
          is_available: boolean
          slot_end: string
          slot_start: string
        }[]
      }
      get_facility_role: {
        Args: { _facility_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["facility_role"]
      }
      get_user_facilities: { Args: { _user_id: string }; Returns: string[] }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_facility_staff: {
        Args: { _facility_id: string; _user_id: string }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_facility_id?: string
          p_metadata?: Json
          p_resource_id?: string
          p_resource_type?: string
          p_target_patient_id?: string
        }
        Returns: number
      }
      verify_audit_chain: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "patient" | "nurse" | "doctor" | "admin"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      appointment_type:
        | "consultation"
        | "follow_up"
        | "emergency"
        | "routine_checkup"
        | "lab_test"
        | "vaccination"
        | "other"
      facility_role: "facility_admin" | "doctor" | "nurse" | "receptionist"
      facility_status: "pending" | "approved" | "suspended"
      facility_type:
        | "hospital"
        | "clinic"
        | "health_center"
        | "pharmacy"
        | "laboratory"
      risk_level: "green" | "yellow" | "red"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["patient", "nurse", "doctor", "admin"],
      appointment_status: [
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      appointment_type: [
        "consultation",
        "follow_up",
        "emergency",
        "routine_checkup",
        "lab_test",
        "vaccination",
        "other",
      ],
      facility_role: ["facility_admin", "doctor", "nurse", "receptionist"],
      facility_status: ["pending", "approved", "suspended"],
      facility_type: [
        "hospital",
        "clinic",
        "health_center",
        "pharmacy",
        "laboratory",
      ],
      risk_level: ["green", "yellow", "red"],
    },
  },
} as const
