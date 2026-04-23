# CLAUDE.md

---

## External SaaS Shell — Operational Reference

> Source of truth for the outer shell: from first website visit to authenticated, provisioned product access.
> Audit date: 2026-04-23.

### 1. System Topology & Routing

**Domains**

| Domain | Serves | Auth |
|---|---|---|
| `klargehalt.de` | Marketing site (`app/(marketing)/`) | None |
| `app.klargehalt.de` | SaaS app (`app/(app)/`) | Logto OIDC required |
| `auth.klargehalt.de` | Logto self-hosted | Auth server |

**Host-routing in `middleware.ts`**

Both domains run the **same Next.js build**. `middleware.ts` checks the `host` header at the edge:
- `host.startsWith('app.')` → app routing (auth enforcement, org cookie, `/` → `/dashboard` redirect)
- Everything else → marketing (no auth checks, `NextResponse.next()` passthrough)

**Auth-exempt paths on `app.*`** (configured in `isSkipAuthCheck`):
- `/auth/*` — Logto server actions (sign-in, sign-up, sign-out, forgot-password)
- `/callback` — OIDC callback
- `/api/auth/*` — token/session API routes
- `/api/webhooks/*` — Stripe + Logto webhooks
- `/api/healthz`

**No reverse proxy assumption**: the middleware runs on the Coolify-deployed Node.js container, not on a separate proxy. `X-Forwarded-For` headers from Coolify's Traefik layer are used by the rate limiter.

---

### 2. Auth & Access State

**Full OIDC flow (sign-up path)**

```
1. /preise → "Kostenlos testen" → href: getAppUrl('/sign-up?plan=professional')
2. AuthLauncher renders at /sign-up?plan=professional
3. User clicks CTA → handleSignUpClick():
     a. document.cookie = kg_intent_plan=professional; max-age=3600; samesite=lax
     b. router.push('/auth/sign-up')
4. /auth/sign-up/route.ts → Logto signIn(..., { interactionMode: 'signUp' })
   → HTTP 302 → auth.klargehalt.de OIDC authorization endpoint
5. User completes Logto registration (email verify, password)
6. Logto 302 → /callback?code=...&state=...
7. /callback/route.ts: handleSignIn(config, searchParams) → exchange code for tokens
   → getLogtoContext() → isAuthenticated = true
   → orgs = context.claims.organizations (empty for new user)
   → redirect to /onboarding
8. /onboarding page reads kg_intent_plan cookie → sets selectedPlan
9. POST /api/onboarding/complete:
     a. createOrganizationWithMembership() → Logto M2M API creates org
     b. Supabase: INSERT companies (subscription_status='trialing', trial_ends_at=+14d)
     c. Supabase: UPSERT profiles
     d. Supabase: INSERT user_roles (role='admin')
     e. Supabase: UPSERT onboarding_data
     f. Set kg_active_org cookie (httpOnly, samesite=lax, secure=prod)
10. Client: setActiveOrganization() → POST /api/auth/active-org → refresh /api/auth/me
11. router.push('/dashboard')
```

**Critical JWT lag**: Logto only refreshes `organizations` claim in the JWT on next login. Immediately after onboarding, `kg_active_org` cookie is the ONLY source of org identity. `getServerAuthContext()` in `lib/auth/server.ts` handles this by appending the cookie org to the JWT org list even if the JWT doesn't contain it yet. **Real enforcement is Supabase RLS only.**

**`kg_active_org` cookie lifecycle**:
- Written: onboarding complete (`/api/onboarding/complete`) + org switch (`/api/auth/active-org`)
- Read: `getActiveOrganizationIdFromCookies()` in `lib/auth/server.ts` + middleware
- Deleted: sign-out route

**Supabase RLS auth function**: `public.org_id()` extracts the org from the Bearer JWT audience claim (`urn:logto:organization:<org_id>`). Every tenant-scoped table has `organization_id TEXT NOT NULL` enforced by RLS.

**Plan intent survival through OIDC roundtrip**:
- Cookie `kg_intent_plan` set with `samesite=lax` and `max-age=3600` — survives top-level OAuth redirects
- Cookie is NOT `httpOnly` (set by JavaScript). This is intentional and safe for a non-security-critical preference cookie.
- **Gap**: If user arrives at `/sign-in?plan=...` (not `/sign-up?plan=...`), the plan cookie is never set. Sign-in mode in `AuthLauncher` does not call `handleSignUpClick`.

---

### 3. Billing & Provisioning Engine

**Stripe Checkout flow**

