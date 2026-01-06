-- Fix search_path for the overlap check function
CREATE OR REPLACE FUNCTION public.check_no_overlapping_assignments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- =====================================================
-- FUNCTION: Auto-increment version number
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_next_job_profile_version(_job_profile_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(version_number), 0) + 1
  FROM public.job_profile_versions
  WHERE job_profile_id = _job_profile_id
$$;

CREATE OR REPLACE FUNCTION public.get_next_pay_band_version(_pay_band_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(version_number), 0) + 1
  FROM public.pay_band_versions
  WHERE pay_band_id = _pay_band_id
$$;

-- =====================================================
-- FUNCTION: Create new version and close old one
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_job_profile_version(
  _job_profile_id UUID,
  _title TEXT,
  _description TEXT,
  _responsibilities TEXT,
  _required_qualifications TEXT,
  _min_experience_years INTEGER,
  _education_level TEXT,
  _change_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_version_id UUID;
  _version_number INTEGER;
BEGIN
  -- Get next version number
  _version_number := get_next_job_profile_version(_job_profile_id);
  
  -- Close current version
  UPDATE public.job_profile_versions
  SET valid_until = now()
  WHERE job_profile_id = _job_profile_id
    AND valid_until IS NULL;
  
  -- Create new version
  INSERT INTO public.job_profile_versions (
    job_profile_id, version_number, title, description,
    responsibilities, required_qualifications, min_experience_years,
    education_level, change_reason, created_by
  ) VALUES (
    _job_profile_id, _version_number, _title, _description,
    _responsibilities, _required_qualifications, _min_experience_years,
    _education_level, _change_reason, auth.uid()
  ) RETURNING id INTO _new_version_id;
  
  -- Update current version pointer
  UPDATE public.job_profiles_normalized
  SET current_version_id = _new_version_id
  WHERE id = _job_profile_id;
  
  RETURN _new_version_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_pay_band_version(
  _pay_band_id UUID,
  _min_annual DECIMAL,
  _max_annual DECIMAL,
  _reference_point DECIMAL,
  _valid_from DATE,
  _change_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_version_id UUID;
  _version_number INTEGER;
BEGIN
  -- Get next version number
  _version_number := get_next_pay_band_version(_pay_band_id);
  
  -- Close current version
  UPDATE public.pay_band_versions
  SET valid_until = _valid_from - INTERVAL '1 day'
  WHERE pay_band_id = _pay_band_id
    AND valid_until IS NULL;
  
  -- Create new version
  INSERT INTO public.pay_band_versions (
    pay_band_id, version_number, min_annual, max_annual,
    reference_point, valid_from, change_reason, created_by
  ) VALUES (
    _pay_band_id, _version_number, _min_annual, _max_annual,
    _reference_point, _valid_from, _change_reason, auth.uid()
  ) RETURNING id INTO _new_version_id;
  
  -- Update current version pointer
  UPDATE public.pay_bands_normalized
  SET current_version_id = _new_version_id
  WHERE id = _pay_band_id;
  
  RETURN _new_version_id;
END;
$$;

-- =====================================================
-- FUNCTION: Get current valid pay band for employee
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_employee_current_pay_band(_employee_id UUID)
RETURNS TABLE(
  job_profile_title TEXT,
  job_level_name TEXT,
  min_annual DECIMAL,
  max_annual DECIMAL,
  reference_point DECIMAL,
  currency TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    jpv.title AS job_profile_title,
    jl.name AS job_level_name,
    pbv.min_annual,
    pbv.max_annual,
    pbv.reference_point,
    pbv.currency
  FROM public.employee_assignments ea
  JOIN public.job_profile_versions jpv ON jpv.id = ea.job_profile_version_id
  JOIN public.job_levels_normalized jl ON jl.id = ea.job_level_id
  JOIN public.pay_band_versions pbv ON pbv.id = ea.pay_band_version_id
  WHERE ea.employee_id = _employee_id
    AND ea.effective_from <= CURRENT_DATE
    AND (ea.effective_until IS NULL OR ea.effective_until >= CURRENT_DATE)
  LIMIT 1
$$;

-- =====================================================
-- FUNCTION: Calculate anonymized statistics for a pay band
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_pay_band_statistics(_pay_band_id UUID)
RETURNS TABLE(
  employee_count BIGINT,
  gender_ratio JSONB,
  median_in_band DECIMAL
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH current_assignments AS (
    SELECT 
      ea.employee_id,
      e.gender
    FROM public.employee_assignments ea
    JOIN public.employees e ON e.id = ea.employee_id
    JOIN public.pay_band_versions pbv ON pbv.id = ea.pay_band_version_id
    WHERE pbv.pay_band_id = _pay_band_id
      AND ea.effective_from <= CURRENT_DATE
      AND (ea.effective_until IS NULL OR ea.effective_until >= CURRENT_DATE)
  )
  SELECT 
    COUNT(*) AS employee_count,
    jsonb_object_agg(
      COALESCE(gender, 'not_specified'), 
      gender_count
    ) AS gender_ratio,
    (SELECT reference_point FROM public.pay_band_versions 
     WHERE pay_band_id = _pay_band_id AND valid_until IS NULL LIMIT 1) AS median_in_band
  FROM (
    SELECT gender, COUNT(*) AS gender_count
    FROM current_assignments
    GROUP BY gender
  ) gender_stats
$$;