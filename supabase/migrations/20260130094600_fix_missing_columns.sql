-- ============================================================================
-- FIX: MISSING COLUMNS FOR PAY EQUITY ANALYSIS
-- ============================================================================
-- Fügt fehlende Spalten zur employees und job_profiles Tabelle hinzu,
-- die für die Pay Equity Analyse benötigt werden.
-- ============================================================================

-- 1. EMPLOYEES TABELLE ERWEITERN
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'diverse', 'not_specified')),
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'Vollzeit';

-- 2. JOB_PROFILES TABELLE ERWEITERN
ALTER TABLE public.job_profiles 
ADD COLUMN IF NOT EXISTS category TEXT; -- Auch als 'Job Family' bezeichnet

-- 3. KOMMENTARE
COMMENT ON COLUMN employees.gender IS 'Geschlecht des Mitarbeiters für Gender Pay Gap Analysen';
COMMENT ON COLUMN employees.location IS 'Standort des Mitarbeiters (wichtig für Vergleichsgruppen)';
COMMENT ON COLUMN job_profiles.category IS 'Job-Familie oder Kategorie zur Gruppierung ähnlicher Rollen';

-- 4. RPC FUNKTION NEU ERSTELLEN (damit sie die neuen Spalten erkennt)
-- Da wir die Spalten hinzugefügt haben, müssen wir sicherstellen, dass die RPC 
-- Funktionen in 20260126_pay_equity_analysis.sql korrekt darauf zugreifen können.
-- (Falls sie im SQL-Editor vor den Spalten angelegt wurden, könnten sie ungültig sein).
