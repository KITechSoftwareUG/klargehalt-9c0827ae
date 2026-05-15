-- ============================================================
-- HOTFIX: Employee INSERT blocked by pay-gap refresh trigger
--
-- ROOT CAUSE: refresh_pay_gap_snapshot() and refresh_pay_gap_snapshots()
-- guarded against cross-tenant calls with:
--   IF auth.jwt() IS NOT NULL AND public.org_id() IS DISTINCT FROM _org_id
--
-- This assumed service_role has no JWT. It does — Supabase's service role
-- key is itself a JWT with role='service_role' and no 'aud' claim. Result:
--   auth.jwt() IS NOT NULL  → true   (service-role JWT is present)
--   public.org_id()         → NULL   (no aud claim → returns NULL)
--   NULL IS DISTINCT FROM x → true   (NULL != non-NULL)
-- → the check raised, blocking the AFTER INSERT trigger fired by
--   POST /api/employees (which uses createServiceClient).
--
-- FIX: discriminate by auth.role(). Only authenticated end-users must
-- match the org; service_role bypasses (it has already validated the
-- tenant at the API layer via guardRole + getCompanyId). Lawyers stay
-- bound because their JWT role is still 'authenticated' — RLS scopes
-- them further via organization_members.
-- ============================================================

CREATE OR REPLACE FUNCTION public.refresh_pay_gap_snapshot(
  _organization_id TEXT,
  _scope TEXT DEFAULT 'company',
  _scope_id UUID DEFAULT NULL,
  _scope_label TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _snapshot_id UUID;
  _male_count INTEGER;
  _female_count INTEGER;
  _male_mean_base NUMERIC(12,2);
  _female_mean_base NUMERIC(12,2);
  _male_median_base NUMERIC(12,2);
  _female_median_base NUMERIC(12,2);
  _mean_gap_base_pct NUMERIC(5,2);
  _median_gap_base_pct NUMERIC(5,2);
  _male_mean_variable NUMERIC(12,2);
  _female_mean_variable NUMERIC(12,2);
  _mean_gap_variable_pct NUMERIC(5,2);
  _pct_male_receiving_variable NUMERIC(5,2);
  _pct_female_receiving_variable NUMERIC(5,2);
  _q1_male_pct NUMERIC(5,2);
  _q1_female_pct NUMERIC(5,2);
  _q2_male_pct NUMERIC(5,2);
  _q2_female_pct NUMERIC(5,2);
  _q3_male_pct NUMERIC(5,2);
  _q3_female_pct NUMERIC(5,2);
  _q4_male_pct NUMERIC(5,2);
  _q4_female_pct NUMERIC(5,2);
  _is_suppressed BOOLEAN := false;
  _gap_status TEXT;
  _abs_gap NUMERIC;
BEGIN
  IF auth.role() = 'authenticated' AND public.org_id() IS DISTINCT FROM _organization_id THEN
    RAISE EXCEPTION 'Cannot refresh pay-gap snapshots for another organization.';
  END IF;

  IF _scope NOT IN ('company', 'department', 'job_profile', 'job_level') THEN
    RAISE EXCEPTION 'Unsupported pay-gap snapshot scope: %', _scope;
  END IF;

  WITH scoped_employees AS (
    SELECT
      e.gender,
      e.base_salary,
      COALESCE(e.variable_pay, 0) AS variable_pay,
      ntile(4) OVER (ORDER BY e.base_salary) AS quartile
    FROM public.employees e
    WHERE e.organization_id = _organization_id
      AND e.is_active = true
      AND e.gender IN ('male', 'female')
      AND e.base_salary IS NOT NULL
      AND (
        _scope = 'company'
        OR (_scope = 'department' AND e.department_id = _scope_id)
        OR (_scope = 'job_profile' AND e.job_profile_id = _scope_id)
        OR (_scope = 'job_level' AND e.job_level_id = _scope_id)
      )
  ),
  counts AS (
    SELECT
      COUNT(*) FILTER (WHERE gender = 'male')::INTEGER AS male_count,
      COUNT(*) FILTER (WHERE gender = 'female')::INTEGER AS female_count
    FROM scoped_employees
  ),
  base_stats AS (
    SELECT
      AVG(base_salary) FILTER (WHERE gender = 'male')::NUMERIC(12,2) AS male_mean_base,
      AVG(base_salary) FILTER (WHERE gender = 'female')::NUMERIC(12,2) AS female_mean_base,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY base_salary) FILTER (WHERE gender = 'male')::NUMERIC(12,2) AS male_median_base,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY base_salary) FILTER (WHERE gender = 'female')::NUMERIC(12,2) AS female_median_base,
      AVG(variable_pay) FILTER (WHERE gender = 'male')::NUMERIC(12,2) AS male_mean_variable,
      AVG(variable_pay) FILTER (WHERE gender = 'female')::NUMERIC(12,2) AS female_mean_variable,
      (100.0 * COUNT(*) FILTER (WHERE gender = 'male' AND variable_pay > 0) / NULLIF(COUNT(*) FILTER (WHERE gender = 'male'), 0))::NUMERIC(5,2) AS pct_male_receiving_variable,
      (100.0 * COUNT(*) FILTER (WHERE gender = 'female' AND variable_pay > 0) / NULLIF(COUNT(*) FILTER (WHERE gender = 'female'), 0))::NUMERIC(5,2) AS pct_female_receiving_variable
    FROM scoped_employees
  ),
  quartile_stats AS (
    SELECT
      (100.0 * COUNT(*) FILTER (WHERE quartile = 1 AND gender = 'male') / NULLIF(COUNT(*) FILTER (WHERE quartile = 1), 0))::NUMERIC(5,2) AS q1_male_pct,
      (100.0 * COUNT(*) FILTER (WHERE quartile = 1 AND gender = 'female') / NULLIF(COUNT(*) FILTER (WHERE quartile = 1), 0))::NUMERIC(5,2) AS q1_female_pct,
      (100.0 * COUNT(*) FILTER (WHERE quartile = 2 AND gender = 'male') / NULLIF(COUNT(*) FILTER (WHERE quartile = 2), 0))::NUMERIC(5,2) AS q2_male_pct,
      (100.0 * COUNT(*) FILTER (WHERE quartile = 2 AND gender = 'female') / NULLIF(COUNT(*) FILTER (WHERE quartile = 2), 0))::NUMERIC(5,2) AS q2_female_pct,
      (100.0 * COUNT(*) FILTER (WHERE quartile = 3 AND gender = 'male') / NULLIF(COUNT(*) FILTER (WHERE quartile = 3), 0))::NUMERIC(5,2) AS q3_male_pct,
      (100.0 * COUNT(*) FILTER (WHERE quartile = 3 AND gender = 'female') / NULLIF(COUNT(*) FILTER (WHERE quartile = 3), 0))::NUMERIC(5,2) AS q3_female_pct,
      (100.0 * COUNT(*) FILTER (WHERE quartile = 4 AND gender = 'male') / NULLIF(COUNT(*) FILTER (WHERE quartile = 4), 0))::NUMERIC(5,2) AS q4_male_pct,
      (100.0 * COUNT(*) FILTER (WHERE quartile = 4 AND gender = 'female') / NULLIF(COUNT(*) FILTER (WHERE quartile = 4), 0))::NUMERIC(5,2) AS q4_female_pct
    FROM scoped_employees
  )
  SELECT
    c.male_count, c.female_count,
    b.male_mean_base, b.female_mean_base, b.male_median_base, b.female_median_base,
    b.male_mean_variable, b.female_mean_variable,
    b.pct_male_receiving_variable, b.pct_female_receiving_variable,
    q.q1_male_pct, q.q1_female_pct, q.q2_male_pct, q.q2_female_pct,
    q.q3_male_pct, q.q3_female_pct, q.q4_male_pct, q.q4_female_pct
  INTO
    _male_count, _female_count,
    _male_mean_base, _female_mean_base, _male_median_base, _female_median_base,
    _male_mean_variable, _female_mean_variable,
    _pct_male_receiving_variable, _pct_female_receiving_variable,
    _q1_male_pct, _q1_female_pct, _q2_male_pct, _q2_female_pct,
    _q3_male_pct, _q3_female_pct, _q4_male_pct, _q4_female_pct
  FROM counts c, base_stats b, quartile_stats q;

  _is_suppressed := COALESCE(_male_count, 0) < 5 OR COALESCE(_female_count, 0) < 5;

  IF NOT _is_suppressed AND _male_mean_base IS NOT NULL AND _female_mean_base IS NOT NULL AND _male_mean_base > 0 THEN
    _mean_gap_base_pct := ROUND(((_male_mean_base - _female_mean_base) / _male_mean_base) * 100, 2);
  ELSE
    _mean_gap_base_pct := NULL;
  END IF;

  IF NOT _is_suppressed AND _male_median_base IS NOT NULL AND _female_median_base IS NOT NULL AND _male_median_base > 0 THEN
    _median_gap_base_pct := ROUND(((_male_median_base - _female_median_base) / _male_median_base) * 100, 2);
  ELSE
    _median_gap_base_pct := NULL;
  END IF;

  IF NOT _is_suppressed AND _male_mean_variable IS NOT NULL AND _female_mean_variable IS NOT NULL AND _male_mean_variable > 0 THEN
    _mean_gap_variable_pct := ROUND(((_male_mean_variable - _female_mean_variable) / _male_mean_variable) * 100, 2);
  ELSE
    _mean_gap_variable_pct := NULL;
  END IF;

  _abs_gap := ABS(COALESCE(_mean_gap_base_pct, 0));
  IF _is_suppressed THEN
    _gap_status := 'suppressed';
  ELSIF _abs_gap <= 5 THEN
    _gap_status := 'ok';
  ELSIF _abs_gap <= 10 THEN
    _gap_status := 'warn';
  ELSE
    _gap_status := 'critical';
  END IF;

  INSERT INTO public.pay_gap_snapshots (
    organization_id, scope, scope_id, scope_label, snapshot_date,
    male_count, female_count,
    male_mean_base_salary, female_mean_base_salary,
    male_median_base_salary, female_median_base_salary,
    mean_gap_base_pct, median_gap_base_pct,
    male_mean_variable_pay, female_mean_variable_pay,
    mean_gap_variable_pct,
    pct_male_receiving_variable, pct_female_receiving_variable,
    q1_male_pct, q1_female_pct,
    q2_male_pct, q2_female_pct,
    q3_male_pct, q3_female_pct,
    q4_male_pct, q4_female_pct,
    gap_status, requires_joint_assessment, is_suppressed
  )
  VALUES (
    _organization_id, _scope, _scope_id, _scope_label, CURRENT_DATE,
    CASE WHEN _is_suppressed THEN NULL ELSE _male_count END,
    CASE WHEN _is_suppressed THEN NULL ELSE _female_count END,
    CASE WHEN _is_suppressed THEN NULL ELSE _male_mean_base END,
    CASE WHEN _is_suppressed THEN NULL ELSE _female_mean_base END,
    CASE WHEN _is_suppressed THEN NULL ELSE _male_median_base END,
    CASE WHEN _is_suppressed THEN NULL ELSE _female_median_base END,
    CASE WHEN _is_suppressed THEN NULL ELSE _mean_gap_base_pct END,
    CASE WHEN _is_suppressed THEN NULL ELSE _median_gap_base_pct END,
    CASE WHEN _is_suppressed THEN NULL ELSE _male_mean_variable END,
    CASE WHEN _is_suppressed THEN NULL ELSE _female_mean_variable END,
    CASE WHEN _is_suppressed THEN NULL ELSE _mean_gap_variable_pct END,
    CASE WHEN _is_suppressed THEN NULL ELSE _pct_male_receiving_variable END,
    CASE WHEN _is_suppressed THEN NULL ELSE _pct_female_receiving_variable END,
    CASE WHEN _is_suppressed THEN NULL ELSE _q1_male_pct END,
    CASE WHEN _is_suppressed THEN NULL ELSE _q1_female_pct END,
    CASE WHEN _is_suppressed THEN NULL ELSE _q2_male_pct END,
    CASE WHEN _is_suppressed THEN NULL ELSE _q2_female_pct END,
    CASE WHEN _is_suppressed THEN NULL ELSE _q3_male_pct END,
    CASE WHEN _is_suppressed THEN NULL ELSE _q3_female_pct END,
    CASE WHEN _is_suppressed THEN NULL ELSE _q4_male_pct END,
    CASE WHEN _is_suppressed THEN NULL ELSE _q4_female_pct END,
    _gap_status,
    COALESCE(_abs_gap > 5 AND NOT _is_suppressed, false),
    _is_suppressed
  )
  RETURNING id INTO _snapshot_id;

  RETURN _snapshot_id;
