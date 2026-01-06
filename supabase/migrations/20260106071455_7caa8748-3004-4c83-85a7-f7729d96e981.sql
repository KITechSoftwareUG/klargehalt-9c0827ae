
-- =====================================================
-- SICHERE AGGREGATIONS- UND PAY-GAP-FUNKTIONEN
-- Mit Mindestgruppengröße und Anonymisierungsschutz
-- =====================================================

-- Konfigurationstabelle für Anonymisierungsparameter
CREATE TABLE IF NOT EXISTS public.anonymization_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  min_group_size INTEGER NOT NULL DEFAULT 5,
  max_deviation_percent NUMERIC(5,2) NOT NULL DEFAULT 20.0,
  rounding_precision INTEGER NOT NULL DEFAULT 100, -- Rundet auf nächste 100
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Trigger für updated_at
CREATE TRIGGER update_anonymization_config_updated_at
  BEFORE UPDATE ON public.anonymization_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS für Konfiguration
ALTER TABLE public.anonymization_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage anonymization config"
  ON public.anonymization_config
  FOR ALL
  USING (
    verify_tenant_access(company_id)
    AND has_permission('company.settings')
  );

CREATE POLICY "HR can view anonymization config"
  ON public.anonymization_config
  FOR SELECT
  USING (
    verify_tenant_access(company_id)
    AND has_any_permission(ARRAY['employees.view', 'salaries.view'])
  );

