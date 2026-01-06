-- =====================================================
-- NORMALIZED, REVISION-SAFE DATA MODEL
-- =====================================================

-- =====================================================
-- 1. JOB FAMILIES: Logical grouping of job profiles
-- =====================================================

CREATE TABLE public.job_families (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- =====================================================
-- 2. JOB LEVELS: Standardized career levels
-- =====================================================

CREATE TABLE public.job_levels_normalized (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  min_experience_years INTEGER DEFAULT 0,
  max_experience_years INTEGER,
  sort_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, code),
  CONSTRAINT valid_experience_range CHECK (
    max_experience_years IS NULL OR max_experience_years >= min_experience_years
  )
);

-- =====================================================
-- 3. JOB PROFILES: Master record (immutable reference)
-- =====================================================

CREATE TABLE public.job_profiles_normalized (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_family_id UUID REFERENCES public.job_families(id),
  code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  current_version_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- =====================================================
-- 4. JOB PROFILE VERSIONS: Versioned profile data
-- =====================================================

CREATE TABLE public.job_profile_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_profile_id UUID NOT NULL REFERENCES public.job_profiles_normalized(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  responsibilities TEXT,
  required_qualifications TEXT,
  min_experience_years INTEGER DEFAULT 0,
  education_level TEXT CHECK (education_level IN ('none', 'apprenticeship', 'bachelor', 'master', 'doctorate')),
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  change_reason TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_profile_id, version_number),
  CONSTRAINT valid_version_period CHECK (valid_until IS NULL OR valid_until > valid_from)
);

ALTER TABLE public.job_profiles_normalized 
  ADD CONSTRAINT fk_current_version 
  FOREIGN KEY (current_version_id) 
  REFERENCES public.job_profile_versions(id);

-- =====================================================
-- 5. PAY BANDS: Master record linking profile & level
-- =====================================================

CREATE TABLE public.pay_bands_normalized (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_profile_id UUID NOT NULL REFERENCES public.job_profiles_normalized(id) ON DELETE CASCADE,
  job_level_id UUID NOT NULL REFERENCES public.job_levels_normalized(id) ON DELETE RESTRICT,
  is_active BOOLEAN DEFAULT true,
  current_version_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_profile_id, job_level_id)
);

-- =====================================================
-- 6. PAY BAND VERSIONS: Versioned salary ranges
-- =====================================================

CREATE TABLE public.pay_band_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pay_band_id UUID NOT NULL REFERENCES public.pay_bands_normalized(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  min_annual DECIMAL(12, 2) NOT NULL,
  max_annual DECIMAL(12, 2) NOT NULL,
  reference_point DECIMAL(12, 2),
  currency TEXT NOT NULL DEFAULT 'EUR',
  valid_from DATE NOT NULL,
  valid_until DATE,
  change_reason TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pay_band_id, version_number),
  CONSTRAINT valid_salary_range CHECK (max_annual >= min_annual),
  CONSTRAINT valid_reference_point CHECK (
    reference_point IS NULL OR 
    (reference_point >= min_annual AND reference_point <= max_annual)
  ),
  CONSTRAINT valid_band_period CHECK (valid_until IS NULL OR valid_until > valid_from)
);

ALTER TABLE public.pay_bands_normalized 
  ADD CONSTRAINT fk_pb_current_version 
  FOREIGN KEY (current_version_id) 
  REFERENCES public.pay_band_versions(id);

-- =====================================================
-- 7. SALARY COMPONENT TYPES: Standardized components
-- =====================================================

CREATE TABLE public.salary_component_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('base', 'bonus', 'benefit', 'allowance', 'equity', 'other')),
  is_monetary BOOLEAN DEFAULT true,
  is_recurring BOOLEAN DEFAULT true,
  is_taxable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- =====================================================
-- 8. SALARY COMPONENTS: Components within pay bands
-- =====================================================

CREATE TABLE public.salary_components_normalized (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pay_band_version_id UUID NOT NULL REFERENCES public.pay_band_versions(id) ON DELETE CASCADE,
  component_type_id UUID NOT NULL REFERENCES public.salary_component_types(id) ON DELETE RESTRICT,
  min_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
  max_value DECIMAL(12, 2),
  typical_value DECIMAL(12, 2),
  is_percentage BOOLEAN DEFAULT false,
  percentage_of TEXT CHECK (percentage_of IN ('base', 'total', 'target')),
  frequency TEXT DEFAULT 'annual' CHECK (frequency IN ('monthly', 'annual', 'one_time', 'per_occurrence')),
  conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pay_band_version_id, component_type_id),
  CONSTRAINT valid_component_range CHECK (max_value IS NULL OR max_value >= min_value),
  CONSTRAINT valid_typical_value CHECK (
    typical_value IS NULL OR 
    (typical_value >= min_value AND (max_value IS NULL OR typical_value <= max_value))
  )
);

