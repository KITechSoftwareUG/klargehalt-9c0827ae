# Domain Pitfalls

**Domain:** EU Pay Transparency Compliance SaaS (Entgelttransparenzrichtlinie 2023/970)
**Project:** KlarGehalt
**Researched:** 2026-03-19
**Confidence:** HIGH (regulatory requirements from official EUR-Lex + verified secondary sources; technical pitfalls from codebase analysis + confirmed patterns)

---

## Critical Pitfalls

These cause rewrites, regulatory non-compliance, or security breaches. Each has a direct mapping to known issues in the current codebase.

---

### Pitfall 1: RLS Opened Wide During Development, Never Closed

**What goes wrong:** Emergency migrations set `USING (true)` on core tables to unblock development. These permissive policies ship to production and any authenticated user can read or write any tenant's salary data.

**Why it happens:** Development is blocked by RLS failures. The fastest fix is `USING (true)`. The intent is "temporary" but the fix gets committed and forgotten as the next feature starts.

**Consequences:** Complete multi-tenant isolation failure. Any authenticated user can exfiltrate all salary data for all organizations. For a compliance SaaS handling salary data, this is a GDPR violation and a business-ending trust failure.

**Evidence in this codebase:** `FIX_COMPANIES_RLS_INSERT.sql` sets `USING (true) WITH CHECK (true)` for `companies`, `profiles`, `user_roles`, `onboarding_data`. `FINAL_DATABASE_FIX.sql` does the same for `companies`, `employees`, `job_profiles`, `pay_groups` with an explicit comment "Für Testzwecke" (for testing purposes). Both files are in active migration history.

**Prevention:**
- Write correct RLS policies from the start using `auth.jwt() ->> 'sub'` and `auth.jwt() ->> 'org_id'` for Logto JWT claims — never `auth.uid()` which is Supabase-native auth only
- When RLS blocks development, fix the policy logic — do not open with `USING (true)`
- Add a pre-commit check or CI step that fails if any migration contains `USING (true)` or `WITH CHECK (true)` without a real WHERE clause
- Write one authoritative schema migration and delete all ad-hoc patch files (NUCLEAR_*, FIX_*, FINAL_*, MASTER_*) from the migration sequence

**Detection:** Run `SELECT policyname, qual FROM pg_policies WHERE qual = 'true'` against the live database.

**Phase:** Must be addressed in Phase 1 (schema + RLS rebuild) before any analytics feature.

---

### Pitfall 2: `auth.uid()` Is Ineffective with External JWT Providers

**What goes wrong:** RLS policies use `auth.uid()` to identify the current user, but this function returns the Supabase Auth internal user ID. When using Logto (or Clerk, or any external IdP) as the JWT issuer, `auth.uid()` returns NULL. Every policy that uses it silently fails open or fails closed depending on how the policy is written.

**Why it happens:** Supabase documentation and most tutorials assume Supabase Auth. When migrating to an external IdP, developers update the application code but forget to update RLS policies.

**Consequences:** Either all data is inaccessible (policies fail closed, `auth.uid() = NULL` never matches) or all data is accessible (policies evaluate to NULL which PostgreSQL treats as false, so RLS falls back to the permissive `USING (true)` policies). In this codebase the second case applies.

**Evidence in this codebase:** `20260116_switch_to_clerk_auth.sql` uses `auth.uid()::text` throughout. `CONCERNS.md` explicitly calls this out. The migration was written for Clerk, and is now doubly wrong because Logto is the IdP.