```
POST /api/stripe/checkout
  → admin auth check (service role, bypasses RLS)
  → get/create Stripe customer (stored as companies.stripe_customer_id)
  → stripe.checkout.sessions.create({
       metadata: { organization_id, company_id, tier },
       success_url: APP_BASE_URL + '/dashboard?checkout=success',
       cancel_url: APP_BASE_URL + '/dashboard?checkout=canceled',
    })
  → return { url: session.url }
Client: window.location.href = session.url
```

**Idempotency table**: `processed_stripe_events (event_id TEXT PRIMARY KEY, processed_at TIMESTAMPTZ)`.
- Checked at webhook handler entry — duplicate events are silently skipped and return 200.
- Written atomically AFTER successful DB update (so Stripe retries if processing fails).
- Table is RLS-blocked for all authenticated users; only service role key bypasses.

**Webhook event handling** (`/api/webhooks/stripe`):

| Event | Action |
|---|---|
| `checkout.session.completed` | Set `subscription_status='active'`, `subscription_tier`, clear `trial_ends_at` |
| `customer.subscription.updated` | Update tier/status/`current_period_end` (ordering guard via `.or()` clause) |
| `customer.subscription.deleted` | Downgrade to `basis`, clear `stripe_subscription_id` |
| `invoice.payment_failed` | Set `subscription_status='past_due'` + send `paymentFailed` email |

**Partial-write failure modes**:
- **Checkout route**: Stripe customer created → Supabase `stripe_customer_id` update fails → customer exists in Stripe but not linked in DB. `/api/stripe/reconcile` (GET, super-admin) detects this.
- **Webhook**: Stripe fires event → Supabase write fails → webhook returns 500 → Stripe retries (up to 3 days). Idempotency table not written on failure, so retries work correctly.
- **Recovery**: `GET /api/stripe/reconcile` detects all status/tier mismatches. `POST /api/stripe/reconcile` applies automatic fixes.

**Access coupling** (`lib/subscription.ts` → `getEffectiveTier()`):
```
active      → full tier access
trialing    → full tier access (while trial_ends_at > now())
past_due    → fallback to 'basis' (grace period)
canceled    → fallback to 'basis'
```

**Subscription state machine**:
```
signup → trialing (14d, professional)
       → [user upgrades] → active
       → [trial ends, no upgrade] → trialing (expired) → UI shows TrialExpiredOverlay
       → [payment fails] → past_due → basis access
       → [subscription canceled] → canceled → basis access
```

---

### 4. Email & Trust Infrastructure

**Email provider**: Resend (singleton in `lib/email.ts`). Lazy-initialized — throws at request time if `RESEND_API_KEY` missing.

| Trigger | Function | When |
|---|---|---|
| User registers | `sendWelcomeEmail` | Logto webhook `User.Created` |
| Trial ending | `sendTrialEndingEmail` | Cron: `/api/cron/trial-reminder` |
| Payment confirmed | `sendSubscriptionConfirmedEmail` | Stripe `checkout.session.completed` |
| Payment failed | `sendPaymentFailedEmail` | Stripe `invoice.payment_failed` |

**Sending addresses**:
- `noreply@klargehalt.de` — all transactional except payment failure
- `support@klargehalt.de` — payment failure emails

**Logto auth emails** (signup verification, password reset): Logto sends these directly using its own configured SMTP. This is a **separate email path** — NOT Resend. Must be configured in Logto admin UI.

**Required DNS records** (for `klargehalt.de`):
```
# Resend SPF (add to existing TXT record or add new)
TXT  @   "v=spf1 include:amazonses.com ~all"
# Resend DKIM
CNAME resend._domainkey   → resend._domainkey.klargehalt.de.dkim.resend.com
# DMARC
TXT  _dmarc   "v=DMARC1; p=none; rua=mailto:support@klargehalt.de"
```

**Trial-ending cron**:
- Endpoint: `GET /api/cron/trial-reminder` (protected by `Authorization: Bearer $CRON_SECRET` header... **ACTUALLY: protected by `x-cron-secret` header**)
- Triggers: 3 days before expiry + 1 day before expiry (window-based)
- External trigger required: Coolify scheduled task, server cron, or external cron service
- `CRON_SECRET` env var must be set and match the trigger configuration

---

### 5. Hard Failure Modes

