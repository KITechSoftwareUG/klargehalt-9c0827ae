# Codebase Structure

**Analysis Date:** 2026-03-19

## Top-Level Layout

```
klargehalt/
├── app/                    # Next.js App Router — all routes
│   ├── (app)/              # Authenticated app route group
│   ├── (marketing)/        # Public marketing site route group
│   ├── api/                # API Route Handlers (server-side)
│   ├── auth/               # Logto auth redirect handlers
│   └── callback/           # Logto OIDC callback
├── components/             # Shared React components
│   ├── dashboard/          # Dashboard view components
│   ├── pay-equity/         # Pay equity specific components
│   └── ui/                 # shadcn/ui primitives
├── hooks/                  # Client-side React hooks (data + auth)
├── lib/                    # Server-safe utilities and services
│   ├── auth/               # Server auth helpers (Logto context)
│   ├── services/           # External service integrations (Gemini, etc.)
│   ├── supabase/           # Server Supabase client factory
│   └── types/              # Shared TypeScript types
├── integrations/
│   └── supabase/           # Auto-generated Supabase DB types
├── utils/
│   └── supabase/           # Browser Supabase client factory
├── supabase/
│   └── migrations/         # SQL migration files
├── public/                 # Static assets
├── scripts/                # Utility scripts
├── docs/                   # Project documentation
├── .claude/                # Claude Code config (rules, agents, skills)
├── .planning/              # GSD planning documents
│   └── codebase/           # Auto-generated architecture docs
├── middleware.ts            # Edge middleware — auth enforcement
├── next.config.ts           # Next.js config
├── tailwind.config.ts       # Tailwind CSS config
├── tsconfig.json            # TypeScript config
├── components.json          # shadcn/ui registry config
├── instrumentation.ts       # Sentry server instrumentation
└── instrumentation-client.ts # Sentry client instrumentation
```

## Route Groups

### `(app)` — Authenticated Application
Location: `app/(app)/`
Layout: `app/(app)/layout.tsx` — sets up HTML shell with `Outfit` font, delegates to `app/(app)/providers.tsx`
Providers: `app/(app)/providers.tsx` — mounts `QueryClientProvider`, `ThemeProvider`, `TooltipProvider`, `AuthProvider`, `Toaster`

| Route | File | Purpose |
|---|---|---|
| `/dashboard` | `app/(app)/dashboard/page.tsx` | Main SPA dashboard; all views rendered here |
| `/dashboard/hr-analytics` | `app/(app)/dashboard/hr-analytics/page.tsx` | HR analytics sub-page |
| `/dashboard/management` | `app/(app)/dashboard/management/page.tsx` | Management view sub-page |
| `/dashboard/my-salary` | `app/(app)/dashboard/my-salary/page.tsx` | Employee salary comparison sub-page |
| `/onboarding` | `app/(app)/onboarding/page.tsx` | New org setup flow |
| `/book-consulting` | `app/(app)/book-consulting/page.tsx` | Consulting booking |
| `/sign-in/[[...sign-in]]` | `app/(app)/sign-in/[[...sign-in]]/page.tsx` | Custom sign-in page (shows countdown, links to `/auth/sign-in`) |
| `/sign-up/[[...sign-up]]` | `app/(app)/sign-up/[[...sign-up]]/page.tsx` | Sign-up page |

### `(marketing)` — Public Site
Location: `app/(marketing)/`
Layout: `app/(marketing)/layout.tsx` — own HTML shell, own globals.css
Pages: `app/(marketing)/page.tsx`

### Auth Route Handlers (no layout, server-side)
| Route | File | Purpose |
|---|---|---|
| `GET /auth/sign-in` | `app/auth/sign-in/route.ts` | Initiate Logto OIDC sign-in |
| `GET /auth/sign-out` | `app/auth/sign-out/route.ts` | Logto sign-out |
| `GET /auth/sign-up` | `app/auth/sign-up/route.ts` | Initiate Logto sign-up |
| `GET /callback` | `app/callback/route.ts` | Logto OIDC callback handler; sets org cookie |

### API Routes
Location: `app/api/`

**Auth API (`app/api/auth/`):**
- `GET /api/auth/me` → `app/api/auth/me/route.ts`
- `GET /api/auth/organization-token` → `app/api/auth/organization-token/route.ts`
- `POST /api/auth/active-org` → `app/api/auth/active-org/route.ts`
- `GET /api/auth/organizations` → `app/api/auth/organizations/route.ts`

