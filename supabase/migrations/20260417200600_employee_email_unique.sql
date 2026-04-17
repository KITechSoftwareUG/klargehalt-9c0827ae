-- Prevent duplicate employee emails within the same organization.
-- Partial unique index: only enforced when email is present and non-empty.

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_org_email
  ON employees(organization_id, email)
  WHERE email IS NOT NULL AND email != '';
