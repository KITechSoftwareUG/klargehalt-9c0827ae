-- ============================================================================
-- Clerk-Supabase Connector Fix: Comprehensive Role Handler
-- ============================================================================
-- This script catches ALL common Clerk organizational roles that might trigger 
-- "role does not exist" errors in Supabase/PostgREST.
-- =====================================================

-- 1. Create a function to safely create roles and grant 'authenticated' permissions
CREATE OR REPLACE FUNCTION public.create_clerk_role(_role_name TEXT)
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = _role_name) THEN
        EXECUTE format('CREATE ROLE %I WITH NOLOGIN', _role_name);
        EXECUTE format('GRANT authenticated TO %I', _role_name);
        RAISE NOTICE 'Role % created and granted authenticated', _role_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Execute for all known Clerk roles
SELECT public.create_clerk_role('null');
SELECT public.create_clerk_role('org:admin');
SELECT public.create_clerk_role('org:member');
SELECT public.create_clerk_role('admin');
SELECT public.create_clerk_role('hr_manager');

-- 3. Ensure the 'role' claim in JWT doesn't completely override your security
-- PostgREST uses the 'role' claim to decide which DB role to assume.
-- By granting 'authenticated' to these roles, they still respect your RLS policies.

-- 4. Cleanup helper function (optional)
-- DROP FUNCTION public.create_clerk_role(TEXT);
