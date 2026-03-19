# Phase 1: Schema and Security Foundation - Research

**Researched:** 2026-03-19
**Domain:** Supabase PostgreSQL migrations, Row Level Security with external JWT (Logto), dependency cleanup
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUN-01 | Single authoritative database migration replaces all 17 ad-hoc patch files with a clean, deterministic schema | Migration consolidation pattern documented; archive strategy for non-timestamped files identified |
| FOUN-02 | All tenant-scoped tables enforce `organization_id TEXT NOT NULL` | Current nullable columns identified in `20260130105000_add_organization_id_columns.sql`; NOT NULL constraint enforcement documented |
| FOUN-03 | RLS policies use Logto JWT claims (`auth.jwt() ->> 'org_id'`) for tenant isolation — no USING(true) policies remain | `public.org_id()` helper function already exists in MASTER_RLS_FIX*.sql; Logto JWT claim name is `org_id`; token exchange pattern confirmed |
| FOUN-04 | `user_roles` table has UNIQUE constraint on `(user_id, organization_id)` to support multi-org users | Bug confirmed in CONCERNS.md and hooks; conflict target `user_id` is wrong; fix pattern documented |
| FOUN-05 | Dead dependencies removed (`@google/generative-ai`, `svix`) | Both confirmed in package.json at `^0.24.1` and `^1.84.1`; removal command documented |
| FOUN-06 | AI-related API routes and services removed (`/api/pay-equity/chat`, `/api/pay-equity/generate-explanation`, `lib/services/gemini-service.ts`) | All three confirmed present in codebase; deletion scope identified |
</phase_requirements>

---

## Summary

Phase 1 replaces an accumulated pile of contradictory emergency patches with one authoritative migration and working RLS. The codebase currently has 37 migration files, of which at least 15 are unordered ad-hoc patches with names like `FINAL_DATABASE_FIX.sql` and `NUCLEAR_UUID_TO_TEXT_FIX.sql`. Several of these patches directly contradict earlier migrations — `switch_to_clerk_auth.sql` sets strict RLS, then `FIX_COMPANIES_RLS_INSERT.sql` opens it completely with `USING(true)`. The net result is that any authenticated Supabase user can read any tenant's salary data.

The RLS fix is technically straightforward. Logto-issued JWTs are already being passed to Supabase as `Authorization: Bearer` headers in both the server client (`lib/supabase/server.ts`) and the browser client (via `useAuth()`). A helper function `public.org_id()` that reads `auth.jwt() ->> 'org_id'` already exists in `MASTER_RLS_FIX.sql` — it just gets immediately overridden by the later `USING(true)` patches. The key blocker confirmed in STATE.md (the exact Logto JWT claim name) is resolvable: both `MASTER_RLS_FIX.sql` and `MASTER_RLS_FIX_V2.sql` use `auth.jwt() ->> 'org_id'` and these were presumably applied to the running database, meaning `org_id` is the confirmed claim name.

The new schema must also be designed from scratch to support the full compliance data model (organizations, departments, job_levels, job_profiles, employees with hourly rate fields, salary_history, pay_gap_snapshots, audit_logs) — but this complete schema is out of scope for Phase 1. Phase 1 delivers the security foundation on the existing tables plus the structural groundwork that Phase 2 will build on. Dependency cleanup (remove `@google/generative-ai`, `svix`, AI routes) is a straightforward file deletion and `npm uninstall`.

**Primary recommendation:** Write one timestamped migration that creates the `public.org_id()` function, enforces `organization_id TEXT NOT NULL` on all tenant tables, adds `UNIQUE(user_id, organization_id)` to `user_roles`, and replaces all `USING(true)` policies with `organization_id = public.org_id()`. Archive all un-timestamped patch files from the migration sequence. Then delete AI routes and dead dependencies.

---

## Standard Stack

### Core (already installed, no changes needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | 2.89.0 | Database client | Locked — project constraint |
| `@logto/next` | 4.2.9 | Auth + org token fetching | Locked — project constraint |
| PostgreSQL (via Supabase) | 15 | Database + RLS enforcement | Locked — project constraint |
| Next.js | 15.1.6 | App framework | Locked — project constraint |

