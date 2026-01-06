-- Create job_levels enum for standardized levels
CREATE TYPE public.job_level AS ENUM ('junior', 'mid', 'senior', 'lead', 'principal', 'director');

-- Create employment_type enum
CREATE TYPE public.employment_type AS ENUM ('full_time', 'part_time', 'contract', 'intern');

-- Job Profiles table
CREATE TABLE public.job_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  responsibilities TEXT,
  required_qualifications TEXT,
  min_experience_years INTEGER DEFAULT 0,
  department TEXT,
  employment_type employment_type DEFAULT 'full_time',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pay Bands table (Gehaltsbänder)
CREATE TABLE public.pay_bands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_profile_id UUID NOT NULL REFERENCES public.job_profiles(id) ON DELETE CASCADE,
  job_level job_level NOT NULL,
  min_salary DECIMAL(12, 2) NOT NULL,
  max_salary DECIMAL(12, 2) NOT NULL,
  median_salary DECIMAL(12, 2),
  currency TEXT DEFAULT 'EUR',
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_salary_range CHECK (min_salary <= max_salary)
);

-- Salary Components table (Gehaltsbestandteile)
CREATE TABLE public.salary_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pay_band_id UUID NOT NULL REFERENCES public.pay_bands(id) ON DELETE CASCADE,
  component_name TEXT NOT NULL,
  component_type TEXT NOT NULL CHECK (component_type IN ('base', 'bonus', 'benefit', 'allowance', 'other')),
  min_value DECIMAL(12, 2) DEFAULT 0,
  max_value DECIMAL(12, 2),
  is_percentage BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.job_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pay_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_components ENABLE ROW LEVEL SECURITY;

-- Job Profiles Policies
CREATE POLICY "Admins can manage job profiles"
ON public.job_profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "HR Managers can manage job profiles"
ON public.job_profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'hr_manager'))
WITH CHECK (has_role(auth.uid(), 'hr_manager'));

CREATE POLICY "Employees can view active job profiles"
ON public.job_profiles
FOR SELECT
TO authenticated
USING (is_active = true AND has_role(auth.uid(), 'employee'));

-- Pay Bands Policies
CREATE POLICY "Admins can manage pay bands"
ON public.pay_bands
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "HR Managers can manage pay bands"
ON public.pay_bands
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'hr_manager'))
WITH CHECK (has_role(auth.uid(), 'hr_manager'));

CREATE POLICY "Employees can view current pay bands"
ON public.pay_bands
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'employee') 
  AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
);

-- Salary Components Policies
CREATE POLICY "Admins can manage salary components"
ON public.salary_components
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "HR Managers can manage salary components"
ON public.salary_components
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'hr_manager'))
WITH CHECK (has_role(auth.uid(), 'hr_manager'));

CREATE POLICY "Employees can view salary components"
ON public.salary_components
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'employee'));

-- Triggers for updated_at
CREATE TRIGGER update_job_profiles_updated_at
BEFORE UPDATE ON public.job_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pay_bands_updated_at
BEFORE UPDATE ON public.pay_bands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salary_components_updated_at
BEFORE UPDATE ON public.salary_components
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_job_profiles_company ON public.job_profiles(company_id);
CREATE INDEX idx_job_profiles_active ON public.job_profiles(is_active);
CREATE INDEX idx_pay_bands_job_profile ON public.pay_bands(job_profile_id);
CREATE INDEX idx_pay_bands_level ON public.pay_bands(job_level);
CREATE INDEX idx_salary_components_pay_band ON public.salary_components(pay_band_id);