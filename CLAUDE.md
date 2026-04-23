# CLAUDE.md

## What This Is

**KlarGehalt** — B2B SaaS for EU pay-transparency compliance (Entgelttransparenzrichtlinie 2023/970).
Target: German/EU companies (100–500 employees) proving fair salaries. Buyer: CEO or HR Lead.

**We sell:** "If someone asks or sues — you are prepared. And an external lawyer has already reviewed it."
**Not:** "Transparent salary bands."

### The 5 Core Pillars

| Pillar | Code meaning |
|---|---|
| **1. Compensation Structure** | Job profiles, levels, pay bands |
| **2. Decision Documentation** | `salary_decisions` — every salary event with justification — **this is the product** |
| **3. Gap Detection** | Flags >5% gender/group pay gaps — legal obligation |
| **4. Audit Trail** | Immutable, timestamped per-employee history |
| **5. External Validation** | Vetted lawyer reviews via KlarGehalt — defensible paper trail |

**Critical wording:** Never "rechtssicher" / "gesetzlich geprüft". Only "von externem Rechtsberater geprüft".

---

## Build Status (2026-04-21)

**Done:** Job Profiles, Pay Bands, Job Levels, Departments, Pay Gap Report, HR Pay Equity, Audit Logs, Lawyer Dashboard/Reviews/Badge, Joint Assessment, Compliance Score, RBAC, Stripe Billing, Super-Admin Panel.

**CRITICAL MISSING — the product core:**

| Gap | Status |
|---|---|
| `salary_decisions` table + append-only trail | ❌ not built |
| Decision Documentation UI in EmployeesView | ❌ not built |
| Lawyer ↔ Decision link | ❌ not built |

`salary_decisions` schema (append-only, no UPDATE/DELETE via RLS):
```
employee_id, decision_type (hire|raise|promotion|band_change|correction),
old_salary, new_salary, justification_text (required),
justification_factors JSON, decided_by_user_id, decided_at,
pay_band_id (snapshot), comparator_data JSON (snapshot at write),
lawyer_review_id FK
```

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| Auth | Logto (self-hosted, OIDC) |
| Database | Supabase (PostgreSQL + RLS), ref `btbucjkczpejplykyvkj` |
| UI | shadcn/ui + Tailwind CSS |
| Data fetching | TanStack Query |
| Charts | Recharts |
| Billing | Stripe (Checkout + Customer Portal) |
| AI | Google Gemini API |
| Error tracking | Sentry (org: `kitech-software-ug-haftungsbes`, project: `klargehalt`) |

---

## Commands

```bash
npm run dev        # Dev server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint via Next.js
npx tsc --noEmit   # TypeScript strict check (run after every change)
```

No test suite — validation is `tsc --noEmit` + `npm run lint`.

**Chrome Testing (MANDATORY):** After every UI change — use `chrome-devtools` MCP tools, test golden path, check browser console for errors. Do NOT mark complete without Chrome verification.

---

## Architecture

**Same build, two domains.** `middleware.ts` checks `host` header at the edge:
- `host.startsWith('app.')` → auth-enforced app (`/` → `/dashboard` redirect)
- everything else → marketing passthrough (`NextResponse.next()`)

**Auth-exempt on `app.*`:** `/auth/*`, `/callback`, `/api/auth/*`, `/api/webhooks/*`, `/api/healthz`

**Security model (3 layers):**
1. Edge (middleware): redirects unauthenticated users
2. API layer: `getServerAuthContext()` gates server-side logic
3. Database (RLS): final enforcement — `public.org_id()` extracts org from JWT `aud` claim (`urn:logto:organization:<id>`)

**JWT lag:** Logto refreshes `organizations` claim only on next login. Post-onboarding, `kg_active_org` cookie is sole org identity — `getServerAuthContext()` appends cookie org to JWT list. Real enforcement is always Supabase RLS.

> Full OIDC sign-up flow (11 steps), cookie lifecycle, plan intent gap → skill `klargehalt-auth-flow`
> Stripe checkout, webhooks, reconcile, email, cron, DNS → skill `klargehalt-billing`
> Coolify UUIDs, CLI deploy commands, Supabase link → skill `klargehalt-infra`

---

## Auth Patterns

```ts
// Client component — always from useAuth(), never instantiate directly
const { supabase, user, orgId, role } = useAuth()

// Server component / API route
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()       // reads kg_active_org, injects org JWT
const supabase = await createClient(orgId)  // explicit override
```

Server context: `getServerAuthContext()` from `lib/auth/server.ts`
Client context: `useAuth()` from `hooks/useAuth.tsx`

---

