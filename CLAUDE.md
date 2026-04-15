# CLAUDE.md

## Commands

```bash
npm run dev        # Dev server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint via Next.js
npx tsc --noEmit   # TypeScript strict check (run after every change)
```

No test suite — validation is `tsc --noEmit` + `npm run lint`.

---

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
| Database | Supabase (PostgreSQL + RLS), project ref `btbucjkczpejplykyvkj` |
| UI | shadcn/ui + Tailwind CSS |
| Data fetching | TanStack Query |
| Charts | Recharts |
| Billing | Stripe (Checkout + Customer Portal) |
| AI | Google Gemini API |
| Error tracking | Sentry (org: `kitech-software-ug-haftungsbes`, project: `klargehalt`) |

---

## Claude's External Access & CLI Tools

This section documents what Claude can directly access and operate without the user having to take action.

### Available CLIs (installed on this server)

| Tool | Version | Status | Auth |
|---|---|---|---|
| `gh` (GitHub CLI) | 2.89.0 | ✅ Authenticated | as `KITechSoftwareUG`, token in `~/.config/gh/hosts.yml` |
| `supabase` CLI | 2.90.0 | ✅ Authenticated | token in `~/.bashrc` as `SUPABASE_ACCESS_TOKEN` |
| `docker` | system | ✅ Available | `deploy` user is in `docker` group |
| `git` | system | ✅ SSH key set up | pushes to `git@github.com:KITechSoftwareUG/klargehalt-9c0827ae.git` |

### GitHub

- **Repo:** `KITechSoftwareUG/klargehalt-9c0827ae`
- **Access:** Full repo access via `gh` CLI and SSH git push
- Claude can: open PRs, create issues, list branches, push code, trigger deploys via push to `main`

### Coolify (Infrastructure)

- **URL:** `https://coolify.klargehalt.de`
- **API Key:** stored in `~/.bashrc` as `$COOLIFY_TOKEN`
- **Usage:** `curl -H "Authorization: Bearer $COOLIFY_TOKEN" https://coolify.klargehalt.de/api/v1/...`
- Claude can: list apps, trigger deploys, check status, read logs

#### The 4 Coolify Projects

| Coolify Project | Description | Coolify UUID |
|---|---|---|
| `klargehalt` | Main app project | `cijcpjf9d94vrgyhkb1y6fvm` |
| `klargehalt-landingpage` | Landing page project | `qqubklvo2plewcm3gx08ba13` |
| `klargehalt-authentification` | Logto auth service | `aeoj9el1f8g5gdvglanqmo07` |
| `klargehalt-db` | Database service | `scza7s6zfz6g0jtq31vu4wmo` |

#### Running Applications (Coolify App UUIDs)

| App | URL | Coolify App UUID | Repo |
|---|---|---|---|
| Logto Auth | `https://auth.klargehalt.de` | `ny3741zf7n7yun8fgpm2ihyt` | Docker image |
| Next.js App | `https://app.klargehalt.de` | `v5p64dvnh80subyrs1nbla9b` | `klargehalt-9c0827ae:main` |
| Next.js Marketing | `https://klargehalt.de`, `https://www.klargehalt.de` | `arr98w1h25xc16wd35xuwcjn` | `klargehalt-9c0827ae:main` |

**CRITICAL:** App and Marketing are the **same GitHub repo deployed twice**. `middleware.ts` routes by
`host` header: `app.*` → protected app, everything else → marketing site. Push to `main` deploys both.

Trigger manual redeploy via Coolify API:
```bash
curl -X POST -H "Authorization: Bearer $COOLIFY_TOKEN" \
  https://coolify.klargehalt.de/api/v1/applications/v5p64dvnh80subyrs1nbla9b/restart
```

### Supabase

- **Project ref:** `btbucjkczpejplykyvkj`
- **Region:** West EU (Ireland)
- **CLI token:** stored in `~/.bashrc` as `SUPABASE_ACCESS_TOKEN`
- Claude can: run migrations (`supabase db push`), create new migrations, inspect schema

