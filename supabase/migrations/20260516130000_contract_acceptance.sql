-- ============================================================================
-- Contract Acceptance (Clickwrap vor Stripe Checkout)
--
-- German B2B law (BGB §305 ff.): AGB + Datenschutzerklärung + AVV (Art. 28
-- DSGVO) must be validly incorporated before a binding paid subscription is
-- created. The only place a paid subscription is created is the Stripe Checkout
-- session — the server gate in /api/stripe/checkout is the real enforcement;
-- this table is the append-only, versioned proof of acceptance.
--
-- Append-only (security.md §3/§9): like salary_decisions/audit_logs there is
-- intentionally NO UPDATE / NO DELETE policy. A new acceptance row is written
-- per version; corrections are new rows, never mutations.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Fast-path convenience column on companies
-- ---------------------------------------------------------------------------
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS contracts_accepted_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Append-only acceptance ledger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contract_acceptances (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     text        NOT NULL,
  accepted_by_user_id text        NOT NULL,
  document_keys       text[]      NOT NULL,
  document_version    text        NOT NULL,
  content_hash        text        NOT NULL,
  ip                  text,
  user_agent          text,
  accepted_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_acceptances ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_contract_acceptances_org
  ON public.contract_acceptances (organization_id, accepted_at DESC);
CREATE INDEX IF NOT EXISTS idx_contract_acceptances_org_version
  ON public.contract_acceptances (organization_id, document_version);

-- ---------------------------------------------------------------------------
-- 3. RLS — org members read; org admins insert; NO update/delete (append-only)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS contract_acceptances_select ON public.contract_acceptances;
CREATE POLICY contract_acceptances_select ON public.contract_acceptances
  FOR SELECT USING (organization_id = public.org_id() AND public.is_org_member());

DROP POLICY IF EXISTS contract_acceptances_insert ON public.contract_acceptances;
CREATE POLICY contract_acceptances_insert ON public.contract_acceptances
  FOR INSERT WITH CHECK (organization_id = public.org_id() AND public.is_org_admin());

-- (No UPDATE / DELETE policy by design → default-deny = immutable ledger,
--  even for admins; service-role writes via the accept route bypass RLS but
--  the route never updates/deletes either.)

-- ---------------------------------------------------------------------------
-- 4. Backfill — existing subscribers must not be locked out of (re-)checkout.
--    Orgs with an active/trialing/past_due subscription already contracted
--    pre-gate; record a system backfill acceptance for the current version.
-- ---------------------------------------------------------------------------
INSERT INTO public.contract_acceptances
  (organization_id, accepted_by_user_id, document_keys, document_version, content_hash, ip, user_agent)
SELECT c.organization_id, 'system-backfill',
       ARRAY['agb','datenschutz','avv'], '2026-05-16',
       'backfill-existing-subscriber', NULL, 'migration-backfill'
FROM public.companies c
WHERE c.subscription_status IN ('active','trialing','past_due')
  AND NOT EXISTS (
    SELECT 1 FROM public.contract_acceptances ca
    WHERE ca.organization_id = c.organization_id
      AND ca.document_version = '2026-05-16'
  );

UPDATE public.companies
  SET contracts_accepted_at = now()
WHERE subscription_status IN ('active','trialing','past_due')
  AND contracts_accepted_at IS NULL;

-- Refresh PostgREST schema cache so the new table/column are immediately visible
NOTIFY pgrst, 'reload schema';
