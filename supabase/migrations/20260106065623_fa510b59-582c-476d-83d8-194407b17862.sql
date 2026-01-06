-- =====================================================
-- MULTI-TENANCY: Companies Table (Mandantenfähigkeit)
-- =====================================================
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  legal_name TEXT,
  tax_id TEXT,
  address TEXT,
  country TEXT DEFAULT 'DE',
  industry TEXT,
  employee_count_range TEXT CHECK (employee_count_range IN ('1-50', '51-100', '101-250', '251-500', '501-1000', '1000+')),
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add company_id to profiles for multi-tenancy
ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- =====================================================
-- AUDIT LOGS: Immutable, Compliance-Ready
-- =====================================================
CREATE TYPE public.audit_action AS ENUM (
  'create', 'update', 'delete', 'view', 'export', 'login', 'logout', 'request_info'
);

CREATE TYPE public.audit_entity AS ENUM (
  'job_profile', 'pay_band', 'salary_component', 'employee', 'salary_info', 
  'info_request', 'user', 'company', 'report'
);

CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action audit_action NOT NULL,
  entity_type audit_entity NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Hash for tamper detection
  record_hash TEXT NOT NULL DEFAULT ''
);

-- Immutable: No updates or deletes allowed
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- EMPLOYEES: Employee Data (separate from auth users)
-- =====================================================
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID, -- Optional link to auth user
  employee_number TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'diverse', 'not_specified')),
  birth_date DATE,
  hire_date DATE,
  job_profile_id UUID REFERENCES public.job_profiles(id),
  job_level job_level,
  department TEXT,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- SALARY INFO: Encrypted Salary Data
-- =====================================================
CREATE TABLE public.salary_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  base_salary_encrypted TEXT NOT NULL, -- Encrypted value
  total_compensation_encrypted TEXT, -- Encrypted value
  currency TEXT DEFAULT 'EUR',
  salary_components JSONB DEFAULT '[]', -- Encrypted component breakdown
  valid_until DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, effective_date)
);

-- =====================================================
-- INFO REQUESTS: Employee Information Requests (EU Compliance)
-- =====================================================
CREATE TYPE public.request_status AS ENUM ('pending', 'processing', 'completed', 'rejected');

CREATE TABLE public.info_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  requester_id UUID NOT NULL, -- The employee user requesting info
  employee_id UUID REFERENCES public.employees(id), -- The employee record
  request_type TEXT NOT NULL CHECK (request_type IN ('salary_comparison', 'pay_band_info', 'criteria_info')),
  status request_status DEFAULT 'pending',
  request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  response_date TIMESTAMP WITH TIME ZONE,
  response_data JSONB, -- Anonymized response data
  notes TEXT,
  processed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- UPDATE EXISTING TABLES: Add company_id for multi-tenancy
-- =====================================================
-- Update job_profiles to reference companies properly
ALTER TABLE public.job_profiles 
  DROP CONSTRAINT IF EXISTS job_profiles_company_id_fkey,
  ADD CONSTRAINT job_profiles_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Companies policies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own company"
ON public.companies FOR SELECT TO authenticated
USING (
  id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage their company"
ON public.companies FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin') AND 
  id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin') AND 
  id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Employees policies
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage employees"
ON public.employees FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin') AND 
  company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin') AND 
  company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "HR Managers can manage employees"
ON public.employees FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'hr_manager') AND 
  company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'hr_manager') AND 
  company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Employees can view their own record"
