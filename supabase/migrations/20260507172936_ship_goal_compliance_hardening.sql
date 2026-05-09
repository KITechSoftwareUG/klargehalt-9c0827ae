-- ============================================================
-- SHIP-GOAL COMPLIANCE HARDENING
--
-- 1. salary_decisions is append-only at database-trigger level,
--    including service-role traffic.
-- 2. salary_decision inserts are always mirrored into audit_logs.
-- 3. pay_gap_snapshots can be refreshed from employee source data
--    and are refreshed automatically on employee compensation/group
--    changes. Gaps above 5% are flagged as breach and require a
--    joint assessment.
-- ============================================================

-- ─── 1. Defense-in-depth immutability for salary_decisions ──────────────────

ALTER TYPE public.audit_entity ADD VALUE IF NOT EXISTS 'salary_decision';
ALTER TYPE public.audit_entity ADD VALUE IF NOT EXISTS 'lawyer_review';

CREATE OR REPLACE FUNCTION public.prevent_salary_decision_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'UPDATE on salary_decisions is prohibited. Create a correction decision instead.';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_salary_decision_update ON public.salary_decisions;
CREATE TRIGGER trg_prevent_salary_decision_update
  BEFORE UPDATE ON public.salary_decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_salary_decision_update();

CREATE OR REPLACE FUNCTION public.prevent_salary_decision_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'DELETE on salary_decisions is prohibited. Salary decisions are immutable.';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_salary_decision_delete ON public.salary_decisions;
CREATE TRIGGER trg_prevent_salary_decision_delete
  BEFORE DELETE ON public.salary_decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_salary_decision_delete();

