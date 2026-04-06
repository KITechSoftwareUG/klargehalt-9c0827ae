ALTER TABLE public.onboarding_data
ADD COLUMN IF NOT EXISTS self_reported_role TEXT CHECK (self_reported_role IN ('admin', 'hr_manager'));
