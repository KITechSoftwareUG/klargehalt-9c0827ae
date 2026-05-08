-- ============================================================
-- P1: is_lawyer() SECURITY DEFINER helper + fix audit_select_lawyer
-- KlarGehalt — 2026-05-08
--
-- Problem: audit_select_lawyer (and salary_decisions_select_lawyer) use an
-- inline correlated sub-SELECT on user_roles. PostgreSQL evaluates this
-- sub-SELECT once per row, causing O(n) user_roles lookups on large audit
-- log queries. For a compliance product where auditors may scan thousands
-- of rows, this is a practical performance issue.
--
-- Fix: SECURITY DEFINER helper is_lawyer() — PostgreSQL evaluates it once
-- per statement (not per row) because the planner sees it as a stable scalar.
-- Same pattern as the existing is_hr_or_admin() / is_org_admin() helpers.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_lawyer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id        = (auth.jwt() ->> 'sub')
      AND organization_id = public.org_id()
      AND role           = 'lawyer'
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_lawyer() TO authenticated;


-- ── audit_logs ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "audit_select_lawyer" ON audit_logs;

CREATE POLICY "audit_select_lawyer" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND (SELECT public.is_lawyer())
  );


-- ── salary_decisions ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "salary_decisions_select_lawyer" ON salary_decisions;

CREATE POLICY "salary_decisions_select_lawyer" ON salary_decisions
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND (SELECT public.is_lawyer())
  );
