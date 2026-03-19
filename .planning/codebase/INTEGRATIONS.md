# External Integrations

**Analysis Date:** 2026-03-19

## Authentication

**Provider: Logto** (`@logto/next` 4.2.9)

Logto is the active OIDC identity provider. Note: `CLAUDE.md` still references Clerk, but the codebase has been migrated — Clerk packages are absent from `package.json` and all auth code uses Logto. The `.env.example` still shows Clerk vars (outdated), but the live `.env` and all source files use Logto.

**Configuration:** `lib/logto.ts`
- Scopes requested: `profile`, `email`, `organizations`, `organizationRoles`
- Active org stored in cookie: `kg_active_org` (constant `ACTIVE_ORG_COOKIE`)
- Config loaded from env vars at runtime via `getLogtoConfig()`

**Required env vars:**
- `LOGTO_ENDPOINT` — Logto server URL
- `LOGTO_APP_ID` — Web app client ID
- `LOGTO_APP_SECRET` — Web app client secret
- `APP_BASE_URL` — Application base URL (used for OIDC redirect)
- `LOGTO_COOKIE_SECRET` — Cookie signing secret

**Server-side auth:** `lib/auth/server.ts`
- `getServerAuthContext()` — reads Logto context, maps claims to `AppAuthUser`, resolves active org from cookie
- Uses `getLogtoContext()` from `@logto/next/server-actions`

**Client-side auth:** `hooks/useAuth.tsx`
- `AuthProvider` — React context wrapping the entire app
- Polls `/api/auth/me` to hydrate auth state
- Fetches org-scoped Supabase token via `/api/auth/organization-token`
- Exposes: `user`, `role`, `orgId`, `organization`, `organizations`, `supabase`, `loading`, `signOut`, `setActiveOrganization`, `refreshAuth`

**Auth API routes** (all under `app/api/auth/`):
- `me/route.ts` — returns current auth state
- `organization-token/route.ts` — returns Logto org JWT for Supabase
- `active-org/route.ts` — sets active org cookie
- `organizations/route.ts` — lists user's organizations

**Auth page routes** (under `app/auth/` and `app/callback/`):
- Sign-in/sign-up/sign-out flows handled via Logto redirects
- Callback route at `/callback`

**Logto Management API:** `lib/logto-management.ts`
- Used for programmatic org creation during onboarding
- M2M app credentials: `LOGTO_M2M_APP_ID`, `LOGTO_M2M_APP_SECRET`
- Optional: `LOGTO_MANAGEMENT_API_RESOURCE` (defaults to `${LOGTO_ENDPOINT}/api`)
- Calls `POST /api/organizations` and `POST /api/organizations/{id}/users`

**Middleware:** `middleware.ts`
- Uses `LogtoClient` from `@logto/next/edge` (edge-compatible)
- On `app.*` subdomain or hosts containing `-app-`: enforces auth, redirects unauthenticated users to `/sign-in`, redirects users without an org to `/onboarding`
- Sets `kg_active_org` cookie automatically from first org in claims

## Database

**Provider: Supabase** (PostgreSQL)

