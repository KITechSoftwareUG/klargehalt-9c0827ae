-- ============================================================
-- Seat limit trigger on organization_members + subscription_changes table
-- KlarGehalt — 2026-05-09
--
-- Part A: check_org_member_seat_limit()
--   Fires BEFORE INSERT OR UPDATE OF role on organization_members.
--   Reads seat limits from the plans table (seeded in 20260509010000).
--   Uses pg_advisory_xact_lock() to prevent race conditions under
--   concurrent INSERTs (two requests simultaneously adding admins
--   to a basis org with max_admin_seats=1 would both pass a COUNT
--   check without the lock).
--   -1 in max_*_seats means unlimited — trigger returns immediately.
--   Skips the check if TG_OP='UPDATE' and the role has not changed.
--   Raises EXCEPTION with a human-readable upgrade prompt so the
--   application can surface the message via toast().
--
-- Part B: subscription_changes table
--   Append-only audit table written by Stripe webhook handler and
--   the reconcile endpoint (both use service_role). Authenticated
--   clients can only SELECT their org's rows (admin only).
-- ============================================================


-- ── Part A: seat limit trigger ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_org_member_seat_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id       TEXT;
  v_max_admins    INT;
  v_max_hr        INT;
  v_current_count INT;
BEGIN
  -- Only admin/owner/hr_manager seats are capped.
  IF NEW.role NOT IN ('owner', 'admin', 'hr_manager') THEN
    RETURN NEW;
  END IF;

  -- For UPDATE: skip if role is unchanged (e.g. status change only).
  IF TG_OP = 'UPDATE' AND OLD.role = NEW.role THEN
    RETURN NEW;
  END IF;

  -- Resolve the org's current plan from companies.
  -- COALESCE to 'basis' so new orgs without a confirmed tier are
  -- treated conservatively.
  SELECT COALESCE(subscription_tier, 'basis')
  INTO   v_plan_id
  FROM   public.companies
  WHERE  organization_id = NEW.organization_id
  LIMIT  1;

  -- Fallback if company row doesn't exist yet (e.g. during onboarding).
  v_plan_id := COALESCE(v_plan_id, 'basis');

  -- ── Admin / owner limit ──────────────────────────────────────────────────

  IF NEW.role IN ('owner', 'admin') THEN
    SELECT max_admin_seats
    INTO   v_max_admins
    FROM   public.plans
    WHERE  id = v_plan_id;

    -- -1 = unlimited — skip count check.
    IF v_max_admins IS NOT DISTINCT FROM -1 THEN
      RETURN NEW;
    END IF;

    -- Advisory lock scoped to this transaction prevents concurrent
    -- inserts from both reading 0 and both succeeding.
    PERFORM pg_advisory_xact_lock(
      hashtext(NEW.organization_id || '_admin_seats')
    );

    SELECT COUNT(*)
    INTO   v_current_count
    FROM   public.organization_members
    WHERE  organization_id = NEW.organization_id
      AND  role            IN ('owner', 'admin')
      AND  status          = 'active'
      -- Exclude the row being updated so a role change doesn't
      -- double-count the current user.
      AND  id IS DISTINCT FROM NEW.id;

    IF v_current_count >= v_max_admins THEN
      RAISE EXCEPTION
        'Admin seat limit reached for your plan (max: %). '
        'Upgrade to Professional for more admin seats.',
        v_max_admins
        USING ERRCODE = 'insufficient_privilege';
    END IF;

  -- ── HR Manager limit ──────────────────────────────────────────────────────

  ELSIF NEW.role = 'hr_manager' THEN
    SELECT max_hr_seats
    INTO   v_max_hr
    FROM   public.plans
    WHERE  id = v_plan_id;

    IF v_max_hr IS NOT DISTINCT FROM -1 THEN
      RETURN NEW;
    END IF;

    PERFORM pg_advisory_xact_lock(
      hashtext(NEW.organization_id || '_hr_seats')
    );

    SELECT COUNT(*)
    INTO   v_current_count
    FROM   public.organization_members
    WHERE  organization_id = NEW.organization_id
      AND  role            = 'hr_manager'
      AND  status          = 'active'
      AND  id IS DISTINCT FROM NEW.id;

    IF v_current_count >= v_max_hr THEN
      RAISE EXCEPTION
        'HR Manager seat limit reached for your plan (max: %). '
        'Upgrade to Professional for unlimited HR managers.',
        v_max_hr
        USING ERRCODE = 'insufficient_privilege';
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_org_member_seat_limit ON public.organization_members;

CREATE TRIGGER enforce_org_member_seat_limit
  BEFORE INSERT OR UPDATE OF role
  ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.check_org_member_seat_limit();


-- ── Part B: subscription_changes audit table ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subscription_changes (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- No FK to companies — we never want cascade-delete to lose this log.
  organization_id       TEXT        NOT NULL,
  changed_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type            TEXT        NOT NULL
                        CHECK (event_type IN (
                          'upgraded',
                          'downgraded',
                          'canceled',
                          'renewed',
                          'trial_started',
                          'trial_expired',
                          'payment_failed',
                          'reactivated'
                        )),
  old_plan_id           TEXT REFERENCES public.plans(id),
  new_plan_id           TEXT REFERENCES public.plans(id),
  old_status            TEXT,
  new_status            TEXT,
  stripe_event_id       TEXT,
  stripe_invoice_id     TEXT,
  -- NULL = automated (Stripe webhook); populated for manual ops.
  initiated_by_user_id  TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.subscription_changes IS
  'Append-only audit log of every subscription lifecycle event. '
  'Written by service_role only (Stripe webhook, reconcile). '
  'No UPDATE or DELETE policies — rows are permanent for audit purposes.';

CREATE INDEX IF NOT EXISTS idx_subscription_changes_org
  ON public.subscription_changes (organization_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_changes_stripe_event
  ON public.subscription_changes (stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;


-- ── RLS ───────────────────────────────────────────────────────────────────────
-- Admins/owners of the org can read their own subscription history.
-- All writes go through service_role (Stripe webhook, reconcile endpoint).

ALTER TABLE public.subscription_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_changes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscription_changes_admin_read" ON public.subscription_changes;

CREATE POLICY "subscription_changes_admin_read" ON public.subscription_changes
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.org_id()
    AND (SELECT public.is_org_admin())
  );

-- No INSERT / UPDATE / DELETE client policies.
-- service_role bypasses RLS and writes directly.
