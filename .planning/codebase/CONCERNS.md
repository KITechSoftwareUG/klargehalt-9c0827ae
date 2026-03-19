# Concerns & Technical Debt

**Analysis Date:** 2026-03-19

---

## Critical Issues

**Auth Provider Migration Incomplete (Clerk → Logto) — Uncommitted**
- Issue: The Logto auth migration is large (20 files changed, ~360 insertions) and sits entirely uncommitted in the working tree. If the server is restarted or the build fails, the half-migrated state is fragile.
- Files: `hooks/useAuth.tsx`, `middleware.ts`, `lib/supabase/server.ts`, `lib/logto.ts`, `lib/auth/server.ts`, `app/api/auth/` (all untracked)
- Impact: Current running build likely differs from source. A rollback or re-deploy would pull the Clerk version from git while the live server has Logto code.
- Fix: Commit the Logto migration as a single atomic commit immediately.

**`usePayEquity` Creates Its Own Unauthenticated Supabase Client**
- Issue: `hooks/usePayEquity.ts` calls `createClient()` at module level (line 16) using the anonymous client, bypassing the Logto JWT injected in `AuthProvider`. Every query made through this hook sends no auth token.
- Files: `hooks/usePayEquity.ts`
- Impact: Pay group data, simulations, and HR analytics either rely entirely on permissive RLS (`USING (true)`) or silently return empty results once RLS is tightened. This is a data-access security gap.
- Fix: Refactor to accept `supabase` from `useAuth()` as a parameter or use the pattern from `hooks/useEmployees.ts` which correctly consumes `supabase` from `useAuth()`.

**`EmployeeDashboard` Uses Raw `useEffect` for Fetching**
- Issue: `components/dashboard/EmployeeDashboard.tsx` uses a raw `useEffect` + `useState` data fetching pattern (lines 33–61) instead of TanStack Query. No caching, no deduplication, no loading state management beyond a boolean.
- Files: `components/dashboard/EmployeeDashboard.tsx`
- Impact: Stale data, redundant network calls, no background refresh.
- Fix: Extract fetch logic into a TanStack Query hook following the pattern in `hooks/useEmployees.ts`.

---

## Security Concerns

**RLS Catastrophically Relaxed on Core Tables — Migration Artifacts**
- Issue: `supabase/migrations/FIX_COMPANIES_RLS_INSERT.sql` sets `USING (true) WITH CHECK (true)` for `companies`, `profiles`, `user_roles`, and `onboarding_data` for all authenticated users. `supabase/migrations/FINAL_DATABASE_FIX.sql` similarly sets `USING (true)` on `companies`, `employees`, `job_profiles`, and `pay_groups` with comment "Für Testzwecke: Jeder darf ... sehen".
- Files: `supabase/migrations/FIX_COMPANIES_RLS_INSERT.sql`, `supabase/migrations/FINAL_DATABASE_FIX.sql`
- Impact: Any authenticated user can read or write another tenant's companies, employees, and salary data. Multi-tenancy isolation is not enforced at the database layer for these tables.
- Current mitigation: None at the DB level. API routes do secondary checks via `user_roles` table, but the `user_roles` table itself has `USING (true)` which allows any user to read all roles.
- Recommendations: Restore proper org-scoped RLS using the `org_id()` function already defined in `FIX_RLS_POLICIES.sql`. Remove all `USING (true)` policies. Conduct a full RLS audit before launch.

**`auth.uid()` Is Ineffective with Logto (Clerk Before It)**
- Issue: Many RLS policies in `supabase/migrations/20260116_switch_to_clerk_auth.sql` use `auth.uid()::text` to match against `user_id` columns. Both Clerk and Logto are external IdPs — `auth.uid()` returns the Supabase Auth user ID, which is not populated when using external JWTs. This means the original `switch_to_clerk_auth` policies are broken even if applied.
- Files: `supabase/migrations/20260116_switch_to_clerk_auth.sql`
- Impact: All RLS policies relying on `auth.uid()` are silently non-enforcing for Logto-authenticated users. Tenant isolation depends entirely on relaxed `USING (true)` policies.
- Fix: Use `auth.jwt() ->> 'sub'` (the Logto user ID is the JWT `sub` claim) or the `org_id()` function already present in migrations, and verify with a Logto test token.

