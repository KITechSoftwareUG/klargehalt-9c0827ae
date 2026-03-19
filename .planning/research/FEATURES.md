# Feature Landscape: EU Pay Transparency Compliance SaaS

**Domain:** B2B SaaS — EU regulatory compliance (Entgelttransparenzrichtlinie 2023/970)
**Project:** KlarGehalt
**Researched:** 2026-03-19
**Target market:** German companies 100–500 employees, HR managers + executives

---

## Directive Reference Summary

The EU Pay Transparency Directive 2023/970 entered into force May 2023. Member states must transpose by 7 June 2026. Key obligations:

| Article | Obligation | Threshold |
|---------|-----------|-----------|
| Art. 5 | Salary range disclosed before first interview | All employers |
| Art. 6 | Pay criteria gender-neutral and easily accessible | All employers |
| Art. 7 | Employee right to request individual + comparative pay data | All employers |
| Art. 9 | Annual gender pay gap reporting (7 data indicators) | 250+ employees annually; 100–249 every 3 years |
| Art. 10 | Joint pay assessment if gap >5% unexplained | 100+ employees |

**Reporting deadlines:**
- 250+ employees: first report by 7 June 2027 (based on 2026 data), data transmitted from 31 January 2028
- 100–249 employees: first report by 7 June 2031 (based on 2030 data), every 3 years
- Under 100 employees: exempt from reporting

---

## Table Stakes

Features users expect. Missing = product fails compliance purpose or users leave.

### 1. Gender Pay Gap Calculation Engine (7 Statutory Indicators)

**Why expected:** Art. 9 mandates exactly these seven data points. Without correct calculation the product provides no compliance value.

**What it computes:**
- (a) Mean gender pay gap (base salary)
- (b) Median gender pay gap (base salary)
- (c) Mean gender pay gap (supplementary/variable components)
- (d) Median gender pay gap (supplementary/variable components)
- (e) Proportion of female vs male employees receiving variable/supplementary pay
- (f) Proportion of female vs male employees per pay quartile (lower, lower-middle, upper-middle, upper)
- (g) Gender pay gap within each job category (work of equal value), broken down by base pay and variable pay

**Complexity:** High — quartile calculation requires accurate employee-to-pay-band mapping; "work of equal value" grouping requires job architecture foundation

**Dependencies:** Requires employee data model, job categories/pay bands, gender field on employee records

---

### 2. Employee Records Management

**Why expected:** Source data for all analytics. No employee data = no gap analysis.

**What it includes:**
- Employee record: name, gender, job title, job category (work of equal value group), department, employment type (FT/PT), hire date
- Compensation record: base salary, variable pay components, effective date
- Import via CSV (minimum viable)
- Edit/update individual records

**Complexity:** Medium — schema must distinguish between job titles (arbitrary strings) and job categories (the statutory "equal value" groupings)

**Dependencies:** None (foundation layer)

---

### 3. Job Category Architecture (Work of Equal Value)

**Why expected:** Art. 9(g) requires pay gap broken down by "categories of workers performing equal work or work of equal value." Directive mandates evaluating roles by: skills, effort, responsibility, working conditions. Market-rate-based groupings are explicitly non-compliant.

**What it includes:**
- Job category (band) definition: name, level, evaluation factors
- Mapping many job titles → one job category
- Simple factor scoring (skills/effort/responsibility/conditions) for defensibility
- Category hierarchy (e.g., Level 1–5 per function)

**Complexity:** High — this is the hardest compliance piece. Requires HR judgment to map roles; software can scaffold but cannot automate the classification

**Dependencies:** None (foundation layer), feeds all gap calculations

---

### 4. Pay Quartile Distribution Analysis

**Why expected:** Art. 9 indicator (f) is explicitly quartile-based. All compliance reports require quartile breakdown.

**What it shows:**
- 4 quartile buckets across the organization
- Female % and male % per quartile
- Visualization (bar chart or stacked chart)

**Complexity:** Medium — quartile boundaries calculated from the full pay distribution; must handle ties correctly

**Dependencies:** Employee records, compensation data

---

### 5. Role-Appropriate Access Control

**Why expected:** HR managers need full data access; employees may only see their own pay context and Art. 7 response; executives need aggregate reports. This is the product's multi-user value, not just a nice-to-have.

**Roles:**
- `admin` / `hr_manager`: full employee data, all analytics, report generation
- Employee: own salary, Art. 7 self-service pay comparison (average by category, by gender), no individual peer data
- Executive: read-only reports and dashboards, no individual employee data

**Complexity:** Medium — already partially exists; needs RLS to enforce at DB level

**Dependencies:** Authentication (handled separately via Logto)

---

### 6. Compliance Report Export

**Why expected:** Art. 9 requires transmitting data to a designated national monitoring body. Employers also publish to company website. HR needs exportable artifacts, not just screen views.

**What it includes:**
- CSV export of all 7 statutory indicators per reporting period
- PDF summary report (organization name, reporting year, all 7 indicators, job category breakdown)
- Timestamped (for audit trail)

