# Roadmap: KlarGehalt

## Overview

The work proceeds in four dependency-ordered phases. Phase 1 tears out the broken foundation and replaces it with a single authoritative schema and working RLS — nothing else is safe to build until this is done. Phase 2 builds the HR data entry layer (employees, job categories, pay bands) that feeds the analytics engine. Phase 3 implements the seven EU directive indicators as PostgreSQL functions and surfaces them through role-differentiated dashboards. Phase 4 produces the exportable compliance artifacts (PDF, CSV, audit log) that HR managers submit to regulators.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Schema and Security Foundation** - Replace broken schema and RLS with a single authoritative migration and working Logto JWT tenant isolation
- [ ] **Phase 2: Data Management** - HR manager CRUD for job categories, pay bands, and employee records including CSV import
- [ ] **Phase 3: Analytics and Role Views** - Seven EU Article 9 indicators computed in PostgreSQL, surfaced through role-differentiated dashboards
- [ ] **Phase 4: Compliance Reports and Audit** - Exportable CSV and PDF compliance reports, immutable audit log, report generation workflow

## Phase Details

### Phase 1: Schema and Security Foundation
**Goal**: The database is the security boundary — it must be correct before any application feature is built or trusted
**Depends on**: Nothing (first phase)
**Requirements**: FOUN-01, FOUN-02, FOUN-03, FOUN-04, FOUN-05, FOUN-06
**Success Criteria** (what must be TRUE):
  1. A fresh Supabase instance can be initialized from one migration file and produces a deterministic, complete schema with no additional patches required
  2. Any authenticated Logto user querying any tenant-scoped table receives only their organization's rows — cross-tenant reads return empty, not an error and not another org's data
  3. An employee-role user cannot read another employee's salary row, even with direct SQL via Supabase client
  4. Dead dependencies (`@google/generative-ai`, `svix`) and AI API routes are absent from the codebase and `package.json`
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Canonical schema migration with RLS policies and archived patches
- [ ] 01-02-PLAN.md — Remove dead dependencies and AI routes/services

### Phase 2: Data Management
**Goal**: HR managers can enter and maintain the structured data that feeds compliance calculations
**Depends on**: Phase 1
**Requirements**: EMPL-01, EMPL-02, EMPL-03, EMPL-04, EMPL-05, EMPL-06, JOBA-01, JOBA-02, JOBA-03, JOBA-04
**Success Criteria** (what must be TRUE):
  1. HR manager can create an employee record with all required fields (name, gender, job category, employment type, hours per week, base salary, variable pay, hire date) and see it appear in the employee list
  2. HR manager can upload a CSV file, map columns to fields, and have employees created in bulk — with validation errors shown per row before any data is committed
  3. A salary change on an existing employee appends a salary history record without modifying or deleting the previous record — the old value is retrievable
  4. HR manager can define a job category with Article 4.4 factor scores (skills, effort, responsibility, working conditions) and assign multiple job titles to it
  5. Employee records reference job categories via foreign key — free-text job titles are not accepted as a category assignment
**Plans**: TBD

Plans:
- [ ] 02-01: Job architecture CRUD (job categories with Art. 4.4 scores, job levels, departments, pay bands)
- [ ] 02-02: Employee CRUD with salary history (append-only compensation tracking)
- [ ] 02-03: CSV import with column mapping and row-level validation

### Phase 3: Analytics and Role Views
**Goal**: The seven EU directive indicators are calculated correctly and visible to the right users with the right scope
**Depends on**: Phase 2
**Requirements**: PGAP-01, PGAP-02, PGAP-03, PGAP-04, PGAP-05, PGAP-06, PGAP-07, PGAP-08, PGAP-09, PGAP-10, PGAP-11, ROLE-01, ROLE-02, ROLE-03, ROLE-04
**Success Criteria** (what must be TRUE):
  1. HR manager can trigger a recalculation and see updated values for all seven Article 9 indicators — mean and median base pay gap, mean and median variable pay gap, proportion receiving variable pay by gender, quartile distribution, and per-job-category breakdown
  2. All gap percentages use gross hourly rate (base salary divided by weekly hours times 52), not annual salary — a part-time employee at the same annual salary as a full-time employee produces a different hourly rate
  3. Any job category or pay quartile with fewer than the anonymization threshold of individuals of one gender shows suppressed (null) figures, not the actual value
  4. An employee-role user sees only their own salary and the anonymized average for their job category — they cannot reach another employee's salary data through any UI path or direct API call
  5. An executive-role user sees aggregate compliance KPIs and gap status indicators but no individual employee salary rows
**Plans**: TBD

Plans:
- [ ] 03-01: PostgreSQL gap calculation functions (refresh_pay_gap_snapshots with all 7 indicators, suppression, hourly normalization)
- [ ] 03-02: Pay gap dashboard UI (Recharts visualizations for all indicators)
- [ ] 03-03: Role-differentiated views (HR full view, executive summary view, employee self-view)

### Phase 4: Compliance Reports and Audit
**Goal**: HR managers can produce legally defensible compliance artifacts and maintain an immutable audit trail
**Depends on**: Phase 3
**Requirements**: REPT-01, REPT-02, REPT-03, AUDT-01, AUDT-02, AUDT-03, AUDT-04
**Success Criteria** (what must be TRUE):
  1. HR manager can export a CSV containing all seven Article 9 indicators for a selected reporting period, with organization name and reporting year included
  2. HR manager can generate a PDF report containing organization name, reporting year, all seven indicators, and job category breakdown — the PDF is downloadable without requiring a third-party service
  3. Every report generation is recorded in the audit log with the actor's identity, timestamp, and the parameters used (period, scope)
  4. The audit log displays with pagination and filtering by date range and event type — HR manager can find any specific event without scrolling through all entries
  5. No audit log entry can be modified or deleted — attempts to update or delete via the Supabase client return an error regardless of user role
**Plans**: TBD

Plans:
- [ ] 04-01: Audit log hardening (immutable RLS, HR paginated view)
- [ ] 04-02: CSV and PDF compliance report export with report generation audit trail

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Schema and Security Foundation | 0/2 | Planning complete | - |
| 2. Data Management | 0/3 | Not started | - |
| 3. Analytics and Role Views | 0/3 | Not started | - |
| 4. Compliance Reports and Audit | 0/2 | Not started | - |