**Pay Equity API (`app/api/pay-equity/`):**
- `POST /api/pay-equity/chat` → `app/api/pay-equity/chat/route.ts`
- `POST /api/pay-equity/generate-explanation` → `app/api/pay-equity/generate-explanation/route.ts`
- `POST /api/pay-equity/simulate` → `app/api/pay-equity/simulate/route.ts`
- `POST /api/pay-equity/update-stats` → `app/api/pay-equity/update-stats/route.ts`

## Component Organization

### `components/dashboard/` — Feature View Components
Each file is a full view that `app/(app)/dashboard/page.tsx` renders based on `activeView` state.

| File | View key | Access |
|---|---|---|
| `DashboardOverview.tsx` | `overview` | admin, hr_manager |
| `EmployeesView.tsx` | `employees` | admin, hr_manager |
| `JobProfilesView.tsx` | `job-profiles` | admin, hr_manager |
| `PayBandsView.tsx` | `pay-bands` | admin, hr_manager |
| `PayGapReportView.tsx` | `reports` | admin, hr_manager |
| `PayEquityHRView.tsx` | `pay-equity-hr` | admin, hr_manager |
| `PayEquityManagementView.tsx` | `pay-equity-mgmt` | admin, hr_manager |
| `MySalaryComparisonView.tsx` | `my-salary` | all roles |
| `EmployeeSalaryComparisonView.tsx` | — | admin, hr_manager |
| `EmployeeDashboard.tsx` | — | employee |
| `InfoRequestsView.tsx` | `requests` | admin, hr_manager |
| `AuditLogsView.tsx` | `audit` | admin only |
| `CompanySetup.tsx` | `settings` | admin only |

### `components/pay-equity/`
- `PayEquityChat.tsx` — AI chat widget for pay equity questions

### `components/ui/`
- shadcn/ui primitives (auto-generated via `components.json`)
- Do not edit directly; re-generate with shadcn CLI

### `components/` (root level — marketing + shared)
- `Header.tsx` — Marketing site header
- `HeroSection.tsx` — Marketing hero
- `FeaturesSection.tsx`, `PricingSection.tsx`, `SecuritySection.tsx`, `ContactSection.tsx`, `Footer.tsx`
- `Logo.tsx` — Brand logo component
- `RoleGuard.tsx` — RBAC component and `useRoleAccess` hook

## Hooks & Utilities

### `hooks/` — Client-side React Hooks
All hooks are client-side (`'use client'`). The primary hook `useAuth.tsx` also exports `AuthProvider`.

| File | Purpose |
|---|---|
| `useAuth.tsx` | Auth context: `user`, `role`, `orgId`, `supabase`, `loading`, `signOut`, `setActiveOrganization` |
| `useCompany.ts` | Company CRUD operations |
| `useEmployees.ts` | Employee management queries and mutations |
| `usePayEquity.ts` | Pay group / gap analytics TanStack Query hooks |
| `usePayGapStatistics.ts` | Gender pay gap statistics |
| `useJobProfiles.ts` | Job profile management |
| `useInfoRequests.ts` | Employee salary info request workflow |
| `usePermissions.ts` | Fine-grained permission checks beyond role |
| `useAuditSystem.ts` | Write audit log entries |
| `useAuditLogs.ts` | Read audit log entries |
| `use-mobile.tsx` | Responsive breakpoint detection |
| `use-toast.ts` | Toast notification imperative API |

### `lib/` — Server-safe Modules
Used in Server Components, Route Handlers, and Server Actions only.

| Path | Purpose |
|---|---|
| `lib/logto.ts` | Logto config factory (`getLogtoConfig()`), `ACTIVE_ORG_COOKIE` constant |
| `lib/logto-management.ts` | M2M management API client (org provisioning) |
| `lib/auth/server.ts` | `getServerAuthContext()` — server auth helper; `mapLogtoUser()` |
| `lib/supabase/server.ts` | `createClient(organizationId?)` — server Supabase client with org token |
| `lib/services/gemini-service.ts` | Google Gemini AI service wrapper |
| `lib/services/pay-equity.ts` | Pay equity domain service logic |
| `lib/types/pay-equity.ts` | TypeScript interfaces: `PayGroup`, `PayGroupStats`, `EmployeeComparison`, `ManagementKPIs` |
| `lib/utils.ts` | Shared utility functions (e.g. `cn()` for class merging) |

### `utils/supabase/`
| Path | Purpose |
|---|---|
| `utils/supabase/client.ts` | `createSupabaseClient(getToken)` — browser client with org token injector; `createClient()` — anonymous browser client |

