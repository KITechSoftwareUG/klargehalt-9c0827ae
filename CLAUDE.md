# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start development server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint via Next.js
npx tsc --noEmit   # TypeScript strict check (run after every change)
```

No automated test suite — validation is done via `tsc --noEmit` + `npm run lint`.

## Architecture Overview

**KlarGehalt** is a B2B SaaS for EU pay-transparency compliance (Entgelttransparenzrichtlinie 2023/970). It manages salary structures, RBAC for employees, and provides gender pay gap analytics.

### Stack
- **Next.js 15** (App Router) + **TypeScript**
- **Clerk** for authentication and organizations (multi-tenant identity provider)
- **Supabase** (PostgreSQL) for data, using **RLS as the primary security layer**
- **shadcn/ui** + Tailwind CSS for UI
- **TanStack Query** for client-side data fetching
- **Recharts** for analytics charts
- **Google Gemini** (`@google/generative-ai`) for AI pay-gap explanations
- **Sentry** for error tracking

### Route Groups

The app uses two Next.js route groups in `app/`:

| Group | Purpose | Layout |
|---|---|---|
| `(marketing)` | Public landing page (`/`) | Marketing layout |
| `(app)` | Authenticated app (`/dashboard`, `/onboarding`, `/book-consulting`, `/sign-in`, `/sign-up`) | App layout with `AuthProvider` |

### Authentication & Multi-Tenancy

**Clerk** is the identity provider. Every authenticated user belongs to a Clerk **Organization** (`orgId`). The `middleware.ts` enforces:
- Unauthenticated users on the `app.` subdomain are redirected to sign-in
- Authenticated users without an org are redirected to `/onboarding`

**Supabase RLS** is the actual security boundary — all tenant isolation is enforced at the DB level via `organization_id` columns and the `auth.get_user_org_id()` helper function. Never rely on frontend filtering alone.

### Supabase Client Pattern (Critical)

There are two separate Supabase client factories:

| Location | Use in |
|---|---|
| `utils/supabase/client.ts` | Client components / hooks |
| `lib/supabase/server.ts` | Server components / Server Actions |

**Client-side**: Always consume `supabase` from `useAuth()` — never create your own client in a component. The `AuthProvider` (`hooks/useAuth.tsx`) creates a single `SupabaseClient` that injects a fresh Clerk JWT into every HTTP request via a fetch interceptor. `createSupabaseClient()` takes a `getToken` callback; `createClient()` returns an anonymous client used only during loading.

**Server-side**: `lib/supabase/server.ts` exports `createClient()` (async, no args — cookies are handled internally).

### RBAC

Three roles: `admin` | `hr_manager` | `employee`, stored in the `user_roles` table.

- Use `<RoleGuard roles={['admin', 'hr_manager']}>` for UI-level gating
- Use `useRoleAccess(...roles)` for imperative checks in component logic
- Both are in `components/RoleGuard.tsx`
- Real enforcement is always in Supabase RLS, not the UI

### Key Hooks (`hooks/`)

| Hook | Purpose |
|---|---|
| `useAuth` | Auth context: `user`, `role`, `orgId`, `supabase`, `loading` |
| `useCompany` | Company CRUD |
| `useEmployees` | Employee management |
| `usePayEquity` | Pay group / gap analytics |
| `usePermissions` | Fine-grained permission checks |
| `useAuditSystem` | Audit log writes |

### Database Schema (key tables)

`profiles`, `companies`, `user_roles`, `job_profiles`, `pay_bands`, `employees`, `info_requests`, `audit_logs`, `onboarding_data`, `consultation_bookings`

Every tenant-scoped table has an `organization_id TEXT NOT NULL` column. Migrations live in `supabase/migrations/`.

## Key Conventions

- **Loading states**: Always show a skeleton, never render `null` while loading
- **User-facing errors**: Always surface via `toast()` (sonner)
- **Forms**: React Hook Form + Zod validation
- **`any` types**: Replace with specific types — do not leave `any` in new code
- **Commit message format**: `Deployment V[version]: [description]` or `Kaizen: [what improved]`

## Agent Workflows (`.agent/workflows/`)

- `lint-and-validate.md` — TypeScript + ESLint check sequence
- `kaizen.md` — Incremental code quality improvement checklist
- `systematic-debugging.md` — Step-by-step debugging protocol with common failure patterns
- `git-pushing.md` — Staging, committing, and pushing convention

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Clerk keys are configured separately (see `docs/CLERK_SETUP.md`).
