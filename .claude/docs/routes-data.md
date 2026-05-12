# Routes, API, Database & Hooks

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
| `/api/members` | GET | List active org members + seat usage |
| `/api/members/invite` | POST | Invite admin/hr_manager via email (seat-limited) |
| `/api/members/[id]` | PATCH/DELETE | Change role / remove member (owner protected) |
| `/api/employees/invite` | POST | Give existing employee record a Logto login |

---

## Key Database Tables

All tenant tables: `organization_id TEXT NOT NULL`. Migrations: `supabase/migrations/` → `supabase db push`.

| Table | Purpose |
|---|---|
| `companies` | Tenant info + `subscription_tier/status/trial_ends_at/stripe_customer_id` |
| `organization_members` | **RBAC source of truth** — user_id × org_id × role × status × access_expires_at |
| `plans` | Reference data — seat limits per tier (basis/professional/enterprise) |
| `subscription_changes` | Append-only audit log of subscription lifecycle (Stripe webhook) |
| `user_roles` | _Legacy_ — still populated for backward compat, will be dropped post-MVP |
| `employees` | Employee records + salary (HR data, login optional via `user_id`) |
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