-- =====================================================
-- AGGREGIERTE GEHALTSSTATISTIKEN (sicher)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_safe_salary_statistics(
  _job_profile_id UUID,
  _job_level_id UUID DEFAULT NULL
)
RETURNS TABLE (
  statistic_type TEXT,
  value NUMERIC,
  group_size INTEGER,
  is_suppressed BOOLEAN,
  suppression_reason TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _company_id UUID;
  _min_group_size INTEGER;
  _rounding INTEGER;
  _count INTEGER;
  _median NUMERIC;
  _average NUMERIC;
  _min_val NUMERIC;
  _max_val NUMERIC;
  _ref_point NUMERIC;
BEGIN
  -- Hole Company ID und Konfiguration
  _company_id := get_user_company_id();
  
  SELECT COALESCE(min_group_size, 5), COALESCE(rounding_precision, 100)
  INTO _min_group_size, _rounding
  FROM public.anonymization_config
  WHERE company_id = _company_id;
  
  -- Fallback-Werte
  _min_group_size := COALESCE(_min_group_size, 5);
  _rounding := COALESCE(_rounding, 100);
  
  -- Zähle Mitarbeiter in dieser Gruppe
  SELECT COUNT(*)
  INTO _count
  FROM public.employee_assignments ea
  JOIN public.employees e ON e.id = ea.employee_id
  JOIN public.job_profile_versions jpv ON jpv.id = ea.job_profile_version_id
  JOIN public.job_profiles_normalized jpn ON jpn.id = jpv.job_profile_id
  WHERE jpn.id = _job_profile_id
    AND (_job_level_id IS NULL OR ea.job_level_id = _job_level_id)
    AND ea.effective_from <= CURRENT_DATE
    AND (ea.effective_until IS NULL OR ea.effective_until >= CURRENT_DATE)
    AND e.is_active = true
    AND verify_tenant_access(e.company_id);
  
  -- Prüfe Mindestgruppengröße
  IF _count < _min_group_size THEN
    RETURN QUERY SELECT 
      'suppressed'::TEXT,
      NULL::NUMERIC,
      _count,
      true,
      format('Gruppengröße (%s) unter Minimum (%s)', _count, _min_group_size);
    RETURN;
  END IF;
  
  -- Hole Pay Band Daten (anonymisiert aus Struktur, nicht Einzelgehälter)
  SELECT 
    pbv.reference_point,
    pbv.min_annual,
    pbv.max_annual
  INTO _ref_point, _min_val, _max_val
  FROM public.pay_bands_normalized pbn
  JOIN public.pay_band_versions pbv ON pbv.id = pbn.current_version_id
  WHERE pbn.job_profile_id = _job_profile_id
    AND (_job_level_id IS NULL OR pbn.job_level_id = _job_level_id)
    AND pbn.is_active = true
    AND verify_tenant_access(pbn.company_id)
  LIMIT 1;
  
  -- Runde Werte für zusätzliche Anonymisierung
  _ref_point := ROUND(_ref_point / _rounding) * _rounding;
  _min_val := ROUND(_min_val / _rounding) * _rounding;
  _max_val := ROUND(_max_val / _rounding) * _rounding;
  
  -- Returniere sichere Statistiken
  RETURN QUERY 
  SELECT 'median'::TEXT, _ref_point, _count, false, NULL::TEXT
  UNION ALL
  SELECT 'min_band'::TEXT, _min_val, _count, false, NULL::TEXT
  UNION ALL
  SELECT 'max_band'::TEXT, _max_val, _count, false, NULL::TEXT
  UNION ALL
  SELECT 'group_size'::TEXT, _count::NUMERIC, _count, false, NULL::TEXT;
END;
$$;

-- =====================================================
-- GENDER PAY GAP BERECHNUNG (k-Anonymität)
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_gender_pay_gap(
  _job_profile_id UUID DEFAULT NULL,
  _job_level_id UUID DEFAULT NULL,
  _department TEXT DEFAULT NULL
)
RETURNS TABLE (
  category TEXT,
  male_median NUMERIC,
  female_median NUMERIC,
  gap_percent NUMERIC,
  male_count INTEGER,
  female_count INTEGER,
  is_reportable BOOLEAN,
  suppression_reason TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _company_id UUID;
  _min_group_size INTEGER;
  _rounding INTEGER;
  _m_count INTEGER;
  _f_count INTEGER;
  _m_median NUMERIC;
  _f_median NUMERIC;
  _gap NUMERIC;
BEGIN
  _company_id := get_user_company_id();
  
  -- Hole Anonymisierungskonfiguration
  SELECT COALESCE(min_group_size, 5), COALESCE(rounding_precision, 100)
  INTO _min_group_size, _rounding
  FROM public.anonymization_config
  WHERE company_id = _company_id;
  
  _min_group_size := COALESCE(_min_group_size, 5);
  _rounding := COALESCE(_rounding, 100);
  
  -- Zähle nach Geschlecht
  SELECT 
    COUNT(*) FILTER (WHERE e.gender = 'male'),
    COUNT(*) FILTER (WHERE e.gender = 'female')
  INTO _m_count, _f_count
  FROM public.employee_assignments ea
  JOIN public.employees e ON e.id = ea.employee_id
  JOIN public.job_profile_versions jpv ON jpv.id = ea.job_profile_version_id
  JOIN public.job_profiles_normalized jpn ON jpn.id = jpv.job_profile_id
  WHERE (_job_profile_id IS NULL OR jpn.id = _job_profile_id)
    AND (_job_level_id IS NULL OR ea.job_level_id = _job_level_id)
    AND (_department IS NULL OR e.department = _department)
    AND ea.effective_from <= CURRENT_DATE
    AND (ea.effective_until IS NULL OR ea.effective_until >= CURRENT_DATE)
    AND e.is_active = true
    AND verify_tenant_access(e.company_id);
  
  -- Prüfe beide Gruppen gegen Mindestgröße
  IF _m_count < _min_group_size OR _f_count < _min_group_size THEN
    RETURN QUERY SELECT 
      COALESCE(_department, 'Gesamt')::TEXT,
      NULL::NUMERIC,
      NULL::NUMERIC,
      NULL::NUMERIC,
      CASE WHEN _m_count >= _min_group_size THEN _m_count ELSE NULL END,
      CASE WHEN _f_count >= _min_group_size THEN _f_count ELSE NULL END,
      false,
      format('Mindestens eine Gruppe unter Minimum (%s)', _min_group_size);
    RETURN;
  END IF;
  
  -- Berechne Mediane aus Pay Band Referenzpunkten (nicht Einzelgehälter!)
  -- Dies ist EU-konform da es auf strukturellen Daten basiert
  SELECT 
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY pbv.reference_point) 
      FILTER (WHERE e.gender = 'male'),
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY pbv.reference_point)
      FILTER (WHERE e.gender = 'female')
  INTO _m_median, _f_median
  FROM public.employee_assignments ea
  JOIN public.employees e ON e.id = ea.employee_id
  JOIN public.pay_band_versions pbv ON pbv.id = ea.pay_band_version_id
  JOIN public.job_profile_versions jpv ON jpv.id = ea.job_profile_version_id
  JOIN public.job_profiles_normalized jpn ON jpn.id = jpv.job_profile_id
  WHERE (_job_profile_id IS NULL OR jpn.id = _job_profile_id)
    AND (_job_level_id IS NULL OR ea.job_level_id = _job_level_id)
    AND (_department IS NULL OR e.department = _department)
    AND ea.effective_from <= CURRENT_DATE
    AND (ea.effective_until IS NULL OR ea.effective_until >= CURRENT_DATE)
    AND e.is_active = true
    AND verify_tenant_access(e.company_id);
  
  -- Runde Werte
  _m_median := ROUND(_m_median / _rounding) * _rounding;
  _f_median := ROUND(_f_median / _rounding) * _rounding;
  
  -- Berechne Gap (positiv = Männer verdienen mehr)
  IF _m_median > 0 THEN
    _gap := ROUND(((_m_median - _f_median) / _m_median) * 100, 1);
  ELSE
    _gap := 0;
  END IF;
  
  RETURN QUERY SELECT 
    COALESCE(_department, 'Gesamt')::TEXT,
    _m_median,
    _f_median,
    _gap,
    _m_count,
    _f_count,
    true,
    NULL::TEXT;
