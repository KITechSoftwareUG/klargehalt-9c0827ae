# Requirements: KlarGehalt

**Defined:** 2026-03-19
**Core Value:** Automated gender pay gap reporting that satisfies EU directive 2023/970 requirements

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [ ] **FOUN-01**: Single authoritative database migration replaces all 17 ad-hoc patch files with a clean, deterministic schema
- [ ] **FOUN-02**: All tenant-scoped tables enforce `organization_id TEXT NOT NULL`
- [ ] **FOUN-03**: RLS policies use Logto JWT claims (`auth.jwt() ->> 'org_id'`) for tenant isolation — no USING(true) policies remain
- [ ] **FOUN-04**: `user_roles` table has UNIQUE constraint on `(user_id, organization_id)` to support multi-org users
- [ ] **FOUN-05**: Dead dependencies removed (`@google/generative-ai`, `svix`)
- [ ] **FOUN-06**: AI-related API routes and services removed (`/api/pay-equity/chat`, `/api/pay-equity/generate-explanation`, `lib/services/gemini-service.ts`)

### Employee Records

- [ ] **EMPL-01**: HR manager can create employee records with: name, gender, job title, department, employment type (FT/PT), hire date, hours per week
- [ ] **EMPL-02**: HR manager can assign base salary and variable pay components to each employee with effective date
- [ ] **EMPL-03**: HR manager can edit and delete employee records with changes logged to audit trail
- [ ] **EMPL-04**: HR manager can import employees via CSV upload with column mapping and validation error reporting
- [ ] **EMPL-05**: Salary history is append-only — compensation changes are tracked with old/new values and timestamps
- [ ] **EMPL-06**: Employee records reference job categories via foreign key (not free-text)

### Job Architecture

- [ ] **JOBA-01**: HR manager can define job categories with Art. 4.4 factor scores (skills, effort, responsibility, working conditions)
- [ ] **JOBA-02**: HR manager can map multiple job titles to a single job category
- [ ] **JOBA-03**: HR manager can define pay bands (min/max salary range) per job category
- [ ] **JOBA-04**: Department and job level are structured references (FK), not free-text strings

### Pay Gap Analytics

- [ ] **PGAP-01**: System calculates mean gender pay gap for base salary (Art. 9a)
- [ ] **PGAP-02**: System calculates median gender pay gap for base salary (Art. 9b)
- [ ] **PGAP-03**: System calculates mean gender pay gap for variable/supplementary pay (Art. 9c)
- [ ] **PGAP-04**: System calculates median gender pay gap for variable/supplementary pay (Art. 9d)
- [ ] **PGAP-05**: System calculates proportion of female vs male employees receiving variable pay (Art. 9e)
- [ ] **PGAP-06**: System calculates gender distribution across 4 pay quartiles (Art. 9f)
- [ ] **PGAP-07**: System calculates pay gap per job category broken down by base and variable pay (Art. 9g)
- [ ] **PGAP-08**: All calculations use gross hourly rate (base_salary / (hours_per_week * 52)) not annual salary
- [ ] **PGAP-09**: Groups with fewer than 6 individuals of one gender have disaggregated figures suppressed (anonymization)
- [ ] **PGAP-10**: Gap calculations run as PostgreSQL functions writing to a snapshots table — no salary data reaches employee-role clients
- [ ] **PGAP-11**: HR manager can view pay gap dashboard with Recharts visualizations for all 7 indicators

### Compliance Reports

- [ ] **REPT-01**: HR manager can export all 7 Art. 9 indicators as CSV per reporting period
- [ ] **REPT-02**: HR manager can generate a PDF compliance report with organization name, reporting year, all indicators, and job category breakdown
- [ ] **REPT-03**: Report generation is logged in the audit trail with timestamp, actor, and parameters

### Audit & Compliance

- [ ] **AUDT-01**: All employee record mutations (create/update/delete) are logged with actor, timestamp, and before/after values
- [ ] **AUDT-02**: All compensation changes are logged with actor, timestamp, old and new values
- [ ] **AUDT-03**: HR manager can view filtered audit log with pagination
- [ ] **AUDT-04**: Audit log entries are immutable (insert-only, no update/delete)

