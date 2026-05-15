# Routes, API, Database & Hooks

## App-Layout-Konvention (wichtig!)

App-Routen liegen unter `app/(app)/(portal)/<de-pfad>/` — die deutschen URL-Pfade sind die echten. **Frühere docs referenzierten `/dashboard/*`-Pfade, die so nicht (mehr) existieren.**

| Bereich | Marketing | App (auth-enforced) |
|---|---|---|
| Host | `klargehalt.de` | `app.klargehalt.de` |
| Code | `app/(marketing)/*` | `app/(app)/(portal)/*` |
| Beispiel | `/preise`, `/funktionen`, `/eu-richtlinie` | `/dashboard`, `/mitarbeiter`, `/einrichtung` |

Standalone-App (kein Sidebar): `/sign-in`, `/sign-up`, `/onboarding`, `/book-consulting`, `/auth/*`, `/callback`.

---

## App-Routes (innerhalb `app.klargehalt.de`)

Sidebar gruppiert nach Lebenszyklus. Reihenfolge entspricht `MAIN_NAV` in `app/(app)/(portal)/layout.tsx`.

| Gruppe | Pfad | View-Key | Zweck | Tier-Lock | Rollen-Filter |
|---|---|---|---|---|---|
| Einrichtung | `/einrichtung` | `einrichtung` | Geführter Setup-Hub (Onboarding-Phasen, Setup-Readiness-%) | — | alle |
| | `/einrichtung/struktur` | — | Struktur-Workshop (Abteilungen + Karrierestufen kombiniert, Tech-Startup-Template) | — | alle |
| | `/einrichtung/verguetung` | — | Vergütungs-Matrix (Job-Profile × Karrierestufen als 2D-Grid) | — | alle |
| | `/einrichtung/mitarbeiter` | — | CSV-Import-Wizard (Fuzzy-Mapping + Gemini-AI-Vorschläge) | — | admin, hr_manager |
| Strukturdaten | `/abteilungen` | `abteilungen` | Departments CRUD | — | admin, hr_manager |
| | `/karrierestufen` | `karrierestufen` | Job Levels CRUD | — | admin, hr_manager |
| | `/jobprofile` | `jobprofile` | Job Profiles CRUD (mit Evaluation-Method-Info) | — | admin, hr_manager |
| | `/gehaltsbaender` | `gehaltsbaender` | Pay Bands CRUD | — | admin, hr_manager |
| Mitarbeiter | `/mitarbeiter` | `mitarbeiter` | Employees CRUD + Salary-Decision-Dialog (Begründungs-Trail) | — | admin, hr_manager |
| Compliance | `/dashboard` | `dashboard` | Compliance-Score + Pay-Gap-Karten | — | admin, hr_manager |
| | `/compliance-workflow` | `compliance-workflow` | Compliance-Prüfungen (kombiniert Joint Assessment + Anwaltsprüfung-View) | 🔒 Pro+ | admin, hr_manager, lawyer |
| Premium | `/compliance-workflow` (Anwalt-Slot) | (s.o.) | Anwaltsprüfung-Workflow (eingebettet) | 🔒 Pro+ | admin (Mgmt) |
| | `/abrechnung` | `abrechnung` | Stripe Subscription + Team-Members | — | admin |
| | `/partnerschaften` | — | (disabled, "Bald verfügbar") | — | admin |
| KI-Agenten | `/ki-agenten` | `ki-agenten` | AI-gestützte Compliance-Assistenten | 🔒 Pro+ + Trial-Lock | alle |
| Konto | `/einstellungen` | `einstellungen` | Account + Daten-Migration-Sektion | — | admin |
| | `/audit` | `audit` | Audit-Log | — | admin (oder lawyer) |
| Mitarbeiter-Self | `/mein-gehalt` | `mein-gehalt` | Eigenes Gehalt read-only (RLS via `employees.user_id`) | — | alle |
| Super-Admin | `/admin` | — | Cross-Org-User-Management (hardcoded Logto user ID check) | — | hardcoded |

