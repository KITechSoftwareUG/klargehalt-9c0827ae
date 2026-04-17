-- ============================================================
-- MIGRATION: Lawyer Role
-- Adds 'lawyer' to user_roles constraint, creates lawyer_reviews
-- and lawyer_access_grants tables with RLS, and grants lawyer
-- read access to compliance-relevant tables.
-- ============================================================

-- ─── 1. Extend user_roles role check to include 'lawyer' ────────────────────

ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('admin','hr_manager','employee','lawyer'));

-- ─── 2. lawyer_reviews — immutable legal review stamps ──────────────────────

CREATE TABLE IF NOT EXISTS lawyer_reviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     TEXT NOT NULL,
  reviewed_by         TEXT NOT NULL,
  reviewed_by_name    TEXT NOT NULL,
  scope_type          TEXT NOT NULL CHECK (scope_type IN (
    'pay_gap_report','joint_assessment','compliance_report','full_audit','salary_structure'
  )),
  scope_id            UUID,
  scope_label         TEXT,
  verdict             TEXT NOT NULL CHECK (verdict IN (
    'approved','needs_remediation','compliant_with_notes','rejected'
  )),
  notes               TEXT,
  recommendations     TEXT,
  document_hash       TEXT,
  review_period_start DATE,
  review_period_end   DATE,
  signed_at           TIMESTAMPTZ DEFAULT now(),
  created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lawyer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_reviews FORCE ROW LEVEL SECURITY;

-- Lawyers can INSERT reviews in their org
CREATE POLICY "lawyer_reviews_insert" ON lawyer_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
        AND user_roles.role = 'lawyer'
    )
  );

-- Lawyers, admins, hr_managers can SELECT reviews in their org
CREATE POLICY "lawyer_reviews_select" ON lawyer_reviews
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
        AND user_roles.role IN ('admin', 'hr_manager', 'lawyer')
    )
  );

-- No UPDATE or DELETE — reviews are immutable stamps

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lawyer_reviews_org ON lawyer_reviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_reviews_scope ON lawyer_reviews(organization_id, scope_type, scope_id);

-- ─── 3. lawyer_access_grants — time-bounded access tracking ─────────────────

CREATE TABLE IF NOT EXISTS lawyer_access_grants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  TEXT NOT NULL,
  lawyer_user_id   TEXT NOT NULL,
  granted_by       TEXT NOT NULL,
  granted_at       TIMESTAMPTZ DEFAULT now(),
  expires_at       TIMESTAMPTZ NOT NULL,
  scope            TEXT DEFAULT 'full',
  revoked_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lawyer_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_access_grants FORCE ROW LEVEL SECURITY;

-- Admins can manage grants in their org
CREATE POLICY "lawyer_access_grants_admin" ON lawyer_access_grants
  FOR ALL TO authenticated
  USING (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
        AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
        AND user_roles.role = 'admin'
    )
  );

-- Lawyers can read their own grants
CREATE POLICY "lawyer_access_grants_self_select" ON lawyer_access_grants
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND lawyer_user_id = (auth.jwt() ->> 'sub')
  );

CREATE INDEX IF NOT EXISTS idx_lawyer_access_grants_org ON lawyer_access_grants(organization_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_access_grants_lawyer ON lawyer_access_grants(organization_id, lawyer_user_id);

-- ─── 4. Lawyer read access on existing tables ───────────────────────────────

-- 4a. employees — lawyer can SELECT (anonymized at application layer via view)
CREATE POLICY "employees_lawyer_select" ON employees
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
        AND user_roles.role = 'lawyer'
    )
  );

-- 4b. Ensure columns referenced by the view exist on employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_number TEXT;
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
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Anonymized employee view for lawyers
-- Strips PII (first_name, last_name, email) but keeps analytical columns
CREATE OR REPLACE VIEW lawyer_employee_view AS
SELECT
  e.id,
  e.organization_id,
  e.employee_number,
  ('Mitarbeiter ' || LPAD(ROW_NUMBER() OVER (
    PARTITION BY e.organization_id ORDER BY e.created_at
  )::TEXT, 3, '0')) AS display_name,
  e.gender,
  e.birth_year,
  e.job_profile_id,
  e.job_level_id,
  e.department_id,
  e.employment_type,
  e.location,
  e.hire_date,
  e.base_salary,
  e.variable_pay,
  e.weekly_hours,
  e.currency,
  e.pay_band_id,
  e.on_leave,
  e.leave_type,
  e.is_active,
  e.created_at,
  e.updated_at
FROM employees e;

-- 4c. audit_logs — add lawyer to select policy
-- The canonical schema has "audit_select_hr" for admin/hr_manager. We add a new
-- policy for lawyers rather than modifying the existing one for idempotency.
CREATE POLICY "audit_select_lawyer" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
        AND user_roles.role = 'lawyer'
    )
  );

-- Note: pay_gap_snapshots, job_profiles, pay_bands, compliance_reports already
-- have tenant_isolation policies that allow ALL operations for any authenticated
-- user in the org. The existing policies cover lawyer read access.
-- joint_assessments and joint_assessment_justifications similarly use
-- tenant_isolation (FOR ALL) so lawyer SELECT is already permitted.
