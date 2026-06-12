-- =============================================================================
-- Sanovia — vaccinations table
-- =============================================================================
-- Persists immunisation records (the WHO/Rwanda schedule the VaccinationTracker
-- renders). Same facility-scoped access model as the other clinical tables, via
-- public.can_access_patient (created in 20260612120000_harden_medical_rls.sql).
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.vaccinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vaccine_name TEXT NOT NULL,
    dose_number INTEGER NOT NULL DEFAULT 1,
    total_doses INTEGER NOT NULL DEFAULT 1,
    date_administered DATE NOT NULL DEFAULT CURRENT_DATE,
    next_dose_date DATE,
    batch_number TEXT,
    facility_name TEXT,
    administered_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vaccinations_patient ON public.vaccinations(patient_id, date_administered DESC);

ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authorized parties can read vaccinations" ON public.vaccinations;
CREATE POLICY "Authorized parties can read vaccinations"
ON public.vaccinations FOR SELECT TO authenticated
USING (public.can_access_patient(auth.uid(), patient_id));

DROP POLICY IF EXISTS "Authorized parties can insert vaccinations" ON public.vaccinations;
CREATE POLICY "Authorized parties can insert vaccinations"
ON public.vaccinations FOR INSERT TO authenticated
WITH CHECK (public.can_access_patient(auth.uid(), patient_id));

DROP POLICY IF EXISTS "Authorized parties can update vaccinations" ON public.vaccinations;
CREATE POLICY "Authorized parties can update vaccinations"
ON public.vaccinations FOR UPDATE TO authenticated
USING (public.can_access_patient(auth.uid(), patient_id))
WITH CHECK (public.can_access_patient(auth.uid(), patient_id));

DROP POLICY IF EXISTS "Patient or admin can delete vaccinations" ON public.vaccinations;
CREATE POLICY "Patient or admin can delete vaccinations"
ON public.vaccinations FOR DELETE TO authenticated
USING (patient_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_vaccinations_updated_at
    BEFORE UPDATE ON public.vaccinations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

COMMIT;
