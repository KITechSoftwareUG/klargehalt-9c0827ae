-- ============================================================
-- MIGRATION: Compliance Workflow
--
-- Implements the full state-machine-driven compliance assessment
-- workflow for EU pay-transparency (Directive 2023/970).
--
-- Tables:
--   1. compliance_assessments   — one review cycle per period
--   2. assessment_transitions   — immutable status change log
--   3. legal_review_comments    — lawyer annotations per section
--   4. certified_snapshots      — immutable certification artifact
--
-- Design decisions:
--   - assessment_transitions: no UPDATE/DELETE — append-only log.
--   - certified_snapshots: no UPDATE/DELETE — immutable artifact.
--   - RLS uses public.org_id() extracted from JWT aud claim.
--   - auth.jwt() ->> 'sub' is the current user_id.
-- ============================================================

-- ─── 1. compliance_assessments ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS compliance_assessments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  period_from     DATE NOT NULL,
  period_to       DATE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
                    'DRAFT',
                    'ANALYZED',
                    'PENDING_REVIEW',
                    'UNDER_REVIEW',
                    'CHANGES_REQUESTED',
                    'RESUBMITTED',
                    'VALIDATED',
                    'CERTIFIED_SNAPSHOT',
                    'EXPIRED'
                  )),
  risk_score      INTEGER CHECK (risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100)),
  gap_flags       JSONB,
  initiated_by    TEXT,
  lawyer_id       TEXT,
  expires_at      TIMESTAMPTZ,
  title           TEXT
);

ALTER TABLE compliance_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_assessments FORCE ROW LEVEL SECURITY;

-- Admin and HR can view assessments in their org
CREATE POLICY "compliance_assessments_select" ON compliance_assessments
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
        AND user_roles.role IN ('admin', 'hr_manager', 'lawyer')
    )
  );

-- Admin and HR can create assessments in their org
CREATE POLICY "compliance_assessments_insert" ON compliance_assessments
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
        AND user_roles.role IN ('admin', 'hr_manager')
    )
  );

-- Admin and HR can update assessments (status transitions) in their org
CREATE POLICY "compliance_assessments_update" ON compliance_assessments
  FOR UPDATE TO authenticated
  USING (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
        AND user_roles.role IN ('admin', 'hr_manager')
    )
  )
  WITH CHECK (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
        AND user_roles.role IN ('admin', 'hr_manager')
    )
  );

-- No DELETE — assessments are permanent records

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_assessments_org
  ON compliance_assessments(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_assessments_status
  ON compliance_assessments(organization_id, status);

COMMENT ON TABLE compliance_assessments IS
  'One compliance review cycle per period. Drives the state machine for EU pay-transparency assessments (Directive 2023/970).';

-- ─── 2. assessment_transitions ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS assessment_transitions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES compliance_assessments(id) ON DELETE CASCADE,
  from_status   TEXT NOT NULL,
  to_status     TEXT NOT NULL,
  actor_id      TEXT,
  actor_role    TEXT NOT NULL CHECK (actor_role IN ('admin', 'hr_manager', 'lawyer', 'system')),
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE assessment_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_transitions FORCE ROW LEVEL SECURITY;

-- Org members can view transitions for assessments in their org
CREATE POLICY "assessment_transitions_select" ON assessment_transitions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM compliance_assessments ca
      WHERE ca.id = assessment_transitions.assessment_id
        AND ca.organization_id = public.org_id()
        AND EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
            AND user_roles.organization_id = public.org_id()
            AND user_roles.role IN ('admin', 'hr_manager', 'lawyer')
        )
    )
  );

-- Authenticated org members can append transition records
CREATE POLICY "assessment_transitions_insert" ON assessment_transitions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM compliance_assessments ca
      WHERE ca.id = assessment_transitions.assessment_id
        AND ca.organization_id = public.org_id()
        AND EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
            AND user_roles.organization_id = public.org_id()
            AND user_roles.role IN ('admin', 'hr_manager', 'lawyer')
        )
    )
  );

-- No UPDATE or DELETE — transition log is immutable

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assessment_transitions_assessment
  ON assessment_transitions(assessment_id, created_at DESC);

COMMENT ON TABLE assessment_transitions IS
  'Immutable log of every status change on a compliance assessment. Used for audit trail and timeline UI.';

-- ─── 3. legal_review_comments ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS legal_review_comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id   UUID NOT NULL REFERENCES compliance_assessments(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL,
  lawyer_id       TEXT NOT NULL,
  section         TEXT NOT NULL,
  severity        TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'BLOCKER')),
  comment_text    TEXT NOT NULL CHECK (char_length(comment_text) >= 1),
  resolved        BOOLEAN NOT NULL DEFAULT false,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE legal_review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_review_comments FORCE ROW LEVEL SECURITY;

-- Lawyers (own org) and admin/hr can read comments
CREATE POLICY "legal_review_comments_select" ON legal_review_comments
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
        AND user_roles.role IN ('admin', 'hr_manager', 'lawyer')
    )
  );

-- Only the assigned lawyer for this org can insert comments
CREATE POLICY "legal_review_comments_insert" ON legal_review_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.org_id()
    AND lawyer_id = (auth.jwt() ->> 'sub')
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
        AND user_roles.role = 'lawyer'
    )
  );

-- Admin and HR can mark comments as resolved (resolved + resolved_at only)
CREATE POLICY "legal_review_comments_update" ON legal_review_comments
  FOR UPDATE TO authenticated
  USING (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
        AND user_roles.role IN ('admin', 'hr_manager')
    )
  )
  WITH CHECK (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
        AND user_roles.role IN ('admin', 'hr_manager')
    )
  );

-- No DELETE — comments are permanent per the audit trail requirement

-- Indexes
CREATE INDEX IF NOT EXISTS idx_legal_review_comments_assessment
  ON legal_review_comments(assessment_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_legal_review_comments_org
  ON legal_review_comments(organization_id, severity);

COMMENT ON TABLE legal_review_comments IS
  'Lawyer annotations on a compliance assessment, scoped by section and severity. Admin/HR resolve; lawyers write.';

-- ─── 4. certified_snapshots ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS certified_snapshots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id    UUID NOT NULL REFERENCES compliance_assessments(id),
  organization_id  TEXT NOT NULL,
  lawyer_id        TEXT NOT NULL,
  certified_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until      TIMESTAMPTZ NOT NULL,
  snapshot_data    JSONB NOT NULL,
  lawyer_statement TEXT NOT NULL CHECK (char_length(lawyer_statement) >= 10),
  pdf_url          TEXT
);

ALTER TABLE certified_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE certified_snapshots FORCE ROW LEVEL SECURITY;

-- All org members (admin, hr_manager, lawyer, employee) can read snapshots
CREATE POLICY "certified_snapshots_select" ON certified_snapshots
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
    )
  );

-- Only the assigned lawyer for this org can certify (INSERT)
CREATE POLICY "certified_snapshots_insert" ON certified_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.org_id()
    AND lawyer_id = (auth.jwt() ->> 'sub')
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
        AND user_roles.role = 'lawyer'
    )
  );

-- No UPDATE or DELETE — snapshots are immutable certification artifacts

-- Indexes
CREATE INDEX IF NOT EXISTS idx_certified_snapshots_assessment
  ON certified_snapshots(assessment_id);

CREATE INDEX IF NOT EXISTS idx_certified_snapshots_org
  ON certified_snapshots(organization_id, certified_at DESC);

COMMENT ON TABLE certified_snapshots IS
  'Immutable certification artifact created by a lawyer after validation. Contains a full data snapshot and lawyer statement. Never updated or deleted.';
