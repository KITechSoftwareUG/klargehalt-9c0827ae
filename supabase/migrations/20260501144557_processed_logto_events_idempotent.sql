-- Remote-applied idempotent replay of processed_logto_events.
-- Kept locally so Supabase migration history matches production.

CREATE TABLE IF NOT EXISTS processed_logto_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE processed_logto_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'processed_logto_events'
      AND policyname = 'service_role_only'
  ) THEN
    CREATE POLICY "service_role_only" ON processed_logto_events
      USING (false)
      WITH CHECK (false);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_processed_logto_events_processed_at
  ON processed_logto_events(processed_at);
