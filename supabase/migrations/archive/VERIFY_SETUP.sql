-- ============================================================================
-- KlarGehalt - Database Verification Script
-- ============================================================================
-- Run this after COMPLETE_SETUP.sql to verify everything is working
-- ============================================================================

-- Check 1: Verify all tables exist
SELECT 
  'Tables Check' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 10 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected 10 tables'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- Check 2: Verify RLS is enabled on all tables
SELECT 
  'RLS Check' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 10 THEN '✅ PASS'
    ELSE '❌ FAIL - RLS not enabled on all tables'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;

-- Check 3: Count policies
SELECT 
  'Policies Check' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 25 THEN '✅ PASS'
    ELSE '⚠️ WARNING - Expected at least 25 policies'
  END as status
FROM pg_policies
WHERE schemaname = 'public';

-- Check 4: Count indexes
SELECT 
  'Indexes Check' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 30 THEN '✅ PASS'
    ELSE '⚠️ WARNING - Expected at least 30 indexes'
  END as status
FROM pg_indexes
WHERE schemaname = 'public';

-- Check 5: Verify triggers
SELECT 
  'Triggers Check' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 9 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected at least 9 triggers'
  END as status
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Check 6: Verify extensions
SELECT 
  'Extensions Check' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ PASS'
    ELSE '❌ FAIL - Missing extensions'
  END as status
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- ============================================================================
-- Detailed Table Information
-- ============================================================================

SELECT 
  t.table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.table_name) as indexes,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.table_name) as policies,
  pt.rowsecurity as rls_enabled
FROM information_schema.tables t
JOIN pg_tables pt ON t.table_name = pt.tablename
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- ============================================================================
-- Test Data Insertion (Optional - for testing)
-- ============================================================================

-- Uncomment to test if you can insert data
-- This will fail if RLS policies are not correct

/*
-- Test: Create a test user profile (requires actual auth.users entry)
-- INSERT INTO profiles (user_id, email, full_name)
-- VALUES (
--   gen_random_uuid(),
--   'test@example.com',
--   'Test User'
-- );

-- Test: Create a test company
-- INSERT INTO companies (name, country, created_by)
-- VALUES (
--   'Test Company GmbH',
--   'DE',
--   (SELECT user_id FROM profiles LIMIT 1)
-- );
*/

-- ============================================================================
-- Summary
-- ============================================================================

SELECT 
  '🎉 Database Setup Verification Complete!' as message,
  NOW() as checked_at;