| # | Failure | Blast Radius | Detection | Fix |
|---|---|---|---|---|
| 1 | Stripe customer created but `stripe_customer_id` not written to Supabase | User can't upgrade again (new customer created on next attempt, duplicate) | `GET /api/stripe/reconcile` | `POST /api/stripe/reconcile` auto-fix |
| 2 | Stripe webhook fires after Supabase down: event processed, DB not updated | Subscription appears inactive despite payment | Stripe retries for 3 days; reconcile catches residual | Stripe retries handle this; reconcile cleans up |
| 3 | `trial_ends_at` fires but no cron job configured | Users get no email warning, trial silently expires | No automatic detection — must check Coolify cron status | Configure Coolify scheduled task calling `/api/cron/trial-reminder` |
| 4 | Logto webhook `User.Created` fires twice (retry) | Duplicate welcome email sent | No idempotency check | Add `processed_logto_events` table (P1) |
| 5 | `?plan=` parameter on sign-in URL (not sign-up) | Plan intent lost, user lands on default plan at onboarding | No detection | Route sign-in `?plan=` to cookie same as sign-up path |
| 6 | `customer.subscription.updated` arrives with null `current_period_end` | `.or()` clause evaluates incorrectly, update may not apply | Reconcile detects tier/status mismatch | Fixed in webhook handler |
| 7 | `RESEND_API_KEY` missing at runtime | First email send throws, all subsequent emails fail silently (logged) | No startup validation | Add env var check to startup/health route |
| 8 | `decision_documentation` feature flag missing from `FEATURE_FLAGS` | `hasFeature(..., 'decision_documentation')` always returns `false` | TypeScript doesn't catch this | Add to FEATURE_FLAGS |
| 9 | pg_cron `cleanup_expired_trial_accounts` not scheduled | Expired trial orgs accumulate, DB grows unbounded | No detection | Run `SELECT cron.schedule(...)` in Supabase SQL editor |
| 10 | `kg_active_org` cookie not scoped to `domain` attribute | Cookie binds to `app.klargehalt.de` only — correct, but future subdomains break | No impact now | Document intentional scope |

---

## Commands

```bash
npm run dev        # Dev server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint via Next.js
npx tsc --noEmit   # TypeScript strict check (run after every change)
```

No test suite — validation is `tsc --noEmit` + `npm run lint`.

## Chrome Testing (MANDATORY)

**After every build, UI change, or new feature — test it in Chrome via the `chrome-devtools` MCP server.**

Workflow:
1. Run `npm run dev` (localhost:3000)
2. Use the `chrome-devtools` MCP tools to open and interact with the app in Chrome
3. Test the golden path of the feature
4. Check the browser console for errors (no unhandled errors allowed)
5. Verify the UI renders correctly and edge cases are handled

This applies to **all** frontend changes — components, pages, forms, modals, charts, and layouts.
Do NOT mark a task complete without Chrome verification.

---

## What This Is

**KlarGehalt** — B2B SaaS for EU pay-transparency compliance (Entgelttransparenzrichtlinie 2023/970).
Target: German/EU companies required to publish salary structures and gender pay gap reports.
Features: salary bands, job profiles, RBAC, gender pay gap analytics, subscription billing, external lawyer review.

### Core Product Philosophy (READ THIS FIRST)

KlarGehalt is **not** an HR tool or a dashboard. It is a **Compliance & Proof Infrastructure**.

The EU directive (2023/970) shifts the burden of proof: companies must now **prove** their salaries are
fair — not just claim it. Most companies cannot do this today (Excel chaos, individual deals, no history).
KlarGehalt solves exactly that — and uniquely adds an external lawyer review layer to back it up.

**We sell:** "If someone asks or sues — you are prepared. And an external lawyer has already reviewed it."
**Not:** "Transparent salary bands."

### The 5 Core Pillars (build everything around these)

| Pillar | What it means for code |
|---|---|
| **1. Compensation Structure** | Job profiles, levels, pay bands — creates order |
| **2. Decision Documentation** | Every salary decision stored with justification, comparator, and decision-maker — **this is the product** |
| **3. Gap Detection** | Flags >5% gender/group pay gaps — legal obligation, not a nice-to-have |
| **4. Audit Trail** | Immutable, timestamped, per-employee history — without this there is no proof |
| **5. External Validation** | Vetted lawyer reviews the structure via KlarGehalt — creates a defensible paper trail beyond what software alone can provide |

### Decision Documentation — The Critical Missing Piece

`salary_decisions` is the heart of the compliance infrastructure. Every salary event (hire, raise, promotion,
band change) must persist:

