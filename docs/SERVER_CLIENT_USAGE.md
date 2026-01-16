# 🔧 Supabase Server Client - Verwendung

## ✅ Korrektes Pattern (Next.js 15)

### Server Component

```typescript
// app/companies/page.tsx
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export default async function CompaniesPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data: companies } = await supabase
    .from('companies')
    .select('*');

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

### Server Action

```typescript
// app/actions/company.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function createCompany(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const name = formData.get('name') as string;
  
  const { error } = await supabase
    .from('companies')
    .insert({ name });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/companies');
  return { success: true };
}
```

### Mit Authentifizierung

```typescript
// app/profile/page.tsx
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  // User abrufen
  const { data: { user }, error } = await supabase.auth.getUser();
  
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

## 📋 Wichtige Punkte

1. **Immer `cookies()` importieren und awaiten**
   ```typescript
   import { cookies } from 'next/headers';
   const cookieStore = await cookies();
   ```

2. **CookieStore an `createClient` übergeben**
   ```typescript
   const supabase = createClient(cookieStore);
   ```

3. **Nur in Server Components und Server Actions verwenden**
   - ✅ Server Components (ohne `'use client'`)
   - ✅ Server Actions (mit `'use server'`)
   - ❌ Client Components (verwende `@/lib/supabase/client`)

## 🔄 Vollständiges Beispiel

```typescript
// app/dashboard/companies/page.tsx
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { CompanyForm } from '@/components/CompanyForm';

export default async function CompaniesPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  // Authentifizierung prüfen
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth');
  }

  // Firmen laden
  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1>Firmen-Verwaltung</h1>
      
      {/* Server Component - Statische Liste */}
      <div>
        <h2>Bestehende Firmen ({companies?.length || 0})</h2>
        <ul>
          {companies?.map((company) => (
            <li key={company.id}>
              {company.name} - {company.industry}
            </li>
          ))}
        </ul>
      </div>

      {/* Client Component - Interaktives Formular */}
      <CompanyForm />
    </div>
  );
}
```

## ⚠️ Häufige Fehler

### ❌ Fehler 1: Cookies nicht awaiten

```typescript
// FALSCH
const cookieStore = cookies(); // Fehlt await!
const supabase = createClient(cookieStore);
```

```typescript
// RICHTIG
const cookieStore = await cookies();
const supabase = createClient(cookieStore);
```

### ❌ Fehler 2: Server Client in Client Component

```typescript
// FALSCH
'use client';
import { createClient } from '@/lib/supabase/server';

export default function MyComponent() {
  // Dies wird NICHT funktionieren!
}
```

```typescript
// RICHTIG
'use client';
import { createClient } from '@/lib/supabase/client';

export default function MyComponent() {
  const supabase = createClient();
  // ...
}
```

### ❌ Fehler 3: Async Component vergessen

```typescript
// FALSCH
export default function Page() { // Fehlt async!
  const cookieStore = await cookies(); // Fehler!
}
```

```typescript
// RICHTIG
export default async function Page() {
  const cookieStore = await cookies();
  // ...
}
```

---

**Unser Server Client ist jetzt korrekt konfiguriert! ✅**
