-- ============================================================
-- Add plans table — single source of truth for subscription limits
-- KlarGehalt — 2026-05-09
--
-- Replaces the hardcoded PLANS constant in lib/subscription.ts
-- as the authoritative record of tier capabilities and limits.
-- The TypeScript constant remains for client-side rendering until
-- it is refactored to query this table.
--
-- Design decisions:
--   - id TEXT PRIMARY KEY ('basis','professional','enterprise')
--     so application code can join by string without UUID lookups.
--   - price_monthly_cents / price_yearly_cents are NULL for
--     enterprise (custom pricing).
--   - max_* = -1 means unlimited for that dimension.
--   - features JSONB mirrors the FEATURE_FLAGS map in
--     lib/subscription.ts exactly.
--   - RLS: SELECT open to all authenticated users (reference data).
--     INSERT / UPDATE / DELETE blocked for client roles; only
--     service_role (migrations, admin tooling) can mutate.
--   - Fully idempotent: ON CONFLICT … DO UPDATE on seed rows.
-- ============================================================


CREATE TABLE IF NOT EXISTS public.plans (
  id                    TEXT PRIMARY KEY,
  name                  TEXT        NOT NULL,
  name_de               TEXT        NOT NULL,
  price_monthly_cents   INT,                    -- NULL = custom pricing
  price_yearly_cents    INT,
  max_admin_seats       INT         NOT NULL,   -- -1 = unlimited
  max_hr_seats          INT         NOT NULL,   -- -1 = unlimited
  max_employee_records  INT         NOT NULL,   -- -1 = unlimited
  features              JSONB       NOT NULL DEFAULT '{}',
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order            INT         NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.plans IS
  'Reference table for subscription plan capabilities and seat limits. '
  'Mutated only via service_role (migrations, admin tooling). '
  'id values match lib/subscription.ts PLANS keys.';

COMMENT ON COLUMN public.plans.max_admin_seats IS '-1 = unlimited';
COMMENT ON COLUMN public.plans.max_hr_seats    IS '-1 = unlimited';
COMMENT ON COLUMN public.plans.max_employee_records IS '-1 = unlimited';
COMMENT ON COLUMN public.plans.price_monthly_cents  IS 'NULL = custom / on-request pricing';


-- ── Seed plan rows ────────────────────────────────────────────────────────────
-- Values are kept in sync with lib/subscription.ts PLANS constant.
-- ON CONFLICT: update mutable columns so re-running the migration
-- after a plan change is safe and idempotent.

INSERT INTO public.plans (
  id, name, name_de,
  price_monthly_cents, price_yearly_cents,
  max_admin_seats, max_hr_seats, max_employee_records,
  features, sort_order
) VALUES
  (
    'basis', 'Basis', 'Basis',
    14900, 149000,
    1, 1, 50,
    '{
      "pay_gap_analysis":        true,
      "pdf_reports":             false,
      "trend_analysis":          false,
      "decision_documentation":  false,
      "lawyer_review":           false,
      "priority_support":        false,
      "advanced_audit":          false,
      "sso":                     false,
      "auditor_access":          false,
      "custom_integrations":     false
    }'::jsonb,
    1
  ),
  (
    'professional', 'Professional', 'Professional',
    29900, 269000,
    5, -1, 250,
    '{
      "pay_gap_analysis":        true,
      "pdf_reports":             true,
      "trend_analysis":          true,
      "decision_documentation":  true,
      "lawyer_review":           true,
      "priority_support":        true,
      "advanced_audit":          true,
      "sso":                     false,
      "auditor_access":          false,
      "custom_integrations":     false
    }'::jsonb,
    2
  ),
  (
    'enterprise', 'Enterprise', 'Enterprise',
    NULL, NULL,
    -1, -1, -1,
    '{
      "pay_gap_analysis":        true,
      "pdf_reports":             true,
      "trend_analysis":          true,
      "decision_documentation":  true,
      "lawyer_review":           true,
      "priority_support":        true,
      "advanced_audit":          true,
      "sso":                     true,
      "auditor_access":          true,
      "custom_integrations":     true
    }'::jsonb,
    3
  )
ON CONFLICT (id) DO UPDATE SET
  max_admin_seats      = EXCLUDED.max_admin_seats,
  max_hr_seats         = EXCLUDED.max_hr_seats,
  max_employee_records = EXCLUDED.max_employee_records,
  features             = EXCLUDED.features,
  sort_order           = EXCLUDED.sort_order;


-- ── RLS ───────────────────────────────────────────────────────────────────────
-- Plans are global reference data — authenticated users may read.
-- All writes are service_role only (no client INSERT/UPDATE/DELETE policies).

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans FORCE ROW LEVEL SECURITY;

-- Drop before recreate so the migration is idempotent
DROP POLICY IF EXISTS "plans_public_read" ON public.plans;

CREATE POLICY "plans_public_read" ON public.plans
  FOR SELECT
  TO authenticated
  USING (true);
