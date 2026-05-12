# CLAUDE.md

## What This Is

**klargehalt** — B2B SaaS for EU pay-transparency compliance (Entgelttransparenzrichtlinie 2023/970).
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

## MVP-Szenario (Stand 2026-05-12)

**Ein-Satz-MVP:** _Eine HR-Leiterin loggt sich ein, legt ihre Compliance-Daten an, sieht Pay-Gaps, dokumentiert Gehaltsentscheidungen — und kann nach Plan-Limit weitere Team-Mitglieder einladen._

**Happy Path (Single-User-Standard):**
1. HR-Leiterin signt sich auf `klargehalt.de/preise` → Stripe Checkout (oder 14-Tage-Trial) → Sign-up
2. Onboarding: wählt "Ich bin HR-Manager" + Firmendaten + Plan → wird **automatisch `owner`** ihrer Organisation
3. Sie legt allein an: Departments → Job-Profile → Job-Levels → Pay-Bands → Mitarbeiter
4. Sie sieht Gaps in `/dashboard/pay-equity-hr` und PayGapReport
5. Sie dokumentiert Salary-Decisions (Hire/Raise/Promotion) in EmployeesView
6. Bei Bedarf: lädt weitere Team-Mitglieder ein (admin / hr_manager) im **Billing-Bereich**, gemäß Plan-Limits

**Erste Person = Owner.** Die im Onboarding selbst-gewählte Rolle (`selfReportedRole`) ist nur Analytics. Der erste User einer Organisation bekommt immer `role: 'owner'` in `organization_members`. Das ist der Inhaber des Tenant. Bei Einladungen wählt der Owner explizit die Rolle.

**Was im MVP NICHT enthalten ist (post-MVP):**
- `auditor`-Rolle (Enterprise, später)
- Lawyer-Cleanup-Job für abgelaufene Reviewer
- `user_roles`-Tabelle endgültig droppen (Code liest schon aus `organization_members`)
- Employee-Self-Service-Logins (Mitarbeiter sehen eigenen Lohn) — Records bleiben datenseitig

---

## Build Status (2026-05-12)

**Done:** Job Profiles, Pay Bands, Job Levels, Departments, Pay Gap Report, HR Pay Equity, Audit Logs, Lawyer Dashboard/Reviews/Badge, Joint Assessment, Compliance Score, RBAC, Stripe Billing, Super-Admin Panel, salary decision documentation.

**Product core status:**

| Area | Status |
|---|---|
| `salary_decisions` table + append-only trail | ✅ built |
| Decision Documentation UI in EmployeesView | ✅ built |
| Lawyer ↔ Decision link | ✅ built via optional `lawyer_review_id` |

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

**Authoritative Tabelle:** `organization_members` (Migration `20260509020000`). Die alte `user_roles`-Tabelle existiert noch für Rückwärtskompatibilität, wird aber im post-MVP gedroppt. Alle neuen Reads gehen gegen `organization_members`.

| Role | Access | Created via |
|---|---|---|
| `owner` | Volles Zugriff + nicht entfernbar (Tenant-Inhaber) | Auto beim Onboarding (erste Person) |
| `admin` | Volles Zugriff (Billing, Audit, Settings, alle Daten) | Invite durch owner/admin |
| `hr_manager` | Mitarbeiter, Pay-Bands, Job-Profile, Reports — KEIN Billing/Audit/Settings | Invite durch owner/admin |
| `employee` | Datensatz-Träger ohne Portal-Zugang (Sidebar leer) — eigener Lohn read-only via RLS | Manuell durch HR (`employees.user_id` optional) |
| `lawyer` | Read salary_decisions/bands/reports; write `lawyer_reviews`; time-limited (default 90d) | Service-role only |
| `auditor` | Reserviert für Enterprise — noch nicht in UI | post-MVP |

Super-admin: hardcoded Logto user ID check in `/api/admin/users` + `/dashboard/admin` (not a DB role).

```tsx
<RoleGuard roles={['admin', 'hr_manager']}><Component /></RoleGuard>
const canEdit = useRoleAccess('admin', 'hr_manager')
```

Real enforcement is always Supabase RLS — frontend gating is UX only.

**Helpers (RLS-side):**
- `public.org_id()` — extracts org from JWT `aud` claim
- `public.is_org_admin()` — `owner` OR `admin`, status active, not expired
- `public.is_hr_or_admin()` — `owner`, `admin` OR `hr_manager`, status active, not expired
- `public.is_org_member()` — any active member with valid access window

---

## Team Members (Invite-Flow)

**Plan-Limits** (Tabelle `plans`):

| Plan | max_admin_seats | max_hr_seats | max_employee_records |
|---|---|---|---|
| `basis` | 1 | 1 | 50 |
| `professional` | 5 | unlimited (-1) | 250 |
| `enterprise` | unlimited | unlimited | unlimited |

`owner`-Sitz zählt mit zu `max_admin_seats`. Trigger `check_org_member_seat_limit()` enforced auf DB-Ebene mit `pg_advisory_xact_lock`.

**Invite-Flow (Team-Mitglieder, NICHT employee-Records):**
1. Owner/Admin öffnet `/dashboard/billing` → Sektion "Team-Mitglieder"
2. Klickt "Einladen" → Email + Rolle (admin / hr_manager) eingeben
3. `POST /api/members/invite` → `inviteMemberToOrg()` in `lib/logto-management.ts`:
   - Findet oder erstellt Logto-User mit Email
   - Fügt zu Logto-Org hinzu
   - Schreibt `organization_members` Row (status=`active`, gewählte Rolle)
   - Trigger prüft Seat-Limit, blockiert mit Upgrade-Hinweis bei Überschreitung
