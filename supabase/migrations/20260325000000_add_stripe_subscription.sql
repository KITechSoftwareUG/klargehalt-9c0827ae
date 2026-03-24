-- Add Stripe subscription columns to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Indexes for webhook lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_stripe_customer ON companies(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_stripe_subscription ON companies(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- Remap old tier names to new
UPDATE companies SET subscription_tier = 'professional' WHERE subscription_tier = 'manager';
UPDATE companies SET subscription_tier = 'enterprise' WHERE subscription_tier = 'excellence';
