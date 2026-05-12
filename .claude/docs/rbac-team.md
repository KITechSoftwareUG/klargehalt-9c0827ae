# RBAC, Team Members & Subscription

## RBAC

**Authoritative Tabelle:** `organization_members` (Migration `20260509020000`). Die alte `user_roles`-Tabelle existiert noch für Rückwärtskompatibilität, wird aber im post-MVP gedroppt. Alle neuen Reads gehen gegen `organization_members`.

| Role | Access | Created via |
|---|---|---|
| `owner` | Volles Zugriff + nicht entfernbar (Tenant-Inhaber) | Auto beim Onboarding (erste Person) |
| `admin` | Volles Zugriff (Billing, Audit, Settings, alle Daten) | Invite durch owner/admin |
| `hr_manager` | Mitarbeiter, Pay-Bands, Job-Profile, Reports — KEIN Billing/Audit/Settings | Invite durch owner/admin |
| `employee` | Datensatz-Träger ohne Portal-Zugang (Sidebar leer) — eigener Lohn read-only via RLS | Manuell durch HR (`employees.user_id` optional) |
| `lawyer` | Read salary_decisions/bands/reports; write `lawyer_reviews`; time-limited (default 90d) | Service-role only |
| `auditor` | Reserviert für Enterprise — noch nicht in UI | post-MVP |

Super-admin: hardcoded Logto user ID check in `/api/admin/users` + `/dashboard/admin` (not a DB role).

```tsx
<RoleGuard roles={['admin', 'hr_manager']}><Component /></RoleGuard>
const canEdit = useRoleAccess('admin', 'hr_manager')
```

Real enforcement is always Supabase RLS — frontend gating is UX only.

**Helpers (RLS-side):**
- `public.org_id()` — extracts org from JWT `aud` claim
- `public.is_org_admin()` — `owner` OR `admin`, status active, not expired
- `public.is_hr_or_admin()` — `owner`, `admin` OR `hr_manager`, status active, not expired
- `public.is_org_member()` — any active member with valid access window

---

## Team Members (Invite-Flow)

**Plan-Limits** (Tabelle `plans`):

| Plan | max_admin_seats | max_hr_seats | max_employee_records |
|---|---|---|---|
| `basis` | 1 | 1 | 50 |
| `professional` | 5 | unlimited (-1) | 250 |
| `enterprise` | unlimited | unlimited | unlimited |

`owner`-Sitz zählt mit zu `max_admin_seats`. Trigger `check_org_member_seat_limit()` enforced auf DB-Ebene mit `pg_advisory_xact_lock`.

**Invite-Flow (Team-Mitglieder, NICHT employee-Records):**
1. Owner/Admin öffnet `/dashboard/billing` → Sektion "Team-Mitglieder"
2. Klickt "Einladen" → Email + Rolle (admin / hr_manager) eingeben
3. `POST /api/members/invite` → `inviteMemberToOrg()` in `lib/logto-management.ts`:
   - Findet oder erstellt Logto-User mit Email
   - Fügt zu Logto-Org hinzu
   - Schreibt `organization_members` Row (status=`active`, gewählte Rolle)
   - Trigger prüft Seat-Limit, blockiert mit Upgrade-Hinweis bei Überschreitung
4. Eingeladener User loggt sich mit Email + temp Passwort ein, ändert Passwort

**Member-Management:**
- `GET /api/members` — Liste aller aktiven Members + Seat-Usage
- `PATCH /api/members/[id]` — Rolle ändern (admin ↔ hr_manager). `owner` kann nicht degradiert werden.
- `DELETE /api/members/[id]` — Member entfernen (status=`removed`). `owner` kann nicht entfernt werden.

**Employee-Invites** (separate Flow): `POST /api/employees/invite` mit `employeeId` — gibt einem bestehenden `employees`-Record einen Logto-Login mit `employee`-Rolle. Nicht Teil des MVP-Team-Flows.

---

## Subscription & Feature Flags

Tiers: `basis` (€149/mo, €1490/yr) | `professional` (€299/mo, €2690/yr) | `enterprise` (on request).
14-day trial at `professional`. `getEffectiveTier()`: `active`/`trialing` → full | `past_due`/`canceled` → `basis`.

| Feature flag | Tier |
|---|---|
| `pay_gap_analysis`, `pdf_reports`, `trend_analysis`, `decision_documentation`, `lawyer_review`, `priority_support`, `advanced_audit` | professional |
| `sso`, `custom_integrations` | enterprise |

Helpers: `hasFeature()`, `getEffectiveTier()`, `getTrialDaysRemaining()` in `lib/subscription.ts` (server: `lib/subscription-server.ts`).

**Anwaltsprüfung add-on:** €799 one-time / €399 renewal. Professional+ only. Independent lawyer, not KlarGehalt employee.
