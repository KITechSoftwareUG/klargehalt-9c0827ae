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

**KlarGehalt** — B2B SaaS for EU pay-transparency compliance (Entgelttransparenzrichtlinie 2023/970).
Target: German/EU companies required to publish salary structures and gender pay gap reports.
Features: salary bands, job profiles, RBAC, gender pay gap analytics, subscription billing.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| Auth | Logto (self-hosted, OIDC) |
| Database | Supabase (PostgreSQL + RLS) |
| UI | shadcn/ui + Tailwind CSS |
| Data fetching | TanStack Query |
| Charts | Recharts |
| Billing | Stripe (Checkout + Customer Portal) |
| AI | Google Gemini API |
| Error tracking | Sentry |

---

## Infrastructure & Deployment

| Service | URL | Hosted via |
|---|---|---|
| App | `https://app.klargehalt.de` | Coolify (VPS) |
| Auth (Logto) | `https://auth.klargehalt.de` | Coolify (VPS, self-hosted) |
| Marketing | `https://klargehalt.de` | Coolify (VPS) |
| Database | Supabase cloud | Supabase managed |

**Routing:** `middleware.ts` checks the `host` header. Requests on `app.*` subdomain are protected.
**Deployment:** Push to `main` → Coolify auto-deploys via GitHub webhook.
**GitHub:** `https://github.com/KITechSoftwareUG/klargehalt-9c0827ae`
**Commit format:** `Deployment V[version]: [description]` for releases, `Kaizen: [what improved]` for quality.

---

## Route Groups

| Group | Path | Purpose |
|---|---|---|
| `(marketing)` | `/` | Public landing page, pricing, legal |
| `(app)` | `/dashboard`, `/onboarding`, `/book-consulting`, `/sign-in`, `/sign-up` | Authenticated app |

---

## Auth & Multi-Tenancy (Logto + Supabase)

### How it works

1. **Logto** = identity provider (OIDC, self-hosted). Users authenticate at `auth.klargehalt.de`.
2. Every user belongs to a **Logto Organization** (`orgId`). The active org is stored in `kg_active_org` cookie (httpOnly).
3. To call Supabase, the app fetches a **Logto organization JWT** via `GET /api/auth/organization-token`.
4. That JWT is passed as `Authorization: Bearer <token>` to Supabase.
5. **Supabase RLS** = real security boundary. Every tenant-scoped table has `organization_id TEXT NOT NULL`. The `auth.get_user_org_id()` SQL function extracts the org from the JWT claim.

### Key design note

The middleware (`middleware.ts`) runs on the edge and checks authentication. However, **JWT org claims lag behind** — Logto only refreshes them on next login. The `kg_active_org` cookie is the source of truth for the active org immediately after creation. Real enforcement is always Supabase RLS.

### Auth context hierarchy

| Context | How to get it |
|---|---|
| Server component / API route | `getServerAuthContext()` from `lib/auth/server.ts` |
| Client component | `useAuth()` from `hooks/useAuth.tsx` |

### Supabase client pattern (CRITICAL)

```ts
// Client component — always use supabase from useAuth(), never instantiate directly
const { supabase, user, orgId, role } = useAuth()

// Server component / Server Action / API route
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()          // auto-reads kg_active_org cookie + fetches org token
const supabase = await createClient(orgId)     // explicit org override
```

The server `createClient()` automatically fetches the Logto org token and injects it as a Bearer header so RLS works.

---

## RBAC

Three roles: `admin` | `hr_manager` | `employee` (stored in `user_roles` table).

```tsx
// UI gating (declarative)
<RoleGuard roles={['admin', 'hr_manager']}>
  <SensitiveComponent />
</RoleGuard>

// Logic gating (imperative)
const canEdit = useRoleAccess('admin', 'hr_manager')
```

Real enforcement is always Supabase RLS — frontend gating is UX only.

---

## Subscription & Billing (Stripe)

Three tiers: `basis` (€99/mo) | `professional` (€299/mo) | `enterprise` (on request).
14-day trial at Professional tier on signup.

| Feature flag | Minimum tier |
|---|---|
| `pay_gap_analysis` | professional |
| `pdf_reports` | professional |
| `trend_analysis` | professional |
| `sso` | enterprise |
| `auditor_access` | enterprise |

Helpers in `lib/subscription.ts`: `hasFeature()`, `getEffectiveTier()`, `getTrialDaysRemaining()`.

Stripe Price IDs are read from env vars: `STRIPE_PRICE_BASIS_MONTHLY`, `STRIPE_PRICE_PROFESSIONAL_MONTHLY`, etc.

---

## Key API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/me` | GET | Current user + org state (used by `AuthProvider`) |
| `/api/auth/active-org` | POST | Set `kg_active_org` cookie |
| `/api/auth/organization-token` | GET | Fetch Logto org JWT for Supabase |
| `/api/auth/organizations` | GET | List user's organizations |
| `/api/stripe/checkout` | POST | Create Stripe Checkout session |
| `/api/stripe/portal` | POST | Open Stripe Customer Portal |
| `/api/webhooks/stripe` | POST | Stripe webhook (subscription lifecycle) |
| `/api/webhooks/logto` | POST | Logto webhook (user/org events) |

---

## Key Database Tables

All tenant-scoped tables have `organization_id TEXT NOT NULL`.

`profiles`, `companies`, `user_roles`, `job_profiles`, `pay_bands`, `employees`,
`info_requests`, `audit_logs`, `onboarding_data`, `consultation_bookings`

Subscription state: `companies.subscription_tier`, `companies.subscription_status`, `companies.trial_ends_at`.

Migrations in `supabase/migrations/`. Apply via Supabase dashboard or `supabase db push`.

---

## Key Hooks (Client)

| Hook | What it provides |
|---|---|
| `useAuth` | `user`, `role`, `orgId`, `organization`, `supabase`, `loading`, `signOut`, `refreshAuth` |
| `useCompany` | Company CRUD |
| `useEmployees` | Employee management |
| `usePayEquity` | Pay group / gap analytics |
| `usePermissions` | Fine-grained permission checks |
| `useAuditSystem` | Audit log writes |

---

## Environment Variables (required)

```bash
# Logto
LOGTO_ENDPOINT             # https://auth.klargehalt.de
LOGTO_APP_ID
LOGTO_APP_SECRET
LOGTO_COOKIE_SECRET
APP_BASE_URL               # https://app.klargehalt.de

# Logto M2M (Management API — used to create orgs)
LOGTO_M2M_APP_ID
LOGTO_M2M_APP_SECRET
LOGTO_MANAGEMENT_API_RESOURCE

# Logto Webhook
LOGTO_WEBHOOK_SECRET

# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_BASIS_MONTHLY
STRIPE_PRICE_BASIS_YEARLY
STRIPE_PRICE_PROFESSIONAL_MONTHLY
STRIPE_PRICE_PROFESSIONAL_YEARLY

# Other
GOOGLE_GEMINI_API_KEY
NEXT_PUBLIC_ROOT_DOMAIN    # klargehalt.de
NEXT_PUBLIC_APP_URL        # https://app.klargehalt.de
```
