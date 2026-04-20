-- ============================================================
-- CANONICAL SCHEMA MIGRATION
-- KlarGehalt — EU Pay Transparency Compliance SaaS
-- Replaces all 17 ad-hoc patch files with a single idempotent migration.
-- Safe to run on both fresh and existing databases.
-- ============================================================

-- ============================================================
-- PART 1: Extensions and Helper Functions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- org_id() helper: extracts tenant org ID from the Logto JWT claim.
-- SECURITY DEFINER ensures consistent execution context.
-- DO NOT use auth_uid() anywhere — it returns NULL with Logto JWTs.
-- Always use auth.jwt() ->> 'sub' for user identity.
CREATE OR REPLACE FUNCTION public.org_id()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    -- Primary: extract org ID from Logto organization token audience claim
    -- Format: 'urn:logto:organization:org_abc123' → 'org_abc123'
    CASE
      WHEN (auth.jwt() ->> 'aud') LIKE 'urn:logto:organization:%'
      THEN REPLACE(auth.jwt() ->> 'aud', 'urn:logto:organization:', '')
    END,
    -- Fallback: direct org_id claim (custom JWT template)
    auth.jwt() ->> 'org_id'
  )
$$;

GRANT EXECUTE ON FUNCTION public.org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.org_id() TO anon;


-- ============================================================
-- PART 2: Core Tables
-- ============================================================

