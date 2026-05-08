-- ============================================================
-- P0 Security Hardening: RLS Privilege Escalation + Cross-Tenant Fixes
-- KlarGehalt — 2026-05-08
--
-- Fixes identified in live-DB policy audit (2026-05-08):
--
--   A) companies:
--      - companies_admin_all uses has_app_role() with NO org_id filter
--        → any admin in any org can read/write ALL companies (cross-tenant)
--      - companies_insert allows any org member to INSERT (billing columns writable)
--      - companies_update allows hr_manager to UPDATE (billing columns writable)
--      - companies_delete allows hr_manager to DELETE the company
--      Fix: drop all, keep SELECT only for authenticated, add billing trigger.
--
--   B) audit_logs:
--      - audit_insert allows any org member to inject fake entries
--      - audit_logs_hr_admin_all uses has_app_role() with NO org_id filter
--        → any admin/hr_manager can read ALL audit logs across all tenants
--      Fix: drop both vulnerable policies; scoped SELECT policies remain.
--
--   C) pay_bands:
--      - pay_bands_hr_admin_all uses has_app_role() with NO org_id filter
--        → any admin/hr_manager can read/write ALL pay bands cross-tenant
--      Fix: drop it; the correctly scoped split policies already exist.
--
--   D) job_profiles:
--      - job_profiles_hr_admin_all uses has_app_role() + get_my_org_id()
--        (profile-based org, not JWT org — stale/inconsistent)
--      - job_profiles_employee_read uses has_app_role() + get_my_org_id()
--      Fix: replace both with org_id()-based policies.
--
--   E) departments / job_levels:
--      - tenant_isolation FOR ALL allows employee-role users to INSERT/UPDATE/DELETE
--      Fix: split into SELECT (all) + write (hr_manager/admin only).
--
-- has_app_role() is NOT dropped — it may be used elsewhere outside RLS.
-- All affected policies are replaced with org_id() + is_hr_or_admin() / is_org_admin().
-- Fully idempotent.
-- ============================================================


-- ============================================================
-- FIX A — companies
-- ============================================================

-- Drop ALL existing companies policies (several use has_app_role without org filter)
DROP POLICY IF EXISTS "tenant_isolation"       ON companies;
DROP POLICY IF EXISTS "companies_admin_all"    ON companies;  -- NO org filter — cross-tenant
DROP POLICY IF EXISTS "companies_hr_read_update" ON companies; -- uses get_my_org_id (stale)
DROP POLICY IF EXISTS "companies_insert"       ON companies;  -- any org member can insert
DROP POLICY IF EXISTS "companies_update"       ON companies;  -- hr_manager can update billing
DROP POLICY IF EXISTS "companies_delete"       ON companies;  -- hr_manager can delete company
DROP POLICY IF EXISTS "companies_select"       ON companies;
DROP POLICY IF EXISTS "companies_update_safe"  ON companies;

-- READ only: all org members may read their company row.
-- All mutations go through service_role (createServiceClient / getAdmin):
--   Onboarding:   /api/onboarding/complete  → getAdmin()
--   Settings:     /api/company PATCH        → createServiceClient()
--   Stripe:       /api/webhooks/stripe      → supabaseAdmin()
--   Reconcile:    /api/stripe/reconcile     → service role
CREATE POLICY "companies_select" ON companies
  FOR SELECT TO authenticated
  USING (organization_id = public.org_id());


-- Billing column trigger: defense-in-depth guard even if a future migration
-- accidentally re-adds a permissive UPDATE policy.
CREATE OR REPLACE FUNCTION public.guard_billing_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _claims text := current_setting('request.jwt.claims', true);
  _role   text;
BEGIN
  -- Direct DB connection (migrations, SQL editor, pg_cron): no JWT context → allow.
  IF _claims IS NULL OR _claims = '' THEN
    RETURN NEW;
  END IF;

  _role := (_claims::jsonb ->> 'role');

  -- service_role via PostgREST (Stripe webhooks, reconcile, onboarding) → allow.
  IF _role = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Any other role: block billing-column changes.
  IF (
    NEW.subscription_tier      IS DISTINCT FROM OLD.subscription_tier      OR
    NEW.subscription_status    IS DISTINCT FROM OLD.subscription_status    OR
    NEW.stripe_customer_id     IS DISTINCT FROM OLD.stripe_customer_id     OR
    NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id OR
    NEW.trial_ends_at          IS DISTINCT FROM OLD.trial_ends_at          OR
    NEW.current_period_end     IS DISTINCT FROM OLD.current_period_end
  ) THEN
    RAISE EXCEPTION 'permission_denied: billing fields are managed by the payment system'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_billing_columns ON companies;
