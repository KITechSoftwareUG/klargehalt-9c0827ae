-- ============================================================
-- AUDIT LOG HASH CHAIN
-- Tamper-evident append-only chain for Art. 16 EU-RL 2023/970
-- (burden of proof reversal). Each row links to the previous
-- row's hash, forming a per-organization hash chain that makes
-- silent modification or deletion detectable.
-- ============================================================

-- 1. Sequence for monotonic ordering
CREATE SEQUENCE IF NOT EXISTS audit_log_sequence;

-- 2. Add hash chain columns
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS sequence_number BIGINT NOT NULL DEFAULT nextval('audit_log_sequence');

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS previous_hash TEXT;

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS record_hash TEXT;

-- 3. Trigger function: compute hash chain on INSERT
CREATE OR REPLACE FUNCTION audit_log_chain_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _prev_hash TEXT;
BEGIN
  -- Look up the most recent record_hash for this organization
  SELECT record_hash INTO _prev_hash
  FROM audit_logs
  WHERE organization_id = NEW.organization_id
    AND record_hash IS NOT NULL
  ORDER BY sequence_number DESC
  LIMIT 1;

  -- Set previous_hash: GENESIS for first entry, otherwise the previous record_hash
  IF _prev_hash IS NULL THEN
    NEW.previous_hash := 'GENESIS';
  ELSE
    NEW.previous_hash := _prev_hash;
  END IF;

  -- Assign sequence number
  NEW.sequence_number := nextval('audit_log_sequence');

  -- Compute record_hash over all content fields + previous_hash
  NEW.record_hash := encode(
    sha256(
      (
        COALESCE(NEW.id::text, '') || '|' ||
        COALESCE(NEW.organization_id, '') || '|' ||
        COALESCE(NEW.user_id, '') || '|' ||
        COALESCE(NEW.action, '') || '|' ||
        COALESCE(NEW.entity_type, '') || '|' ||
        COALESCE(NEW.entity_id::text, '') || '|' ||
        COALESCE(NEW.before_state::text, '') || '|' ||
        COALESCE(NEW.after_state::text, '') || '|' ||
        COALESCE(NEW.created_at::text, '') || '|' ||
        COALESCE(NEW.previous_hash, '')
      )::bytea
    ),
    'hex'
  );

  RETURN NEW;
END;
$$;

-- 4. Attach the trigger (BEFORE INSERT so we can modify NEW)
DROP TRIGGER IF EXISTS trg_audit_log_chain_hash ON audit_logs;
CREATE TRIGGER trg_audit_log_chain_hash
  BEFORE INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_chain_hash();

-- 5. Verification function: walks the chain for an org and checks integrity
CREATE OR REPLACE FUNCTION verify_audit_chain(_org_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  _row RECORD;
  _expected_hash TEXT;
  _prev_hash TEXT := NULL;
BEGIN
  FOR _row IN
    SELECT *
    FROM audit_logs
    WHERE organization_id = _org_id
      AND record_hash IS NOT NULL
    ORDER BY sequence_number ASC
  LOOP
    -- Check previous_hash linkage
    IF _prev_hash IS NULL THEN
      IF _row.previous_hash IS DISTINCT FROM 'GENESIS' THEN
        RETURN FALSE;
      END IF;
    ELSE
      IF _row.previous_hash IS DISTINCT FROM _prev_hash THEN
        RETURN FALSE;
      END IF;
    END IF;

    -- Recompute the hash and compare
    _expected_hash := encode(
      sha256(
        (
          COALESCE(_row.id::text, '') || '|' ||
          COALESCE(_row.organization_id, '') || '|' ||
          COALESCE(_row.user_id, '') || '|' ||
          COALESCE(_row.action, '') || '|' ||
          COALESCE(_row.entity_type, '') || '|' ||
          COALESCE(_row.entity_id::text, '') || '|' ||
          COALESCE(_row.before_state::text, '') || '|' ||
          COALESCE(_row.after_state::text, '') || '|' ||
          COALESCE(_row.created_at::text, '') || '|' ||
          COALESCE(_row.previous_hash, '')
        )::bytea
      ),
      'hex'
    );

    IF _row.record_hash IS DISTINCT FROM _expected_hash THEN
      RETURN FALSE;
    END IF;

    _prev_hash := _row.record_hash;
  END LOOP;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION verify_audit_chain(TEXT) TO authenticated;

-- 6. Indexes for chain lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_sequence
  ON audit_logs(organization_id, sequence_number);

CREATE INDEX IF NOT EXISTS idx_audit_logs_hash
  ON audit_logs(organization_id, record_hash);

-- 7. Prevent DELETE at database level (defense in depth beyond RLS)
CREATE OR REPLACE FUNCTION prevent_audit_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'DELETE on audit_logs is prohibited. Audit logs are immutable.';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_audit_delete ON audit_logs;
CREATE TRIGGER trg_prevent_audit_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_delete();
