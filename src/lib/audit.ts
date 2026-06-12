import { supabase } from '@/integrations/supabase/client';

/**
 * Sanovia audit log — Phase 1.1
 *
 * Appends a tamper-evident entry to the append-only `audit_log` table via the
 * server-side `log_audit_event` SECURITY DEFINER function. Entries are
 * hash-chained; clients can never modify or delete them.
 *
 * Errors are logged but never thrown — auditing must not break user flows.
 * Use server-side logging (edge functions) for actions that must be guaranteed.
 */
export type AuditAction =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.signup'
  | 'patient.view'
  | 'patient.register'
  | 'record.view'
  | 'record.create'
  | 'record.update'
  | 'record.delete'
  | 'medication.prescribe'
  | 'access.grant'
  | 'access.revoke'
  | 'access.qr_scan'
  | 'export.records'
  | 'facility.create'
  | 'facility.approve'
  | 'staff.invite'
  | 'staff.deactivate';

export interface AuditPayload {
  action: AuditAction | string;
  resourceType?: string;
  resourceId?: string;
  targetPatientId?: string;
  facilityId?: string;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(payload: AuditPayload): Promise<void> {
  try {
    const { error } = await supabase.rpc('log_audit_event', {
      p_action: payload.action,
      p_resource_type: payload.resourceType ?? null,
      p_resource_id: payload.resourceId ?? null,
      p_target_patient_id: payload.targetPatientId ?? null,
      p_facility_id: payload.facilityId ?? null,
      p_metadata: (payload.metadata ?? {}) as never,
    });
    if (error) {
      console.warn('[audit] failed to log event', payload.action, error.message);
    }
  } catch (err) {
    console.warn('[audit] exception while logging', payload.action, err);
  }
}
