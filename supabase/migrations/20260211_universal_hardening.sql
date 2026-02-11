-- Migration: Universal Function Hardening (Dynamic Signature Resolution)
-- Date: 2026-02-11
-- Description: Dynamically finds all public functions and prevents search_path hijacking.
-- This handles unknown signatures (like get_practice_stats) automatically.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT 'ALTER FUNCTION ' || p.oid::regprocedure || ' SET search_path = public' as sql_cmd
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          -- Only functions (f) and procedures (p)
          AND p.prokind IN ('f', 'p')
          -- Exclude extensions or system generated if any (safe for public schema usually)
          AND p.proname NOT ILIKE 'pg_%'
    LOOP
        -- Execute the hardening command
        RAISE NOTICE 'Hardening function: %', r.sql_cmd;
        EXECUTE r.sql_cmd;
    END LOOP;
END;
$$;