CREATE TRIGGER protect_billing_columns
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_billing_columns();


-- ============================================================
-- FIX B — audit_logs
-- ============================================================

-- audit_insert: any org member could inject fake compliance entries
DROP POLICY IF EXISTS "audit_insert" ON audit_logs;

-- audit_logs_hr_admin_all: has_app_role() with NO org_id filter → cross-tenant read
DROP POLICY IF EXISTS "audit_logs_hr_admin_all" ON audit_logs;

-- audit_select_hr and audit_select_lawyer remain (they use org_id() correctly).
-- service_role INSERT continues to work (bypasses RLS entirely).


-- ============================================================
-- FIX C — pay_bands
-- ============================================================

-- pay_bands_hr_admin_all: has_app_role() with NO org_id filter → cross-tenant
DROP POLICY IF EXISTS "pay_bands_hr_admin_all" ON pay_bands;

-- pay_bands_select / _insert / _update / _delete already use org_id() correctly
-- and are left in place.


-- ============================================================
-- FIX D — job_profiles
-- ============================================================

-- job_profiles_hr_admin_all: uses get_my_org_id() (profile-based, stale)
DROP POLICY IF EXISTS "job_profiles_hr_admin_all" ON job_profiles;

-- job_profiles_employee_read: uses has_app_role() + get_my_org_id() → replace with org_id()
DROP POLICY IF EXISTS "job_profiles_employee_read" ON job_profiles;

-- Recreate employee read with correct org_id() from JWT
CREATE POLICY "job_profiles_employee_read" ON job_profiles
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND is_active = true
  );

-- job_profiles_select / _insert / _update / _delete already use org_id() correctly
-- and are left in place.


-- ============================================================
-- FIX E — departments: split FOR ALL into role-scoped policies
-- ============================================================

DROP POLICY IF EXISTS "tenant_isolation"   ON departments;
DROP POLICY IF EXISTS "departments_select" ON departments;
DROP POLICY IF EXISTS "departments_insert" ON departments;
DROP POLICY IF EXISTS "departments_update" ON departments;
DROP POLICY IF EXISTS "departments_delete" ON departments;

-- All org members can read departments
CREATE POLICY "departments_select" ON departments
  FOR SELECT TO authenticated
  USING (organization_id = public.org_id());

-- Only hr_manager / admin can create/modify departments
CREATE POLICY "departments_insert" ON departments
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );

CREATE POLICY "departments_update" ON departments
  FOR UPDATE TO authenticated
  USING  (organization_id = public.org_id() AND public.is_hr_or_admin())
  WITH CHECK (organization_id = public.org_id() AND public.is_hr_or_admin());

-- Only admin can delete departments
CREATE POLICY "departments_delete" ON departments
  FOR DELETE TO authenticated
  USING (organization_id = public.org_id() AND public.is_org_admin());


-- ============================================================
-- FIX E — job_levels: split FOR ALL into role-scoped policies
-- ============================================================

DROP POLICY IF EXISTS "tenant_isolation"  ON job_levels;
DROP POLICY IF EXISTS "job_levels_select" ON job_levels;
DROP POLICY IF EXISTS "job_levels_insert" ON job_levels;
DROP POLICY IF EXISTS "job_levels_update" ON job_levels;
DROP POLICY IF EXISTS "job_levels_delete" ON job_levels;

-- All org members can read job levels
CREATE POLICY "job_levels_select" ON job_levels
  FOR SELECT TO authenticated
  USING (organization_id = public.org_id());

-- Only hr_manager / admin can create/modify job levels
CREATE POLICY "job_levels_insert" ON job_levels
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );

CREATE POLICY "job_levels_update" ON job_levels
  FOR UPDATE TO authenticated
  USING  (organization_id = public.org_id() AND public.is_hr_or_admin())
  WITH CHECK (organization_id = public.org_id() AND public.is_hr_or_admin());

-- Only admin can delete job levels
CREATE POLICY "job_levels_delete" ON job_levels
  FOR DELETE TO authenticated
  USING (organization_id = public.org_id() AND public.is_org_admin());