CREATE OR REPLACE FUNCTION public.audit_salary_decision_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _company_id UUID;
BEGIN
  SELECT employees.company_id
  INTO _company_id
  FROM public.employees
  WHERE employees.id = NEW.employee_id;

  INSERT INTO public.audit_logs (
    company_id,
    organization_id,
    user_id,
    user_email,
    user_role,
    action,
    entity_type,
    entity_id,
    entity_name,
    new_values,
    metadata,
    before_state,
    after_state
  )
  VALUES (
    _company_id,
    NEW.organization_id,
    NEW.decided_by_user_id,
    NEW.decided_by_user_id,
    'decision_maker',
    'create',
    'salary_decision',
    NEW.id,
    NEW.decision_type,
    to_jsonb(NEW),
    jsonb_build_object(
      'employee_id', NEW.employee_id,
      'decision_type', NEW.decision_type,
      'new_salary', NEW.new_salary
    ),
    NULL,
    to_jsonb(NEW)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_salary_decision_insert ON public.salary_decisions;
CREATE TRIGGER trg_audit_salary_decision_insert
  AFTER INSERT ON public.salary_decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_salary_decision_insert();

-- ─── 2. Automated pay-gap snapshot generation ───────────────────────────────

CREATE INDEX IF NOT EXISTS idx_pay_gap_snapshots_scope_lookup
  ON public.pay_gap_snapshots(organization_id, snapshot_date, scope, scope_id);

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
  _today DATE := CURRENT_DATE;
  _male_count INTEGER := 0;
  _female_count INTEGER := 0;
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
  IF auth.jwt() IS NOT NULL AND public.org_id() IS DISTINCT FROM _organization_id THEN
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
    c.male_count,
    c.female_count,
    b.male_mean_base,
    b.female_mean_base,
    b.male_median_base,
    b.female_median_base,
    b.male_mean_variable,
    b.female_mean_variable,
    b.pct_male_receiving_variable,
    b.pct_female_receiving_variable,
    q.q1_male_pct,
    q.q1_female_pct,
    q.q2_male_pct,
    q.q2_female_pct,
    q.q3_male_pct,
    q.q3_female_pct,
    q.q4_male_pct,
    q.q4_female_pct
  INTO
    _male_count,
    _female_count,
    _male_mean_base,
    _female_mean_base,
    _male_median_base,
    _female_median_base,
    _male_mean_variable,
    _female_mean_variable,
    _pct_male_receiving_variable,
    _pct_female_receiving_variable,
    _q1_male_pct,
    _q1_female_pct,
    _q2_male_pct,
    _q2_female_pct,
    _q3_male_pct,
    _q3_female_pct,
    _q4_male_pct,
    _q4_female_pct
  FROM counts c
  CROSS JOIN base_stats b
  CROSS JOIN quartile_stats q;

  _is_suppressed := COALESCE(_male_count, 0) < 5 OR COALESCE(_female_count, 0) < 5;

  IF NOT _is_suppressed THEN
    _mean_gap_base_pct := CASE
      WHEN COALESCE(_male_mean_base, 0) > 0
        THEN ROUND(((_male_mean_base - _female_mean_base) / _male_mean_base) * 100, 2)
      ELSE NULL
    END;
    _median_gap_base_pct := CASE
      WHEN COALESCE(_male_median_base, 0) > 0
        THEN ROUND(((_male_median_base - _female_median_base) / _male_median_base) * 100, 2)
      ELSE NULL
    END;
    _mean_gap_variable_pct := CASE
      WHEN COALESCE(_male_mean_variable, 0) > 0
        THEN ROUND(((_male_mean_variable - _female_mean_variable) / _male_mean_variable) * 100, 2)
      ELSE NULL
    END;
  END IF;

  _abs_gap := GREATEST(
    COALESCE(ABS(_mean_gap_base_pct), 0),
    COALESCE(ABS(_median_gap_base_pct), 0)
  );

  _gap_status := CASE
    WHEN _is_suppressed THEN NULL
    WHEN _abs_gap > 5 THEN 'breach'
    WHEN _abs_gap > 3 THEN 'warning'
    ELSE 'compliant'
  END;

  DELETE FROM public.pay_gap_snapshots
  WHERE organization_id = _organization_id
    AND snapshot_date = _today
    AND scope = _scope
    AND scope_id IS NOT DISTINCT FROM _scope_id;

  INSERT INTO public.pay_gap_snapshots (
    organization_id,
    snapshot_date,
    scope,
    scope_id,
    scope_label,
    male_count,
    female_count,
    male_mean_base,
    female_mean_base,
    male_median_base,
    female_median_base,
    mean_gap_base_pct,
    median_gap_base_pct,
    male_mean_variable,
    female_mean_variable,
    mean_gap_variable_pct,
    pct_male_receiving_variable,
    pct_female_receiving_variable,
    q1_male_pct,
    q1_female_pct,
    q2_male_pct,
    q2_female_pct,
    q3_male_pct,
    q3_female_pct,
    q4_male_pct,
    q4_female_pct,
    gap_status,
    requires_joint_assessment,
    is_suppressed
  )
  VALUES (
    _organization_id,
    _today,
    _scope,
    _scope_id,
    COALESCE(_scope_label, initcap(replace(_scope, '_', ' '))),
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
  IF auth.jwt() IS NOT NULL AND public.org_id() IS DISTINCT FROM _organization_id THEN
    RAISE EXCEPTION 'Cannot refresh pay-gap snapshots for another organization.';
  END IF;

  PERFORM public.refresh_pay_gap_snapshot(_organization_id, 'company', NULL, 'Unternehmen gesamt');
  _count := _count + 1;

  FOR _row IN
    SELECT id, name
    FROM public.departments
    WHERE organization_id = _organization_id
  LOOP
    PERFORM public.refresh_pay_gap_snapshot(_organization_id, 'department', _row.id, _row.name);
    _count := _count + 1;
  END LOOP;

  FOR _row IN
    SELECT id, title
    FROM public.job_profiles
    WHERE organization_id = _organization_id
  LOOP
    PERFORM public.refresh_pay_gap_snapshot(_organization_id, 'job_profile', _row.id, _row.title);
    _count := _count + 1;
  END LOOP;

  FOR _row IN
    SELECT id, name
    FROM public.job_levels
    WHERE organization_id = _organization_id
  LOOP
    PERFORM public.refresh_pay_gap_snapshot(_organization_id, 'job_level', _row.id, _row.name);
    _count := _count + 1;
  END LOOP;

  RETURN _count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_pay_gap_snapshot(TEXT, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_pay_gap_snapshots(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.refresh_pay_gap_after_employee_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _org_id TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _org_id := OLD.organization_id;
  ELSE
    _org_id := NEW.organization_id;
  END IF;

  IF _org_id IS NOT NULL THEN
    PERFORM public.refresh_pay_gap_snapshots(_org_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_pay_gap_after_employee_insert ON public.employees;
CREATE TRIGGER trg_refresh_pay_gap_after_employee_insert
  AFTER INSERT ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_pay_gap_after_employee_change();

DROP TRIGGER IF EXISTS trg_refresh_pay_gap_after_employee_update ON public.employees;
CREATE TRIGGER trg_refresh_pay_gap_after_employee_update
  AFTER UPDATE OF gender, base_salary, variable_pay, department_id, job_profile_id, job_level_id, is_active ON public.employees
  FOR EACH ROW
  WHEN (
    OLD.gender IS DISTINCT FROM NEW.gender
    OR OLD.base_salary IS DISTINCT FROM NEW.base_salary
    OR OLD.variable_pay IS DISTINCT FROM NEW.variable_pay
    OR OLD.department_id IS DISTINCT FROM NEW.department_id
    OR OLD.job_profile_id IS DISTINCT FROM NEW.job_profile_id
    OR OLD.job_level_id IS DISTINCT FROM NEW.job_level_id
    OR OLD.is_active IS DISTINCT FROM NEW.is_active
  )
  EXECUTE FUNCTION public.refresh_pay_gap_after_employee_change();

DROP TRIGGER IF EXISTS trg_refresh_pay_gap_after_employee_delete ON public.employees;
CREATE TRIGGER trg_refresh_pay_gap_after_employee_delete
  AFTER DELETE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_pay_gap_after_employee_change();