**Complexity:** Medium — CSV is low complexity; PDF requires template rendering (react-pdf or similar)

**Dependencies:** Gap calculation engine, job categories

---

### 7. Audit Log

**Why expected:** Compliance proof requires demonstrating what data was used for which report, when it was generated, and who made changes to employee records. Required for defensibility if challenged.

**What it records:**
- Employee record create/update/delete (actor, timestamp, before/after values)
- Compensation change (actor, timestamp, old/new salary)
- Report generation (actor, timestamp, report parameters)
- Art. 7 information request fulfillment (who requested, what was returned, when)

**Complexity:** Low-Medium — insert-only log table; UI is basic filtered list

**Dependencies:** All data mutation operations

---

### 8. Article 7 — Employee Information Request Workflow

**Why expected:** Art. 7 requires employers to respond within 2 months to employee requests for comparative pay data. Employers must also notify employees annually of this right. Without a systematic workflow, companies handle this ad-hoc and risk non-compliance.

**What it includes:**
- Employee-facing screen: "Request pay comparison" (triggers workflow)
- HR-facing queue: pending requests, 2-month deadline countdown
- Response: employee's own pay + average pay of same job category broken down by gender
- Annual reminder trigger for HR to notify employees of their Art. 7 right
- Audit log entry when request fulfilled

**Complexity:** Medium — workflow state machine (submitted → reviewed → fulfilled); response generation is just a parameterized query

**Dependencies:** Employee records, job categories, gap calculation engine

---

## Differentiators

Features that set the product apart. Not mandated, but create competitive value.

### 1. 5% Gap Alert and Joint Pay Assessment Trigger

**Value proposition:** Art. 10 requires a joint pay assessment when a gap in any job category exceeds 5% and cannot be objectively justified. Proactive alerting lets HR act before the legal trigger forces them to.

**What it includes:**
- Dashboard alert: "Job category X has a 6.2% gender pay gap — joint assessment may be required"
- Explanation scaffolding: prompts HR to document objective justification (tenure, performance, location) or flag for remediation
- Action tracking: record whether gap was justified or remediation action was taken

**Complexity:** Medium — alerting logic is simple threshold check; the justification/tracking UI is the value

**Dependencies:** Gap calculation engine, job categories

---

### 2. Pay Band Compliance Checker (Art. 5 + Art. 6)

**Value proposition:** Art. 5 requires salary ranges published before interviews. Art. 6 requires pay criteria to be accessible. Linking pay bands to job postings and making criteria accessible is where most companies fail in the early stages.

**What it includes:**
- Pay band per job category (min/max salary range)
- Shareable pay range link (for job posting use)
- Pay criteria documentation per band (what determines progression within band)

**Complexity:** Low-Medium

**Dependencies:** Job categories

---

### 3. Remediation Cost Simulator

**Value proposition:** When gaps are found, HR needs to estimate cost-to-close before taking action. Competitors (PayAnalytics) offer this as a core differentiator. "Close the gap to 0%" scenario with estimated annual cost.

**What it includes:**
- Scenario: raise lowest-paid gender in category to peer median/mean
- Output: total annual cost increase, number of employees affected, per-employee average raise
- "What-if" pay band adjustment

**Complexity:** Medium — calculation is straightforward; UX to make it useful requires iteration

**Dependencies:** Gap calculation engine, employee compensation data

---

### 4. Multi-Year Trend Tracking

**Value proposition:** Directive requires annual reporting (250+ employees). Year-over-year trend shows whether remediation efforts are working. Builds audit-proof history.

**What it includes:**
- Snapshot per reporting period (year)
- Trend line: gap % over time per job category
- Year-over-year comparison in export

