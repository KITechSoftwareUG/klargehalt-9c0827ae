# Phase 0 Hardening — Handoff & Verification

Branch `feature/phase0-hardening`. Code/DB/doc changes are committed. The items
below are **credential- or console-gated** (I cannot do them) or are the
**runtime verification** you must run. Each is tied to a risk from the
architecture review. Nothing here is optional before the first paid customer
unless marked otherwise.

---

## A. Apply the DB migration (user-gated deploy step — Risk #3)

```bash
supabase link --project-ref btbucjkczpejplykyvkj
supabase db push          # applies 20260515190000_pay_gap_trigger_statement_level.sql
```

Then verify the Phase-0 DB invariants in the Supabase SQL editor:

```sql
-- Risk #3: pay_gap triggers must now be STATEMENT-level
SELECT tgname, tgtype, action_timing, action_orientation
FROM information_schema.triggers
JOIN pg_trigger ON tgname = trigger_name
WHERE event_object_table = 'employees' AND tgname LIKE 'trg_refresh_pay_gap%';
-- EXPECT: action_orientation = 'STATEMENT' for all three

-- Risk #8 (already mitigated since 20260507172936 — confirm deployed):
SELECT tgname FROM pg_trigger
WHERE tgrelid = 'public.salary_decisions'::regclass
  AND tgname IN ('trg_prevent_salary_decision_update','trg_prevent_salary_decision_delete');
-- EXPECT: both rows present

-- Risk #3 timing test (proves the O(n^2)->O(n) fix): bulk-insert 250 test
-- rows for a throwaway org in a transaction, time it, then ROLLBACK.
-- EXPECT: seconds, not minutes; ONE pay_gap_snapshots refresh, not 250.
```

## B. Runtime re-test of the cross-tenant fix (Risk #1 — security-sensitive)

With a session for **org A**, in DevTools set `document.cookie="kg_active_org=<org_B_id>; path=/"`, then call each — **every one must return 401/403/404, never org B data**:

- `GET /api/auswertung`
- `GET /api/dashboard/comp-overview`
- `GET /api/job-postings/salary-range?job_profile_id=<any>`
- `GET /api/compliance/assessments`
- `GET /api/compliance/assessments/<an_org_B_assessment_id>`
- `GET /api/reports/pay-gap/pdf`

Then confirm normal single-org usage is unchanged (the same routes return your own org's data when the cookie matches your real org). CI now blocks regressions automatically (`npm run check:tenant-guards`).

## C. Credential-gated infra (Risk #2 / #4 / #6 — must do before paid customers)

| # | Action | Risk | Where | Verify |
|---|---|---|---|---|
| 1 | Supabase → **Pro plan**; enable **PITR**; **disable auto-pause** | #4 | Supabase dashboard (project `btbucjkczpejplykyvkj`) | PITR shows enabled; project does not pause overnight |
| 2 | Coolify → enable scheduled DB backup for Logto Postgres (`databases/px04ph5sm4fbszjmylh0pz3i`) → S3/R2 bucket, 30-day retention | #2 | Coolify console | **Do one test restore** into a throwaway DB |
| 3 | Export secrets off-box, encrypted (`sops`/`age`), commit the encrypted file | #2 | repo + your key | Decrypt on a second machine succeeds |
| 4 | External uptime monitor (UptimeRobot/Better Stack free) on `https://app.klargehalt.de/api/healthz`, `https://auth.klargehalt.de`, + a synthetic Supabase read; alert to email | #6 | monitor service | Trigger a synthetic failure → alert fires |
| 5 | Rotate the leaked **`GOOGLE_GEMINI_API_KEY`** (memory: still active) | #11 | Google AI Studio + Coolify env | Old key 401s; `/api/setup/csv-mapping-suggest` still works |
| 6 | Set `limits_memory` on App + Marketing containers (currently `"0"` = unbounded) | #5 | Coolify console | A PDF render no longer can OOM the host |

> ⚠️ Per `.claude/docs/access.md`: after `supabase db push`, deploy **both**
> Coolify apps (App `v5p64dvnh80subyrs1nbla9b` + Marketing
> `arr98w1h25xc16wd35xuwcjn`) — webhooks are unreliable.

## D. Not done — deliberately deferred (with reason)

| Item | Why deferred |
|---|---|
| pg_cron `expire-ended-trials` cleanup job | Revenue is **already** protected at read-time (`getEffectiveTier` returns `basis` for an expired trial). The cron is hygiene only — not a blocker. Enable later via Supabase SQL editor per `RUNBOOK.md §1`. |
| `salary_decisions` immutability trigger | **Already exists** (`trg_prevent_salary_decision_*`, since `20260507172936`, fires even for service-role). No code needed — review claim was wrong. |
| PDF single-flight lock / job queue | Risk #5 mitigated cheaply by container memory limit (C-6) for now; a render queue is a Phase 2 item, not Phase 0. No premature infra. |
| `transitions` legacy `user_roles` role source | Now safely scoped behind `guardOrgMember`; pure tech-debt, not a security hole. Migrate to `organization_members` in a follow-up. |