**AI Chat Endpoint Has No Input Length or Content Validation**
- Issue: `app/api/pay-equity/chat/route.ts` accepts a `question` string and `history` array from the request body with no length limits or sanitization before passing to Gemini.
- Files: `app/api/pay-equity/chat/route.ts`
- Impact: Prompt injection attacks; unbounded request sizes could cause large Gemini API bills or timeouts.
- Fix: Add Zod schema validation on the request body with max lengths on `question` (e.g., 2000 chars) and `history` array size.

**`company_id` Supplied by Client — Not Verified Against Active Org in API Routes**
- Issue: `app/api/pay-equity/simulate/route.ts`, `app/api/pay-equity/update-stats/route.ts`, and `app/api/pay-equity/chat/route.ts` accept `company_id` from the request body. The auth check queries `user_roles` by `user_id + company_id`, but with `user_roles` RLS set to `USING (true)`, a user could craft a request with any `company_id` and — if they can find a valid user_role row — access cross-tenant data.
- Files: `app/api/pay-equity/simulate/route.ts`, `app/api/pay-equity/update-stats/route.ts`, `app/api/pay-equity/chat/route.ts`
- Fix: Derive `company_id` server-side from the authenticated org token rather than trusting the request body.

**Onboarding Page Exposes Internal Debug Info**
- Issue: `app/(app)/onboarding/page.tsx` line 631 renders a visible warning when `NEXT_PUBLIC_SUPABASE_ANON_KEY` is short, and lines 120, 136, 175, 237 emit `console.log` with internal state including role assignments and full error JSON.
- Files: `app/(app)/onboarding/page.tsx`
- Impact: Internal configuration details visible to end users via browser DevTools; log pollution in production.

---

## Technical Debt

**Widespread `any` Type Usage**
- Issue: `as any` and `: any` appear in 30+ locations throughout the codebase. Most are workarounds for missing type definitions on Supabase join results (`pay_group`, `pay_groups` nested relations).
- Files: `app/(app)/dashboard/my-salary/page.tsx` (7 occurrences), `app/api/pay-equity/chat/route.ts`, `components/dashboard/EmployeeDashboard.tsx` (component props typed as `any`), `app/(app)/dashboard/management/page.tsx`, `components/dashboard/AuditLogsView.tsx`
- Fix: Generate Supabase types (`supabase gen types typescript`) and use them for join results. Define prop interfaces for `EmployeeHome`, `MyProfileSection`, `MyLevelSection` in `EmployeeDashboard.tsx`.

**Dual Supabase Client Path**
- Issue: Two parallel Supabase client implementations exist: `lib/supabase/client.ts` (re-exports from `utils/supabase/client.ts`) and a direct `createClient` usage in `hooks/usePayEquity.ts`. The canonical pattern per `CLAUDE.md` is to use `supabase` from `useAuth()` in client components.
- Files: `hooks/usePayEquity.ts`, `lib/supabase/client.ts`, `utils/supabase/client.ts`
- Fix: Refactor `usePayEquity.ts` to accept the authenticated client from the call site.

**CLAUDE.md Documents Clerk; Codebase Uses Logto**
- Issue: `CLAUDE.md` still describes Clerk as the auth provider ("Clerk for authentication and organizations"). The actual implementation is now Logto. This misdirects future Claude instances working from the instructions.
- Files: `CLAUDE.md`
- Fix: Update `CLAUDE.md` to reflect Logto, the new auth API routes under `app/api/auth/`, and the `lib/logto.ts` config.

**Booking Confirmation Entirely Missing**
- Issue: `app/(app)/book-consulting/page.tsx` lines 97–99 contain three consecutive `TODO` comments for send confirmation email, add to calendar, and notify consultant. The booking is saved to the database but no follow-up actions are taken.
- Files: `app/(app)/book-consulting/page.tsx`
- Impact: Consultants are never notified of new bookings.

**Chaotic Migration History**
- Issue: The migrations folder contains files named `NUCLEAR_UUID_TO_TEXT_FIX.sql`, `FIX_RLS_POLICIES.sql`, `FIX_COMPANIES_RLS_INSERT.sql`, `FINAL_DATABASE_FIX.sql`, and `LINK_MY_USER.sql`. These are emergency patches applied in arbitrary order. The canonical migration sequence is unclear, and some patches contradict each other (e.g., `switch_to_clerk_auth` sets strict RLS, then `FIX_COMPANIES_RLS_INSERT` opens it wide).
- Files: `supabase/migrations/` (all non-timestamped files)
- Fix: Audit the actual live DB state, write one authoritative migration that reflects it, and delete or archive the ad-hoc patches.

