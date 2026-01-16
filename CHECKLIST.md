# ✅ KlarGehalt - Setup & Deployment Checkliste

## 🎯 Schnell-Checkliste

- [ ] Supabase-Projekt erstellt
- [ ] Datenbank-Setup ausgeführt (`COMPLETE_SETUP.sql`)
- [ ] Umgebungsvariablen konfiguriert (`.env`)
- [ ] Dependencies installiert (`npm install`)
- [ ] Dev-Server läuft (`npm run dev`)
- [ ] Registrierung funktioniert
- [ ] Onboarding funktioniert
- [ ] Dashboard funktioniert

---

## 📋 Detaillierte Checkliste

### 1. Supabase-Setup

#### 1.1 Projekt erstellen
- [ ] Supabase Account erstellt
- [ ] Neues Projekt angelegt
- [ ] Projekt-URL notiert
- [ ] Anon Key notiert

#### 1.2 Datenbank einrichten
- [ ] SQL Editor geöffnet
- [ ] `COMPLETE_SETUP.sql` ausgeführt
- [ ] `VERIFY_SETUP.sql` ausgeführt
- [ ] Alle Checks zeigen ✅ PASS

#### 1.3 Verifizierung
```sql
-- Diese Query sollte 10 Tabellen zurückgeben
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

- [ ] 10 Tabellen existieren
- [ ] RLS ist auf allen Tabellen aktiviert
- [ ] Policies sind erstellt

### 2. Lokale Entwicklung

#### 2.1 Repository
- [ ] Repository geklont/heruntergeladen
- [ ] In Projektverzeichnis navigiert

#### 2.2 Dependencies
```bash
npm install
```
- [ ] Alle Packages installiert
- [ ] Keine Fehler bei Installation

#### 2.3 Umgebungsvariablen
```bash
cp .env.example .env
```
- [ ] `.env` Datei erstellt
- [ ] `NEXT_PUBLIC_SUPABASE_URL` eingetragen
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` eingetragen

#### 2.4 Development Server
```bash
npm run dev
```
- [ ] Server startet ohne Fehler
- [ ] App läuft auf http://localhost:3000
- [ ] Keine Console-Errors

### 3. Funktions-Tests

#### 3.1 Landing Page
- [ ] http://localhost:3000 lädt
- [ ] Header wird angezeigt
- [ ] Alle Sections laden
- [ ] Navigation funktioniert

#### 3.2 Authentifizierung
- [ ] http://localhost:3000/auth lädt
- [ ] Registrierung funktioniert
- [ ] Login funktioniert
- [ ] Profil wird automatisch erstellt

#### 3.3 Onboarding
- [ ] Nach Registrierung als Admin/HR → Weiterleitung zu /onboarding
- [ ] Schritt 1: Rolle wählen funktioniert
- [ ] Schritt 2: Mitarbeiteranzahl wählen funktioniert
- [ ] Schritt 3: Beratungsoption wählen funktioniert
- [ ] Schritt 4: Unternehmensdaten eingeben funktioniert
- [ ] Schritt 5: Zusammenfassung wird angezeigt
- [ ] Abschluss erstellt Firma in Datenbank

#### 3.4 Dashboard
- [ ] http://localhost:3000/dashboard lädt
- [ ] Firma wird angezeigt (nach Onboarding)
- [ ] Navigation funktioniert
- [ ] Alle Views laden

#### 3.5 Beratungsbuchung
- [ ] http://localhost:3000/book-consulting lädt
- [ ] Schritt 1: Format wählen funktioniert
- [ ] Schritt 2: Kalender funktioniert
- [ ] Schritt 2: Zeitslots werden angezeigt
- [ ] Schritt 2: Kontaktformular funktioniert
- [ ] Schritt 3: Bestätigung wird angezeigt
- [ ] Buchung wird in Datenbank gespeichert

### 4. Datenbank-Verifizierung

#### 4.1 Tabellen-Check
```sql
-- Sollte 10 Zeilen zurückgeben
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
```
- [ ] Ergebnis: 10

#### 4.2 RLS-Check
```sql
-- Sollte 10 Zeilen zurückgeben (alle mit rowsecurity = true)
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';
```
- [ ] Alle Tabellen haben RLS aktiviert

#### 4.3 Policies-Check
```sql
-- Sollte mindestens 25 Policies zurückgeben
SELECT COUNT(*) FROM pg_policies 
WHERE schemaname = 'public';
```
- [ ] Mindestens 25 Policies