- Project URL: `https://btbucjkczpejplykyvkj.supabase.co`
- Project ID: `btbucjkczpejplykyvkj`
- RLS (Row Level Security) is the primary security boundary — all tenant isolation enforced at DB level

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` — project URL (public, client-safe)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key (public, client-safe)
- `SUPABASE_SERVICE_ROLE_KEY` — optional, for elevated server-side operations

**Server client:** `lib/supabase/server.ts`
- `createClient(organizationId?)` — async, reads cookies, fetches Logto org JWT, passes as `Authorization: Bearer <token>` header to scope all queries to the active organization
- Uses `@supabase/ssr` `createServerClient`

**Client client:** `utils/supabase/client.ts` (not read but referenced in `hooks/useAuth.tsx`)
- `createClient()` — unauthenticated Supabase client
- `createSupabaseClient(getToken)` — authenticated client that injects org JWT via fetch interceptor

**Migrations:** `supabase/migrations/` (10+ migration files, dated from 2026-01-06)

**Key tables** (from CLAUDE.md + query patterns in source):
- `profiles` — user profile data, `organization_id` column
- `companies` — tenant companies
- `user_roles` — RBAC roles (`admin` | `hr_manager` | `employee`), scoped to `organization_id`
- `job_profiles`, `pay_bands` — pay structure definitions
- `employees` — employee records
- `pay_groups`, `pay_group_stats` — pay equity groupings and computed stats
- `employee_comparisons` — pre-computed salary comparison data
- `info_requests`, `audit_logs` — compliance/audit trail
- `onboarding_data`, `consultation_bookings` — onboarding and consulting flows

**Image storage:** Supabase Storage (hostname `btbucjkczpejplykyvkj.supabase.co` allowlisted in `next.config.ts`)

## AI Services

**Provider: Google Gemini** (`@google/generative-ai` 0.24.1)

**Implementation:** `lib/services/gemini-service.ts`

**Model used:** `gemini-2.0-flash-exp` (for all three functions)

**Required env var:**
- `GOOGLE_GEMINI_API_KEY` — server-side only (never exposed to client)

**Functions exposed:**
- `generateEmployeeExplanation(context)` — generates German-language salary comparison explanation for employees
- `generateGenderGapExplanation(context)` — generates German-language gender pay gap analysis for HR managers
- `chatWithAI(question, context, history)` — multi-turn chat with salary context injection

**Fallback:** Rule-based text generation if Gemini API call fails (no hard dependency on AI availability)

**API routes using Gemini:**
- `app/api/pay-equity/chat/route.ts` — POST, uses `chatWithAI()`
- `app/api/pay-equity/generate-explanation/route.ts` — POST, uses `generateEmployeeExplanation()` or `generateGenderGapExplanation()`
- `app/api/pay-equity/simulate/route.ts` — pay simulation
- `app/api/pay-equity/update-stats/route.ts` — stats update trigger

**Prompt language:** All prompts and responses in German (EU compliance context)

## Error Tracking

**Provider: Sentry** (`@sentry/nextjs` 10.34.0)

**DSN:** `https://16146e84da4d8e72ebfe0d6d9b8684c9@o4510663552335872.ingest.de.sentry.io/4510714186039376`
(EU data residency — `.ingest.de.sentry.io`)

**Sentry org/project:** `kitech-software-ug-haftungsbes` / `klargehalt`

**Configuration files:**
- `sentry.server.config.ts` — server-side init
- `sentry.edge.config.ts` — edge runtime init (middleware)
- `next.config.ts` — wrapped with `withSentryConfig`, source maps uploaded in CI

**Settings:**
- `tracesSampleRate: 1` (100% — should be reduced for production scale)
- `sendDefaultPii: true` — user PII included in error reports
- `enableLogs: true`
- `widenClientFileUpload: true` — larger source maps for better stack traces
- `automaticVercelMonitors: true` — Vercel Cron integration

**Unhandled errors are captured automatically** — no manual instrumentation needed beyond `console.error` for server-side logging.

## Webhook Infrastructure

**Svix** (`svix` 1.84.1) is present in dependencies. This library is used for webhook signature verification. No active webhook handler routes were detected in the scanned API routes, suggesting this may be a legacy dependency or planned future use (previously used with Clerk webhooks).

## Deployment & Hosting

**Target platform:** Coolify (self-hosted, being configured on this server)
- Previous deployment path: `/root/app` (backed up at `/home/deploy/app.bak`)
- Current deployment path: `/home/deploy/app`
- GitHub remote: `https://github.com/KITechSoftwareUG/klargehalt-9c0827ae.git`

**Subdomain routing:**
- `app.*` subdomain → authenticated app (enforced in middleware)
- Root domain → marketing site

## Environment Variable Summary

| Variable | Scope | Required | Purpose |
|---|---|---|---|
| `LOGTO_ENDPOINT` | Server | Yes | Logto server URL |
| `LOGTO_APP_ID` | Server | Yes | Web app OIDC client ID |
| `LOGTO_APP_SECRET` | Server | Yes | Web app OIDC client secret |
| `LOGTO_COOKIE_SECRET` | Server | Yes | Cookie signing secret |
| `LOGTO_M2M_APP_ID` | Server | Yes | Management API M2M client ID |
| `LOGTO_M2M_APP_SECRET` | Server | Yes | Management API M2M client secret |
| `LOGTO_MANAGEMENT_API_RESOURCE` | Server | No | Management API resource URL |
| `APP_BASE_URL` | Server | Yes | Application base URL for OIDC |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | No | Supabase service role (elevated) |
| `GOOGLE_GEMINI_API_KEY` | Server | Yes | Gemini AI API key |

---

*Integration audit: 2026-03-19*
