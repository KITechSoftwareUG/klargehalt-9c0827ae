# CLAUDE.md

## Commands

```bash
npm run dev        # Dev server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint via Next.js
npx tsc --noEmit   # TypeScript strict check (run after every change)
```

No test suite — validation is `tsc --noEmit` + `npm run lint`.

## What This Is

**KlarGehalt** — B2B SaaS for EU pay-transparency compliance (Entgelttransparenzrichtlinie 2023/970). Salary structures, RBAC, gender pay gap analytics.

## Stack

Next.js 15 (App Router), TypeScript, Clerk (auth + orgs), Supabase (PostgreSQL + RLS), shadcn/ui + Tailwind, TanStack Query, Recharts, Sentry.

## Route Groups

| Group | Purpose |
|---|---|
| `(marketing)` | Public landing page (`/`) |
| `(app)` | Authenticated app (`/dashboard`, `/onboarding`, `/book-consulting`, `/sign-in`, `/sign-up`) |

## Auth & Multi-Tenancy

- **Clerk** = identity provider. Every user belongs to a Clerk Organization (`orgId`).
- **Supabase RLS** = security boundary. Tenant isolation via `organization_id` + `auth.get_user_org_id()`.
- `middleware.ts` redirects unauthenticated users to sign-in, org-less users to `/onboarding`.

## RBAC

Three roles: `admin` | `hr_manager` | `employee` (stored in `user_roles`).

## Key Tables

`profiles`, `companies`, `user_roles`, `job_profiles`, `pay_bands`, `employees`, `info_requests`, `audit_logs`, `onboarding_data`, `consultation_bookings`

All tenant-scoped tables have `organization_id TEXT NOT NULL`. Migrations in `supabase/migrations/`.

## Deployment

- GitHub: `https://github.com/KITechSoftwareUG/klargehalt-9c0827ae.git`
- Current version: V2.8+
- Commit format: `Deployment V[version]: [description]` or `Kaizen: [what improved]`
