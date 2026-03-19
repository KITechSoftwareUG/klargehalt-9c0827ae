# Architecture

**Analysis Date:** 2026-03-19

## Pattern Overview

**Overall:** Next.js 15 App Router with client-server split, multi-tenant SaaS

**Key Characteristics:**
- Route groups separate public marketing (`(marketing)`) from authenticated app (`(app)`)
- Authentication via Logto (OIDC), tenant isolation enforced in Supabase RLS
- Client components consume `useAuth()` for Supabase client; server components use `createClient()` from `lib/supabase/server.ts`
- TanStack Query manages all client-side async state; no raw `useEffect` for data fetching
- Single-page dashboard pattern: `/dashboard` renders all views by swapping components based on `activeView` state

## Layers

**UI Layer (Presentation):**
- Purpose: Render views, handle user interactions, show role-appropriate content
- Location: `app/(app)/dashboard/page.tsx`, `components/dashboard/`, `components/pay-equity/`
- Contains: Page components, view components, shadcn/ui primitives
- Depends on: Hooks layer, `components/RoleGuard.tsx`
- Used by: End user

**Hooks Layer (Client Business Logic):**
- Purpose: Encapsulate data fetching, mutations, and domain logic for client components
- Location: `hooks/` (all `use*.ts` and `use*.tsx` files)
- Contains: TanStack Query wrappers over Supabase, auth context, permission checks
- Depends on: Supabase client from `utils/supabase/client.ts`, auth APIs
- Used by: UI Layer

**API Layer (Server Business Logic):**
- Purpose: Server-side auth checks, AI calls, data mutations requiring elevated context
- Location: `app/api/pay-equity/`, `app/api/auth/`
- Contains: Next.js Route Handlers
- Depends on: `lib/auth/server.ts`, `lib/supabase/server.ts`, `lib/services/`
- Used by: Client hooks via `fetch()`

**Data Access Layer:**
- Purpose: Typed database access with tenant-scoped RLS enforcement
- Location: `lib/supabase/server.ts` (server), `utils/supabase/client.ts` (browser)
- Contains: Supabase client factory functions
- Depends on: Logto org tokens injected via `Authorization: Bearer` header
- Used by: Hooks layer, API layer

**Service Layer:**
- Purpose: External integrations and complex domain services
- Location: `lib/services/`
- Contains: `gemini-service.ts` (Google Gemini AI), `pay-equity.ts` (domain logic)
- Depends on: Environment variables, external APIs
- Used by: API layer

## Data Flow

**Client Read (authenticated):**
1. User loads page → `AuthProvider` calls `GET /api/auth/me` to load session
2. `AuthProvider` calls `GET /api/auth/organization-token` → receives Logto org JWT
3. `createSupabaseClient(getOrganizationToken)` creates browser client with token injected per-fetch
4. Hook (e.g. `usePayGroups`) runs TanStack Query → calls `supabase.from('pay_groups').select()`
5. Supabase validates org JWT → RLS policy checks `organization_id` → returns tenant-scoped rows
6. Hook returns data to component

**Server API Route:**
1. Route handler calls `getServerAuthContext()` from `lib/auth/server.ts`
2. `getLogtoContext()` validates Logto session cookie → returns claims + user info
3. `createClient()` from `lib/supabase/server.ts` reads `kg_active_org` cookie → fetches org token via `getOrganizationToken()`
4. Supabase client sends org token → RLS enforces tenant isolation
5. Route handler returns JSON response

**AI Pay Equity Flow:**
1. `POST /api/pay-equity/chat` or `/api/pay-equity/generate-explanation`
2. Auth check via `getServerAuthContext()`
3. Fetch employee/pay-group context from Supabase
4. Call Gemini via `lib/services/gemini-service.ts`
5. Return AI response to client

**State Management:**
- Auth state: React Context via `AuthProvider` in `hooks/useAuth.tsx`
- Server data: TanStack Query (`QueryClientProvider` in `app/(app)/providers.tsx`, `staleTime: 60000`)
- UI/view state: Local `useState` in page components

## Key Abstractions

**AuthProvider / useAuth:**
- Purpose: Single source of truth for auth state, Supabase client, user, org, role
- Location: `hooks/useAuth.tsx`
- Pattern: React Context provider wrapping the entire `(app)` subtree; exposes `user`, `orgId`, `role`, `supabase`, `loading`, `signOut`, `setActiveOrganization`
- Critical: The `supabase` instance from `useAuth()` has org token pre-injected — never create a standalone browser client in components

**RoleGuard / useRoleAccess:**
- Purpose: Declarative and imperative UI gating by role
- Location: `components/RoleGuard.tsx`
- Pattern: `<RoleGuard roles={['admin', 'hr_manager']}>` wraps sensitive UI; `useRoleAccess('admin')` for logic branches
- Note: UI-only; real enforcement is Supabase RLS

