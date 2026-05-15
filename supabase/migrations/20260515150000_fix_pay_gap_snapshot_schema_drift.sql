-- ============================================================
-- HOTFIX: pay_gap_snapshots schema drift — employee INSERT blocked
--
-- ROOT CAUSE:
--   Migration 20260415000000_add_missing_tables.sql ran AFTER the
--   canonical schema (20260319000000) and re-created pay_gap_snapshots
--   with `CREATE TABLE IF NOT EXISTS`. In environments where the
--   canonical schema hadn't fully applied, the abbreviated 20260415
--   version won — without quartile columns or requires_joint_assessment.
--
--   Migration 20260515130000_fix_pay_gap_refresh_service_role.sql then
--   defined refresh_pay_gap_snapshot() that INSERTs into:
--     male_mean_base_salary    ← does not exist (table has male_mean_base)
--     female_mean_base_salary  ← does not exist
--     male_median_base_salary  ← does not exist
--     female_median_base_salary← does not exist
--     male_mean_variable_pay   ← does not exist (table has male_mean_variable)
--     female_mean_variable_pay ← does not exist
--     q1_male_pct..q4_female_pct ← do not exist
--     requires_joint_assessment ← does not exist
--
--   Trigger refresh_pay_gap_after_employee_change fires on every employee
--   INSERT and calls this broken function via refresh_pay_gap_snapshots(),
--   which raises PG error 42703 (undefined_column). Result: CSV import
--   shows "Fehler beim Speichern (Mitarbeiter)" for every row, 0 created.
--
-- FIX:
--   1. Add the missing columns to pay_gap_snapshots (idempotent, additive).
--   2. Replace refresh_pay_gap_snapshot() with corrected column names that
--      match the actual table schema (no _salary / _pay suffix).
--   3. Keep the auth.role()-based service_role bypass from 20260515130000.
-- ============================================================

-- ─── Step 1: Add missing columns ─────────────────────────────
ALTER TABLE public.pay_gap_snapshots
  ADD COLUMN IF NOT EXISTS q1_male_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS q1_female_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS q2_male_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS q2_female_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS q3_male_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS q3_female_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS q4_male_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS q4_female_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS requires_joint_assessment BOOLEAN DEFAULT false;

-- ─── Step 2: Replace function with correct column names ──────
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
  -- Service-role bypass: only check tenant boundary for authenticated end-users.
  -- service_role JWTs have role='service_role' and no aud claim; the API layer
  -- has already validated the tenant via guardRole + getCompanyId.
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

  -- Delete any prior snapshot for the same (org, date, scope, scope_id) tuple
  DELETE FROM public.pay_gap_snapshots
  WHERE organization_id = _organization_id
    AND snapshot_date = CURRENT_DATE
    AND scope = _scope
    AND scope_id IS NOT DISTINCT FROM _scope_id;

  INSERT INTO public.pay_gap_snapshots (
    organization_id, scope, scope_id, scope_label, snapshot_date,
    male_count, female_count,
    male_mean_base, female_mean_base,
    male_median_base, female_median_base,
    mean_gap_base_pct, median_gap_base_pct,
    male_mean_variable, female_mean_variable,
    mean_gap_variable_pct,
    pct_male_receiving_variable, pct_female_receiving_variable,
    q1_male_pct, q1_female_pct,
    q2_male_pct, q2_female_pct,
    q3_male_pct, q3_female_pct,
    q4_male_pct, q4_female_pct,
    gap_status, requires_joint_assessment, is_suppressed
  )
  VALUES (
    _organization_id, _scope, _scope_id,
    COALESCE(_scope_label, initcap(replace(_scope, '_', ' '))),
    CURRENT_DATE,
    COALESCE(_male_count, 0),
    COALESCE(_female_count, 0),
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

GRANT EXECUTE ON FUNCTION public.refresh_pay_gap_snapshot(TEXT, TEXT, UUID, TEXT) TO authenticated;
