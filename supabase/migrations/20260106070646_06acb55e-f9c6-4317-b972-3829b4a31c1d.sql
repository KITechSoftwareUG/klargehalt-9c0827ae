-- =====================================================
-- FINE-GRAINED PERMISSION SYSTEM
-- =====================================================

-- PERMISSIONS TABLE: Defines all available permissions
CREATE TABLE public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert all permissions
INSERT INTO public.permissions (code, name, description, category) VALUES
-- User Management
('users.view', 'Benutzer anzeigen', 'Alle Benutzer der Firma einsehen', 'users'),
('users.create', 'Benutzer erstellen', 'Neue Benutzer anlegen und einladen', 'users'),
('users.update', 'Benutzer bearbeiten', 'Benutzerinformationen ändern', 'users'),
('users.delete', 'Benutzer löschen', 'Benutzer aus dem System entfernen', 'users'),
('users.manage_roles', 'Rollen verwalten', 'Benutzerrollen zuweisen und entziehen', 'users'),
-- Company Management
('company.view', 'Firma anzeigen', 'Firmeninformationen einsehen', 'company'),
('company.update', 'Firma bearbeiten', 'Firmeninformationen ändern', 'company'),
('company.settings', 'Einstellungen verwalten', 'Firmeneinstellungen konfigurieren', 'company'),
-- Job Profiles
('job_profiles.view', 'Job-Profile anzeigen', 'Alle Job-Profile einsehen', 'job_profiles'),
('job_profiles.create', 'Job-Profile erstellen', 'Neue Job-Profile anlegen', 'job_profiles'),
('job_profiles.update', 'Job-Profile bearbeiten', 'Job-Profile ändern', 'job_profiles'),
('job_profiles.delete', 'Job-Profile löschen', 'Job-Profile entfernen', 'job_profiles'),
-- Pay Bands
('pay_bands.view', 'Gehaltsbänder anzeigen', 'Alle Gehaltsbänder einsehen', 'pay_bands'),
('pay_bands.create', 'Gehaltsbänder erstellen', 'Neue Gehaltsbänder anlegen', 'pay_bands'),
('pay_bands.update', 'Gehaltsbänder bearbeiten', 'Gehaltsbänder ändern', 'pay_bands'),
('pay_bands.delete', 'Gehaltsbänder löschen', 'Gehaltsbänder entfernen', 'pay_bands'),
-- Employees
('employees.view', 'Mitarbeiter anzeigen', 'Alle Mitarbeiterdaten einsehen', 'employees'),
('employees.create', 'Mitarbeiter erstellen', 'Neue Mitarbeiter anlegen', 'employees'),
('employees.update', 'Mitarbeiter bearbeiten', 'Mitarbeiterdaten ändern', 'employees'),
('employees.delete', 'Mitarbeiter löschen', 'Mitarbeiter entfernen', 'employees'),
('employees.view_own', 'Eigene Daten anzeigen', 'Eigene Mitarbeiterdaten einsehen', 'employees'),
-- Salary Data (sensitive!)
('salaries.view', 'Gehälter anzeigen', 'Individuelle Gehaltsdaten einsehen', 'salaries'),
('salaries.create', 'Gehälter erfassen', 'Neue Gehaltsdaten anlegen', 'salaries'),
('salaries.update', 'Gehälter bearbeiten', 'Gehaltsdaten ändern', 'salaries'),
('salaries.view_aggregated', 'Aggregierte Gehälter', 'Nur anonymisierte Gehaltsdaten', 'salaries'),
-- Audit & Compliance
('audit.view', 'Audit-Logs anzeigen', 'Alle Änderungsprotokolle einsehen', 'audit'),
('audit.export', 'Audit-Logs exportieren', 'Protokolle als CSV/PDF exportieren', 'audit'),
-- Reports
('reports.view', 'Berichte anzeigen', 'Compliance-Berichte einsehen', 'reports'),
('reports.create', 'Berichte erstellen', 'Neue Berichte generieren', 'reports'),
('reports.export', 'Berichte exportieren', 'Berichte als PDF exportieren', 'reports'),
-- Info Requests (EU Compliance)
('requests.create', 'Anfrage stellen', 'Auskunftsanfrage erstellen', 'requests'),
('requests.view_own', 'Eigene Anfragen', 'Eigene Anfragen einsehen', 'requests'),
('requests.view_all', 'Alle Anfragen', 'Alle Anfragen der Firma einsehen', 'requests'),
('requests.process', 'Anfragen bearbeiten', 'Anfragen beantworten und abschließen', 'requests');

