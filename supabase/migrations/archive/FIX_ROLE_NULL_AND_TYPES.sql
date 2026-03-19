-- ============================================================================
-- Clerk-Supabase Connector Fix: "role null" & Type Mismatches
-- ============================================================================

-- 1. FIX: "role null does not exist"
-- This happens because Clerk's JWT template often includes a "role" claim.
-- If the user has no meta-data role yet, Clerk sends "null".
-- PostgREST tries to assume this role. We create it as an alias for 'authenticated'.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'null') THEN
        CREATE ROLE "null" WITH NOLOGIN;
        GRANT authenticated TO "null";
    END IF;
END $$;


-- 2. FIX: User-ID Type Mismatches
-- Since we switched to Clerk (Text IDs), our functions must accept TEXT, not UUID.

-- Update has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id TEXT, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id TEXT)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Update get_user_permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions()
RETURNS TABLE(permission_code TEXT, permission_name TEXT, category TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_role app_role;
BEGIN
  SELECT role INTO _user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()::text
  LIMIT 1;
  
  RETURN QUERY
  SELECT p.code, p.name, p.category
  FROM public.permissions p
  INNER JOIN public.role_permissions rp ON rp.permission_code = p.code
  WHERE rp.role = _user_role
  ORDER BY p.category, p.code;
END;
$$;
