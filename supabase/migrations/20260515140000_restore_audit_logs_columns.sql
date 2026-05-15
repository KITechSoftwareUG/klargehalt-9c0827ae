-- ============================================================
-- HOTFIX: audit_logs missing columns — every write was silently failing
--
-- ROOT CAUSE: The live audit_logs table only has:
--   id, company_id, user_id, action, entity_type, entity_id,
--   changes (jsonb), ip_address, user_agent, created_at,
--   organization_id, sequence_number, previous_hash, record_hash
--
-- But:
--   - lib/audit-log.ts inserts before_state, after_state, old_values,
--     new_values, entity_name, metadata, user_email, user_role
--   - The BEFORE INSERT trigger audit_log_chain_hash() reads
--     NEW.before_state and NEW.after_state to compute the hash
--   - components/dashboard/AuditLogsView.tsx + hooks/useAuditSystem.ts
--     read .before_state, .after_state, .entity_name, .metadata
--
-- Result: every audit log insert returned PGRST204
--   "Could not find the 'after_state' column of 'audit_logs' in the
--    schema cache". The main operation (create job_profile / pay_band /
--    employee / etc.) still succeeded because logAuditEntry is
--    fire-and-forget, but every action since the canonical_schema
--    columns were dropped has been silently un-audited.
--
-- Why this matters: the EU pay-transparency directive (2023/970) hangs
-- the burden-of-proof reversal on a complete, hash-chained audit trail.
-- Silently dropping audit entries is a compliance hole.
--
-- FIX: re-add the columns the code & trigger expect. All nullable; the
-- existing `changes` column stays untouched in case any historical row
-- relied on it. Trigger hash uses COALESCE(...,'') so NULL is safe.
-- ============================================================

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS before_state JSONB,
  ADD COLUMN IF NOT EXISTS after_state  JSONB,
  ADD COLUMN IF NOT EXISTS old_values   JSONB,
  ADD COLUMN IF NOT EXISTS new_values   JSONB,
  ADD COLUMN IF NOT EXISTS entity_name  TEXT,
  ADD COLUMN IF NOT EXISTS metadata     JSONB,
  ADD COLUMN IF NOT EXISTS user_email   TEXT,
  ADD COLUMN IF NOT EXISTS user_role    TEXT;

-- Force PostgREST to reload its schema cache so the new columns become
-- usable immediately, without waiting for the next periodic refresh.
NOTIFY pgrst, 'reload schema';
