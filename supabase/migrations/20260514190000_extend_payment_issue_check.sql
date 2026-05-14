-- Extend companies.payment_issue CHECK constraint to allow 'action_required'.
--
-- The previous constraint (20260514130000_stripe_cancel_lifecycle.sql) accepted
-- only 'refunded' and 'disputed'. The Stripe webhook handler for
-- invoice.payment_action_required now writes 'action_required' to surface SCA /
-- 3D Secure prompts to admins. Without this migration the webhook handler
-- rolled back with a 23514 constraint violation.

ALTER TABLE companies
  DROP CONSTRAINT IF EXISTS companies_payment_issue_check;

ALTER TABLE companies
  ADD CONSTRAINT companies_payment_issue_check
    CHECK (payment_issue IS NULL OR payment_issue IN ('refunded', 'disputed', 'action_required'));

COMMENT ON COLUMN companies.payment_issue IS
  'Operational flag set by Stripe webhooks: refunded | disputed | action_required (SCA pending). NULL when no payment issue.';
