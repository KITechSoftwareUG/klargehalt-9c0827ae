-- ============================================================
-- Security Fixes Migration
-- KlarGehalt — 2026-04-15
--
-- Fixes four security and correctness issues:
--   A) user_roles INSERT policy: prevent privilege escalation
--      (any org member could previously self-grant admin role)
--   B) salary_history RLS: restrict INSERT/UPDATE/DELETE to HR/admin
--      (any org member could previously write salary history records)
--   C) pay_bands.mid_salary: add generated column for EU pay transparency
--      (info-requests/submit API was returning null for mid_salary)
--   D) onboarding_data company_size: remove ambiguous '250+' value
--      (overlapped with '251-1000'; standardise to '251-1000')
--
-- Fully idempotent: safe to run on both fresh and existing databases.
-- ============================================================


-- ============================================================
-- FIX A — user_roles INSERT Policy: Prevent Privilege Escalation
--
-- Old policy: WITH CHECK (organization_id = public.org_id())
--   → Any org member could insert ANY role (including 'admin') for
--     ANY user_id within their org. Classic privilege escalation.
--
-- New policies:
--   1. Self-onboarding: a user may insert their OWN role entry, but
--      only for the non-privileged roles 'employee' or 'hr_manager'.
--   2. Admin grant: an existing org admin may insert any role for any
--      user (uses SECURITY DEFINER helper — no recursion).
--
-- Note: the /api/auth/repair-role endpoint uses the service role key
-- which bypasses RLS entirely, so it is unaffected by this change.
-- ============================================================

-- Drop the single overly-permissive insert policy from previous migrations
DROP POLICY IF EXISTS "user_roles_insert"      ON user_roles;
-- Also drop any prior iteration of the split policies (idempotency)
DROP POLICY IF EXISTS "user_roles_self_insert"  ON user_roles;
DROP POLICY IF EXISTS "user_roles_admin_insert" ON user_roles;

-- Self-onboarding: own row, non-admin roles only
CREATE POLICY "user_roles_self_insert" ON user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.org_id()
    AND user_id = (auth.jwt() ->> 'sub')
    AND role IN ('employee', 'hr_manager')
  );

-- Admin grant: existing org admins may assign any role to anyone
CREATE POLICY "user_roles_admin_insert" ON user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.org_id()
    AND public.is_org_admin()
  );


-- ============================================================
-- FIX B — salary_history RLS: Restrict Writes to HR/Admin
--
-- Old policy: "tenant_isolation" FOR ALL — any org member (including
--   plain 'employee' role) could INSERT, UPDATE, or DELETE salary
--   history records. This is a critical data-integrity issue.
--
-- New policies:
--   1. HR/admin: full access (read + write) within the org.
--   2. Employees: read-only access to their OWN salary history rows
--      (matched via employees.user_id → auth.jwt() ->> 'sub').
-- ============================================================

-- Drop the existing blanket policy set by canonical_schema and
-- fix_rls_recursion migrations
DROP POLICY IF EXISTS "tenant_isolation"          ON salary_history;
-- Also drop any prior iteration of the split policies (idempotency)
DROP POLICY IF EXISTS "salary_history_hr_all"     ON salary_history;
DROP POLICY IF EXISTS "salary_history_self_select" ON salary_history;

-- HR/admin: full access within the org
CREATE POLICY "salary_history_hr_all" ON salary_history
  FOR ALL TO authenticated
  USING (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  )
  WITH CHECK (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );

-- Employees: read their own salary history only
-- Correlates via employees table (user_id column) using the SECURITY
-- DEFINER employees table; no additional recursion risk.
CREATE POLICY "salary_history_self_select" ON salary_history
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND employee_id IN (
      SELECT id FROM employees
      WHERE user_id = (auth.jwt() ->> 'sub')
        AND organization_id = public.org_id()
    )
  );


-- ============================================================
-- FIX C — pay_bands.mid_salary: Add Generated Column
--
-- The /api/info-requests/submit route queries pay_bands for
-- mid_salary to fulfil EU pay transparency disclosure (Directive
-- 2023/970, Article 7). The column was referenced in application
-- code but never created in any migration, causing NULL responses.
--
-- mid_salary = (min_salary + max_salary) / 2, stored (GENERATED
-- ALWAYS ... STORED) so it is always consistent without triggers.
-- ============================================================

ALTER TABLE pay_bands
  ADD COLUMN IF NOT EXISTS mid_salary NUMERIC(12,2)
  GENERATED ALWAYS AS ((min_salary + max_salary) / 2) STORED;


-- ============================================================
-- FIX D — onboarding_data company_size: Remove Ambiguous '250+'
--
-- The previous constraint allowed both '250+' and '251-1000' as
-- valid company_size values. These ranges overlap ambiguously.
-- The UI must use '251-1000' for companies in that band and
-- '1000+' for very large companies.
--
-- This migration drops the old constraint (which included '250+')
-- and replaces it with a clean four-value set. Any existing rows
-- that stored '250+' are migrated to '251-1000' first to avoid
-- constraint violations on existing data.
-- ============================================================

-- Migrate any existing ambiguous '250+' values before tightening
-- the constraint (safe no-op if no such rows exist)
UPDATE onboarding_data
  SET company_size = '251-1000'
  WHERE company_size = '250+';

-- Drop whichever version of the constraint currently exists
ALTER TABLE onboarding_data
  DROP CONSTRAINT IF EXISTS onboarding_data_company_size_check;

-- Recreate with the canonical four-value enum (no '250+')
ALTER TABLE onboarding_data
  ADD CONSTRAINT onboarding_data_company_size_check
  CHECK (company_size IN ('1-50', '51-250', '251-1000', '1000+'));
