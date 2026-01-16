# 🚀 KlarGehalt - Komplette Datenbank-Einrichtung

## Schnellstart für neue Supabase-Instanz

### Schritt 1: Supabase Dashboard öffnen
1. Gehe zu: https://supabase.com/dashboard
2. Wähle dein Projekt aus

### Schritt 2: SQL Editor öffnen
1. Linke Sidebar → **"SQL Editor"**
2. Klicke auf **"New query"**

### Schritt 3: Komplettes Setup ausführen
1. Öffne die Datei: **`supabase/migrations/COMPLETE_SETUP.sql`**
2. **Kopiere den GESAMTEN Inhalt** (alle ~700 Zeilen)
3. Füge ihn in den SQL Editor ein
4. Klicke auf **"Run"** (oder `Strg+Enter`)
5. ⏳ Warte ca. 10-20 Sekunden

### Schritt 4: Überprüfung
Am Ende des Skripts wird automatisch eine Liste aller Tabellen angezeigt:

```
table_name                | column_count
--------------------------+-------------
audit_logs                | 9
companies                 | 14
consultation_bookings     | 19
employees                 | 15
info_requests             | 11
job_profiles              | 11
onboarding_data           | 7
pay_bands                 | 13
profiles                  | 9
user_roles                | 6
```

✅ **Wenn du diese 10 Tabellen siehst, ist alles korrekt eingerichtet!**

## 📊 Was wurde erstellt?

### Tabellen (10 Stück)

1. **profiles** - Benutzerprofile
2. **companies** - Firmendaten
3. **user_roles** - Benutzerrollen (admin, hr_manager, employee)
4. **job_profiles** - Stellenprofile
5. **pay_bands** - Gehaltsbänder
6. **employees** - Mitarbeiterdaten
7. **info_requests** - Auskunftsanfragen (EU-Compliance)
8. **audit_logs** - Audit-Trail
9. **onboarding_data** - Onboarding-Daten
10. **consultation_bookings** - Beratungstermine

### Sicherheit

- ✅ **Row Level Security (RLS)** auf allen Tabellen aktiviert
- ✅ **Policies** für sichere Datenzugriffe
- ✅ **Foreign Keys** für Datenintegrität
- ✅ **Indexes** für Performance

### Automatisierung

- ✅ **Triggers** für `updated_at` Timestamps
- ✅ **Auto-Profil-Erstellung** bei User-Registrierung
- ✅ **UUID-Generierung** für alle IDs

## 🧪 Nach dem Setup testen

### 1. Registrierung testen
```
http://localhost:3000/auth
→ Neuen Account erstellen
→ Profil sollte automatisch erstellt werden
```

### 2. Onboarding testen
```
Als Admin/HR-Manager registrieren
→ Automatisch zu /onboarding
→ 5 Schritte durchlaufen
→ Firma wird erstellt
```

### 3. Dashboard testen
```
http://localhost:3000/dashboard
→ Firma einrichten (falls noch nicht)
→ Mitarbeiter anlegen
→ Gehaltsbänder definieren
```

### 4. Beratungstermin testen
```
http://localhost:3000/book-consulting
→ Format wählen
→ Termin buchen
→ Bestätigung erhalten
```

## 🔍 Datenbank-Checks

### Alle Tabellen anzeigen
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### RLS-Status prüfen
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Policies prüfen
```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Indexes prüfen
```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## 🔧 Troubleshooting

### Problem: "relation already exists"
**Lösung:** Tabellen existieren bereits. Entweder:
- Skript erneut ausführen (ist idempotent)
- Oder alte Tabellen löschen:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
-- Dann COMPLETE_SETUP.sql erneut ausführen
```

### Problem: "permission denied"
**Lösung:** Du bist nicht als Postgres-User angemeldet
- Im Supabase Dashboard sollte das automatisch funktionieren
- Stelle sicher, dass du im richtigen Projekt bist

### Problem: "function does not exist"
**Lösung:** Extensions fehlen
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## 📋 Checkliste

Nach erfolgreicher Einrichtung:

- [ ] 10 Tabellen existieren
- [ ] RLS ist auf allen Tabellen aktiviert
- [ ] Policies sind erstellt
- [ ] Indexes sind erstellt
- [ ] Triggers funktionieren
- [ ] Auto-Profil-Erstellung funktioniert
- [ ] Registrierung funktioniert
- [ ] Onboarding funktioniert
- [ ] Firma kann erstellt werden
- [ ] Dashboard lädt

## 🎯 Nächste Schritte

1. ✅ Datenbank ist eingerichtet
2. ✅ App läuft auf `http://localhost:3000`
3. ✅ Registriere einen Test-Account
4. ✅ Durchlaufe das Onboarding
5. ✅ Teste alle Features

## 📞 Support

Bei Problemen:
- Prüfe die Browser-Konsole
- Prüfe die Supabase Logs
- Führe die SQL-Checks oben aus

## 🔐 Wichtig: Umgebungsvariablen

Stelle sicher, dass deine `.env` Datei korrekt ist:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[DEIN_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[DEIN_ANON_KEY]
```

Diese findest du in:
**Supabase Dashboard → Settings → API**

---

## ✨ Das war's!

Deine KlarGehalt-Datenbank ist jetzt vollständig eingerichtet und einsatzbereit! 🎉

**Geschätzte Einrichtungszeit:** 2-3 Minuten
**Anzahl SQL-Zeilen:** ~700
**Anzahl Tabellen:** 10
**Anzahl Policies:** ~30
**Anzahl Indexes:** ~40
