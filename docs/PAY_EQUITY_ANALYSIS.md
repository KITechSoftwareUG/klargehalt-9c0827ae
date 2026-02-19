# 🎯 Pay Equity Analysis - MVP Dokumentation

## Übersicht

Dieses Feature implementiert KI-gestützte Pay-Equity-Analysen gemäß der EU-Entgelttransparenzrichtlinie mit dem Fokus auf:

- **Vergleichsgruppen-Logik** (PayGroups)
- **Gender Pay Gap Berechnungen**
- **3 Dashboard-Ansichten** (Mitarbeiter / HR / Management)
- **KI-Erklärungen** mit Google Gemini
- **What-If-Simulationen**

---

## 📋 Implementierte Features

### ✅ 1. Vergleichsgruppen-Logik (Kern der Richtlinie)

Ein Mitarbeiter gehört zu einer Vergleichsgruppe (`PayGroup`), wenn:
- Gleiche **Job-Family** (z.B. "Engineering", "Sales")
- Gleiches **Level** (z.B. "Junior", "Senior")
- Gleicher **Standort** (z.B. "München", "Berlin")
- Gleiche **Beschäftigungsart** (z.B. "Vollzeit", "Teilzeit")

Für jede PayGroup wird automatisch berechnet:
- ✅ Durchschnittsgehalt (gesamt & nach Geschlecht)
- ✅ Median (gesamt & nach Geschlecht)
- ✅ Min / Max
- ✅ **Gender Pay Gap**: `(Ø Männer – Ø Frauen) / Ø Männer * 100`

**Ampel-System:**
- 🟢 **Grün**: Gap < 3% (unkritisch)
- 🟡 **Gelb**: Gap 3-5% (beobachten)
- 🔴 **Rot**: Gap > 5% (Handlungsbedarf)

---

### ✅ 2. Dashboard 1: Mitarbeiter-Ansicht (`/dashboard/my-salary`)

**Zielgruppe:** Einzelne Mitarbeiter

**Elemente:**
- ✅ Eigene Gehaltszahl
- ✅ Balken-Chart: Eigener Wert vs. Gruppen-Median vs. Gruppen-Durchschnitt
- ✅ KI-Erklärung mit Gemini
- ✅ Vergleichsgruppen-Info (Größe, Zusammensetzung)

**Beispiel KI-Text:**
> "Dein Gehalt liegt 6 % unter dem Durchschnitt deiner Vergleichsgruppe. Die Vergleichsgruppe besteht aus 12 Personen mit gleicher Rolle, gleichem Level und Standort. Ein Teil der Abweichung erklärt sich durch kürzere Betriebszugehörigkeit."

---

### ✅ 3. Dashboard 2: HR-Analyse (`/dashboard/hr-analytics`)

**Zielgruppe:** HR-Manager

**Elemente:**
- ✅ Tabelle mit allen PayGroups
- ✅ Spalte: Gender-Gap % mit **Ampel**-Farben
- ✅ Filter:
  - Job-Familie
  - Job-Level
  - Standort
  - Gender-Gap-Status
- ✅ KI-Hinweis-Box für kritische Gruppen

**Beispiel KI-Hinweis:**
> "Diese Abweichung ist statistisch auffällig und überschreitet den 5 %-Schwellenwert."

---

### ✅ 4. Dashboard 3: Management-Übersicht (`/dashboard/management`)

**Zielgruppe:** C-Level / Management

**Nur 3 zentrale Kennzahlen:**
1. ✅ **Anzahl kritischer Gruppen** (Gap > 5%)
2. ✅ **Größter Gap** (in % und betroffene Gruppe)
3. ✅ **Geschätzter Anpassungsaufwand** (€/Jahr)

**What-If-Simulation:**
- ✅ Simulation: "Alle Frauen auf Median anheben"
- ✅ Zeigt: Kosten, betroffene Mitarbeiter, neue Gap-Werte
- ✅ Detail-Tabelle mit individuellen Anpassungen

**Beispiel:**
> "Wenn alle Frauen in Gruppe X auf Median angehoben werden: **+€45.000 / Jahr**"

---