**Link project before running migrations:**
```bash
export SUPABASE_ACCESS_TOKEN=...   # already in ~/.bashrc
cd /home/deploy/app
supabase link --project-ref btbucjkczpejplykyvkj   # requires DB password once
supabase db push                                     # apply pending migrations
```

> **Note:** If Supabase project is paused (free tier), unpause at
> https://supabase.com/dashboard/project/btbucjkczpejplykyvkj before running CLI commands.

### What Claude Cannot Access Directly

| Service | How to access |
|---|---|
| Coolify dashboard UI | Browser: `https://coolify.klargehalt.de` |
| Supabase dashboard | Browser: `https://supabase.com/dashboard/project/btbucjkczpejplykyvkj` |
| Logto admin panel | Browser: `https://auth.klargehalt.de` (admin UI) |
| Stripe dashboard | Browser: `https://dashboard.stripe.com` |
| Sentry dashboard | Browser: `https://sentry.io` |

---

## Infrastructure & Deployment Architecture

### Deployment Flow

```
git push origin main
    │
    ├── Coolify webhook (GitHub → Coolify)
    │       ├── Builds & deploys → https://app.klargehalt.de
    │       └── Builds & deploys → https://klargehalt.de (same image)
    │
    └── Sentry source maps upload (automatic via next.config.ts)
```

### Host-Based Routing (middleware.ts)

Both `app.klargehalt.de` and `klargehalt.de` run the **exact same Next.js build**. The `middleware.ts`
on the edge checks the `host` header to decide what to serve:

```
host = app.klargehalt.de  →  protected app (auth required, / redirects to /dashboard)
host = klargehalt.de      →  public marketing site (no auth)
```

This means route groups in the codebase map directly:
- `app/(marketing)/` → served when host is `klargehalt.de`
- `app/(app)/` → served when host is `app.klargehalt.de`

### Auth Flow (Logto + Supabase)

```
User → app.klargehalt.de
    │
    ├── middleware.ts: check Logto session cookie
    │       └── not authenticated → redirect to /sign-in
    │
    ├── /sign-in → Logto OIDC (auth.klargehalt.de)
    │       └── returns JWT + sets kg_active_org cookie
    │
    ├── API route /api/auth/me → getServerAuthContext()
    │       └── reads Logto claims + kg_active_org cookie
    │
    └── Supabase RLS
            └── Bearer JWT from Logto org token
                auth.get_user_org_id() extracts orgId from JWT claim
```

**JWT lag warning:** Logto only refreshes org claims on next login. After org creation, `kg_active_org`
cookie is source of truth. Real security enforcement is always Supabase RLS.

### Security Model ("Fortress Database")

1. **Edge (middleware):** lightweight auth check — redirects unauthenticated users only
2. **API layer:** `getServerAuthContext()` validates session — gates server-side logic
3. **Database (RLS):** final enforcement — every tenant-scoped query is filtered by `organization_id`

Every table with tenant data has `organization_id TEXT NOT NULL`. RLS function `auth.get_user_org_id()`
extracts the org from the Bearer JWT. Even a compromised frontend cannot read another tenant's data.

---

## Route Groups

| Group | Path | Purpose |
|---|---|---|
| `(marketing)` | `/`, `/preise`, `/funktionen`, `/agb`, `/datenschutz`, `/impressum`, `/kontakt`, `/sicherheit`, `/ueber-uns`, `/eu-richtlinie` | Public marketing site |
| `(app)` | `/dashboard`, `/onboarding`, `/book-consulting`, `/sign-in`, `/sign-up` | Authenticated app |

### Dashboard sub-routes

| Path | Component | Roles |
|---|---|---|
| `/dashboard` | `DashboardOverview` | all |
| `/dashboard/hr-analytics` | HR analytics & pay gap | admin, hr_manager |
| `/dashboard/management` | Job profiles, pay bands, employees | admin, hr_manager |
| `/dashboard/my-salary` | Employee self-service | employee |

---

## Auth & Multi-Tenancy (Logto + Supabase)

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

The server `createClient()` fetches the Logto org token at request time and injects it as `Authorization: Bearer`
so every Supabase query goes through RLS with the correct org identity.

The client-side `createSupabaseClient()` in `utils/supabase/client.ts` intercepts every fetch and injects a
fresh token — no per-hook token management needed.

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