-- 1. organizations
-- Thin mapping table: links a Logto org ID to company metadata.
-- Used by RLS to resolve tenant without a join on every query.
CREATE TABLE IF NOT EXISTS organizations (
  id              TEXT PRIMARY KEY,  -- Logto org ID, e.g. "org_abc123"
  company_name    TEXT NOT NULL,
  country         TEXT NOT NULL DEFAULT 'DE',
  employee_count  INTEGER,
  reporting_year  INTEGER,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. companies
-- Company metadata (legal name, address, country, industry).
-- organization_id TEXT NOT NULL UNIQUE links to Logto org.
CREATE TABLE IF NOT EXISTS companies (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id      TEXT NOT NULL UNIQUE,
  name                 TEXT NOT NULL,
  legal_name           TEXT,
  country              TEXT DEFAULT 'DE',
  industry             TEXT,
  employee_size_band   TEXT,    -- '100-149','150-249','250+'; drives reporting frequency
  reporting_frequency  TEXT,    -- 'annual','triennial'
  subscription_tier    TEXT DEFAULT 'professional',
  subscription_status  TEXT DEFAULT 'trialing',
  trial_ends_at        TIMESTAMPTZ,
  stripe_customer_id   TEXT,
  stripe_subscription_id TEXT,
  current_period_end   TIMESTAMPTZ,
  created_by           TEXT,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- Add columns to companies if they don't exist (idempotent for existing DBs)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS legal_name TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS employee_size_band TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reporting_frequency TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'professional';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_by TEXT;

-- Ensure NOT NULL on organization_id after backfill (see data safety section below)
-- This is done at the end of the migration after any necessary backfill.

-- 3. departments
-- Explicit department table. Required for EU reporting breakdowns.
CREATE TABLE IF NOT EXISTS departments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  TEXT NOT NULL,
  name             TEXT NOT NULL,
  parent_id        UUID REFERENCES departments(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- 4. job_levels
-- Enumeration of levels. Referenced by job_profiles and pay_bands.
CREATE TABLE IF NOT EXISTS job_levels (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  TEXT NOT NULL,
  name             TEXT NOT NULL,
  rank             INTEGER NOT NULL,
  UNIQUE(organization_id, name)
);

-- 5. job_profiles
-- "Work category" anchor for EU directive compliance (Article 4.4).
CREATE TABLE IF NOT EXISTS job_profiles (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id          TEXT NOT NULL,
  title                    TEXT NOT NULL,
  description              TEXT,
  department_id            UUID REFERENCES departments(id),
  skills_score             INTEGER CHECK (skills_score BETWEEN 1 AND 5),
  effort_score             INTEGER CHECK (effort_score BETWEEN 1 AND 5),
  responsibility_score     INTEGER CHECK (responsibility_score BETWEEN 1 AND 5),
  working_conditions_score INTEGER CHECK (working_conditions_score BETWEEN 1 AND 5),
  is_active                BOOLEAN DEFAULT true,
  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns to job_profiles if they don't exist
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS skills_score INTEGER;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS effort_score INTEGER;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS responsibility_score INTEGER;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS working_conditions_score INTEGER;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 6. pay_bands
-- Salary range for a specific job_profile + job_level combination.
CREATE TABLE IF NOT EXISTS pay_bands (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  TEXT NOT NULL,
  job_profile_id   UUID NOT NULL REFERENCES job_profiles(id),
  job_level_id     UUID NOT NULL REFERENCES job_levels(id),
  min_salary       NUMERIC(12,2) NOT NULL,
  max_salary       NUMERIC(12,2) NOT NULL,
  currency         TEXT DEFAULT 'EUR',
  is_active        BOOLEAN DEFAULT true,
  effective_from   DATE NOT NULL,
  effective_to     DATE,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  CHECK (max_salary >= min_salary),
  UNIQUE(organization_id, job_profile_id, job_level_id, effective_from)
);

-- Add missing columns to pay_bands if they don't exist
ALTER TABLE pay_bands ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE pay_bands ADD COLUMN IF NOT EXISTS job_level_id UUID;
ALTER TABLE pay_bands ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE pay_bands ADD COLUMN IF NOT EXISTS effective_from DATE;
ALTER TABLE pay_bands ADD COLUMN IF NOT EXISTS effective_to DATE;
ALTER TABLE pay_bands ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 7. employees
-- Source-of-truth table for all gap calculations.
CREATE TABLE IF NOT EXISTS employees (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  TEXT NOT NULL,
  employee_number  TEXT,
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  email            TEXT,
  gender           TEXT NOT NULL CHECK (gender IN ('male','female','diverse','not_specified')),
  birth_year       INTEGER,
  job_profile_id   UUID REFERENCES job_profiles(id),
  job_level_id     UUID REFERENCES job_levels(id),
  department_id    UUID REFERENCES departments(id),
  employment_type  TEXT NOT NULL CHECK (employment_type IN ('full_time','part_time','contract')),
  location         TEXT,
  hire_date        DATE NOT NULL,
  base_salary      NUMERIC(12,2) NOT NULL,
  variable_pay     NUMERIC(12,2) DEFAULT 0,
  weekly_hours     NUMERIC(5,2) DEFAULT 40,
  currency         TEXT DEFAULT 'EUR',
  pay_band_id      UUID REFERENCES pay_bands(id),
  on_leave         BOOLEAN DEFAULT false,
  leave_type       TEXT CHECK (leave_type IN ('maternity','paternity','parental','carer') OR leave_type IS NULL),
  leave_start      DATE,
  leave_end        DATE,
  user_id          TEXT,
  is_active        BOOLEAN DEFAULT true,
  created_by       TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns to employees if they don't exist
ALTER TABLE employees ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_number TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS birth_year INTEGER;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS job_level_id UUID;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department_id UUID;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS variable_pay NUMERIC(12,2) DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS weekly_hours NUMERIC(5,2) DEFAULT 40;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pay_band_id UUID;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS on_leave BOOLEAN DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS leave_type TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS leave_start DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS leave_end DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 8. salary_history
-- Immutable append-only log of every salary change per employee.
CREATE TABLE IF NOT EXISTS salary_history (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  TEXT NOT NULL,
  employee_id      UUID NOT NULL REFERENCES employees(id),
  base_salary      NUMERIC(12,2) NOT NULL,
  variable_pay     NUMERIC(12,2) DEFAULT 0,
  effective_date   DATE NOT NULL,
  change_reason    TEXT,
  changed_by       TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- 9. pay_gap_snapshots
-- Pre-computed pay gap statistics. Refreshed on demand or schedule.
CREATE TABLE IF NOT EXISTS pay_gap_snapshots (
  id                             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id                TEXT NOT NULL,
  snapshot_date                  DATE NOT NULL,
  scope                          TEXT NOT NULL,  -- 'company','department','job_profile','job_level'
  scope_id                       UUID,           -- references the scoped entity; NULL = company-wide
  scope_label                    TEXT,
  -- Unadjusted gap (EU required: Article 9)
  male_count                     INTEGER NOT NULL DEFAULT 0,
  female_count                   INTEGER NOT NULL DEFAULT 0,
  male_mean_base                 NUMERIC(12,2),
  female_mean_base               NUMERIC(12,2),
  male_median_base               NUMERIC(12,2),
  female_median_base             NUMERIC(12,2),
  mean_gap_base_pct              NUMERIC(5,2),   -- (male-female)/male * 100
  median_gap_base_pct            NUMERIC(5,2),
  -- Variable pay gap (EU required)
  male_mean_variable             NUMERIC(12,2),
  female_mean_variable           NUMERIC(12,2),
  mean_gap_variable_pct          NUMERIC(5,2),
  pct_male_receiving_variable    NUMERIC(5,2),
  pct_female_receiving_variable  NUMERIC(5,2),
  -- Quartile distribution (EU required)
  q1_male_pct                    NUMERIC(5,2),
  q1_female_pct                  NUMERIC(5,2),
  q2_male_pct                    NUMERIC(5,2),
  q2_female_pct                  NUMERIC(5,2),
  q3_male_pct                    NUMERIC(5,2),
  q3_female_pct                  NUMERIC(5,2),
  q4_male_pct                    NUMERIC(5,2),
  q4_female_pct                  NUMERIC(5,2),
  -- Compliance signal
  gap_status                     TEXT CHECK (gap_status IN ('compliant','warning','breach')),
  requires_joint_assessment      BOOLEAN DEFAULT false,
  is_suppressed                  BOOLEAN DEFAULT false,
  created_at                     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, snapshot_date, scope, scope_id)
);

-- 10. compliance_reports
-- Generated compliance reports linked to a snapshot period.
CREATE TABLE IF NOT EXISTS compliance_reports (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  TEXT NOT NULL,
  report_year      INTEGER NOT NULL,
  reporting_period TEXT,
  status           TEXT CHECK (status IN ('draft','finalized','submitted')),
  snapshot_ids     UUID[],
  generated_by     TEXT NOT NULL,
  finalized_at     TIMESTAMPTZ,
  submitted_at     TIMESTAMPTZ,
  report_data      JSONB,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- 11. audit_logs
-- Immutable compliance audit trail. Append-only — no UPDATE or DELETE.
CREATE TABLE IF NOT EXISTS audit_logs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  TEXT NOT NULL,
  user_id          TEXT NOT NULL,
  action           TEXT NOT NULL,
  entity_type      TEXT NOT NULL,
  entity_id        UUID,
  before_state     JSONB,
  after_state      JSONB,
  ip_address       TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns to audit_logs if they don't exist
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS before_state JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS after_state JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- 12. user_roles
CREATE TABLE IF NOT EXISTS user_roles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          TEXT NOT NULL,
  organization_id  TEXT NOT NULL,
  role             TEXT NOT NULL CHECK (role IN ('admin','hr_manager','employee')),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns to user_roles if they don't exist
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 13. profiles
CREATE TABLE IF NOT EXISTS profiles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          TEXT NOT NULL UNIQUE,
  organization_id  TEXT,
  full_name        TEXT,
  email            TEXT,
  avatar_url       TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns to profiles if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 14. info_requests
-- EU directive Article 7: employee right to information requests.
CREATE TABLE IF NOT EXISTS info_requests (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  TEXT NOT NULL,
  employee_id      UUID REFERENCES employees(id),
  request_type     TEXT CHECK (request_type IN ('avg_pay_category','pay_band','gap_explanation')),
  status           TEXT CHECK (status IN ('pending','fulfilled','declined')),
  job_profile_id   UUID,
  response_data    JSONB,
  processed_by     TEXT,
  processed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns to info_requests if they don't exist
ALTER TABLE info_requests ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE info_requests ADD COLUMN IF NOT EXISTS employee_id UUID;
ALTER TABLE info_requests ADD COLUMN IF NOT EXISTS request_type TEXT;
ALTER TABLE info_requests ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE info_requests ADD COLUMN IF NOT EXISTS job_profile_id UUID;
ALTER TABLE info_requests ADD COLUMN IF NOT EXISTS response_data JSONB;
ALTER TABLE info_requests ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;


-- ============================================================
-- PART 3: user_roles unique constraint fix
-- ============================================================

-- Remove duplicates keeping only the newest row per (user_id, organization_id)
DELETE FROM user_roles a USING user_roles b
WHERE a.created_at < b.created_at
  AND a.user_id = b.user_id
  AND a.organization_id = b.organization_id;

-- Drop old incorrect single-column constraint
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_key;

-- Add correct composite unique constraint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_org_unique') THEN
    ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_org_unique UNIQUE (user_id, organization_id);
  END IF;
END $$;


-- ============================================================
-- PART 4: Drop ALL existing policies on all tenant tables
-- (programmatic drop to eliminate any USING-true remnants)
-- ============================================================

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'organizations','companies','departments','job_levels',
        'job_profiles','pay_bands','employees','salary_history',
        'pay_gap_snapshots','compliance_reports','audit_logs',
        'user_roles','profiles','info_requests'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;


-- ============================================================
-- PART 5: Enable RLS on all tenant-scoped tables
-- ============================================================

ALTER TABLE organizations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations        FORCE ROW LEVEL SECURITY;

ALTER TABLE companies            ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies            FORCE ROW LEVEL SECURITY;

ALTER TABLE departments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments          FORCE ROW LEVEL SECURITY;

ALTER TABLE job_levels           ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_levels           FORCE ROW LEVEL SECURITY;

ALTER TABLE job_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_profiles         FORCE ROW LEVEL SECURITY;

ALTER TABLE pay_bands            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_bands            FORCE ROW LEVEL SECURITY;

ALTER TABLE employees            ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees            FORCE ROW LEVEL SECURITY;

ALTER TABLE salary_history       ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_history       FORCE ROW LEVEL SECURITY;

ALTER TABLE pay_gap_snapshots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_gap_snapshots    FORCE ROW LEVEL SECURITY;

ALTER TABLE compliance_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports   FORCE ROW LEVEL SECURITY;

ALTER TABLE audit_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs           FORCE ROW LEVEL SECURITY;

ALTER TABLE user_roles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles           FORCE ROW LEVEL SECURITY;

ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles             FORCE ROW LEVEL SECURITY;

ALTER TABLE info_requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE info_requests        FORCE ROW LEVEL SECURITY;


-- ============================================================
-- PART 6: RLS Policies
-- Standard tenant isolation: organization_id = public.org_id()
-- NO open policies (USING-true or WITH-CHECK-true) anywhere.
-- NO auth_uid() anywhere — use auth.jwt() ->> 'sub' for user identity.
-- ============================================================

-- organizations
CREATE POLICY "tenant_isolation" ON organizations
  FOR ALL TO authenticated
  USING (id = public.org_id())
  WITH CHECK (id = public.org_id());

-- companies
CREATE POLICY "tenant_isolation" ON companies
  FOR ALL TO authenticated
  USING (organization_id = public.org_id())
  WITH CHECK (organization_id = public.org_id());

-- departments
CREATE POLICY "tenant_isolation" ON departments
  FOR ALL TO authenticated
  USING (organization_id = public.org_id())
  WITH CHECK (organization_id = public.org_id());

-- job_levels
CREATE POLICY "tenant_isolation" ON job_levels
  FOR ALL TO authenticated
  USING (organization_id = public.org_id())
  WITH CHECK (organization_id = public.org_id());

-- job_profiles
CREATE POLICY "tenant_isolation" ON job_profiles
  FOR ALL TO authenticated
  USING (organization_id = public.org_id())
  WITH CHECK (organization_id = public.org_id());

-- pay_bands
CREATE POLICY "tenant_isolation" ON pay_bands
  FOR ALL TO authenticated
  USING (organization_id = public.org_id())
  WITH CHECK (organization_id = public.org_id());

-- salary_history
CREATE POLICY "tenant_isolation" ON salary_history
  FOR ALL TO authenticated
  USING (organization_id = public.org_id())
  WITH CHECK (organization_id = public.org_id());

-- pay_gap_snapshots
CREATE POLICY "tenant_isolation" ON pay_gap_snapshots
  FOR ALL TO authenticated
  USING (organization_id = public.org_id())
  WITH CHECK (organization_id = public.org_id());

-- compliance_reports
CREATE POLICY "tenant_isolation" ON compliance_reports
  FOR ALL TO authenticated
  USING (organization_id = public.org_id())
  WITH CHECK (organization_id = public.org_id());

-- profiles
CREATE POLICY "tenant_isolation" ON profiles
  FOR ALL TO authenticated
  USING (organization_id = public.org_id())
  WITH CHECK (organization_id = public.org_id());

-- info_requests
CREATE POLICY "tenant_isolation" ON info_requests
  FOR ALL TO authenticated
  USING (organization_id = public.org_id())
  WITH CHECK (organization_id = public.org_id());


-- ============================================================
-- Special RLS for employees table:
-- HR/admin can read all rows in their org.
-- Employee role can only read their own row.
-- ============================================================

-- HR/admin: full read access within org
CREATE POLICY "employees_hr_select" ON employees
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
        AND user_roles.role IN ('admin', 'hr_manager')
    )
  );

-- Employee: can only read their own row
CREATE POLICY "employees_self_select" ON employees
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND user_id = (auth.jwt() ->> 'sub')
  );

-- HR/admin: insert within org
CREATE POLICY "employees_hr_insert" ON employees
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
        AND user_roles.role IN ('admin', 'hr_manager')
    )
  );

-- HR/admin: update within org
CREATE POLICY "employees_hr_update" ON employees
  FOR UPDATE TO authenticated
  USING (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
        AND user_roles.role IN ('admin', 'hr_manager')
    )
  );

-- HR/admin: delete within org
CREATE POLICY "employees_hr_delete" ON employees
  FOR DELETE TO authenticated
  USING (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
        AND user_roles.role IN ('admin', 'hr_manager')
    )
  );