-- =====================================================
-- 9. EMPLOYEE ASSIGNMENTS: Links employees to bands
-- =====================================================

CREATE TABLE public.employee_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  job_profile_version_id UUID NOT NULL REFERENCES public.job_profile_versions(id) ON DELETE RESTRICT,
  pay_band_version_id UUID NOT NULL REFERENCES public.pay_band_versions(id) ON DELETE RESTRICT,
  job_level_id UUID NOT NULL REFERENCES public.job_levels_normalized(id) ON DELETE RESTRICT,
  effective_from DATE NOT NULL,
  effective_until DATE,
  assignment_reason TEXT CHECK (assignment_reason IN ('hire', 'promotion', 'transfer', 'regrade', 'restructure', 'correction')),
  notes TEXT,
  assigned_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_assignment_period CHECK (effective_until IS NULL OR effective_until >= effective_from)
);

-- =====================================================
-- 10. HISTORY TRACKING: Immutable change log
-- =====================================================

CREATE TABLE public.data_change_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  version_number INTEGER,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'deactivate', 'reactivate')),
  old_data JSONB,
  new_data JSONB,
  change_reason TEXT,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  record_hash TEXT NOT NULL DEFAULT ''
);

-- =====================================================
-- FUNCTION: Prevent overlapping employee assignments
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_no_overlapping_assignments()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.employee_assignments ea
    WHERE ea.employee_id = NEW.employee_id
      AND ea.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
        (NEW.effective_from <= COALESCE(ea.effective_until, '9999-12-31'::date))
        AND (COALESCE(NEW.effective_until, '9999-12-31'::date) >= ea.effective_from)
      )
  ) THEN
    RAISE EXCEPTION 'Overlapping assignment exists for this employee';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_assignment_overlap
BEFORE INSERT OR UPDATE ON public.employee_assignments
FOR EACH ROW EXECUTE FUNCTION public.check_no_overlapping_assignments();

-- =====================================================
-- ENABLE RLS ON ALL NEW TABLES
-- =====================================================

ALTER TABLE public.job_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_levels_normalized ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_profiles_normalized ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_profile_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pay_bands_normalized ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pay_band_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_component_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_components_normalized ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_change_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Job Families
CREATE POLICY "View job families" ON public.job_families FOR SELECT TO authenticated
USING (verify_tenant_access(company_id) AND has_permission('job_profiles.view'));

CREATE POLICY "Manage job families" ON public.job_families FOR ALL TO authenticated
USING (verify_tenant_access(company_id) AND has_permission('job_profiles.create'))
WITH CHECK (verify_tenant_access(company_id) AND has_permission('job_profiles.create'));

-- Job Levels
CREATE POLICY "View job levels" ON public.job_levels_normalized FOR SELECT TO authenticated
USING (verify_tenant_access(company_id) AND has_permission('job_profiles.view'));

CREATE POLICY "Manage job levels" ON public.job_levels_normalized FOR ALL TO authenticated
USING (verify_tenant_access(company_id) AND has_permission('job_profiles.create'))
WITH CHECK (verify_tenant_access(company_id) AND has_permission('job_profiles.create'));

-- Job Profiles
CREATE POLICY "View job profiles norm" ON public.job_profiles_normalized FOR SELECT TO authenticated
USING (verify_tenant_access(company_id) AND has_permission('job_profiles.view'));

CREATE POLICY "Manage job profiles norm" ON public.job_profiles_normalized FOR ALL TO authenticated
USING (verify_tenant_access(company_id) AND has_permission('job_profiles.create'))
WITH CHECK (verify_tenant_access(company_id) AND has_permission('job_profiles.create'));

-- Job Profile Versions
CREATE POLICY "View job profile versions" ON public.job_profile_versions FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.job_profiles_normalized jp WHERE jp.id = job_profile_id AND verify_tenant_access(jp.company_id))
  AND has_permission('job_profiles.view')
);

CREATE POLICY "Create job profile versions" ON public.job_profile_versions FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.job_profiles_normalized jp WHERE jp.id = job_profile_id AND verify_tenant_access(jp.company_id))
  AND has_permission('job_profiles.update')
);

