-- ============================================================================
-- ADD SUBSCRIPTION TIERS
-- ============================================================================
-- Fügt die Spalte für das Pricing-Modell hinzu.
-- Werte: 'basis', 'manager', 'excellence'
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='subscription_tier') THEN
        ALTER TABLE public.companies ADD COLUMN subscription_tier VARCHAR(50) DEFAULT 'basis';
    END IF;

    -- Optional: Trial-Ende für Upsell-Logik
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='trial_ends_at') THEN
        ALTER TABLE public.companies ADD COLUMN trial_ends_at TIMESTAMPTZ;
    END IF;
END $$;

-- Update Demo-Company to 'manager' so you can see the features for testing
UPDATE public.companies 
SET subscription_tier = 'manager' 
WHERE name = 'TechNova Solutions GmbH';
