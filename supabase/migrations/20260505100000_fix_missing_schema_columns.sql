-- Add missing columns to pay_bands that the UI form expects
ALTER TABLE pay_bands
  ADD COLUMN IF NOT EXISTS job_level_id UUID REFERENCES job_levels(id),
  ADD COLUMN IF NOT EXISTS effective_from DATE,
  ADD COLUMN IF NOT EXISTS effective_to DATE;

-- Make pay_bands.name nullable — the UI doesn't have a name field;
-- the band is identified by job_profile + job_level.
ALTER TABLE pay_bands ALTER COLUMN name DROP NOT NULL;

-- Add missing leave date columns to employees that the API selects
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS leave_start DATE,
  ADD COLUMN IF NOT EXISTS leave_end DATE;
