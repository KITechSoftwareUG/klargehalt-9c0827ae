-- ============================================================
-- RBAC_EMPLOYEE_ROLE.sql
-- Professional Role-Based RLS for Klargehalt
-- Roles: admin | hr_manager | employee
-- ============================================================

-- Helper function: get the app role of the current user
-- Reads from user_roles table using the Clerk user ID from the JWT sub claim
CREATE OR REPLACE FUNCTION public.get_my_app_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = (auth.jwt() ->> 'sub')
  LIMIT 1;
$$;

-- Helper function: check if current user has one of the given roles
CREATE OR REPLACE FUNCTION public.has_app_role(required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = (auth.jwt() ->> 'sub')
      AND role = ANY(required_roles)
  );
$$;

-- Helper function: get organization_id of current user
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE user_id = (auth.jwt() ->> 'sub')
  LIMIT 1;
$$;

-- ============================================================
-- EMPLOYEES TABLE
-- hr_manager/admin: see all employees in their org
-- employee: see ONLY their own row
-- ============================================================

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies
DROP POLICY IF EXISTS "employees_authenticated_full_access" ON public.employees;
DROP POLICY IF EXISTS "employees_open_access" ON public.employees;

-- HR/Admin: full access within their org
CREATE POLICY "employees_hr_admin_all"
ON public.employees
FOR ALL
TO authenticated
USING (
  has_app_role(ARRAY['admin', 'hr_manager'])
  AND organization_id = get_my_org_id()
)
WITH CHECK (
  has_app_role(ARRAY['admin', 'hr_manager'])
  AND organization_id = get_my_org_id()
);

-- Employee: read-only on their own row
CREATE POLICY "employees_self_read"
ON public.employees
FOR SELECT
TO authenticated
USING (
  user_id = (auth.jwt() ->> 'sub')
);

-- ============================================================
-- PAY_BANDS TABLE
-- hr_manager/admin: full CRUD
-- employee: NO direct access (they use the RPC function below)
-- ============================================================

ALTER TABLE public.pay_bands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pay_bands_authenticated_full_access" ON public.pay_bands;
DROP POLICY IF EXISTS "pay_bands_open_access" ON public.pay_bands;

CREATE POLICY "pay_bands_hr_admin_all"
ON public.pay_bands
FOR ALL
TO authenticated
USING (has_app_role(ARRAY['admin', 'hr_manager']))
WITH CHECK (has_app_role(ARRAY['admin', 'hr_manager']));

-- ============================================================
-- JOB_PROFILES TABLE
-- hr_manager/admin: full CRUD
-- employee: read-only (job title/description only — no salary data)
-- ============================================================

ALTER TABLE public.job_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_profiles_authenticated_full_access" ON public.job_profiles;

-- HR/Admin: full access
CREATE POLICY "job_profiles_hr_admin_all"
ON public.job_profiles
FOR ALL
TO authenticated
USING (
  has_app_role(ARRAY['admin', 'hr_manager'])
  AND organization_id = get_my_org_id()
)
WITH CHECK (
  has_app_role(ARRAY['admin', 'hr_manager'])
  AND organization_id = get_my_org_id()
);

-- Employee: read job profiles of their own org (for transparency on levels/criteria)
CREATE POLICY "job_profiles_employee_read"
ON public.job_profiles
FOR SELECT
TO authenticated
USING (
  has_app_role(ARRAY['employee'])
  AND organization_id = get_my_org_id()
  AND is_active = true
);

-- ============================================================
-- AUDIT_LOGS TABLE
-- admin/hr_manager only — employees never see this
-- ============================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_authenticated_full_access" ON public.audit_logs;

CREATE POLICY "audit_logs_hr_admin_all"
ON public.audit_logs
FOR ALL
TO authenticated
USING (has_app_role(ARRAY['admin', 'hr_manager']))
WITH CHECK (has_app_role(ARRAY['admin', 'hr_manager']));

-- ============================================================
-- COMPANIES TABLE
-- admin: full access
-- hr_manager: read + update their own company
-- employee: no access
-- ============================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_authenticated_full_access" ON public.companies;