Three tiers: `basis` (€99/mo, €990/yr) | `professional` (€299/mo, €2990/yr) | `enterprise` (on request).
14-day trial at Professional tier on signup. Trial tier constant: `TRIAL_TIER = 'professional'`.

Plan limits:
- `basis`: 50 employees, 1 admin, 1 HR manager
- `professional`: 250 employees, 5 admins, unlimited HR managers
- `enterprise`: unlimited

| Feature flag | Minimum tier |
|---|---|
| `pay_gap_analysis` | professional |
| `pdf_reports` | professional |
| `trend_analysis` | professional |
| `priority_support` | professional |
| `advanced_audit` | professional |
| `sso` | enterprise |
| `auditor_access` | enterprise |
| `custom_integrations` | enterprise |

Helpers in `lib/subscription.ts`: `hasFeature()`, `getEffectiveTier()`, `getTrialDaysRemaining()`.
Server-side: `lib/subscription-server.ts`.

Stripe Price IDs from env: `STRIPE_PRICE_BASIS_MONTHLY`, `STRIPE_PRICE_BASIS_YEARLY`,
`STRIPE_PRICE_PROFESSIONAL_MONTHLY`, `STRIPE_PRICE_PROFESSIONAL_YEARLY`.

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

| Table | Purpose |
|---|---|
| `profiles` | User profile data |
| `companies` | Tenant company info + subscription state |
| `user_roles` | RBAC roles per user per org |
| `job_profiles` | Job profiles / positions |
| `pay_bands` | Salary bands per job profile |
| `employees` | Employee records with salary data |
| `info_requests` | Employee pay transparency requests |
| `audit_logs` | Immutable audit trail |
| `onboarding_data` | Onboarding wizard state |
| `consultation_bookings` | Consulting session bookings |

Subscription state columns: `companies.subscription_tier`, `companies.subscription_status`,
`companies.trial_ends_at`.

Migrations in `supabase/migrations/`. Apply via:
```bash
supabase db push   # requires supabase link first (see CLI section above)
```

---

## Key Hooks (Client)

| Hook | What it provides |
|---|---|
| `useAuth` | `user`, `role`, `orgId`, `organization`, `supabase`, `loading`, `signOut`, `refreshAuth` |
| `useCompany` | Company CRUD |
| `useEmployees` | Employee management |
| `usePayEquity` | Pay group / gap analytics |
| `usePayGapStatistics` | Gender pay gap stats |
| `useJobProfiles` | Job profile CRUD |
| `usePayBands` (via job profiles) | Salary band data |
| `usePermissions` | Fine-grained permission checks |
| `useAuditSystem` | Audit log writes |
| `useSubscription` | Current tier + feature flags |
| `useDepartments` | Department list |
| `useInfoRequests` | Pay transparency request management |

---

## Component Library

UI components in `components/ui/` (shadcn/ui). Key domain components:

| Component | Location | Purpose |
|---|---|---|
| `DashboardOverview` | `components/dashboard/` | Main dashboard home |
| `EmployeesView` | `components/dashboard/` | Employee management table |
| `PayBandsView` | `components/dashboard/` | Salary band editor |
| `JobProfilesView` | `components/dashboard/` | Job profile management |
| `PayGapReportView` | `components/dashboard/` | Gender pay gap analytics |
| `PayEquityHRView` | `components/dashboard/` | HR pay equity analysis |
| `AuditLogsView` | `components/dashboard/` | Audit trail viewer |
| `RoleGuard` | `components/` | RBAC UI gate |
| `SubscriptionGate` | `components/` | Feature flag gate |
| `TrialBanner` | `components/` | Trial countdown banner |

---

## Environment Variables (required)

```bash
# Logto
LOGTO_ENDPOINT             # https://auth.klargehalt.de
LOGTO_APP_ID
LOGTO_APP_SECRET
LOGTO_COOKIE_SECRET
APP_BASE_URL               # https://app.klargehalt.de

# Logto M2M (Management API — used to create orgs on signup)
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

Env vars at `.env` in the project root (gitignored). Coolify injects these at build/runtime.
