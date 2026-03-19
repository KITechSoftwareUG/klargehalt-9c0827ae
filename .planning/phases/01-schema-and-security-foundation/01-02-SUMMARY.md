---
phase: 01-schema-and-security-foundation
plan: 02
subsystem: api
tags: [cleanup, dependencies, pay-equity, gemini, typescript]

# Dependency graph
requires: []
provides:
  - Clean package.json without @google/generative-ai or svix
  - All AI pay-equity API routes removed (chat, generate-explanation, simulate, update-stats)
  - gemini-service.ts deleted
  - No dangling imports referencing deleted files
affects: [all future phases that read package.json or import from app/api/pay-equity/]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dead code removal: delete routes, service, component, and all call sites in one pass"

key-files:
  created: []
  modified:
    - package.json
    - package-lock.json
    - hooks/usePayEquity.ts
    - components/dashboard/MySalaryComparisonView.tsx
    - components/dashboard/PayEquityHRView.tsx
    - components/dashboard/PayEquityManagementView.tsx
    - app/(app)/dashboard/hr-analytics/page.tsx
    - app/(app)/dashboard/management/page.tsx
    - app/(app)/dashboard/my-salary/page.tsx

key-decisions:
  - "Removed @google/generative-ai and svix from package.json — AI features out of scope, svix was unused"
  - "Deleted PayEquityChat component entirely — it had no purpose without /api/pay-equity/chat endpoint"
  - "Replaced useUpdatePayGroupStats (called deleted endpoint) with direct refetch() — simpler and correct"

patterns-established:
  - "When deleting API routes, always trace and fix all call sites: hooks, components, pages"

requirements-completed: [FOUN-05, FOUN-06]

# Metrics
duration: 16min
completed: 2026-03-19
---

# Phase 01 Plan 02: Remove Dead AI Dependencies Summary

**Removed @google/generative-ai and svix packages plus all pay-equity AI routes, cutting 1554 lines of dead code**

## Performance

- **Duration:** 16 min
- **Started:** 2026-03-19T14:19:36Z
- **Completed:** 2026-03-19T14:35:39Z
- **Tasks:** 2 (combined into 1 commit)
- **Files modified:** 15

## Accomplishments

- Uninstalled `@google/generative-ai` and `svix` from package.json
- Deleted all 4 pay-equity API route files (chat, generate-explanation, simulate, update-stats)
- Deleted `lib/services/gemini-service.ts` and `components/pay-equity/PayEquityChat.tsx`
- Removed AI explanation UI from `MySalaryComparisonView` and `my-salary/page.tsx`
- Removed simulation UI from `PayEquityManagementView` and `management/page.tsx`
- Cleaned stale `.next/types` cache references to deleted routes
- TypeScript compilation and ESLint both pass cleanly with 0 errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove dead dependencies and delete AI routes/services** - `4cebe3a` (feat)
2. **Task 2: Verify clean build after cleanup** - included in Task 1 commit (no additional changes needed)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `package.json` - Removed @google/generative-ai and svix dependencies
- `package-lock.json` - Updated after npm uninstall
- `hooks/usePayEquity.ts` - Removed useGenerateExplanation, useSalarySimulation, useUpdatePayGroupStats mutations
- `components/dashboard/MySalaryComparisonView.tsx` - Removed AI explanation card and useGenerateExplanation usage
- `components/dashboard/PayEquityHRView.tsx` - Removed useUpdatePayGroupStats, replaced with refetch()
- `components/dashboard/PayEquityManagementView.tsx` - Removed useSalarySimulation, deleted simulation section
- `app/(app)/dashboard/hr-analytics/page.tsx` - Removed useUpdatePayGroupStats, replaced with refetch()
- `app/(app)/dashboard/management/page.tsx` - Removed useSalarySimulation and What-If Simulation card
- `app/(app)/dashboard/my-salary/page.tsx` - Removed useGenerateExplanation and KI-Erklärung card

**Deleted:**
- `app/api/pay-equity/chat/route.ts`
- `app/api/pay-equity/generate-explanation/route.ts`
- `app/api/pay-equity/simulate/route.ts`
- `app/api/pay-equity/update-stats/route.ts`
- `lib/services/gemini-service.ts`
- `components/pay-equity/PayEquityChat.tsx`

## Decisions Made

- Removed `@google/generative-ai` and `svix` — AI features were explicitly out of scope per research decision, svix was unused
- Deleted `PayEquityChat` component entirely — it only called the deleted `/api/pay-equity/chat` endpoint with no other functionality
- Replaced `useUpdatePayGroupStats` (which called the deleted `/api/pay-equity/update-stats`) with direct `refetch()` on the TanStack Query — simpler and functionally equivalent for refreshing data

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed useUpdatePayGroupStats which called deleted endpoint**
- **Found during:** Task 1 (Remove dead dependencies and delete AI routes/services)
- **Issue:** The plan's acceptance criteria pattern didn't flag `/api/pay-equity/update-stats` URL reference in `usePayEquity.ts`, but the endpoint was deleted — calling it would cause runtime errors
- **Fix:** Removed `useUpdatePayGroupStats` from `usePayEquity.ts` and all callers in `PayEquityHRView.tsx` and `hr-analytics/page.tsx`. Replaced the "Aktualisieren" button with direct `refetch()` calls
- **Files modified:** hooks/usePayEquity.ts, components/dashboard/PayEquityHRView.tsx, app/(app)/dashboard/hr-analytics/page.tsx
- **Verification:** TypeScript compiles, no references to deleted endpoint
- **Committed in:** 4cebe3a (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Essential correctness fix. The deleted endpoint would have caused 500 errors at runtime. No scope creep.

## Issues Encountered

- `.next/types/validator.ts` contained stale generated references to deleted routes — removed those 4 blocks from the generated file to clear TypeScript errors

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Package.json is clean: no dead dependencies
- All AI routes are gone: no attack surface from unused Gemini integration
- TypeScript and ESLint pass cleanly
- Ready for Phase 01 Plan 03 (database schema work)

---
*Phase: 01-schema-and-security-foundation*
*Completed: 2026-03-19*