#### 4.4 Test-Daten
```sql
-- Nach Registrierung und Onboarding
SELECT * FROM profiles LIMIT 1;
SELECT * FROM companies LIMIT 1;
SELECT * FROM user_roles LIMIT 1;
```
- [ ] Profil existiert
- [ ] Firma existiert
- [ ] Rolle existiert

### 5. Production Build

#### 5.1 Build-Test
```bash
npm run build
```
- [ ] Build erfolgreich
- [ ] Keine Fehler
- [ ] Keine Warnungen (oder nur harmlose)

#### 5.2 Production-Test
```bash
npm run start
```
- [ ] Production-Server startet
- [ ] App funktioniert im Production-Mode

### 6. Deployment (Optional)

#### 6.1 Vercel
- [ ] Repository auf GitHub gepusht
- [ ] Vercel-Projekt erstellt
- [ ] Repository verbunden
- [ ] Environment Variables gesetzt
- [ ] Deployment erfolgreich
- [ ] Live-URL funktioniert

#### 6.2 Environment Variables in Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_URL` gesetzt
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` gesetzt
- [ ] Deployment neu gestartet

### 7. Sicherheit

#### 7.1 Umgebungsvariablen
- [ ] `.env` ist in `.gitignore`
- [ ] Keine Secrets im Code
- [ ] Keine Secrets in Git-History

#### 7.2 Supabase
- [ ] RLS ist aktiviert
- [ ] Policies sind korrekt
- [ ] Anon Key ist public (OK)
- [ ] Service Role Key ist NICHT im Frontend

#### 7.3 HTTPS
- [ ] Production verwendet HTTPS
- [ ] Keine Mixed Content Warnings

### 8. Performance

#### 8.1 Lighthouse-Score
- [ ] Performance > 80
- [ ] Accessibility > 90
- [ ] Best Practices > 90
- [ ] SEO > 90

#### 8.2 Loading-Zeiten
- [ ] Landing Page < 2s
- [ ] Dashboard < 3s
- [ ] Keine langsamen Queries

### 9. Dokumentation

#### 9.1 Projekt-Dokumentation
- [ ] README.md vollständig
- [ ] Alle Docs vorhanden
- [ ] Setup-Anleitung klar

#### 9.2 Code-Dokumentation
- [ ] Wichtige Funktionen kommentiert
- [ ] Komplexe Logik erklärt
- [ ] TODOs dokumentiert

### 10. Wartung

#### 10.1 Monitoring
- [ ] Vercel Analytics aktiviert (falls Vercel)
- [ ] Error-Tracking eingerichtet (optional)
- [ ] Logs werden überwacht

#### 10.2 Backups
- [ ] Supabase Auto-Backups aktiviert
- [ ] Backup-Strategie definiert

#### 10.3 Updates
- [ ] Update-Prozess dokumentiert
- [ ] Dependency-Updates geplant

---

## 🎯 Minimale Checkliste für "Es funktioniert"

1. ✅ Supabase-Datenbank eingerichtet
2. ✅ `.env` konfiguriert
3. ✅ `npm install` ausgeführt
4. ✅ `npm run dev` läuft
5. ✅ Registrierung funktioniert
6. ✅ Onboarding funktioniert
7. ✅ Dashboard lädt

**Wenn diese 7 Punkte erfüllt sind, ist die App einsatzbereit! 🎉**

---

## 🚨 Häufige Probleme

### Problem: "Error creating company: {}"
**Lösung:** 
- Datenbank-Migration nicht ausgeführt
- `COMPLETE_SETUP.sql` in Supabase ausführen

### Problem: "supabaseUrl is required"
**Lösung:**
- `.env` Datei fehlt oder falsch
- Umgebungsvariablen prüfen
- Server neu starten

### Problem: "permission denied for table"
**Lösung:**
- RLS-Policies fehlen
- `COMPLETE_SETUP.sql` erneut ausführen

### Problem: "relation does not exist"
**Lösung:**
- Tabelle wurde nicht erstellt
- `COMPLETE_SETUP.sql` ausführen

---

## 📞 Support

Bei Problemen:
1. Prüfe diese Checkliste
2. Lies die Dokumentation in `docs/`
3. Prüfe Browser-Console auf Fehler
4. Prüfe Supabase Logs

---

**Viel Erfolg! 🚀**
