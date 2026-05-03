-- Drop audit_logs_full_access (qual=true — allows any authenticated user to read/write all audit logs)
DROP POLICY IF EXISTS "audit_logs_full_access" ON audit_logs;

-- Enable RLS on rate_limit_entries (currently exposed without RLS)
-- Only service_role should touch this table — no policies needed
ALTER TABLE rate_limit_entries ENABLE ROW LEVEL SECURITY;
