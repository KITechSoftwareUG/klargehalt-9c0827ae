-- ============================================================
-- Stripe subscription lifecycle: cancellation & dispute tracking
-- KlarGehalt — 2026-05-14
--
-- Adds visibility into:
--   * cancel_at_period_end — customer cancelled but still has access
--   * cancel_at            — when the cancellation actually takes effect
--   * canceled_at          — when the cancellation was requested
--   * payment_issue        — refund / chargeback flag (Sentry-only otherwise)
--
-- All columns are nullable + non-breaking. Webhook handler populates
-- them; UI reads them to render "Abo endet am …" banner.
-- ============================================================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancel_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_issue TEXT
    CHECK (payment_issue IS NULL OR payment_issue IN ('refunded', 'disputed'));

COMMENT ON COLUMN companies.cancel_at_period_end IS
  'True if customer cancelled via Stripe portal — access continues until cancel_at.';
COMMENT ON COLUMN companies.cancel_at IS
  'When the subscription actually ends (period end after a cancel-at-period-end).';
COMMENT ON COLUMN companies.canceled_at IS
  'When the cancellation request was made (set by Stripe webhook).';
COMMENT ON COLUMN companies.payment_issue IS
  'Set to refunded / disputed by Stripe webhook — UI banner + manual review trigger.';
