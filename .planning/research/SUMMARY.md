# Project Research Summary

**Project:** KlarGehalt — EU Pay Transparency Compliance SaaS
**Domain:** B2B SaaS, regulatory compliance, HR analytics
**Researched:** 2026-03-19
**Confidence:** HIGH

## Executive Summary

KlarGehalt is a compliance SaaS for the EU Pay Transparency Directive 2023/970, targeting German companies with 100–500 employees. The directive is not aspirational — it is a legal mandate with statutory deadlines (250+ employee companies must file by June 2027; 100–249 employee companies by 2031). The product's core value is enabling HR managers to compute the seven mandated gender pay gap indicators, export compliant reports, and maintain a defensible audit trail. The current codebase has a working Next.js 15 + Supabase front-end but the database schema and RLS policies are in a broken state: permissive `USING (true)` policies expose all salary data cross-tenant, `organization_id` columns are nullable, and `auth.uid()` is used in policies that will never match Logto JWTs. None of the analytics features can be built correctly on this foundation.

The recommended approach is to treat Phase 1 as a complete schema rebuild — one authoritative migration replacing 17+ ad-hoc patch files — before writing any application code. The data model must anchor around `job_profiles` as the "work of equal value" grouping (Article 4.4), with `employees` holding normalized compensation data including `weekly_hours` for hourly-rate calculation. All gap statistics must be pre-computed as PostgreSQL aggregates and stored in `pay_gap_snapshots`; the application layer reads snapshots, never individual salary rows. The tech additions are minimal: `simple-statistics` for gap calculations, `@react-pdf/renderer` for PDF export, `papaparse` for CSV import, and a JWT exchange pattern for Logto-to-Supabase token bridging.

The central risk is regulatory non-compliance masquerading as working software. Three failure modes recur across all four research dimensions: (1) RLS policies that look correct but silently open to all tenants, (2) gap calculations that use annual salary instead of gross hourly rate producing wrong percentages, and (3) job categories defined by job titles rather than the directive's four-factor equal-value evaluation, making every report legally challengeable. Each of these produces incorrect output without surfacing a visible error.

---

## Stack Recommendations

See full details in [STACK.md](.planning/research/STACK.md).

The existing stack (Next.js 15, TypeScript, Supabase JS, TanStack Query, Recharts, shadcn/ui) is locked and correct. Four additions are needed for the business logic milestone:

**New dependencies to add:**

- `simple-statistics` v7.8.8 — mean/median/quantile primitives for gap calculation. Zero-dependency, isomorphic, TypeScript-typed. No specialized pay-gap library exists in the JS ecosystem; the math is simple enough not to need one.
- `@react-pdf/renderer` v4.3.2 — server-side PDF generation via `renderToStream()` in Next.js Route Handlers. The only React-ecosystem PDF library with reliable, documented server-side support. Requires `serverExternalPackages: ['@react-pdf/renderer']` in `next.config.ts`.
- `papaparse` v5.x — browser CSV parsing for HR manager data imports. Handles encoding edge cases, BOM characters, and delimiter detection that hand-rolled parsers miss.
- Native `Response` API — CSV export needs no library. 15 lines of TypeScript is sufficient for datasets of hundreds to low thousands of rows.

**Dependencies to remove:** `@google/generative-ai` (AI features are out of scope) and `svix` (was for Clerk webhooks; Clerk is gone).

**No library needed:** The Logto-to-Supabase JWT exchange is a Route Handler pattern, not a library. Logto issues a JWT; a Next.js endpoint validates it via Logto's JWKS, then mints a Supabase-signed JWT embedding `organization_id` and `user_role` claims. Confidence on the exact Logto custom claims configuration is MEDIUM — needs validation against a real Logto token.

---

## Table Stakes Features

See full details in [FEATURES.md](.planning/research/FEATURES.md).

The directive mandates seven specific data indicators (Article 9). Without correct calculation of all seven, the product provides no compliance value:

**Must have (table stakes):**

1. **Gender Pay Gap Calculation Engine** — all 7 statutory Article 9 indicators: mean and median gap for base salary and variable pay, proportion receiving variable pay per gender, quartile distribution (lower/lower-middle/upper-middle/upper quartile by gender)
2. **Employee Records Management** — name, gender, job profile assignment, employment type, hire date, base salary, variable pay, weekly hours. Foundation layer; nothing else works without this.
3. **Job Category Architecture (Work of Equal Value)** — the hardest compliance piece. Job categories must be defined using Article 4.4 criteria (skills, effort, responsibility, working conditions) — not job titles, not departments. Market-rate groupings are explicitly non-compliant.
4. **Pay Quartile Distribution Analysis** — Article 9 indicator (f); gender % per quartile visualized
5. **Role-Appropriate Access Control** — HR/admin: full data; employee: own pay band + anonymized category averages; executive: aggregate KPIs only. Must be enforced at RLS level, not UI level.
6. **Compliance Report Export** — CSV of all 7 indicators (minimum viable); PDF summary report
7. **Audit Log** — immutable append-only record of salary changes, report generation, Art. 7 fulfillments

