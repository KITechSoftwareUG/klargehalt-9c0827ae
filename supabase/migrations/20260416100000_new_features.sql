-- ============================================================
-- NEW FEATURES MIGRATION
-- 1. job_postings          — Article 5: salary range in job ads
-- 2. joint_assessments     — Article 10: formal gap assessment workflow
-- 3. joint_assessment_justifications — objective factor evidence
-- 4. rights_notifications  — Article 7: annual employee notification log
-- 5. info_requests updates — SLA deadline tracking (2-month response)
-- ============================================================

-- ─── 1. job_postings ─────────────────────────────────────────────────────────
-- Tracks every job posting created with a salary range. Provides audit trail
-- that all published roles disclosed compensation per Article 5.

CREATE TABLE IF NOT EXISTS job_postings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   TEXT NOT NULL,
  title             TEXT NOT NULL,
  job_profile_id    UUID REFERENCES job_profiles(id),
  job_level_id      UUID REFERENCES job_levels(id),
  department_id     UUID REFERENCES departments(id),
  salary_range_min  NUMERIC(12,2) NOT NULL,
  salary_range_max  NUMERIC(12,2) NOT NULL,
  currency          TEXT DEFAULT 'EUR',
  location          TEXT,
  employment_type   TEXT CHECK (employment_type IN ('full_time','part_time','contract','internship')),
  description       TEXT,
  -- compliance
  salary_disclosed  BOOLEAN DEFAULT true,   -- Article 5 flag
  published_at      TIMESTAMPTZ,
  closed_at         TIMESTAMPTZ,
  status            TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','closed')),
  export_text       TEXT,                   -- generated disclosure text for job boards
  created_by        TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  CHECK (salary_range_max >= salary_range_min)
);

ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'job_postings' AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY "tenant_isolation" ON job_postings
      FOR ALL TO authenticated
      USING (organization_id = public.org_id())
      WITH CHECK (organization_id = public.org_id());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_job_postings_org ON job_postings(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(organization_id, status);


-- ─── 2. joint_assessments ────────────────────────────────────────────────────
-- Article 10: formal joint pay assessment when gap > 5%.
-- Multi-step workflow: initiated → justifying → reviewing → agreed → remediating → closed

CREATE TABLE IF NOT EXISTS joint_assessments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           TEXT NOT NULL,
  snapshot_id               UUID REFERENCES pay_gap_snapshots(id),
  scope                     TEXT NOT NULL,       -- 'company','department','job_profile'
  scope_id                  UUID,
  scope_label               TEXT NOT NULL,
  gap_pct                   NUMERIC(5,2),
  -- workflow state machine
  status                    TEXT NOT NULL DEFAULT 'initiated'
                            CHECK (status IN ('initiated','justifying','reviewing','agreed','remediating','closed','dispute')),
  -- worker representative
  worker_rep_name           TEXT,
  worker_rep_email          TEXT,
  worker_rep_user_id        TEXT,
  worker_rep_reviewed_at    TIMESTAMPTZ,
  worker_rep_decision       TEXT CHECK (worker_rep_decision IN ('approved','disputed') OR worker_rep_decision IS NULL),
  worker_rep_comment        TEXT,
  -- outcome
  gap_justified_pct         NUMERIC(5,2),        -- portion explained by objective factors
  gap_unjustified_pct       NUMERIC(5,2),        -- portion requiring remediation
  remediation_required      BOOLEAN DEFAULT false,
  remediation_deadline      DATE,
  remediation_plan          TEXT,
  remediation_closed_at     TIMESTAMPTZ,
  -- publication
  published_to_workers_at   TIMESTAMPTZ,
  submitted_to_authority_at TIMESTAMPTZ,
  -- metadata
  initiated_by              TEXT NOT NULL,
  finalized_by              TEXT,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE joint_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE joint_assessments FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'joint_assessments' AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY "tenant_isolation" ON joint_assessments
      FOR ALL TO authenticated
      USING (organization_id = public.org_id())
      WITH CHECK (organization_id = public.org_id());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_joint_assessments_org ON joint_assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_joint_assessments_status ON joint_assessments(organization_id, status);


-- ─── 3. joint_assessment_justifications ──────────────────────────────────────
-- Each row is one documented objective factor explaining part of the pay gap.

CREATE TABLE IF NOT EXISTS joint_assessment_justifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  assessment_id   UUID NOT NULL REFERENCES joint_assessments(id) ON DELETE CASCADE,
  factor_type     TEXT NOT NULL CHECK (factor_type IN (
                    'experience','education','performance','market_rate',
                    'seniority','working_conditions','role_scarcity','other'
                  )),
  description     TEXT NOT NULL,
  estimated_gap_impact_pct NUMERIC(5,2),   -- how many % this factor explains
  evidence_notes  TEXT,
  created_by      TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE joint_assessment_justifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE joint_assessment_justifications FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'joint_assessment_justifications' AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY "tenant_isolation" ON joint_assessment_justifications
      FOR ALL TO authenticated
      USING (organization_id = public.org_id())
      WITH CHECK (organization_id = public.org_id());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_jaj_assessment ON joint_assessment_justifications(assessment_id);


-- ─── 4. rights_notifications ─────────────────────────────────────────────────
-- Article 7: employers must inform ALL workers annually of their right to request
-- pay information. This table tracks each notification batch.

CREATE TABLE IF NOT EXISTS rights_notifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     TEXT NOT NULL,
  notification_year   INTEGER NOT NULL,
  sent_at             TIMESTAMPTZ DEFAULT now(),
  sent_by             TEXT NOT NULL,
  recipient_count     INTEGER NOT NULL DEFAULT 0,
  delivery_method     TEXT DEFAULT 'in_app' CHECK (delivery_method IN ('in_app','email','both')),
  notification_text   TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, notification_year)
);

ALTER TABLE rights_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_notifications FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'rights_notifications' AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY "tenant_isolation" ON rights_notifications
      FOR ALL TO authenticated
      USING (organization_id = public.org_id())
      WITH CHECK (organization_id = public.org_id());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rights_notifications_org ON rights_notifications(organization_id);


-- ─── 5. info_requests: add SLA and decline tracking columns ──────────────────
-- Article 7 mandates a 2-month (≈60 day) response deadline.

ALTER TABLE info_requests
  ADD COLUMN IF NOT EXISTS deadline_at  TIMESTAMPTZ,   -- created_at + 60 days
  ADD COLUMN IF NOT EXISTS decline_reason TEXT;          -- reason when status='declined'

-- Backfill deadline_at for existing requests that don't have one
UPDATE info_requests
SET deadline_at = created_at + INTERVAL '60 days'
WHERE deadline_at IS NULL;

-- Also add worker_rep_token to joint_assessments for secure rep access
ALTER TABLE joint_assessments
  ADD COLUMN IF NOT EXISTS worker_rep_token TEXT UNIQUE; -- secure invite token