## Database

### Migrations
Location: `supabase/migrations/`
Format: `YYYYMMDDHHMMSS_<uuid>.sql` (Supabase CLI format) and semantic names like `20260126_pay_equity_analysis.sql`

Key migration files:
- `20260116_switch_to_clerk_auth.sql` — legacy auth switch (pre-Logto)
- `20260126_pay_equity_analysis.sql` — pay groups and statistics tables
- `20260130105000_add_organization_id_columns.sql` — multi-tenant column additions
- `20260218_add_subscription_tiers.sql` — subscription model

### Generated Types
- `integrations/supabase/types.ts` — auto-generated from `supabase gen types typescript`; contains full `Database` type with all table Row/Insert/Update types
- Do not edit manually; regenerate when schema changes with `supabase gen types typescript --local > integrations/supabase/types.ts`

## Key File Locations

**Entry Points:**
- `middleware.ts` — Auth enforcement, org cookie management
- `app/(app)/layout.tsx` — App HTML shell
- `app/(app)/providers.tsx` — Client provider stack
- `app/(app)/dashboard/page.tsx` — Main dashboard SPA
- `app/(marketing)/page.tsx` — Public landing page

**Auth & Session:**
- `lib/logto.ts` — Logto config and cookie name
- `lib/auth/server.ts` — Server auth context
- `hooks/useAuth.tsx` — Client auth context and provider
- `app/callback/route.ts` — OIDC callback handler
- `app/auth/sign-in/route.ts` — Sign-in initiator

**Supabase Clients:**
- `lib/supabase/server.ts` — Server client (use in Route Handlers, Server Components)
- `utils/supabase/client.ts` — Browser client factory (consumed via `useAuth`)

**RBAC:**
- `components/RoleGuard.tsx` — `<RoleGuard>` component and `useRoleAccess()` hook

**Configuration:**
- `next.config.ts` — Next.js configuration
- `tailwind.config.ts` — Tailwind CSS configuration
- `tsconfig.json` — TypeScript paths (`@/` → project root)
- `components.json` — shadcn/ui configuration
- `sentry.server.config.ts`, `sentry.edge.config.ts` — Sentry setup

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g. `PayEquityHRView.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g. `usePayEquity.ts`)
- Route handlers: `route.ts` in directory named after the segment
- Server utilities: `camelCase.ts` (e.g. `gemini-service.ts`, `pay-equity.ts`)

**Directories:**
- Route segments: `kebab-case` (e.g. `pay-equity`, `hr-analytics`, `book-consulting`)
- Route groups: `(camelCase)` or `(kebab-case)` (e.g. `(app)`, `(marketing)`)
- Catch-all routes: `[[...slug]]` pattern (e.g. `[[...sign-in]]`)

**Exports:**
- Components: default export for pages, named export for shared components
- Hooks: named exports (e.g. `export function useAuth`, `export const AuthProvider`)

## Where to Add New Code

**New Dashboard View:**
1. Create view component in `components/dashboard/NewView.tsx`
2. Add view key to `HRView` type in `app/(app)/dashboard/page.tsx`
3. Import and add to the `renderView()` switch in `app/(app)/dashboard/page.tsx`
4. Add nav item to `HR_ADMIN_NAV` or `EMPLOYEE_NAV` as appropriate

**New API Endpoint:**
1. Create directory `app/api/<domain>/<action>/`
2. Create `route.ts` with `export async function POST/GET(request: NextRequest)`
3. Auth check: `const { user } = await getServerAuthContext()`
4. Supabase access: `const supabase = await createClient()`

**New Hook:**
1. Create `hooks/use<Domain>.ts`
2. Import `useAuth` to get `supabase` and `orgId`
3. Wrap queries in `useQuery({ queryKey: ['<domain>', orgId, ...params], queryFn: ... })`
4. Wrap mutations in `useMutation` with `queryClient.invalidateQueries()`

**New Supabase Table:**
1. Create migration in `supabase/migrations/<timestamp>_<description>.sql`
2. Add `organization_id TEXT NOT NULL` column with RLS policy
3. Regenerate types: `supabase gen types typescript --local > integrations/supabase/types.ts`
4. Add TypeScript interface in `lib/types/` if needed

**New Service Integration:**
1. Create `lib/services/<service-name>.ts`
2. Use environment variables for credentials (never hardcode)
3. Call only from API Route Handlers, not from client hooks

---

*Structure analysis: 2026-03-19*