-- =====================================================
-- ROLE PERMISSIONS: Maps roles to permissions
-- =====================================================

CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role app_role NOT NULL,
  permission_code TEXT NOT NULL REFERENCES public.permissions(code) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, permission_code)
);

-- ADMIN: Full access
INSERT INTO public.role_permissions (role, permission_code)
SELECT 'admin'::app_role, code FROM public.permissions;

-- HR_MANAGER: Employee and salary management
INSERT INTO public.role_permissions (role, permission_code) VALUES
('hr_manager', 'users.view'),
('hr_manager', 'company.view'),
('hr_manager', 'job_profiles.view'),
('hr_manager', 'job_profiles.create'),
('hr_manager', 'job_profiles.update'),
('hr_manager', 'job_profiles.delete'),
('hr_manager', 'pay_bands.view'),
('hr_manager', 'pay_bands.create'),
('hr_manager', 'pay_bands.update'),
('hr_manager', 'pay_bands.delete'),
('hr_manager', 'employees.view'),
('hr_manager', 'employees.create'),
('hr_manager', 'employees.update'),
('hr_manager', 'employees.delete'),
('hr_manager', 'salaries.view'),
('hr_manager', 'salaries.create'),
('hr_manager', 'salaries.update'),
('hr_manager', 'requests.view_all'),
('hr_manager', 'requests.process'),
('hr_manager', 'reports.view');

-- LEGAL: Compliance and audit focus
INSERT INTO public.role_permissions (role, permission_code) VALUES
('legal', 'company.view'),
('legal', 'job_profiles.view'),
('legal', 'pay_bands.view'),
('legal', 'employees.view'),
('legal', 'salaries.view_aggregated'),
('legal', 'audit.view'),
('legal', 'audit.export'),
('legal', 'reports.view'),
('legal', 'reports.create'),
('legal', 'reports.export'),
('legal', 'requests.view_all');

-- EMPLOYEE: Own data only
INSERT INTO public.role_permissions (role, permission_code) VALUES
('employee', 'company.view'),
('employee', 'job_profiles.view'),
('employee', 'pay_bands.view'),
('employee', 'employees.view_own'),
('employee', 'salaries.view_aggregated'),
('employee', 'requests.create'),
('employee', 'requests.view_own');

-- AUDITOR: Read-only audit access
INSERT INTO public.role_permissions (role, permission_code) VALUES
('auditor', 'company.view'),
('auditor', 'job_profiles.view'),
('auditor', 'pay_bands.view'),
('auditor', 'employees.view'),
('auditor', 'salaries.view_aggregated'),
('auditor', 'audit.view'),
('auditor', 'audit.export'),
('auditor', 'reports.view'),
('auditor', 'reports.export');

-- =====================================================
-- AUDITOR ACCESS: Time-limited access tokens
-- =====================================================

CREATE TABLE public.auditor_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL,
  access_reason TEXT NOT NULL,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID,
  revoke_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_access_period CHECK (valid_until > valid_from)
);

-- =====================================================
-- PERMISSION CHECK FUNCTIONS (Server-side enforcement)
-- =====================================================

-- Check if user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_permission_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _user_role app_role;
  _has_perm BOOLEAN;
  _is_auditor_valid BOOLEAN;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user's role
  SELECT role INTO _user_role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
  
  IF _user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Special handling for auditors: check time-limited access
  IF _user_role = 'auditor' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.auditor_access
      WHERE user_id = _user_id
        AND is_revoked = false
        AND now() BETWEEN valid_from AND valid_until
        AND verify_tenant_access(company_id)
    ) INTO _is_auditor_valid;
    
    IF NOT _is_auditor_valid THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check role has permission
  SELECT EXISTS (
    SELECT 1
    FROM public.role_permissions
    WHERE role = _user_role
      AND permission_code = _permission_code
  ) INTO _has_perm;
  
  RETURN _has_perm;
END;
$$;

