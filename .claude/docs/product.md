# Product: MVP, Build Status

## Tier-Strategie (Stand 2026-05-14)

Das Pricing folgt der EU-Richtlinie 2023/970 (siehe `@.claude/docs/law.md` §3):

| Tier | MA-Range | Pflicht nach EU-Richtlinie | Pitch |
|---|---|---|---|
| **Basis** (€149/mo) | 1–50 MA (technisch 52 mit Puffer) | Keine Berichtspflicht — nur Auskunftsanspruch + Recruiting-Transparenz | "Wenn jemand fragt oder klagt, hast du Antworten." Monitoring + Decision-Doc, kein Berichts-Export. |
| **Professional** (€299/mo) | 51–249 MA | Berichtspflicht greift (ab 2027 / 2031) | "Bericht auf Knopfdruck + Joint Assessment vorbereitet." |
| **Enterprise** (custom) | 250+ MA | Jährlicher Bericht ab Juni 2027 | "Audit-Defense, SSO, Multi-Entity." |

**Basis-Tier umfasst:** Job-Profile, Pay-Bands, Departments, Job-Levels, Employees (bis 50 + 2 Puffer), **Decision Documentation** (`salary_decisions`), **interne Pay-Gap-Analyse**, info_requests, job_postings, audit_logs, 1 Admin + 1 HR.

**Basis-Tier umfasst NICHT:** PDF-Berichte, Trend-Analyse, Joint Pay Assessment, Lawyer Reviews (one-time Add-on €799 separat verfügbar), SSO, Auditor-Zugang.

**Lawyer-Add-on:** One-time €799 / €399 Renewal — kaufbar in jedem Tier (auch Basis). Stripe-Flow noch nicht gebaut → Roadmap.

---

## MVP-Szenario (Stand 2026-05-12)

**Ein-Satz-MVP:** _Eine HR-Leiterin loggt sich ein, legt ihre Compliance-Daten an, sieht Pay-Gaps, dokumentiert Gehaltsentscheidungen — und kann nach Plan-Limit weitere Team-Mitglieder einladen._

**Happy Path (Single-User-Standard):**
1. HR-Leiterin signt sich auf `klargehalt.de/preise` → Stripe Checkout (oder 14-Tage-Trial) → Sign-up
2. Onboarding: wählt "Ich bin HR-Manager" + Firmendaten + Plan → wird **automatisch `owner`** ihrer Organisation
3. Sie legt allein an: Departments → Job-Profile → Job-Levels → Pay-Bands → Mitarbeiter
4. Sie sieht Gaps in `/dashboard/pay-equity-hr` und PayGapReport
5. Sie dokumentiert Salary-Decisions (Hire/Raise/Promotion) in EmployeesView
6. Bei Bedarf: lädt weitere Team-Mitglieder ein (admin / hr_manager) im **Billing-Bereich**, gemäß Plan-Limits

**Erste Person = Owner.** Die im Onboarding selbst-gewählte Rolle (`selfReportedRole`) ist nur Analytics. Der erste User einer Organisation bekommt immer `role: 'owner'` in `organization_members`. Das ist der Inhaber des Tenant. Bei Einladungen wählt der Owner explizit die Rolle.

**Was im MVP NICHT enthalten ist (post-MVP):**
- `auditor`-Rolle (Enterprise, später)
- Lawyer-Cleanup-Job für abgelaufene Reviewer
- `user_roles`-Tabelle endgültig droppen (Code liest schon aus `organization_members`)
- Employee-Self-Service-Logins (Mitarbeiter sehen eigenen Lohn) — Records bleiben datenseitig

---

## Build Status (2026-05-12)

**Done:** Job Profiles, Pay Bands, Job Levels, Departments, Pay Gap Report, HR Pay Equity, Audit Logs, Lawyer Dashboard/Reviews/Badge, Joint Assessment, Compliance Score, RBAC, Stripe Billing, Super-Admin Panel, salary decision documentation.

**Product core status:**

| Area | Status |
|---|---|
| `salary_decisions` table + append-only trail | ✅ built |
| Decision Documentation UI in EmployeesView | ✅ built |
| Lawyer ↔ Decision link | ✅ built via optional `lawyer_review_id` |

`salary_decisions` schema (append-only, no UPDATE/DELETE via RLS):
```
employee_id, decision_type (hire|raise|promotion|band_change|correction),
old_salary, new_salary, justification_text (required),
justification_factors JSON, decided_by_user_id, decided_at,
pay_band_id (snapshot), comparator_data JSON (snapshot at write),
lawyer_review_id FK
```
