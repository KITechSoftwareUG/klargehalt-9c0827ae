-- Add missing columns expected by the application code
-- employee_size_band: drives EU reporting frequency logic
-- reporting_frequency: annual vs triennial based on company size

ALTER TABLE companies ADD COLUMN IF NOT EXISTS employee_size_band TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reporting_frequency TEXT;

-- Migrate existing data from employee_count_range to employee_size_band if applicable
UPDATE companies
SET employee_size_band = employee_count_range
WHERE employee_count_range IS NOT NULL
  AND employee_size_band IS NULL;
