-- ============================================================
-- MIGRATION: Fix RLS security gaps (Supabase security advisory 2026-04-19)
--
-- Issues addressed:
--   1. consultation_bookings — RLS never enabled in active migrations;
--      existing policies use auth.uid() which returns NULL under Logto.
--   2. pay_gap_snapshots — tenant_isolation FOR ALL coexists with
--      role-restricted policies from security_hardening, allowing any
--      org member to bypass role checks via the broader policy.
--   3. compliance_reports — compliance_reports_select has no role check,
--      exposing sensitive pay-gap data to employee-role users.
--   4. companies — any org member can UPDATE company metadata.
--   5. job_profiles / pay_bands — any org member can INSERT/UPDATE/DELETE.
-- ============================================================

DO $$
BEGIN

-- ─── 1. consultation_bookings ────────────────────────────────────────────────
-- Drop all legacy auth.uid()-based policies (dead under Logto JWT).
DROP POLICY IF EXISTS "Users can view their own bookings"     ON consultation_bookings;
DROP POLICY IF EXISTS "Users can create their own bookings"   ON consultation_bookings;
DROP POLICY IF EXISTS "Users can update their own bookings"   ON consultation_bookings;
DROP POLICY IF EXISTS "Consultants can view all bookings"     ON consultation_bookings;
DROP POLICY IF EXISTS "Consultants can update bookings"       ON consultation_bookings;

-- Enable RLS (idempotent — safe to run even if already enabled).
ALTER TABLE consultation_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_bookings FORCE ROW LEVEL SECURITY;

-- User can read/create/update their own booking (identified by Logto sub).
CREATE POLICY "consultation_bookings_select_own" ON consultation_bookings
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND user_id = (auth.jwt() ->> 'sub')
  );

CREATE POLICY "consultation_bookings_insert_own" ON consultation_bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.org_id()
    AND user_id = (auth.jwt() ->> 'sub')
  );

CREATE POLICY "consultation_bookings_update_own" ON consultation_bookings
  FOR UPDATE TO authenticated
  USING (
    organization_id = public.org_id()
    AND user_id = (auth.jwt() ->> 'sub')
  );

-- Admin can read and manage all bookings within their org.
CREATE POLICY "consultation_bookings_admin_all" ON consultation_bookings
  FOR ALL TO authenticated
  USING (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  )
  WITH CHECK (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );


-- ─── 2. pay_gap_snapshots ────────────────────────────────────────────────────
-- The canonical schema created a blanket tenant_isolation FOR ALL policy.
-- security_hardening added role-restricted SELECT and ALL policies on top.
-- With two overlapping policies PostgreSQL uses OR logic — the broader one
-- (tenant_isolation, no role check) wins, negating the role restriction.
-- Drop the broad policy so only the role-restricted ones from
-- security_hardening remain.
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pay_gap_snapshots') THEN
  DROP POLICY IF EXISTS "tenant_isolation" ON pay_gap_snapshots;
END IF;


-- ─── 3. compliance_reports ──────────────────────────────────────────────────
-- restrict_rls_policies created compliance_reports_select with no role check
-- (any authenticated org member can read compliance reports), plus a separate
-- compliance_reports_lawyer_select. Replace with a single role-gated policy.
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'compliance_reports') THEN
  DROP POLICY IF EXISTS "compliance_reports_select"         ON compliance_reports;
  DROP POLICY IF EXISTS "compliance_reports_lawyer_select"  ON compliance_reports;
  DROP POLICY IF EXISTS "tenant_isolation"                  ON compliance_reports;

  CREATE POLICY "compliance_reports_select" ON compliance_reports
    FOR SELECT TO authenticated
    USING (
      organization_id = public.org_id()
      AND (
        public.is_hr_or_admin()
        OR EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id        = (auth.jwt() ->> 'sub')
            AND user_roles.organization_id = public.org_id()
            AND user_roles.role            = 'lawyer'
        )
      )
    );
END IF;


-- ─── 4. companies ───────────────────────────────────────────────────────────
-- The canonical tenant_isolation FOR ALL lets any org member update company
-- metadata (name, legal_name, industry, etc.). Split into per-operation
-- policies so only admin can mutate.
DROP POLICY IF EXISTS "tenant_isolation" ON companies;

CREATE POLICY "companies_select" ON companies
  FOR SELECT TO authenticated
  USING (organization_id = public.org_id());

-- INSERT: needed during onboarding — at that point the user has no role yet,
-- so we allow any authenticated user whose org matches. The API layer enforces
-- that only one company per org is created (onboarding guard).
CREATE POLICY "companies_insert" ON companies
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.org_id());

-- UPDATE/DELETE: admin only.
CREATE POLICY "companies_update" ON companies
  FOR UPDATE TO authenticated
  USING  (organization_id = public.org_id() AND public.is_hr_or_admin())
  WITH CHECK (organization_id = public.org_id() AND public.is_hr_or_admin());

CREATE POLICY "companies_delete" ON companies
  FOR DELETE TO authenticated
  USING (organization_id = public.org_id() AND public.is_hr_or_admin());


-- ─── 5. job_profiles ────────────────────────────────────────────────────────
-- Canonical tenant_isolation FOR ALL lets any employee mutate job profiles.
-- Employees need SELECT (to see their own profile); writes are admin/HR only.
DROP POLICY IF EXISTS "tenant_isolation" ON job_profiles;

CREATE POLICY "job_profiles_select" ON job_profiles
  FOR SELECT TO authenticated
  USING (organization_id = public.org_id());

CREATE POLICY "job_profiles_insert" ON job_profiles
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.org_id() AND public.is_hr_or_admin());

CREATE POLICY "job_profiles_update" ON job_profiles
  FOR UPDATE TO authenticated
  USING  (organization_id = public.org_id() AND public.is_hr_or_admin())
  WITH CHECK (organization_id = public.org_id() AND public.is_hr_or_admin());

CREATE POLICY "job_profiles_delete" ON job_profiles
  FOR DELETE TO authenticated
  USING (organization_id = public.org_id() AND public.is_hr_or_admin());


-- ─── 6. pay_bands ───────────────────────────────────────────────────────────
-- Same situation as job_profiles.
DROP POLICY IF EXISTS "tenant_isolation" ON pay_bands;

CREATE POLICY "pay_bands_select" ON pay_bands
  FOR SELECT TO authenticated
  USING (organization_id = public.org_id());

CREATE POLICY "pay_bands_insert" ON pay_bands
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.org_id() AND public.is_hr_or_admin());

CREATE POLICY "pay_bands_update" ON pay_bands
  FOR UPDATE TO authenticated
  USING  (organization_id = public.org_id() AND public.is_hr_or_admin())
  WITH CHECK (organization_id = public.org_id() AND public.is_hr_or_admin());

CREATE POLICY "pay_bands_delete" ON pay_bands
  FOR DELETE TO authenticated
  USING (organization_id = public.org_id() AND public.is_hr_or_admin());

END $$;
