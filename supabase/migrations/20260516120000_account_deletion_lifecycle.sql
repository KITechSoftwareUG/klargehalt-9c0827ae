-- ============================================================================
-- Account Deletion Lifecycle (Owner-Tenant-Löschung, 30-Tage-Soft-Delete)
--
-- State machine on companies.deletion_status:
--   active → deletion_scheduled → anonymized
--
-- Legal frame (law.md §5 Beweislastumkehr / security.md §5/§9):
-- the append-only compliance trail is retention-obligated. We NEVER hard-delete
-- the companies row (audit_logs.company_id / user_roles.company_id cascade off
-- it) and NEVER mutate audit_logs (hash chain: sequence_number/previous_hash/
-- record_hash). Personal identifiers are pseudonymized; the defensible
-- paper-trail (salary_decisions, audit_logs, subscription_changes,
-- lawyer_reviews + structural skeleton) is frozen and retained.
--
-- Classification rationale: docs/account-deletion-fk-map.md
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Lifecycle columns on companies
-- ---------------------------------------------------------------------------
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS deletion_status        text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS deletion_scheduled_at  timestamptz,
  ADD COLUMN IF NOT EXISTS deletion_requested_by  text,
  ADD COLUMN IF NOT EXISTS deletion_executed_at   timestamptz,
  ADD COLUMN IF NOT EXISTS deletion_reason        text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_deletion_status_check'
  ) THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_deletion_status_check
      CHECK (deletion_status IN ('active', 'deletion_scheduled', 'anonymized'));
  END IF;
END $$;

-- Cron scan: only the small set of scheduled rows.
CREATE INDEX IF NOT EXISTS idx_companies_deletion_due
  ON public.companies (deletion_scheduled_at)
  WHERE deletion_status = 'deletion_scheduled';

-- ---------------------------------------------------------------------------
-- 2. RLS defense-in-depth helper.
--    Primary enforcement is the API guard (lib/auth/api-guard.ts). This is
--    belt-and-suspenders for any client-direct path. SECURITY DEFINER so its
--    internal companies read bypasses RLS (no recursion with the policies
--    below). Cron uses the service role → bypasses RLS entirely, so
--    anonymize_organization() is unaffected by these policies.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.org_not_deleted()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.companies
    WHERE organization_id = public.org_id()
      AND deletion_status <> 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.org_not_deleted() FROM public;
GRANT EXECUTE ON FUNCTION public.org_not_deleted() TO authenticated, anon, service_role;

-- Additive RESTRICTIVE policies: AND with existing permissive policies without
-- rewriting them. Scoped to SELECT on the two most sensitive tables only.
DROP POLICY IF EXISTS employees_block_when_org_deleted ON public.employees;
CREATE POLICY employees_block_when_org_deleted ON public.employees
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.org_not_deleted());

DROP POLICY IF EXISTS salary_decisions_block_when_org_deleted ON public.salary_decisions;
CREATE POLICY salary_decisions_block_when_org_deleted ON public.salary_decisions
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.org_not_deleted());

