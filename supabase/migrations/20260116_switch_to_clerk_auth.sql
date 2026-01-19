-- ============================================================================
-- Migration: Switch from Supabase Auth to Clerk (Text IDs) - ROBUST VERSION
-- ============================================================================
-- This script uses a dynamic block to FORCE DROP all policies on affected tables first.
-- This ensures that "cannot alter type... used in a policy" errors are resolved,
-- regardless of what the policies are named.

-- 1. FORCE DROP ALL POLICIES
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    -- Iterate through all policies on our tables and drop them
    FOR r IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE tablename IN (
            'profiles', 
            'companies', 
            'user_roles', 
            'job_profiles', 
            'pay_bands', 
            'employees', 
            'info_requests', 
            'audit_logs', 
            'onboarding_data', 
            'consultation_bookings'
        )
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || quote_ident(r.tablename); 
    END LOOP;
END $$;

-- 2. DROP FOREIGN KEY REFERENCES TO auth.users
-- We are decoupling from Supabase Auth, so we must remove these constraints.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_created_by_fkey;
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_user_id_fkey;
ALTER TABLE info_requests DROP CONSTRAINT IF EXISTS info_requests_processed_by_fkey;
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE onboarding_data DROP CONSTRAINT IF EXISTS onboarding_data_user_id_fkey;
ALTER TABLE consultation_bookings DROP CONSTRAINT IF EXISTS consultation_bookings_user_id_fkey;
ALTER TABLE consultation_bookings DROP CONSTRAINT IF EXISTS consultation_bookings_consultant_id_fkey;

-- 3. ALTER COLUMNS TO TEXT
-- Now that policies and FKs are gone, we can safely change types.
ALTER TABLE profiles ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE companies ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE user_roles ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE employees ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE info_requests ALTER COLUMN processed_by TYPE TEXT;
ALTER TABLE audit_logs ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE onboarding_data ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE consultation_bookings ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE consultation_bookings ALTER COLUMN consultant_id TYPE TEXT;

-- 4. RECREATE RLS POLICIES (Compatible with Text IDs)
-- We cast auth.uid()::text to ensure it matches the new TEXT columns.

-- Profiles
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- User Roles
CREATE POLICY "Users can view their own roles" ON user_roles FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert their own roles" ON user_roles FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Admins can manage roles in their company" ON user_roles FOR ALL USING (
  company_id IN (
    SELECT company_id FROM user_roles 
    WHERE user_id = auth.uid()::text AND role = 'admin'
  )
);

-- Companies
CREATE POLICY "Users can view their own company" ON companies FOR SELECT USING (
  id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()::text)
  OR created_by = auth.uid()::text
);
CREATE POLICY "Authenticated users can create companies" ON companies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own company" ON companies FOR UPDATE USING (
  id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()::text)
  OR created_by = auth.uid()::text
);

-- Job Profiles
CREATE POLICY "Users can view job profiles in their company" ON job_profiles FOR SELECT USING (
  company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()::text)
);
CREATE POLICY "Admins and HR can manage job profiles" ON job_profiles FOR ALL USING (
  company_id IN (
    SELECT company_id FROM user_roles 
    WHERE user_id = auth.uid()::text AND role IN ('admin', 'hr_manager')
  )
);

-- Pay Bands
CREATE POLICY "Users can view pay bands in their company" ON pay_bands FOR SELECT USING (
  company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()::text)
);
CREATE POLICY "Admins and HR can manage pay bands" ON pay_bands FOR ALL USING (
  company_id IN (
    SELECT company_id FROM user_roles 
    WHERE user_id = auth.uid()::text AND role IN ('admin', 'hr_manager')
  )
);

-- Employees
CREATE POLICY "Users can view employees in their company" ON employees FOR SELECT USING (
  company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()::text)
  OR user_id = auth.uid()::text
);
CREATE POLICY "Admins and HR can manage employees" ON employees FOR ALL USING (
  company_id IN (
    SELECT company_id FROM user_roles 
    WHERE user_id = auth.uid()::text AND role IN ('admin', 'hr_manager')
  )
);

-- Info Requests
CREATE POLICY "Employees can view their own requests" ON info_requests FOR SELECT USING (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()::text)
);
CREATE POLICY "Employees can create requests" ON info_requests FOR INSERT WITH CHECK (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()::text)
);
CREATE POLICY "Admins and HR can manage all requests" ON info_requests FOR ALL USING (
  company_id IN (
    SELECT company_id FROM user_roles 
    WHERE user_id = auth.uid()::text AND role IN ('admin', 'hr_manager')
  )
);

-- Audit Logs
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM user_roles 
    WHERE user_id = auth.uid()::text AND role = 'admin'
  )
);

-- Onboarding Data
CREATE POLICY "Users can view their own onboarding data" ON onboarding_data FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert their own onboarding data" ON onboarding_data FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own onboarding data" ON onboarding_data FOR UPDATE USING (auth.uid()::text = user_id);

-- Consultation Bookings
CREATE POLICY "Users can view their own bookings" ON consultation_bookings FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can create their own bookings" ON consultation_bookings FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own bookings" ON consultation_bookings FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Consultants can view all bookings" ON consultation_bookings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()::text AND role IN ('admin', 'consultant')
  )
);
CREATE POLICY "Consultants can update bookings" ON consultation_bookings FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()::text AND role IN ('admin', 'consultant')
  )
);

-- 5. CLEANUP
-- Drop the trigger that auto-created profiles from auth.users (if it still exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
