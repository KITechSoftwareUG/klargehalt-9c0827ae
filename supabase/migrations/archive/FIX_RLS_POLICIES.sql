-- ============================================================================
-- FIX RLS POLICIES FOR INSERT (ALLOW DATA CREATION)
-- ============================================================================
-- Description: The previous security hardening script enabled RLS but missed
-- explicit INSERT policies, effectively blocking new data creation.
-- This script adds the necessary INSERT/UPDATE permissions.
-- ============================================================================

-- Function to safely get Org ID (re-defining to be sure)
CREATE OR REPLACE FUNCTION public.org_id() 
RETURNS TEXT AS $$
    SELECT (auth.jwt() ->> 'org_id');
$$ LANGUAGE sql STABLE;

-- 1. COMPANIES
-- Users can create a company if the organization_id matches their Clerk Org ID
CREATE POLICY "Org Isolation: Companies Insert" ON public.companies
FOR INSERT
WITH CHECK (
    organization_id = public.org_id()
);

-- 2. EMPLOYEES
-- Users can insert employees into their own organization
CREATE POLICY "Org Isolation: Employees Insert" ON public.employees
FOR INSERT
WITH CHECK (
    organization_id = public.org_id()
);

-- Update policy was also missing/implicit? Let's be explicit.
CREATE POLICY "Org Isolation: Employees Update" ON public.employees
FOR UPDATE
USING (organization_id = public.org_id())
WITH CHECK (organization_id = public.org_id());

CREATE POLICY "Org Isolation: Employees Delete" ON public.employees
FOR DELETE
USING (organization_id = public.org_id());


-- 3. JOB PROFILES
CREATE POLICY "Org Isolation: Job Profiles Insert" ON public.job_profiles
FOR INSERT
WITH CHECK (
    organization_id = public.org_id()
);

CREATE POLICY "Org Isolation: Job Profiles Update" ON public.job_profiles
FOR UPDATE
USING (organization_id = public.org_id())
WITH CHECK (organization_id = public.org_id());

CREATE POLICY "Org Isolation: Job Profiles Delete" ON public.job_profiles
FOR DELETE
USING (organization_id = public.org_id());


-- 4. PAY BANDS
CREATE POLICY "Org Isolation: Pay Bands Insert" ON public.pay_bands
FOR INSERT
WITH CHECK (
    organization_id = public.org_id()
);

CREATE POLICY "Org Isolation: Pay Bands Update" ON public.pay_bands
FOR UPDATE
USING (organization_id = public.org_id())
WITH CHECK (organization_id = public.org_id());

CREATE POLICY "Org Isolation: Pay Bands Delete" ON public.pay_bands
FOR DELETE
USING (organization_id = public.org_id());


-- 5. PROFILES & USER ROLES (Critical for Onboarding)
-- Ensure these are also protected but writable
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to insert/update their own profile
-- Profiles are linked by user_id, not necessarily organization_id at first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Profiles: Self Access" ON public.profiles
FOR ALL
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- Role management
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can see their own role
CREATE POLICY "User Roles: Self View" ON public.user_roles
FOR SELECT
USING (user_id = auth.uid()::text);

-- Only Admins (or system triggers) should typically assign roles.
-- But for onboarding (first user), we might need to allow self-assignment OR use a trigger.
-- For now, let's allow INSERT if the org_id matches (Clerk trust).
CREATE POLICY "User Roles: Insert" ON public.user_roles
FOR INSERT
WITH CHECK (
    organization_id = public.org_id()
);

-- Fix for Info Requests (if needed)
ALTER TABLE public.info_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Info Requests: Org Access" ON public.info_requests
FOR ALL
USING (company_id IN (SELECT id FROM companies WHERE organization_id = public.org_id()));