### Role-Appropriate Views

- [ ] **ROLE-01**: HR manager sees full employee data, all analytics, and report generation tools
- [ ] **ROLE-02**: Employee sees only their own salary data and average pay of their job category by gender (Art. 7 context)
- [ ] **ROLE-03**: Executive sees aggregate reports and dashboards but no individual employee salary data
- [ ] **ROLE-04**: RLS enforces role-based data visibility at the database level

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Article 7 Workflow

- **ART7-01**: Employee can submit a pay comparison request through the app
- **ART7-02**: HR sees request queue with 2-month deadline countdown
- **ART7-03**: System generates Art. 7 response (employee's pay + average by category/gender)
- **ART7-04**: Annual reminder for HR to notify employees of their Art. 7 right

### Gap Alerts & Assessment

- **ALRT-01**: Dashboard alerts when any job category has >5% unexplained gap (Art. 10 trigger)
- **ALRT-02**: HR can document objective justification for gaps or flag for remediation
- **ALRT-03**: Action tracking for justified vs remediated gaps

### Advanced Analytics

- **ADVN-01**: Remediation cost simulator (estimate cost to close gap per category)
- **ADVN-02**: Multi-year trend tracking with year-over-year comparison
- **ADVN-03**: Department-level segmentation of all analytics
- **ADVN-04**: Pay band compliance checker with shareable salary range URLs (Art. 5)

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI pay gap explanations (Gemini) | Hallucination risk on compliance outputs; no legal defensibility |
| AI chat interface | No directive mandate; adds complexity without compliance value |
| Market salary benchmarking | Directive explicitly rejects market-rate justifications for gaps |
| HRIS/payroll integrations (SAP, Workday) | CSV import sufficient for target market (100-500 employees) |
| ATS/recruitment integration | Shareable pay band URL satisfies Art. 5 without integration |
| Mobile app | Web-first; compliance reporting is periodic HR task |
| Real-time salary discussion | Art. 7 structured workflow is the compliant approach |
| Consulting booking | Not core compliance value |
| Authentication & onboarding | User building separately with Logto |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUN-01 | Phase 1 | Pending |
| FOUN-02 | Phase 1 | Pending |
| FOUN-03 | Phase 1 | Pending |
| FOUN-04 | Phase 1 | Pending |
| FOUN-05 | Phase 1 | Pending |
| FOUN-06 | Phase 1 | Pending |
| EMPL-01 | Phase 2 | Pending |
| EMPL-02 | Phase 2 | Pending |
| EMPL-03 | Phase 2 | Pending |
| EMPL-04 | Phase 2 | Pending |
| EMPL-05 | Phase 2 | Pending |
| EMPL-06 | Phase 2 | Pending |
| JOBA-01 | Phase 2 | Pending |
| JOBA-02 | Phase 2 | Pending |
| JOBA-03 | Phase 2 | Pending |
| JOBA-04 | Phase 2 | Pending |
| PGAP-01 | Phase 3 | Pending |
| PGAP-02 | Phase 3 | Pending |
| PGAP-03 | Phase 3 | Pending |
| PGAP-04 | Phase 3 | Pending |
| PGAP-05 | Phase 3 | Pending |
| PGAP-06 | Phase 3 | Pending |
| PGAP-07 | Phase 3 | Pending |
| PGAP-08 | Phase 3 | Pending |
| PGAP-09 | Phase 3 | Pending |
| PGAP-10 | Phase 3 | Pending |
| PGAP-11 | Phase 3 | Pending |
| ROLE-01 | Phase 3 | Pending |
| ROLE-02 | Phase 3 | Pending |
| ROLE-03 | Phase 3 | Pending |
| ROLE-04 | Phase 3 | Pending |
| REPT-01 | Phase 4 | Pending |
| REPT-02 | Phase 4 | Pending |
| REPT-03 | Phase 4 | Pending |
| AUDT-01 | Phase 4 | Pending |
| AUDT-02 | Phase 4 | Pending |
| AUDT-03 | Phase 4 | Pending |
| AUDT-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after roadmap creation*
