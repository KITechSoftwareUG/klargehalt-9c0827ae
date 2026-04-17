-- Enforce subscription plan limits at the database level.
-- Prevents bypassing client-side checks by inserting directly via Supabase.

--------------------------------------------------------------------------------
-- 1. Employee count limit per subscription tier
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_employee_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier TEXT;
  v_count INTEGER;
  v_limit INTEGER;
BEGIN
  -- Look up the company's subscription tier
  SELECT subscription_tier INTO v_tier
  FROM companies
  WHERE organization_id = NEW.organization_id;

  -- Enterprise or unknown tier: no limit
  IF v_tier IS NULL OR v_tier = 'enterprise' THEN
    RETURN NEW;
  END IF;

  -- Determine the limit based on tier
  IF v_tier = 'basis' THEN
    v_limit := 50;
  ELSIF v_tier = 'professional' THEN
    v_limit := 250;
  ELSE
    -- Unknown tier, allow (fail open for forward compatibility)
    RETURN NEW;
  END IF;

  -- Count existing active employees for this org
  SELECT COUNT(*) INTO v_count
  FROM employees
  WHERE organization_id = NEW.organization_id
    AND is_active = true;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'Mitarbeiterlimit für Ihren Tarif erreicht. Bitte upgraden Sie Ihren Plan.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_employee_limit ON employees;

CREATE TRIGGER trg_check_employee_limit
  BEFORE INSERT ON employees
  FOR EACH ROW
  EXECUTE FUNCTION public.check_employee_limit();

--------------------------------------------------------------------------------
-- 2. Admin / HR manager count limit per subscription tier
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_role_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier TEXT;
  v_count INTEGER;
  v_limit INTEGER;
BEGIN
  -- Only check admin and hr_manager roles; employee role has no cap
  IF NEW.role NOT IN ('admin', 'hr_manager') THEN
    RETURN NEW;
  END IF;

  -- Look up the company's subscription tier
  SELECT subscription_tier INTO v_tier
  FROM companies
  WHERE organization_id = NEW.organization_id;

  -- Enterprise or unknown tier: no limit
  IF v_tier IS NULL OR v_tier = 'enterprise' THEN
    RETURN NEW;
  END IF;

  IF NEW.role = 'admin' THEN
    IF v_tier = 'basis' THEN
      v_limit := 1;
    ELSIF v_tier = 'professional' THEN
      v_limit := 5;
    ELSE
      RETURN NEW;
    END IF;
  ELSIF NEW.role = 'hr_manager' THEN
    IF v_tier = 'basis' THEN
      v_limit := 1;
    ELSIF v_tier = 'professional' THEN
      -- Professional tier: unlimited HR managers
      RETURN NEW;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Count existing users with this role in the org
  SELECT COUNT(*) INTO v_count
  FROM user_roles
  WHERE organization_id = NEW.organization_id
    AND role = NEW.role;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'Rollenlimit für Ihren Tarif erreicht. Bitte upgraden Sie Ihren Plan.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_role_limit ON user_roles;

CREATE TRIGGER trg_check_role_limit
  BEFORE INSERT ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_role_limit();