### To Remove

| Package | Current Version | Why Remove |
|---------|-----------------|------------|
| `@google/generative-ai` | ^0.24.1 | AI features out of scope (FOUN-05); dead weight increasing attack surface |
| `svix` | ^1.84.1 | Was for Clerk webhook verification; Clerk is gone, Logto does not use Svix (FOUN-05) |

**Removal command:**
```bash
npm uninstall @google/generative-ai svix
```

---

## Architecture Patterns

### Migration Consolidation Pattern

The canonical approach for replacing a chaotic migration history is:

1. **Introspect the live database state** using `supabase db dump --schema-only` or `pg_dump --schema-only`. This produces the actual current schema regardless of migration history.
2. **Write one timestamped `0001_canonical_schema.sql`** that creates all tables, indexes, RLS policies, and functions from scratch — matching the live state, but with all security holes fixed.
3. **Archive all ad-hoc patches** by moving them to a `supabase/migrations/archive/` folder or deleting them. Git history preserves them. The Supabase migration tracker (`supabase_migrations.schema_migrations`) must be reset or this migration must use `IF NOT EXISTS` guards extensively.
4. **Alternative without a fresh database:** Write the single migration to be idempotent — use `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP POLICY IF EXISTS` before each `CREATE POLICY`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. This allows applying it to either a fresh or existing database.

**For this project**, the idempotent approach is safer because a live database exists. The migration must be safe to run on the existing Supabase instance.

### Recommended Migration Structure

```sql
-- supabase/migrations/20260319000000_canonical_schema.sql

-- ============================================================
-- PART 1: Helper Functions
-- ============================================================
CREATE OR REPLACE FUNCTION public.org_id()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$ SELECT (auth.jwt() ->> 'org_id') $$;

-- ============================================================
-- PART 2: Core Tables (CREATE TABLE IF NOT EXISTS + constraints)
-- ============================================================
-- ... all tables with organization_id TEXT NOT NULL ...

-- ============================================================
-- PART 3: UNIQUE Constraint Fixes
-- ============================================================
ALTER TABLE user_roles
  DROP CONSTRAINT IF EXISTS user_roles_user_id_key,
  ADD CONSTRAINT user_roles_user_org_unique UNIQUE (user_id, organization_id);

-- ============================================================
-- PART 4: RLS Policies (drop all, then create correct ones)
-- ============================================================
-- Drop all existing policies programmatically first (DO block),
-- then create correct policies using public.org_id()
```

### RLS Policy Pattern

The correct Logto-compatible RLS policy pattern using the confirmed `org_id` JWT claim:

```sql
-- Helper function (create once, use in all policies)
CREATE OR REPLACE FUNCTION public.org_id()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$ SELECT (auth.jwt() ->> 'org_id') $$;

-- Standard tenant isolation (for HR-managed tables)
CREATE POLICY "tenant_isolation" ON employees
  FOR ALL TO authenticated
  USING (organization_id = public.org_id())
  WITH CHECK (organization_id = public.org_id());

-- Role-restricted read (employee cannot read salary rows of others)
CREATE POLICY "salary_read_hr_only" ON employees
  FOR SELECT TO authenticated
  USING (
    organization_id = public.org_id()
    AND (
      -- HR/admin can read all employees in their org
      (auth.jwt() ->> 'user_role') IN ('admin', 'hr_manager')
      OR
      -- Employees can only read their own record
      (auth.jwt() ->> 'sub') = user_id
    )
  );

-- Audit log: insert-only (no update/delete)
CREATE POLICY "audit_insert_only" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.org_id());
-- No SELECT, UPDATE, DELETE policies on audit_logs for regular users
```

**Critical: `auth.uid()` must NOT be used.** With Logto JWTs, `auth.uid()` returns NULL. Always use `auth.jwt() ->> 'sub'` for user identity.

### New Tables Needed in the Canonical Schema

The Phase 1 migration must introduce the complete compliance-ready schema tables. The following tables are needed by Phase 2 and must exist after Phase 1:

