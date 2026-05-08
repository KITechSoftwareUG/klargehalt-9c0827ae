-- ============================================================
-- Update RBAC helper functions to use organization_members
-- KlarGehalt — 2026-05-09
--
-- Replaces the user_roles-backed implementations of is_org_admin()
-- and is_hr_or_admin() with organization_members-backed versions.
-- Adds is_org_member() for general membership checks.
--
-- All functions:
--   - SECURITY DEFINER + SET search_path = public (prevents
--     search_path injection attacks via schema manipulation).
--   - STABLE: PostgreSQL may cache per-statement.
--   - Check status = 'active' AND access not expired.
--   - is_org_admin(): owner OR admin (previously only admin).
--     This is a behavioral change — owner-role users gain full
--     admin access as expected.
--
-- NOTE: All existing RLS policies that call is_org_admin() or
-- is_hr_or_admin() automatically pick up the new logic since
-- functions are resolved at call time, not at policy definition
-- time. No policy changes are needed.
-- ============================================================


-- ── is_org_admin() ────────────────────────────────────────────────────────────
-- Returns true if the calling user is an active owner or admin
-- in the current JWT org. Previously only checked 'admin'.

CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id         = (auth.jwt() ->> 'sub')
      AND organization_id = public.org_id()
      AND role            IN ('owner', 'admin')
      AND status          = 'active'
      AND (access_expires_at IS NULL OR access_expires_at > NOW())
  )
$$;


-- ── is_hr_or_admin() ─────────────────────────────────────────────────────────
-- Returns true if the calling user is owner, admin, or hr_manager
-- in the current JWT org with an active, non-expired membership.

CREATE OR REPLACE FUNCTION public.is_hr_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id         = (auth.jwt() ->> 'sub')
      AND organization_id = public.org_id()
      AND role            IN ('owner', 'admin', 'hr_manager')
      AND status          = 'active'
      AND (access_expires_at IS NULL OR access_expires_at > NOW())
  )
$$;


-- ── is_org_member() ──────────────────────────────────────────────────────────
-- Returns true if the calling user is an active member of the
-- current JWT org (any role). Used for basic membership gating
-- without requiring a specific role.

CREATE OR REPLACE FUNCTION public.is_org_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id         = (auth.jwt() ->> 'sub')
      AND organization_id = public.org_id()
      AND status          = 'active'
      AND (access_expires_at IS NULL OR access_expires_at > NOW())
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_org_member() TO authenticated;