ON public.employees FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Salary Info policies (very restrictive)
ALTER TABLE public.salary_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only Admins and HR can manage salary info"
ON public.salary_info FOR ALL TO authenticated
USING (
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr_manager')) AND
  employee_id IN (
    SELECT id FROM public.employees 
    WHERE company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
  )
)
WITH CHECK (
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr_manager')) AND
  employee_id IN (
    SELECT id FROM public.employees 
    WHERE company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Info Requests policies
ALTER TABLE public.info_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
ON public.info_requests FOR SELECT TO authenticated
USING (requester_id = auth.uid());

CREATE POLICY "Users can create their own requests"
ON public.info_requests FOR INSERT TO authenticated
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Admins and HR can view all company requests"
ON public.info_requests FOR SELECT TO authenticated
USING (
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr_manager')) AND
  company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Admins and HR can update company requests"
ON public.info_requests FOR UPDATE TO authenticated
USING (
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr_manager')) AND
  company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Audit Logs policies (read-only for authorized users)
CREATE POLICY "Admins can view company audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin') AND
  company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (
  company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
);

-- =====================================================
-- FUNCTIONS: Audit Log Helper
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_audit_log(
  _company_id UUID,
  _action audit_action,
  _entity_type audit_entity,
  _entity_id UUID DEFAULT NULL,
  _entity_name TEXT DEFAULT NULL,
  _old_values JSONB DEFAULT NULL,
  _new_values JSONB DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _user_email TEXT;
  _user_role TEXT;
  _log_id UUID;
  _record_hash TEXT;
BEGIN
  -- Get current user info
  _user_id := auth.uid();
  
  SELECT email INTO _user_email FROM auth.users WHERE id = _user_id;
  SELECT role::TEXT INTO _user_role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
  
  -- Create hash for tamper detection
  _record_hash := encode(
    sha256(
      (_company_id::TEXT || _user_id::TEXT || _action::TEXT || _entity_type::TEXT || 
       COALESCE(_entity_id::TEXT, '') || now()::TEXT)::bytea
    ),
    'hex'
  );
  
  -- Insert audit log
  INSERT INTO public.audit_logs (
    company_id, user_id, user_email, user_role, action, entity_type,
    entity_id, entity_name, old_values, new_values, metadata, record_hash
  ) VALUES (
    _company_id, _user_id, _user_email, COALESCE(_user_role, 'unknown'), _action, _entity_type,
    _entity_id, _entity_name, _old_values, _new_values, _metadata, _record_hash
  ) RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- =====================================================
-- TRIGGERS: Automatic Audit Logging
-- =====================================================
CREATE OR REPLACE FUNCTION public.audit_job_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_audit_log(
      NEW.company_id, 'create'::audit_action, 'job_profile'::audit_entity,
      NEW.id, NEW.title, NULL, to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM create_audit_log(
      NEW.company_id, 'update'::audit_action, 'job_profile'::audit_entity,
      NEW.id, NEW.title, to_jsonb(OLD), to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_audit_log(
      OLD.company_id, 'delete'::audit_action, 'job_profile'::audit_entity,
      OLD.id, OLD.title, to_jsonb(OLD), NULL
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER audit_job_profiles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.job_profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_job_profiles();

CREATE OR REPLACE FUNCTION public.audit_pay_bands()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT company_id INTO _company_id FROM public.job_profiles WHERE id = OLD.job_profile_id;
    PERFORM create_audit_log(
      _company_id, 'delete'::audit_action, 'pay_band'::audit_entity,
      OLD.id, OLD.job_level::TEXT, to_jsonb(OLD), NULL
    );
    RETURN OLD;
  ELSE
    SELECT company_id INTO _company_id FROM public.job_profiles WHERE id = NEW.job_profile_id;
    IF TG_OP = 'INSERT' THEN
      PERFORM create_audit_log(
        _company_id, 'create'::audit_action, 'pay_band'::audit_entity,
        NEW.id, NEW.job_level::TEXT, NULL, to_jsonb(NEW)
      );
    ELSIF TG_OP = 'UPDATE' THEN
      PERFORM create_audit_log(
        _company_id, 'update'::audit_action, 'pay_band'::audit_entity,
        NEW.id, NEW.job_level::TEXT, to_jsonb(OLD), to_jsonb(NEW)
      );
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER audit_pay_bands_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.pay_bands
FOR EACH ROW EXECUTE FUNCTION public.audit_pay_bands();

-- =====================================================
-- INDEXES for Performance
-- =====================================================
CREATE INDEX idx_profiles_company ON public.profiles(company_id);
CREATE INDEX idx_employees_company ON public.employees(company_id);
CREATE INDEX idx_employees_user ON public.employees(user_id);
CREATE INDEX idx_salary_info_employee ON public.salary_info(employee_id);
CREATE INDEX idx_info_requests_company ON public.info_requests(company_id);
CREATE INDEX idx_info_requests_requester ON public.info_requests(requester_id);
CREATE INDEX idx_audit_logs_company ON public.audit_logs(company_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salary_info_updated_at
BEFORE UPDATE ON public.salary_info
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_info_requests_updated_at
BEFORE UPDATE ON public.info_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();