```
organizations    -- links Logto org IDs to company metadata (new)
companies        -- add organization_id TEXT NOT NULL UNIQUE
departments      -- new: replaces free-text department on employees
job_levels       -- new: replaces free-text level fields
job_profiles     -- rework: add Art. 4.4 factor scores, FK to departments
pay_bands        -- rework: FK to job_profiles + job_levels, add effective dates
employees        -- rework: add weekly_hours, leave fields, FK to departments/levels
salary_history   -- new: append-only compensation history
pay_gap_snapshots -- new: pre-computed analytics (Phase 3 will populate)
audit_logs       -- rework: ensure append-only RLS, structured action/entity fields
user_roles       -- fix: UNIQUE(user_id, organization_id)
```

Tables to drop (replaced by the above): `pay_groups`, `employee_comparisons`, `consultation_bookings` (out of scope per REQUIREMENTS.md).

### AI Route Deletion Pattern

Three files and their directories must be removed:

```
app/api/pay-equity/chat/route.ts           → delete
app/api/pay-equity/generate-explanation/route.ts → delete
app/api/pay-equity/simulate/route.ts       → delete (uses company_id from body)
app/api/pay-equity/update-stats/route.ts   → delete (uses company_id from body)
lib/services/gemini-service.ts             → delete
```

Note: All four `app/api/pay-equity/` routes are flagged as security concerns (accepting `company_id` from request body). All four should be removed, not just the three listed in FOUN-06. The `update-stats` and `simulate` routes also need to go because they embed the same security anti-pattern and the new Phase 3 analytics approach will replace them with a clean `/api/pay-gap/recalculate` route.

After deletion, verify no remaining imports reference these paths:
```bash
grep -r "gemini\|pay-equity/chat\|pay-equity/generate\|pay-equity/simulate\|pay-equity/update-stats" app/ lib/ --include="*.ts" --include="*.tsx"
```

### Anti-Patterns to Avoid

- **`USING(true)`:** Never in any policy. If a policy needs to be permissive for testing, use `organization_id = public.org_id()` with test data that has a real org_id.
- **`auth.uid()` in RLS policies:** Returns NULL with Logto JWT. Use `auth.jwt() ->> 'sub'` for user identity.
- **Nullable `organization_id`:** All tenant-scoped tables must have `organization_id TEXT NOT NULL`. No exceptions, including seed/demo data.
- **Trusting `org_id` from request bodies:** Server routes must derive org identity from the verified Logto JWT, not from client-supplied parameters.
- **Contradictory migration files:** The archive folder pattern prevents future `FINAL_FINAL_FIX.sql` files.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT claim extraction in RLS | Custom plpgsql parsing | `auth.jwt() ->> 'org_id'` (built into Supabase) | Supabase exposes the full JWT payload as JSONB via `auth.jwt()` |
| Tenant isolation | Application-layer `WHERE organization_id = ?` | PostgreSQL RLS policies | Application-layer filtering can be bypassed; RLS cannot |
| Type safety for Supabase queries | Manual type assertions | `supabase gen types typescript` | Generates types from the live schema; eliminates 30+ `as any` locations |

---

## Common Pitfalls

### Pitfall 1: Migration Applied to Live DB vs Fresh DB Mismatch

**What goes wrong:** The canonical migration uses `CREATE TABLE` (not `IF NOT EXISTS`). On a fresh Supabase instance it works. Against the live database it fails because tables already exist.

**How to avoid:** Use `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` throughout. For policies, use `DROP POLICY IF EXISTS` before every `CREATE POLICY`. For constraints, use `ALTER TABLE ... DROP CONSTRAINT IF EXISTS` before `ADD CONSTRAINT`.

**Warning signs:** Any migration that starts with bare `CREATE TABLE` or `CREATE POLICY` without `IF NOT EXISTS` guards.

### Pitfall 2: `public.org_id()` Returns NULL for Unauthenticated Requests