**`organization_id` Columns Added as Nullable in Migration**
- Issue: `supabase/migrations/20260130105000_add_organization_id_columns.sql` adds `organization_id` columns with `ADD COLUMN IF NOT EXISTS organization_id TEXT` — no `NOT NULL` constraint. `CLAUDE.md` states "Every tenant-scoped table has an `organization_id TEXT NOT NULL` column" but the migration contradicts this.
- Files: `supabase/migrations/20260130105000_add_organization_id_columns.sql`
- Impact: Rows can be inserted without an `organization_id`, silently breaking tenant isolation if RLS later relies on it.

---

## Performance Concerns

**`usePayEquity` Module-Level Client Instantiated on Import**
- Issue: `const supabase = createClient()` at module scope in `hooks/usePayEquity.ts` means a Supabase client is instantiated every time the module is first imported, regardless of whether it is used.
- Files: `hooks/usePayEquity.ts`

**No Pagination on Audit Logs or Employee Lists**
- Issue: `components/dashboard/AuditLogsView.tsx` and `hooks/useEmployees.ts` do not apply `range()` or `limit()` to queries. For companies with hundreds of employees or thousands of audit entries, the full table is fetched on every render.
- Files: `components/dashboard/AuditLogsView.tsx`, `hooks/useEmployees.ts`
- Fix: Add cursor-based or offset pagination using TanStack Query's `keepPreviousData` pattern.

**Simulation Breakdown Sliced at Render Instead of Query**
- Issue: `app/(app)/dashboard/management/page.tsx` line 278 slices `simulationResult.breakdown.slice(0, 50)` at render time, implying the full breakdown is fetched and held in state, then truncated in the UI.
- Files: `app/(app)/dashboard/management/page.tsx`

**AI Explanation Regenerated on Every Request**
- Issue: `app/api/pay-equity/generate-explanation/route.ts` calls Gemini on every POST and upserts the result. There is no cache TTL or freshness check — if the front-end calls this endpoint on each component mount, it will generate a new AI call every time even if the underlying salary data has not changed.
- Files: `app/api/pay-equity/generate-explanation/route.ts`
- Fix: Check `explanation_generated_at` on the existing `employee_comparisons` row and skip Gemini if the explanation is less than N hours old.

---

## Fragile Areas

**Onboarding Flow: Multiple Sequential Mutations with Partial Success Risk**
- Files: `app/(app)/onboarding/page.tsx` (handleComplete, lines 53–240)
- Why fragile: The onboarding flow creates a Logto organization, sets an active org cookie, creates a Supabase company record, upserts a profile, inserts a user role, and saves onboarding data — all sequentially with no rollback mechanism. If any step fails mid-way, the user is left in a half-onboarded state with no recovery path.
- Safe modification: Wrap in a transaction or move to a server action that can be retried atomically.
- Test coverage: None.

**Supabase Token Injection via `getOrganizationToken` Closure**
- Files: `hooks/useAuth.tsx` (lines 123–129), `utils/supabase/client.ts`
- Why fragile: The authenticated Supabase client is created inside `useMemo` with a closure over `getOrganizationToken`. The `getOrganizationToken` function fetches from `/api/auth/organization-token` on every Supabase HTTP request. If this endpoint is slow or fails, all Supabase queries silently degrade to unauthenticated (the catch block returns `null`).
- Safe modification: Add error logging when `getOrganizationToken` fails; consider a short-lived in-memory token cache.

**Logto Middleware Only Protects `app.` Subdomain**
- Files: `middleware.ts` (line 20)
- Why fragile: Auth enforcement is gated on `hostname.startsWith('app.')`. On `localhost`, `127.0.0.1`, or a non-`app.` production hostname, all routes are unauthenticated. During development, the entire dashboard is accessible without signing in.
- Safe modification: Add a `NODE_ENV !== 'production'` bypass explicitly documented, or broaden the check to also cover `localhost`.