END;
$$;


CREATE OR REPLACE FUNCTION public.refresh_pay_gap_snapshots(_organization_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _count INTEGER := 0;
  _row RECORD;
BEGIN
  IF auth.role() = 'authenticated' AND public.org_id() IS DISTINCT FROM _organization_id THEN
    RAISE EXCEPTION 'Cannot refresh pay-gap snapshots for another organization.';
  END IF;

  PERFORM public.refresh_pay_gap_snapshot(_organization_id, 'company', NULL, 'Unternehmen gesamt');
  _count := _count + 1;

  FOR _row IN
    SELECT id, name FROM public.departments WHERE organization_id = _organization_id
  LOOP
    PERFORM public.refresh_pay_gap_snapshot(_organization_id, 'department', _row.id, _row.name);
    _count := _count + 1;
  END LOOP;

  FOR _row IN
    SELECT id, title FROM public.job_profiles WHERE organization_id = _organization_id
  LOOP
    PERFORM public.refresh_pay_gap_snapshot(_organization_id, 'job_profile', _row.id, _row.title);
    _count := _count + 1;
  END LOOP;

  FOR _row IN
    SELECT id, name FROM public.job_levels WHERE organization_id = _organization_id
  LOOP
    PERFORM public.refresh_pay_gap_snapshot(_organization_id, 'job_level', _row.id, _row.name);
    _count := _count + 1;
  END LOOP;

  RETURN _count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_pay_gap_snapshot(TEXT, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_pay_gap_snapshots(TEXT) TO authenticated;