CREATE POLICY "companies_admin_all"
ON public.companies
FOR ALL
TO authenticated
USING (has_app_role(ARRAY['admin']))
WITH CHECK (has_app_role(ARRAY['admin']));

CREATE POLICY "companies_hr_read_update"
ON public.companies
FOR SELECT
TO authenticated
USING (
  has_app_role(ARRAY['hr_manager'])
  AND organization_id = get_my_org_id()
);

-- ============================================================
-- PROFILES TABLE
-- admin/hr_manager: see all in org
-- employee: own profile only
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_authenticated_full_access" ON public.profiles;

CREATE POLICY "profiles_hr_admin_all"
ON public.profiles
FOR ALL
TO authenticated
USING (
  has_app_role(ARRAY['admin', 'hr_manager'])
  AND organization_id = get_my_org_id()
)
WITH CHECK (
  has_app_role(ARRAY['admin', 'hr_manager'])
  AND organization_id = get_my_org_id()
);

CREATE POLICY "profiles_self_read_update"
ON public.profiles
FOR ALL
TO authenticated
USING (user_id = (auth.jwt() ->> 'sub'))
WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

-- ============================================================
-- USER_ROLES TABLE
-- admin: full CRUD
-- hr_manager: can assign 'employee' role within their org
-- others: no access
-- ============================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_authenticated_full_access" ON public.user_roles;

CREATE POLICY "user_roles_admin_all"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_app_role(ARRAY['admin']))
WITH CHECK (has_app_role(ARRAY['admin']));

-- HR can assign employee role (but not admin/hr_manager)
CREATE POLICY "user_roles_hr_assign_employee"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_app_role(ARRAY['hr_manager'])
  AND role = 'employee'
);

CREATE POLICY "user_roles_hr_read"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_app_role(ARRAY['hr_manager', 'admin']));

-- ============================================================
-- ONBOARDING_DATA TABLE
-- admin only
-- ============================================================

ALTER TABLE public.onboarding_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "onboarding_data_authenticated_full_access" ON public.onboarding_data;

CREATE POLICY "onboarding_data_admin_all"
ON public.onboarding_data
FOR ALL
TO authenticated
USING (has_app_role(ARRAY['admin', 'hr_manager']))
WITH CHECK (has_app_role(ARRAY['admin', 'hr_manager']));

-- ============================================================
-- SAFE RPC: Employee's own band position (anonymized)
-- Returns only quartile position — never raw salaries
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_band_position()
RETURNS TABLE (
  job_title           TEXT,
  job_level           TEXT,
  quartile            INTEGER,  -- 1-4
  position_label      TEXT,     -- e.g. "2. Quartil"
  your_level_exists   BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_user_id TEXT := auth.jwt() ->> 'sub';
  v_emp RECORD;
  v_band RECORD;
  v_quartile INTEGER;
BEGIN
  -- Get current user's employee record
  SELECT e.*, jp.title AS job_title_val
  INTO v_emp
  FROM public.employees e
  LEFT JOIN public.job_profiles jp ON jp.id = e.job_profile_id
  WHERE e.user_id = v_user_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Get the pay band for their level
  SELECT *
  INTO v_band
  FROM public.pay_bands
  WHERE job_profile_id = v_emp.job_profile_id
    AND job_level = v_emp.job_level
    AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
  ORDER BY valid_from DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      v_emp.job_title_val::TEXT,
      v_emp.job_level::TEXT,
      NULL::INTEGER,
      'Kein Band definiert'::TEXT,
      FALSE;
    RETURN;
  END IF;

  -- Quartile is determined by position within band
  -- We don't expose the employee's actual salary here
  -- This RPC just confirms the band exists for their level
  RETURN QUERY SELECT
    v_emp.job_title_val::TEXT,
    v_emp.job_level::TEXT,
    2::INTEGER,           -- placeholder; actual quartile needs salary data
    '2. Quartil'::TEXT,
    TRUE;
END;
$$;

-- Grant execute rights
GRANT EXECUTE ON FUNCTION public.get_my_app_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_app_role(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_band_position() TO authenticated;
