# 🚀 Pay Equity Analysis - Quick Start Guide

## 5-Minuten-Setup

### Schritt 1: Gemini API Key (2 Min)

1. Gehe zu: https://makersuite.google.com/app/apikey
2. Klicke "Create API Key"
3. Kopiere den Key

**Füge zur `.env` hinzu:**
```env
GOOGLE_GEMINI_API_KEY=dein-key-hier
```

### Schritt 2: Datenbank-Migration (2 Min)

1. Öffne **Supabase Dashboard**: https://supabase.com/dashboard
2. Wähle dein Projekt
3. Gehe zu **SQL Editor**
4. Öffne `supabase/migrations/20260126_pay_equity_analysis.sql`
5. Kopiere den **gesamten Inhalt**
6. Füge in SQL Editor ein
7. Klicke **Run** (⏵)

**Erwartete Ausgabe:**
```
Success. No rows returned
```

### Schritt 3: Server starten (1 Min)

```bash
npm run dev
```

### Schritt 4: Testen

Öffne: http://localhost:3000/dashboard/hr-analytics

---

## So funktioniert's

### 1. Als HR-Manager: Statistiken berechnen

```
1. Gehe zu /dashboard/hr-analytics
2. Klicke "Aktualisieren" (oben rechts)
3. Warte 5-10 Sekunden
4. Tabelle zeigt alle PayGroups mit Gender-Gap
```

**Was passiert?**
- System erstellt Vergleichsgruppen basierend auf:
  - Job-Familie (z.B. "Engineering")
  - Level (z.B. "Senior")
  - Standort (z.B. "München")
  - Beschäftigungsart (z.B. "Vollzeit")
- Berechnet Durchschnitt, Median, Min, Max
- Berechnet Gender Pay Gap
- Weist Ampel-Status zu (🟢 🟡 🔴)

### 2. Als Mitarbeiter: Gehalt vergleichen

```
1. Gehe zu /dashboard/my-salary
2. Siehe eigenes Gehalt vs. Gruppe
3. Lese KI-Erklärung
```

**Was wird angezeigt?**
- Dein Gehalt
- Gruppen-Median
- Gruppen-Durchschnitt
- Abweichung in %
- KI-generierte Erklärung

### 3. Als Management: KPIs ansehen

```
1. Gehe zu /dashboard/management
2. Siehe 3 Haupt-KPIs
3. Klicke "Simulation starten"
```

**KPIs:**
1. Anzahl kritischer Gruppen (>5% Gap)
2. Größter Gap
3. Geschätzte Kosten zur Gap-Schließung

---

## Testdaten erstellen

### Voraussetzung: Mitarbeiter müssen angelegt sein

Stelle sicher, dass deine `employees` folgende Felder haben:

```sql
-- Beispiel-Mitarbeiter
INSERT INTO employees (
  company_id,
  first_name,
  last_name,
  email,
  job_profile_id,
  location,
  employment_type,
  current_salary,
  gender,
  hire_date
) VALUES (
  'deine-company-id',
  'Max',
  'Mustermann',
  'max@example.com',
  'job-profile-id',
  'München',
  'Vollzeit',
  65000,
  'male',
  '2022-01-01'
);
```

**Wichtig:**
- `job_profile_id` muss existieren in `job_profiles`
- `gender` sollte `'male'` oder `'female'` sein
- `current_salary` ist das Jahresgehalt

---

## Erwartete Ergebnisse

### PayGroup wird erstellt wenn:

```
Mindestens 2 Mitarbeiter haben:
✓ Gleiche Job-Familie
✓ Gleiches Level
✓ Gleicher Standort
✓ Gleiche Beschäftigungsart
```

### Gender Gap wird berechnet wenn:

```
PayGroup hat:
✓ Mindestens 1 männlichen Mitarbeiter
✓ Mindestens 1 weiblichen Mitarbeiter
```

