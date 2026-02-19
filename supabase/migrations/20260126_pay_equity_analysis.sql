-- ============================================================================
-- PAY EQUITY ANALYSIS SCHEMA
-- ============================================================================
-- Implementiert die Vergleichsgruppen-Logik und Gender-Gap-Analysen
-- gemäß EU-Entgelttransparenzrichtlinie
-- ============================================================================

-- 1. VERGLEICHSGRUPPEN (PayGroups)
-- ============================================================================
-- Eine PayGroup definiert sich durch: Job-Family, Level, Standort und Beschäftigungsart
CREATE TABLE IF NOT EXISTS pay_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Gruppen-Identifikatoren
    job_family VARCHAR(100) NOT NULL,
    job_level VARCHAR(50) NOT NULL,
    location VARCHAR(100) NOT NULL,
    employment_type VARCHAR(50) NOT NULL, -- Vollzeit, Teilzeit, etc.
    
    -- Metadaten
    group_name VARCHAR(255) GENERATED ALWAYS AS (
        job_family || ' - ' || job_level || ' (' || location || ', ' || employment_type || ')'
    ) STORED,
    employee_count INTEGER DEFAULT 0,
    male_count INTEGER DEFAULT 0,
    female_count INTEGER DEFAULT 0,
    other_count INTEGER DEFAULT 0,
    
    -- Zeitstempel
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Eindeutigkeit pro Firma
    UNIQUE(company_id, job_family, job_level, location, employment_type)
);

CREATE INDEX idx_pay_groups_company ON pay_groups(company_id);
CREATE INDEX idx_pay_groups_lookup ON pay_groups(company_id, job_family, job_level, location, employment_type);

-- 2. GRUPPEN-STATISTIKEN
-- ============================================================================
CREATE TABLE IF NOT EXISTS pay_group_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pay_group_id UUID NOT NULL REFERENCES pay_groups(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Gesamt-Statistiken
    avg_salary DECIMAL(12, 2),
    median_salary DECIMAL(12, 2),
    min_salary DECIMAL(12, 2),
    max_salary DECIMAL(12, 2),
    std_deviation DECIMAL(12, 2),
    
    -- Geschlechtsspezifische Statistiken
    avg_salary_male DECIMAL(12, 2),
    avg_salary_female DECIMAL(12, 2),
    avg_salary_other DECIMAL(12, 2),
    
    median_salary_male DECIMAL(12, 2),
    median_salary_female DECIMAL(12, 2),
    median_salary_other DECIMAL(12, 2),
    
    -- Gender Pay Gap (in Prozent)
    -- Formel: (Ø Männer – Ø Frauen) / Ø Männer * 100
    gender_gap_percent DECIMAL(5, 2),
    gender_gap_status VARCHAR(20), -- 'green', 'yellow', 'red'
    
    -- Zeitraum
    calculation_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(pay_group_id, calculation_date)
);

CREATE INDEX idx_pay_group_stats_group ON pay_group_stats(pay_group_id);
CREATE INDEX idx_pay_group_stats_company ON pay_group_stats(company_id);
CREATE INDEX idx_pay_group_stats_gap_status ON pay_group_stats(gender_gap_status);

-- 3. MITARBEITER-VERGLEICHE
-- ============================================================================
CREATE TABLE IF NOT EXISTS employee_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    pay_group_id UUID NOT NULL REFERENCES pay_groups(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Mitarbeiter-Gehalt vs. Gruppe
    employee_salary DECIMAL(12, 2) NOT NULL,
    group_avg_salary DECIMAL(12, 2),
    group_median_salary DECIMAL(12, 2),
    
    -- Abweichung vom Durchschnitt
    deviation_from_avg_percent DECIMAL(5, 2),
    deviation_from_median_percent DECIMAL(5, 2),
    
    -- Position in Gruppe
    percentile_rank DECIMAL(5, 2), -- 0-100
    
    -- Erklärungsfaktoren
    tenure_months INTEGER, -- Betriebszugehörigkeit
    has_special_qualifications BOOLEAN DEFAULT FALSE,
    
    -- AI-generierte Erklärung
    ai_explanation TEXT,
    explanation_generated_at TIMESTAMPTZ,
    
    -- Zeitstempel
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(employee_id, pay_group_id)
);

