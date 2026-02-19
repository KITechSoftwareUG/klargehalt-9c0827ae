-- ============================================================================
-- FIX: ALIGN DATABASE SCHEMA WITH CLERK ORGANIZATION IDS
-- ============================================================================
-- Dieses Skript fügt die fehlende organization_id Spalte zu allen relevanten
-- Tabellen hinzu, damit die Frontend-Hooks (die nach organization_id filtern)
-- korrekt funktionieren.
-- ============================================================================

-- 1. SPALTEN HINZUFÜGEN
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.consultation_bookings ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.employee_comparisons ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.gender_gap_history ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.info_requests ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.job_profiles ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.pay_bands ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.pay_group_stats ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.pay_groups ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE public.salary_simulations ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- 2. INDEXE FÜR PERFORMANCE (FILTRIERUNG)
CREATE INDEX IF NOT EXISTS idx_employees_org ON public.employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_profiles_org ON public.job_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_pay_groups_org ON public.pay_groups(organization_id);
CREATE INDEX IF NOT EXISTS idx_pay_bands_org ON public.pay_bands(organization_id);

-- 3. KOMMENTARE
COMMENT ON COLUMN job_profiles.organization_id IS 'Clerk Organization ID für Multi-Tenancy';
COMMENT ON COLUMN employees.organization_id IS 'Clerk Organization ID für Multi-Tenancy';

-- 4. OPTIONAL: DATEN-MIGRATION
-- Falls bereits Daten existieren, versuchen wir sie über die company_id zu verknüpfen
UPDATE public.job_profiles jp
SET organization_id = c.organization_id
FROM public.companies c
WHERE jp.company_id = c.id AND jp.organization_id IS NULL;

UPDATE public.employees e
SET organization_id = c.organization_id
FROM public.companies c
WHERE e.company_id = c.id AND e.organization_id IS NULL;

UPDATE public.pay_groups pg
SET organization_id = c.organization_id
FROM public.companies c
WHERE pg.company_id = c.id AND pg.organization_id IS NULL;
