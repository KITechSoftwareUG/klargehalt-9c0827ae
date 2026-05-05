-- Drop insecure "Allow All" style policies (qual=true) that bypass tenant isolation.
-- Any authenticated user from any org could read all rows in these tables.
-- Proper org-scoped policies already exist on each table.

DROP POLICY IF EXISTS "employees_full_access" ON employees;
DROP POLICY IF EXISTS "job_profiles_full_access" ON job_profiles;
DROP POLICY IF EXISTS "pay_bands_full_access" ON pay_bands;
