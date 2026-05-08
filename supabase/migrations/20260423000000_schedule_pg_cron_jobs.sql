-- Migration: Schedule pg_cron jobs for trial cleanup and expired-trial status updates.
--
-- PREREQUISITES (manual, one-time):
--   1. Supabase Dashboard → Database → Extensions → enable pg_cron
--   2. Apply this migration: supabase db push
--
-- This migration is idempotent: it calls cron.schedule() which upserts by job name.

-- ─── 2. Mark trials as expired in-place (subscription_status update) ────────────
-- Moves companies from status='trialing' to status='canceled' once trial_ends_at
-- has passed. This ensures getEffectiveTier() downgrades to 'basis' without
-- needing the cron-reminder email endpoint to mutate state.
-- Runs every hour to keep the status column tight.
CREATE OR REPLACE FUNCTION public.expire_ended_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE companies
  SET subscription_status = 'canceled'
  WHERE subscription_status = 'trialing'
    AND trial_ends_at IS NOT NULL
    AND trial_ends_at < NOW()
    AND stripe_subscription_id IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_ended_trials() FROM PUBLIC;

DO $$
BEGIN
  IF to_regnamespace('cron') IS NULL THEN
    RAISE NOTICE 'Skipping cron job scheduling because pg_cron is not enabled';
    RETURN;
  END IF;

  -- Nightly cleanup: delete data for orgs whose trial ended > 30 days ago.
  PERFORM cron.schedule(
    'cleanup-expired-trials',
    '0 2 * * *',
    'SELECT public.cleanup_expired_trial_accounts()'
  );

  -- Mark ended trials every hour so getEffectiveTier() downgrades promptly.
  PERFORM cron.schedule(
    'expire-ended-trials',
    '15 * * * *',
    'SELECT public.expire_ended_trials()'
  );
END $$;

-- Verify scheduled jobs:
-- SELECT jobname, schedule, command FROM cron.job
--   WHERE jobname IN ('cleanup-expired-trials', 'expire-ended-trials');
