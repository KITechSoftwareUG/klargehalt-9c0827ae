-- =====================================================
-- SECURITY ENHANCEMENT: Tenant Isolation Functions
-- =====================================================

-- Function to get current user's company_id (cached per transaction)
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id 
  FROM public.profiles 
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- Function to check if user belongs to a specific company
CREATE OR REPLACE FUNCTION public.user_belongs_to_company(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
      AND company_id = _company_id
  )
$$;

-- Function to verify tenant access (prevents cross-tenant access)
CREATE OR REPLACE FUNCTION public.verify_tenant_access(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_company_id UUID;
BEGIN
  -- Get user's company
  SELECT company_id INTO _user_company_id
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  -- Strict check: user must have a company and it must match
  IF _user_company_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN _user_company_id = _company_id;
END;
$$;

-- =====================================================
-- SECURITY ENHANCEMENT: Session & Login Tracking
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id),
  session_token TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  is_active BOOLEAN DEFAULT true,
  logout_reason TEXT
);

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- SECURITY ENHANCEMENT: 2FA Preparation
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_mfa_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_method TEXT CHECK (mfa_method IN ('totp', 'sms', 'email')),
  totp_secret_encrypted TEXT, -- Encrypted TOTP secret
  backup_codes_encrypted TEXT, -- Encrypted backup codes
  phone_number_encrypted TEXT, -- For SMS 2FA
  last_verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- SECURITY ENHANCEMENT: SSO Preparation
-- =====================================================

CREATE TABLE IF NOT EXISTS public.sso_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  provider TEXT NOT NULL CHECK (provider IN ('saml', 'oidc')),
  is_enabled BOOLEAN DEFAULT false,
  metadata_url TEXT,
  entity_id TEXT,
  sso_url TEXT,
  certificate_encrypted TEXT,
  attribute_mapping JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- ENHANCED RLS POLICIES: Strict Tenant Isolation
-- =====================================================

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_configurations ENABLE ROW LEVEL SECURITY;

-- User Sessions: Only own sessions
CREATE POLICY "Users can view their own sessions"
ON public.user_sessions FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can manage sessions"
ON public.user_sessions FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Login Attempts: Admin only within company
CREATE POLICY "Admins can view company login attempts"
ON public.login_attempts FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin') AND
  email IN (
    SELECT p.email FROM public.profiles p 
    WHERE p.company_id = get_user_company_id()
  )
);

-- MFA Settings: Only own settings
CREATE POLICY "Users can manage their own MFA"
ON public.user_mfa_settings FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- SSO Config: Admin only within company
CREATE POLICY "Admins can manage company SSO"
ON public.sso_configurations FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin') AND
  verify_tenant_access(company_id)
)
WITH CHECK (
  has_role(auth.uid(), 'admin') AND
  verify_tenant_access(company_id)
);

-- =====================================================
-- STRENGTHEN EXISTING POLICIES: Add verify_tenant_access
-- =====================================================

-- Drop and recreate job_profiles policies with strict tenant check
DROP POLICY IF EXISTS "Admins can manage job profiles" ON public.job_profiles;
DROP POLICY IF EXISTS "HR Managers can manage job profiles" ON public.job_profiles;
DROP POLICY IF EXISTS "Employees can view active job profiles" ON public.job_profiles;

CREATE POLICY "Admins can manage job profiles"
ON public.job_profiles FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin') AND 
  verify_tenant_access(company_id)
)
WITH CHECK (
  has_role(auth.uid(), 'admin') AND 
  verify_tenant_access(company_id)
);

CREATE POLICY "HR Managers can manage job profiles"
ON public.job_profiles FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'hr_manager') AND 
  verify_tenant_access(company_id)
)
WITH CHECK (
  has_role(auth.uid(), 'hr_manager') AND 
  verify_tenant_access(company_id)
);

CREATE POLICY "Employees can view active job profiles"
ON public.job_profiles FOR SELECT TO authenticated
USING (
  is_active = true AND 
  verify_tenant_access(company_id)
);

-- Drop and recreate employees policies
DROP POLICY IF EXISTS "Admins can manage employees" ON public.employees;
DROP POLICY IF EXISTS "HR Managers can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Employees can view their own record" ON public.employees;

CREATE POLICY "Admins can manage employees"
ON public.employees FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin') AND 
  verify_tenant_access(company_id)
)
WITH CHECK (
  has_role(auth.uid(), 'admin') AND 
  verify_tenant_access(company_id)
);

CREATE POLICY "HR Managers can manage employees"
ON public.employees FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'hr_manager') AND 
  verify_tenant_access(company_id)
)
WITH CHECK (
  has_role(auth.uid(), 'hr_manager') AND 
  verify_tenant_access(company_id)
);

CREATE POLICY "Employees can view their own record"
ON public.employees FOR SELECT TO authenticated
USING (
  user_id = auth.uid() AND
  verify_tenant_access(company_id)
);

-- =====================================================
-- SECURITY: Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON public.login_attempts(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company_id);

-- Trigger for MFA updated_at
CREATE TRIGGER update_user_mfa_settings_updated_at
BEFORE UPDATE ON public.user_mfa_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sso_configurations_updated_at
BEFORE UPDATE ON public.sso_configurations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- SECURITY: Audit Login Events
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_login_attempt(
  _email TEXT,
  _success BOOLEAN,
  _failure_reason TEXT DEFAULT NULL,
  _ip_address INET DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
BEGIN
  INSERT INTO public.login_attempts (email, ip_address, user_agent, success, failure_reason)
  VALUES (_email, _ip_address, _user_agent, _success, _failure_reason)
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- =====================================================
-- SECURITY: Session Validation Function
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_session()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _company_id UUID;
  _is_active BOOLEAN;
BEGIN
  _user_id := auth.uid();
  
  -- Check user exists
  IF _user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check user has a profile with a company
  SELECT company_id INTO _company_id
  FROM public.profiles
  WHERE user_id = _user_id;
  
  -- For employees: require company assignment
  -- For admin/hr_manager: allow during setup
  IF _company_id IS NULL THEN
    -- Check role - if employee, must have company
    IF has_role(_user_id, 'employee') THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$;