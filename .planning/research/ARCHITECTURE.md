# Architecture Patterns: Pay Transparency Compliance SaaS

**Domain:** B2B SaaS — EU pay transparency compliance (Directive 2023/970)
**Researched:** 2026-03-19
**Overall confidence:** HIGH (based on official EU directive text, existing codebase analysis, and verified calculation methodology)

---

## Recommended Architecture

### Layer Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  UI Layer (React components, shadcn/ui)                         │
│  dashboard/page.tsx  ← view-switching SPA shell                 │
│  components/dashboard/  ←  HR views, analytics, reports        │
├─────────────────────────────────────────────────────────────────┤
│  Hooks Layer (TanStack Query + Supabase)                        │
│  useEmployees · useJobProfiles · usePayBands                    │
│  usePayGap · useQuartiles · useComplianceReport                 │
├─────────────────────────────────────────────────────────────────┤
│  API Routes (Next.js Route Handlers)                            │
│  /api/reports/generate  ← server-side PDF/CSV export           │
│  /api/pay-gap/recalculate  ← trigger stats refresh             │
├─────────────────────────────────────────────────────────────────┤
│  Data Access Layer (Supabase Postgres + RLS)                    │
│  organization_id TEXT in every table → Logto JWT → RLS         │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL Functions                                            │
│  calculate_gender_pay_gap()  ·  build_quartile_bands()         │
│  generate_compliance_report()  ·  get_safe_salary_stats()      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model Design

### Core Design Principle

The EU directive requires reporting at the **"work category" level** — groups of employees doing work of equal value, assessed by skills, effort, responsibility, and working conditions (Article 4.4). This maps cleanly to: `job_profiles` (the role definition) + `pay_bands` (the salary structure for that role). Employees are assigned to a job profile and pay band; the analytics layer groups by these for gap calculations.

**Tenant isolation:** Every table below has `organization_id TEXT NOT NULL`. RLS policies use `auth.get_user_org_id()` to enforce this. No nullable `organization_id` columns — that was the root cause of the current broken state.

---

### Table: `organizations`

Thin mapping table linking a Logto `organization_id` to company metadata already in `companies`. Allows RLS function to resolve org without a join on every query.

```
organizations
  id              TEXT PK  (= Logto org ID, e.g. "org_abc123")
  company_name    TEXT NOT NULL
  country         TEXT NOT NULL DEFAULT 'DE'
  employee_count  INTEGER
  reporting_year  INTEGER   -- active reporting cycle
  created_at      TIMESTAMPTZ
```

**Why:** RLS policies must resolve org membership in a single fast lookup. Joining `companies` every time is fragile and slow.

---

### Table: `companies`

Keep for company metadata (legal name, address, country, industry). Add `organization_id TEXT NOT NULL UNIQUE` — this is the FK from Logto.

```
companies
  id                UUID PK
  organization_id   TEXT NOT NULL UNIQUE  -- Logto org ID
  name              TEXT NOT NULL
  legal_name        TEXT
  country           TEXT DEFAULT 'DE'
  industry          TEXT
  employee_size_band TEXT   -- '100-149','150-249','250+'  (drives reporting frequency)
  reporting_frequency TEXT  -- 'annual','triennial'
  created_at        TIMESTAMPTZ
  updated_at        TIMESTAMPTZ
```

**Why `employee_size_band`:** The directive has different obligations by size (250+ annual, 100–249 triennial). This field drives when the compliance clock starts.

---

### Table: `departments`

Explicit department table instead of a free-text `department` column on employees. Required for EU reporting breakdowns.

```
departments
  id               UUID PK
  organization_id  TEXT NOT NULL
  name             TEXT NOT NULL
  parent_id        UUID REFERENCES departments(id)  -- for org hierarchy
  created_at       TIMESTAMPTZ
  UNIQUE(organization_id, name)
```

**Why:** The directive mandates department-level gap reporting. A free-text column on `employees` cannot be grouped reliably (typos, inconsistent casing). An explicit table enforces canonical values.

