# Product: MVP, Build Status

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