CREATE INDEX idx_employee_comparisons_employee ON employee_comparisons(employee_id);
CREATE INDEX idx_employee_comparisons_group ON employee_comparisons(pay_group_id);
CREATE INDEX idx_employee_comparisons_company ON employee_comparisons(company_id);

-- 4. GENDER GAP VERLAUF (für Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS gender_gap_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    pay_group_id UUID REFERENCES pay_groups(id) ON DELETE CASCADE,
    
    -- Gap-Daten
    gender_gap_percent DECIMAL(5, 2),
    gap_status VARCHAR(20), -- 'green', 'yellow', 'red'
    
    -- Kontext
    calculation_date DATE NOT NULL,
    employee_count_male INTEGER,
    employee_count_female INTEGER,
    
    -- Maßnahmen
    action_required BOOLEAN DEFAULT FALSE,
    action_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gender_gap_history_company ON gender_gap_history(company_id);
CREATE INDEX idx_gender_gap_history_group ON gender_gap_history(pay_group_id);
CREATE INDEX idx_gender_gap_history_date ON gender_gap_history(calculation_date DESC);

-- 5. WHAT-IF SIMULATIONEN
-- ============================================================================
CREATE TABLE IF NOT EXISTS salary_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    pay_group_id UUID REFERENCES pay_groups(id) ON DELETE CASCADE,
    created_by TEXT, -- Clerk User ID (Text)
    
    -- Simulations-Parameter
    simulation_name VARCHAR(255),
    simulation_type VARCHAR(50), -- 'raise_to_median', 'close_gap', 'custom'
    
    -- Ergebnisse
    current_gap_percent DECIMAL(5, 2),
    simulated_gap_percent DECIMAL(5, 2),
    estimated_annual_cost DECIMAL(12, 2),
    affected_employees INTEGER,
    
    -- Szenario-Details (JSON)
    simulation_details JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_salary_simulations_company ON salary_simulations(company_id);
CREATE INDEX idx_salary_simulations_created_by ON salary_simulations(created_by);

-- ============================================================================
-- FUNKTIONEN FÜR BERECHNUNGEN
-- ============================================================================

-- Funktion: Berechne Gender Gap
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_gender_gap(
    p_avg_male DECIMAL,
    p_avg_female DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    IF p_avg_male IS NULL OR p_avg_male = 0 THEN
        RETURN NULL;
    END IF;
    
    IF p_avg_female IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Formel: (Ø Männer – Ø Frauen) / Ø Männer * 100
    RETURN ROUND(((p_avg_male - p_avg_female) / p_avg_male * 100)::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Funktion: Bestimme Gap-Status (Ampel)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_gap_status(p_gap_percent DECIMAL) 
RETURNS VARCHAR AS $$
BEGIN
    IF p_gap_percent IS NULL THEN
        RETURN 'unknown';
    ELSIF ABS(p_gap_percent) < 3 THEN
        RETURN 'green';  -- < 3%
    ELSIF ABS(p_gap_percent) < 5 THEN
        RETURN 'yellow'; -- 3-5%
    ELSE
        RETURN 'red';    -- > 5%
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Funktion: Aktualisiere PayGroup-Statistiken
-- ============================================================================
CREATE OR REPLACE FUNCTION update_pay_group_stats(p_company_id UUID)
RETURNS void AS $$
DECLARE
    v_group RECORD;
    v_stats RECORD;
BEGIN
    -- Für jede PayGroup der Firma
    FOR v_group IN 
        SELECT DISTINCT 
            e.company_id,
            COALESCE(jp.category, 'Unknown') as job_family,
            COALESCE(jp.level, 'Unknown') as job_level,
            COALESCE(e.location, 'Unknown') as location,
            COALESCE(e.employment_type, 'Vollzeit') as employment_type
        FROM employees e
        LEFT JOIN job_profiles jp ON e.job_profile_id = jp.id
        WHERE e.company_id = p_company_id
            AND e.current_salary IS NOT NULL
    LOOP
        -- PayGroup erstellen oder aktualisieren
        INSERT INTO pay_groups (
            company_id, job_family, job_level, location, employment_type
        ) VALUES (
            v_group.company_id,
            v_group.job_family,
            v_group.job_level,
            v_group.location,
            v_group.employment_type
        ) ON CONFLICT (company_id, job_family, job_level, location, employment_type)
        DO UPDATE SET updated_at = NOW();
        
        -- Statistiken berechnen
        SELECT 
            pg.id as pay_group_id,
            COUNT(*) as employee_count,
            COUNT(*) FILTER (WHERE e.gender = 'male') as male_count,
            COUNT(*) FILTER (WHERE e.gender = 'female') as female_count,
            COUNT(*) FILTER (WHERE e.gender NOT IN ('male', 'female')) as other_count,
            
            -- Gesamt-Statistiken
            AVG(e.current_salary) as avg_salary,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY e.current_salary) as median_salary,
            MIN(e.current_salary) as min_salary,
            MAX(e.current_salary) as max_salary,
            STDDEV(e.current_salary) as std_deviation,
            
            -- Geschlechtsspezifisch
            AVG(e.current_salary) FILTER (WHERE e.gender = 'male') as avg_salary_male,
            AVG(e.current_salary) FILTER (WHERE e.gender = 'female') as avg_salary_female,
            AVG(e.current_salary) FILTER (WHERE e.gender NOT IN ('male', 'female')) as avg_salary_other,
            
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY e.current_salary) 
                FILTER (WHERE e.gender = 'male') as median_salary_male,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY e.current_salary) 
                FILTER (WHERE e.gender = 'female') as median_salary_female,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY e.current_salary) 
                FILTER (WHERE e.gender NOT IN ('male', 'female')) as median_salary_other
        INTO v_stats
        FROM pay_groups pg
        INNER JOIN employees e ON 
            e.company_id = pg.company_id
            AND COALESCE((SELECT category FROM job_profiles WHERE id = e.job_profile_id), 'Unknown') = pg.job_family
            AND COALESCE((SELECT level FROM job_profiles WHERE id = e.job_profile_id), 'Unknown') = pg.job_level
            AND COALESCE(e.location, 'Unknown') = pg.location
            AND COALESCE(e.employment_type, 'Vollzeit') = pg.employment_type
        WHERE pg.company_id = v_group.company_id
            AND pg.job_family = v_group.job_family
            AND pg.job_level = v_group.job_level
            AND pg.location = v_group.location
            AND pg.employment_type = v_group.employment_type
        GROUP BY pg.id;
        
        -- PayGroup-Counts aktualisieren
        UPDATE pay_groups SET
            employee_count = v_stats.employee_count,
            male_count = v_stats.male_count,
            female_count = v_stats.female_count,
            other_count = v_stats.other_count,
            updated_at = NOW()
        WHERE id = v_stats.pay_group_id;
        
        -- Statistiken speichern
        INSERT INTO pay_group_stats (
            pay_group_id,
            company_id,
            avg_salary,
            median_salary,
            min_salary,
            max_salary,
            std_deviation,
            avg_salary_male,
            avg_salary_female,
            avg_salary_other,
            median_salary_male,
            median_salary_female,
            median_salary_other,
            gender_gap_percent,
            gender_gap_status,
            calculation_date
        ) VALUES (
            v_stats.pay_group_id,
            v_group.company_id,
            v_stats.avg_salary,
            v_stats.median_salary,
            v_stats.min_salary,
            v_stats.max_salary,
            v_stats.std_deviation,
            v_stats.avg_salary_male,
            v_stats.avg_salary_female,
            v_stats.avg_salary_other,
            v_stats.median_salary_male,
            v_stats.median_salary_female,
            v_stats.median_salary_other,
            calculate_gender_gap(v_stats.avg_salary_male, v_stats.avg_salary_female),
            get_gap_status(calculate_gender_gap(v_stats.avg_salary_male, v_stats.avg_salary_female)),
            CURRENT_DATE
        ) ON CONFLICT (pay_group_id, calculation_date)
        DO UPDATE SET
            avg_salary = EXCLUDED.avg_salary,
            median_salary = EXCLUDED.median_salary,
            min_salary = EXCLUDED.min_salary,
            max_salary = EXCLUDED.max_salary,
            std_deviation = EXCLUDED.std_deviation,
            avg_salary_male = EXCLUDED.avg_salary_male,
            avg_salary_female = EXCLUDED.avg_salary_female,
            avg_salary_other = EXCLUDED.avg_salary_other,
            median_salary_male = EXCLUDED.median_salary_male,
            median_salary_female = EXCLUDED.median_salary_female,
            median_salary_other = EXCLUDED.median_salary_other,
            gender_gap_percent = EXCLUDED.gender_gap_percent,
            gender_gap_status = EXCLUDED.gender_gap_status,
            updated_at = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE pay_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_group_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE gender_gap_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_simulations ENABLE ROW LEVEL SECURITY;

