-- ============================================================================
-- MASTER RLS FIX - FORCE ENABLE AND SET POLICIES
-- ============================================================================
-- This script unconditionally enables RLS on all relevant tables and 
-- recreates the necessary policies using the safe public.org_id() function.
-- ============================================================================

-- 0. Helper Function (Safe version)
CREATE OR REPLACE FUNCTION public.org_id() 
RETURNS TEXT AS $$
    SELECT (auth.jwt() ->> 'org_id');
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- 1. COMPANIES
-- ============================================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org Isolation: Companies" ON public.companies;
DROP POLICY IF EXISTS "Org Isolation: Companies Insert" ON public.companies;
DROP POLICY IF EXISTS "Org Isolation: Companies Update" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;

CREATE POLICY "Companies: Select" ON public.companies FOR SELECT
USING (organization_id = public.org_id() OR organization_id IS NULL);

CREATE POLICY "Companies: Insert" ON public.companies FOR INSERT
WITH CHECK (organization_id = public.org_id());

CREATE POLICY "Companies: Update" ON public.companies FOR UPDATE
USING (organization_id = public.org_id());

-- ============================================================================
-- 2. EMPLOYEES
-- ============================================================================
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org Isolation: Employees" ON public.employees;
DROP POLICY IF EXISTS "Org Isolation: Employees Insert" ON public.employees;
DROP POLICY IF EXISTS "Org Isolation: Employees Update" ON public.employees;
DROP POLICY IF EXISTS "Org Isolation: Employees Delete" ON public.employees;

CREATE POLICY "Employees: Select" ON public.employees FOR SELECT
USING (organization_id = public.org_id());

CREATE POLICY "Employees: Insert" ON public.employees FOR INSERT
WITH CHECK (organization_id = public.org_id());

CREATE POLICY "Employees: Update" ON public.employees FOR UPDATE
USING (organization_id = public.org_id());

CREATE POLICY "Employees: Delete" ON public.employees FOR DELETE
USING (organization_id = public.org_id());

-- ============================================================================
-- 3. JOB PROFILES
-- ============================================================================
ALTER TABLE public.job_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org Isolation: Job Profiles" ON public.job_profiles;
DROP POLICY IF EXISTS "Org Isolation: Job Profiles Insert" ON public.job_profiles;
DROP POLICY IF EXISTS "Org Isolation: Job Profiles Update" ON public.job_profiles;
DROP POLICY IF EXISTS "Org Isolation: Job Profiles Delete" ON public.job_profiles;

CREATE POLICY "Job Profiles: Select" ON public.job_profiles FOR SELECT
USING (organization_id = public.org_id() OR organization_id IS NULL);

CREATE POLICY "Job Profiles: Insert" ON public.job_profiles FOR INSERT
WITH CHECK (organization_id = public.org_id());

CREATE POLICY "Job Profiles: Update" ON public.job_profiles FOR UPDATE
USING (organization_id = public.org_id());

CREATE POLICY "Job Profiles: Delete" ON public.job_profiles FOR DELETE
USING (organization_id = public.org_id());

-- ============================================================================
-- 4. PAY BANDS
-- ============================================================================
ALTER TABLE public.pay_bands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org Isolation: Pay Bands" ON public.pay_bands;
DROP POLICY IF EXISTS "Org Isolation: Pay Bands Insert" ON public.pay_bands;
DROP POLICY IF EXISTS "Org Isolation: Pay Bands Update" ON public.pay_bands;
DROP POLICY IF EXISTS "Org Isolation: Pay Bands Delete" ON public.pay_bands;

CREATE POLICY "Pay Bands: Select" ON public.pay_bands FOR SELECT
USING (organization_id = public.org_id());

CREATE POLICY "Pay Bands: Insert" ON public.pay_bands FOR INSERT
WITH CHECK (organization_id = public.org_id());

CREATE POLICY "Pay Bands: Update" ON public.pay_bands FOR UPDATE
USING (organization_id = public.org_id());

CREATE POLICY "Pay Bands: Delete" ON public.pay_bands FOR DELETE
USING (organization_id = public.org_id());

-- ============================================================================
-- 5. AUDIT LOGS
-- ============================================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view own org audit logs" ON public.audit_logs;

CREATE POLICY "Audit Logs: Select" ON public.audit_logs FOR SELECT
USING (organization_id = public.org_id());

-- ============================================================================
-- 6. PROFILES (User Context)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles: Self Access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Profiles: Self Access" ON public.profiles FOR ALL
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- ============================================================================
-- 7. USER ROLES (User Context)
-- ============================================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User Roles: Self View" ON public.user_roles;
DROP POLICY IF EXISTS "User Roles: Insert" ON public.user_roles;

CREATE POLICY "User Roles: Self View" ON public.user_roles FOR SELECT
USING (user_id = auth.uid()::text);

CREATE POLICY "User Roles: Insert" ON public.user_roles FOR INSERT
WITH CHECK (organization_id = public.org_id());

-- ============================================================================
-- 8. INFO REQUESTS
-- ============================================================================
ALTER TABLE public.info_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Info Requests: Org Access" ON public.info_requests;

CREATE POLICY "Info Requests: Org Access" ON public.info_requests FOR ALL
USING (company_id IN (SELECT id FROM companies WHERE organization_id = public.org_id()));

-- ============================================================================
-- 9. CONSULTATION BOOKINGS
-- ============================================================================
ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Consultation: Self" ON public.consultation_bookings;

CREATE POLICY "Consultation: Self" ON public.consultation_bookings FOR ALL
USING (user_id = auth.uid()::text);
