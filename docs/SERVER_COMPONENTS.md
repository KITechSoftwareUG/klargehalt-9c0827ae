# 🔧 Server Components mit Supabase - Anleitung

## Übersicht

Next.js 15 unterstützt Server Components, die direkt auf dem Server laufen und Daten abrufen können, bevor die Seite an den Client gesendet wird.

## 📁 Unsere Supabase-Clients

### 1. Server Client (`lib/supabase/server.ts`)
Für **Server Components** und **Server Actions**

```typescript
import { createClient } from '@/lib/supabase/server';

export default async function ServerPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('companies').select();
  
  return <div>{/* Render data */}</div>;
}
```

### 2. Browser Client (`lib/supabase/client.ts`)
Für **Client Components** (mit `'use client'`)

```typescript
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function ClientComponent() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    const supabase = createClient();
    supabase.from('companies').select().then(({ data }) => setData(data));
  }, []);
  
  return <div>{/* Render data */}</div>;
}
```

## 🎯 Wann welchen Client verwenden?

### ✅ Server Client verwenden für:
- **Initial Page Load** - Daten beim ersten Laden
- **SEO-wichtige Daten** - Für Suchmaschinen sichtbar
- **Sensitive Operations** - Sicherer auf dem Server
- **Static Generation** - Daten zur Build-Zeit

### ✅ Browser Client verwenden für:
- **Interaktive Features** - useState, useEffect, Event Handlers
- **Real-time Updates** - Supabase Realtime
- **User Actions** - Formulare, Buttons, etc.
- **Client-Side State** - React Context, Zustand

## 📝 Beispiele

### Beispiel 1: Server Component (Firmen-Liste)

```typescript
// app/companies/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function CompaniesPage() {
  const supabase = await createClient();
  
  // Daten werden auf dem Server abgerufen
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .eq('is_active', true);

  if (error) {
    return <div>Fehler beim Laden der Firmen</div>;
  }

  return (
    <div>
      <h1>Firmen</h1>
      <ul>
        {companies?.map((company) => (
          <li key={company.id}>{company.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Beispiel 2: Client Component (Interaktives Formular)

```typescript
// components/CompanyForm.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CompanyForm() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from('companies')
      .insert({ name });

    if (!error) {
      alert('Firma erstellt!');
      setName('');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Firmenname"
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Wird gespeichert...' : 'Speichern'}
      </Button>
    </form>
  );
}
```

### Beispiel 3: Hybrid (Server + Client)

```typescript
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server';
import CompanyForm from '@/components/CompanyForm'; // Client Component

export default async function DashboardPage() {
  const supabase = await createClient();
  
  // Server-seitig: Initiale Daten laden
  const { data: companies } = await supabase
    .from('companies')
    .select('*');

  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Server Component - Statische Liste */}
      <div>
        <h2>Bestehende Firmen</h2>
        <ul>
          {companies?.map((company) => (
            <li key={company.id}>{company.name}</li>
          ))}
        </ul>
      </div>

      {/* Client Component - Interaktives Formular */}
      <div>
        <h2>Neue Firma hinzufügen</h2>
        <CompanyForm />
      </div>
    </div>
  );
}
```

### Beispiel 4: Server Action

```typescript
// app/actions/company.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createCompany(formData: FormData) {
  const supabase = await createClient();
  
  const name = formData.get('name') as string;
  
  const { error } = await supabase
    .from('companies')
    .insert({ name });

  if (error) {
    return { error: error.message };
  }

  // Cache invalidieren
  revalidatePath('/companies');
  
  return { success: true };
}
```

```typescript
// components/CompanyFormWithAction.tsx
'use client';

import { createCompany } from '@/app/actions/company';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CompanyFormWithAction() {
  return (
    <form action={createCompany}>
      <Input name="name" placeholder="Firmenname" required />
      <Button type="submit">Speichern</Button>
    </form>
  );
}
```

## 🔐 Authentifizierung in Server Components

### User abrufen

```typescript
// app/profile/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = await createClient();
  
  // User abrufen
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // Nicht angemeldet? Redirect
  if (error || !user) {
    redirect('/auth');
  }

  // Profil laden
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <div>
      <h1>Profil</h1>
      <p>Email: {user.email}</p>
      <p>Name: {profile?.full_name}</p>
    </div>
  );
}
```

## 📊 Best Practices

### ✅ DO

```typescript
// ✅ Server Component für initiale Daten
export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.from('companies').select();
  return <List data={data} />;
}

// ✅ Client Component für Interaktivität
'use client';
export function InteractiveList({ data }) {
  const [selected, setSelected] = useState(null);
  return <div onClick={() => setSelected(data[0])}>{/* ... */}</div>;
}

// ✅ Server Actions für Mutations
'use server';
export async function updateCompany(id: string, name: string) {
  const supabase = await createClient();
  return await supabase.from('companies').update({ name }).eq('id', id);
}
```

### ❌ DON'T

```typescript
// ❌ Nicht: Server Client in Client Component
'use client';
import { createClient } from '@/lib/supabase/server'; // FALSCH!

// ❌ Nicht: Browser Client in Server Component
import { createClient } from '@/lib/supabase/client'; // FALSCH!
// (ohne 'use client')

// ❌ Nicht: useState in Server Component
export default async function Page() {
  const [data, setData] = useState([]); // FEHLER!
  // ...
}
```

## 🔄 Migration von Client zu Server Components

### Vorher (Client Component)

```typescript
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function Page() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('companies').select()
      .then(({ data }) => {
        setCompanies(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Lädt...</div>;

  return <div>{companies.map(c => <div key={c.id}>{c.name}</div>)}</div>;
}
```

### Nachher (Server Component)

```typescript
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const { data: companies } = await supabase.from('companies').select();

  return <div>{companies?.map(c => <div key={c.id}>{c.name}</div>)}</div>;
}
```

**Vorteile:**
- ✅ Weniger Code
- ✅ Kein Loading-State nötig
- ✅ Schnelleres Initial Rendering
- ✅ Besseres SEO

## 📚 Weitere Ressourcen

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Supabase + Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

---

**Unsere Implementierung ist bereits korrekt! ✅**

Du kannst beide Clients verwenden, je nachdem ob du Server oder Client Components baust.
