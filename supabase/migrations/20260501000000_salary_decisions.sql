-- ============================================================
-- MIGRATION: salary_decisions — append-only decision trail
--
-- This is the compliance core of KlarGehalt (EU Directive 2023/970).
-- Every salary event (hire, raise, promotion, band change, correction)
-- must be documented here with a justification before it can be
-- considered legally defensible.
--
-- Design decisions:
--   - APPEND-ONLY: RLS blocks UPDATE and DELETE for all roles.
--     Corrections are new rows with decision_type='correction'.
--   - Snapshots: pay_band_id and comparator_data are written at
--     insert time so the record is immutable even if bands change.
--   - lawyer_review_id: optional link to a lawyer review of this
--     decision (enables Anwaltsprüfung badge on decisions).
-- ============================================================

CREATE TABLE IF NOT EXISTS salary_decisions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       TEXT NOT NULL,
  employee_id           UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  decision_type         TEXT NOT NULL CHECK (
                          decision_type IN ('hire', 'raise', 'promotion', 'band_change', 'correction')
                        ),
  old_salary            NUMERIC(12,2),
  new_salary            NUMERIC(12,2) NOT NULL,
  justification_text    TEXT NOT NULL CHECK (char_length(justification_text) >= 10),
  justification_factors JSONB DEFAULT '[]',
  decided_by_user_id    TEXT NOT NULL,
  decided_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  pay_band_id           UUID REFERENCES pay_bands(id) ON DELETE SET NULL,
  comparator_data       JSONB DEFAULT '{}',
  lawyer_review_id      UUID REFERENCES lawyer_reviews(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant isolation index
CREATE INDEX IF NOT EXISTS idx_salary_decisions_org
  ON salary_decisions(organization_id, decided_at DESC);

CREATE INDEX IF NOT EXISTS idx_salary_decisions_employee
  ON salary_decisions(employee_id, decided_at DESC);

-- Enable RLS
ALTER TABLE salary_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_decisions FORCE ROW LEVEL SECURITY;

-- ─── RLS POLICIES ─────────────────────────────────────────────────────────────

-- HR and admin can view all decisions for their org
CREATE POLICY "salary_decisions_select_hr" ON salary_decisions
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );

-- Lawyers can view decisions for their org (via lawyer_access_grants)
CREATE POLICY "salary_decisions_select_lawyer" ON salary_decisions
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

-- Only HR/admin can INSERT (append new decisions)
CREATE POLICY "salary_decisions_insert" ON salary_decisions
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );

-- NO UPDATE policy — decisions are immutable once written.
-- Use decision_type='correction' for amendments.

-- NO DELETE policy — the trail must be permanent.
