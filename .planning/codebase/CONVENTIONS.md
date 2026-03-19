# Code Conventions

**Analysis Date:** 2026-03-19

## TypeScript Patterns

**Strict mode is disabled.** `tsconfig.json` sets `"strict": false`, `"strictNullChecks": false`, `"noImplicitAny": false`. This means TypeScript does not enforce null safety and `any` is allowed at the compiler level.

**In practice, `any` is used frequently** — found in 357 occurrences across 35 files. Examples from `hooks/useAuditSystem.ts`, `hooks/usePermissions.ts`, `app/api/pay-equity/chat/route.ts`. This is a known area of weakness.

**Type aliases over interfaces for simple shapes:**
```ts
// hooks/useAuth.tsx
type AppRole = 'admin' | 'hr_manager' | 'employee';
type AuthUser = { id: string; email: string | null; ... };
```

**Interfaces for complex objects and hook return shapes:**
```ts
// hooks/useEmployees.ts
export interface Employee { id: string; organization_id: string; ... }
export interface EmployeeFormData { first_name: string; last_name: string; ... }
```

**`as const` for readonly lookup tables:**
```ts
// hooks/usePermissions.ts
export const PERMISSIONS = { USERS_VIEW: 'users.view', ... } as const;
export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS];
```

**Derived union types from const objects** — use the pattern above when adding new permission codes.

**Async functions always use `try/catch/finally`** with explicit loading state management. See every data hook for the pattern.

**`void` prefix for fire-and-forget async calls:**
```ts
// hooks/useAuth.tsx
useEffect(() => { void refreshAuth(); }, []);
useEffect(() => { void fetchData(); }, [...]);
```

## Component Patterns (React/Next.js)

**Client components must declare `'use client'` at the top.** All interactive components do this. Server components (layouts, API routes) do not.

Files with `'use client'`: 22 component and page files under `app/(app)/` and `components/`.

**Loading state pattern — spinner div, not skeleton component (despite CLAUDE.md guideline):**
```tsx
// components/dashboard/EmployeesView.tsx
if (loading) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  );
}
```

The official guideline says to use `<Skeleton />`, but most existing components use a spinner div. New components should use `<Skeleton />` from `components/ui/skeleton.tsx` (e.g., `components/dashboard/PayEquityHRView.tsx` does import Skeleton).

**Empty state pattern — dashed border container:**
```tsx
<div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl">
  <Icon className="h-12 w-12 text-muted-foreground mb-4" />
  <h3 className="text-lg font-semibold text-foreground mb-2">No items</h3>
  <Button variant="hero" onClick={...}>Create First</Button>
</div>
```

**Inline form subcomponents for dialogs** — `FormFields` is defined as a local component inside the view:
```tsx
// components/dashboard/EmployeesView.tsx
const FormFields = () => (
  <div className="grid gap-4 py-4">...</div>
);
```

**Page-level layout:** Dashboard page (`app/(app)/dashboard/page.tsx`) uses a fixed left sidebar (272px) + main content area with `pl-72`.

**Route-based SPA navigation inside dashboard** — the main dashboard page renders different views via a local `activeView` state (string union type `HRView`), not via Next.js router navigation.

**No TanStack Query in hooks** — despite CLAUDE.md listing it as prescribed, all existing data hooks use raw `useEffect` + `useState` with manual fetch management. TanStack Query is installed and available via the `QueryClientProvider` in `app/(app)/providers.tsx` but is not yet adopted in hooks.

## State Management

**All shared auth state lives in `AuthContext`** (`hooks/useAuth.tsx`). Every component accesses auth via `useAuth()`.

**Per-view state is local** — `useState` in the component. No global state outside of auth context.

**Supabase client is memoized in context** and recreated only when `isAuthenticated` or `activeOrganization.id` changes.

**`QueryClient` is initialized with `staleTime: 60_000`** in `app/(app)/providers.tsx`. TanStack Query is available for new code but not yet used in existing hooks.

## Error Handling

**User-facing errors use `toast` from `sonner`:**
```ts
// hooks/useEmployees.ts
import { toast } from 'sonner';
toast.error('Fehler beim Laden der Mitarbeiter: ...');
toast.success('Mitarbeiter erfolgreich erstellt');
```

**Server errors are logged then surfaced as toast:**
```ts
catch (error: any) {
  console.error('Error creating employee:', error);
  toast.error('Fehler beim Erstellen des Mitarbeiters');
}
```

**Some hooks use `useToast()` from `hooks/use-toast.ts` instead of `sonner`** — `useAuditSystem.ts` uses the shadcn toast hook while `useEmployees.ts`, `useCompany.ts`, and others import directly from `sonner`. Both exist and both are acceptable, but prefer `sonner`'s `toast` for new code as it is the pattern recommended in CLAUDE.md.

**API routes return structured JSON errors with HTTP status codes:**
```ts
// app/api/pay-equity/chat/route.ts
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
```

**API routes wrap entire handler body in a single `try/catch`.**

**Supabase errors are thrown to propagate to the catch block:**
```ts
const { data, error } = await supabase.from('employees').select('*');
if (error) throw error;
```

