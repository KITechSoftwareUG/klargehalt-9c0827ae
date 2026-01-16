# 🔧 Datenbank-Migrationen ausführen

## Problem: "Error creating company: {}"

Dieser Fehler tritt auf, wenn die `companies` Tabelle nicht existiert oder die RLS-Policies den Zugriff blockieren.

## ✅ Lösung: Migrationen ausführen

### Option 1: Supabase Dashboard (Empfohlen)

1. **Öffne das Supabase Dashboard**
   - Gehe zu: https://supabase.com/dashboard
   - Wähle dein Projekt: `gdiefibmquualkfrthog`

2. **SQL Editor öffnen**
   - Linke Sidebar → "SQL Editor"
   - Klicke auf "New query"

3. **Migration ausführen**
   - Öffne die Datei: `supabase/migrations/20260114_create_companies_table.sql`
   - Kopiere den gesamten Inhalt
   - Füge ihn in den SQL Editor ein
   - Klicke auf "Run" (oder Strg+Enter)

4. **Weitere Migrationen**
   Führe auch diese Migrationen aus (in dieser Reihenfolge):
   
   a) `20260114_create_onboarding_table.sql`
   b) `20260114_create_consultation_bookings.sql`

5. **Überprüfung**
   ```sql
   -- Prüfe ob die Tabelle existiert
   SELECT * FROM companies LIMIT 1;
   
   -- Prüfe RLS Policies
   SELECT * FROM pg_policies WHERE tablename = 'companies';
   ```

### Option 2: Supabase CLI

```bash
# Wenn du Supabase CLI installiert hast
supabase db push

# Oder einzelne Migration
supabase db push --file supabase/migrations/20260114_create_companies_table.sql
```

### Option 3: Manuell mit psql

```bash
# Verbinde dich mit deiner Datenbank
psql "postgresql://postgres:[DEIN_PASSWORD]@db.gdiefibmquualkfrthog.supabase.co:5432/postgres"

# Führe die Migration aus
\i supabase/migrations/20260114_create_companies_table.sql
```

## 📋 Benötigte Migrationen

### 1. Companies Table
**Datei:** `supabase/migrations/20260114_create_companies_table.sql`

**Was wird erstellt:**
- ✅ `companies` Tabelle mit allen Spalten
- ✅ RLS Policies für Zugriffskontrolle
- ✅ Indexes für Performance
- ✅ Trigger für `updated_at`

### 2. Onboarding Data
**Datei:** `supabase/migrations/20260114_create_onboarding_table.sql`

**Was wird erstellt:**
- ✅ `onboarding_data` Tabelle
- ✅ RLS Policies
- ✅ Indexes

### 3. Consultation Bookings
**Datei:** `supabase/migrations/20260114_create_consultation_bookings.sql`

**Was wird erstellt:**
- ✅ `consultation_bookings` Tabelle
- ✅ RLS Policies
- ✅ Indexes
- ✅ Trigger für `updated_at`

## 🧪 Nach der Migration testen

1. **Im Browser**
   - Gehe zu `/dashboard`
   - Klicke auf "Firma einrichten"
   - Fülle das Formular aus
   - Speichern
   - ✅ Sollte jetzt funktionieren!

2. **In der Datenbank prüfen**
   ```sql
   -- Neue Firma sollte sichtbar sein
   SELECT * FROM companies ORDER BY created_at DESC LIMIT 5;
   
   -- Profil sollte company_id haben
   SELECT user_id, company_id, company_name FROM profiles;
   ```

## ⚠️ Häufige Probleme

### Problem: "permission denied for table companies"
**Lösung:** RLS Policies wurden nicht korrekt erstellt
```sql
-- Policies neu erstellen
DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

### Problem: "relation companies does not exist"
**Lösung:** Tabelle wurde nicht erstellt
- Migration erneut ausführen
- Überprüfen ob Fehler im SQL aufgetreten sind

### Problem: "column 'size' does not exist"
**Lösung:** Alte Tabelle ohne neue Spalten
```sql
-- Spalten hinzufügen
ALTER TABLE companies ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
```

## 📊 Datenbank-Status prüfen

```sql
-- Alle Tabellen anzeigen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Spalten der companies Tabelle
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
ORDER BY ordinal_position;

-- RLS Status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('companies', 'onboarding_data', 'consultation_bookings');

-- Policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('companies', 'onboarding_data', 'consultation_bookings');
```

## 🔄 Migration zurücksetzen (falls nötig)

```sql
-- NUR im Notfall!
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS onboarding_data CASCADE;
DROP TABLE IF EXISTS consultation_bookings CASCADE;

-- Dann Migration neu ausführen
```

## ✅ Checkliste

Nach erfolgreicher Migration sollten folgende Dinge funktionieren:

- [ ] Tabelle `companies` existiert
- [ ] RLS ist aktiviert
- [ ] Policies erlauben INSERT für authentifizierte User
- [ ] Firma kann über UI erstellt werden
- [ ] Firma wird in Datenbank gespeichert
- [ ] `company_id` wird im Profil gesetzt
- [ ] Onboarding funktioniert
- [ ] Beratungstermin-Buchung funktioniert

## 📞 Support

Wenn Probleme auftreten:
1. Prüfe die Browser-Konsole auf Fehler
2. Prüfe die Supabase Logs
3. Führe die SQL-Checks oben aus
4. Stelle sicher, dass du angemeldet bist

---

**Nach der Migration sollte alles funktionieren! 🎉**