**Tier-Lock-Mechanik:** `proLocked: true` im NavItem + `tier === 'basis'` → amber Lock-Icon, Klick routet zu `/abrechnung`. Real-Enforcement passiert über RLS / Feature-Flags am Server.

**Lawyer-Portal:** `LAWYER_NAV` zeigt nur `/compliance-workflow` + `/audit`.

---

## Key API Routes

### Auth & Org
| Route | Method | Purpose |
|---|---|---|
| `/api/auth/me` | GET | Current user + org state |
| `/api/auth/active-org` | POST | Set `kg_active_org` cookie |
| `/api/auth/organization-token` | GET | Logto org JWT for Supabase |
| `/api/auth/organizations` | GET | Available orgs for current user |
| `/api/auth/check-email` | POST | Pre-flight check during sign-up |
| `/api/auth/repair-role` | POST | Self-heal missing `organization_members` row |

### Subscription & Stripe
| Route | Method | Purpose |
|---|---|---|
| `/api/subscription` | GET | Active subscription + tier resolution |
| `/api/stripe/checkout` | POST | Create Stripe Checkout session |
| `/api/stripe/portal` | POST | Stripe Customer Portal |
| `/api/stripe/reconcile` | GET/POST | Detect + fix Stripe/DB mismatches |
| `/api/webhooks/stripe` | POST | Subscription lifecycle |
| `/api/webhooks/logto` | POST | User/org events (welcome email) |
| `/api/cron/stripe-reconcile` | GET | Daily reconcile (Coolify Cron) |
| `/api/cron/trial-reminder` | GET | Trial-expiry emails (auth: `x-cron-secret`) |

### Members & Employees
| Route | Method | Purpose |
|---|---|---|
| `/api/members` | GET | List active org members + seat usage |
| `/api/members/invite` | POST | Invite admin/hr_manager (seat-limited) |
| `/api/members/[id]` | PATCH/DELETE | Change role / remove member |
| `/api/employees` | GET/POST | Employee CRUD |
| `/api/employees/[id]` | PATCH/DELETE | Single employee |
| `/api/employees/invite` | POST | Give existing employee record a Logto login |

### Compensation
| Route | Method | Purpose |
|---|---|---|
| `/api/departments` | GET/POST | Departments |
| `/api/job-levels` | GET/POST | Career levels |
| `/api/job-profiles` | GET/POST | Job profiles |
| `/api/pay-bands` | GET/POST | Pay bands |
| `/api/salary-decisions` | GET/POST | Salary-decision audit trail (append-only) |

### Setup & Onboarding
| Route | Method | Purpose |
|---|---|---|
| `/api/onboarding/complete` | POST | Finalize onboarding, create org + first member |
| `/api/setup-readiness` | GET | Setup phase progress (Strukturdaten / Vergütung / Mitarbeiter / Analyse) |
| `/api/setup/csv-mapping-suggest` | POST | Gemini 2.0 Flash CSV-Header-Mapping (DSGVO-safe — keine Sample-Daten) |

### Compliance & Reporting
| Route | Method | Purpose |
|---|---|---|
| `/api/compliance/assessments` | GET/POST | Joint Pay Assessment records |
| `/api/compliance/assessments/[id]` | GET/PATCH | Single assessment |
| `/api/compliance/lawyer-lookup` | GET | Find lawyer by email or directory |
| `/api/reports/pay-gap` | GET | Pay-gap data (snapshot-based) |
| `/api/reports/pay-gap/pdf` | GET | PDF export (Pro+ only) |
| `/api/info-requests` | GET/POST | Employee pay-transparency requests |
| `/api/info-requests/submit` | POST | Public submit endpoint (rate-limited) |
| `/api/rights-notifications` | GET/POST | EU-rights-related notifications |
| `/api/job-postings` | GET/POST | Recruiting-side job posts |
| `/api/job-postings/salary-range` | GET | Auto-suggest salary range for posting |

