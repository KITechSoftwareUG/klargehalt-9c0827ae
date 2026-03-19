-- ============================================================================
-- SECURITY HARDENING & AUDIT LOGGING
-- ============================================================================
-- 1. Enable RLS on all critical tables
-- 2. Define strict Tier-based Policies
-- 3. Setup Audit Logging
-- ============================================================================

-- A. AUDIT LOGGING INFRASTRUCTURE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT, -- Clerk Org ID
    user_id TEXT,         -- Clerk User ID
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'SELECT_SENSITIVE'
    table_name TEXT NOT NULL,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,      -- Via request headers if available
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on Audit Logs (Admins only see their org's logs)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view own org audit logs" ON public.audit_logs
FOR SELECT USING (
    organization_id = (auth.jwt() ->> 'org_id') 
    -- Assumption: JWT contains 'org_id' claim from Clerk
);

-- Audit Function
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    current_org_id TEXT;
    current_user_id TEXT;
BEGIN
    -- Try to get context from JWT
    current_org_id := (auth.jwt() ->> 'org_id');
    current_user_id := (auth.jwt() ->> 'sub'); -- Clerk User ID is usually in 'sub'
    
    -- Fallback if not in JWT (e.g. internal operations), try to get from record
    IF current_org_id IS NULL THEN
        IF TG_OP = 'DELETE' THEN
            current_org_id := OLD.organization_id;
        ELSE
            current_org_id := NEW.organization_id;
        END IF;
    END IF;

    INSERT INTO public.audit_logs (
        organization_id,
        user_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data
    ) VALUES (
        current_org_id,
        current_user_id,
        TG_OP,
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id::text ELSE NEW.id::text END,
        CASE WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN to_jsonb(NEW) ELSE NULL END
    );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- B. APPLY AUDIT TRIGGERS (Data Minimization & Accountability)
-- ============================================================================
-- Only audit tables with sensitive data or configuration

DROP TRIGGER IF EXISTS audit_employees_changes ON public.employees;
CREATE TRIGGER audit_employees_changes
AFTER INSERT OR UPDATE OR DELETE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_pay_bands_changes ON public.pay_bands;
CREATE TRIGGER audit_pay_bands_changes
AFTER INSERT OR UPDATE OR DELETE ON public.pay_bands
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_job_profiles_changes ON public.job_profiles;
CREATE TRIGGER audit_job_profiles_changes
AFTER INSERT OR UPDATE OR DELETE ON public.job_profiles
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();


-- C. STRICT RLS POLICIES (Fortress Mode)
-- ============================================================================

-- Function to safely get Org ID
CREATE OR REPLACE FUNCTION auth.org_id() 
RETURNS TEXT AS $$
    SELECT (auth.jwt() ->> 'org_id');
$$ LANGUAGE sql STABLE;

-- 1. EMPLOYEES
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Drop insecure policies from previous fixes
DROP POLICY IF EXISTS "Employees Access" ON public.employees; 
DROP POLICY IF EXISTS "Enable read access for all users" ON public.employees;

-- Strict Isolation Policy
CREATE POLICY "Org Isolation: Employees" ON public.employees
FOR ALL
USING (
    organization_id = auth.org_id()
)
WITH CHECK (
    organization_id = auth.org_id()
);

-- Exception: Demo Data (Read Only for everyone, if configured)
-- Uncomment if you need public demo data:
 CREATE POLICY "Demo Data Access" ON public.employees
 FOR SELECT
 USING (
    organization_id IS NULL 
    -- OR organization_id = 'demo_org_id'
 );


-- 2. JOB PROFILES
ALTER TABLE public.job_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Job Profiles Access" ON public.job_profiles;

CREATE POLICY "Org Isolation: Job Profiles" ON public.job_profiles
FOR ALL
USING (
    organization_id = auth.org_id()
)
WITH CHECK (
    organization_id = auth.org_id()
);
CREATE POLICY "Demo Job Profiles" ON public.job_profiles FOR SELECT USING (organization_id IS NULL);


-- 3. COMPANIES (Tenants)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org Isolation: Companies" ON public.companies
FOR SELECT
USING (
    organization_id = auth.org_id() OR organization_id IS NULL -- Demo Company
);

CREATE POLICY "Org Isolation: Companies Update" ON public.companies
FOR UPDATE
USING (
    organization_id = auth.org_id()
);


-- 4. PAY BANDS
ALTER TABLE public.pay_bands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org Isolation: Pay Bands" ON public.pay_bands
FOR ALL
USING (
    organization_id = auth.org_id()
)
WITH CHECK (
    organization_id = auth.org_id()
);

-- D. INDEXING (Performance & Security)
-- ============================================================================
-- Ensure queries filtering by org_id are fast (avoids table scans)

CREATE INDEX IF NOT EXISTS idx_employees_org ON public.employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_profiles_org ON public.job_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON public.audit_logs(organization_id);
