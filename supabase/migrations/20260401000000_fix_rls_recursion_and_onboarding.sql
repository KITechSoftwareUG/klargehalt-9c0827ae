-- ============================================================
-- Fix: RLS infinite recursion in user_roles policies
-- Fix: onboarding_data table schema for Logto compatibility
-- Defensive: adds organization_id to any tables that may be missing it
-- ============================================================


-- ============================================================
-- PART 0: Defensive column additions
--
-- Ensures organization_id exists on all tables before we create
-- policies that reference it. Safe to run even if columns already exist.
-- ============================================================

-- org_id() helper — must exist before any policy references it
CREATE OR REPLACE FUNCTION public.org_id()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
AS $$ SELECT (auth.jwt() ->> 'org_id') $$;

GRANT EXECUTE ON FUNCTION public.org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.org_id() TO anon;

-- user_roles
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- audit_logs
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- companies (required for onboarding INSERT)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- profiles (required for onboarding upsert)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- onboarding_data: add missing columns
ALTER TABLE onboarding_data ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE onboarding_data ADD COLUMN IF NOT EXISTS selected_plan   TEXT;


-- ============================================================
-- PART 1: SECURITY DEFINER helper functions
--
-- These bypass RLS when checking the caller's own role, which
-- prevents the infinite recursion that occurs when user_roles
-- policies reference user_roles in a sub-SELECT.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id       = (auth.jwt() ->> 'sub')
      AND organization_id = public.org_id()
      AND role          = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_hr_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id       = (auth.jwt() ->> 'sub')
      AND organization_id = public.org_id()
      AND role          IN ('admin', 'hr_manager')
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_org_admin()   TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_hr_or_admin() TO authenticated;


-- ============================================================
-- PART 2: Fix user_roles policies (remove recursive sub-SELECT)
-- ============================================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_self_select"   ON user_roles;
DROP POLICY IF EXISTS "user_roles_admin_select"  ON user_roles;
DROP POLICY IF EXISTS "user_roles_insert"        ON user_roles;
DROP POLICY IF EXISTS "user_roles_update"        ON user_roles;

-- Users can always read their own role entry
CREATE POLICY "user_roles_self_select" ON user_roles
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND user_id = (auth.jwt() ->> 'sub')
  );

-- Admins can read all roles in their org (uses SECURITY DEFINER helper — no recursion)
CREATE POLICY "user_roles_admin_select" ON user_roles
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND public.is_org_admin()
  );

-- Any authenticated user can insert their own role (onboarding)
CREATE POLICY "user_roles_insert" ON user_roles
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.org_id());

-- Only admins can update roles
CREATE POLICY "user_roles_update" ON user_roles
  FOR UPDATE TO authenticated
  USING (
    organization_id = public.org_id()
    AND public.is_org_admin()
  );


-- ============================================================
-- PART 3: Fix employees policies (use helper instead of sub-SELECT)
-- ============================================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employees_hr_select"   ON employees;
DROP POLICY IF EXISTS "employees_self_select" ON employees;
DROP POLICY IF EXISTS "employees_hr_insert"   ON employees;
DROP POLICY IF EXISTS "employees_hr_update"   ON employees;
DROP POLICY IF EXISTS "employees_hr_delete"   ON employees;
DROP POLICY IF EXISTS "tenant_isolation"      ON employees;

CREATE POLICY "employees_hr_select" ON employees
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );

CREATE POLICY "employees_self_select" ON employees
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND user_id = (auth.jwt() ->> 'sub')
  );

CREATE POLICY "employees_hr_insert" ON employees
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );

CREATE POLICY "employees_hr_update" ON employees
  FOR UPDATE TO authenticated
  USING (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );

CREATE POLICY "employees_hr_delete" ON employees
  FOR DELETE TO authenticated
  USING (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );


-- ============================================================
-- PART 4: Fix audit_logs policy (use helper instead of sub-SELECT)
-- ============================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_insert"    ON audit_logs;
DROP POLICY IF EXISTS "audit_select_hr" ON audit_logs;
DROP POLICY IF EXISTS "tenant_isolation" ON audit_logs;