**What goes wrong:** A request arrives with no JWT (e.g., a misconfigured server route, a test without auth). `public.org_id()` returns NULL. RLS policies comparing `organization_id = NULL` evaluate to NULL (unknown), which PostgreSQL treats as not satisfying the policy — correctly blocking access. But if any `USING(true)` policy was accidentally left in place, it fires as a fallback.

**How to avoid:** The canonical migration must use a `DO` block to drop ALL policies on ALL tenant tables before creating the new ones. This eliminates any fallback `USING(true)` policy.

**Detection:**
```sql
SELECT tablename, policyname, qual FROM pg_policies WHERE qual = 'true';
```
This must return zero rows after Phase 1 is complete.

### Pitfall 3: Employee-Role Can Still Read Salary Columns

**What goes wrong:** The tenant isolation policy (`organization_id = public.org_id()`) isolates tenants but does not prevent an employee from reading other employees' salaries within the same org.

**How to avoid:** The `employees` table needs a **second** policy for SELECT that restricts salary column access. Since PostgreSQL RLS works at the row level (not column level), the correct approach is:
- `employees` table: SELECT allows employees to read only their own row (WHERE `auth.jwt() ->> 'sub' = user_id`)
- HR/admin: SELECT allows reading all rows in their org
- Never put salary figures in a view or function accessible to employee role

**Warning signs:** A single `FOR ALL` policy on `employees` that only checks `organization_id`.

### Pitfall 4: Archive vs Delete for Old Migrations

**What goes wrong:** Deleting migrations while Supabase's migration tracker (`supabase_migrations.schema_migrations`) still references them causes `supabase db push` to fail or produce confusing diffs.

**How to avoid:** Two options:
1. Move ad-hoc files to `supabase/migrations/archive/` — Supabase CLI ignores non-`.sql` files and subdirectories outside the root migrations folder.
2. Use `supabase migration repair` to mark old migrations as applied if starting fresh.

For this project, since we are writing an idempotent canonical migration, option 1 (archive folder) is simplest.

### Pitfall 5: `user_roles` Unique Constraint Change Breaks Existing Data

**What goes wrong:** Adding `UNIQUE(user_id, organization_id)` fails if duplicate `(user_id, organization_id)` rows already exist.

**How to avoid:** Before adding the constraint:
```sql
-- Delete duplicate rows, keeping only the most recent
DELETE FROM user_roles a USING user_roles b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.organization_id = b.organization_id;
```
Then apply the constraint.

---

## Code Examples

### RLS Helper Function Pattern

```sql
-- Source: MASTER_RLS_FIX.sql (confirmed in codebase) + Supabase docs
CREATE OR REPLACE FUNCTION public.org_id()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
AS $$ SELECT (auth.jwt() ->> 'org_id') $$;

-- Grant execute to authenticated role
GRANT EXECUTE ON FUNCTION public.org_id() TO authenticated;
```

### Drop All Policies on a Table (Idempotent)

```sql
-- Source: switch_to_clerk_auth.sql pattern (confirmed in codebase)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE tablename IN ('employees', 'user_roles', 'companies', 'job_profiles',
                        'pay_bands', 'audit_logs', 'salary_history',
                        'pay_gap_snapshots', 'departments', 'job_levels',
                        'organizations', 'info_requests')
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || quote_ident(r.tablename);
  END LOOP;
END $$;
```

### User ID from Logto JWT (Not auth.uid())

```sql
-- Source: PITFALLS.md analysis + Supabase third-party auth docs
-- WRONG — auth.uid() returns NULL for Logto JWTs:
-- USING (user_id = auth.uid()::text)

-- CORRECT — use JWT sub claim:
USING (user_id = (auth.jwt() ->> 'sub'))
```

### UNIQUE Constraint Fix for user_roles

```sql
-- Source: CONCERNS.md analysis; FOUN-04 requirement
-- Step 1: Remove duplicates
DELETE FROM user_roles a USING user_roles b
WHERE a.created_at < b.created_at
  AND a.user_id = b.user_id
  AND a.organization_id = b.organization_id;

-- Step 2: Drop old wrong constraint
ALTER TABLE user_roles
  DROP CONSTRAINT IF EXISTS user_roles_user_id_key;

-- Step 3: Add correct composite constraint
ALTER TABLE user_roles
  ADD CONSTRAINT user_roles_user_org_unique UNIQUE (user_id, organization_id);
```

