-- Migration: Add evaluation attribution columns to job_profiles
-- Purpose: EU Art. 16 compliance — reversed burden of proof requires documented
--          evaluation methodology and evaluator attribution for Art. 4 scores.

-- Evaluation methodology used
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS evaluation_method TEXT
  CHECK (evaluation_method IN ('hay','korn_ferry','mercer','willis_towers_watson','internal','other'));

-- Free-text notes when method is 'other'
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS evaluation_method_notes TEXT;

-- Who performed the evaluation (user ID for traceability)
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS evaluated_by TEXT;

-- Display name of evaluator (denormalized for read performance)
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS evaluated_by_name TEXT;

-- Timestamp of last evaluation
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS last_evaluated_at TIMESTAMPTZ;

-- Ensure the four Art. 4.4 score columns exist (defined in canonical schema
-- but may be missing on older remote DBs)
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS skills_score INTEGER CHECK (skills_score BETWEEN 1 AND 5);
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS effort_score INTEGER CHECK (effort_score BETWEEN 1 AND 5);
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS responsibility_score INTEGER CHECK (responsibility_score BETWEEN 1 AND 5);
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS working_conditions_score INTEGER CHECK (working_conditions_score BETWEEN 1 AND 5);

-- Composite score: sum of all four Art. 4.4 criteria (0-20 range)
-- Used for quick comparator grouping of equivalent work
ALTER TABLE job_profiles ADD COLUMN IF NOT EXISTS composite_score INTEGER
  GENERATED ALWAYS AS (
    COALESCE(skills_score, 0) + COALESCE(effort_score, 0) +
    COALESCE(responsibility_score, 0) + COALESCE(working_conditions_score, 0)
  ) STORED;

-- Index for composite score lookups (comparator grouping)
CREATE INDEX IF NOT EXISTS idx_job_profiles_composite_score
  ON job_profiles (organization_id, composite_score)
  WHERE is_active = true;

-- Index for evaluation audit queries
CREATE INDEX IF NOT EXISTS idx_job_profiles_evaluated_by
  ON job_profiles (organization_id, evaluated_by)
  WHERE evaluated_by IS NOT NULL;
