---
phase: 01-schema-and-security-foundation
verified: 2026-03-19T16:00:00Z
status: gaps_found
score: 8/10 must-haves verified
gaps:
  - truth: "All tenant-scoped tables have organization_id TEXT NOT NULL"
    status: partial
    reason: "profiles table defines organization_id as TEXT (nullable) in CREATE TABLE. The migration comment on line 66-67 promises a 'data safety backfill section' that would enforce NOT NULL via ALTER TABLE SET NOT NULL, but that section was never written. Additionally, all ADD COLUMN IF NOT EXISTS statements for existing tables (companies, job_profiles, pay_bands, employees, audit_logs, user_roles, info_requests, profiles, info_requests) add organization_id as TEXT without NOT NULL — on an existing database these columns are added as nullable. FOUN-02 requires NOT NULL enforcement."
    artifacts:
      - path: "supabase/migrations/20260319000000_canonical_schema.sql"
        issue: "profiles CREATE TABLE defines organization_id TEXT (no NOT NULL). Lines 60, 108, 137, 178, 284, 302, 318, 337 add organization_id as nullable TEXT via ADD COLUMN IF NOT EXISTS. Missing: ALTER TABLE {table} ALTER COLUMN organization_id SET NOT NULL for all existing tables after backfill."
    missing:
      - "ALTER TABLE profiles ALTER COLUMN organization_id SET NOT NULL (or change CREATE TABLE definition)"
      - "ALTER TABLE companies ALTER COLUMN organization_id SET NOT NULL after ADD COLUMN IF NOT EXISTS"
      - "Same SET NOT NULL enforcement for job_profiles, pay_bands, employees, audit_logs, user_roles, info_requests on existing databases"
      - "The 'data safety section' referenced in migration comment line 67 needs to be written"
  - truth: "A single canonical migration file creates the complete compliance-ready schema from scratch"
    status: partial
    reason: "20 timestamped migration files still exist in the migrations root alongside the canonical schema. Supabase CLI processes all .sql files in migrations/ in timestamp order — 20 legacy files run before the canonical one. While the canonical migration uses DROP POLICY and CREATE IF NOT EXISTS guards to be idempotent, the legacy files introduce contradictory table definitions and policies that the canonical migration must undo. This is not a clean 'single file' initialization — it depends on the canonical file successfully overriding all prior migrations. The PLAN acceptance criteria stated 'Only timestamped migrations remain' but intended only the canonical file, not 20 legacy ones."
    artifacts:
      - path: "supabase/migrations/"
        issue: "20 legacy timestamped migration files remain in migrations root (e.g. 20260106063435_*, 20260114_*, 20260116_*, 20260126_*, 20260130_*, 20260218_*). Two of them (20260106070646_* and 20260106072211_*) contain USING(true) policies that the canonical migration's DO block must drop at runtime."
    missing:
      - "Either consolidate all 20 legacy migrations into the canonical file (true single-migration approach), or document explicitly that the canonical file is designed to run after and override the legacy set"
      - "The FOUN-01 requirement 'single authoritative migration replaces all 17 ad-hoc patch files' — 20 timestamped files remain, separate from the 17 named patches that were archived"
human_verification:
  - test: "Apply migration to a fresh Supabase instance and run scripts/verify-schema.sql"
    expected: "All verification queries return expected row counts: 0 rows for nullable org_id check, 0 rows for USING(true) policies, 1 row for user_roles_user_org_unique, 14 rows for table existence, 0 rows for RLS-disabled tables"
    why_human: "Cannot execute SQL against Supabase instance programmatically — requires actual DB connection"
  - test: "Verify Logto JWT contains 'org_id' claim (not 'organization_id')"
    expected: "Token payload has org_id field with the Logto organization ID"
    why_human: "Cannot inspect live JWT without running the app and authenticating"
---

# Phase 01: Schema and Security Foundation Verification Report