-- RLS Policies für pay_groups
CREATE POLICY "Users can view their company's pay groups"
    ON pay_groups FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM user_roles 
            WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "HR and Admins can manage pay groups"
    ON pay_groups FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM user_roles 
            WHERE user_id = auth.uid()::text 
            AND role IN ('admin', 'hr_manager')
        )
    );

-- RLS Policies für pay_group_stats (analog)
CREATE POLICY "Users can view their company's stats"
    ON pay_group_stats FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM user_roles 
            WHERE user_id = auth.uid()::text
        )
    );

-- RLS Policies für employee_comparisons
CREATE POLICY "Employees can view their own comparison"
    ON employee_comparisons FOR SELECT
    USING (
        employee_id IN (
            SELECT id FROM employees 
            WHERE user_id = auth.uid()::text
        )
        OR
        company_id IN (
            SELECT company_id FROM user_roles 
            WHERE user_id = auth.uid()::text 
            AND role IN ('admin', 'hr_manager')
        )
    );

-- RLS Policies für gender_gap_history
CREATE POLICY "HR can view gender gap history"
    ON gender_gap_history FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM user_roles 
            WHERE user_id = auth.uid()::text 
            AND role IN ('admin', 'hr_manager')
        )
    );

-- RLS Policies für salary_simulations
CREATE POLICY "HR can manage simulations"
    ON salary_simulations FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM user_roles 
            WHERE user_id = auth.uid()::text 
            AND role IN ('admin', 'hr_manager')
        )
    );

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON pay_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE ON pay_group_stats TO authenticated;
GRANT SELECT ON employee_comparisons TO authenticated;
GRANT SELECT ON gender_gap_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON salary_simulations TO authenticated;

-- ============================================================================
-- KOMMENTARE
-- ============================================================================

COMMENT ON TABLE pay_groups IS 'Vergleichsgruppen basierend auf Job-Family, Level, Standort und Beschäftigungsart';
COMMENT ON TABLE pay_group_stats IS 'Berechnete Statistiken und Gender-Gap-Analysen pro Gruppe';
COMMENT ON TABLE employee_comparisons IS 'Mitarbeiter-Vergleich mit ihrer Vergleichsgruppe';
COMMENT ON TABLE gender_gap_history IS 'Historische Tracking-Daten für Gender Pay Gaps';
COMMENT ON TABLE salary_simulations IS 'What-If-Simulationen für Gehaltsanpassungen';

-- ============================================================================
-- ENDE DER MIGRATION
-- ============================================================================
