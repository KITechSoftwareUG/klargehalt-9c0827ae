-- ============================================================
-- P2: user_roles DELETE policy + lawyer_reviews_select helper
-- KlarGehalt — 2026-05-08
--
-- P2.2: user_roles was missing a DELETE policy — any authenticated
--       user could delete rows (RLS defaulted to DENY but no
--       explicit admin-only guard existed). Add explicit policy
--       scoped to org_id() + is_org_admin().
--
-- P2.3: lawyer_reviews_select used an inline correlated sub-SELECT
--       per row (O(n) user_roles lookups on large result sets).
--       Replace with SECURITY DEFINER helper calls evaluated
--       once per statement, matching the pattern used by
--       audit_select_lawyer and salary_decisions_select_lawyer.
-- ============================================================

-- ── user_roles ────────────────────────────────────────────────────────────────

CREATE POLICY "user_roles_delete" ON user_roles
  FOR DELETE TO authenticated
  USING (organization_id = public.org_id() AND public.is_org_admin());


-- ── lawyer_reviews ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "lawyer_reviews_select" ON lawyer_reviews;

CREATE POLICY "lawyer_reviews_select" ON lawyer_reviews
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND (
      (SELECT public.is_hr_or_admin())
      OR (SELECT public.is_lawyer())
    )
  );