---

### Table: `job_profiles`

The "work category" anchor for EU directive compliance. Groups of employees in the same job profile performing work of equal value must be gap-analyzed together.

```
job_profiles
  id               UUID PK
  organization_id  TEXT NOT NULL
  title            TEXT NOT NULL
  description      TEXT
  department_id    UUID REFERENCES departments(id)
  -- EU Article 4.4 evaluation criteria (stored for audit)
  skills_score     INTEGER CHECK (skills_score BETWEEN 1 AND 5)
  effort_score     INTEGER CHECK (effort_score BETWEEN 1 AND 5)
  responsibility_score INTEGER CHECK (responsibility_score BETWEEN 1 AND 5)
  working_conditions_score INTEGER CHECK (working_conditions_score BETWEEN 1 AND 5)
  is_active        BOOLEAN DEFAULT true
  created_at       TIMESTAMPTZ
  updated_at       TIMESTAMPTZ
```

**Why the scores:** The directive requires employers to document *why* jobs are of equal value. These four criteria (Article 4.4) must be recorded and available for a joint pay assessment if the 5% gap threshold is breached.

---

### Table: `job_levels`

Separate enumeration of levels, replacing the free-text `level` column. Used as the second axis of work-category grouping.

```
job_levels
  id               UUID PK
  organization_id  TEXT NOT NULL
  name             TEXT NOT NULL  -- 'Junior', 'Mid', 'Senior', 'Lead', 'Director'
  rank             INTEGER NOT NULL  -- sort order for display
  UNIQUE(organization_id, name)
```

**Why separate:** Levels are referenced by both `job_profiles` and `pay_bands`. A free-text string on employees creates mismatches. A foreign key enforces consistency.

---

### Table: `pay_bands`

Salary range for a specific job profile + level combination. This is what gets published to employees as the transparent salary range (EU directive Article 5 — job posting obligation).

```
pay_bands
  id               UUID PK
  organization_id  TEXT NOT NULL
  job_profile_id   UUID NOT NULL REFERENCES job_profiles(id)
  job_level_id     UUID NOT NULL REFERENCES job_levels(id)
  min_salary       NUMERIC(12,2) NOT NULL
  max_salary       NUMERIC(12,2) NOT NULL
  currency         TEXT DEFAULT 'EUR'
  is_active        BOOLEAN DEFAULT true
  effective_from   DATE NOT NULL
  effective_to     DATE   -- NULL = currently active
  created_at       TIMESTAMPTZ
  updated_at       TIMESTAMPTZ
  CHECK (max_salary >= min_salary)
  UNIQUE(organization_id, job_profile_id, job_level_id, effective_from)
```

**Why `effective_from/to`:** Salary bands change over time. Historical bands are needed to reconstruct what a pay band was in a prior reporting period — required for multi-year trend reports.

---

### Table: `employees`

The critical source-of-truth table for all gap calculations. Every column needed for EU directive reporting must be here, non-nullable where the directive requires it.