**Prevention:**
- Use `auth.jwt() ->> 'sub'` for user ID (the Logto `sub` claim)
- Use `auth.jwt() ->> 'org_id'` for the organization ID claim (verify the exact claim name against Logto's JWT output)
- Define a helper function `current_org_id()` that reads from the JWT and use it consistently across all policies
- Test RLS policies with an actual Logto-issued JWT, not with Supabase Auth sessions

**Detection:** Check if `auth.uid()` appears in any policy definition: `SELECT policyname, qual FROM pg_policies WHERE qual LIKE '%auth.uid()%'`

**Phase:** Phase 1 (schema rebuild). The JWT claim names must be verified against a real Logto token before writing any RLS policy.

---

### Pitfall 3: `organization_id` Columns Added as Nullable — Silent Isolation Bypass

**What goes wrong:** `organization_id` is added as a nullable column. Rows inserted without this column set (e.g., during onboarding partial failure, seeding, or a bug) have `organization_id = NULL`. RLS policies using `organization_id = current_org_id()` will never match these rows — but they also will not be blocked by policies that only check the positive case. NULL rows become invisible orphans that float outside all tenant boundaries.

**Why it happens:** `ALTER TABLE ... ADD COLUMN organization_id TEXT` without `NOT NULL DEFAULT` is the path of least resistance. Adding a constraint forces either a backfill or a default value.

**Consequences:** Silent data leakage is the worst case (if any permissive policy exists). More likely: orphaned rows that appear in some queries and not others, causing non-deterministic analytics results that are hard to debug and impossible to explain to auditors.

**Evidence in this codebase:** `20260130105000_add_organization_id_columns.sql` adds `organization_id TEXT` (no `NOT NULL`). `CONCERNS.md` flags this directly.

**Prevention:**
- Every tenant-scoped table must have `organization_id TEXT NOT NULL` — enforce this at the schema level
- Add a database constraint: `ALTER TABLE employees ADD CONSTRAINT employees_org_id_not_null CHECK (organization_id IS NOT NULL)`
- RLS policies should include an explicit `organization_id IS NOT NULL` guard
- The canonical schema migration (Phase 1) should define all columns correctly from the start

**Detection:** `SELECT table_name, column_name FROM information_schema.columns WHERE column_name = 'organization_id' AND is_nullable = 'YES'`

**Phase:** Phase 1 (schema rebuild).

---

### Pitfall 4: Pay Gap Calculation Using Annual Salary Instead of Gross Hourly Rate

**What goes wrong:** Gender pay gap is calculated by comparing raw salary figures. The EU directive requires comparing gross hourly rates. A full-time employee earning €60,000/year and a part-time employee earning €30,000/year are not comparable by their salary figures — but if both earn €30/hour, their hourly rates are equal and there is no pay gap for that category.

**Why it happens:** Annual salary is the natural column in the database. Converting to hourly requires hours-worked data, which is often incomplete or not collected. Teams take the shortcut of comparing what is already in the database.

**Consequences:** Incorrect pay gap percentages. Reports submitted to regulatory bodies are wrong. If a gap appears smaller than it is (e.g., because part-time workers who are disproportionately female are excluded or under-weighted), the company has a false sense of compliance. If the gap is overstated, the company may trigger mandatory joint pay assessments unnecessarily.

**Evidence in this codebase:** The existing `pay_groups` / `pay_bands` schema stores salary ranges but there is no `hours_per_week` or `employment_type` normalization column visible in the codebase analysis. This needs to be designed correctly in the schema rebuild.

**Prevention:**
- Data model must include `employment_type` (full-time / part-time / contract) and either `hours_per_week` or a FTE multiplier on every employee record
- Pay gap calculation function must normalize to gross hourly rate before comparison: `annual_salary / (hours_per_week * 52)`
- Both mean and median gap must be calculated — the directive requires both
- Part-time worker hours must never be pro-rated when calculating hourly rates (this would double-count the adjustment)
- Bonus components must be reported separately as a gap figure, and bonuses must be pro-rated to FTE equivalent for the bonus gap calculation

**Detection:** Review the pay gap calculation query — if it divides `SUM(salary)` by employee count without normalizing for hours, it is wrong.

**Phase:** Phase 2 (pay gap analytics core). Must be verified against the directive methodology before implementation.

---

### Pitfall 5: Reporting on Pay Gap Categories Without a Gender-Neutral Job Evaluation Framework

**What goes wrong:** The directive requires reporting the gender pay gap "per category of workers who perform the same work or work of equal value." Companies (and the SaaS tools serving them) define job categories arbitrarily — by job title, by department, by org chart level — without applying the four criteria mandated by Article 4: skills, effort, responsibility, and working conditions.

**Why it happens:** Building a job evaluation framework is an HR discipline problem, not a software problem. Engineers default to whatever categorization is already in the database (job titles, pay bands) rather than building the data model to support a proper evaluation.

**Consequences:** Reports are non-compliant. The categories used do not satisfy the "equal value" standard. Regulators or works councils can challenge the classification methodology, invalidating the entire report. The company is exposed even if the numerical gap calculation is correct.

**Evidence in this codebase:** The existing schema has `job_profiles` and `pay_bands` tables, but there is no indication of a structured job evaluation scoring system using the four Article 4 factors. The schema rebuild needs to design this from scratch.

**Prevention:**
- The `job_profiles` schema must support storing the four evaluation factors (skills, effort, responsibility, working conditions) either as structured scores or as free-text justifications
- Job categories for reporting must be derived from this evaluation, not from job titles
- The UI must guide HR managers to define categories using gender-neutral criteria — not just "copy from org chart"
- Document the classification methodology in the audit log so it is defensible during regulatory review

**Detection:** If job categories in the reporting layer map 1:1 to job titles or departments, the classification methodology is likely non-compliant.

**Phase:** Phase 1 (data model design) and Phase 2 (analytics). The data model must support this before any reporting is built.

---

### Pitfall 6: Disclosing Individual Salary Data in Small Groups

**What goes wrong:** The directive and GDPR both require protecting individual salary information when the comparison group is too small for data to be meaningfully anonymous. If a job category has only 2 women, displaying the "average female salary" in that category effectively discloses both women's salaries.

**Why it happens:** The analytics layer calculates and displays results for all groups regardless of size. The developer assumes the reporting is aggregate and therefore safe.

**Consequences:** GDPR violation. The directive explicitly states that where disclosure would lead to identifying an individual worker's pay, access must be restricted to workers' representatives, the labor inspectorate, or the equality body only. Showing this data to all authenticated users (including employees who can see their own department's breakdown) is a regulatory breach.

**Evidence in this codebase:** The current `pay_groups` analytics hooks fetch and display data without any minimum-group-size guard. This must be built into the analytics layer from the start.

**Prevention:**
- Apply a hard minimum group size of 10 (conservative) or 6 (directive minimum) for any disaggregated figure displayed to employees or HR
- When a group falls below the threshold: suppress the figure, display "N/A — group too small to report", and log the suppression in the audit trail
- This suppression rule must be enforced at the query layer (not the UI layer) so it cannot be bypassed by API calls
- For the compliance report export, suppressed figures must be flagged in the output, not silently omitted

**Detection:** Check if any analytics query lacks a `HAVING COUNT(*) >= [threshold]` guard on gender-disaggregated figures.

**Phase:** Phase 2 (pay gap analytics). Must be built into the calculation layer, not retrofitted.

---

## Moderate Pitfalls

---

### Pitfall 7: Upsert Conflict Target Uses `user_id` Only — Multi-Org Role Corruption

**What goes wrong:** The `user_roles` upsert uses `ON CONFLICT (user_id)` as the conflict target. In a multi-tenant system where one user can be a member of multiple organizations, this upsert silently overwrites the user's role in org A when they are assigned a role in org B.

**Evidence in this codebase:** `hooks/useAuth.tsx` line 199, `app/(app)/onboarding/page.tsx` line 222.

**Consequences:** A user who is `admin` in org A becomes `employee` in org B after onboarding — and the role in org A is now gone. This is a data integrity failure that produces silent RBAC bugs.

**Prevention:**
- The unique constraint on `user_roles` must be `(user_id, organization_id)` — not `user_id` alone
- The upsert conflict target must match: `ON CONFLICT (user_id, organization_id) DO UPDATE SET role = EXCLUDED.role`
- This unique constraint must be added in the canonical schema migration (Phase 1)

**Detection:** Check `pg_indexes` for the constraint on `user_roles`. If only `user_id` appears, the constraint is wrong.

**Phase:** Phase 1 (schema rebuild).

---

### Pitfall 8: Onboarding Partial Failure Leaves Tenant in Broken State

**What goes wrong:** Onboarding creates 6 things in sequence: Logto org, active org cookie, Supabase company record, profile upsert, user role insert, onboarding data save. If step 4 fails, the company record exists in Supabase but the profile does not. The user is now in a state where they have an org in Logto but no usable record in Supabase — and there is no recovery path.

**Evidence in this codebase:** `CONCERNS.md` documents this directly. The onboarding flow has no transaction, no rollback, no retry mechanism.

**Consequences:** Users cannot sign in, cannot use the product, and have no way to self-recover. Support tickets, potential data inconsistency, and risk of orphaned org records.

**Prevention:**
- Move onboarding to a server action that wraps Supabase operations in a database transaction
- Logto org creation (which cannot be transactional with Supabase) must happen last, after the Supabase transaction commits — or use a compensating delete if Supabase fails
- Add idempotency: each step should be safe to re-run (upsert semantics, not insert)
- Store onboarding progress state so partial completions can be resumed

**Detection:** If the onboarding code has sequential `await` calls without a wrapping try-catch-rollback structure, it is fragile.

**Phase:** Phase 1 (foundation cleanup). Broken onboarding blocks all users from reaching the analytics features.

---

### Pitfall 9: `company_id` Trusted from Request Body Instead of Derived from JWT

**What goes wrong:** API routes accept `company_id` from the request body and use it to scope database queries. A malicious user can craft a request with a `company_id` belonging to a different tenant and, if RLS has any permissive policy, access cross-tenant data.

**Evidence in this codebase:** `app/api/pay-equity/simulate/route.ts`, `app/api/pay-equity/update-stats/route.ts`, `app/api/pay-equity/chat/route.ts` all take `company_id` from the request body.

**Consequences:** Cross-tenant data access. Severity is currently mitigated by the fact that the relevant routes are being removed (Gemini AI features are out of scope), but the pattern must not propagate to the new analytics API routes.

**Prevention:**
- Derive `company_id` / `organization_id` server-side from the verified JWT: `const orgId = jwt.payload.org_id`
- Never trust organization-scoping values from request bodies or query params
- For server actions, extract the org identity from the Logto session, not from client-supplied data

**Detection:** Any API route that reads `company_id`, `org_id`, or `organization_id` from `request.json()` rather than from the auth token is vulnerable.

**Phase:** Phase 1 (cleanup of existing API routes) and applies to all new API routes.

---

### Pitfall 10: Audit Log Is Mutable — Compliance Proof Is Undefendable

**What goes wrong:** The `audit_logs` table is a regular database table with no write-protect policies. Rows can be deleted or updated. For regulatory compliance, audit logs must be immutable — regulators and courts treat mutable logs as unreliable.

**Why it happens:** An `audit_logs` table gets created for the feature but RLS is not configured to make it append-only. No thought is given to the immutability requirement.

**Consequences:** An auditor asks for the change history for a specific salary decision. The company cannot prove the log was not retroactively modified. The audit trail provides no legal protection.

**Prevention:**
- RLS on `audit_logs`: `INSERT` is permitted for authenticated users in the correct org; `UPDATE` and `DELETE` must be denied for all users including admins
- Consider using PostgreSQL triggers to prevent UPDATE/DELETE at the database level (more robust than RLS for this use case)
- Include a timestamp, actor, action, and the before/after state in every log entry — not just the fact that something changed

**Detection:** Run `SELECT policyname, cmd FROM pg_policies WHERE tablename = 'audit_logs'`. If UPDATE or DELETE policies exist without a strict deny clause, the log is mutable.

**Phase:** Phase 2 (compliance reporting). Must be established before any pay gap reports are generated.

---

### Pitfall 11: Migration History Is Non-Deterministic — Cannot Reproduce DB State

**What goes wrong:** The migration folder contains ~15 ad-hoc patch files with names like `NUCLEAR_UUID_TO_TEXT_FIX.sql`, `MASTER_RLS_FIX_V2.sql`, `FINAL_DATABASE_FIX.sql`. These have no timestamp prefix and no guaranteed execution order. Some contradict each other (e.g., `switch_to_clerk_auth` enables strict RLS; `FIX_COMPANIES_RLS_INSERT` disables it). Running migrations on a fresh database produces an undefined final state.

**Evidence in this codebase:** `CONCERNS.md` and direct inspection of `supabase/migrations/` — 17 ad-hoc non-timestamped files alongside 13 timestamped migrations.

**Consequences:** Cannot create a staging environment. Cannot onboard a new developer. Cannot restore from backup with confidence. Cannot pass any compliance audit that requires a verifiable schema history.

**Prevention:**
- Write one authoritative migration that reflects the actual current live DB state (reverse-engineered if necessary using `pg_dump --schema-only`)
- Archive or delete all ad-hoc patches from the migration sequence (git history preserves them)
- Enforce a naming convention: all future migrations use ISO timestamps as prefixes
- Never apply migrations directly in production SQL clients without recording them in the migrations folder

**Detection:** Count files in `supabase/migrations/` that lack a timestamp prefix. Any such file is an uncontrolled patch.

**Phase:** Phase 1 (foundation). A non-deterministic schema is a blocker for all subsequent work.

---

## Minor Pitfalls

---

### Pitfall 12: Supabase Types Not Generated — `any` Types Proliferate

**What goes wrong:** Without running `supabase gen types typescript`, all Supabase query results are typed as `any`. Over time, 30+ locations accumulate `as any` casts. Schema changes become invisible to the TypeScript compiler.

**Evidence in this codebase:** `CONCERNS.md` documents 30+ `as any` locations.

**Prevention:** Run `supabase gen types typescript --local > lib/supabase/types.ts` after every schema change. Add this to the dev workflow documentation.

**Phase:** Phase 1 (after canonical schema is written).

---

### Pitfall 13: Reporting Thresholds Hardcoded Instead of Driven by Directive

**What goes wrong:** The EU directive has specific employee count thresholds (100-149: triennial, 150-249: triennial, 250+: annual) and reporting start dates (2027, 2031). Hardcoding UI visibility or feature flags without mapping to these thresholds means the product either shows features to companies that are not yet required to report, or hides them from companies that are.

**Why it happens:** The threshold logic is a business rule that gets implemented as a magic number in a conditional.

**Consequences:** Incorrect compliance guidance. A company with 120 employees gets told it must report annually when it only needs to report every three years. Trust in the product as a compliance tool is undermined.

**Prevention:**
- Model the company's employee count in the database and derive reporting obligations from it
- Document the directive thresholds as named constants in code, not inline magic numbers
- The reporting schedule and frequency must be visible to HR admins in the dashboard

**Phase:** Phase 3 (compliance reports).

---

### Pitfall 14: Middleware Only Protects `app.` Subdomain — Open in Development

**What goes wrong:** `middleware.ts` gates auth enforcement on `hostname.startsWith('app.')`. On `localhost`, no auth is enforced. Developers access the full dashboard without signing in, which masks auth-dependent bugs and creates accidental data exposure during demos.

**Evidence in this codebase:** `CONCERNS.md` documents this directly.

**Prevention:** Explicitly document the local development bypass. Add a visible warning banner in dev mode when auth is bypassed. Ensure all new features are tested with auth enabled, not just in the open localhost mode.

**Phase:** Phase 1 (foundation). Low effort fix with high safety value.

---

### Pitfall 15: Token Fetch on Every Supabase Request Without Caching

**What goes wrong:** The authenticated Supabase client fetches a Logto organization token from `/api/auth/organization-token` on every Supabase HTTP request. If this endpoint is slow or returns an error, the catch block returns `null`, causing the Supabase client to send unauthenticated requests that either fail RLS or hit permissive policies.

**Evidence in this codebase:** `CONCERNS.md` documents this in the fragile areas section.

**Consequences:** Intermittent authentication failures on slow networks. Silent data access degradation that is hard to reproduce and diagnose.

**Prevention:**
- Cache the token in memory with a TTL slightly shorter than the token's expiry (e.g., 50 minutes for a 60-minute token)
- Log and surface errors when `getOrganizationToken` fails — do not silently return null
- The Supabase client should throw (not silently degrade) when no auth token is available

**Phase:** Phase 1 (auth integration). Part of the Logto + Supabase client setup.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Schema rebuild | `auth.uid()` in RLS policies won't work with Logto | Verify exact JWT claim names with a real Logto token before writing any policy |
| Schema rebuild | Nullable `organization_id` columns | Define all org-scoped columns as `NOT NULL` in the canonical migration |
| Schema rebuild | Migration order non-determinism | One migration file, archive all ad-hoc patches |
| Schema rebuild | `user_roles` conflict target is wrong | Add `UNIQUE(user_id, organization_id)` constraint |
| Pay gap analytics | Salary comparison without hourly normalization | Require `hours_per_week` on employee records; normalize before calculation |
| Pay gap analytics | Job categories not compliant with Article 4 | Data model must support four-factor job evaluation |
| Pay gap analytics | Small group disclosure | Enforce `HAVING COUNT(*) >= 10` on all disaggregated figures |
| Pay gap analytics | Mutable audit log | RLS must deny UPDATE/DELETE on `audit_logs` |
| Compliance reports | Reporting thresholds hardcoded | Model company size, derive obligations from directive constants |
| Compliance reports | Anonymization not applied to exports | Suppress or flag figures below minimum group size in PDF/CSV output |
| All API routes | `company_id` trusted from client | Always derive org identity from verified JWT server-side |

---

## Sources

- EUR-Lex Directive 2023/970 full text: https://eur-lex.europa.eu/eli/dir/2023/970/oj/eng
- Littler: Implementation challenges and status across member states: https://www.littler.com/news-analysis/asap/european-pay-transparency-directive-implementation-challenges-status-and-risks
- Lewis Silkin: Job evaluation, classification, and the Pay Transparency Directive: https://www.lewissilkin.com/insights/2025/11/12/job-evaluation-classification-and-the-pay-transparency-directivewhat-you-need-to-know
- Figures.hr: Official gender pay gap calculation formula and methodology: https://figures.hr/post/gender-pay-gap-calculation-formula
- PayGap.com: EU Directive 2023/970 technical reporting requirements: https://www.paygap.com/articles/understanding-eu-directive-2023-970
- Gibson Dunn: Key challenges and risks for EU-based employers: https://www.gibsondunn.com/eu-directive-on-pay-transparency-key-challenges-and-risks-for-companies-with-eu-based-employees/
- Supabase RLS documentation: https://supabase.com/docs/guides/database/postgres/row-level-security
- Sysarb: Complete guide to gender pay gap reporting in the EU: https://resources.sysarb.com/buyers-guides/the-complete-guide-to-gender-pay-gap-reporting-in-the-eu
- IusLaboris: Pay transparency vs pay privacy: https://iuslaboris.com/insights/pay-transparency-vs-pay-privacy-how-to-succeed-in-both/
- KlarGehalt codebase: `.planning/codebase/CONCERNS.md` (2026-03-19)