**Complexity:** Medium — requires immutable snapshots (don't recalculate past reports from current data)

**Dependencies:** Report export, gap calculation engine

---

### 5. Department/Business Unit Segmentation

**Value proposition:** The directive's 5% trigger applies at the job-category level, but management wants to see gaps by department too. Non-statutory but very useful for large orgs.

**What it includes:**
- Filter all analytics by department
- Cross-tab: department × job category × gap %
- Department-level PDF export

**Complexity:** Low — department is just a filter dimension; requires department field on employee records

**Dependencies:** Employee records

---

## Anti-Features

Features to deliberately NOT build for v1.

### 1. AI Pay Gap Explanations (Gemini/LLM)

**Why avoid:** Already identified as out of scope in PROJECT.md. Adds external dependency, significant latency, and hallucination risk on compliance-sensitive outputs. HR cannot rely on LLM-generated justifications in legal contexts. The compliance value is in the numbers, not in generated prose.

**What to do instead:** Structured explanation templates HR fills in (dropdown: "justified by: tenure / location / performance / market / other")

---

### 2. AI Chat Interface

**Why avoid:** Same rationale as AI explanations. Adds complexity with no directive mandate. No competitor positions this as a core compliance feature.

**What to do instead:** Good search/filter on employee lists and reports

---

### 3. Market Salary Benchmarking

**Why avoid:** The directive explicitly rejects market-rate benchmarking as a justification for pay gaps (using gender-segregated market rates perpetuates the problem). Building benchmarking creates confusion about what is and isn't compliant. Scope creep risk.

**What to do instead:** Focus on internal job architecture and directive-mandated factors (skills, effort, responsibility, conditions)

---

### 4. Recruitment / ATS Integration

**Why avoid:** Art. 5 salary range disclosure is required but can be satisfied by providing a shareable pay band link — no need to integrate with ATS pipelines in v1. Integration complexity is high; value for initial target market is low.

**What to do instead:** Shareable pay range URL per job category that HR pastes into job postings

---

### 5. HRIS/Payroll System Integrations (SAP, Workday, etc.)

**Why avoid:** Integration development is expensive and slow. Target market is 100–500 employee companies that may not have enterprise HRIS. CSV import satisfies the data ingestion need at v1 scope.

**What to do instead:** Well-designed CSV import with column mapping and validation errors

---

### 6. Real-Time Salary Discussion / Anonymous Peer Comparison

**Why avoid:** Art. 7 prohibits employers from preventing salary discussions but does not require employers to build the infrastructure for it. This is a social/community feature, not a compliance feature. Significant privacy/legal complexity.

**What to do instead:** Structured Art. 7 request workflow (employee asks HR, HR responds via the tool within 2 months)

---

### 7. Mobile App

**Why avoid:** Explicitly out of scope per PROJECT.md. Compliance reporting is a periodic HR task, not a daily mobile use case.

---

### 8. Consulting Booking / Advisory Services

**Why avoid:** Already removed per PROJECT.md. Monetization path but not core compliance value.

---

## Feature Dependencies

```
Employee Records (foundation)
  └── Job Category Architecture (foundation)
        └── Compensation Records
              └── Pay Gap Calculation Engine (7 indicators)
                    ├── Pay Quartile Distribution
                    ├── 5% Alert + Joint Assessment Trigger
                    ├── Remediation Cost Simulator
                    └── Multi-Year Trend Tracking
                          └── Compliance Report Export
                                └── Audit Log

Article 7 Workflow
  ├── Employee Records
  ├── Job Category Architecture
  └── Pay Gap Calculation Engine

Role-Appropriate Access Control
  └── Authentication (Logto — out of scope)
```

**Key dependency:** Everything depends on the Job Category Architecture being implemented correctly. Defining "work of equal value" groups is a human-judgment task that the software scaffolds — but if it's skipped or done with job titles instead of categories, all gap calculations are non-compliant.

---

## MVP Recommendation

Prioritize (in order):

1. **Employee Records + Compensation Records** — foundation; nothing else works without clean data
2. **Job Category Architecture** — statutory requirement; blocks all gap calculations
3. **Pay Gap Calculation Engine (all 7 indicators)** — core compliance value proposition
4. **Pay Quartile Distribution** — part of Art. 9 indicator (f), goes with #3
5. **Role-Appropriate Access Control (RLS fix)** — security; must be correct before any data is real
6. **Compliance Report Export (CSV)** — without this, users can't meet reporting deadline
7. **Audit Log** — required for compliance defensibility

Defer (phase 2+):
- Art. 7 request workflow — valuable but manual process works initially
- 5% gap alert and joint assessment tracker — builds on working analytics
- PDF export — CSV satisfies directive; PDF is polish
- Remediation simulator — differentiator but not MVP
- Multi-year trend tracking — requires at least 2 reporting cycles of data first

---

## Sources

- [EU Directive 2023/970 full text — EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32023L0970)
- [Ravio: Complete EU Pay Transparency Directive guide](https://ravio.com/blog/everything-you-need-to-know-about-the-eu-pay-transparency-directive)
- [Trusaic: Article 7 Right to Information breakdown](https://trusaic.com/blog/eu-directive-in-practice-understanding-article-7s-right-to-information-component/)
- [Sysarb: Best EU Pay Transparency Directive Software](https://resources.sysarb.com/buyers-guides/whats-the-best-eu-pay-transparency-directive-software)
- [PayAnalytics: Product feature overview](https://www.payanalytics.com/product)
- [DCI Consult: Work of equal value methodology](https://blog.dciconsult.com/work-of-equal-value-under-eu-pay-transparency-directive)
- [Mercer: Three hidden pitfalls in pay equity data](https://www.mercer.com/insights/talent-and-transformation/diversity-equity-and-inclusion/three-hidden-pitfalls-in-pay-equity-data-and-how-to-avoid-them/)
- [Ogletree: Directive progress explained](https://ogletree.com/insights-resources/blog-posts/the-eu-pay-transparency-directives-progress-explained/)
- [Zalaris: 2026 deadline reshaping HR](https://zalaris.com/consulting/resources/blog/eu-pay-transparency-directive-the-2026-deadline-reshaping-hr-across-europe)