**Phase Goal:** The database is the security boundary — it must be correct before any application feature is built or trusted
**Verified:** 2026-03-19
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A single canonical migration file creates the complete compliance-ready schema from scratch | PARTIAL | `20260319000000_canonical_schema.sql` exists (661 lines) with all 14 tables and proper RLS, but 20 legacy timestamped migrations also remain in the root |
| 2 | All tenant-scoped tables have organization_id TEXT NOT NULL | PARTIAL | New-install CREATE TABLE statements have NOT NULL for 12/14 tables; `profiles` is nullable in CREATE TABLE; all ADD COLUMN IF NOT EXISTS statements lack NOT NULL; no SET NOT NULL enforcement section was written despite comment promising it |
| 3 | No USING(true) RLS policies exist on any table | VERIFIED | Zero occurrences of `USING (true)` or `USING(true)` in canonical schema (grep count: 0); DO block in Part 4 programmatically drops all existing policies on all 14 tenant tables before creating new ones — overrides legacy files at runtime |
| 4 | user_roles has UNIQUE(user_id, organization_id) constraint | VERIFIED | `user_roles_user_org_unique` constraint definition present at lines 361-362 with idempotency guard |
| 5 | Employee-role users can only read their own row from employees table | VERIFIED | `employees_self_select` policy at line 531 with `user_id = (auth.jwt() ->> 'sub')` condition |
| 6 | RLS policies use auth.jwt() ->> 'org_id' via public.org_id() helper, not auth.uid() | VERIFIED | `public.org_id()` function at line 21 uses `auth.jwt() ->> 'org_id'`; zero occurrences of `auth.uid()` in migration; 44 occurrences of `public.org_id()` in policies |
| 7 | @google/generative-ai is not in package.json dependencies or devDependencies | VERIFIED | Package absent from both dependency sections |
| 8 | svix is not in package.json dependencies or devDependencies | VERIFIED | Package absent from both dependency sections |
| 9 | No AI-related API routes exist under app/api/pay-equity/ | VERIFIED | All 4 routes deleted; directory gone |
| 10 | TypeScript compilation passes after cleanup | VERIFIED | `npx tsc --noEmit` exits 0 |

