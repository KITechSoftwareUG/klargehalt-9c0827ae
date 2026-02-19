-- ============================================================================
-- ROBUST RLS FALLBACK (NO JWT CLAIMS NEEDED)
-- ============================================================================
-- Description: This script changes the RLS strategy from "JWT Claims" (which 
-- require custom Clerk configuration) to "Database Lookup" (which works 
-- immediately with standard auth).
-- ============================================================================

-- 1. Create Helper Function based on User Roles table
-- This looks up the organization_id directly from the database for the current user.
CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS TEXT AS $$
    SELECT organization_id
    FROM public.user_roles
    WHERE user_id = auth.uid()::text
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Update Helper for Public Access (Demo Data)
-- We allow access if the record's user_id matches OR if it's the user's org
-- But for simple "Filter by Org", we just check the org.

-- ============================================================================
-- RE-APPLY POLICIES USING NEW FUNCTION
-- ============================================================================

-- A. COMPANIES
DROP POLICY IF EXISTS "Companies: Select" ON public.companies;
DROP POLICY IF EXISTS "Companies: Insert" ON public.companies;
DROP POLICY IF EXISTS "Companies: Update" ON public.companies;

CREATE POLICY "Companies: Select" ON public.companies FOR SELECT
USING (
    organization_id = public.current_user_org_id() 
    OR organization_id IS NULL -- Demo Data
    OR created_by = auth.uid()::text -- Creator Access
);

CREATE POLICY "Companies: Insert" ON public.companies FOR INSERT
WITH CHECK (
    -- Allow creation if user is authenticated (we trust the frontend/clerk for now to set the org)
    -- OR enforce that the inserted org_id matches what we expect? 
    -- For onboarding, we just require authentication.
    auth.uid() IS NOT NULL
);

CREATE POLICY "Companies: Update" ON public.companies FOR UPDATE
USING (
    organization_id = public.current_user_org_id()
    OR created_by = auth.uid()::text
);

-- B. EMPLOYEES
DROP POLICY IF EXISTS "Employees: Select" ON public.employees;
DROP POLICY IF EXISTS "Employees: Insert" ON public.employees;
DROP POLICY IF EXISTS "Employees: Update" ON public.employees;
DROP POLICY IF EXISTS "Employees: Delete" ON public.employees;

CREATE POLICY "Employees: Select" ON public.employees FOR SELECT
USING (organization_id = public.current_user_org_id());

CREATE POLICY "Employees: Insert" ON public.employees FOR INSERT
WITH CHECK (organization_id = public.current_user_org_id());

CREATE POLICY "Employees: Update" ON public.employees FOR UPDATE
USING (organization_id = public.current_user_org_id());

CREATE POLICY "Employees: Delete" ON public.employees FOR DELETE
USING (organization_id = public.current_user_org_id());


-- C. JOB PROFILES
DROP POLICY IF EXISTS "Job Profiles: Select" ON public.job_profiles;
DROP POLICY IF EXISTS "Job Profiles: Insert" ON public.job_profiles;
DROP POLICY IF EXISTS "Job Profiles: Update" ON public.job_profiles;
DROP POLICY IF EXISTS "Job Profiles: Delete" ON public.job_profiles;

CREATE POLICY "Job Profiles: Select" ON public.job_profiles FOR SELECT
USING (organization_id = public.current_user_org_id() OR organization_id IS NULL);

CREATE POLICY "Job Profiles: Insert" ON public.job_profiles FOR INSERT
WITH CHECK (organization_id = public.current_user_org_id());

CREATE POLICY "Job Profiles: Update" ON public.job_profiles FOR UPDATE
USING (organization_id = public.current_user_org_id());

CREATE POLICY "Job Profiles: Delete" ON public.job_profiles FOR DELETE
USING (organization_id = public.current_user_org_id());


-- D. PAY BANDS
DROP POLICY IF EXISTS "Pay Bands: Select" ON public.pay_bands;
DROP POLICY IF EXISTS "Pay Bands: Insert" ON public.pay_bands;
DROP POLICY IF EXISTS "Pay Bands: Update" ON public.pay_bands;
DROP POLICY IF EXISTS "Pay Bands: Delete" ON public.pay_bands;

CREATE POLICY "Pay Bands: Select" ON public.pay_bands FOR SELECT
USING (organization_id = public.current_user_org_id());

CREATE POLICY "Pay Bands: Insert" ON public.pay_bands FOR INSERT
WITH CHECK (organization_id = public.current_user_org_id());

CREATE POLICY "Pay Bands: Update" ON public.pay_bands FOR UPDATE
USING (organization_id = public.current_user_org_id());

CREATE POLICY "Pay Bands: Delete" ON public.pay_bands FOR DELETE
USING (organization_id = public.current_user_org_id());


-- E. USER ROLES (Critical Hook)
DROP POLICY IF EXISTS "User Roles: Self View" ON public.user_roles;
DROP POLICY IF EXISTS "User Roles: Insert" ON public.user_roles;

CREATE POLICY "User Roles: Self View" ON public.user_roles FOR SELECT
USING (user_id = auth.uid()::text); 

-- Allow users to insert their INITIAL role during onboarding
CREATE POLICY "User Roles: Insert" ON public.user_roles FOR INSERT
WITH CHECK (user_id = auth.uid()::text);


-- F. PROFILES
DROP POLICY IF EXISTS "Profiles: Self Access" ON public.profiles;
CREATE POLICY "Profiles: Self Access" ON public.profiles FOR ALL
USING (user_id = auth.uid()::text);


-- G. INFO REQUESTS
DROP POLICY IF EXISTS "Info Requests: Org Access" ON public.info_requests;
CREATE POLICY "Info Requests: Org Access" ON public.info_requests FOR ALL
USING (
    company_id IN (
        SELECT id FROM companies WHERE organization_id = public.current_user_org_id()
    )
);

-- ============================================================================
-- 3. EMERGENCY FIX FOR MISSING ROLES
-- ============================================================================
-- If a user exists in profiles but has no role (due to earlier errors), 
-- they will be blocked by current_user_org_id() returning NULL.
-- Let's auto-create roles for any stranded users.
INSERT INTO public.user_roles (user_id, role, organization_id, company_id)
SELECT 
    p.user_id, 
    'admin', 
    c.organization_id, 
    c.id
FROM public.profiles p
JOIN public.companies c ON p.company_name = c.name OR p.organization_id = c.organization_id
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id)
ON CONFLICT DO NOTHING;