### Admin & Misc
| Route | Method | Purpose |
|---|---|---|
| `/api/admin/users` | GET | Super-admin user list (hardcoded Logto user ID) |
| `/api/company` | GET/PATCH | Company metadata |
| `/api/contact` | POST | Public contact form |
| `/api/healthz` | GET | Liveness probe |

---

## Key Database Tables

All tenant tables: `organization_id TEXT NOT NULL`. Migrations in `supabase/migrations/` (push via `supabase db push --linked`).

| Table | Purpose |
|---|---|
| `companies` | Tenant info + `subscription_tier/status/trial_ends_at/stripe_customer_id/payment_issue` |
| `organization_members` | **RBAC source of truth** — user_id × org_id × role × status × `access_expires_at` |
| `plans` | Reference data — seat limits per tier (basis/professional/enterprise) |
| `subscription_changes` | Append-only audit log of subscription lifecycle (Stripe webhook) |
| `user_roles` | _Legacy_ — still populated for backward compat, will be dropped post-MVP |
| `employees` | Employee records + salary (HR data, login optional via `user_id`) — incl. `salary_justification` |
| `salary_decisions` | **Append-only Begründungs-Trail — das Produkt-Herzstück** |
| `job_profiles` / `pay_bands` / `job_levels` / `departments` | Compensation structure |
| `pay_gap_snapshots` | Pre-computed pay-gap snapshots per scope (company/department/job_profile/job_level). Refreshed via trigger on `employees` change. Quartile + `requires_joint_assessment` columns added 2026-05-15 (Migration `20260515150000`). |
| `audit_logs` | Immutable audit trail |
| `lawyer_profiles` / `lawyer_requests` / `lawyer_reviews` | Lawyer flow |
| `info_requests` | Employee pay-transparency requests |
| `job_postings` | Recruiting-side compliance |
| `compliance_assessments` | Joint Pay Assessment records (>5% gap → trigger) |
| `onboarding_data` / `consultation_bookings` | Ops |
| `processed_stripe_events` | Stripe idempotency — service-role only |
| `rate_limit_entries` | Rate limiter — service-role only |

---

## Key Hooks & Components

| Hook | Provides |
|---|---|
| `useAuth` | `user, role, orgId, organization, supabase, loading, signOut, refreshAuth` |
| `useSubscription` | `tier` (effective), `rawTier`, `status`, `isTrialing`, `isExpired`, `paymentIssue`, `hasFeature`, `canAddEmployee/Admin/HRManager` |
| `useCompany` / `useEmployees` / `useJobProfiles` | Entity CRUD |
| `usePayEquity` / `usePayGapStatistics` | Analytics |
| `usePermissions` / `useAuditSystem` | RBAC + audit |
| `useDepartments` / `useInfoRequests` | Supporting data |
| `useSetupReadiness` | Setup-Hub Phase-Status + Overall-% |
| `useSalaryDecisions` | Salary-decision history per employee |

Key Komponenten in `components/dashboard/`:
- `DashboardOverview`, `EmployeesView`, `PayBandsView`, `JobProfilesView`, `PayGapReportView`, `AuditLogsView`
- `SalaryDecisionDialog` — Begründungs-Trail-UI
- `SetupHubView` — Setup-Phasen-Liste mit Workshop-Shortcuts
- `setup/MitarbeiterImportView` — CSV-Import-Wizard inkl. Gemini-AI-Mapping-Banner
- `setup/StrukturWorkshop` / `setup/VerguetungsMatrix` — kombinierte Setup-Flows

Inline-Create-Pattern (Phase 5):
- `components/ui/InlineCreateSelect` — generischer Wrapper mit Dialog-Extension-Points
- `InlineCreateDepartmentSelect` / `InlineCreateJobProfileSelect` / `InlineCreateJobLevelSelect` — permission-gated Wrapper

Gates: `<RoleGuard>`, `<SubscriptionGate>`, `<TrialBanner>`, Basis-Tier `proLocked` Sidebar-Items (amber Lock → `/abrechnung`).
