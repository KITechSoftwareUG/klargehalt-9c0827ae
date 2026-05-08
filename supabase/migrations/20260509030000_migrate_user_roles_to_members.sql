-- ============================================================
-- Migrate existing user_roles data into organization_members
-- KlarGehalt — 2026-05-09
--
-- Copies all rows from user_roles into organization_members:
--   - Skips rows where organization_id IS NULL (legacy orphan rows
--     created before the organization_id column was added).
--   - ON CONFLICT DO NOTHING — safe to re-run.
--   - Lawyers get access_expires_at = NOW() + 90 days as a
--     conservative default; they can be extended via service_role.
--   - For each org, the earliest admin becomes 'owner' if no
--     owner row exists yet. This uses a deterministic
--     DISTINCT ON (organization_id) ORDER BY created_at ASC
--     so repeated runs are idempotent (first admin never changes).
--
-- user_roles is intentionally NOT dropped here.
-- Drop will happen in a future migration once application code
-- has been fully migrated to organization_members.
-- ============================================================


-- ── Step 1: copy user_roles → organization_members ───────────────────────────

INSERT INTO public.organization_members (
  organization_id,
  user_id,
  role,
  status,
  joined_at,
  access_expires_at,
  created_at,
  updated_at
)
SELECT
  organization_id,
  user_id,
  -- Map existing roles to the new enum. user_roles currently
  -- uses ('admin','hr_manager','employee','lawyer'). 'owner' is
  -- new and assigned below in step 2.
  role,
  'active',
  created_at,
  -- Lawyers get a 90-day access window from now as a safe default.
  -- Permanent access should be granted deliberately via service_role.
  CASE
    WHEN role = 'lawyer' THEN NOW() + INTERVAL '90 days'
    ELSE NULL
  END,
  created_at,
  updated_at
FROM public.user_roles
WHERE
  -- Skip orphan rows without an org — they cannot be scoped.
  organization_id IS NOT NULL
  -- Skip roles not in the new enum (defensive: current data only
  -- has the four roles above, but guards against future drift).
  AND role IN ('admin','hr_manager','employee','lawyer')
ON CONFLICT (organization_id, user_id) DO NOTHING;


-- ── Step 2: promote earliest admin to owner ───────────────────────────────────
-- For every org that has at least one admin but no owner yet,
-- update the admin with the oldest created_at to role = 'owner'.
-- This is deterministic: same row wins on every run.

WITH first_admins AS (
  SELECT DISTINCT ON (organization_id)
    organization_id,
    user_id
  FROM public.organization_members
  WHERE role = 'admin'
  ORDER BY organization_id, created_at ASC
),
orgs_needing_owner AS (
  SELECT fa.organization_id, fa.user_id
  FROM first_admins fa
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = fa.organization_id
      AND om.role = 'owner'
  )
)
UPDATE public.organization_members m
SET
  role       = 'owner',
  updated_at = NOW()
FROM orgs_needing_owner o
WHERE m.organization_id = o.organization_id
  AND m.user_id         = o.user_id;
