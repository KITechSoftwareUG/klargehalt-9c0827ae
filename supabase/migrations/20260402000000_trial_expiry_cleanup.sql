-- PREREQUISITES:
-- 1. Enable pg_cron in Supabase Dashboard → Database → Extensions → pg_cron
-- 2. Apply this migration via: supabase db push OR Supabase Dashboard SQL Editor
-- 3. Verify with: SELECT * FROM cron.job WHERE jobname = 'cleanup-expired-trials';
-- 4. Logto organization deletion must be handled separately via Logto Management API
--    (POST /api/internal/cleanup-orgs endpoint to build, calls LOGTO_M2M to delete org)

-- Function: delete all data for expired organizations (trial ended > 30 days ago)
-- This should be called via a scheduled job (pg_cron or Supabase scheduled functions)

CREATE OR REPLACE FUNCTION public.cleanup_expired_trial_accounts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_org RECORD;
BEGIN
  -- Find all organizations whose trial ended more than 30 days ago
  -- and have never activated a paid subscription
  FOR expired_org IN
    SELECT organization_id
    FROM companies
    WHERE subscription_status = 'trialing'
      AND trial_ends_at IS NOT NULL
      AND trial_ends_at < NOW() - INTERVAL '30 days'
  LOOP
    -- Delete in dependency order (child tables first)
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

-- Grant execute only to service role
REVOKE ALL ON FUNCTION public.cleanup_expired_trial_accounts() FROM PUBLIC;

-- To schedule the cleanup job, do the following MANUALLY after applying this migration:
-- 1. Supabase Dashboard → Database → Extensions → enable pg_cron
-- 2. Then run in the SQL Editor:
--    SELECT cron.schedule(
--      'cleanup-expired-trials',
--      '0 2 * * *',
--      'SELECT public.cleanup_expired_trial_accounts()'
--    );
-- 3. Verify with: SELECT * FROM cron.job WHERE jobname = 'cleanup-expired-trials';