**Score:** 8/10 truths verified (2 partial)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260319000000_canonical_schema.sql` | Complete idempotent schema with RLS | VERIFIED | 661 lines, all 14 tables, 11 index definitions, complete RLS policy set |
| `supabase/migrations/archive/` | Archived ad-hoc migration patches | VERIFIED | 17 files archived as expected |
| `scripts/verify-schema.sql` | Verification queries for schema correctness | VERIFIED | Contains queries for FOUN-01 through FOUN-04, plus org_id function check and constraint verification |
| `package.json` | Clean dependency list without dead packages | VERIFIED | Neither `@google/generative-ai` nor `svix` present |
| `app/api/pay-equity/` | All AI routes removed | VERIFIED | Directory does not exist |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `public.org_id()` | `auth.jwt() ->> 'org_id'` | SQL function definition | VERIFIED | Line 21: `SELECT (auth.jwt() ->> 'org_id')` |
| RLS policies on tenant tables | `public.org_id()` | USING clause | VERIFIED | 44 occurrences of `public.org_id()` in USING/WITH CHECK clauses across all tenant tables |
| `package.json` | npm node_modules | npm uninstall | VERIFIED | Dead packages absent; both in dependencies and devDependencies |
| Codebase imports | deleted files | grep verification | VERIFIED | 0 references to `@google/generative-ai`, `gemini-service`, or `svix` in app/lib/hooks/components |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| FOUN-01 | 01-01-PLAN.md | Single authoritative migration replaces all 17 ad-hoc patch files | PARTIAL | 17 named patches archived; canonical migration exists; but 20 legacy timestamped migrations still present in root |
| FOUN-02 | 01-01-PLAN.md | All tenant-scoped tables enforce organization_id TEXT NOT NULL | PARTIAL | 12/14 tables correct for fresh installs; profiles nullable; no SET NOT NULL enforcement for existing DBs |
| FOUN-03 | 01-01-PLAN.md | RLS policies use Logto JWT claims via org_id() — no USING(true) | VERIFIED | Zero USING(true) in canonical schema; DO block drops all prior policies |
| FOUN-04 | 01-01-PLAN.md | user_roles has UNIQUE constraint on (user_id, organization_id) | VERIFIED | user_roles_user_org_unique constraint with idempotency guard |
| FOUN-05 | 01-02-PLAN.md | Dead dependencies removed | VERIFIED | @google/generative-ai and svix absent from package.json |
| FOUN-06 | 01-02-PLAN.md | AI-related API routes and services removed | VERIFIED | All 4 routes deleted, gemini-service.ts deleted, PayEquityChat.tsx deleted |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `supabase/migrations/20260319000000_canonical_schema.sql` | 66-67 | Comment promises "data safety section" for NOT NULL backfill that was never implemented | Warning | FOUN-02 not fully satisfied for existing databases |
| `supabase/migrations/20260319000000_canonical_schema.sql` | 309 | `profiles` CREATE TABLE defines `organization_id TEXT` (nullable, no NOT NULL) | Warning | Any new profile row can be inserted without an organization — RLS policy on profiles will silently exclude it |
| `supabase/migrations/` root | - | 20 legacy timestamped migrations co-exist with canonical migration | Warning | Supabase CLI will run all 21 files in sequence; legacy files introduce contradictory policies that the canonical file must clean up at runtime |

### Human Verification Required

#### 1. Apply canonical migration to a fresh Supabase instance

**Test:** Run `supabase/migrations/20260319000000_canonical_schema.sql` against a fresh Supabase project, then execute `scripts/verify-schema.sql` in the SQL editor.
**Expected:** All verification queries return expected counts: 0 rows for nullable org_id check, 0 rows for USING(true) policies, 1 row for user_roles_user_org_unique, 14 rows for table existence
**Why human:** Cannot execute SQL against a live Supabase instance programmatically from this environment

#### 2. Verify Logto JWT claim name

**Test:** Authenticate a test user through the app, capture the JWT (via browser devtools or `console.log(JSON.parse(atob(token.split('.')[1])))`), inspect the payload for the org claim key name.
**Expected:** Token contains `org_id` field (not `organization_id`). If `organization_id`, the `public.org_id()` function must be updated.
**Why human:** Cannot inspect live JWT without running the app with a real Logto instance

### Gaps Summary

Two related gaps block full FOUN-01 and FOUN-02 compliance:

**Gap 1 (FOUN-02): profiles.organization_id is nullable, existing-DB NOT NULL enforcement is missing.** The canonical migration defines `profiles.organization_id` as `TEXT` (no NOT NULL constraint) in the CREATE TABLE statement, and all ADD COLUMN IF NOT EXISTS statements for existing tables add `organization_id TEXT` without NOT NULL. The migration file itself contains a comment (line 66-67) saying "Ensure NOT NULL on organization_id after backfill (see data safety section below)" but that section was never written. On a fresh DB: 12/14 tables are correct; profiles remains nullable. On an existing DB: columns are added nullable with no subsequent SET NOT NULL. The RLS policy on profiles (`USING (organization_id = public.org_id())`) will silently exclude any profile row where organization_id is NULL, rather than blocking the insert.

**Gap 2 (FOUN-01): 20 legacy timestamped migration files remain in the migrations root.** The 17 named ad-hoc patches were correctly archived. However, 20 older timestamped migration files (e.g., `20260106063435_*`, `20260114_*`, `20260116_*`) remain in `supabase/migrations/` root. The Supabase CLI processes all `.sql` files in the root in timestamp order — the canonical migration runs last and overrides them, but the migration sequence is not a clean single file. Two of the legacy files (`20260106070646_*` and `20260106072211_*`) contain `USING (true)` policies that the canonical migration's DO block must drop at runtime. FOUN-01's intent ("single authoritative migration") is not achieved structurally.

These two gaps are medium severity for a database schema file — they affect existing-DB deployments and make the migration sequence non-deterministic on paper, but the canonical migration's idempotency guards and programmatic policy cleanup mitigate the runtime risk significantly.

---
_Verified: 2026-03-19_
_Verifier: Claude (gsd-verifier)_
