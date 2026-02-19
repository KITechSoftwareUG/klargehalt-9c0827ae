-- ============================================================================
-- LINK USER TO DEMO DATA
-- ============================================================================
-- Führen Sie dieses Skript aus, um Ihren aktuellen User mit der Demo-Firma
-- zu verknüpfen, damit Sie die Daten im Dashboard sehen.
-- ============================================================================

DO $$
DECLARE
    v_company_id UUID;
    v_user_id TEXT;
BEGIN
    -- 1. Finde die Demo-Firma
    SELECT id INTO v_company_id FROM companies WHERE name = 'TechNova Solutions GmbH' LIMIT 1;
    
    -- 2. Finde Ihren aktuellen User (den zuletzt aktiven)
    SELECT user_id INTO v_user_id FROM profiles ORDER BY updated_at DESC LIMIT 1;

    IF v_company_id IS NOT NULL AND v_user_id IS NOT NULL THEN
        -- Link im Profil setzen
        UPDATE profiles SET company_id = v_company_id WHERE user_id = v_user_id;
        
        -- Admin Rolle zuweisen
        INSERT INTO user_roles (user_id, company_id, role)
        VALUES (v_user_id, v_company_id, 'admin')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Erfolg: User % wurde mit Firma % verknüpft.', v_user_id, v_company_id;
    ELSE
        RAISE NOTICE 'Fehler: Firma oder User-Profil nicht gefunden. Bitte loggen Sie sich erst in der App ein.';
    END IF;
END $$;