-- ============================================================
-- Special RLS for user_roles table:
-- Users read their own roles; admins read all in org.
-- ============================================================

-- Users can read their own role entry
CREATE POLICY "user_roles_self_select" ON user_roles
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND user_id = (auth.jwt() ->> 'sub')
  );

-- Admins can read all role entries in their org
CREATE POLICY "user_roles_admin_select" ON user_roles
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (auth.jwt() ->> 'sub')
        AND ur.organization_id = public.org_id()
        AND ur.role = 'admin'
    )
  );

-- Any authenticated user can insert roles for their org (onboarding)
CREATE POLICY "user_roles_insert" ON user_roles
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.org_id());

-- Only admins can update roles
CREATE POLICY "user_roles_update" ON user_roles
  FOR UPDATE TO authenticated
  USING (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (auth.jwt() ->> 'sub')
        AND ur.organization_id = public.org_id()
        AND ur.role = 'admin'
    )
  );


-- ============================================================
-- Special RLS for audit_logs table:
-- Insert-only for all authenticated users in their org.
-- Select for HR/admin only.
-- NO UPDATE or DELETE policies — audit logs are immutable.
-- ============================================================

CREATE POLICY "audit_insert" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.org_id());

CREATE POLICY "audit_select_hr" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
        AND user_roles.role IN ('admin', 'hr_manager')
    )
  );


-- ============================================================
-- PART 7: Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_employees_org_active ON employees(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_employees_gender ON employees(organization_id, gender);
CREATE INDEX IF NOT EXISTS idx_employees_job_profile ON employees(organization_id, job_profile_id, job_level_id);
CREATE INDEX IF NOT EXISTS idx_pay_gap_snapshots_org_date ON pay_gap_snapshots(organization_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_salary_history_employee ON salary_history(employee_id, effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_org ON user_roles(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_companies_org ON companies(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_profiles_org ON job_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_pay_bands_org ON pay_bands(organization_id);
CREATE INDEX IF NOT EXISTS idx_info_requests_org ON info_requests(organization_id);
