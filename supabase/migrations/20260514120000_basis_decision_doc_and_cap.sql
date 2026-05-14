-- ============================================================
-- Basis tier: include decision_documentation + lift cap to 52
-- KlarGehalt — 2026-05-14
--
-- Product decisions:
--   1. salary_decisions documentation is the product core (the
--      append-only paper trail that defends against burden-of-proof
--      reversal under EU Pay-Transparency Directive 2023/970).
--      Belongs in every tier, not just Professional+.
--
--   2. max_employee_records lifted from 50 → 52. The marketing
--      commitment stays "Bis 50 Mitarbeiter" (hardcoded in
--      /preise page), but the technical cap is 52 to accommodate
--      brief hiring transitions (incoming starts before outgoing
--      deactivated). Hard block fires at 53 in /api/employees POST.
--
-- Reporting features (pdf_reports, trend_analysis, joint_assessment)
-- stay Professional+ because they target the Berichtspflicht
-- trigger (> 100 MA), which doesn't apply to Basis customers.
-- See .claude/docs/law.md §3.
-- ============================================================

UPDATE public.plans
SET features = features || '{"decision_documentation": true}'::jsonb,
    max_employee_records = 52
WHERE id = 'basis';