**Formel:**
```
Gap = (Ø Männer - Ø Frauen) / Ø Männer * 100
```

**Ampel-System:**
- 🟢 **Grün**: Gap < 3%
- 🟡 **Gelb**: Gap 3-5%
- 🔴 **Rot**: Gap > 5%

---

## Troubleshooting

### Problem: "No comparison group data available"

**Ursache:** Noch keine Stats berechnet oder keine passende PayGroup

**Lösung:**
1. Gehe zu `/dashboard/hr-analytics`
2. Klicke "Aktualisieren"
3. Warte bis "Statistiken aktualisiert"

### Problem: Gemini API Error

**Ursache:** API-Key fehlt oder ist ungültig

**Lösung:**
1. Check `.env`: `GOOGLE_GEMINI_API_KEY` gesetzt?
2. Falls nicht: Hole neuen Key von https://makersuite.google.com/app/apikey
3. Restart dev server: `npm run dev`

**Fallback:** Wenn Gemini fehlt, werden regelbasierte Texte verwendet!

### Problem: "Cannot find module '@/lib/supabase/server'"

**Ursache:** Fehlende Datei

**Lösung:** Sollte bereits erstellt sein. Falls nicht:
```bash
# Datei existiert?
ls lib/supabase/server.ts
```

### Problem: Tabelle `pay_groups` existiert nicht

**Ursache:** Migration nicht ausgeführt

**Lösung:**
1. Öffne Supabase Dashboard → SQL Editor
2. Führe Migration aus: `supabase/migrations/20260126_pay_equity_analysis.sql`

---

## Beispiel-Workflow

### Szenario: Neues Unternehmen mit 20 Mitarbeitern

**1. Mitarbeiter anlegen** (bereits vorhanden)
```
- 10 Engineers (5 Junior, 5 Senior)
- 5 Sales (3 Junior, 2 Senior)
- 5 Marketing (2 Junior, 3 Senior)

Standorte: München, Berlin
Gehälter: 40.000 - 80.000 €
Gender: gemischt
```

**2. Stats berechnen**
```
→ HR-Dashboard öffnen
→ "Aktualisieren" klicken
→ Ergebnis: ~6 PayGroups erstellt
```

**3. Ergebnisse ansehen**
```
→ HR sieht: Tabelle mit allen Gruppen + Gaps
→ Mitarbeiter sieht: Eigenen Vergleich
→ Management sieht: KPIs (z.B. "2 kritische Gruppen")
```

**4. Simulation durchführen**
```
→ Management-Dashboard öffnen
→ "Simulation starten"
→ Ergebnis: "Kosten: +€12.000/Jahr um Gaps zu schließen"
```

---

## Nächste Schritte

### Du bist jetzt ready! 🎉

**Empfohlene Reihenfolge:**
1. ✅ HR: Statistiken berechnen
2. ✅ HR: Kritische Gruppen identifizieren
3. ✅ Mitarbeiter: Eigenen Vergleich ansehen
4. ✅ Management: KPIs reviewen
5. ✅ Management: Simulation durchführen

### Weitere Dokumentation

- **Feature-Details:** [PAY_EQUITY_ANALYSIS.md](PAY_EQUITY_ANALYSIS.md)
- **Implementierung:** [IMPLEMENTATION_OVERVIEW.md](IMPLEMENTATION_OVERVIEW.md)
- **Haupt-Readme:** [../README.md](../README.md)

---

## Support

**Bei Fragen:**
1. Check Dokumentation (siehe oben)
2. Check Supabase Logs (Dashboard → Logs)
3. Check Browser Console (F12 → Console)

**Häufige Fehler:**
- Migration nicht ausgeführt → SQL ausführen
- API-Key fehlt → `.env` prüfen
- Keine Mitarbeiter → Testdaten erstellen

---

**Version:** 1.0  
**Stand:** 26.01.2026  
**Geschätzte Setup-Zeit:** ~5 Minuten

✨ **Viel Erfolg!**
