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
3. Landet im **Setup-Hub** (`/einrichtung`) mit Phasen-Übersicht und Workshop-Shortcuts
4. Strukturdaten anlegen über die Workshops: Struktur (`/einrichtung/struktur` — Abteilungen + Karrierestufen kombiniert), Vergütung (`/einrichtung/verguetung` — 2D-Matrix Job-Profile × Karrierestufen), oder direkt in den Einzelroutes (`/abteilungen`, `/karrierestufen`, `/jobprofile`, `/gehaltsbaender`)
5. Mitarbeiter importieren via CSV-Wizard (`/einrichtung/mitarbeiter`) mit Fuzzy-Header-Matching + Gemini-AI-Mapping-Banner
6. Pay-Gaps sieht sie im `/dashboard` (Compliance-Score + Pay-Gap-Karten)
7. Salary-Decisions (Hire/Raise/Promotion) dokumentiert sie in `/mitarbeiter` via `SalaryDecisionDialog`
8. Bei Bedarf: lädt weitere Team-Mitglieder ein (admin / hr_manager) im **Abrechnung** (`/abrechnung`), gemäß Plan-Limits

**Erste Person = Owner.** Die im Onboarding selbst-gewählte Rolle (`selfReportedRole`) ist nur Analytics. Der erste User einer Organisation bekommt immer `role: 'owner'` in `organization_members`. Das ist der Inhaber des Tenant. Bei Einladungen wählt der Owner explizit die Rolle.

**Was im MVP NICHT enthalten ist (post-MVP):**
- `auditor`-Rolle (Enterprise, später)
- Lawyer-Cleanup-Job für abgelaufene Reviewer
- `user_roles`-Tabelle endgültig droppen (Code liest schon aus `organization_members`)
- Employee-Self-Service-Logins (Mitarbeiter sehen eigenen Lohn) — Records bleiben datenseitig

---

## Build Status (Stand 2026-05-15)

**Done:** Job Profiles, Pay Bands, Job Levels, Departments, Pay Gap Report, HR Pay Equity, Audit Logs, Compliance-Workflow (kombiniert Lawyer Reviews + Joint Assessment), Compliance Score, RBAC, Stripe Billing (inkl. Cancel-Lifecycle, SCA, Disputes, Refunds), Super-Admin Panel, Salary Decision Documentation, **Setup-Hub mit 5 Phasen**, **CSV-Import mit Gemini-AI-Mapping**, **Basis-Tier-Repositioning** (Sidebar Pro-Locks + `/preise`-Spalte umpositioniert), **Inline-Create-Pattern** für Selects, **Daten-Migration-Sektion** in Einstellungen, **Diagnostic Error Messages** im Import.

**Recently shipped (PR-Liste, Mai 2026):**
- #28 — Stripe SCA + Dispute Closure + customer.updated events
- #29 — `payment_issue='action_required'` CHECK constraint
- #31 — Security audit remediation (1 P0, 7 P1, 6 P2)
- #33–#41 — Setup-Hub Phasen 1–5 (Hub-Hub, Struktur-Workshop, Vergütungs-Matrix, CSV-Import, Inline-Create) + KI-CSV-Mapping + Basis-Tier-Repositioning
- #40 — Evaluation-Method-Info-Box für Job-Profiles
- #42 — Diagnostische Fehlermeldungen statt "Fehler beim Erstellen"
- #43 — `pay_gap_snapshots` Schema-Drift behoben (Migration `20260515150000`)

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
