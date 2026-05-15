-- ============================================================
-- Security Audit Remediation — 2026-05-15
--
-- 1. is_lawyer() helper currently queries the legacy user_roles table.
--    user_roles is being dropped post-MVP per CLAUDE.md. Switching the
--    helper to organization_members preserves lawyer SELECT access on
--    audit_logs / salary_decisions when user_roles disappears.
--
-- 2. cleanup_expired_trial_accounts() leaves orphans:
--      - organization_members (not deleted at all)
--      - subscription_changes (not deleted at all)
--      - salary_decisions (only via employees CASCADE — fragile)
--    Per DSGVO Art. 5 / Art. 17 we must actually delete the data, not
--    just rely on RLS denying reads of orphaned rows.
-- ============================================================


-- ─── 1. is_lawyer() — switch source of truth to organization_members ────────

CREATE OR REPLACE FUNCTION public.is_lawyer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id         = (auth.jwt() ->> 'sub')
      AND organization_id = public.org_id()
      AND role            = 'lawyer'
      AND status          = 'active'
      AND (access_expires_at IS NULL OR access_expires_at > now())
  )
$$;


-- ─── 2. cleanup_expired_trial_accounts — delete orphaned tables ────────────

CREATE OR REPLACE FUNCTION public.cleanup_expired_trial_accounts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_org RECORD;
BEGIN
  FOR expired_org IN
    SELECT organization_id
    FROM companies
    WHERE subscription_status IN ('trialing', 'canceled')
      AND stripe_subscription_id IS NULL
      AND trial_ends_at IS NOT NULL
      AND trial_ends_at < NOW() - INTERVAL '30 days'
  LOOP
    -- Explicitly delete every tenant-scoped table. salary_decisions and
    -- audit_logs are append-only at the RLS layer, but service_role bypasses
    -- RLS — and DSGVO erasure trumps the audit-trail promise once the customer
    -- has lapsed past the 30-day grace window.
    DELETE FROM salary_decisions      WHERE organization_id = expired_org.organization_id;
    DELETE FROM audit_logs            WHERE organization_id = expired_org.organization_id;
    DELETE FROM subscription_changes  WHERE organization_id = expired_org.organization_id;
    DELETE FROM info_requests         WHERE organization_id = expired_org.organization_id;
    DELETE FROM consultation_bookings WHERE organization_id = expired_org.organization_id;
    DELETE FROM employees             WHERE organization_id = expired_org.organization_id;
    DELETE FROM pay_bands             WHERE organization_id = expired_org.organization_id;
    DELETE FROM job_profiles          WHERE organization_id = expired_org.organization_id;
    DELETE FROM onboarding_data       WHERE organization_id = expired_org.organization_id;
    DELETE FROM organization_members  WHERE organization_id = expired_org.organization_id;
    DELETE FROM user_roles            WHERE organization_id = expired_org.organization_id;
    DELETE FROM profiles              WHERE organization_id = expired_org.organization_id;
    DELETE FROM companies             WHERE organization_id = expired_org.organization_id;

    RAISE LOG 'Deleted expired trial account for organization: %', expired_org.organization_id;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_trial_accounts() FROM PUBLIC;