**Should have (competitive differentiators):**

- 5% gap alert and joint pay assessment tracker (Art. 10 trigger — proactive alerting before legal obligation kicks in)
- Pay band compliance checker with shareable salary range URL (Art. 5 job posting obligation)
- Remediation cost simulator ("close the gap to 0%" with annual cost estimate — PayAnalytics' core differentiator)
- Multi-year trend tracking (annual reporters need year-over-year comparison)
- Department/business unit segmentation filter

**Defer to v2+:**

- Article 7 employee information request workflow (valuable but manual process works initially)
- PDF export (CSV satisfies the directive; PDF is polish)
- HRIS/payroll integrations (SAP, Workday) — CSV import satisfies v1
- ATS integration for Art. 5 salary range disclosure — shareable URL is sufficient
- Adjusted pay gap (OLS regression / Blinder-Oaxaca) — v1 requires only unadjusted gap

**Anti-features (do not build):**

- AI pay gap explanations — hallucination risk on compliance-sensitive outputs; replace with structured dropdown justification templates
- Market salary benchmarking — the directive explicitly rejects market rates as justification for gaps
- Mobile app — out of scope per PROJECT.md

---

## Architecture Highlights

See full details in [ARCHITECTURE.md](.planning/research/ARCHITECTURE.md).

The architecture is a layered PostgreSQL-first design. All gap calculations run as PostgreSQL window functions (`PERCENTILE_CONT`, `NTILE(4)`) inside a `refresh_pay_gap_snapshots()` function. Results are stored in `pay_gap_snapshots`. Application hooks read only from snapshots — never from raw employee salary data. This is not just a performance pattern; it is a security pattern: employee-role users must never see individual salary rows.

**Major data model components:**

1. `organizations` — thin mapping of Logto org ID to company metadata; the RLS anchor for every query
2. `job_profiles` + `job_levels` — the "work of equal value" grouping axis; stores Article 4.4 scores (skills/effort/responsibility/working conditions) for audit defensibility
3. `employees` — source of truth for gap calculations; includes `gender NOT NULL`, `base_salary`, `variable_pay`, `weekly_hours` (for hourly normalization), and FKs to `job_profile_id`, `job_level_id`, `department_id` (all UUIDs, no free-text)
4. `salary_history` — immutable append-only table; every salary change appends a row; the `employees` table holds current snapshot only
5. `pay_gap_snapshots` — pre-computed stats for all 7 Article 9 indicators, scoped by company/department/job profile/job level, with `gap_status` ('compliant'/'warning'/'breach') and `requires_joint_assessment` flag
6. `compliance_reports` — generated report artifacts with status workflow (draft → finalized → submitted)
7. `audit_logs` — append-only, RLS must deny UPDATE/DELETE for all users including admins

**Key calculation patterns:**

- Gap formula: `(male_median - female_median) / male_median * 100`
- Quartile distribution: `NTILE(4) OVER (ORDER BY base_salary)` then count gender per bucket
- Hourly normalization: `base_salary / (weekly_hours * 52)` — required when workforce includes part-time employees
- Data suppression: groups with fewer than 10 employees (conservative; directive minimum is 6) must be suppressed and logged, not silently omitted

**Data flow (strict, no bypasses):**

```
employees table → refresh_pay_gap_snapshots() → pay_gap_snapshots → hooks → Recharts UI
```

Employee-role users query `pay_gap_snapshots` for aggregates and `pay_bands` for salary ranges — never the `employees` table directly.

---

## Critical Pitfalls

See full details in [PITFALLS.md](.planning/research/PITFALLS.md).

**All six critical pitfalls have direct evidence in the current codebase. None are hypothetical.**

1. **RLS opened wide and never closed** — `USING (true)` policies exist on `companies`, `employees`, `job_profiles`, `pay_groups`, `profiles`, `user_roles`, `onboarding_data`. Any authenticated user can read all salary data for all tenants. Must be the first thing fixed; all other work is meaningless until this is resolved.

2. **`auth.uid()` is ineffective with Logto** — Supabase's `auth.uid()` returns NULL when the JWT is issued by an external IdP. Every RLS policy using it either silently opens (if a permissive fallback exists) or silently closes (blocks all access). The current migration was written for Clerk and is doubly wrong for Logto. All policies must use `auth.jwt() ->> 'sub'` for user identity and `auth.jwt() ->> 'org_id'` for tenant isolation (exact claim name must be verified against a real Logto token).

3. **Nullable `organization_id` columns** — `organization_id TEXT` with no `NOT NULL` constraint. NULL rows are invisible to correctly-written RLS policies but not blocked by permissive ones — creating orphaned data that bleeds across tenants. Every org-scoped column must be `TEXT NOT NULL`.

4. **Pay gap calculated using annual salary, not gross hourly rate** — the directive requires comparing gross hourly rates. Comparing annual salaries across a workforce with full-time and part-time employees produces incorrect gap percentages. The current schema has no `hours_per_week` or `employment_type` normalization. This produces wrong numbers that can trigger incorrect joint assessment obligations or mask real gaps.

5. **Job categories defined by job titles, not Article 4.4 criteria** — if gap calculations group employees by job title or department rather than by a documented skills/effort/responsibility/working conditions evaluation, every report is legally non-compliant regardless of how correct the math is. The schema must store the four evaluation scores per job profile.

6. **Small group disclosure** — displaying disaggregated salary statistics for groups below ~10 employees violates GDPR and the directive's anonymization requirements. Must be enforced at the query layer (`HAVING COUNT(*) >= 10` on all gender-disaggregated figures), not in the UI.

**Additional pitfalls requiring Phase 1 attention:**

- `user_roles` upsert conflict target is `(user_id)` only — overwrites roles across orgs in a multi-tenant system; must be `(user_id, organization_id)`
- 17 ad-hoc non-timestamped migration files create a non-deterministic schema; a fresh database cannot be reproduced; `NUCLEAR_*`, `MASTER_*`, `FINAL_*` files must be consolidated into one authoritative migration
- `company_id` / `organization_id` accepted from request bodies in existing API routes — must always be derived from verified JWT server-side
- Audit log is mutable — RLS must deny UPDATE and DELETE on `audit_logs` for all users

---

## Cross-Cutting Themes

Three themes appear across all four research dimensions and should directly shape how the roadmap is structured:

**1. Schema correctness is a prerequisite for everything.**
FEATURES.md says every feature depends on correct employee and job category data. ARCHITECTURE.md says the entire calculation pipeline rests on a correctly structured schema. PITFALLS.md identifies six critical flaws in the current schema. STACK.md notes the JWT exchange pattern cannot be validated without a correct RLS setup. Phase 1 must be a complete, uncompromising schema rebuild — not an incremental fix on top of the existing broken state.

**2. Compliance correctness cannot be retrofitted.**
The pay gap calculation methodology (hourly normalization), the job category framework (Article 4.4 criteria), and the data suppression rules (groups < 10) must be designed into the data model from the start. Retrofitting these after analytics are built means rewriting the calculation layer, migrating existing snapshot data, and regenerating any reports already produced. All three of these must be designed correctly in Phase 1, even though they are "analytics" concerns.

**3. Security is layered: JWT → RLS → query → UI.**
STACK.md describes the JWT exchange pattern. ARCHITECTURE.md defines the RLS strategy. PITFALLS.md identifies where each layer is currently broken. The correct mental model is defense-in-depth: JWT validation in middleware, RLS enforcement in PostgreSQL, suppression rules in query functions, and role gating in the UI. Any shortcut at any layer creates a compliance breach. The roadmap must explicitly address each layer.

---

## Recommended Phase Order

The phase order follows strict dependency chains identified across all four research files. Each phase is a pre-requisite for the next; parallelism is not possible.

### Phase 1: Schema Rebuild and Auth Foundation
**Rationale:** Every other phase depends on a correct database schema and working RLS. The current state is not a starting point — it is a liability. This must be completed before any application code is written or modified.
**Delivers:** One authoritative migration replacing all ad-hoc patch files; correct RLS policies using Logto JWT claims; all `organization_id` columns as `NOT NULL`; `user_roles` unique constraint on `(user_id, organization_id)`; Logto JWT exchange pattern working with Supabase; Supabase types generated; demo org with realistic seed data
**Addresses:** Employee records foundation, RBAC enforcement
**Avoids:** Pitfalls 1–3 (RLS opened wide, `auth.uid()` with Logto, nullable org IDs), Pitfall 7 (role corruption), Pitfall 11 (non-deterministic migrations), Pitfall 15 (token caching)
**Research flag:** Needs validation — verify exact Logto JWT claim names (`org_id` vs `organization_id`) against a real Logto token before writing any RLS policy

### Phase 2: Data Management UI
**Rationale:** HR managers need to create and maintain job profiles, pay bands, and employee records before any analytics are possible. The data entry layer must exist before the calculation layer.
**Delivers:** CRUD for `job_profiles` (with Article 4.4 scores), `job_levels`, `departments`, `pay_bands`, and `employees`; CSV import with column mapping and validation; employee list and edit views
**Addresses:** Employee records management, job category architecture, pay band compliance (Art. 5)
**Uses:** `papaparse` for CSV import
**Avoids:** Pitfall 5 (job categories by title — the UI must guide users to use the four-factor evaluation), Pitfall 4 (no hours data — `weekly_hours` and `employment_type` collected at employee creation)
**Research flag:** Standard patterns — CRUD with TanStack Query and Supabase is well-documented in the existing codebase

### Phase 3: Pay Gap Analytics Engine
**Rationale:** Once data exists, the calculation pipeline can be built. PostgreSQL-first design means the hard work is in database functions, not application code.
**Delivers:** `refresh_pay_gap_snapshots()` PostgreSQL function computing all 7 Article 9 indicators; data suppression (groups < 10 return NULL); `gap_status` and `requires_joint_assessment` flags; `/api/pay-gap/recalculate` Route Handler; `usePayGap` hook; gap dashboard with Recharts (mean, median, quartile distribution)
**Addresses:** Gender pay gap calculation engine, pay quartile distribution, 5% gap alert
**Uses:** `simple-statistics` for any JS-side verification; PostgreSQL `PERCENTILE_CONT` and `NTILE(4)` for server-side computation
**Avoids:** Pitfall 4 (hourly normalization built into PostgreSQL function from day one), Pitfall 6 (suppression enforced at query layer)
**Research flag:** Standard patterns for PostgreSQL window functions; suppression threshold (6 vs 10 employees) should be verified against German transposition of the directive

### Phase 4: Role-Appropriate Views
**Rationale:** With analytics available, different user roles need different views. This phase does not add new data capabilities — it gates existing ones correctly.
**Delivers:** HR/admin view (full gap dashboard, employee management, job profile management); employee view (own pay band, category average anonymized, Art. 7 information request); executive view (summary KPIs, compliance status, `gap_status` indicators)
**Addresses:** Role-appropriate access control, Article 7 employee information right
**Uses:** Existing `RoleGuard` and `useRoleAccess` patterns from codebase
**Avoids:** Pitfall 6 (salary data never reaches employee-role users — they query `pay_gap_snapshots` and `pay_bands` only)
**Research flag:** Standard patterns — existing RBAC infrastructure is sound

### Phase 5: Compliance Reports and Audit Hardening
**Rationale:** Reports are the deliverable users submit to regulatory bodies. Audit hardening makes those reports defensible. These belong together because they share the concept of finalized, immutable compliance artifacts.
**Delivers:** PDF compliance report export (`@react-pdf/renderer`); CSV export (native Response API); `compliance_reports` table with draft → finalized → submitted workflow; immutable `audit_logs` (RLS deny UPDATE/DELETE); timestamped report generation; reporting frequency logic driven by `companies.employee_size_band`
**Addresses:** Compliance report export, audit log, multi-year trend tracking setup
**Uses:** `@react-pdf/renderer` v4.3.2 with `serverExternalPackages` in `next.config.ts`
**Avoids:** Pitfall 10 (mutable audit log), Pitfall 13 (hardcoded reporting thresholds)
**Research flag:** Standard patterns for PDF generation — confirmed working with Next.js 15 Route Handlers

### Phase 6: Differentiators
**Rationale:** Product value beyond MVP. These features require working analytics (Phase 3) and clean data (Phase 2) as preconditions. They should not be planned until the compliance foundation is solid.
**Delivers:** Remediation cost simulator; 5% gap joint assessment action tracker with justification workflow; department segmentation cross-tab; shareable pay band URL for job postings
**Addresses:** Differentiators from FEATURES.md — remediation simulator, pay band compliance checker, department segmentation
**Research flag:** Remediation simulator needs deeper planning — the UX for "what-if" scenarios requires iteration

### Phase Ordering Rationale

- Phase 1 before everything: the schema is the security boundary; broken RLS makes all data unsafe
- Phase 2 before Phase 3: you cannot calculate gaps without data; data entry must exist before analytics
- Phase 3 before Phase 4: role-differentiated views require analytics to exist; no sense building role gates around empty dashboards
- Phase 4 before Phase 5: reports should reflect finalized, reviewed analytics views
- Phase 5 before Phase 6: compliance features are the core product; differentiators are built on top

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All libraries verified against npm, official docs, and EU directive requirements. One MEDIUM item: Logto JWT custom claims configuration needs validation against real token. |
| Features | HIGH | Based on official EU Directive 2023/970 full text from EUR-Lex, plus competitor analysis (PayAnalytics, Sysarb). Statutory indicators are precisely specified in Article 9. |
| Architecture | HIGH | Data model derived from directive text, existing codebase analysis, and verified PostgreSQL calculation methodology. All anti-patterns identified from concrete codebase evidence. |
| Pitfalls | HIGH | All critical pitfalls have direct evidence in the codebase (confirmed by CONCERNS.md and migration file inspection). No hypothetical risks — every pitfall is already present. |

**Overall confidence:** HIGH

### Gaps to Address

- **Logto JWT claim names:** The exact claim name for organization ID in Logto-issued tokens (`org_id` vs `organization_id` vs custom claim) must be verified against a real Logto token before writing any RLS policy. This is the single biggest unknown. Assumption used throughout: `auth.jwt() ->> 'org_id'`.
- **German transposition threshold:** The directive states a minimum group size of 6 for anonymization. Germany may set a stricter threshold in its national transposition law. Research used a conservative value of 10. Validate against the German transposition bill before finalizing the suppression rule.
- **Logto organization membership model:** Whether a user can belong to multiple Logto organizations simultaneously (and thus need multi-org support) was not verified. The schema is designed to support it (`user_roles` unique on `(user_id, organization_id)`) but the Logto-side configuration is outside this codebase.
- **Adjusted gap calculation:** The unadjusted gap (> 5% threshold triggering joint assessment) is the directive's primary actionable metric. Adjusted gap (OLS regression controlling for tenure, performance, location) is a v2 feature. The schema does not currently store the variables needed for adjusted calculation — this is intentional for v1.

---

## Sources

### Primary (HIGH confidence)
- EU Directive 2023/970 full text — https://eur-lex.europa.eu/eli/dir/2023/970/oj/eng — all statutory indicators, thresholds, and Article citations
- Supabase RLS documentation — https://supabase.com/docs/guides/database/postgres/row-level-security — RLS policy patterns
- Supabase third-party auth — https://supabase.com/docs/guides/auth/third-party/overview — JWT exchange pattern
- simple-statistics docs — https://simple-statistics.github.io/docs/ — confirmed API
- @react-pdf/renderer npm — https://www.npmjs.com/package/@react-pdf/renderer — v4.3.2, React 19 support
- KlarGehalt codebase CONCERNS.md — direct evidence for all critical pitfalls

### Secondary (MEDIUM confidence)
- Ravio — EU pay transparency guide — https://ravio.com/blog/everything-you-need-to-know-about-the-eu-pay-transparency-directive — reporting deadlines, Article obligations
- Ravio — Gap calculation methodology — https://ravio.com/blog/gender-pay-gap-calculations-median-vs-mean-adjusted-vs-unadjusted — median vs mean, adjusted vs unadjusted
- PayGap.com — adjusted gap methodology — https://www.paygap.com/articles/regression-analysis-and-adjusted-pay-gaps-in-pay-equity-audits-an-eu-pay-transparency-guide — 5% threshold confirmation
- Logto + Supabase integration — https://docs.logto.io/quick-starts/supabase — JWT exchange pattern
- Authgear JWT exchange pattern — https://www.authgear.com/post/supabase-any-auth-provider — confirmed for any OIDC provider
- @react-pdf/renderer comparison (2025) — https://dmitriiboikov.com/posts/2025/01/pdf-generation-comarison/ — confirmed server-side support in Next.js 15
- Lewis Silkin — job evaluation and the directive — https://www.lewissilkin.com/insights/2025/11/12/job-evaluation-classification-and-the-pay-transparency-directivewhat-you-need-to-know — Article 4.4 criteria

### Tertiary (verification recommended)
- Gibson Dunn — key challenges for EU employers — https://www.gibsondunn.com/eu-directive-on-pay-transparency-key-challenges-and-risks-for-companies-with-eu-based-employees/ — small group anonymization thresholds
- IusLaboris — pay transparency vs pay privacy — https://iuslaboris.com/insights/pay-transparency-vs-pay-privacy-how-to-succeed-in-both/ — suppression rules

---

*Research completed: 2026-03-19*
*Ready for roadmap: yes*
