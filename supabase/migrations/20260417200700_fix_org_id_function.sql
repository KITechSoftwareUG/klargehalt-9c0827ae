-- ============================================================
-- MIGRATION: Fix org_id() to read the correct JWT claim
--
-- ROOT CAUSE: The org_id() function reads auth.jwt() ->> 'org_id',
-- but Logto organization tokens do NOT have an 'org_id' claim.
-- Instead, the organization ID is in the 'aud' (audience) claim
-- formatted as 'urn:logto:organization:<org_id>'.
--
-- This caused org_id() to ALWAYS return NULL, which meant:
--   - All RLS SELECT policies returned 0 rows
--   - All RLS INSERT/UPDATE/DELETE policies blocked writes
--   - The app appeared completely broken ("kann gar nichts anlegen")
--
-- FIX: Extract the org ID from the 'aud' claim by stripping the
-- 'urn:logto:organization:' prefix. Falls back to 'org_id' claim
-- if present (for forward-compatibility with custom JWT templates).
-- ============================================================

CREATE OR REPLACE FUNCTION public.org_id()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    -- Primary: extract org ID from Logto organization token audience claim
    -- Format: 'urn:logto:organization:org_abc123' → 'org_abc123'
    CASE
      WHEN (auth.jwt() ->> 'aud') LIKE 'urn:logto:organization:%'
      THEN REPLACE(auth.jwt() ->> 'aud', 'urn:logto:organization:', '')
    END,
    -- Fallback: direct org_id claim (custom JWT template)
    auth.jwt() ->> 'org_id'
  )
$$;
