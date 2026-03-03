# Frontend / React & Next.js Patterns

## Route Groups

| Group | Path | Purpose |
|---|---|---|
| `(marketing)` | `/` | Public landing page |
| `(app)` | `/dashboard`, `/onboarding`, `/book-consulting`, `/sign-in`, `/sign-up` | Authenticated app |

## Supabase Client Pattern

```ts
// Client component — consume from useAuth(), never instantiate directly
const { supabase, user, orgId, role } = useAuth()

// Server component / Server Action
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
```

## Key Hooks

| Hook | What it provides |
|---|---|
| `useAuth` | `user`, `role`, `orgId`, `supabase`, `loading` |
| `useCompany` | Company CRUD |
| `useEmployees` | Employee management |
| `usePayEquity` | Pay group / gap analytics |
| `usePermissions` | Fine-grained permission checks |
| `useAuditSystem` | Audit log writes |

## Role Gating

```tsx
// Declarative (UI)
<RoleGuard roles={['admin', 'hr_manager']}>
  <SensitiveComponent />
</RoleGuard>

// Imperative (logic)
const canEdit = useRoleAccess('admin', 'hr_manager')
```

## Component Patterns

- TanStack Query for all client-side async data — no raw `useEffect` for fetching
- Recharts for all charts and analytics visualizations
- shadcn/ui + Tailwind for all UI — no custom CSS unless unavoidable
- Sentry is configured — unhandled errors are captured automatically
