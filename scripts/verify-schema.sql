-- ============================================================
-- Schema Verification Queries for Phase 1
-- KlarGehalt — EU Pay Transparency Compliance SaaS
--
-- Run against Supabase instance after applying:
--   supabase/migrations/20260319000000_canonical_schema.sql
--
-- All queries should return 0 rows (or 14 rows for the table existence check).
-- ============================================================


-- FOUN-01: Only timestamped migrations remain in the migrations root
-- (Check manually via: ls supabase/migrations/*.sql | grep -v "^[0-9]" | wc -l)
-- Expected: 0 non-timestamped files


-- FOUN-02: All tenant tables have organization_id NOT NULL
-- Expected: 0 rows (all tenant tables must have NOT NULL)
SELECT table_name, is_nullable
FROM information_schema.columns
WHERE column_name = 'organization_id'
  AND table_schema = 'public'
  AND is_nullable = 'YES';


-- FOUN-03: No USING(true) policies remain
-- Expected: 0 rows (all policies must check organization_id = public.org_id())
SELECT policyname, tablename, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual = 'true' OR with_check = 'true');


-- FOUN-04: user_roles has composite unique constraint
-- Expected: 1 row containing user_roles_user_org_unique
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_roles'
  AND indexdef LIKE '%user_id%organization_id%';


-- Verify all expected tables exist
-- Expected: 14 rows
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'organizations','companies','departments','job_levels',
    'job_profiles','pay_bands','employees','salary_history',
    'pay_gap_snapshots','compliance_reports','audit_logs',
    'user_roles','profiles','info_requests'
  )
ORDER BY table_name;


-- Verify RLS is enabled on all tenant tables
-- Expected: 0 rows (all tables must have RLS enabled)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'organizations','companies','departments','job_levels',
    'job_profiles','pay_bands','employees','salary_history',
    'pay_gap_snapshots','compliance_reports','audit_logs',
    'user_roles','profiles','info_requests'
  )
  AND rowsecurity = false;


-- Verify no auth.uid() in any policy
-- Expected: 0 rows (all policies must use auth.jwt() ->> 'sub' for user identity)
SELECT policyname, tablename, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%');


-- Verify employees table has role-based policies (not just org isolation)
-- Expected: employees_hr_select, employees_self_select, employees_hr_insert,
--           employees_hr_update, employees_hr_delete
SELECT policyname FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'employees'
ORDER BY policyname;


-- Verify audit_logs has no UPDATE or DELETE policies (immutable audit trail)
-- Expected: audit_insert (INSERT), audit_select_hr (SELECT) — no UPDATE or DELETE
SELECT policyname, cmd FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'audit_logs'
ORDER BY policyname;


-- Verify public.org_id() function exists and uses correct claim
-- Expected: 1 row with 'SELECT (auth.jwt() ->> ''org_id'')' in prosrc
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'org_id'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');


-- Verify user_roles_user_org_unique constraint
-- Expected: 1 row
SELECT conname, contype
FROM pg_constraint
WHERE conname = 'user_roles_user_org_unique'
  AND conrelid = 'public.user_roles'::regclass;