### ✅ 5. KI-Chat (Minimalversion)

**Route:** `/api/pay-equity/chat`  
**Komponente:** `<PayEquityChat />`

**Erlaubte Fragen:**
- "Wie setzt sich mein Vergleich zusammen?"
- "Warum gibt es hier einen Gap?"
- "Was bedeutet der 5%-Wert?"

**Antwortregeln:**
- ✅ Nur aus vorhandenen Daten
- ✅ Keine Rechtsberatung
- ✅ Keine Schuldzuweisung
- ✅ Freundliche, verständliche Sprache

---

## 🗄️ Datenbank-Schema

### Neue Tabellen

| Tabelle | Beschreibung |
|---------|-------------|
| `pay_groups` | Vergleichsgruppen (Job-Family, Level, Location, Employment Type) |
| `pay_group_stats` | Berechnete Statistiken (Avg, Median, Min, Max, Gender Gap) |
| `employee_comparisons` | Mitarbeiter-zu-Gruppe-Vergleich |
| `gender_gap_history` | Historisches Tracking von Gender Gaps |
| `salary_simulations` | What-If-Simulationen |

### SQL-Funktionen

| Funktion | Beschreibung |
|----------|-------------|
| `update_pay_group_stats(company_id)` | Berechnet alle PayGroup-Statistiken neu |
| `calculate_gender_gap(avg_male, avg_female)` | Berechnet Gender Pay Gap |
| `get_gap_status(gap_percent)` | Bestimmt Ampel-Status (green/yellow/red) |

### Migration ausführen

```bash
# In Supabase SQL Editor:
# 1. Datei öffnen: supabase/migrations/20260126_pay_equity_analysis.sql
# 2. Gesamten Inhalt kopieren und ausführen
```

---

## 🔧 Setup & Installation

### 1. Gemini API Key holen

1. Gehe zu https://makersuite.google.com/app/apikey
2. Erstelle einen neuen API Key
3. Füge ihn zur `.env` hinzu:

```env
GOOGLE_GEMINI_API_KEY=your-gemini-api-key-here
```

### 2. Dependencies installieren

```bash
npm install @google/generative-ai
```

### 3. Datenbank-Migration

1. Öffne Supabase Dashboard → SQL Editor
2. Führe `supabase/migrations/20260126_pay_equity_analysis.sql` aus
3. Verifiziere die Installation (alle Tabellen sollten existieren)

### 4. Testdaten (Optional)

Für Tests sollten Sie Mitarbeiter mit folgenden Attributen anlegen:
- `job_profile_id` (verknüpft mit `job_profiles.category` und `.level`)
- `location` (z.B. "München", "Berlin")
- `employment_type` (z.B. "Vollzeit", "Teilzeit")
- `current_salary` (aktuelles Gehalt)
- `gender` ("male", "female", "other")
- `hire_date` (für Betriebszugehörigkeit)

---

## 🚀  Verwendung

### Für HR-Manager

1. **Statistiken berechnen:**
   - Gehe zu `/dashboard/hr-analytics`
   - Klicke "Aktualisieren"
   - System berechnet alle PayGroups und Statistiken

2. **Kritische Gruppen identifizieren:**
   - Filtere nach `Gap-Status: Kritisch`
   - Alle Gruppen mit >5% Gap werden angezeigt

3. **Simulation durchführen:**
   - Gehe zu `/dashboard/management`
   - Klicke "Simulation starten"
   - System zeigt Kosten für Gap-Schließung

### Für Mitarbeiter

1. **Eigenes Gehalt vergleichen:**
   - Gehe zu `/dashboard/my-salary`
   - System zeigt automatisch Vergleich mit PayGroup

2. **KI-Erklärung erhalten:**
   - Klicke "Erklärung generieren"
   - Gemini erstellt personalisierte Erklärung

3. **Fragen stellen:**
   - Nutze die `<PayEquityChat />` Komponente
   - Stelle Fragen zur Vergleichsgruppe

---

## 🎨 UI-Komponenten

### Neu erstellte Komponenten

