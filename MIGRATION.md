# KlarGehalt - Next.js Migration

## ✅ Migration abgeschlossen!

Dein Projekt wurde erfolgreich von **Vite + React** zu **Next.js 15** migriert.

## 🚀 Schnellstart

```bash
# Development Server starten
npm run dev

# Production Build erstellen
npm run build

# Production Server starten
npm run start
```

Der Development Server läuft auf: **http://localhost:3000**

## 📁 Neue Projektstruktur

```
klargehalt-9c0827ae/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root Layout
│   ├── page.tsx                 # Homepage (/)
│   ├── providers.tsx            # Client-Side Providers
│   ├── globals.css              # Global Styles
│   ├── auth/
│   │   └── page.tsx            # Auth Page (/auth)
│   └── dashboard/
│       └── page.tsx            # Dashboard (/dashboard)
├── components/                   # React Components
├── hooks/                        # Custom Hooks
├── lib/                          # Utilities
│   └── supabase/
│       ├── client.ts           # Browser Supabase Client
│       └── server.ts           # Server Supabase Client
├── integrations/                 # Supabase Integration
├── public/                       # Static Assets
├── next.config.ts               # Next.js Config
├── tailwind.config.ts           # Tailwind Config
└── tsconfig.json                # TypeScript Config
```

## 🔄 Hauptänderungen

### 1. **Routing**
- ❌ **Alt:** `react-router-dom` mit `<BrowserRouter>` und `<Route>`
- ✅ **Neu:** Next.js File-based Routing im `app/` Verzeichnis

### 2. **Navigation**
- ❌ **Alt:** `import { Link } from 'react-router-dom'` mit `to` prop
- ✅ **Neu:** `import Link from 'next/link'` mit `href` prop
- ❌ **Alt:** `useNavigate()` Hook
- ✅ **Neu:** `useRouter()` Hook aus `next/navigation`

### 3. **Umgebungsvariablen**
- ❌ **Alt:** `VITE_SUPABASE_URL` (Vite)
- ✅ **Neu:** `NEXT_PUBLIC_SUPABASE_URL` (Next.js)

**Datei:** `.env.local` (wird von Git ignoriert)
```env
NEXT_PUBLIC_SUPABASE_URL=https://gdiefibmquualkfrthog.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. **Metadata / SEO**
- ❌ **Alt:** `react-helmet-async` mit `<Helmet>` Component
- ✅ **Neu:** Next.js `Metadata` API

```typescript
// Alt (Vite)
<Helmet>
  <title>Meine Seite</title>
</Helmet>

// Neu (Next.js)
export const metadata: Metadata = {
  title: 'Meine Seite',
  description: '...'
};
```

### 5. **Client vs Server Components**
Next.js verwendet standardmäßig **Server Components**. Für interaktive Components:

```typescript
'use client';  // Am Anfang der Datei hinzufügen

import { useState } from 'react';
// ... Rest des Codes
```

**Wann `'use client'` verwenden:**
- ✅ Bei `useState`, `useEffect`, `useContext`
- ✅ Bei Event Handlers (`onClick`, etc.)
- ✅ Bei Browser-APIs (`localStorage`, `window`, etc.)

### 6. **Supabase Integration**
- **Browser:** `lib/supabase/client.ts` (für Client Components)
- **Server:** `lib/supabase/server.ts` (für Server Components & API Routes)

## 🎯 Routen

| Route | Beschreibung |
|-------|--------------|
| `/` | Landing Page |
| `/auth` | Login / Registrierung |
| `/dashboard` | Dashboard (Auth erforderlich) |

## 📦 Neue Dependencies

```json
{
  "next": "^15.1.6",
  "@supabase/ssr": "^0.5.2",
  "eslint-config-next": "^15.1.6"
}
```

## 🗑️ Entfernte Dependencies

- ❌ `vite`
- ❌ `react-router-dom`
- ❌ `react-helmet-async`
- ❌ `@vitejs/plugin-react-swc`

## ⚙️ Konfigurationsdateien

### `next.config.ts`
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['gdiefibmquualkfrthog.supabase.co'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
};

export default nextConfig;
```

### `tsconfig.json`
- Pfad-Aliase: `@/*` zeigt jetzt auf Root-Verzeichnis (nicht mehr `./src/*`)
- Next.js Plugin aktiviert

## 🔧 Bekannte Anpassungen

### Components mit Client-Interaktivität
Folgende Components benötigen `'use client'`:
- ✅ `Header.tsx`
- ✅ `app/providers.tsx`
- ✅ `app/auth/page.tsx`
- ✅ `app/dashboard/page.tsx`
- ✅ `hooks/useAuth.tsx`

### Alte Dateien (können gelöscht werden)
```
src/                    # Alte Vite-Struktur
├── App.tsx
├── main.tsx
├── pages/
├── components/
└── ...

index.html              # Nicht mehr benötigt (Next.js generiert HTML)
vite.config.ts          # Ersetzt durch next.config.ts
tsconfig.app.json       # Nicht mehr benötigt
tsconfig.node.json      # Nicht mehr benötigt
```

## 🚀 Deployment

### Vercel (Empfohlen)
1. Repository auf GitHub pushen
2. Mit Vercel verbinden
3. Umgebungsvariablen in Vercel Dashboard setzen
4. Automatisches Deployment bei jedem Push

### Andere Plattformen
- **Netlify:** Unterstützt Next.js
- **Railway:** Unterstützt Next.js
- **Eigener Server:** `npm run build` && `npm run start`

## 📚 Weitere Ressourcen

- [Next.js Dokumentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase + Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

## ⚠️ Wichtige Hinweise

1. **Environment Variables:** Stelle sicher, dass `.env.local` existiert (wird von Git ignoriert)
2. **Public Variables:** Nur Variablen mit `NEXT_PUBLIC_` Prefix sind im Browser verfügbar
3. **Server Components:** Standardmäßig sind alle Components Server Components (schneller, SEO-freundlich)
4. **Image Optimization:** Nutze `next/image` für optimierte Bilder

## 🎉 Vorteile der Migration

✅ **Besseres SEO** - Server-Side Rendering  
✅ **Schnellere Performance** - Automatisches Code-Splitting  
✅ **Einfacheres Routing** - File-based Routing  
✅ **Optimierte Bilder** - Built-in Image Optimization  
✅ **API Routes** - Backend-Endpunkte im gleichen Projekt möglich  
✅ **Vercel-Optimiert** - Bestes Hosting für Next.js  

---

**Status:** ✅ Migration erfolgreich abgeschlossen!  
**Next.js Version:** 15.1.6  
**React Version:** 18.3.1
