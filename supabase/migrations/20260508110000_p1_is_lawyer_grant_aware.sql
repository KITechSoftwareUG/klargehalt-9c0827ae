-- ============================================================
-- P1: is_lawyer() auf lawyer_access_grants umstellen
-- KlarGehalt — 2026-05-08
--
-- Bisher: is_lawyer() prüft nur user_roles.role = 'lawyer'
--         → abgelaufene/widerrufene Anwälte behalten Zugriff
--
-- Fix: is_lawyer() prüft lawyer_access_grants direkt:
--      expires_at > now() AND revoked_at IS NULL
--      → Zugriff erlischt automatisch ohne user_roles bereinigen zu müssen
--
-- SECURITY DEFINER: RLS auf lawyer_access_grants wird bypassed, aber
-- der Filter auf lawyer_user_id = sub + organization_id = org_id()
-- stellt sicher dass nur eigene, org-korrekte Grants geprüft werden.
--
-- Alle Policies die (SELECT public.is_lawyer()) verwenden profitieren
-- automatisch ohne Policy-Änderung:
--   - audit_select_lawyer
--   - salary_decisions_select_lawyer
--
-- Zusätzlich: lawyer_reviews_insert ebenfalls auf Grant-Check umstellen.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_lawyer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM lawyer_access_grants
    WHERE lawyer_user_id  = (auth.jwt() ->> 'sub')
      AND organization_id = public.org_id()
      AND expires_at      > now()
      AND revoked_at      IS NULL
  )
$$;

-- lawyer_reviews_insert: ebenfalls auf aktiven Grant prüfen
-- (bisher: user_roles.role = 'lawyer' — ignoriert expires_at/revoked_at)
DROP POLICY IF EXISTS "lawyer_reviews_insert" ON lawyer_reviews;

CREATE POLICY "lawyer_reviews_insert" ON lawyer_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.org_id()
    AND (SELECT public.is_lawyer())
  );