### Supabase Types Generation (Post-Migration)

```bash
# Run after canonical migration is applied to get type safety
supabase gen types typescript --local > lib/supabase/types.ts
```

This eliminates the 30+ `as any` locations flagged in CONCERNS.md.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `auth.uid()` for user identity in RLS | `auth.jwt() ->> 'sub'` | When switched from Supabase Auth to Clerk/Logto | `auth.uid()` silently returns NULL with external IdPs |
| `company_id UUID` for tenant isolation | `organization_id TEXT` | Added in patch migrations | TEXT matches Logto org ID format; UUID was Supabase Auth era |
| `USING(true)` emergency policies | `organization_id = public.org_id()` | Must be fixed in Phase 1 | `USING(true)` allows all authenticated users to cross-tenant |
| Multiple contradictory patch files | Single canonical migration | Must be established in Phase 1 | Non-deterministic schema blocks staging environments |

**Deprecated/outdated in this codebase:**
- `auth.uid()` in RLS policies: Must be replaced with `auth.jwt() ->> 'sub'`
- `company_id` FK columns (Supabase Auth era): Replace with `organization_id TEXT NOT NULL`
- All non-timestamped `.sql` files in `supabase/migrations/`: Archive to `supabase/migrations/archive/`

---

## Open Questions

1. **Logto JWT claim name: `org_id` vs `organization_id`**
   - What we know: Both `MASTER_RLS_FIX.sql` and `MASTER_RLS_FIX_V2.sql` use `auth.jwt() ->> 'org_id'`. The codebase `lib/supabase/server.ts` passes Logto org tokens as Bearer headers.
   - What's unclear: Whether these migrations were successfully applied to the live Supabase instance, and whether the Logto org JWT actually emits `org_id` as the claim key (Logto documentation lists `organization_id` in some contexts).
   - Recommendation: Before writing any RLS policy, decode a real Logto org token using `jwt.io` or `console.log(JSON.parse(atob(token.split('.')[1])))` in the browser to confirm the exact claim name. If the claim is `organization_id`, update `public.org_id()` accordingly. The STATE.md blocker explicitly calls this out.

2. **What tables currently exist on the live Supabase instance?**
   - What we know: The migration history is non-deterministic. CONCERNS.md and direct inspection confirm `profiles`, `companies`, `user_roles`, `employees`, `job_profiles`, `pay_bands`, `audit_logs`, `info_requests`, `onboarding_data`, `consultation_bookings` exist (from the `switch_to_clerk_auth.sql` DROP CONSTRAINT list).
   - What's unclear: Whether `pay_groups`, `employee_comparisons`, `onboarding_data`, `subscription_tiers` still exist in their original form.
   - Recommendation: The canonical migration should use `DROP TABLE IF EXISTS` for tables being replaced, and `CREATE TABLE IF NOT EXISTS` for all target tables.

3. **Should consultation_bookings and onboarding_data be preserved?**
   - What we know: `book-consulting` is listed as "out of scope" in REQUIREMENTS.md Out of Scope section. Onboarding is also out of scope.
   - What's unclear: Whether the live app still uses these tables for active users.
   - Recommendation: Keep the tables for now (do not drop) but apply correct RLS. Dropping them risks breaking the existing running app. Phase 1 is about security, not removal of features.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — project uses `tsc --noEmit` + `npm run lint` as stated in CLAUDE.md |
