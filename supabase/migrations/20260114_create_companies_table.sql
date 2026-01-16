-- Complete companies table setup for KlarGehalt
-- This creates the table if it doesn't exist and ensures all columns are present

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  legal_name TEXT,
  tax_id TEXT,
  address TEXT,
  country TEXT DEFAULT 'DE' NOT NULL,
  industry TEXT,
  employee_count_range TEXT,
  size TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Users can insert their own company" ON companies;
DROP POLICY IF EXISTS "Users can update their own company" ON companies;
DROP POLICY IF EXISTS "Company creators can view" ON companies;
DROP POLICY IF EXISTS "Company creators can update" ON companies;

-- RLS Policies
-- Allow users to view companies they're associated with
CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

-- Allow authenticated users to create companies
CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow company creators and associated users to update
CREATE POLICY "Users can update their own company"
  ON companies FOR UPDATE
  USING (
    id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_size ON companies(size);
CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(country);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS companies_updated_at ON companies;
CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();

-- Comments
COMMENT ON TABLE companies IS 'Stores company information for KlarGehalt platform';
COMMENT ON COLUMN companies.name IS 'Company display name';
COMMENT ON COLUMN companies.legal_name IS 'Official legal name';
COMMENT ON COLUMN companies.tax_id IS 'Tax identification number';
COMMENT ON COLUMN companies.size IS 'Company size category (e.g., 1-50, 51-250)';
COMMENT ON COLUMN companies.created_by IS 'User who created the company';
COMMENT ON COLUMN companies.employee_count_range IS 'Employee count range for reporting';
