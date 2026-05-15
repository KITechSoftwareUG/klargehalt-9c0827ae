-- ────────────────────────────────────────────────────────────────────────────
-- Risk #3 (P0) — pay_gap_snapshots refresh is O(n²) per CSV import
--
-- The employee-change triggers were FOR EACH ROW, each calling
-- refresh_pay_gap_snapshots(org) which recomputes the company + every
-- department + job_profile + job_level snapshot. A bulk import of N employees
-- therefore triggered N full org-wide recomputations (already caused two
-- production outages and silently half-imported compliance datasets on
-- statement timeout).
--
-- Fix: convert to FOR EACH STATEMENT with transition tables (PG 10+). A bulk
-- INSERT/UPDATE/DELETE now fires the refresh ONCE per affected org per
-- statement instead of once per row. Behaviour is preserved — snapshots are
-- still fully refreshed after employee changes, just deduplicated per
-- statement. refresh_pay_gap_snapshots()/refresh_pay_gap_snapshot() are
-- intentionally left untouched (the 20260515130000/150000 fixes still apply).
--
-- The legacy per-row function public.refresh_pay_gap_after_employee_change()
-- is left in place (now unreferenced) to keep this migration reversible and
-- avoid touching anything that might PERFORM it manually.
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.refresh_pay_gap_after_employee_change_stmt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _org TEXT;
BEGIN
  -- Each branch only references the transition table that exists for its
  -- triggering event (declared via REFERENCING below). One refresh per
  -- DISTINCT org regardless of how many rows the statement touched.
  IF TG_OP = 'INSERT' THEN
    FOR _org IN
      SELECT DISTINCT organization_id FROM new_rows WHERE organization_id IS NOT NULL
    LOOP
      PERFORM public.refresh_pay_gap_snapshots(_org);
    END LOOP;
  ELSIF TG_OP = 'DELETE' THEN
    FOR _org IN
      SELECT DISTINCT organization_id FROM old_rows WHERE organization_id IS NOT NULL
    LOOP
      PERFORM public.refresh_pay_gap_snapshots(_org);
    END LOOP;
  ELSE  -- UPDATE: org virtually never changes, but cover both sides safely
    FOR _org IN
      SELECT organization_id FROM new_rows WHERE organization_id IS NOT NULL
      UNION
      SELECT organization_id FROM old_rows WHERE organization_id IS NOT NULL
    LOOP
      PERFORM public.refresh_pay_gap_snapshots(_org);
    END LOOP;
  END IF;

  RETURN NULL;  -- AFTER STATEMENT trigger: return value ignored
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_pay_gap_after_employee_change_stmt() TO authenticated;

-- Replace the three FOR EACH ROW triggers with FOR EACH STATEMENT equivalents.
DROP TRIGGER IF EXISTS trg_refresh_pay_gap_after_employee_insert ON public.employees;
DROP TRIGGER IF EXISTS trg_refresh_pay_gap_after_employee_update ON public.employees;
DROP TRIGGER IF EXISTS trg_refresh_pay_gap_after_employee_delete ON public.employees;

CREATE TRIGGER trg_refresh_pay_gap_after_employee_insert
  AFTER INSERT ON public.employees
  REFERENCING NEW TABLE AS new_rows
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.refresh_pay_gap_after_employee_change_stmt();

-- AFTER UPDATE OF <cols> already restricts firing to relevant column writes.
-- Statement-level triggers cannot use a row-level WHEN clause; losing that
-- micro-skip means a no-op column-touch update costs one full refresh — still
-- vastly cheaper than the previous per-row behaviour.
CREATE TRIGGER trg_refresh_pay_gap_after_employee_update
  AFTER UPDATE OF gender, base_salary, variable_pay, department_id,
                  job_profile_id, job_level_id, is_active ON public.employees
  REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.refresh_pay_gap_after_employee_change_stmt();

CREATE TRIGGER trg_refresh_pay_gap_after_employee_delete
  AFTER DELETE ON public.employees
  REFERENCING OLD TABLE AS old_rows
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.refresh_pay_gap_after_employee_change_stmt();