```
employee_id          — who
decision_type        — hire | raise | promotion | band_change | correction
old_salary / new_salary
justification_text   — free text rationale (required)
justification_factors — JSON: { market_rate, performance_score, pay_band_position, ... }
decided_by_user_id   — who made the decision
decided_at           — immutable timestamp
pay_band_id          — band in effect at decision time (snapshot, not FK)
comparator_data      — JSON: peer group stats at decision time
lawyer_review_id     — FK to lawyer_reviews if externally validated
```

Rules:
- Records are **append-only** — never update or delete, only insert
- Every salary write in the app (employees table) must create a corresponding `salary_decisions` row
- The lawyer role can read all decisions for their assigned org and attach a `lawyer_review`
- `comparator_data` is snapshotted at write time — not computed on read

### Anwaltsprüfung — External Lawyer Review (Pillar 5)

The lawyer review is a **paid add-on service** (€799 one-time, €399 annual renewal), available to
Professional+ customers. It is the key differentiator vs. pure-software competitors.

**Business model:** KlarGehalt operates as a marketplace/facilitator. The lawyer is an independent
Auftragnehmer — **not a KlarGehalt employee**. The service contract is between the company and the
lawyer. KlarGehalt earns a platform fee and provides the tool the lawyer uses for the review.

**Critical wording rule:** Never say "rechtssicher" or "gesetzlich geprüft." Only ever:
- "von externem Rechtsberater geprüft" (reviewed by external counsel)
- "Anwaltlich geprüfte Gehaltsstruktur" (lawyer-reviewed pay structure)

**Full flow:**
1. Company admin (Professional+ only) clicks "Anwaltsprüfung beantragen"
2. Request stored in `lawyer_requests` table, KlarGehalt team notified
3. KlarGehalt assigns a vetted lawyer from the internal network (`lawyer_profiles` table)
4. Lawyer invited via email → gets time-limited `lawyer` role for that org in `user_roles`
5. Lawyer reviews pay structure, pay bands, gap reports, and salary decisions in KlarGehalt
6. Lawyer submits a `lawyer_review` record: verdict (`approved` | `conditional` | `needs_revision`) + comment
7. Company sees "von Anwalt geprüft" badge in dashboard and on all PDF exports
8. Annual renewal: lawyer re-reviews, new `lawyer_review` record added

**Lawyer access model:**
- Role: `lawyer` in `user_roles` — read-only on all sensitive tables, write on `lawyer_reviews`
- Scoped to one organization only — cannot see other tenants
- Access is time-limited (e.g., 30 days per review engagement)
- They see: salary decisions, pay gap reports, job profiles, pay bands
- They cannot: modify any salary/employee data

**DB tables for lawyer flow:**
- `lawyer_profiles` — KlarGehalt's vetted lawyer network (super-admin managed)
- `lawyer_requests` — company-initiated requests for a review
- `lawyer_reviews` — lawyer output: verdict + comment, linked to `salary_decisions`

### Target Customer

Sweet spot: 100–500 employees, no internal legal team, growing but structurally immature.
Buyer: CEO or HR Lead. Selling motion: risk + legal exposure, not features.

---

## Build Status (Stand 2026-04-21)

### Fertig

| Feature | Notizen |
|---|---|
| Job Profiles, Pay Bands, Job Levels, Departments | ✅ |
| Pay Gap Report + HR Pay Equity Analytics | ✅ |
| Audit Logs | ✅ |
| Lawyer Dashboard, Reviews, Badge | ✅ |
| Joint Assessment | ✅ |
| Compliance Score (ComplianceCommandCenter) | ✅ |
| RBAC — admin / hr_manager / employee / lawyer | ✅ |
| Subscription + Billing (Stripe) | ✅ |
| Super-Admin Panel | ✅ |

### Kritisch fehlend — Herzstück nicht gebaut

| Feature | Status |
|---|---|
| **Decision Documentation** — `salary-justification.ts` existiert nur als Typ-Stub | ❌ nicht gebaut |
| Persistierter, unveränderlicher Trail pro Mitarbeiter pro Gehaltsentscheidung (`salary_decisions`) | ❌ fehlt |
| Anwalt kann diesen Trail kommentieren + reviewen (Lawyer ↔ Decision Link) | ❌ fehlt |

**Das ist der kritischste Gap.** Pillar 2 (Decision Documentation) ist das eigentliche Produkt — ohne ihn ist
KlarGehalt ein schönes HR-Dashboard, aber keine Compliance-Beweis-Infrastruktur.

### Nächster Schritt: `salary_decisions` implementieren

DB-Schema (append-only, kein UPDATE/DELETE via RLS):

