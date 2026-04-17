-- ============================================================
-- MIGRATION: Restrict overly-permissive RLS policies
--
-- Several tables had FOR ALL tenant_isolation policies that
-- allowed any authenticated org member (including employees)
-- to INSERT, UPDATE, and DELETE records. This migration splits
-- each into granular per-operation policies:
--   - SELECT: all org members
--   - INSERT/UPDATE/DELETE: admin and hr_manager only
--
-- Affected tables:
--   1. job_postings
--   2. joint_assessments
--   3. joint_assessment_justifications
--   4. rights_notifications
--   5. compliance_reports (+ lawyer SELECT)
-- ============================================================


-- ─── 1. job_postings ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "tenant_isolation" ON job_postings;

CREATE POLICY "job_postings_select" ON job_postings
  FOR SELECT TO authenticated
  USING (organization_id = public.org_id());

CREATE POLICY "job_postings_insert" ON job_postings
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );

CREATE POLICY "job_postings_update" ON job_postings
  FOR UPDATE TO authenticated
  USING (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );

CREATE POLICY "job_postings_delete" ON job_postings
  FOR DELETE TO authenticated
  USING (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );


-- ─── 2. joint_assessments ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "tenant_isolation" ON joint_assessments;

CREATE POLICY "joint_assessments_select" ON joint_assessments
  FOR SELECT TO authenticated
  USING (organization_id = public.org_id());

CREATE POLICY "joint_assessments_insert" ON joint_assessments
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );

CREATE POLICY "joint_assessments_update" ON joint_assessments
  FOR UPDATE TO authenticated
  USING (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );

CREATE POLICY "joint_assessments_delete" ON joint_assessments
  FOR DELETE TO authenticated
  USING (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );


-- ─── 3. joint_assessment_justifications ─────────────────────────────────────

DROP POLICY IF EXISTS "tenant_isolation" ON joint_assessment_justifications;

CREATE POLICY "joint_assessment_justifications_select" ON joint_assessment_justifications
  FOR SELECT TO authenticated
  USING (organization_id = public.org_id());

CREATE POLICY "joint_assessment_justifications_insert" ON joint_assessment_justifications
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );

CREATE POLICY "joint_assessment_justifications_update" ON joint_assessment_justifications
  FOR UPDATE TO authenticated
  USING (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );

CREATE POLICY "joint_assessment_justifications_delete" ON joint_assessment_justifications
  FOR DELETE TO authenticated
  USING (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );


-- ─── 4. rights_notifications ────────────────────────────────────────────────

DROP POLICY IF EXISTS "tenant_isolation" ON rights_notifications;

CREATE POLICY "rights_notifications_select" ON rights_notifications
  FOR SELECT TO authenticated
  USING (organization_id = public.org_id());

CREATE POLICY "rights_notifications_insert" ON rights_notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );

CREATE POLICY "rights_notifications_update" ON rights_notifications
  FOR UPDATE TO authenticated
  USING (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );

CREATE POLICY "rights_notifications_delete" ON rights_notifications
  FOR DELETE TO authenticated
  USING (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );


-- ─── 5. compliance_reports ──────────────────────────────────────────────────
-- Additionally grants lawyers SELECT access via a separate policy.

DROP POLICY IF EXISTS "tenant_isolation" ON compliance_reports;

-- HR/admin can read all reports in their org
CREATE POLICY "compliance_reports_select" ON compliance_reports
  FOR SELECT TO authenticated
  USING (organization_id = public.org_id());

-- Lawyers get a dedicated SELECT policy (additive with the above)
CREATE POLICY "compliance_reports_lawyer_select" ON compliance_reports
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (auth.jwt() ->> 'sub')
        AND user_roles.organization_id = public.org_id()
        AND user_roles.role = 'lawyer'
    )
  );

CREATE POLICY "compliance_reports_insert" ON compliance_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );

CREATE POLICY "compliance_reports_update" ON compliance_reports
  FOR UPDATE TO authenticated
  USING (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );

CREATE POLICY "compliance_reports_delete" ON compliance_reports
  FOR DELETE TO authenticated
  USING (
    organization_id = public.org_id()
    AND public.is_hr_or_admin()
  );
