# 📦 Pay Equity Analysis - Implementierungs-Übersicht

## Erstellte Dateien

### 📊 Datenbank & Types

| Datei | Beschreibung |
|-------|-------------|
| `supabase/migrations/20260126_pay_equity_analysis.sql` | Komplettes DB-Schema (Tabellen, Funktionen, RLS) |
| `lib/types/pay-equity.ts` | TypeScript-Typen für alle Entitäten |

### 🤖 AI & Services

| Datei | Beschreibung |
|-------|-------------|
| `lib/services/gemini-service.ts` | Google Gemini AI Integration |
| `lib/supabase/server.ts` | Server-side Supabase Client |
| `lib/supabase/client.ts` | Client-side Supabase Re-Exports |

### 🔌 API Routes

| Datei | Beschreibung |
|-------|-------------|
| `app/api/pay-equity/update-stats/route.ts` | PayGroup-Statistiken berechnen |
| `app/api/pay-equity/generate-explanation/route.ts` | AI-Erklärungen generieren |
| `app/api/pay-equity/simulate/route.ts` | What-If-Simulationen |
| `app/api/pay-equity/chat/route.ts` | AI-Chat für Fragen |

### 🎯 Dashboards (Pages)

| Datei | Route | Zielgruppe |
|-------|-------|-----------|
| `app/(app)/dashboard/my-salary/page.tsx` | `/dashboard/my-salary` | Mitarbeiter |
| `app/(app)/dashboard/hr-analytics/page.tsx` | `/dashboard/hr-analytics` | HR-Manager |
| `app/(app)/dashboard/management/page.tsx` | `/dashboard/management` | Management |

### 🧩 Komponenten

| Datei | Beschreibung |
|-------|-------------|
| `components/pay-equity/PayEquityChat.tsx` | KI-Chat-Interface |

### 🪝 Custom Hooks

| Datei | Beschreibung |
|-------|-------------|
| `hooks/usePayEquity.ts` | Zentrale Pay-Equity-Logik (React Query) |

### 📚 Dokumentation

| Datei | Beschreibung |
|-------|-------------|
| `docs/PAY_EQUITY_ANALYSIS.md` | Feature-Dokumentation |
| `docs/IMPLEMENTATION_OVERVIEW.md` | Diese Datei |

### ⚙️ Konfiguration

| Datei | Änderung |
|-------|---------|
| `.env.example` | + GOOGLE_GEMINI_API_KEY |
| `package.json` | + @google/generative-ai |
| `hooks/useCompany.ts` | + currentCompany, isLoading Aliases |

---

## Datei-Struktur (Tree)

```
klargehalt-9c0827ae/
│
├── app/
│   ├── (app)/
│   │   └── dashboard/
│   │       ├── my-salary/
│   │       │   └── page.tsx          ← Mitarbeiter-Dashboard
│   │       ├── hr-analytics/
│   │       │   └── page.tsx          ← HR-Dashboard
│   │       └── management/
│   │           └── page.tsx          ← Management-Dashboard
│   │
│   └── api/
│       └── pay-equity/
│           ├── update-stats/
│           │   └── route.ts          ← Stats berechnen
│           ├── generate-explanation/
│           │   └── route.ts          ← AI-Erklärung
│           ├── simulate/
│           │   └── route.ts          ← Simulation
│           └── chat/
│               └── route.ts          ← AI-Chat
│
├── components/
│   └── pay-equity/
│       └── PayEquityChat.tsx         ← Chat-Komponente
│
├── hooks/
│   └── usePayEquity.ts               ← Custom Hook
│
├── lib/
│   ├── services/
│   │   └── gemini-service.ts         ← Gemini AI
│   ├── supabase/
│   │   ├── server.ts                 ← Server Client
│   │   └── client.ts                 ← Client Exports
│   └── types/
│       └── pay-equity.ts             ← TypeScript Types
│
├── supabase/
│   └── migrations/
│       └── 20260126_pay_equity_analysis.sql  ← DB Schema
│
└── docs/
    ├── PAY_EQUITY_ANALYSIS.md        ← Feature-Docs
    └── IMPLEMENTATION_OVERVIEW.md    ← Diese Datei
```

---

## Installation & Setup (Quick Start)

### 1. Dependencies installieren

```bash
npm install @google/generative-ai
```

✅ **Status:** Bereits installiert!

### 2. Environment Variable setzen

Füge zur `.env` hinzu:

```env
GOOGLE_GEMINI_API_KEY=your-gemini-api-key-here
```

**API Key holen:**  
→ https://makersuite.google.com/app/apikey

### 3. Datenbank-Migration

1. Öffne **Supabase Dashboard** → SQL Editor
2. Öffne Datei: `supabase/migrations/20260126_pay_equity_analysis.sql`
3. Kopiere kompletten Inhalt
4. Füge in SQL Editor ein und klicke **Run**

### 4. Entwicklungs-Server starten

```bash
npm run dev
```

### 5. Testen

1. **HR-Analytics:**  
   → http://localhost:3000/dashboard/hr-analytics  
   → Klicke "Aktualisieren" um Stats zu berechnen

2. **Mitarbeiter-Ansicht:**  
   → http://localhost:3000/dashboard/my-salary  
   → Siehe eigenen Gehaltsvergleich

3. **Management:**  
   → http://localhost:3000/dashboard/management  
   → Siehe KPIs und Simulation

