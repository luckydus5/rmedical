
-- =========================================================
-- Phase 1.1: Append-only, hash-chained audit log
-- =========================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
    id BIGSERIAL PRIMARY KEY,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_user_id UUID,
    actor_role TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    target_patient_id UUID,
    facility_id UUID,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    prev_hash TEXT,
    entry_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.audit_log(actor_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_patient ON public.audit_log(target_patient_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_facility ON public.audit_log(facility_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action, occurred_at DESC);

-- Grants: read only via admin RLS; writes only via SECURITY DEFINER function (no direct INSERT)
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.audit_log_id_seq TO service_role;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can read audit log"
ON public.audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Block direct mutation from clients entirely (no INSERT/UPDATE/DELETE policies = denied).
-- Writes happen exclusively through public.log_audit_event() (SECURITY DEFINER).

-- =========================================================
-- Hard block UPDATE and DELETE at the trigger level
-- (defends against future policy mistakes and service_role misuse in app code)
-- =========================================================
CREATE OR REPLACE FUNCTION public.audit_log_block_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'audit_log is append-only; % is not permitted', TG_OP;
END;
$$;

DROP TRIGGER IF EXISTS audit_log_no_update ON public.audit_log;
CREATE TRIGGER audit_log_no_update
BEFORE UPDATE ON public.audit_log
FOR EACH ROW EXECUTE FUNCTION public.audit_log_block_mutation();

DROP TRIGGER IF EXISTS audit_log_no_delete ON public.audit_log;
CREATE TRIGGER audit_log_no_delete
BEFORE DELETE ON public.audit_log
FOR EACH ROW EXECUTE FUNCTION public.audit_log_block_mutation();

-- =========================================================
-- Append function (the only supported write path)
-- =========================================================
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action TEXT,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id TEXT DEFAULT NULL,
    p_target_patient_id UUID DEFAULT NULL,
    p_facility_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_prev_hash TEXT;
    v_actor UUID := auth.uid();
    v_role TEXT;
    v_payload TEXT;
    v_hash TEXT;
    v_now TIMESTAMPTZ := now();
    v_new_id BIGINT;
BEGIN
    IF p_action IS NULL OR length(trim(p_action)) = 0 THEN
        RAISE EXCEPTION 'audit action is required';
    END IF;

    SELECT role::TEXT INTO v_role
    FROM public.user_roles
    WHERE user_id = v_actor
    LIMIT 1;

    -- Lock the table briefly so the hash chain stays linear under concurrency.
    LOCK TABLE public.audit_log IN SHARE ROW EXCLUSIVE MODE;

    SELECT entry_hash INTO v_prev_hash
    FROM public.audit_log
    ORDER BY id DESC
    LIMIT 1;

    v_payload := COALESCE(v_prev_hash, '') || '|' ||
                 v_now::TEXT || '|' ||
                 COALESCE(v_actor::TEXT, '') || '|' ||
                 COALESCE(v_role, '') || '|' ||
                 p_action || '|' ||
                 COALESCE(p_resource_type, '') || '|' ||
                 COALESCE(p_resource_id, '') || '|' ||
                 COALESCE(p_target_patient_id::TEXT, '') || '|' ||
                 COALESCE(p_facility_id::TEXT, '') || '|' ||
                 COALESCE(p_metadata::TEXT, '{}');

    v_hash := encode(extensions.digest(v_payload, 'sha256'), 'hex');

    INSERT INTO public.audit_log (
        occurred_at, actor_user_id, actor_role, action,
        resource_type, resource_id, target_patient_id, facility_id,
        metadata, prev_hash, entry_hash
    ) VALUES (
        v_now, v_actor, v_role, p_action,
        p_resource_type, p_resource_id, p_target_patient_id, p_facility_id,
        COALESCE(p_metadata, '{}'::jsonb), v_prev_hash, v_hash
    )
    RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$$;

-- pgcrypto provides digest(); make sure it's available
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

GRANT EXECUTE ON FUNCTION public.log_audit_event(TEXT, TEXT, TEXT, UUID, UUID, JSONB) TO authenticated;

-- =========================================================
-- Chain verification function (admins only)
-- Returns the id of the first broken entry, or NULL if intact.
-- =========================================================
CREATE OR REPLACE FUNCTION public.verify_audit_chain()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r RECORD;
    v_prev TEXT := NULL;
    v_calc TEXT;
    v_payload TEXT;
BEGIN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'only admins can verify the audit chain';
    END IF;

    FOR r IN SELECT * FROM public.audit_log ORDER BY id ASC LOOP
        IF COALESCE(r.prev_hash, '') IS DISTINCT FROM COALESCE(v_prev, '') THEN
            RETURN r.id;
        END IF;

        v_payload := COALESCE(v_prev, '') || '|' ||
                     r.occurred_at::TEXT || '|' ||
                     COALESCE(r.actor_user_id::TEXT, '') || '|' ||
                     COALESCE(r.actor_role, '') || '|' ||
                     r.action || '|' ||
                     COALESCE(r.resource_type, '') || '|' ||
                     COALESCE(r.resource_id, '') || '|' ||
                     COALESCE(r.target_patient_id::TEXT, '') || '|' ||
                     COALESCE(r.facility_id::TEXT, '') || '|' ||
                     COALESCE(r.metadata::TEXT, '{}');
        v_calc := encode(extensions.digest(v_payload, 'sha256'), 'hex');

        IF v_calc IS DISTINCT FROM r.entry_hash THEN
            RETURN r.id;
        END IF;

        v_prev := r.entry_hash;
    END LOOP;

    RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_audit_chain() TO authenticated;
