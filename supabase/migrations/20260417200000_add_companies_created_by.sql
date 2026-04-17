-- Migration: Add created_by column to companies table
-- Purpose: Track which user created each company/org so the repair-role
--          endpoint can correctly assign 'admin' to org creators.

-- 1. Add the column (nullable so existing rows don't break)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_by TEXT;

-- 2. Backfill: for each company, find the earliest admin user_role entry
--    for that organization and use that user_id as created_by.
UPDATE companies c
SET created_by = sub.user_id
FROM (
  SELECT DISTINCT ON (organization_id)
    organization_id,
    user_id
  FROM user_roles
  WHERE role = 'admin'
  ORDER BY organization_id, created_at ASC
) sub
WHERE c.organization_id = sub.organization_id
  AND c.created_by IS NULL;

-- 3. Index for lookups (e.g. repair-role queries by created_by)
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);
