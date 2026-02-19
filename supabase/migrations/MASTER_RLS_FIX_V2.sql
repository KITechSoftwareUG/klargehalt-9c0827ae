-- ============================================================================
-- MASTER RLS FIX V2 - STRUCTURE AND SECURITY
-- ============================================================================
-- 1. Ensure 'organization_id' column exists on ALL relevant tables.
-- 2. Force Enable RLS.
-- 3. Set strict policies using public.org_id().
-- ============================================================================

-- 0. Helper Function
CREATE OR REPLACE FUNCTION public.org_id() 
RETURNS TEXT AS $$
    SELECT (auth.jwt() ->> 'org_id');
$$ LANGUAGE sql STABLE;

-- 1. ADD MISSING COLUMNS (Idempotent)
DO $$ 
BEGIN
    -- Pay Bands
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pay_bands' AND column_name='organization_id') THEN
        ALTER TABLE public.pay_bands ADD COLUMN organization_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_pay_bands_org ON public.pay_bands(organization_id);
    END IF;

    -- User Roles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_roles' AND column_name='organization_id') THEN
        ALTER TABLE public.user_roles ADD COLUMN organization_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_user_roles_org ON public.user_roles(organization_id);
    END IF;

    -- Info Requests (Optional but good for direct filtering)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='info_requests' AND column_name='organization_id') THEN
        ALTER TABLE public.info_requests ADD COLUMN organization_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_info_requests_org ON public.info_requests(organization_id);
    END IF;

    -- Consultation Bookings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_bookings' AND column_name='organization_id') THEN
        ALTER TABLE public.consultation_bookings ADD COLUMN organization_id TEXT;
    END IF;
    
    -- Ensure others have it too (Double Check)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='organization_id') THEN
        ALTER TABLE public.employees ADD COLUMN organization_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_profiles' AND column_name='organization_id') THEN
        ALTER TABLE public.job_profiles ADD COLUMN organization_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='organization_id') THEN
        ALTER TABLE public.companies ADD COLUMN organization_id TEXT;
    END IF;

END $$;

-- ============================================================================
-- 1.5 DATA BACKFILL (CRITICAL FIX)
-- ============================================================================
-- We populate the empty organization_id columns based on the company relation.
-- This prevents data from "disappearing" when we enable strict RLS.

DO $$
BEGIN
    -- Backfill Employees
    UPDATE public.employees e
    SET organization_id = c.organization_id
    FROM public.companies c
    WHERE e.company_id = c.id 
    AND e.organization_id IS NULL 
    AND c.organization_id IS NOT NULL;

    -- Backfill Job Profiles
    UPDATE public.job_profiles jp
    SET organization_id = c.organization_id
    FROM public.companies c
    WHERE jp.company_id = c.id 
    AND jp.organization_id IS NULL
    AND c.organization_id IS NOT NULL;

    -- Backfill Pay Bands
    UPDATE public.pay_bands pb
    SET organization_id = c.organization_id
    FROM public.companies c
    WHERE pb.company_id = c.id 
    AND pb.organization_id IS NULL
    AND c.organization_id IS NOT NULL;
    
    -- Backfill User Roles
    UPDATE public.user_roles ur
    SET organization_id = c.organization_id
    FROM public.companies c
    WHERE ur.company_id = c.id 
    AND ur.organization_id IS NULL
    AND c.organization_id IS NOT NULL;

END $$;


-- ============================================================================
-- 2. RLS POLICIES (Re-Apply)
-- ============================================================================

-- A. COMPANIES
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Companies: Select" ON public.companies;
DROP POLICY IF EXISTS "Companies: Insert" ON public.companies;
DROP POLICY IF EXISTS "Companies: Update" ON public.companies;

CREATE POLICY "Companies: Select" ON public.companies FOR SELECT
USING (organization_id = public.org_id() OR organization_id IS NULL); -- Allow Demo data
CREATE POLICY "Companies: Insert" ON public.companies FOR INSERT
WITH CHECK (organization_id = public.org_id());
CREATE POLICY "Companies: Update" ON public.companies FOR UPDATE
USING (organization_id = public.org_id());


-- B. EMPLOYEES
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employees: Select" ON public.employees;
DROP POLICY IF EXISTS "Employees: Insert" ON public.employees;
DROP POLICY IF EXISTS "Employees: Update" ON public.employees;
DROP POLICY IF EXISTS "Employees: Delete" ON public.employees;

CREATE POLICY "Employees: Select" ON public.employees FOR SELECT
USING (organization_id = public.org_id());
CREATE POLICY "Employees: Insert" ON public.employees FOR INSERT
WITH CHECK (organization_id = public.org_id());
CREATE POLICY "Employees: Update" ON public.employees FOR UPDATE
USING (organization_id = public.org_id());
CREATE POLICY "Employees: Delete" ON public.employees FOR DELETE
USING (organization_id = public.org_id());


-- C. JOB PROFILES
ALTER TABLE public.job_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Job Profiles: Select" ON public.job_profiles;
DROP POLICY IF EXISTS "Job Profiles: Insert" ON public.job_profiles;
DROP POLICY IF EXISTS "Job Profiles: Update" ON public.job_profiles;
DROP POLICY IF EXISTS "Job Profiles: Delete" ON public.job_profiles;

CREATE POLICY "Job Profiles: Select" ON public.job_profiles FOR SELECT
USING (organization_id = public.org_id() OR organization_id IS NULL);
CREATE POLICY "Job Profiles: Insert" ON public.job_profiles FOR INSERT
WITH CHECK (organization_id = public.org_id());
CREATE POLICY "Job Profiles: Update" ON public.job_profiles FOR UPDATE
USING (organization_id = public.org_id());
CREATE POLICY "Job Profiles: Delete" ON public.job_profiles FOR DELETE
USING (organization_id = public.org_id());


-- D. PAY BANDS
ALTER TABLE public.pay_bands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pay Bands: Select" ON public.pay_bands;
DROP POLICY IF EXISTS "Pay Bands: Insert" ON public.pay_bands;
DROP POLICY IF EXISTS "Pay Bands: Update" ON public.pay_bands;
DROP POLICY IF EXISTS "Pay Bands: Delete" ON public.pay_bands;

CREATE POLICY "Pay Bands: Select" ON public.pay_bands FOR SELECT
USING (organization_id = public.org_id());
CREATE POLICY "Pay Bands: Insert" ON public.pay_bands FOR INSERT
WITH CHECK (organization_id = public.org_id());
CREATE POLICY "Pay Bands: Update" ON public.pay_bands FOR UPDATE
USING (organization_id = public.org_id());
CREATE POLICY "Pay Bands: Delete" ON public.pay_bands FOR DELETE
USING (organization_id = public.org_id());


-- E. USER ROLES
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User Roles: Self View" ON public.user_roles;
DROP POLICY IF EXISTS "User Roles: Insert" ON public.user_roles;

CREATE POLICY "User Roles: Self View" ON public.user_roles FOR SELECT
USING (user_id = auth.uid()::text); 
-- Allow inserting role if it belongs to current org
CREATE POLICY "User Roles: Insert" ON public.user_roles FOR INSERT
WITH CHECK (organization_id = public.org_id());


-- F. INFO REQUESTS
ALTER TABLE public.info_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Info Requests: Org Access" ON public.info_requests;

-- Use company_id join for robustness in case org_id is not populated on specific rows yet
CREATE POLICY "Info Requests: Org Access" ON public.info_requests FOR ALL
USING (company_id IN (SELECT id FROM companies WHERE organization_id = public.org_id()));