```
employees
  id                UUID PK
  organization_id   TEXT NOT NULL
  employee_number   TEXT
  -- Identity (anonymized in reports — never exposed in aggregate queries if group < 5)
  first_name        TEXT NOT NULL
  last_name         TEXT NOT NULL
  email             TEXT
  gender            TEXT NOT NULL CHECK (gender IN ('male','female','diverse','not_specified'))
  birth_year        INTEGER  -- year only, not full date (data minimization)
  -- Employment classification
  job_profile_id    UUID NOT NULL REFERENCES job_profiles(id)
  job_level_id      UUID NOT NULL REFERENCES job_levels(id)
  department_id     UUID NOT NULL REFERENCES departments(id)
  employment_type   TEXT NOT NULL CHECK (employment_type IN ('full_time','part_time','contract'))
  location          TEXT NOT NULL  -- city/site; used as pay group dimension
  hire_date         DATE NOT NULL
  -- Compensation (hourly rate is EU standard for gap calculation)
  base_salary       NUMERIC(12,2) NOT NULL   -- annual gross
  variable_pay      NUMERIC(12,2) DEFAULT 0  -- annual, all bonus/commission/LTI
  weekly_hours      NUMERIC(5,2) DEFAULT 40  -- for hourly rate normalization
  currency          TEXT DEFAULT 'EUR'
  -- Pay band assignment
  pay_band_id       UUID REFERENCES pay_bands(id)
  -- Leave tracking (directive Article 9: raises after leave)
  on_leave          BOOLEAN DEFAULT false
  leave_type        TEXT CHECK (leave_type IN ('maternity','paternity','parental','carer',NULL))
  leave_start       DATE
  leave_end         DATE
  -- Linkage
  user_id           TEXT  -- Logto user ID (nullable: some employees have no portal access)
  is_active         BOOLEAN DEFAULT true
  created_by        TEXT NOT NULL  -- Logto user ID
  created_at        TIMESTAMPTZ
  updated_at        TIMESTAMPTZ
```

**Key decisions:**
- `gender` is NOT NULL with a constrained enum. EU reports require every employee to be classified. `not_specified` is the fallback but must be explicit.
- `base_salary` and `variable_pay` are separate columns, matching EU directive which requires reporting the gap in base salary AND variable pay independently (Article 9).
- `birth_year` instead of `birth_date` — data minimization principle; age bands are sufficient for reporting.
- `weekly_hours` enables normalization to hourly rates when comparing full-time and part-time workers.

---

### Table: `salary_history`

Immutable append-only log of every salary change per employee. Enables trend analysis across reporting periods and satisfies audit requirements.

```
salary_history
  id               UUID PK
  organization_id  TEXT NOT NULL
  employee_id      UUID NOT NULL REFERENCES employees(id)
  base_salary      NUMERIC(12,2) NOT NULL
  variable_pay     NUMERIC(12,2) DEFAULT 0
  effective_date   DATE NOT NULL
  change_reason    TEXT  -- 'promotion','annual_review','correction','hire','leave_return'
  changed_by       TEXT NOT NULL  -- Logto user ID
  created_at       TIMESTAMPTZ
```

**Why separate from employees:** Never delete or overwrite salary data. The directive mandates multi-year comparisons and the ability to reconstruct what an employee was paid in a given period. The `employees` table holds the current snapshot; `salary_history` holds the time series.

---

### Table: `pay_gap_snapshots`

Pre-computed pay gap statistics, refreshed on demand or on schedule. Avoids re-running expensive percentile calculations on every dashboard load.

```
pay_gap_snapshots
  id                   UUID PK
  organization_id      TEXT NOT NULL
  snapshot_date        DATE NOT NULL
  scope                TEXT NOT NULL  -- 'company','department','job_profile','job_level'
  scope_id             UUID  -- references the scoped entity; NULL = company-wide
  scope_label          TEXT  -- human name for reports
  -- Unadjusted gap (EU required: Article 9)
  male_count           INTEGER NOT NULL
  female_count         INTEGER NOT NULL
  male_mean_base       NUMERIC(12,2)
  female_mean_base     NUMERIC(12,2)
  male_median_base     NUMERIC(12,2)
  female_median_base   NUMERIC(12,2)
  mean_gap_base_pct    NUMERIC(5,2)  -- (male-female)/male * 100
  median_gap_base_pct  NUMERIC(5,2)
  -- Variable pay gap (EU required)
  male_mean_variable   NUMERIC(12,2)
  female_mean_variable NUMERIC(12,2)
  mean_gap_variable_pct NUMERIC(5,2)
  pct_male_receiving_variable   NUMERIC(5,2)
  pct_female_receiving_variable NUMERIC(5,2)
  -- Quartile distribution (EU required)
  q1_male_pct          NUMERIC(5,2)  -- % male in lower quartile
  q1_female_pct        NUMERIC(5,2)
  q2_male_pct          NUMERIC(5,2)
  q2_female_pct        NUMERIC(5,2)
  q3_male_pct          NUMERIC(5,2)
  q3_female_pct        NUMERIC(5,2)
  q4_male_pct          NUMERIC(5,2)
  q4_female_pct        NUMERIC(5,2)
  -- Compliance signal
  gap_status           TEXT CHECK (gap_status IN ('compliant','warning','breach'))
  -- 'breach' = gap > 5% (triggers joint assessment obligation)
  requires_joint_assessment BOOLEAN DEFAULT false
  created_at           TIMESTAMPTZ
  UNIQUE(organization_id, snapshot_date, scope, scope_id)
```

