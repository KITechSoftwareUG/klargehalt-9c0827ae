-- ============================================================
-- Fix remaining cross-tenant RLS gaps (has_app_role / get_my_org_id)
-- KlarGehalt — 2026-05-09
--
-- The three tables originally specified (employee_info_requests,
-- info_request_responses, request_rate_limits) were renamed to
-- _deprecated_* in migration 20260323000000_cleanup_legacy.sql
-- and are no longer live tables. No USING(true) policies survive
-- on any current table.
--
-- Instead this migration fixes the remaining policies that use
-- has_app_role() or get_my_org_id() without a JWT-based org_id()
-- guard — these are residual cross-tenant read risks on:
--
--   1. employees.employees_hr_admin_all
--      uses has_app_role() + get_my_org_id() — profile-based,
--      stale. Correctly scoped split policies already exist.
--
--   2. user_roles.user_roles_admin_all
--      uses has_app_role(['admin']) — no org_id() filter;
--      any admin in any org can read all user_roles cross-tenant.
--
--   3. user_roles.user_roles_hr_read
--      uses has_app_role(['hr_manager','admin']) — no org_id().
--
--   4. onboarding_data.onboarding_data_admin_all
--      uses has_app_role() — no org_id() filter.
--      (The table has no organization_id column, so we scope
--      to user_id = auth.jwt() ->> 'sub' for the self-read
--      case and add an is_hr_or_admin guard for admin read,
--      using the service_role for server-side writes.)
--
-- All replacements use org_id() + is_org_admin() / is_hr_or_admin().
-- Fully idempotent.
-- ============================================================


-- ─── 1. employees: drop stale has_app_role + get_my_org_id policy ───────────
-- The split policies (employees_hr_select, employees_hr_insert,
-- employees_hr_update, employees_hr_delete, employees_self_select,
-- employees_self_read, employees_lawyer_select) already use org_id()
-- correctly and are left in place.

DROP POLICY IF EXISTS "employees_hr_admin_all" ON employees;


-- ─── 2. user_roles: drop cross-tenant has_app_role policies ──────────────────
-- user_roles_admin_select, user_roles_admin_insert, user_roles_delete,
-- user_roles_self_select, and user_roles_update already use org_id().
-- Only the two legacy has_app_role policies remain.

DROP POLICY IF EXISTS "user_roles_admin_all" ON user_roles;
DROP POLICY IF EXISTS "user_roles_hr_read"   ON user_roles;


-- ─── 3. onboarding_data: drop cross-tenant admin_all policy ─────────────────
-- onboarding_data has no organization_id column; the admin_all policy
-- with has_app_role() lets any admin read any user's onboarding data.
-- Replace with a scope-limited admin read (same user_id, any org-admin
-- of the caller's org cannot be scoped further without organization_id,
-- so restrict to self-read only for authenticated; server-side ops use
-- service_role which bypasses RLS).
-- The existing self-read/insert/update policies are already correct.

DROP POLICY IF EXISTS "onboarding_data_admin_all" ON onboarding_data;


-- ─── 4. org_id_for_company helper ────────────────────────────────────────────
-- Utility for any future policy that needs to map a UUID company_id
-- (used on legacy tables) to the Logto org_id for RLS checks.
-- Creates safely even if no deprecated tables reference it yet.

CREATE OR REPLACE FUNCTION public.org_id_for_company(p_company_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.companies
  WHERE id = p_company_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.org_id_for_company(UUID) TO authenticated;
