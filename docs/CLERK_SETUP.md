# 🔐 Clerk Authentication Setup

## ✅ Was wurde implementiert

### 1. **Clerk Installation**
```bash
npm install @clerk/nextjs
```

### 2. **Middleware** (`middleware.ts`)
- ✅ Verwendet `clerkMiddleware()` von `@clerk/nextjs/server`
- ✅ Schützt alle Routen außer öffentliche
- ✅ Öffentliche Routen: `/`, `/sign-in`, `/sign-up`

### 3. **Layout** (`app/layout.tsx`)
- ✅ `<ClerkProvider>` umschließt die gesamte App
- ✅ Custom Appearance für Branding
- ✅ Deutsche Sprache (lang="de")

### 4. **Auth-Routen**
- ✅ `/sign-in/[[...sign-in]]/page.tsx` - Anmeldung
- ✅ `/sign-up/[[...sign-up]]/page.tsx` - Registrierung

### 5. **Header-Integration**
- ✅ `<UserButton>` für angemeldete User
- ✅ Sign-In/Sign-Up Buttons für Gäste
- ✅ Responsive Mobile-Menü

## 🚀 Setup-Schritte

### Schritt 1: Clerk Dashboard

1. Gehe zu: https://dashboard.clerk.com
2. Erstelle ein neues Projekt oder wähle ein bestehendes
3. Gehe zu **API Keys**

### Schritt 2: Environment Variables

Kopiere deine Keys aus dem Clerk Dashboard und füge sie in `.env.local` ein:

```env
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional: Custom URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

**WICHTIG:** 
- ✅ Verwende `.env.local` (nicht `.env`)
- ✅ `.env.local` ist bereits in `.gitignore`
- ❌ Niemals Keys in Git committen!

### Schritt 3: Server neu starten

```bash
# Server stoppen (Strg+C)
npm run dev
```

### Schritt 4: Testen

1. **Öffne**: http://localhost:3000
2. **Klicke**: "Kostenlos starten"
3. **Registriere** einen Test-Account
4. **Prüfe**: Weiterleitung zu `/onboarding`

## 📁 Dateistruktur

```
app/
├── layout.tsx                    # ClerkProvider
├── sign-in/
│   └── [[...sign-in]]/
│       └── page.tsx             # Sign-In Seite
├── sign-up/
│   └── [[...sign-up]]/
│       └── page.tsx             # Sign-Up Seite
├── dashboard/
│   └── page.tsx                 # Geschützte Route
└── onboarding/
    └── page.tsx                 # Nach Registrierung

components/
└── Header.tsx                   # Mit UserButton

middleware.ts                    # Route Protection
```

## 🔒 Route Protection

### Öffentliche Routen (kein Login nötig)
- `/` - Landing Page
- `/sign-in` - Anmeldung
- `/sign-up` - Registrierung

### Geschützte Routen (Login erforderlich)
- `/dashboard` - Dashboard
- `/onboarding` - Onboarding
- `/book-consulting` - Beratungsbuchung
- Alle anderen Routen

## 🎨 Customization

### Appearance anpassen

In `app/layout.tsx`:

```typescript
<ClerkProvider
  appearance={{
    variables: {
      colorPrimary: '#0F172A',      // Deine Primärfarbe
      colorBackground: '#FFFFFF',    // Hintergrund
    },
    elements: {
      formButtonPrimary: 'bg-primary hover:bg-primary/90',
      card: 'shadow-lg',
      // ... weitere Styles
    },
  }}
>
```

### Deutsche Texte

Clerk unterstützt automatisch deutsche Texte basierend auf Browser-Sprache.
Für erzwungene deutsche Texte, installiere:

```bash
npm install @clerk/localizations
```

Dann in `layout.tsx`:

```typescript
import { deDE } from '@clerk/localizations';

<ClerkProvider localization={deDE}>
```

## 🔧 Verwendung in Components

### Server Component

```typescript
// app/profile/page.tsx
import { auth, currentUser } from '@clerk/nextjs/server';

export default async function ProfilePage() {
  const { userId } = await auth();
  const user = await currentUser();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return <div>Hallo {user?.firstName}!</div>;
}
```

### Client Component

```typescript
'use client';

import { useUser } from '@clerk/nextjs';

export default function UserProfile() {
  const { isSignedIn, user } = useUser();

  if (!isSignedIn) {
    return <div>Bitte anmelden</div>;
  }

  return <div>Hallo {user.firstName}!</div>;
}
```

### Conditional Rendering

```typescript
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

export default function Header() {
  return (
    <header>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  );
}
```

## 📊 User Metadata

### Public Metadata (für alle sichtbar)

```typescript
await clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: {
    role: 'admin',
    companyId: '123',
  },
});
```

### Private Metadata (nur für User)

```typescript
await clerkClient.users.updateUserMetadata(userId, {
  privateMetadata: {
    internalNotes: 'VIP customer',
  },
});
```

### Unsafe Metadata (von User änderbar)

```typescript
await clerkClient.users.updateUserMetadata(userId, {
  unsafeMetadata: {
    theme: 'dark',
    language: 'de',
  },
});
```

## 🔗 Webhooks (Optional)

Für Sync mit Supabase:

1. **Clerk Dashboard** → Webhooks
2. **Endpoint**: `https://your-domain.com/api/webhooks/clerk`
3. **Events**: `user.created`, `user.updated`, `user.deleted`

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  const body = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id!,
      'svix-timestamp': svix_timestamp!,
      'svix-signature': svix_signature!,
    });
  } catch (err) {
    return new Response('Error verifying webhook', { status: 400 });
  }

  const { id, ...attributes } = evt.data;
  const eventType = evt.type;

  if (eventType === 'user.created') {
    // Sync to Supabase
  }

  return new Response('', { status: 200 });
}
```

## 🧪 Testing

### Test-Accounts erstellen

1. Gehe zu `/sign-up`
2. Registriere Test-Accounts:
   - `admin@test.de`
   - `hr@test.de`
   - `employee@test.de`

### Clerk Dashboard

- **Users**: Alle registrierten User
- **Sessions**: Aktive Sessions
- **Logs**: Auth-Events

## 📚 Weitere Ressourcen

- [Clerk Docs](https://clerk.com/docs)
- [Next.js Integration](https://clerk.com/docs/nextjs)
- [Customization](https://clerk.com/docs/customization/overview)
- [Webhooks](https://clerk.com/docs/integrations/webhooks)

---

**Status**: ✅ Clerk ist korrekt konfiguriert!

**Nächste Schritte**:
1. Environment Variables setzen
2. Server neu starten
3. Test-Account erstellen
4. Onboarding testen