## Naming Conventions

**Files:**
- React components: PascalCase (`EmployeesView.tsx`, `RoleGuard.tsx`, `PayEquityHRView.tsx`)
- React hooks: camelCase starting with `use` (`useEmployees.ts`, `useAuth.tsx`, `useAuditSystem.ts`)
- API routes: Next.js convention — `route.ts` inside directory named by path
- Utility/library files: camelCase (`gemini-service.ts`, `logto-management.ts`)
- shadcn/ui components: kebab-case (`alert-dialog.tsx`, `dropdown-menu.tsx`)

**Directories:**
- Feature views: `components/dashboard/` for dashboard panel components
- Route groups: `(app)` and `(marketing)` for Next.js route groups
- Hooks: flat `hooks/` directory
- Lib utilities: `lib/` with subdirectories by concern (`lib/supabase/`, `lib/auth/`, `lib/services/`)

**Variables and functions:**
- camelCase for all variables, functions, and hook methods
- SCREAMING_SNAKE_CASE for constant lookup objects: `HR_ADMIN_NAV`, `PERMISSIONS`, `ROLE_LABELS`
- PascalCase for React component functions and TypeScript types/interfaces

**Database field names mirror DB column names:** snake_case (`first_name`, `organization_id`, `job_profile_id`) — interfaces use snake_case to match Supabase column names.

**Local label maps are defined at module scope:**
```ts
// components/dashboard/EmployeesView.tsx
const genderLabels: Record<string, string> = { male: 'Männlich', ... };
const jobLevelLabels: Record<string, string> = { junior: 'Junior', ... };
```

## Import Organization

**Order (observed pattern):**
1. React hooks (`import { useState, useEffect } from 'react'`)
2. Internal hooks (`import { useAuth } from '@/hooks/useAuth'`)
3. UI library components (shadcn, grouped by component file)
4. Icons (`import { Plus, Pencil } from 'lucide-react'`)
5. Type imports (`import type { ... }`)

**Path alias:** `@/` maps to the project root. All internal imports use `@/`.

**No barrel index files** — each module is imported by full path.

**No relative imports** for cross-directory imports — always use `@/` alias.

## Supabase Client Usage Patterns

**Rule: never instantiate your own Supabase client in components or hooks.**

**Client components and hooks — consume from `useAuth()`:**
```ts
const { supabase, user, orgId } = useAuth();
// Then use supabase directly for queries
const { data, error } = await supabase.from('employees').select('*');
```
Source: `hooks/useAuth.tsx` exports `supabase` as `SupabaseClient` through context.

**Server components and API routes — use `createClient()` from `lib/supabase/server.ts`:**
```ts
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();
```
Source: `lib/supabase/server.ts`.

**`utils/supabase/client.ts` provides two factories:**
- `createSupabaseClient(getToken)` — authenticated client with JWT injected per-request
- `createClient()` — anonymous client for unauthenticated state

**Multi-tenant filter pattern** — always filter by `organization_id` using `orgId` from `useAuth()`:
```ts
const { data } = await supabase
  .from('employees')
  .select('*')
  .eq('organization_id', orgId)
  .order('last_name');
```

**RPC calls for complex queries:**
```ts
// hooks/usePermissions.ts
await supabase.rpc('get_user_permissions');
// hooks/useAuditSystem.ts
await supabase.rpc('get_audit_statistics', { _organization_id: orgId, _days: days });
```

## RBAC Patterns

**Three roles:** `admin` | `hr_manager` | `employee` (defined in `hooks/useAuth.tsx` as `AppRole`).

**Declarative UI gating — `<RoleGuard>` component** from `components/RoleGuard.tsx`:
```tsx
<RoleGuard roles={['admin', 'hr_manager']}>
  <SensitiveComponent />
</RoleGuard>
// With fallback:
<RoleGuard roles={['admin']} fallback={<AccessDenied />}>
  <AdminPanel />
</RoleGuard>
```

**Imperative check — `useRoleAccess()` hook** from `components/RoleGuard.tsx`:
```tsx
const canEdit = useRoleAccess('admin', 'hr_manager');
```

**Fine-grained permissions — `usePermissions()` hook** from `hooks/usePermissions.ts`:
```tsx
const { hasPermission, hasAnyPermission } = usePermissions();
if (hasPermission(PERMISSIONS.EMPLOYEES_VIEW)) { ... }
```
This calls `supabase.rpc('get_user_permissions')` to load permissions from the database.

**Route-level gating in dashboard page** (`app/(app)/dashboard/page.tsx`) — `role === 'employee'` triggers early return to `<EmployeeDashboard />`, bypassing all HR/admin views.

**Admin-only nav items** filtered at render time:
```ts
const visibleNavItems = HR_ADMIN_NAV.filter(item => {
  if ((item as any).adminOnly && role !== 'admin') return false;
  return true;
});
```

**Critical: UI checks are not the security boundary.** All data access security is enforced by Supabase RLS policies using `organization_id` columns. Frontend role checks are for UX only. Never rely solely on frontend checks to protect data.
