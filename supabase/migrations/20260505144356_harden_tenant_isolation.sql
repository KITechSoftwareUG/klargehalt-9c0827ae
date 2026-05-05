-- Harden public view semantics so lawyer_employee_view cannot bypass employees RLS.
CREATE OR REPLACE VIEW lawyer_employee_view
WITH (security_invoker = true) AS
SELECT
  e.id,
  e.organization_id,
  e.employee_number,
  ('Mitarbeiter ' || LPAD(ROW_NUMBER() OVER (
    PARTITION BY e.organization_id ORDER BY e.created_at
  )::TEXT, 3, '0')) AS display_name,
  e.gender,
  e.birth_year,
  e.job_profile_id,
  e.job_level_id,
  e.department_id,
  e.employment_type,
  e.location,
  e.hire_date,
  e.base_salary,
  e.variable_pay,
  e.weekly_hours,
  e.currency,
  e.pay_band_id,
  e.on_leave,
  e.leave_type,
  e.is_active,
  e.created_at,
  e.updated_at
FROM employees e;

-- The hourly expiry job moves ended trials to canceled; cleanup must still
-- remove never-paid trials after the 30-day grace period.
CREATE OR REPLACE FUNCTION public.cleanup_expired_trial_accounts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_org RECORD;
BEGIN
  FOR expired_org IN
    SELECT organization_id
    FROM companies
    WHERE subscription_status IN ('trialing', 'canceled')
      AND stripe_subscription_id IS NULL
      AND trial_ends_at IS NOT NULL
      AND trial_ends_at < NOW() - INTERVAL '30 days'
  LOOP
    DELETE FROM audit_logs        WHERE organization_id = expired_org.organization_id;
    DELETE FROM info_requests     WHERE organization_id = expired_org.organization_id;
    DELETE FROM consultation_bookings WHERE organization_id = expired_org.organization_id;
    DELETE FROM employees         WHERE organization_id = expired_org.organization_id;
    DELETE FROM pay_bands         WHERE organization_id = expired_org.organization_id;
    DELETE FROM job_profiles      WHERE organization_id = expired_org.organization_id;
    DELETE FROM onboarding_data   WHERE organization_id = expired_org.organization_id;
    DELETE FROM user_roles        WHERE organization_id = expired_org.organization_id;
    DELETE FROM profiles          WHERE organization_id = expired_org.organization_id;
    DELETE FROM companies         WHERE organization_id = expired_org.organization_id;

    RAISE LOG 'Deleted expired trial account for organization: %', expired_org.organization_id;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_trial_accounts() FROM PUBLIC;