## RBAC

Roles in `user_roles` table:

| Role | Access |
|---|---|
| `admin` | Full company data |
| `hr_manager` | Employees, pay bands, analytics |
| `employee` | Own salary only (`/dashboard/my-salary`) |
| `lawyer` | Read salary decisions/bands/reports for one org; write `lawyer_reviews`; time-limited |

Super-admin: hardcoded Logto user ID check in `/api/admin/users` + `/dashboard/admin` (not a DB role).

```tsx
<RoleGuard roles={['admin', 'hr_manager']}><Component /></RoleGuard>
const canEdit = useRoleAccess('admin', 'hr_manager')
```

Real enforcement is always Supabase RLS — frontend gating is UX only.

---

## Subscription & Feature Flags

Tiers: `basis` (€149/mo, €990/yr) | `professional` (€299/mo, €2990/yr) | `enterprise` (on request).
14-day trial at `professional`. `getEffectiveTier()`: `active`/`trialing` → full | `past_due`/`canceled` → `basis`.

| Feature flag | Tier |
|---|---|
| `pay_gap_analysis`, `pdf_reports`, `trend_analysis`, `decision_documentation`, `lawyer_review`, `priority_support`, `advanced_audit` | professional |
| `sso`, `custom_integrations` | enterprise |

Helpers: `hasFeature()`, `getEffectiveTier()`, `getTrialDaysRemaining()` in `lib/subscription.ts` (server: `lib/subscription-server.ts`).

**Anwaltsprüfung add-on:** €799 one-time / €399 renewal. Professional+ only. Independent lawyer, not KlarGehalt employee.

---

## Routes

**Marketing** (`klargehalt.de`, `app/(marketing)/`): `/`, `/preise`, `/funktionen`, `/eu-richtlinie`, legal pages.

**App standalone** (no sidebar): `/sign-in`, `/sign-up`, `/onboarding` (auth yes / no org), `/book-consulting`.

**Dashboard** (`/dashboard/*`, role-filtered sidebar):

| Section | Paths | Roles |
|---|---|---|
| Compliance | `/dashboard`, `/joint-assessment`, `/job-postings`, `/hr-requests`, `/rights-notifications` | admin, hr_manager |
| Analytics | `/overview`, `/pay-equity-hr`, `/pay-equity-mgmt`, `/reports` | admin, hr_manager (+lawyer for reports) |
| Verwaltung | `/employees`, `/my-salary`, `/departments`, `/job-levels`, `/job-profiles`, `/pay-bands`, `/requests` | admin, hr_manager (my-salary: all) |
| Admin | `/audit`, `/billing`, `/settings` | admin |
| Lawyer portal | `/lawyer-reviews`, `/reports`, `/joint-assessment`, `/audit` | lawyer |
| Super-admin | `/admin` | hardcoded user ID |

---

## Key API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/me` | GET | Current user + org state |
| `/api/auth/active-org` | POST | Set `kg_active_org` cookie |
| `/api/auth/organization-token` | GET | Logto org JWT for Supabase |
| `/api/stripe/checkout` | POST | Create Stripe Checkout session |
| `/api/stripe/portal` | POST | Stripe Customer Portal |
| `/api/stripe/reconcile` | GET/POST | Detect + fix Stripe/DB mismatches |
| `/api/webhooks/stripe` | POST | Subscription lifecycle |
| `/api/webhooks/logto` | POST | User/org events (welcome email) |
| `/api/admin/users` | GET | Super-admin user list |
| `/api/lawyer/request` | POST | Request Anwaltsprüfung |
| `/api/lawyer/review` | POST | Submit lawyer verdict |
| `/api/cron/trial-reminder` | GET | Trial expiry emails (auth: `x-cron-secret`) |

---

## Key Database Tables

All tenant tables: `organization_id TEXT NOT NULL`. Migrations: `supabase/migrations/` → `supabase db push`.

| Table | Purpose |
|---|---|
| `companies` | Tenant info + `subscription_tier/status/trial_ends_at/stripe_customer_id` |
| `user_roles` | RBAC per user per org |
| `employees` | Employee records + salary |
| `salary_decisions` | **Append-only decision trail — the compliance core** |
| `job_profiles` / `pay_bands` / `job_levels` / `departments` | Compensation structure |
| `audit_logs` | Immutable audit trail |
| `lawyer_profiles` / `lawyer_requests` / `lawyer_reviews` | Lawyer flow |
| `info_requests` | Employee pay transparency requests |
| `onboarding_data` / `consultation_bookings` | Ops |
| `processed_stripe_events` | Stripe idempotency — service role only |
| `rate_limit_entries` | Rate limiter — service role only |

