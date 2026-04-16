-- Add self_reported_role column to onboarding_data
ALTER TABLE onboarding_data ADD COLUMN IF NOT EXISTS self_reported_role TEXT CHECK (self_reported_role IN ('admin', 'hr_manager'));

-- Add UNIQUE constraint for upsert-by-user_id support
-- Deduplicate first (idempotent — safe if no duplicates exist)
DELETE FROM onboarding_data a USING onboarding_data b
WHERE a.id < b.id AND a.user_id = b.user_id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'onboarding_data_user_id_key'
      AND conrelid = 'onboarding_data'::regclass
  ) THEN
    ALTER TABLE onboarding_data ADD CONSTRAINT onboarding_data_user_id_key UNIQUE (user_id);
  END IF;
END;
$$;