| Config file | `tsconfig.json` (TypeScript), `.eslintrc` or Next.js built-in ESLint |
| Quick run command | `npx tsc --noEmit && npm run lint` |
| Full suite command | `npx tsc --noEmit && npm run lint` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUN-01 | Single migration file, no ad-hoc patches in migration root | manual-only | Count non-timestamped `.sql` files in `supabase/migrations/`: `ls supabase/migrations/*.sql \| grep -v '^[0-9]' \| wc -l` should be 0 | N/A |
| FOUN-02 | All tenant tables have `organization_id TEXT NOT NULL` | manual-only | SQL: `SELECT table_name, is_nullable FROM information_schema.columns WHERE column_name='organization_id' AND is_nullable='YES'` should return 0 rows | N/A |
| FOUN-03 | No `USING(true)` RLS policies remain | manual-only | SQL: `SELECT policyname, tablename FROM pg_policies WHERE qual='true'` should return 0 rows | N/A |
| FOUN-04 | `user_roles` has `UNIQUE(user_id, organization_id)` | manual-only | SQL: `SELECT indexname FROM pg_indexes WHERE tablename='user_roles' AND indexdef LIKE '%user_id%organization_id%'` | N/A |
| FOUN-05 | Dead packages absent from `package.json` | smoke | `node -e "const p=require('./package.json');const d={...p.dependencies,...p.devDependencies};['@google/generative-ai','svix'].forEach(k=>{if(d[k])throw new Error(k+' still present')})"` | ❌ Wave 0 |
| FOUN-06 | AI files absent from codebase | smoke | `ls app/api/pay-equity/chat/ 2>&1 \| grep -q 'No such file'` and similar for other routes | N/A |

**Note:** Since this project has no test framework, all FOUN-* requirements are verified via SQL queries against the live Supabase instance and filesystem checks. These must be run manually as the phase gate before `/gsd:verify-work`.

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit && npm run lint`
- **Per wave merge:** `npx tsc --noEmit && npm run lint` plus the SQL verification queries above
- **Phase gate:** All SQL checks pass + TypeScript clean + lint clean before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] No test framework exists — all FOUN-* verification is SQL + filesystem inspection
- [ ] SQL verification queries (FOUN-01 through FOUN-04) must be run manually against the Supabase instance after migration
- [ ] Consider adding a `scripts/verify-rls.sql` script with all verification queries to make the gate repeatable

---

## Sources

### Primary (HIGH confidence)

- Codebase: `supabase/migrations/MASTER_RLS_FIX.sql` — confirms `public.org_id()` function and `auth.jwt() ->> 'org_id'` claim name
- Codebase: `supabase/migrations/MASTER_RLS_FIX_V2.sql` — confirms same pattern
- Codebase: `supabase/migrations/FIX_COMPANIES_RLS_INSERT.sql` — confirms `USING(true)` extent
- Codebase: `supabase/migrations/FINAL_DATABASE_FIX.sql` — confirms `USING(true)` on core tables
- Codebase: `lib/supabase/server.ts` — confirms Logto org token Bearer header injection pattern
- Codebase: `lib/logto.ts` — confirms Logto scopes include `UserScope.Organizations`
- `.planning/codebase/CONCERNS.md` — authoritative list of all known issues
- `.planning/research/ARCHITECTURE.md` — target schema design (HIGH confidence)
- `.planning/research/PITFALLS.md` — domain pitfall analysis (HIGH confidence)
- `.planning/STATE.md` — confirmed blocker: Logto JWT claim name needs verification
- `package.json` — confirmed dead packages: `@google/generative-ai ^0.24.1`, `svix ^1.84.1`

### Secondary (MEDIUM confidence)

- `.planning/research/STACK.md` — JWT exchange pattern for Logto + Supabase confirmed via Supabase third-party auth docs and Logto quickstart

### Tertiary (LOW confidence — needs validation)

- Logto org JWT claim name (`org_id` vs `organization_id`): inferred from MASTER_RLS_FIX.sql which was presumably applied; must be verified against a real Logto token before writing policies

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed via package.json; Logto + Supabase integration pattern confirmed from codebase
- Architecture (migration consolidation): HIGH — pattern confirmed from codebase analysis; idempotent guards pattern standard PostgreSQL
- RLS policy pattern: HIGH — `public.org_id()` already exists in codebase migrations; pattern confirmed
- JWT claim name (`org_id`): MEDIUM — used in existing migrations but not verified against a live Logto token
- Pitfalls: HIGH — all critical pitfalls have direct evidence in CONCERNS.md and migration files

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable PostgreSQL/Supabase/Logto APIs)
