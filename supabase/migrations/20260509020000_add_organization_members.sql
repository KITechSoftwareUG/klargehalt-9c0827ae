-- ============================================================
-- Add organization_members table
-- KlarGehalt — 2026-05-09
--
-- Introduces a first-class membership table alongside user_roles.
-- user_roles is NOT dropped — it stays as backward-compatible
-- storage until all application code migrates.
--
-- Key design decisions:
--   - UNIQUE (organization_id, user_id) — one active row per user
--     per org; role changes are UPDATEs, not new rows.
--   - role IN ('owner','admin','hr_manager','employee','lawyer',
--     'auditor') — 'owner' is new (first admin promoted by migration
--     20260509030000). 'auditor' reserved for enterprise.
--   - access_expires_at: NULL = permanent. Set for time-limited
--     access (lawyers, external auditors). is_lawyer() and the new
--     is_org_member() helper both check this column.
--   - status IN ('active','invited','suspended','removed') — 'removed'
--     is a soft-delete that keeps the row for audit trail.
--   - RLS: four policies (self-select, admin-select, admin-insert,
--     admin-update, admin-delete). is_org_admin() is the gating
--     helper; at this point it still reads from user_roles. It will
--     be updated to read from organization_members in migration
--     20260509040000 after data has been migrated.
-- ============================================================


CREATE TABLE IF NOT EXISTS public.organization_members (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     TEXT        NOT NULL,
  user_id             TEXT        NOT NULL,
  role                TEXT        NOT NULL DEFAULT 'employee'
                      CHECK (role IN ('owner','admin','hr_manager','employee','lawyer','auditor')),
  status              TEXT        NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','invited','suspended','removed')),
  invited_by_user_id  TEXT,
  joined_at           TIMESTAMPTZ DEFAULT NOW(),
  access_expires_at   TIMESTAMPTZ,            -- NULL = permanent
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

COMMENT ON TABLE public.organization_members IS
  'Primary membership table. Replaces user_roles for RBAC '
  'once all application code has been migrated. '
  'user_roles is retained for backward compatibility during transition.';

COMMENT ON COLUMN public.organization_members.access_expires_at IS
  'NULL = permanent access. Set for lawyers and external auditors.';

COMMENT ON COLUMN public.organization_members.status IS
  'active = normal access. removed = soft-delete (row kept for audit).';


-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_org_members_org
  ON public.organization_members (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_org_members_user
  ON public.organization_members (user_id, status);

CREATE INDEX IF NOT EXISTS idx_org_members_role
  ON public.organization_members (organization_id, role, status);


-- ── Updated-at trigger ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_org_members_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_members_updated_at ON public.organization_members;
CREATE TRIGGER trg_org_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.set_org_members_updated_at();


-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members FORCE ROW LEVEL SECURITY;

-- Members can read their own membership row
DROP POLICY IF EXISTS "org_members_self_select" ON public.organization_members;
CREATE POLICY "org_members_self_select" ON public.organization_members
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.org_id()
    AND user_id = (auth.jwt() ->> 'sub')
  );

-- Admins/owners can read all members of their org
DROP POLICY IF EXISTS "org_members_admin_select" ON public.organization_members;
CREATE POLICY "org_members_admin_select" ON public.organization_members
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.org_id()
    AND (SELECT public.is_org_admin())
  );

-- Admins/owners can add new members.
-- 'owner' role may only be set via service_role (ownership transfer
-- is an admin-level operation outside normal client flows).
DROP POLICY IF EXISTS "org_members_admin_insert" ON public.organization_members;
CREATE POLICY "org_members_admin_insert" ON public.organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.org_id()
    AND (SELECT public.is_org_admin())
    AND role != 'owner'
  );

-- Admins/owners can update role / status / access_expires_at.
-- Cannot set role to 'owner' via client — ownership transfer
-- must go through service_role.
DROP POLICY IF EXISTS "org_members_admin_update" ON public.organization_members;
CREATE POLICY "org_members_admin_update" ON public.organization_members
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.org_id()
    AND (SELECT public.is_org_admin())
  )
  WITH CHECK (
    organization_id = public.org_id()
    AND role != 'owner'
  );

-- Hard delete (prefer status = 'removed' soft-delete, but allow hard
-- delete by admins for GDPR erasure flows).
DROP POLICY IF EXISTS "org_members_admin_delete" ON public.organization_members;
CREATE POLICY "org_members_admin_delete" ON public.organization_members
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.org_id()
    AND (SELECT public.is_org_admin())
  );
