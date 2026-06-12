-- =============================================================================
-- Sanovia — Security verification (READ ONLY)
-- =============================================================================
-- Run this in the Supabase SQL editor (or `supabase db query`) to get evidence,
-- not assumptions, about who can read patient data.
--
-- It answers three questions an auditor will ask:
--   1. Is Row-Level Security actually ENABLED on every table that holds PHI?
--   2. What policies exist on each table, and what do they allow?
--   3. Are there any tables with RLS enabled but NO policies (= locked), or
--      RLS disabled (= world-readable to any authenticated client)?
--
-- This script changes nothing. Read the output top to bottom.
-- =============================================================================

-- 1. RLS status for every table in the public schema.
--    rls_enabled = false on a table holding patient data is a critical finding.
SELECT
    c.relname                          AS table_name,
    c.relrowsecurity                   AS rls_enabled,
    c.relforcerowsecurity              AS rls_forced,
    COUNT(p.polname)                   AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
GROUP BY c.relname, c.relrowsecurity, c.relforcerowsecurity
ORDER BY c.relrowsecurity ASC, c.relname;   -- tables with RLS OFF surface first

-- 2. Every policy, in full, for the sensitive tables.
--    Read the USING / WITH CHECK expressions: anything that lets a broad role
--    (e.g. "has_role(..., 'doctor')") read ALL rows is a privacy problem.
SELECT
    tablename,
    policyname,
    cmd                                AS applies_to,
    roles,
    qual                               AS using_expression,
    with_check                         AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
        'profiles',
        'medical_conditions',
        'medications',
        'allergies',
        'lab_results',
        'visit_history',
        'emergency_contacts',
        'access_grants',
        'access_logs',
        'facility_patients',
        'facility_staff'
      )
ORDER BY tablename, cmd, policyname;

-- 3. Danger list: RLS enabled but ZERO policies means the table is fully locked
--    (no one but service_role can read it) — often an accidental outage.
--    RLS disabled means the opposite — any logged-in user can read everything.
SELECT
    c.relname AS table_name,
    CASE
        WHEN c.relrowsecurity = false THEN 'RLS DISABLED — any authenticated client can read all rows'
        WHEN COUNT(p.polname) = 0      THEN 'RLS on but NO policies — table is fully locked'
        ELSE 'ok'
    END AS finding
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
GROUP BY c.relname, c.relrowsecurity
HAVING c.relrowsecurity = false OR COUNT(p.polname) = 0
ORDER BY c.relname;
