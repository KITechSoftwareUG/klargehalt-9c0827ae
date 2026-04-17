-- Supabase-backed rate limiter (replaces in-memory Map)

CREATE TABLE IF NOT EXISTS rate_limit_entries (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS disabled: only accessed via service role
ALTER TABLE rate_limit_entries DISABLE ROW LEVEL SECURITY;

-- Index for periodic cleanup of expired windows
CREATE INDEX idx_rate_limit_entries_window_start ON rate_limit_entries (window_start);

-- Atomic check-and-increment function
CREATE OR REPLACE FUNCTION check_rate_limit(
  _key TEXT,
  _limit INTEGER,
  _window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _entry RECORD;
BEGIN
  -- Try to get existing entry with row lock
  SELECT count, window_start
    INTO _entry
    FROM rate_limit_entries
   WHERE key = _key
   FOR UPDATE;

  IF NOT FOUND THEN
    -- No entry: insert fresh
    INSERT INTO rate_limit_entries (key, count, window_start)
    VALUES (_key, 1, now())
    ON CONFLICT (key) DO UPDATE
      SET count = 1, window_start = now();
    RETURN TRUE;
  END IF;

  -- Window expired: reset
  IF _entry.window_start + (_window_seconds || ' seconds')::INTERVAL <= now() THEN
    UPDATE rate_limit_entries
       SET count = 1, window_start = now()
     WHERE key = _key;
    RETURN TRUE;
  END IF;

  -- Within window and at/over limit
  IF _entry.count >= _limit THEN
    RETURN FALSE;
  END IF;

  -- Within window and under limit: increment
  UPDATE rate_limit_entries
     SET count = _entry.count + 1
   WHERE key = _key;
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, INTEGER, INTEGER) TO authenticated;