-- Pay Bands
CREATE POLICY "View pay bands norm" ON public.pay_bands_normalized FOR SELECT TO authenticated
USING (verify_tenant_access(company_id) AND has_permission('pay_bands.view'));

CREATE POLICY "Manage pay bands norm" ON public.pay_bands_normalized FOR ALL TO authenticated
USING (verify_tenant_access(company_id) AND has_permission('pay_bands.create'))
WITH CHECK (verify_tenant_access(company_id) AND has_permission('pay_bands.create'));

-- Pay Band Versions
CREATE POLICY "View pay band versions" ON public.pay_band_versions FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.pay_bands_normalized pb WHERE pb.id = pay_band_id AND verify_tenant_access(pb.company_id))
  AND has_permission('pay_bands.view')
);

CREATE POLICY "Create pay band versions" ON public.pay_band_versions FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.pay_bands_normalized pb WHERE pb.id = pay_band_id AND verify_tenant_access(pb.company_id))
  AND has_permission('pay_bands.update')
);

-- Salary Component Types
CREATE POLICY "View component types" ON public.salary_component_types FOR SELECT TO authenticated
USING (verify_tenant_access(company_id) AND has_permission('pay_bands.view'));

CREATE POLICY "Manage component types" ON public.salary_component_types FOR ALL TO authenticated
USING (verify_tenant_access(company_id) AND has_permission('pay_bands.create'))
WITH CHECK (verify_tenant_access(company_id) AND has_permission('pay_bands.create'));

-- Salary Components
CREATE POLICY "View salary components" ON public.salary_components_normalized FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pay_band_versions pbv
    JOIN public.pay_bands_normalized pb ON pb.id = pbv.pay_band_id
    WHERE pbv.id = pay_band_version_id AND verify_tenant_access(pb.company_id)
  ) AND has_permission('pay_bands.view')
);

CREATE POLICY "Manage salary components" ON public.salary_components_normalized FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pay_band_versions pbv
    JOIN public.pay_bands_normalized pb ON pb.id = pbv.pay_band_id
    WHERE pbv.id = pay_band_version_id AND verify_tenant_access(pb.company_id)
  ) AND has_permission('pay_bands.update')
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pay_band_versions pbv
    JOIN public.pay_bands_normalized pb ON pb.id = pbv.pay_band_id
    WHERE pbv.id = pay_band_version_id AND verify_tenant_access(pb.company_id)
  ) AND has_permission('pay_bands.update')
);

-- Employee Assignments
CREATE POLICY "View assignments" ON public.employee_assignments FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND verify_tenant_access(e.company_id))
  AND has_permission('employees.view')
);

CREATE POLICY "View own assignments" ON public.employee_assignments FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid())
  AND has_permission('employees.view_own')
);

CREATE POLICY "Manage assignments" ON public.employee_assignments FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND verify_tenant_access(e.company_id))
  AND has_permission('employees.update')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND verify_tenant_access(e.company_id))
  AND has_permission('employees.update')
);

-- Data Change History
CREATE POLICY "View history" ON public.data_change_history FOR SELECT TO authenticated
USING (verify_tenant_access(company_id) AND has_permission('audit.view'));

CREATE POLICY "Insert history" ON public.data_change_history FOR INSERT TO authenticated
WITH CHECK (verify_tenant_access(company_id));

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_job_families_company ON public.job_families(company_id);
CREATE INDEX idx_job_levels_company ON public.job_levels_normalized(company_id);
CREATE INDEX idx_job_profiles_norm_company ON public.job_profiles_normalized(company_id);
CREATE INDEX idx_job_profile_versions_profile ON public.job_profile_versions(job_profile_id);
CREATE INDEX idx_pay_bands_norm_company ON public.pay_bands_normalized(company_id);
CREATE INDEX idx_pay_band_versions_band ON public.pay_band_versions(pay_band_id);
CREATE INDEX idx_salary_components_version ON public.salary_components_normalized(pay_band_version_id);
CREATE INDEX idx_employee_assignments_employee ON public.employee_assignments(employee_id);
CREATE INDEX idx_data_change_history_entity ON public.data_change_history(entity_type, entity_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_job_families_updated_at
BEFORE UPDATE ON public.job_families FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_levels_norm_updated_at
BEFORE UPDATE ON public.job_levels_normalized FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salary_component_types_updated_at
BEFORE UPDATE ON public.salary_component_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();