-- Check multiple permissions (OR logic)
CREATE OR REPLACE FUNCTION public.has_any_permission(_permission_codes TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code TEXT;
BEGIN
  FOREACH _code IN ARRAY _permission_codes
  LOOP
    IF has_permission(_code) THEN
      RETURN TRUE;
    END IF;
  END LOOP;
  RETURN FALSE;
END;
$$;

-- Check multiple permissions (AND logic)
CREATE OR REPLACE FUNCTION public.has_all_permissions(_permission_codes TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code TEXT;
BEGIN
  FOREACH _code IN ARRAY _permission_codes
  LOOP
    IF NOT has_permission(_code) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  RETURN TRUE;
END;
$$;

-- Get all permissions for current user
CREATE OR REPLACE FUNCTION public.get_user_permissions()
RETURNS TABLE(permission_code TEXT, permission_name TEXT, category TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_role app_role;
BEGIN
  SELECT role INTO _user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN QUERY
  SELECT p.code, p.name, p.category
  FROM public.permissions p
  INNER JOIN public.role_permissions rp ON rp.permission_code = p.code
  WHERE rp.role = _user_role
  ORDER BY p.category, p.code;
END;
$$;

-- =====================================================
-- RLS POLICIES FOR NEW TABLES
-- =====================================================

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditor_access ENABLE ROW LEVEL SECURITY;

-- Permissions: Read-only for authenticated users
CREATE POLICY "Authenticated users can view permissions"
ON public.permissions FOR SELECT TO authenticated
USING (true);

-- Role Permissions: Admins can manage, others can view
CREATE POLICY "Admins can manage role permissions"
ON public.role_permissions FOR ALL TO authenticated
USING (has_permission('users.manage_roles'))
WITH CHECK (has_permission('users.manage_roles'));

CREATE POLICY "Users can view role permissions"
ON public.role_permissions FOR SELECT TO authenticated
USING (true);

-- Auditor Access: Admins can manage
CREATE POLICY "Admins can manage auditor access"
ON public.auditor_access FOR ALL TO authenticated
USING (
  has_permission('users.manage_roles') AND
  verify_tenant_access(company_id)
)
WITH CHECK (
  has_permission('users.manage_roles') AND
  verify_tenant_access(company_id)
);

CREATE POLICY "Auditors can view their own access"
ON public.auditor_access FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- UPDATE EXISTING RLS TO USE PERMISSIONS
-- =====================================================

-- Drop old job_profiles policies
DROP POLICY IF EXISTS "Admins can manage job profiles" ON public.job_profiles;
DROP POLICY IF EXISTS "HR Managers can manage job profiles" ON public.job_profiles;
DROP POLICY IF EXISTS "Employees can view active job profiles" ON public.job_profiles;

CREATE POLICY "Users with permission can view job profiles"
ON public.job_profiles FOR SELECT TO authenticated
USING (
  verify_tenant_access(company_id) AND
  has_permission('job_profiles.view')
);

CREATE POLICY "Users with permission can create job profiles"
ON public.job_profiles FOR INSERT TO authenticated
WITH CHECK (
  verify_tenant_access(company_id) AND
  has_permission('job_profiles.create')
);

CREATE POLICY "Users with permission can update job profiles"
ON public.job_profiles FOR UPDATE TO authenticated
USING (
  verify_tenant_access(company_id) AND
  has_permission('job_profiles.update')
);

CREATE POLICY "Users with permission can delete job profiles"
ON public.job_profiles FOR DELETE TO authenticated
USING (
  verify_tenant_access(company_id) AND
  has_permission('job_profiles.delete')
);

-- Drop old employees policies
DROP POLICY IF EXISTS "Admins can manage employees" ON public.employees;
DROP POLICY IF EXISTS "HR Managers can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Employees can view their own record" ON public.employees;

CREATE POLICY "Users with permission can view all employees"
ON public.employees FOR SELECT TO authenticated
USING (
  verify_tenant_access(company_id) AND
  has_permission('employees.view')
);

CREATE POLICY "Users can view their own employee record"
ON public.employees FOR SELECT TO authenticated
USING (
  user_id = auth.uid() AND
  has_permission('employees.view_own')
);

CREATE POLICY "Users with permission can create employees"
ON public.employees FOR INSERT TO authenticated
WITH CHECK (
  verify_tenant_access(company_id) AND
  has_permission('employees.create')
);

CREATE POLICY "Users with permission can update employees"
ON public.employees FOR UPDATE TO authenticated
USING (
  verify_tenant_access(company_id) AND
  has_permission('employees.update')
);

CREATE POLICY "Users with permission can delete employees"
ON public.employees FOR DELETE TO authenticated
USING (
  verify_tenant_access(company_id) AND
  has_permission('employees.delete')
);

-- Update audit_logs policy
DROP POLICY IF EXISTS "Admins can view company audit logs" ON public.audit_logs;

CREATE POLICY "Users with permission can view audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (
  verify_tenant_access(company_id) AND
  has_permission('audit.view')
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX idx_role_permissions_code ON public.role_permissions(permission_code);
CREATE INDEX idx_auditor_access_user ON public.auditor_access(user_id);
CREATE INDEX idx_auditor_access_valid ON public.auditor_access(valid_from, valid_until) WHERE is_revoked = false;