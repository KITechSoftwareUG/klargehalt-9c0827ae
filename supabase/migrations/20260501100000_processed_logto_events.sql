-- Migration: Dedicated idempotency table for Logto webhook events.
-- Replaces the earlier workaround that reused processed_stripe_events for Logto deduplication.
-- The Logto webhook now writes here instead of to processed_stripe_events.

CREATE TABLE IF NOT EXISTS processed_logto_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE processed_logto_events ENABLE ROW LEVEL SECURITY;

-- Only service role (used by the webhook handler) can read/write
CREATE POLICY "service_role_only" ON processed_logto_events
  USING (false)
  WITH CHECK (false);

-- Auto-clean events older than 30 days to keep table small
CREATE INDEX IF NOT EXISTS idx_processed_logto_events_processed_at
  ON processed_logto_events(processed_at);