**Gap status thresholds:** `compliant` < 3%, `warning` 3–5%, `breach` > 5% (Article 9.10 joint assessment trigger).

---

### Table: `compliance_reports`

Generated compliance reports linked to a snapshot period. Stores both the raw data used and the rendered output.

```
compliance_reports
  id                UUID PK
  organization_id   TEXT NOT NULL
  report_year       INTEGER NOT NULL
  reporting_period  TEXT  -- e.g. '2026-01-01/2026-12-31'
  status            TEXT CHECK (status IN ('draft','finalized','submitted'))
  snapshot_ids      UUID[]  -- which pay_gap_snapshots are included
  generated_by      TEXT NOT NULL
  finalized_at      TIMESTAMPTZ
  submitted_at      TIMESTAMPTZ
  report_data       JSONB  -- full serialized report for PDF generation
  created_at        TIMESTAMPTZ
  updated_at        TIMESTAMPTZ
```

---

### Table: `info_requests`

Employees can request average pay level data for their work category (EU directive Article 7 — employee right to information). This table tracks those requests and HR responses.

```
info_requests
  id               UUID PK
  organization_id  TEXT NOT NULL
  employee_id      UUID NOT NULL REFERENCES employees(id)
  request_type     TEXT CHECK (request_type IN ('avg_pay_category','pay_band','gap_explanation'))
  status           TEXT CHECK (status IN ('pending','fulfilled','declined'))
  job_profile_id   UUID  -- which category they're asking about
  response_data    JSONB  -- anonymized aggregate data returned
  processed_by     TEXT
  processed_at     TIMESTAMPTZ
  created_at       TIMESTAMPTZ
```

---

### Table: `audit_logs`

Immutable compliance audit trail. Never deleted; append-only.

```
audit_logs
  id               UUID PK
  organization_id  TEXT NOT NULL
  user_id          TEXT NOT NULL
  action           TEXT NOT NULL  -- 'employee.salary.update','report.finalize', etc.
  entity_type      TEXT NOT NULL
  entity_id        UUID
  before_state     JSONB  -- snapshot before change
  after_state      JSONB  -- snapshot after change
  ip_address       TEXT
  created_at       TIMESTAMPTZ
```

---

## RLS Strategy

All policies must use `auth.get_user_org_id()` (the Logto JWT org claim). The current `USING(true)` policies must all be replaced.

**Pattern per table:**
```sql
-- Standard tenant isolation
CREATE POLICY "org_isolation" ON employees
  FOR ALL USING (organization_id = auth.get_user_org_id());

-- Employees see only their own record
CREATE POLICY "self_read" ON employees
  FOR SELECT USING (
    organization_id = auth.get_user_org_id()
    AND (
      user_id = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()::text
          AND organization_id = auth.get_user_org_id()
          AND role IN ('admin','hr_manager')
      )
    )
  );
```

**Salary privacy rule:** `employees.base_salary` and `employees.variable_pay` must only be readable by `admin` and `hr_manager`. The `employee` role reads from `pay_gap_snapshots` (aggregates) and `pay_bands` (ranges) — never individual salary figures.

---

## Calculation Pipeline

