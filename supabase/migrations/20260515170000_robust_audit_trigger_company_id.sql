-- ============================================================
-- Make salary-decision audit trigger resilient to NULL company_id
--
-- Problem: audit_logs.company_id is NOT NULL REFERENCES companies(id).
-- The trigger trg_audit_salary_decision_insert derives _company_id
-- from employees.company_id. When that is NULL (data drift from
-- legacy seed paths, demo imports that bypassed the API), the
-- trigger raises:
--     null value in column "company_id" of relation "audit_logs"
--     violates not-null constraint
-- which aborts the entire salary_decisions INSERT. HR cannot
-- document a decision at all — directly blocking the demo flow
-- "Gehaltsentscheidung dokumentieren".
--
-- Fix:
-- 1. Trigger falls back to companies.id via organization_id when
--    the parent employee's company_id is NULL.
-- 2. If even that lookup fails (no companies row exists), skip
--    the audit mirror instead of failing the main INSERT — the
--    compliance write path is more important than the audit row,
--    and logAuditEntry on other paths is already fire-and-forget.
-- 3. Idempotent backfill of NULL employees/job_profiles/pay_bands
--    company_id so the primary lookup keeps working for legacy
--    rows going forward.
-- ============================================================

CREATE OR REPLACE FUNCTION public.audit_salary_decision_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _company_id UUID;
BEGIN
  SELECT e.company_id
    INTO _company_id
    FROM public.employees e
   WHERE e.id = NEW.employee_id;

  IF _company_id IS NULL THEN
    SELECT c.id
      INTO _company_id
      FROM public.companies c
     WHERE c.organization_id = NEW.organization_id
     LIMIT 1;
  END IF;

  IF _company_id IS NULL THEN
    -- Last resort: skip the audit mirror rather than aborting the main
    -- salary_decisions INSERT. An audit gap is recoverable; a hard block
    -- on the compliance write path is not.
    RAISE NOTICE 'audit_salary_decision_insert: cannot resolve company_id for org % / employee %',
      NEW.organization_id, NEW.employee_id;
    RETURN NEW;
  END IF;

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

-- Idempotent backfill: only touches rows with NULL company_id.
UPDATE public.employees e
   SET company_id = c.id
  FROM public.companies c
 WHERE e.organization_id = c.organization_id
   AND e.company_id IS NULL;

UPDATE public.job_profiles jp
   SET company_id = c.id
  FROM public.companies c
 WHERE jp.organization_id = c.organization_id
   AND jp.company_id IS NULL;

UPDATE public.pay_bands pb
   SET company_id = c.id
  FROM public.companies c
 WHERE pb.organization_id = c.organization_id
   AND pb.company_id IS NULL;

NOTIFY pgrst, 'reload schema';