| Komponente | Pfad | Verwendung |
|------------|------|-----------|
| MySalaryPage | `app/(app)/dashboard/my-salary/page.tsx` | Mitarbeiter-Dashboard |
| HRAnalyticsPage | `app/(app)/dashboard/hr-analytics/page.tsx` | HR-Dashboard |
| ManagementDashboardPage | `app/(app)/dashboard/management/page.tsx` | Management-Dashboard |
| PayEquityChat | `components/pay-equity/PayEquityChat.tsx` | KI-Chat-Interface |

### Custom Hooks

| Hook | Pfad | Zweck |
|------|------|-------|
| usePayEquity | `hooks/usePayEquity.ts` | Zentrale PayEquity-Logik |
| usePayGroups | `hooks/usePayEquity.ts` | Lade alle PayGroups |
| useEmployeeComparison | `hooks/usePayEquity.ts` | Lade Mitarbeiter-Vergleich |
| useManagementKPIs | `hooks/usePayEquity.ts` | Lade Management-KPIs |

### API Routes

| Route | Methode | Zweck |
|-------|---------|-------|
| `/api/pay-equity/update-stats` | POST | PayGroup-Stats neu berechnen |
| `/api/pay-equity/generate-explanation` | POST | KI-Erklärung generieren |
| `/api/pay-equity/simulate` | POST | Gehalts-Simulation durchführen |
| `/api/pay-equity/chat` | POST | KI-Chat-Anfragen |

---

## 🔒 Sicherheit & Berechtigungen

### Row Level Security (RLS)

Alle Tabellen haben RLS-Policies:

- **Mitarbeiter:** Sehen nur eigene Vergleichsdaten
- **HR-Manager:** Sehen alle Daten ihrer Firma
- **Admin:** Sehen alle Daten ihrer Firma

### API-Authentifizierung

Alle API-Routes prüfen:
1. ✅ Clerk-Authentifizierung (`currentUser()`)
2. ✅ Firma-Zugehörigkeit
3. ✅ Rollen-Berechtigung (für HR/Admin-Endpoints)

---

## 🎯 Abgrenzung zur Konkurrenz

**Was gradar & beqom machen:**
- Dashboards
- Reports
- Statistik

**Was KlarGehalt zusätzlich macht:**
- ✨ **Erklärende KI-Texte** (Gemini)
- ✨ **Dialogfähige KI** (Chat)
- ✨ **Mitarbeiter-Perspektive** (nicht nur HR)
- ✨ **Einfache Visuals** statt Analysten-UI
- ✨ **Weniger Konfiguration**, mehr Erklärung

---

## ✅ MVP-Erfolgskriterien (erfüllt)

- [x] **Vergleichsgruppen-Berechnung** funktioniert
- [x] **Gender-Gap-Berechnung** mit Ampel-System
- [x] **3 Dashboards** (Mitarbeiter / HR / Management)
- [x] **KI-Text-Generierung** (regelbasiert + Gemini)
- [x] **Filter & Visuals** (Tabellen, Charts)
- [x] **What-If-Simulation** (einfache Kostenberechnung)

### Woran man merkt, dass das MVP gut ist:

✅ **Mitarbeiter** verstehen ohne HR-Wissen, was ihr Vergleich bedeutet  
✅ **HR** sieht sofort, wo es kritisch wird  
✅ **Management** sieht Risiko + Kosten  
✅ **Niemand** muss eine Excel erklären

---

## 🚦 Nächste Schritte (Nice to Have)

- [ ] PDF-Download (statisch)
- [ ] E-Mail-Benachrichtigungen bei kritischen Gaps
- [ ] Erweiterte Chart-Typen (Trend-Analysen)
- [ ] Multi-Company-Benchmark
- [ ] Automatische monatliche Berechnungen

---

## 📞 Support

Bei Fragen oder Problemen:

1. **Dokumentation:** Diese README und Code-Kommentare
2. **Logs:** Supabase Dashboard → Logs
3. **Gemini-Fehler:** Check API-Key in `.env`
4. **Datenbank-Fehler:** Check RLS-Policies

---

**Version:** 1.0.0  
**Erstellt:** 26.01.2026  
**Status:** ✅ MVP Complete