**Domain Hooks:**
- Purpose: Encapsulate all Supabase queries and mutations per domain area
- Examples: `hooks/useCompany.ts`, `hooks/useEmployees.ts`, `hooks/usePayEquity.ts`, `hooks/useJobProfiles.ts`, `hooks/usePayGapStatistics.ts`
- Pattern: TanStack Query `useQuery` / `useMutation` wrappers with stable `queryKey` arrays

**createClient (server):**
- Purpose: Server-side Supabase client with org token automatically fetched from Logto
- Location: `lib/supabase/server.ts`
- Pattern: `await createClient(organizationId?)` — reads `kg_active_org` cookie if no explicit org ID passed

**Providers stack:**
- Location: `app/(app)/providers.tsx`
- Stack: `QueryClientProvider` → `ThemeProvider` → `TooltipProvider` → `AuthProvider` → `Toaster/Sonner`

## Entry Points

**Marketing Site:**
- Location: `app/(marketing)/page.tsx`
- Triggers: Public `GET /`
- Responsibilities: Landing page, no auth required

**App Entry:**
- Location: `app/(app)/dashboard/page.tsx`
- Triggers: Authenticated `GET /dashboard`
- Responsibilities: Renders full SPA-style dashboard; switches between views (`overview`, `employees`, `job-profiles`, `pay-bands`, `reports`, `requests`, `pay-equity-hr`, `pay-equity-mgmt`, `my-salary`, `audit`, `settings`) using `useState('activeView')`

**Sub-route pages (each thin, delegating to components):**
- `app/(app)/dashboard/hr-analytics/page.tsx`
- `app/(app)/dashboard/management/page.tsx`
- `app/(app)/dashboard/my-salary/page.tsx`
- `app/(app)/onboarding/page.tsx`
- `app/(app)/book-consulting/page.tsx`

**Logto Auth Routes (server-side redirects):**
- `GET /auth/sign-in` → `app/auth/sign-in/route.ts` → calls `signIn()` from `@logto/next`, redirects to Logto
- `GET /auth/sign-out` → `app/auth/sign-out/route.ts`
- `GET /auth/sign-up` → `app/auth/sign-up/route.ts`
- `GET /callback` → `app/callback/route.ts` → `handleSignIn()` callback, sets `kg_active_org` cookie, redirects to `/dashboard` or `/onboarding`

**Auth API (JSON):**
- `GET /api/auth/me` → returns `{ isAuthenticated, user, organizations, activeOrganizationId }`
- `GET /api/auth/organization-token` → returns `{ token }` (Logto org JWT for client Supabase)
- `POST /api/auth/active-org` → sets `kg_active_org` cookie to switch active organization
- `GET /api/auth/organizations` → lists user's organizations

**Pay Equity API:**
- `POST /api/pay-equity/chat` → AI chat via Gemini
- `POST /api/pay-equity/generate-explanation` → AI explanation for pay gap
- `POST /api/pay-equity/simulate` → Pay scenario simulation
- `POST /api/pay-equity/update-stats` → Recalculate pay group statistics

## Authentication & Authorization Flow

**Authentication (Logto OIDC):**
1. User visits `/sign-in` page (UI component in `app/(app)/sign-in/[[...sign-in]]/page.tsx`)
2. Clicks "Mit Logto anmelden" → navigates to `GET /auth/sign-in` route handler
3. `signIn()` from `@logto/next` initiates OIDC redirect to Logto provider
4. After Logto auth, OIDC callback hits `GET /callback`
5. `handleSignIn()` validates code, stores Logto session cookie
6. `getLogtoContext()` reads org claims → sets `kg_active_org` cookie → redirects to `/dashboard`
7. Middleware (`middleware.ts`) validates every non-public request via `client.getLogtoContext()`

**Multi-tenant Token Flow:**
- Each organization has a Logto organization scope
- `GET /api/auth/organization-token` calls `getOrganizationToken(config, organizationId)` → scoped JWT
- Client Supabase injects this JWT as `Authorization: Bearer <org-token>` on every request
- Supabase RLS reads the JWT's org claim via `auth.get_user_org_id()` to enforce isolation

**Authorization (RBAC):**
- Roles stored in `user_roles` table: `admin | hr_manager | employee`
- Role loaded by `AuthProvider` from `user_roles` table at session init; defaults to `employee` if missing
- UI gating: `<RoleGuard>` / `useRoleAccess()` in `components/RoleGuard.tsx`
- Database enforcement: RLS policies on every tenant-scoped table

## Multi-Tenancy Model

- Tenant = Logto Organization (created during onboarding)
- Organization ID stored in `kg_active_org` httpOnly cookie (`lib/logto.ts`: `ACTIVE_ORG_COOKIE`)
- Every Supabase table with tenant scope has `organization_id TEXT NOT NULL` column
- RLS policies use `auth.get_user_org_id()` function to match the JWT org claim
- Users can belong to multiple organizations; `setActiveOrganization()` in `useAuth` switches context
- Management API calls (org provisioning) use M2M app credentials via `lib/logto-management.ts`

---

*Architecture analysis: 2026-03-19*