END;
$$;

-- =====================================================
-- ABWEICHUNGSANALYSE MIT SCHWELLENWERTEN
-- =====================================================

CREATE OR REPLACE FUNCTION public.analyze_salary_deviations(
  _threshold_percent NUMERIC DEFAULT 20.0
)
RETURNS TABLE (
  job_profile_id UUID,
  job_profile_title TEXT,
  job_level_id UUID,
  job_level_name TEXT,
  deviation_type TEXT,
  deviation_percent NUMERIC,
  affected_count INTEGER,
  is_critical BOOLEAN,
  recommendation TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _company_id UUID;
  _min_group_size INTEGER;
  _max_deviation NUMERIC;
BEGIN
  _company_id := get_user_company_id();
  
  -- Permission Check
  IF NOT has_any_permission(ARRAY['salaries.view', 'reports.pay_gap']) THEN
    RAISE EXCEPTION 'Keine Berechtigung für Abweichungsanalyse';
  END IF;
  
  SELECT COALESCE(min_group_size, 5), COALESCE(max_deviation_percent, 20.0)
  INTO _min_group_size, _max_deviation
  FROM public.anonymization_config
  WHERE company_id = _company_id;
  
  _min_group_size := COALESCE(_min_group_size, 5);
  _max_deviation := COALESCE(_max_deviation, _threshold_percent);
  
  RETURN QUERY
  WITH assignment_stats AS (
    SELECT 
      jpn.id AS profile_id,
      jpv.title AS profile_title,
      jl.id AS level_id,
      jl.name AS level_name,
      pbv.min_annual,
      pbv.max_annual,
      pbv.reference_point,
      e.gender,
      COUNT(*) AS emp_count
    FROM public.employee_assignments ea
    JOIN public.employees e ON e.id = ea.employee_id
    JOIN public.job_profile_versions jpv ON jpv.id = ea.job_profile_version_id
    JOIN public.job_profiles_normalized jpn ON jpn.id = jpv.job_profile_id
    JOIN public.job_levels_normalized jl ON jl.id = ea.job_level_id
    JOIN public.pay_band_versions pbv ON pbv.id = ea.pay_band_version_id
    WHERE ea.effective_from <= CURRENT_DATE
      AND (ea.effective_until IS NULL OR ea.effective_until >= CURRENT_DATE)
      AND e.is_active = true
      AND verify_tenant_access(e.company_id)
    GROUP BY jpn.id, jpv.title, jl.id, jl.name, 
             pbv.min_annual, pbv.max_annual, pbv.reference_point, e.gender
    HAVING COUNT(*) >= _min_group_size
  ),
  gender_comparison AS (
    SELECT 
      profile_id,
      profile_title,
      level_id,
      level_name,
      reference_point,
      MAX(emp_count) FILTER (WHERE gender = 'male') AS male_count,
      MAX(emp_count) FILTER (WHERE gender = 'female') AS female_count,
      MAX(reference_point) FILTER (WHERE gender = 'male') AS male_ref,
      MAX(reference_point) FILTER (WHERE gender = 'female') AS female_ref
    FROM assignment_stats
    GROUP BY profile_id, profile_title, level_id, level_name, reference_point
  )
  SELECT 
    gc.profile_id,
    gc.profile_title,
    gc.level_id,
    gc.level_name,
    'gender_gap'::TEXT,
    CASE 
      WHEN gc.male_ref > 0 AND gc.female_ref > 0 THEN
        ROUND(ABS(gc.male_ref - gc.female_ref) / GREATEST(gc.male_ref, gc.female_ref) * 100, 1)
      ELSE NULL
    END,
    COALESCE(gc.male_count, 0) + COALESCE(gc.female_count, 0),
    CASE 
      WHEN gc.male_ref > 0 AND gc.female_ref > 0 THEN
        ABS(gc.male_ref - gc.female_ref) / GREATEST(gc.male_ref, gc.female_ref) * 100 > _max_deviation
      ELSE false
    END,
    CASE 
      WHEN gc.male_ref > gc.female_ref THEN 'Überprüfung empfohlen: Männer über Median'
      WHEN gc.female_ref > gc.male_ref THEN 'Überprüfung empfohlen: Frauen über Median'
      ELSE 'Keine signifikante Abweichung'
    END
  FROM gender_comparison gc
  WHERE COALESCE(gc.male_count, 0) >= _min_group_size
    AND COALESCE(gc.female_count, 0) >= _min_group_size;
END;
$$;

-- =====================================================
-- ABTEILUNGSÜBERGREIFENDE STATISTIKEN
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_department_statistics()
RETURNS TABLE (
  department TEXT,
  total_employees INTEGER,
  gender_distribution JSONB,
  avg_tenure_years NUMERIC,
  is_suppressed BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _company_id UUID;
  _min_group_size INTEGER;
BEGIN
  _company_id := get_user_company_id();
  
  SELECT COALESCE(min_group_size, 5)
  INTO _min_group_size
  FROM public.anonymization_config
  WHERE company_id = _company_id;
  
  _min_group_size := COALESCE(_min_group_size, 5);
  
  RETURN QUERY
  WITH dept_stats AS (
    SELECT 
      e.department,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE e.gender = 'male') AS male_count,
      COUNT(*) FILTER (WHERE e.gender = 'female') AS female_count,
      COUNT(*) FILTER (WHERE e.gender IS NULL OR e.gender NOT IN ('male', 'female')) AS other_count,
      AVG(EXTRACT(YEAR FROM age(CURRENT_DATE, e.hire_date))) AS avg_tenure
    FROM public.employees e
    WHERE e.is_active = true
      AND verify_tenant_access(e.company_id)
    GROUP BY e.department
  )
  SELECT 
    COALESCE(ds.department, 'Nicht zugewiesen'),
    ds.total::INTEGER,
    CASE 
      WHEN ds.total >= _min_group_size THEN
        jsonb_build_object(
          'male', ds.male_count,
          'female', ds.female_count,
          'other', ds.other_count
        )
      ELSE NULL
    END,
    CASE 
      WHEN ds.total >= _min_group_size THEN
        ROUND(ds.avg_tenure, 1)
      ELSE NULL
    END,
    ds.total < _min_group_size
  FROM dept_stats ds
  ORDER BY ds.total DESC;
END;
$$;

-- =====================================================
-- UNTERNEHMENSWEITER PAY EQUITY REPORT
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_pay_equity_report()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _company_id UUID;
  _min_group_size INTEGER;
  _result JSONB;
  _overall_gap RECORD;
  _dept_gaps JSONB;
  _level_gaps JSONB;
  _warnings JSONB;
BEGIN
  _company_id := get_user_company_id();
  
  -- Permission Check
  IF NOT has_any_permission(ARRAY['reports.pay_gap', 'audit.view']) THEN
    RAISE EXCEPTION 'Keine Berechtigung für Pay Equity Report';
  END IF;
  
  SELECT COALESCE(min_group_size, 5)
  INTO _min_group_size
  FROM public.anonymization_config
  WHERE company_id = _company_id;
  
  _min_group_size := COALESCE(_min_group_size, 5);
  
  -- Gesamter Gender Pay Gap
  SELECT * INTO _overall_gap FROM calculate_gender_pay_gap(NULL, NULL, NULL);
  
  -- Pay Gap nach Abteilung
  SELECT jsonb_agg(
    jsonb_build_object(
      'department', category,
      'male_median', male_median,
      'female_median', female_median,
      'gap_percent', gap_percent,
      'is_reportable', is_reportable,
      'reason', suppression_reason
    )
  )
  INTO _dept_gaps
  FROM (
    SELECT DISTINCT e.department AS dept
    FROM public.employees e
    WHERE e.is_active = true AND verify_tenant_access(e.company_id)
  ) depts
  CROSS JOIN LATERAL calculate_gender_pay_gap(NULL, NULL, depts.dept);
  
  -- Pay Gap nach Level
  SELECT jsonb_agg(
    jsonb_build_object(
      'level', jl.name,
      'level_id', jl.id,
      'gap_data', (SELECT row_to_json(g.*) FROM calculate_gender_pay_gap(NULL, jl.id, NULL) g LIMIT 1)
    )
  )
  INTO _level_gaps
  FROM public.job_levels_normalized jl
  WHERE verify_tenant_access(jl.company_id)
    AND jl.is_active = true;
  
  -- Warnungen für kritische Abweichungen
  SELECT jsonb_agg(
    jsonb_build_object(
      'profile', job_profile_title,
      'level', job_level_name,
      'deviation', deviation_percent,
      'recommendation', recommendation
    )
  )
  INTO _warnings
  FROM analyze_salary_deviations(20.0)
  WHERE is_critical = true;
  
  -- Zusammenführen
  _result := jsonb_build_object(
    'generated_at', now(),
    'company_id', _company_id,
    'anonymization_threshold', _min_group_size,
    'overall_gap', jsonb_build_object(
      'male_median', _overall_gap.male_median,
      'female_median', _overall_gap.female_median,
      'gap_percent', _overall_gap.gap_percent,
      'male_count', _overall_gap.male_count,
      'female_count', _overall_gap.female_count,
      'is_reportable', _overall_gap.is_reportable
    ),
    'by_department', COALESCE(_dept_gaps, '[]'::JSONB),
    'by_level', COALESCE(_level_gaps, '[]'::JSONB),
    'critical_warnings', COALESCE(_warnings, '[]'::JSONB),
    'eu_compliance_note', 'Bericht gemäß EU-Richtlinie 2023/970 - Alle Werte aggregiert mit Mindestgruppengröße ' || _min_group_size
  );
  
  -- Audit Log
  PERFORM create_audit_log(
    _company_id, 
    'export'::audit_action, 
    'report'::audit_entity,
    NULL,
    'Pay Equity Report',
    NULL,
    NULL,
    jsonb_build_object('report_type', 'pay_equity', 'generated_at', now())
  );
  
  RETURN _result;
END;
$$;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.get_safe_salary_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_gender_pay_gap TO authenticated;
GRANT EXECUTE ON FUNCTION public.analyze_salary_deviations TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_department_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_pay_equity_report TO authenticated;
