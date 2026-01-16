-- Ensure companies table has all required columns
-- This migration is idempotent and can be run multiple times

-- Add size column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'size'
  ) THEN
    ALTER TABLE companies ADD COLUMN size TEXT;
  END IF;
END $$;

-- Add created_by column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE companies ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Ensure country has a default value
ALTER TABLE companies ALTER COLUMN country SET DEFAULT 'DE';

-- Add index on created_by if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'companies' AND indexname = 'idx_companies_created_by'
  ) THEN
    CREATE INDEX idx_companies_created_by ON companies(created_by);
  END IF;
END $$;

-- Add index on size if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'companies' AND indexname = 'idx_companies_size'
  ) THEN
    CREATE INDEX idx_companies_size ON companies(size);
  END IF;
END $$;

-- Comments
COMMENT ON COLUMN companies.size IS 'Company size category (e.g., 1-50, 51-250, etc.)';
COMMENT ON COLUMN companies.created_by IS 'User who created the company';