```
Raw Data (employees table)
        │
        ▼
  [TRIGGER or on-demand]
        │
        ▼
  PostgreSQL Function: refresh_pay_gap_snapshots(org_id, date)
        │
        ├── For each scope (company-wide, per department, per job_profile, per job_level):
        │     ├── Filter active employees with non-null base_salary
        │     ├── Separate by gender: male / female / other
        │     ├── Calculate mean and median base salary per gender group
        │     ├── Calculate mean and median variable pay per gender group
        │     ├── Calculate % receiving variable pay per gender group
        │     ├── Calculate quartile boundaries (NTILE(4) OVER ORDER BY base_salary)
        │     ├── Calculate gender distribution per quartile
        │     ├── Apply suppression: if group < 5 employees → NULL values, set is_suppressed=true
        │     └── Derive gap_status ('compliant'/'warning'/'breach')
        │
        ▼
  pay_gap_snapshots (upsert by org+date+scope+scope_id)
        │
        ▼
  Hooks layer reads snapshots (no recalculation in JS)
        │
        ▼
  UI renders charts and compliance indicators
```

### Key Formulas

**Mean gender pay gap (base salary):**
```
mean_gap_pct = (AVG(base_salary) FILTER (gender='male')
               - AVG(base_salary) FILTER (gender='female'))
             / AVG(base_salary) FILTER (gender='male') * 100
```

**Median gender pay gap:**
```
median_gap_pct = (PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY base_salary) FILTER (gender='male')
                - PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY base_salary) FILTER (gender='female'))
              / PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY base_salary) FILTER (gender='male') * 100
```

**Quartile distribution:**
```sql
WITH ranked AS (
  SELECT gender, NTILE(4) OVER (ORDER BY base_salary) as quartile
  FROM employees WHERE organization_id = $org AND is_active = true
)
SELECT
  quartile,
  COUNT(*) FILTER (WHERE gender = 'male')::NUMERIC / COUNT(*) * 100 as male_pct,
  COUNT(*) FILTER (WHERE gender = 'female')::NUMERIC / COUNT(*) * 100 as female_pct
FROM ranked GROUP BY quartile ORDER BY quartile;
```

**Hourly rate normalization** (for mixed full/part-time workforce):
```
hourly_rate = base_salary / (weekly_hours * 52)
```
Use `hourly_rate` instead of `base_salary` when the workforce mix includes significant part-time presence.

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `useEmployees` | CRUD for employee records | Supabase `employees` table |
| `useJobProfiles` | CRUD for job profiles and levels | Supabase `job_profiles`, `job_levels` |
| `usePayBands` | CRUD for pay bands per profile+level | Supabase `pay_bands` |
| `usePayGap` | Read pre-computed gap snapshots, trigger refresh | Supabase `pay_gap_snapshots`, `/api/pay-gap/recalculate` |
| `useComplianceReport` | Generate, finalize, export reports | Supabase `compliance_reports`, `/api/reports/generate` |
| `useInfoRequests` | Employee salary info requests, HR fulfillment | Supabase `info_requests` |
| `useAuditLogs` | Read audit trail (admin only) | Supabase `audit_logs` |
| `/api/pay-gap/recalculate` | Server route: calls `refresh_pay_gap_snapshots()` | Supabase RPC |
| `/api/reports/generate` | Server route: renders PDF/CSV from snapshot data | Supabase, file generation lib |

**Data flow direction (strict, no bypasses):**
```
employees table
      ↓ (write triggers / on-demand RPC)
pay_gap_snapshots
      ↓ (read-only)
usePayGap hook
      ↓
analytics UI components (Recharts)
```

Employee role users never query the `employees` table for salary data. They query `pay_gap_snapshots` for aggregates and `pay_bands` for their own salary range — both protected by RLS.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Computing Gap in JavaScript

**What:** Fetching all employee salary records to the browser and computing median/mean in JS.
**Why bad:** Leaks individual salary data to employee-role users. Performance degrades O(n). Supabase has `PERCENTILE_CONT` — use it server-side.
**Instead:** All gap calculations run as PostgreSQL functions. Hooks read from `pay_gap_snapshots` only.

