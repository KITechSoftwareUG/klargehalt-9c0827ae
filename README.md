# 🛡️ KlarGehalt - EU-Entgelttransparenz SaaS

> **B2B-Compliance-Plattform für die EU-Entgelttransparenzrichtlinie**

[![Next.js](https://img.shields.io/badge/Next.js-15.1.6-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38bdf8)](https://tailwindcss.com/)

## 📋 Inhaltsverzeichnis

- [Über das Projekt](#über-das-projekt)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Schnellstart](#schnellstart)
- [Datenbank-Setup](#datenbank-setup)
- [Entwicklung](#entwicklung)
- [Deployment](#deployment)
- [Dokumentation](#dokumentation)

## 🎯 Über das Projekt

KlarGehalt ist eine B2B-SaaS-Plattform, die Unternehmen bei der Umsetzung der **EU-Entgelttransparenzrichtlinie (2023/970)** unterstützt. Die Plattform bietet:

- ✅ **DSGVO-konforme** Datenverwaltung
- ✅ **Revisionssichere** Audit-Logs
- ✅ **Automatisierte** Compliance-Checks
- ✅ **Transparente** Gehaltsstrukturen
- ✅ **Mitarbeiter-Self-Service** für Auskunftsanfragen

## ✨ Features

### 🔐 Authentifizierung & Onboarding
- Multi-Rollen-System (Admin, HR-Manager, Mitarbeiter)
- 5-Schritte-Onboarding für neue Unternehmen
- Automatische Profil-Erstellung

### 🏢 Unternehmensverwaltung
- Firmenprofil mit vollständigen Stammdaten
- Branchenspezifische Konfiguration
- Mitarbeiteranzahl-Tracking

### 👥 Mitarbeiterverwaltung
- Mitarbeiter anlegen und verwalten
- Zuweisung zu Gehaltsbändern
- Stellenprofil-Verwaltung

### 💰 Gehaltsstrukturen
- Gehaltsbänder definieren
- Job-Profile erstellen
- Qualifikationen pro Band

### 📊 Compliance & Reporting
- Gender Pay Gap Analysen
- Gehaltsvergleiche
- Auskunftsanfragen-Management
- Revisionssichere Audit-Logs

### 🗓️ Beratungssystem
- Online-Terminbuchung
- 3 Beratungsformate (Video, Telefon, Vor Ort)
- Kalender-Integration

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod
- **State:** React Query (TanStack Query)

### Backend
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Real-time:** Supabase Realtime

### DevOps
- **Hosting:** Vercel (empfohlen)
- **CI/CD:** GitHub Actions (optional)
- **Monitoring:** Vercel Analytics

## 🚀 Schnellstart

### Voraussetzungen

- Node.js 18+ 
- npm oder yarn
- Supabase Account

### Installation

```bash
# Repository klonen
git clone <repository-url>
cd klargehalt-9c0827ae

# Dependencies installieren
npm install

# Umgebungsvariablen einrichten
cp .env.example .env
# .env mit deinen Supabase-Credentials füllen

# Development Server starten
npm run dev
```

Die App läuft jetzt auf **http://localhost:3000**

## 🗄️ Datenbank-Setup

### Option 1: Komplettes Setup (Empfohlen)

1. **Supabase Dashboard öffnen**
   - https://supabase.com/dashboard
   - Projekt auswählen

2. **SQL Editor öffnen**
   - Sidebar → "SQL Editor"
   - "New query"

3. **Setup-Skript ausführen**
   - Datei öffnen: `supabase/migrations/COMPLETE_SETUP.sql`
   - Gesamten Inhalt kopieren
   - In SQL Editor einfügen
   - "Run" klicken

4. **Verifizierung**
   - Datei öffnen: `supabase/migrations/VERIFY_SETUP.sql`
   - Ausführen
   - Alle Checks sollten ✅ PASS zeigen

### Option 2: Einzelne Migrationen

```bash
# Mit Supabase CLI
supabase db push

# Oder einzeln
supabase db push --file supabase/migrations/COMPLETE_SETUP.sql
```

### Umgebungsvariablen

Erstelle eine `.env` Datei:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[DEIN_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[DEIN_ANON_KEY]
```

Diese findest du in: **Supabase Dashboard → Settings → API**

## 💻 Entwicklung

### Verfügbare Scripts

```bash
# Development Server
npm run dev

# Production Build
npm run build

# Production Server starten
npm run start

# Linting
npm run lint
```

### Projektstruktur

```
klargehalt-9c0827ae/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root Layout
│   ├── page.tsx                 # Landing Page
│   ├── providers.tsx            # Global Providers
│   ├── globals.css              # Global Styles
│   ├── auth/                    # Auth Pages
│   ├── dashboard/               # Dashboard
│   ├── onboarding/              # Onboarding Flow
│   └── book-consulting/         # Beratungsbuchung
├── components/                   # React Components
│   ├── ui/                      # shadcn/ui Components
│   ├── dashboard/               # Dashboard Components
│   ├── Header.tsx               # Navigation
│   └── ...
├── hooks/                        # Custom Hooks
│   ├── useAuth.tsx              # Authentication
│   ├── useCompany.ts            # Company Management
│   └── ...
├── lib/                          # Utilities
│   ├── supabase/                # Supabase Clients
│   └── utils.ts                 # Helper Functions
├── supabase/                     # Database
│   └── migrations/              # SQL Migrations
├── docs/                         # Documentation
└── public/                       # Static Assets
```

## 🚢 Deployment

### Vercel (Empfohlen)

1. **Repository auf GitHub pushen**

2. **Vercel Dashboard**
   - https://vercel.com/new
   - Repository importieren

3. **Environment Variables setzen**
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

4. **Deploy**
   - Automatisch bei jedem Push

### Andere Plattformen

- **Netlify:** Unterstützt Next.js
- **Railway:** Unterstützt Next.js
- **Eigener Server:** `npm run build` && `npm run start`

## 📚 Dokumentation

### Guides

- [Onboarding-System](docs/ONBOARDING.md)
- [Beratungsbuchung](docs/CONSULTATION_BOOKING.md)
- [Datenbank-Setup](docs/SUPABASE_SETUP.md)
- [Datenbank-Migrationen](docs/DATABASE_MIGRATIONS.md)
- [Next.js Migration](MIGRATION.md)

### Quick Starts

- [Onboarding Quick Start](docs/ONBOARDING_QUICKSTART.md)
- [Beratung Quick Start](docs/CONSULTATION_BOOKING_QUICKSTART.md)

## 🔒 Sicherheit

- ✅ **Row Level Security (RLS)** auf allen Tabellen
- ✅ **DSGVO-konform** - Daten in EU-Servern
- ✅ **Verschlüsselte Verbindungen** (SSL/TLS)
- ✅ **Audit-Logs** für alle kritischen Aktionen
- ✅ **Rollen-basierte Zugriffskontrolle**

## 🧪 Testing

### Manuelle Tests

```bash
# Server starten
npm run dev

# Registrierung testen
http://localhost:3000/auth

# Onboarding testen
http://localhost:3000/onboarding

# Dashboard testen
http://localhost:3000/dashboard
```

### Datenbank-Tests

```sql
-- In Supabase SQL Editor
-- Datei: supabase/migrations/VERIFY_SETUP.sql ausführen
```

## 📊 Datenbank-Schema

### Haupttabellen

- **profiles** - Benutzerprofile
- **companies** - Firmendaten
- **user_roles** - Benutzerrollen
- **job_profiles** - Stellenprofile
- **pay_bands** - Gehaltsbänder
- **employees** - Mitarbeiterdaten
- **info_requests** - Auskunftsanfragen
- **audit_logs** - Audit-Trail
- **onboarding_data** - Onboarding-Daten
- **consultation_bookings** - Beratungstermine

Siehe: `supabase/migrations/COMPLETE_SETUP.sql` für Details

## 🤝 Beitragen

Dieses Projekt ist derzeit in aktiver Entwicklung.

## 📝 Lizenz

Proprietär - Alle Rechte vorbehalten

## 📞 Support

- **Dokumentation:** `docs/` Verzeichnis
- **Technische Fragen:** Siehe Dokumentation
- **Bug Reports:** GitHub Issues (falls verfügbar)

## 🎯 Roadmap

### ✅ Phase 1: Basis-Funktionalität (Abgeschlossen)
- [x] Next.js 15 Setup
- [x] Supabase Integration
- [x] Authentifizierung
- [x] Onboarding-System
- [x] Beratungsbuchung
- [x] Datenbank-Schema

### ✅ Phase 2: Pay Equity Analyse (Neu - Abgeschlossen! 🎉)
- [x] **Vergleichsgruppen-Logik** (PayGroups)
- [x] **Gender Pay Gap Analysen** mit Ampel-System
- [x] **3 Dashboard-Ansichten:**
  - [x] Mitarbeiter-Dashboard (`/dashboard/my-salary`)
  - [x] HR-Analytics (`/dashboard/hr-analytics`)
  - [x] Management-Übersicht (`/dashboard/management`)
- [x] **KI-gestützte Erklärungen** (Google Gemini)
- [x] **What-If-Simulationen** für Gehaltsanpassungen
- [x] **KI-Chat** für Mitarbeiter-Fragen

📖 **Dokumentation:** [Pay Equity Analysis](docs/PAY_EQUITY_ANALYSIS.md)

### 🔄 Phase 3: Erweiterte Features (In Arbeit)
- [ ] E-Mail-Integration
- [ ] CSV-Import für Mitarbeiter
- [ ] Berater-Dashboard
- [ ] PDF-Export für Reports

### 📅 Phase 4: Enterprise Features (Geplant)
- [ ] Multi-Tenant-Architektur
- [ ] API für Integrationen
- [ ] Erweiterte Analytics
- [ ] White-Label-Option

## 🏆 Credits

- **Framework:** [Next.js](https://nextjs.org/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Backend:** [Supabase](https://supabase.com/)
- **AI:** [Google Gemini](https://ai.google.dev/)
- **Icons:** [Lucide](https://lucide.dev/)

---

**Entwickelt mit ❤️ für EU-Compliance**

**Version:** 1.1.0 (mit Pay Equity Analyse!)  
**Letzte Aktualisierung:** 26.01.2026  
**Status:** ✅ Production Ready

