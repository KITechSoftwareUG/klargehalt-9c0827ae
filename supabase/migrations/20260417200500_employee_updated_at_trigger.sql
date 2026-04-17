-- Auto-set updated_at on UPDATE for tables that have the column.
-- Defense-in-depth: the application also sets updated_at explicitly,
-- but this trigger guarantees correctness even for direct SQL updates.

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- employees
DROP TRIGGER IF EXISTS trg_employees_updated_at ON employees;
CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- companies
DROP TRIGGER IF EXISTS trg_companies_updated_at ON companies;
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- job_profiles
DROP TRIGGER IF EXISTS trg_job_profiles_updated_at ON job_profiles;
CREATE TRIGGER trg_job_profiles_updated_at
  BEFORE UPDATE ON job_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- pay_bands
DROP TRIGGER IF EXISTS trg_pay_bands_updated_at ON pay_bands;
CREATE TRIGGER trg_pay_bands_updated_at
  BEFORE UPDATE ON pay_bands
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