---

### Anti-Pattern 2: Free-text Department and Level Strings on Employees

**What:** `employees.department TEXT`, `employees.job_level TEXT` with no FK.
**Why bad:** Grouping for EU reports becomes unreliable ("Engineering" vs "engineering" vs "Eng"). Existing migration patches demonstrate this problem directly.
**Instead:** `department_id UUID REFERENCES departments(id)` and `job_level_id UUID REFERENCES job_levels(id)`. Canonical values enforced at the DB level.

---

### Anti-Pattern 3: Mixing company_id (UUID) and organization_id (TEXT) for Tenant Isolation

**What:** Current schema has both — `company_id UUID` from the old Supabase-auth era and `organization_id TEXT` added as patches for Logto.
**Why bad:** RLS policies become ambiguous. Some tables check `company_id`, others check `organization_id`. Neither is reliably populated.
**Instead:** One authoritative migration that drops `company_id` from all tables and replaces with `organization_id TEXT NOT NULL`. `companies` gets `organization_id TEXT NOT NULL UNIQUE` as the join key.

---

### Anti-Pattern 4: Nullable organization_id

**What:** `organization_id TEXT` (no NOT NULL) — present in the current patched schema.
**Why bad:** RLS policy `organization_id = auth.get_user_org_id()` silently fails for NULL rows (NULL != anything). Demo data with NULL org_id bleeds across all tenants.
**Instead:** `organization_id TEXT NOT NULL`. Seed/demo data uses a real org ID. No exceptions.

---

### Anti-Pattern 5: Storing Salary Directly on Employees Without History

**What:** A single `current_salary` column on `employees`, overwritten on update.
**Why bad:** EU directive requires trend comparisons. After a raise, the previous salary is gone. Audit trail becomes impossible to reconstruct.
**Instead:** `employees` holds the current snapshot. Every salary change appends a row to `salary_history` via a trigger.

---

## Scalability Considerations

The directive affects employers with 100+ employees. Target tenant scale is 100–5000 employees per org. At this scale PostgreSQL window functions and aggregates are fast enough with proper indexes.

| Concern | At 100 employees | At 1000 employees | At 10K employees |
|---------|-----------------|-------------------|-----------------|
| Gap calculation | < 100ms inline | < 100ms inline | Pre-compute snapshots nightly |
| Report generation | Synchronous API route | Synchronous API route | Background job queue |
| Audit log size | Negligible | ~50K rows/year | Consider partitioning by year |
| RLS policy overhead | Negligible | Negligible | Index on `organization_id` essential |

**Required indexes:**
```sql
CREATE INDEX idx_employees_org_active ON employees(organization_id, is_active);
CREATE INDEX idx_employees_gender ON employees(organization_id, gender);
CREATE INDEX idx_employees_job_profile ON employees(organization_id, job_profile_id, job_level_id);
CREATE INDEX idx_pay_gap_snapshots_org_date ON pay_gap_snapshots(organization_id, snapshot_date DESC);
CREATE INDEX idx_audit_logs_org_created ON audit_logs(organization_id, created_at DESC);
```

---

## Suggested Build Order

Dependencies flow bottom-up. Each phase must be complete before the next.