**`user_roles` Conflict Target Is `user_id` Only**
- Files: `hooks/useAuth.tsx` line 199, `app/(app)/onboarding/page.tsx` line 222
- Why fragile: `upsert({ onConflict: 'user_id' })` means a user can only have one role record across all organizations. In multi-org scenarios (one user in multiple orgs) the upsert will overwrite the existing role with whatever role is assigned for the new org.
- Fix: The conflict target should be `(user_id, organization_id)` and a corresponding unique constraint must exist on the table.

**Gemini Client Initialized with Empty String Fallback**
- Files: `lib/services/gemini-service.ts` line 9
- Why fragile: `new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')` silently initializes the client with an empty API key rather than throwing at startup. The error only surfaces at the first API call, producing a cryptic authentication error deep in the call stack.
- Fix: Use the `getRequiredEnv` pattern from `lib/logto.ts` to fail fast on startup.

---

## Uncommitted / In-Progress Work

**Logto Auth Migration (Large, Unstaged Changes)**
- 20 modified files + 6 untracked directories/files not committed to git
- Modified: `hooks/useAuth.tsx`, `middleware.ts`, `lib/supabase/server.ts`, all pay-equity API routes, sign-in/sign-up pages, dashboard pages, `components/Header.tsx`, `components/dashboard/MySalaryComparisonView.tsx`
- Untracked (new): `app/api/auth/`, `app/auth/`, `app/callback/`, `lib/auth/`, `lib/logto.ts`, `lib/logto-management.ts`
- Risk: The working tree is far ahead of `main`. A `git checkout` or CI build against `main` would produce a non-functional app.

**Landing Page Redesign (Documented in CLAUDE.md, Not Reflected in Git)**
- Per `CLAUDE.md`, `components/HeroSection.tsx`, `app/(marketing)/globals.css`, and `app/(marketing)/page.tsx` were redesigned with a video background. `public/balken.mp4` is a new asset. Current `git status` shows `app/(marketing)/page.tsx` as modified, consistent with this.
- The `app/(marketing)/balken.mp4` duplicate should be deleted once committed.

---

## Missing Infrastructure

**No Automated Test Suite**
- `CLAUDE.md` explicitly states: "No automated test suite — validation is done via `tsc --noEmit` + `npm run lint`."
- There are zero `.test.ts`, `.spec.ts`, or `.test.tsx` files anywhere in the repository.
- Impact: No regression protection for auth flows, RLS policy changes, or onboarding. Any refactor can silently break the application.
- Priority: High — especially given the auth provider migration and RLS fragility described above.

**No CI/CD Pipeline**
- There is no `.github/workflows/`, `.gitlab-ci.yml`, or equivalent CI config.
- `CLAUDE.md` notes Coolify needs to be installed on the server.
- Impact: No automated build verification on push. Deployments are manual. Breaking changes can reach production undetected.

**Sentry Integration Is Minimal**
- Sentry is only wired in `app/global-error.tsx`. There are no `Sentry.captureException` calls in API routes or critical hooks. Errors in `hooks/useAuth.tsx`, the onboarding flow, and pay-equity API routes only log to `console.error`.
- Files: `app/global-error.tsx`
- Fix: Add `Sentry.captureException(error)` in catch blocks throughout `app/api/pay-equity/` routes and `hooks/useAuth.tsx`.

**No Input Validation Schema on API Routes**
- All four `app/api/pay-equity/` routes parse `request.json()` and destructure fields without Zod or any schema validation. Invalid or malicious payloads reach business logic unchecked.
- Files: `app/api/pay-equity/chat/route.ts`, `app/api/pay-equity/generate-explanation/route.ts`, `app/api/pay-equity/simulate/route.ts`, `app/api/pay-equity/update-stats/route.ts`

**No Environment Variable Validation at Startup**
- `lib/logto.ts` uses `getRequiredEnv` for Logto vars but `lib/supabase/server.ts` uses non-null assertion (`supabaseUrl!`, `supabaseKey!`) without checking. `lib/services/gemini-service.ts` uses an empty-string fallback for the Gemini key.
- Impact: Missing env vars cause runtime errors rather than clear startup failures.
- Fix: Add a startup validation step (e.g., using `zod` on `process.env`) or extend `getRequiredEnv` to all critical variables.

---

*Concerns audit: 2026-03-19*