---

## Key Hooks & Components

| Hook | Provides |
|---|---|
| `useAuth` | `user, role, orgId, organization, supabase, loading, signOut, refreshAuth` |
| `useCompany` / `useEmployees` / `useJobProfiles` | Entity CRUD |
| `usePayEquity` / `usePayGapStatistics` | Analytics |
| `useSubscription` | Tier + feature flags |
| `usePermissions` / `useAuditSystem` | RBAC + audit |
| `useDepartments` / `useInfoRequests` | Supporting data |

Key components in `components/dashboard/`: `DashboardOverview`, `EmployeesView`, `PayBandsView`, `JobProfilesView`, `PayGapReportView`, `PayEquityHRView`, `AuditLogsView`.
Gates: `<RoleGuard>`, `<SubscriptionGate>`, `<TrialBanner>`.

---

## Environment Variables

```bash
# Logto
LOGTO_ENDPOINT  LOGTO_APP_ID  LOGTO_APP_SECRET  LOGTO_COOKIE_SECRET  APP_BASE_URL
LOGTO_M2M_APP_ID  LOGTO_M2M_APP_SECRET  LOGTO_MANAGEMENT_API_RESOURCE  LOGTO_WEBHOOK_SECRET
# Supabase
NEXT_PUBLIC_SUPABASE_URL  NEXT_PUBLIC_SUPABASE_ANON_KEY  SUPABASE_SERVICE_ROLE_KEY
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  STRIPE_SECRET_KEY  STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_BASIS_MONTHLY  STRIPE_PRICE_BASIS_YEARLY
STRIPE_PRICE_PROFESSIONAL_MONTHLY  STRIPE_PRICE_PROFESSIONAL_YEARLY
# Other
GOOGLE_GEMINI_API_KEY  RESEND_API_KEY  CRON_SECRET
NEXT_PUBLIC_ROOT_DOMAIN  NEXT_PUBLIC_APP_URL
```

---

## Team Emails

| Address | Owner | Purpose |
|---|---|---|
| `aalkh@klargehalt.de` | Ayham Alkhalil | Personal / internal |
| `info@klargehalt.de` | Shared inbox | Primary contact (aliases: `datenschutz@`, `support@`, `sales@`, `billing@`) |
| `lbatt@klargehalt.de` | Leon Battel | Personal / internal (alias: `leon.battel@klargehalt.de`) |

**Email routing in code (`lib/email.ts`):**
- Transactional (welcome, trial) → `noreply@klargehalt.de`
- Support comms → `support@klargehalt.de`
- Billing confirmations & payment failures → `billing@klargehalt.de`
- Privacy/DSGVO pages → `datenschutz@klargehalt.de`
- Marketing contact form + Impressum → `info@klargehalt.de`
- Sales inquiries (lawyer CTA, enterprise) → `sales@klargehalt.de`

---

## Hard Failure Modes

| # | Failure | Detection | Fix |
|---|---|---|---|
| 1 | Stripe customer created, `stripe_customer_id` not written to Supabase | `GET /api/stripe/reconcile` | `POST /api/stripe/reconcile` |
| 2 | Stripe webhook fires, Supabase down | Stripe retries 3 days | Retries + reconcile |
| 3 | No cron job for trial reminders | Check Coolify cron | Configure Coolify task → `/api/cron/trial-reminder` |
| 4 | Logto `User.Created` fires twice | No idempotency | Add `processed_logto_events` table (P1) |
| 5 | `?plan=` on `/sign-in` URL (not `/sign-up`) | No detection | Route sign-in `?plan=` to cookie same as sign-up |
| 7 | `RESEND_API_KEY` missing | First send throws | Add startup env check |
| 8 | `decision_documentation` missing from `FEATURE_FLAGS` | `hasFeature()` always false | Add to FEATURE_FLAGS |
| 9 | pg_cron `cleanup_expired_trial_accounts` not scheduled | No detection | Run `SELECT cron.schedule(...)` in Supabase SQL editor |

---

## MCP Tools: code-review-graph

**ALWAYS use code-review-graph tools BEFORE Grep/Glob/Read to explore the codebase.**

| Tool | Use when |
|---|---|
| `detect_changes` | Code review — risk-scored analysis |
| `get_review_context` | Source snippets — token-efficient |
| `get_impact_radius` | Blast radius of a change |
| `get_affected_flows` | Which execution paths are impacted |
| `query_graph` | Callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Find functions/classes by name or keyword |
| `get_architecture_overview` | High-level structure |

Fall back to Grep/Read only when the graph doesn't cover what you need.
