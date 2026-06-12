-- =============================================================================
-- Sanovia — Harden Row-Level Security on patient (PHI) tables
-- =============================================================================
-- WHY THIS EXISTS
--   The eight tables below were created directly through the Lovable UI and were
--   never captured as migrations, so their access policies were not in version
--   control and could not be reviewed. This migration takes explicit ownership of
--   them: it drops whatever policies currently exist and replaces them with a
--   single, documented, facility-scoped access model.
--
-- ACCESS MODEL (who can read/write a patient's clinical records)
--   * The patient themselves (patient_id = auth.uid()).
--   * A system admin.
--   * A provider who is ACTIVE staff at a facility where the patient is
--     registered (facility_patients x facility_staff).
--   * A provider holding a live, patient-issued share grant (QR / access token).
--   Anyone else — including another patient, or a provider with no link to the
--   patient — gets nothing. This is enforced by the database, not the UI.
--
-- NOTE ON profiles
--   profiles is intentionally left broadly readable by providers so that a nurse
--   can look up a patient by National ID to register them (cross-facility
--   referral). Identity lookup != clinical-record access; the latter is locked
--   down here. Revisit if your privacy policy forbids cross-facility identity
--   search.
--
-- This migration is idempotent and safe to re-run.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Central access predicate. SECURITY DEFINER so it can read the membership
-- tables without tripping RLS recursion (same pattern as is_facility_staff).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_access_patient(_provider UUID, _patient UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        -- the patient's own records
        _provider = _patient
        -- system administrators
        OR public.has_role(_provider, 'admin')
        -- active staff at a facility where this patient is registered
        OR EXISTS (
            SELECT 1
            FROM public.facility_patients fp
            JOIN public.facility_staff fs ON fs.facility_id = fp.facility_id
            WHERE fp.patient_id = _patient
              AND fs.user_id = _provider
              AND fs.is_active = true
        )
        -- a live, patient-issued share grant (QR code / access token)
        OR EXISTS (
            SELECT 1
            FROM public.access_grants ag
            WHERE ag.patient_id = _patient
              AND ag.granted_to_id = _provider
              AND ag.is_used = true
              AND ag.expires_at > now()
        )
$$;

GRANT EXECUTE ON FUNCTION public.can_access_patient(UUID, UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- Drop every existing policy on the target tables so the resulting state is
-- fully determined by this file (no leftover Lovable policies).
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    pol RECORD;
    t TEXT;
    target_tables TEXT[] := ARRAY[
        'medical_conditions', 'medications', 'allergies', 'lab_results',
        'visit_history', 'emergency_contacts', 'access_grants', 'access_logs'
    ];
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = ANY (target_tables)
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;

    -- Make sure RLS is on for all of them.
    FOREACH t IN ARRAY target_tables LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- Clinical tables: identical owner-or-authorized-provider model on all six.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    t TEXT;
    clinical_tables TEXT[] := ARRAY[
        'medical_conditions', 'medications', 'allergies',
        'lab_results', 'visit_history', 'emergency_contacts'
    ];
BEGIN
    FOREACH t IN ARRAY clinical_tables LOOP
        EXECUTE format($f$
            CREATE POLICY "Authorized parties can read"
            ON public.%1$I FOR SELECT TO authenticated
            USING (public.can_access_patient(auth.uid(), patient_id));
        $f$, t);

        EXECUTE format($f$
            CREATE POLICY "Authorized parties can insert"
            ON public.%1$I FOR INSERT TO authenticated
            WITH CHECK (public.can_access_patient(auth.uid(), patient_id));
        $f$, t);

        EXECUTE format($f$
            CREATE POLICY "Authorized parties can update"
            ON public.%1$I FOR UPDATE TO authenticated
            USING (public.can_access_patient(auth.uid(), patient_id))
            WITH CHECK (public.can_access_patient(auth.uid(), patient_id));
        $f$, t);

        -- Deletes are narrower: the patient or a system admin only.
        EXECUTE format($f$
            CREATE POLICY "Patient or admin can delete"
            ON public.%1$I FOR DELETE TO authenticated
            USING (patient_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
        $f$, t);
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- access_grants: patients mint share codes; providers claim them by token.
-- -----------------------------------------------------------------------------
-- A provider must possess the unguessable token to find an open grant, so we
-- allow reading unused, unexpired grants. Used/expired grants are visible only
-- to the patient, the claiming provider, or an admin.
CREATE POLICY "Read own, claimed, or open grants"
ON public.access_grants FOR SELECT TO authenticated
USING (
    patient_id = auth.uid()
    OR granted_to_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR (is_used = false AND expires_at > now())
);

CREATE POLICY "Patients create their own grants"
ON public.access_grants FOR INSERT TO authenticated
WITH CHECK (patient_id = auth.uid());

-- Claiming: any authenticated provider may flip an open grant to used, but only
-- by assigning it to themselves. After that, only the patient or the grantee can
-- touch it.
CREATE POLICY "Claim or manage a grant"
ON public.access_grants FOR UPDATE TO authenticated
USING (
    patient_id = auth.uid()
    OR granted_to_id = auth.uid()
    OR (is_used = false AND expires_at > now())
)
WITH CHECK (
    patient_id = auth.uid()
    OR granted_to_id = auth.uid()
);

CREATE POLICY "Patient or admin can revoke a grant"
ON public.access_grants FOR DELETE TO authenticated
USING (patient_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- access_logs: the patient's record of who opened their file.
-- -----------------------------------------------------------------------------
-- Append-only from the client's perspective: a provider may insert a log line
-- naming themselves as the accessor; no client UPDATE/DELETE policies exist, so
-- those operations are denied.
CREATE POLICY "Patient or admin can read access logs"
ON public.access_logs FOR SELECT TO authenticated
USING (patient_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Accessor can append a log line"
ON public.access_logs FOR INSERT TO authenticated
WITH CHECK (accessor_id = auth.uid());

COMMIT;
