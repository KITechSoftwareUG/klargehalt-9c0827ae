-- Migration: Add missing tables (departments, job_levels, pay_gap_snapshots)
-- and missing columns referenced by frontend hooks.
-- Uses IF NOT EXISTS / IF EXISTS to be fully idempotent.

-- ─── 1. departments ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS departments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  TEXT NOT NULL,
  name             TEXT NOT NULL,
  parent_id        UUID REFERENCES departments(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, name)
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY "tenant_isolation" ON departments
      FOR ALL TO authenticated
      USING (organization_id = public.org_id())
      WITH CHECK (organization_id = public.org_id());
  END IF;
END $$;

-- ─── 2. job_levels ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS job_levels (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  TEXT NOT NULL,
  name             TEXT NOT NULL,
  rank             INTEGER NOT NULL,
  UNIQUE(organization_id, name)
);

ALTER TABLE job_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_levels FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'job_levels' AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY "tenant_isolation" ON job_levels
      FOR ALL TO authenticated
      USING (organization_id = public.org_id())
      WITH CHECK (organization_id = public.org_id());
  END IF;
END $$;

-- ─── 3. pay_gap_snapshots ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pay_gap_snapshots (
  id                             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id                TEXT NOT NULL,
  snapshot_date                  DATE NOT NULL,
  scope                          TEXT NOT NULL,   -- 'company','department','job_profile','job_level'
  scope_id                       UUID,            -- NULL = company-wide
  scope_label                    TEXT,
  male_count                     INTEGER NOT NULL DEFAULT 0,
  female_count                   INTEGER NOT NULL DEFAULT 0,
  male_mean_base                 NUMERIC(12,2),
  female_mean_base               NUMERIC(12,2),
  male_median_base               NUMERIC(12,2),
  female_median_base             NUMERIC(12,2),
  mean_gap_base_pct              NUMERIC(5,2),
  median_gap_base_pct            NUMERIC(5,2),
  male_mean_variable             NUMERIC(12,2),
  female_mean_variable           NUMERIC(12,2),
  mean_gap_variable_pct          NUMERIC(5,2),
  pct_male_receiving_variable    NUMERIC(5,2),
  pct_female_receiving_variable  NUMERIC(5,2),
  gap_status                     TEXT,            -- 'compliant','warning','violation'
  is_suppressed                  BOOLEAN NOT NULL DEFAULT false,
  created_at                     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pay_gap_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_gap_snapshots FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pay_gap_snapshots' AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY "tenant_isolation" ON pay_gap_snapshots
      FOR ALL TO authenticated
      USING (organization_id = public.org_id())
      WITH CHECK (organization_id = public.org_id());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pay_gap_snapshots_org_date
  ON pay_gap_snapshots(organization_id, snapshot_date DESC);

-- ─── 4. Add department_id to employees (FK to departments) ───────────────────
-- The existing "department" column is text; we add department_id (uuid) for
-- normalized lookups used by usePayGapStatistics hook.

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

-- ─── 5. Add department_id + job_level_id to job_profiles ─────────────────────

ALTER TABLE job_profiles
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

ALTER TABLE job_profiles
  ADD COLUMN IF NOT EXISTS job_level_id UUID REFERENCES job_levels(id);