---

## Code-Statistiken

| Kategorie | Anzahl | Zeilen (ca.) |
|-----------|--------|--------------|
| SQL-Migrationen | 1 | ~600 |
| TypeScript-Dateien | 10 | ~2500 |
| React-Pages | 3 | ~900 |
| API-Routes | 4 | ~600 |
| Komponenten | 1 | ~200 |
| Hooks | 1 | ~200 |
| Services | 1 | ~300 |
| **Gesamt** | **21** | **~5300** |

---

## TypeScript Types

Alle wichtigen Types sind definiert in `lib/types/pay-equity.ts`:

- `PayGroup` - Vergleichsgruppe
- `PayGroupStats` - Statistiken
- `EmployeeComparison` - Mitarbeiter-Vergleich
- `GenderGapHistory` - Gap-Verlauf
- `SalarySimulation` - Simulation
- `ManagementKPIs` - KPI-Übersicht
- `HRDashboardFilters` - Filter-Optionen

---

## API Endpoints

### POST /api/pay-equity/update-stats

Berechnet PayGroup-Statistiken neu.

**Request:**
```json
{
  "company_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "groups_updated": 5
}
```

### POST /api/pay-equity/generate-explanation

Generiert KI-Erklärung für Mitarbeiter.

**Request:**
```json
{
  "employee_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "explanation": "Dein Gehalt liegt 6% unter...",
  "comparison": { ... }
}
```

### POST /api/pay-equity/simulate

Führt What-If-Simulation durch.

**Request:**
```json
{
  "company_id": "uuid",
  "simulation_type": "raise_to_median"
}
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "total_cost": 45000,
    "affected_employees": 12
  },
  "breakdown": [ ... ]
}
```

### POST /api/pay-equity/chat

KI-Chat für Fragen.

**Request:**
```json
{
  "question": "Wie setzt sich meine Vergleichsgruppe zusammen?",
  "employee_id": "uuid",
  "history": []
}
```

**Response:**
```json
{
  "success": true,
  "answer": "Deine Vergleichsgruppe besteht aus..."
}
```

---

## Datenbank-Funktionen

### SQL: update_pay_group_stats(company_id UUID)

Berechnet automatisch:
- PayGroup-Erstellung für alle Kombinationen
- Durchschnitt, Median, Min, Max
- Geschlechtsspezifische Statistiken
- Gender Pay Gap

**Aufruf:**
```sql
SELECT update_pay_group_stats('your-company-id-here');
```

### SQL: calculate_gender_gap(avg_male, avg_female)

Formel: `(avg_male - avg_female) / avg_male * 100`

### SQL: get_gap_status(gap_percent)

Returns: `'green'`, `'yellow'`, or `'red'`

---

## Komponenten-Verwendung

### PayEquityChat Komponente

```tsx
import { PayEquityChat } from '@/components/pay-equity/PayEquityChat';

function MyPage() {
  return (
    <PayEquityChat 
      employeeId="uuid-here"
      companyId="uuid-here"
    />
  );
}
```

---

## Custom Hook Verwendung

```tsx
import { usePayGroups, useManagementKPIs } from '@/hooks/usePayEquity';

function MyComponent() {
  const { currentCompany } = useCompany();
  const { data: payGroups, isLoading } = usePayGroups(currentCompany?.id);
  const { data: kpis } = useManagementKPIs(currentCompany?.id);
  
  // ...
}
```

---

## Testing-Checklist

- [ ] Datenbank-Migration erfolgreich
- [ ] Gemini API-Key konfiguriert
- [ ] HR-Dashboard lädt PayGroups
- [ ] Statistiken können berechnet werden
- [ ] Mitarbeiter sieht eigenen Vergleich
- [ ] KI-Erklärung wird generiert
- [ ] Management-KPIs werden angezeigt
- [ ] Simulation funktioniert
- [ ] Chat antwortet auf Fragen

---

## Bekannte Probleme & Lösungen

### Problem: "Cannot find module '@/lib/supabase/server'"

✅ **Gelöst:** `lib/supabase/server.ts` und `client.ts` erstellt

### Problem: "Property 'currentCompany' does not exist"

✅ **Gelöst:** `useCompany` Hook erweitert mit Aliases

### Problem: Gemini API gibt Fehler zurück

**Lösung:** 
1. Check API-Key in `.env`
2. Fallback auf regel-basierte Erklärungen ist implementiert

---

## Performance-Hinweise

- **PayGroup-Berechnung:** Kann bei >1000 Mitarbeitern 5-10 Sekunden dauern
- **Gemini AI:** Antwortet in 1-3 Sekunden
- **Simulationen:** Sollten gecached werden für große Unternehmen

---

**Stand:** 26.01.2026  
**Autor:** Antigravity AI  
**Status:** ✅ MVP Complete

---

## Open Tasks (Next Steps)

### 🏗️ Self-Service "Basic Tier" Features
- [ ] **Struktur-Builder UI:** Interface zum Anlegen und Bearbeiten von Job-Familien, Levels und Kategorien (ohne SQL).
- [ ] **Kriterien-Editor:** UI zur Definition von objektiven Gehaltsfaktoren (Erfahrung, Verantwortung, Leistung).
- [ ] **Billing Integration:** Automatische Zuweisung des `subscription_tier` nach erfolgreicher Zahlung mit Stripe.

