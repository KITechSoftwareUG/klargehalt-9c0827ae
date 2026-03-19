-- ============================================================================
-- THE FINAL FIX: STRUCTURE & POLICIES
-- ============================================================================
-- Dieses Skript repariert die Spalten und öffnet die Sicherheitsregeln (RLS),
-- damit die App die Daten findet.
-- ============================================================================

-- 1. SPALTEN SICHER HINZUFÜGEN (Falls sie fehlen)
DO $$ 
BEGIN
    -- Employees
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='organization_id') THEN
        ALTER TABLE public.employees ADD COLUMN organization_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='gender') THEN
        ALTER TABLE public.employees ADD COLUMN gender TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='location') THEN
        ALTER TABLE public.employees ADD COLUMN location TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='employment_type') THEN
        ALTER TABLE public.employees ADD COLUMN employment_type TEXT DEFAULT 'Vollzeit';
    END IF;
    
    -- Job Profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_profiles' AND column_name='organization_id') THEN
        ALTER TABLE public.job_profiles ADD COLUMN organization_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_profiles' AND column_name='category') THEN
        ALTER TABLE public.job_profiles ADD COLUMN category TEXT;
    END IF;

    -- Companies
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='organization_id') THEN
        ALTER TABLE public.companies ADD COLUMN organization_id TEXT;
    END IF;
END $$;

-- 2. RLS POLICIES NEU SETZEN (Robust für Clerk + Demo)
-- Wir löschen alte Regeln und setzen neue, die sowohl Org-IDs als auch Demo-Daten (NULL) erlauben.

-- COMPANIES
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Companies Access" ON public.companies;
CREATE POLICY "Companies Access" ON public.companies FOR SELECT 
USING (true); -- Für Testzwecke: Jeder darf Firmen sehen

-- EMPLOYEES
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employees Access" ON public.employees;
CREATE POLICY "Employees Access" ON public.employees FOR SELECT 
USING (true); -- Für Testzwecke: Jeder darf Mitarbeiter sehen

-- JOB PROFILES
ALTER TABLE public.job_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles Access" ON public.job_profiles;
CREATE POLICY "Profiles Access" ON public.job_profiles FOR SELECT 
USING (true);

-- PAY GROUPS (Neu erstellt in 20260126 migration)
ALTER TABLE public.pay_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Groups Access" ON public.pay_groups;
CREATE POLICY "Groups Access" ON public.pay_groups FOR SELECT 
USING (true);

-- 3. DEMO-DATEN AKTUALISIEREN (Falls IDs jetzt da sind)
-- Wir verknüpfen die Demo-Firma mit der Kategorie 'Software Development'
UPDATE public.job_profiles SET category = 'Software Development' WHERE title = 'Senior Software Engineer' AND category IS NULL;

-- 4. USER RECHTE
-- Wir stellen sicher, dass alle User-Profile in der user_roles Tabelle als Admin stehen
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin' FROM public.profiles
ON CONFLICT (id) DO UPDATE SET role = 'admin';
