-- =====================================================
-- STEP 1: Add new enum values (must be separate transaction)
-- =====================================================
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'legal';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'auditor';