```
Phase 1: Foundation — Single authoritative schema migration
  - Drop all old emergency patches
  - Create: organizations, companies, departments, job_levels
  - Rework: employees, job_profiles, pay_bands
  - Create: salary_history, pay_gap_snapshots
  - RLS: all policies via auth.get_user_org_id()
  - Seed: demo org with realistic data

Phase 2: Data Management UI
  - Depends on: Phase 1 (valid schema)
  - Hooks: useEmployees (CRUD), useJobProfiles (CRUD), usePayBands (CRUD)
  - Views: employee list/form, job profiles list/form, pay bands matrix

Phase 3: Import Pipeline
  - Depends on: Phase 2 (hooks exist)
  - CSV upload + column mapping UI
  - Server-side validation and bulk insert
  - Error reporting per row

Phase 4: Gap Analytics Engine
  - Depends on: Phase 1 (schema), Phase 2 (data exists)
  - PostgreSQL function: refresh_pay_gap_snapshots()
  - Hook: usePayGap (reads snapshots)
  - API route: /api/pay-gap/recalculate
  - Views: gap dashboard with Recharts (mean, median, quartiles)

Phase 5: Role-Appropriate Views
  - Depends on: Phase 4 (analytics data)
  - HR view: full gap dashboard, employee management
  - Executive view: summary KPIs, compliance status
  - Employee view: own pay band, category average (anonymized)

Phase 6: Compliance Reports
  - Depends on: Phase 4 (snapshots), Phase 5 (finalized views)
  - Report generation: PDF export, CSV export
  - compliance_reports table: draft → finalize → submitted workflow
  - Info requests: employee right-to-information flow

Phase 7: Audit and Hardening
  - Depends on: All above
  - Audit log completeness (triggers on salary changes)
  - Pagination on employee lists and audit logs
  - Data suppression: anonymize groups < 5 employees
```

**Critical dependency:** Phase 1 is a pre-requisite for everything. The current schema is not fit for compliance use — no amount of frontend work on top of broken RLS and nullable organization_ids produces a correct product.

---

## EU Directive Compliance Checklist (mapped to data model)

| Directive Requirement | Data Model Coverage | Notes |
|-----------------------|--------------------|----|
| Article 5: Pay range in job postings | `pay_bands.min_salary`, `pay_bands.max_salary` | Exposed to candidates via company's public job posting — out of scope for v1, but bands must exist |
| Article 7: Employee right to avg pay per category | `pay_gap_snapshots` + `info_requests` | Aggregated, anonymized; suppressed if group < 5 |
| Article 9.1: Mean gender pay gap | `pay_gap_snapshots.mean_gap_base_pct` | Company-wide and per work category |
| Article 9.1: Median gender pay gap | `pay_gap_snapshots.median_gap_base_pct` | Required alongside mean |
| Article 9.1: Variable pay gap | `pay_gap_snapshots.mean_gap_variable_pct` | Bonuses/commissions tracked separately |
| Article 9.1: % receiving variable pay | `pay_gap_snapshots.pct_male_receiving_variable` | Per gender |
| Article 9.1: Quartile distribution | `pay_gap_snapshots.q1_*_pct` through `q4_*_pct` | Four equal bands |
| Article 9.10: Joint assessment trigger | `pay_gap_snapshots.requires_joint_assessment` | Set when gap > 5% |
| Article 4.4: Work of equal value criteria | `job_profiles.skills_score` etc. | Four EU criteria stored for audit |
| Salary raise after parental leave | `employees.leave_*`, `salary_history` | Detectable by comparing salary before/after leave dates |
| Reporting frequency by size | `companies.employee_size_band` | Drives UI warnings and report scheduling |

---

## Sources

- EU Directive 2023/970 full text: https://eur-lex.europa.eu/eli/dir/2023/970/oj/eng
- Ravio — EU pay transparency directive guide: https://ravio.com/blog/everything-you-need-to-know-about-the-eu-pay-transparency-directive
- Ravio — Gap calculation methodology (median vs mean): https://ravio.com/blog/gender-pay-gap-calculations-median-vs-mean-adjusted-vs-unadjusted
- Paygap.com — Adjusted gap and regression methodology: https://www.paygap.com/articles/regression-analysis-and-adjusted-pay-gaps-in-pay-equity-audits-an-eu-pay-transparency-guide
- PayAnalytics — Unadjusted vs adjusted gap: https://www.payanalytics.com/resources/articles/the-unadjusted-pay-gap-vs-the-adjusted-pay-gap
- Existing codebase: `supabase/migrations/20260126_pay_equity_analysis.sql` (existing calculation pattern, verified as directionally correct but missing quartile distribution and variable pay separation)

---

*Architecture analysis: 2026-03-19*
