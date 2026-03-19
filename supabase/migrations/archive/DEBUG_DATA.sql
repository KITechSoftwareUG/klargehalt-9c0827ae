-- ============================================================================
-- DEBUG SCRIPT: DATA & PERMISSIONS CHECK
-- ============================================================================
-- Führen Sie dieses Skript im Supabase SQL Editor aus, um Ihre Daten zu prüfen.
-- Ersetzen Sie 'IHRE_CLERK_USER_ID_HIER' durch Ihre tatsächliche Clerk User ID
-- (zu finden im Clerk Dashboard oder in der URL / Browser Console).

-- 1. PRÜFEN: EXISTIERT IHR PROFIL?
-- Wenn hier kein Ergebnis kommt, hat der Sync nicht funktioniert.
SELECT * FROM profiles;

-- 2. PRÜFEN: HAT IHR PROFIL EINE FIRMA?
-- Wenn company_id NULL ist, können Sie keine Job-Profile sehen.
SELECT user_id, email, company_id, company_name FROM profiles;

-- 3. PRÜFEN: WELCHE ROLLE HABEN SIE?
-- Sie benötigen 'admin' oder 'hr_manager' für Schreibzugriff.
SELECT * FROM user_roles;

-- 4. PRÜFEN: EXISTIERT DIE FIRMA?
SELECT * FROM companies;

-- 5. PRÜFEN: GIBT ES JOB-PROFILE FÜR DIESE FIRMA?
SELECT * FROM job_profiles;

-- ============================================================================
-- HILFE ZUR SELBSTHILFE
-- ============================================================================
-- FALL A: Profil fehlt
-- -> Melden Sie sich in der App ab und wieder an. Das Profil sollte automatisch erstellt werden.

-- FALL B: Firma fehlt / company_id ist NULL
-- -> Durchlaufen Sie das Onboarding (/onboarding) erneut oder fügen Sie manuell eine Firma hinzu:
-- INSERT INTO companies (name, created_by) VALUES ('Meine Firma', 'IHRE_CLERK_USER_ID_HIER') RETURNING id;
-- UPDATE profiles SET company_id = 'ID_VON_OBEN' WHERE user_id = 'IHRE_CLERK_USER_ID_HIER';

-- FALL C: Rolle fehlt
-- -> Fügen Sie sich manuell als Admin hinzu:
-- INSERT INTO user_roles (user_id, company_id, role) 
-- VALUES ('IHRE_CLERK_USER_ID_HIER', 'COMPANY_ID_VON_OBEN', 'admin');
