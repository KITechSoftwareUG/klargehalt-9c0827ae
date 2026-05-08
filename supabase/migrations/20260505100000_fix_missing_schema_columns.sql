-- Add missing columns to pay_bands that the UI form expects
ALTER TABLE pay_bands
  ADD COLUMN IF NOT EXISTS job_level_id UUID REFERENCES job_levels(id),
  ADD COLUMN IF NOT EXISTS effective_from DATE,
  ADD COLUMN IF NOT EXISTS effective_to DATE;

-- Make pay_bands.name nullable — the UI doesn't have a name field;
-- the band is identified by job_profile + job_level.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pay_bands'
      AND column_name = 'name'
  ) THEN
    ALTER TABLE pay_bands ALTER COLUMN name DROP NOT NULL;
  END IF;
END $$;

-- Add missing leave date columns to employees that the API selects
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS leave_start DATE,
  ADD COLUMN IF NOT EXISTS leave_end DATE;
