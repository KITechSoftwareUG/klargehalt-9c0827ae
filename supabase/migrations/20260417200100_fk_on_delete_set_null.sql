-- Migration: Update ON DELETE behavior for employee_id foreign keys
--
-- info_requests.employee_id  → ON DELETE SET NULL  (compliance record must survive)
-- salary_history.employee_id → ON DELETE CASCADE   (orphaned history has no value)

-- 1. info_requests: drop existing FK constraint and recreate with ON DELETE SET NULL
ALTER TABLE info_requests
  DROP CONSTRAINT IF EXISTS info_requests_employee_id_fkey;

ALTER TABLE info_requests
  ADD CONSTRAINT info_requests_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;

-- 2. salary_history: drop existing FK constraint and recreate with ON DELETE CASCADE
ALTER TABLE salary_history
  DROP CONSTRAINT IF EXISTS salary_history_employee_id_fkey;

ALTER TABLE salary_history
  ADD CONSTRAINT salary_history_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