```
employee_id           — wer
decision_type         — hire | raise | promotion | band_change | correction
old_salary            — vorher
new_salary            — nachher
justification_text    — freie Begründung (required)
justification_factors — JSON: { market_rate, performance_score, pay_band_position, ... }
decided_by_user_id    — wer hat entschieden
decided_at            — unveränderlicher Timestamp
pay_band_id           — Band zum Entscheidungszeitpunkt (Snapshot, nicht Live-FK)
comparator_data       — JSON: Peer-Group-Stats zum Entscheidungszeitpunkt
lawyer_review_id      — FK zu lawyer_reviews (wenn extern geprüft)
```

Darauf aufbauend: UI in `EmployeesView` + `MySalaryComparisonView` erweitern.

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
                auth.org_id() extracts orgId from JWT 'aud' claim
                (format: 'urn:logto:organization:<org_id>')
```

**JWT lag warning:** Logto only refreshes org claims on next login. After org creation, `kg_active_org`
cookie is source of truth. Real security enforcement is always Supabase RLS.

### Security Model ("Fortress Database")

1. **Edge (middleware):** lightweight auth check — redirects unauthenticated users only
2. **API layer:** `getServerAuthContext()` validates session — gates server-side logic
3. **Database (RLS):** final enforcement — every tenant-scoped query is filtered by `organization_id`

Every table with tenant data has `organization_id TEXT NOT NULL`. RLS function `org_id()` (in `public`
schema) extracts the org from the Bearer JWT audience claim. Even a compromised frontend cannot read
another tenant's data.

---

## Route Groups

Two route groups exist under `app/`:

| Group | Purpose |
|---|---|
| `(marketing)` | Public marketing site — no auth |
| `(app)` | Authenticated app — has its own layout |

### (marketing) routes

| Path | Purpose |
|---|---|
| `/` | Landing page |
| `/preise` | Pricing |
| `/funktionen` | Features |
| `/eu-richtlinie` | EU directive info page |
| `/agb`, `/datenschutz`, `/impressum`, `/kontakt`, `/sicherheit`, `/ueber-uns` | Legal + company pages |

### (app) standalone routes — NO dashboard shell

These routes live inside `(app)` but **outside** `/dashboard`. They have their own layout/page, no sidebar.

| Path | Purpose | Auth required |
|---|---|---|
| `/sign-in` | Logto OIDC login page | No |
| `/sign-up` | Logto OIDC signup page | No |
| `/onboarding` | Company setup wizard (first time) | Yes — but no org yet |
| `/book-consulting` | Expert consulting booking | Yes |

### (app) /dashboard routes — WITH dashboard shell (sidebar + header)

All `/dashboard/*` routes share the `dashboard/layout.tsx` shell (dark sidebar, sticky header).
The sidebar nav is role-filtered at render time.

**Compliance**

| Path | Nav label | Roles |
|---|---|---|
| `/dashboard` | Compliance Center | admin, hr_manager |
| `/dashboard/joint-assessment` | Gem. Bewertung (Art. 10) | admin, hr_manager |
| `/dashboard/job-postings` | Stellenanzeigen (Art. 5) | admin, hr_manager |
| `/dashboard/hr-requests` | Anfragen HR (Art. 7) | admin, hr_manager |
| `/dashboard/rights-notifications` | Jahresinfo (Art. 7) | admin, hr_manager |

**Analytics**

| Path | Nav label | Roles |
|---|---|---|
| `/dashboard/overview` | Übersicht | admin, hr_manager |
| `/dashboard/pay-equity-hr` | Pay-Equity Analyse | admin, hr_manager |
| `/dashboard/pay-equity-mgmt` | Management KPIs | admin, hr_manager |
| `/dashboard/reports` | Berichte | admin, hr_manager, lawyer |

**Verwaltung**

| Path | Nav label | Roles |
|---|---|---|
| `/dashboard/employees` | Mitarbeiter | admin, hr_manager |
| `/dashboard/my-salary` | Gehaltscheck / Mein Portal | all (employee view: own salary only) |
| `/dashboard/departments` | Abteilungen | admin, hr_manager |
| `/dashboard/job-levels` | Karrierestufen | admin, hr_manager |
| `/dashboard/job-profiles` | Job-Profile | admin, hr_manager |
| `/dashboard/pay-bands` | Gehaltsbänder | admin, hr_manager |
| `/dashboard/requests` | Mitarbeiter-Anfragen | admin, hr_manager |

**Admin**

| Path | Nav label | Roles |
|---|---|---|
| `/dashboard/audit` | Audit-Log | admin only |
| `/dashboard/billing` | Abrechnung | admin only |
| `/dashboard/settings` | Einstellungen | admin only |

**Lawyer portal** (role = `lawyer`)

| Path | Nav label | Roles |
|---|---|---|
| `/dashboard/lawyer-reviews` | Bewertungen | lawyer |
| `/dashboard/reports` | Pay-Gap-Berichte | lawyer |
| `/dashboard/joint-assessment` | Gem. Bewertungen | lawyer |
| `/dashboard/audit` | Audit-Log | lawyer |

**Super-admin** (hardcoded user ID, shown only to `aalkh`)

| Path | Nav label | Access |
|---|---|---|
| `/dashboard/admin` | User Management | Super-admin only (hardcoded Logto user ID) |

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

Roles stored in `user_roles` table:

| Role | Who | Access |
|---|---|---|
| `admin` | Company admin / CEO | Full access to all company data |
| `hr_manager` | HR team | Employee management, pay bands, analytics |
| `employee` | Staff | Own salary info only (`/dashboard/my-salary`) |
| `lawyer` | External Auftragnehmer | Read-only on salary decisions, pay bands, gap reports for one org; write on `lawyer_reviews` |

```tsx
// UI gating (declarative)
<RoleGuard roles={['admin', 'hr_manager']}>
  <SensitiveComponent />
</RoleGuard>

// Logic gating (imperative)
const canEdit = useRoleAccess('admin', 'hr_manager')
```

Real enforcement is always Supabase RLS — frontend gating is UX only.

**Super-admin:** Not a database role. Implemented as a hardcoded Logto user ID check in
`/api/admin/users` and `/dashboard/admin`. Only the KlarGehalt operator account.

---

## Subscription & Billing (Stripe)

Three SaaS tiers: `basis` (€149/mo, €990/yr) | `professional` (€299/mo, €2990/yr) | `enterprise` (on request).
14-day trial at Professional tier on signup. Trial tier constant: `TRIAL_TIER = 'professional'`.

**Anwaltsprüfung add-on** (separate one-time purchase, not a Stripe subscription):
- €799 one-time — first review
- €399 annual renewal — re-review of existing structure
- Available to: Professional+ customers only
- Delivery: 10 business days, facilitated by KlarGehalt, executed by independent lawyer

Plan limits:
- `basis`: 50 employees, 1 admin, 1 HR manager — structure setup only
- `professional`: 250 employees, 5 admins, unlimited HR managers — full compliance suite
- `enterprise`: unlimited

| Feature flag | Minimum tier | Note |
|---|---|---|
| `pay_gap_analysis` | professional | |
| `pdf_reports` | professional | |
| `trend_analysis` | professional | |
| `decision_documentation` | professional | Required before lawyer can review anything |
| `priority_support` | professional | |
| `advanced_audit` | professional | |
| `lawyer_review` | professional | Anwaltsprüfung add-on eligibility |
| `sso` | enterprise | |
| `custom_integrations` | enterprise | |

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
| `/api/admin/users` | GET | Super-admin: all users + tenant data (restricted by hardcoded user ID) |
| `/api/lawyer/request` | POST | Company requests an Anwaltsprüfung (Professional+ only) |
| `/api/lawyer/review` | POST | Lawyer submits a review verdict |

---

## Key Database Tables

All tenant-scoped tables have `organization_id TEXT NOT NULL`.

| Table | Purpose |
|---|---|
| `profiles` | User profile data |
| `companies` | Tenant company info + subscription state |
| `user_roles` | RBAC roles per user per org (includes `lawyer` role) |
| `job_profiles` | Job profiles / positions |
| `pay_bands` | Salary bands per job profile |
| `employees` | Employee records with salary data |
| `info_requests` | Employee pay transparency requests |
| `audit_logs` | Immutable audit trail |
| `salary_decisions` | Append-only decision trail per employee — the compliance core |
| `onboarding_data` | Onboarding wizard state |
| `consultation_bookings` | Consulting session bookings |
| `lawyer_profiles` | KlarGehalt's vetted lawyer network — super-admin managed, not tenant-scoped |
| `lawyer_requests` | Company-initiated Anwaltsprüfung requests (status: pending/assigned/completed) |
| `lawyer_reviews` | Lawyer output: verdict + comment, linked to org and optionally to salary_decisions |
| `rate_limit_entries` | Supabase-backed rate limiter (no RLS, service role only) |

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

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
