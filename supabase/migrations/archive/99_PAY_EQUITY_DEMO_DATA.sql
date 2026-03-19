-- ============================================================================
-- PAY EQUITY DEMO DATA (RELIABLE VERSION)
-- ============================================================================
-- Erstellt Demo-Daten, die für jeden User sichtbar sind.
-- ============================================================================

DO $$
DECLARE
    v_company_id UUID;
    v_profile_dev_id UUID;
    v_profile_sales_id UUID;
BEGIN
    -- 1. DEMO FIRMA
    SELECT id INTO v_company_id FROM companies WHERE name = 'TechNova Solutions GmbH' LIMIT 1;
    IF v_company_id IS NULL THEN
        INSERT INTO companies (name, legal_name, country, is_active, organization_id)
        VALUES ('TechNova Solutions GmbH', 'TechNova Solutions GmbH', 'DE', true, NULL)
        RETURNING id INTO v_company_id;
    END IF;

    -- 2. JOB PROFILE
    SELECT id INTO v_profile_dev_id FROM job_profiles WHERE company_id = v_company_id AND title = 'Senior Software Engineer' LIMIT 1;
    IF v_profile_dev_id IS NULL THEN
        INSERT INTO job_profiles (company_id, title, department, level, category, is_active, organization_id)
        VALUES (v_company_id, 'Senior Software Engineer', 'Engineering', 'Senior', 'Software Development', true, NULL)
        RETURNING id INTO v_profile_dev_id;
    END IF;

    SELECT id INTO v_profile_sales_id FROM job_profiles WHERE company_id = v_company_id AND title = 'Account Manager' LIMIT 1;
    IF v_profile_sales_id IS NULL THEN
        INSERT INTO job_profiles (company_id, title, department, level, category, is_active, organization_id)
        VALUES (v_company_id, 'Account Manager', 'Sales', 'Junior', 'Sales & Marketing', true, NULL)
        RETURNING id INTO v_profile_sales_id;
    END IF;

    -- 3. MITARBEITER (Vorher löschen um Duplikate zu vermeiden)
    DELETE FROM employees WHERE company_id = v_company_id;

    -- Engineering (Gap)
    INSERT INTO employees (company_id, first_name, last_name, email, gender, current_salary, job_profile_id, location, employment_type, organization_id)
    VALUES 
    (v_company_id, 'Max', 'Mustermann', 'max@technova.io', 'male', 85000, v_profile_dev_id, 'Berlin', 'Vollzeit', NULL),
    (v_company_id, 'Thomas', 'Schmidt', 'thomas@technova.io', 'male', 82000, v_profile_dev_id, 'Berlin', 'Vollzeit', NULL),
    (v_company_id, 'Julia', 'Müller', 'julia@technova.io', 'female', 74000, v_profile_dev_id, 'Berlin', 'Vollzeit', NULL),
    (v_company_id, 'Sarah', 'Wagner', 'sarah@technova.io', 'female', 76500, v_profile_dev_id, 'Berlin', 'Vollzeit', NULL);

    -- 4. STATISTIKEN TRIGGERN
    PERFORM update_pay_group_stats(v_company_id);

    RAISE NOTICE 'Demo-Daten erfolgreich erstellt.';
END $$;