CREATE POLICY "audit_insert" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.org_id());

CREATE POLICY "audit_select_hr" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );


-- ============================================================
-- PART 5: Ensure companies, profiles, job_profiles, pay_bands,
--         info_requests have basic tenant_isolation policies
-- ============================================================

-- companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON companies;
CREATE POLICY "tenant_isolation" ON companies
  FOR ALL TO authenticated
  USING (organization_id = public.org_id())
  WITH CHECK (organization_id = public.org_id());

-- profiles (users can read/write their own across all orgs they belong to)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON profiles;
DROP POLICY IF EXISTS "profiles_own"     ON profiles;
CREATE POLICY "profiles_own" ON profiles
  FOR ALL TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

-- job_profiles
ALTER TABLE job_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_profiles FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON job_profiles;
CREATE POLICY "tenant_isolation" ON job_profiles
  FOR ALL TO authenticated
  USING (organization_id = public.org_id())
  WITH CHECK (organization_id = public.org_id());

-- pay_bands
ALTER TABLE pay_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_bands FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON pay_bands;
CREATE POLICY "tenant_isolation" ON pay_bands
  FOR ALL TO authenticated
  USING (organization_id = public.org_id())
  WITH CHECK (organization_id = public.org_id());

-- info_requests
ALTER TABLE info_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE info_requests FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON info_requests;
CREATE POLICY "tenant_isolation" ON info_requests
  FOR ALL TO authenticated
  USING (organization_id = public.org_id())
  WITH CHECK (organization_id = public.org_id());


-- ============================================================
-- PART 6: Fix onboarding_data table
--
-- 1. user_id FK to auth.users incompatible with Logto sub claims
-- 2. company_size CHECK excludes '250+' (UI sends this value)
-- 3. RLS uses auth.uid() which returns NULL for Logto JWTs
-- (Columns organization_id and selected_plan already added in PART 0)
-- ============================================================

-- Drop FK constraint (Logto user IDs are strings, not auth.users UUIDs)
ALTER TABLE onboarding_data
  DROP CONSTRAINT IF EXISTS onboarding_data_user_id_fkey;

-- Change user_id to TEXT if it's still UUID
DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'onboarding_data' AND column_name = 'user_id')
     = 'uuid' THEN
    ALTER TABLE onboarding_data ALTER COLUMN user_id TYPE TEXT USING user_id::text;
  END IF;
END $$;

-- Fix company_size CHECK to include '250+'
ALTER TABLE onboarding_data
  DROP CONSTRAINT IF EXISTS onboarding_data_company_size_check;

ALTER TABLE onboarding_data
  ADD CONSTRAINT onboarding_data_company_size_check
  CHECK (company_size IN ('1-50', '51-250', '251-1000', '1000+', '250+'));

-- Enable RLS
ALTER TABLE onboarding_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_data FORCE ROW LEVEL SECURITY;

-- Drop old auth.uid()-based policies
DROP POLICY IF EXISTS "Users can view their own onboarding data"   ON onboarding_data;
DROP POLICY IF EXISTS "Users can insert their own onboarding data" ON onboarding_data;
DROP POLICY IF EXISTS "Users can update their own onboarding data" ON onboarding_data;
DROP POLICY IF EXISTS "onboarding_data_select" ON onboarding_data;
DROP POLICY IF EXISTS "onboarding_data_insert" ON onboarding_data;
DROP POLICY IF EXISTS "onboarding_data_update" ON onboarding_data;

-- New policies using Logto JWT sub claim
CREATE POLICY "onboarding_data_select" ON onboarding_data
  FOR SELECT TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "onboarding_data_insert" ON onboarding_data
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "onboarding_data_update" ON onboarding_data
  FOR UPDATE TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'));


-- ============================================================
-- PART 7: Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_roles_user_org    ON user_roles(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_org_active   ON employees(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_companies_org          ON companies(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_profiles_org       ON job_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_pay_bands_org          ON pay_bands(organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_org_id      ON onboarding_data(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON audit_logs(organization_id, created_at DESC);
