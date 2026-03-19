# Testing

**Analysis Date:** 2026-03-19

## Test Framework & Setup

**No automated test suite exists.** There are no test files, no test runner configuration, and no testing dependencies in `package.json`.

Confirmed by:
- No `jest.config.*`, `vitest.config.*`, or `playwright.config.*` files present
- No `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx` files anywhere in the codebase
- No testing packages in `package.json` (`devDependencies` contains only TypeScript, ESLint, Tailwind, and type packages)

**Validation toolchain (the actual QA pipeline):**

```bash
npx tsc --noEmit      # TypeScript type checking — run after every change
npm run lint          # ESLint via Next.js (eslint.config.mjs)
npm run build         # Production build — catches bundling and server component errors
```

## Test Structure

Not applicable — no test files exist.

## Current Coverage

**Zero automated test coverage.** No unit tests, integration tests, or end-to-end tests.

**What the type checker covers:**
- `tsconfig.json` — TypeScript 5.x with `"strict": false`, `"strictNullChecks": false`, `"noImplicitAny": false`
- All `.ts` and `.tsx` files under the project root are included
- The Next.js TypeScript plugin is active via `plugins: [{ name: "next" }]`
- Run with `npx tsc --noEmit` — does NOT emit JS files, only validates types

**What ESLint covers (`eslint.config.mjs`):**
- `typescript-eslint` recommended rules (but with several disabled — see below)
- `eslint-plugin-react-hooks` recommended rules
- `react-refresh/only-export-components` — disabled (`"off"`)
- `@typescript-eslint/no-unused-vars` — disabled (`"off"`)
- `@typescript-eslint/no-empty-object-type` — disabled (`"off"`)
- `@typescript-eslint/no-explicit-any` — disabled (`"off"`) — `any` is freely used in 35 files
- `react-hooks/exhaustive-deps` — disabled (`"off"`) — missing hook dependencies are not flagged

**What build validation covers:**
- Next.js App Router server/client boundary violations
- Missing required props in server components
- Bundling errors and import resolution failures

## Validation Strategy

This project uses a static analysis-only validation strategy. There are no runtime tests. The workflow is:

1. **Make changes**
2. **Run `npx tsc --noEmit`** — catches type errors, missing properties, wrong function signatures
3. **Run `npm run lint`** — catches React hook rule violations and ESLint issues
4. **Run `npm run build`** — catches Next.js-specific build-time errors

**Key gaps in this strategy:**
- No validation of Supabase query correctness at runtime — queries that violate RLS silently return empty data
- No validation of API route request/response shapes beyond TypeScript interfaces
- No regression protection — any change can break existing behavior without detection
- Hook dependency arrays are not validated (`react-hooks/exhaustive-deps` is disabled), which can produce stale closure bugs silently
- `any` types in 35 files mean TypeScript provides no safety for those code paths

**Where to add tests if introducing a test suite:**

Recommended priority:
1. `lib/services/gemini-service.ts` — AI integration, side-effectful, expensive to test manually
2. `hooks/usePermissions.ts` — permission logic that gates security-sensitive UI
3. `app/api/pay-equity/` routes — server-side data aggregation with business logic
4. `lib/auth/server.ts` — auth context extraction used by all API routes
5. `components/RoleGuard.tsx` and `useRoleAccess()` — RBAC UI enforcement

**Recommended test stack if adding tests:**
- Vitest (compatible with Next.js 15, faster than Jest)
- `@testing-library/react` for component tests
- `msw` (Mock Service Worker) for mocking Supabase and API calls
- Place test files co-located: `hooks/useEmployees.test.ts` next to `hooks/useEmployees.ts`