-- ---------------------------------------------------------------------------
-- 3. anonymize_organization(p_org_id)
--    Called ONLY by the cleanup cron (service role). Idempotent + guarded:
--    only proceeds for orgs in 'deletion_scheduled'. Runs in the caller's
--    transaction (the cron wraps one org per tx).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.anonymize_organization(p_org_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Operational hard-delete list, FK-safe order (child → parent). The cleanup
  -- routine must NEVER half-complete: it is resilient to schema drift (a table
  -- renamed/dropped by a future migration is skipped, not fatal) and to
  -- org-vs-company scoping differences (resolved per-table at runtime).
  --   certified_snapshots BEFORE compliance_assessments  (NO ACTION FK)
  --   joint_assessments   BEFORE pay_gap_snapshots        (NO ACTION FK)
  --   assessment_transitions / legal_review_comments      cascade off
  --     compliance_assessments; joint_assessment_justifications off
  --     joint_assessments — so not listed explicitly.
  v_delete_order CONSTANT text[] := ARRAY[
    'certified_snapshots', 'compliance_assessments', 'joint_assessments',
    'employee_comparisons', 'pay_group_stats', 'gender_gap_history',
    'salary_simulations', 'pay_groups', 'pay_gap_snapshots',
    'info_requests', 'job_postings', 'onboarding_data',
    'rights_notifications', 'consultation_bookings', 'lawyer_access_grants',
    'profiles', 'user_roles'
  ];
  v_company_ids uuid[];
  v_tbl text;
  v_has_org bool;
  v_has_company bool;
BEGIN
  IF p_org_id IS NULL OR length(p_org_id) = 0 THEN
    RAISE EXCEPTION 'anonymize_organization: p_org_id required';
  END IF;

  -- Guard: only scheduled orgs. Active orgs are a hard no-op (safety against
  -- a mis-call); already-anonymized orgs return silently (idempotent).
  IF NOT EXISTS (
    SELECT 1 FROM public.companies
    WHERE organization_id = p_org_id AND deletion_status = 'deletion_scheduled'
  ) THEN
    RETURN;
  END IF;

  SELECT array_agg(id) INTO v_company_ids
  FROM public.companies WHERE organization_id = p_org_id;

  -- ---- D. Hard-delete operational data (drift-resilient, FK-safe order) ----
  FOREACH v_tbl IN ARRAY v_delete_order LOOP
    -- Skip silently if the table no longer exists (schema evolution).
    CONTINUE WHEN to_regclass('public.' || v_tbl) IS NULL;

    SELECT
      bool_or(column_name = 'organization_id'),
      bool_or(column_name = 'company_id')
    INTO v_has_org, v_has_company
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = v_tbl;

    IF v_has_org THEN
      EXECUTE format('DELETE FROM public.%I WHERE organization_id = $1', v_tbl)
        USING p_org_id;
    ELSIF v_has_company THEN
      EXECUTE format('DELETE FROM public.%I WHERE company_id = ANY($1)', v_tbl)
        USING v_company_ids;
    ELSE
      RAISE WARNING 'anonymize_organization: % has neither organization_id nor company_id — skipped', v_tbl;
    END IF;
  END LOOP;

  -- ---- C. Pseudonymize employees (keep rows; NOT NULL cols get placeholders)
  UPDATE public.employees SET
    first_name                      = 'Gelöscht',
    last_name                       = 'MA-' || left(id::text, 8),
    email                           = 'deleted-' || id::text || '@anonymized.invalid',
    employee_number                 = NULL,
    user_id                         = NULL,
    department                      = NULL,
    created_by                      = NULL,
    salary_justification            = '{}'::jsonb,
    salary_justification_updated_by = NULL,
    is_active                       = false,
    updated_at                      = now()
  WHERE organization_id = p_org_id;

  -- ---- C. Pseudonymize companies row (anchor — never deleted) -------------
  UPDATE public.companies SET
    name                  = 'Gelöschtes Unternehmen',
    legal_name            = NULL,
    tax_id                = NULL,
    address               = NULL,
    stripe_customer_id    = NULL,
    stripe_subscription_id= NULL,
    logo_url              = NULL,
    created_by            = NULL,
    is_active             = false,
    deletion_status       = 'anonymized',
    deletion_executed_at  = now(),
    updated_at            = now()
  WHERE organization_id = p_org_id;

  -- ---- C. Org members → removed (user_id kept for audit-actor integrity) --
  UPDATE public.organization_members SET
    status     = 'removed',
    updated_at = now()
  WHERE organization_id = p_org_id AND status <> 'removed';

  -- A. salary_decisions / audit_logs / subscription_changes / lawyer_reviews /
  --    processed_* and B. departments/job_levels/job_profiles/pay_bands are
  --    intentionally untouched — frozen, retained, defensible.
END;
$$;

REVOKE ALL ON FUNCTION public.anonymize_organization(text) FROM public;
GRANT EXECUTE ON FUNCTION public.anonymize_organization(text) TO service_role;

COMMENT ON FUNCTION public.anonymize_organization(text) IS
  'Final account-deletion step (cron, service-role only). Pseudonymizes PII, '
  'hard-deletes operational data, freezes the EU 2023/970 compliance trail. '
  'Guarded to deletion_scheduled orgs; idempotent. See docs/account-deletion-fk-map.md';
