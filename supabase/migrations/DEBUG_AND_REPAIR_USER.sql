-- ============================================================================
-- DEBUG & REPAIR SCRIPT: WHY AM I BLOCKED?
-- ============================================================================
-- Anleitung:
-- 1. Führen Sie dieses Skript im Supabase SQL Editor aus.
-- 2. Schauen Sie sich die Ergebnisse unten im "Results"-Bereich an.
-- ============================================================================

-- 1. ZEIGE ALLE USER UND IHREN STATUS
-- Wenn hier "NO_ROLE" oder "NO_ORG" steht, ist das der Grund für den Fehler!
SELECT 
    p.email,
    p.user_id,
    COALESCE(ur.role, '❌ NO_ROLE') as role_status,
    COALESCE(ur.organization_id, '❌ NO_ORG_ID') as access_status,
    c.name as company_name
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
LEFT JOIN public.companies c ON ur.company_id = c.id;


-- 2. AUTOMATISCHE REPARATUR (Versuch)
-- Wir versuchen, verwaiste User mit ihrer Firma zu verknüpfen, falls möglich.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Für jeden User ohne Rolle, aber mit Company im Profil...
    FOR r IN 
        SELECT p.user_id, c.id as comp_id, c.organization_id as org_id
        FROM public.profiles p
        JOIN public.companies c ON p.organization_id = c.organization_id OR p.company_name = c.name
        WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p.user_id)
    LOOP
        -- ... erstelle die Admin-Rolle
        INSERT INTO public.user_roles (user_id, role, company_id, organization_id)
        VALUES (r.user_id, 'admin', r.comp_id, r.org_id);
    END LOOP;
END $$;

-- 3. VALIDIEREN DER ORG-IDS
-- Prüfe, ob die organization_ids in den Tabellen übereinstimmen
SELECT 
    'companies' as table_name, count(*) as missing_org_id FROM companies WHERE organization_id IS NULL
UNION ALL
SELECT 
    'employees', count(*) FROM employees WHERE organization_id IS NULL
UNION ALL
SELECT 
    'user_roles', count(*) FROM user_roles WHERE organization_id IS NULL;

-- ============================================================================
-- WICHTIG:
-- Wenn Sie in Schritt 1 immer noch "NO_ORG_ID" sehen, müssen Sie die 
-- organization_id manuell aus der 'companies' Tabelle kopieren und 
-- in die 'user_roles' Tabelle einfügen!
-- ============================================================================