4. Eingeladener User loggt sich mit Email + temp Passwort ein, ändert Passwort

**Member-Management:**
- `GET /api/members` — Liste aller aktiven Members + Seat-Usage
- `PATCH /api/members/[id]` — Rolle ändern (admin ↔ hr_manager). `owner` kann nicht degradiert werden.
- `DELETE /api/members/[id]` — Member entfernen (status=`removed`). `owner` kann nicht entfernt werden.

**Employee-Invites** (separate Flow): `POST /api/employees/invite` mit `employeeId` — gibt einem bestehenden `employees`-Record einen Logto-Login mit `employee`-Rolle. Nicht Teil des MVP-Team-Flows.

---

## Subscription & Feature Flags

Tiers: `basis` (€149/mo, €1490/yr) | `professional` (€299/mo, €2690/yr) | `enterprise` (on request).
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

## Mail-Infrastruktur & DNS

**Architektur:** Zwei parallele Mail-Systeme auf einer Domain.

| System | Zweck | Sending domain |
|---|---|---|
| Microsoft 365 | Business-Kommunikation (Outlook, Teams) | `klargehalt.de` via M365 SMTP |
| Resend | Transactional / System-Mails | `klargehalt.de` via Resend API |

**DNS-Status (Cloudflare, Stand 2026-05-11):**

| Record | Wert | Status |
|---|---|---|
| MX `@` | `klargehalt-de.mail.protection.outlook.com` (Prio 0) | ✅ |
| CNAME `autodiscover` | `autodiscover.outlook.com` | ✅ |
| CNAME `selector1._domainkey` | `selector1-klargehalt-de._domainkey.kitechsoftwareug.p-v1.dkim.mail.microsoft` | ✅ |
| CNAME `selector2._domainkey` | `selector2-klargehalt-de._domainkey.kitechsoftwareug.p-v1.dkim.mail.microsoft` | ✅ |
| TXT `@` SPF | `v=spf1 include:spf.protection.outlook.com include:spf.resend.com ~all` | ✅ |
| TXT `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:aalkh@klargehalt.de` | ✅ |
| TXT `resend._domainkey` | Resend DKIM Public Key | ✅ |
| TXT `@` | `MS=ms45156943` (M365-Verifizierung) | ✅ |

**VPS-Subdomains (unberührt):**

| Record | Wert |
|---|---|
| A `klargehalt.de` | 85.215.219.202 (Proxied via Cloudflare) |
| CNAME `app` | klargehalt.de → VPS |
| CNAME `auth` | klargehalt.de → VPS |
| A `coolify` | 85.215.219.202 (DNS only) |

**Wichtig:** DKIM in M365 Defender muss nach DNS-Propagation aktiviert werden:
`Microsoft Defender → E-Mail & Zusammenarbeit → DKIM → klargehalt.de → Aktivieren`

---

## Team Emails

**Microsoft 365 Postfächer (alle Aliases → `aalkh@klargehalt.de`):**

| Address | Owner | Purpose |
|---|---|---|
| `aalkh@klargehalt.de` | Ayham Alkhalil | Personal / intern — primäres M365-Konto |
| `lbatt@klargehalt.de` | Leon Battel | Personal / intern (Alias: `leon.battel@klargehalt.de`) |

**Aliases auf `aalkh@klargehalt.de` (alle in Microsoft 365):**

| Alias | Verwendung (Landingpage / Code) |
|---|---|
| `info@klargehalt.de` | Impressum, allgemeiner Kontakt, Marketing-Kontaktformular |
| `kontakt@klargehalt.de` | Alternative Kontaktadresse (DE-Publikum) |
| `support@klargehalt.de` | Support-Kommunikation, Kundenservice |
| `sales@klargehalt.de` | Sales-Anfragen, Lawyer-CTA, Enterprise-Anfragen |
| `billing@klargehalt.de` | Billing-Bestätigungen, Zahlungsfehler |
| `datenschutz@klargehalt.de` | Datenschutz-/DSGVO-Seiten, Privacy-Kontakt |
| `legal@klargehalt.de` | Rechtliche Anfragen |
| `security@klargehalt.de` | Security-Disclosures |

**Email routing in code (`lib/email.ts`):**
- Transactional (welcome, trial) → `noreply@klargehalt.de` *(Resend — nicht M365)*
- Support comms → `support@klargehalt.de`
- Billing confirmations & payment failures → `billing@klargehalt.de`
- Privacy/DSGVO pages → `datenschutz@klargehalt.de`
- Marketing contact form + Impressum → `info@klargehalt.de`
- Sales inquiries (lawyer CTA, enterprise) → `sales@klargehalt.de`
- Legal matters → `legal@klargehalt.de`
- Security disclosures → `security@klargehalt.de`

**Landingpage-Zuordnung:**
- Impressum → `info@klargehalt.de`
- Datenschutzerklärung → `datenschutz@klargehalt.de`
- Kontaktformular → `kontakt@klargehalt.de` oder `info@klargehalt.de`
- Pricing CTA / Sales → `sales@klargehalt.de`
- Support-Link → `support@klargehalt.de`

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
