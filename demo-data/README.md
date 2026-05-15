# KlarGehalt — Demo Account

Hard-coded demo for live customer demos of the **Basis tier**. Run the seed script,
log in with the credentials below, and walk through the prepared story arc — no
manual data entry during the demo.

---

## 1. Credentials (hard-coded, change in `scripts/seed-demo.mjs`)

| | |
|---|---|
| **Login URL** | https://app.klargehalt.de/sign-in |
| **Owner email** | `demo@klargehalt.de` |
| **Owner password** | `KlarDemo2026!` |
| **HR manager email** *(optional 2nd seat)* | `demo-hr@klargehalt.de` |
| **HR manager password** | `KlarDemo2026!` |
| **Company** | Müller & Schmidt Consulting GmbH (Berlin) |
| **Tier** | Basis (1–50 MA), 30 employees seeded |

> Both Logto users are real and will get a welcome email from `noreply@klargehalt.de`
> on first creation — the mailboxes don't exist, so the mails bounce silently. Not
> a problem for the demo.

---

## 2. Run the seed

The script needs:
- The app's Logto + Supabase env vars (LOGTO_*, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- `SUPABASE_ACCESS_TOKEN` — the Supabase Management API token (used to toggle
  triggers around the bulk insert; needed for service-role to bypass the
  pay-gap recompute guard).

### Run from inside the Coolify container (recommended)

The Next.js app container already has all app env vars. We pass the management
token through:

```bash
# On the VPS
CONTAINER=$(docker ps --format '{{.Names}}' | grep '^v5p64dvnh80subyrs1nbla9b')
docker cp scripts/seed-demo.mjs "$CONTAINER":/app/scripts/seed-demo.mjs
docker exec \
  -e SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" \
  -e SUPABASE_PROJECT_REF=btbucjkczpejplykyvkj \
  "$CONTAINER" sh -c 'cd /app && node scripts/seed-demo.mjs'
```

After the next deploy the script lives at `/app/scripts/seed-demo.mjs` inside
the container natively, so the `docker cp` step is only needed before the PR
is merged.

For `--reset` or `--teardown`, append the flag:
```bash
docker exec -e SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" \
  -e SUPABASE_PROJECT_REF=btbucjkczpejplykyvkj "$CONTAINER" \
  sh -c 'cd /app && node scripts/seed-demo.mjs --reset'
```

### Run locally with `.env.demo`

Create `.env.demo` at repo root (gitignored) with the keys from Coolify + your
Supabase Management API token, then:

```bash
npm run demo:seed       # fresh idempotent seed
npm run demo:reset      # wipe + reseed
npm run demo:teardown   # remove everything (Logto + Supabase)
```

---

## 3. What gets seeded

| Table | Rows | Notes |
|---|---:|---|
| `companies` | 1 | Müller & Schmidt Consulting GmbH, Basis tier active |
| `organization_members` | 2 | Sandra (owner), Markus (hr_manager) |
| `profiles` | 2 | One per Logto user |
| `user_roles` (legacy) | 2 | mirrored for backward compat |
| `departments` | 5 | Engineering, Vertrieb, Marketing, HR & Operations, Finanzen |
| `job_levels` | 5 | Junior, Mid, Senior, Lead, Principal |
| `job_profiles` | 10 | Software Engineer, DevOps, PM, QA, AE, SDR, Marketing, HRBP, Controller, Buchhalter |
| `pay_bands` | 15 | Realistic 2026 German Mittelstand bands (EUR) |
| `employees` | 30 | 16 ♂ / 14 ♀, hire dates 2014–2024, all in Berlin/München |
| `salary_decisions` | ≥36 | 30 hires + 4 raises + 2 promotions — each with German justification text |
| `info_requests` | 3 | open / fulfilled / **overdue** |
| `audit_logs` | **skipped** | Prod's `trg_audit_log_chain_hash` references obsolete `before_state`/`after_state` columns (renamed to `changes`). Seed skips this table; the `/dashboard/audit` view loads empty and gets populated as you click around during the demo. Frame to the prospect: "wird mit jeder Aktion gefüllt." |
| `job_postings` | 3 | 1 published (salary disclosed), 1 draft, 1 closed |
| `pay_gap_snapshots` | 5 | company + Engineering + Vertrieb + SWE Sr + AE Mid |

---

## 4. Engineered pay gaps (the demo punchline)

The seed deliberately produces **two flagged gender gaps > 5%** so the
`/dashboard/pay-equity-hr` view shows real signal. Everything else is
within ±3% (clean comparators).

| Cohort | Men avg | Women avg | Gap | Status |
|---|---:|---:|---:|---|
| **Software Engineer · Senior** (Berlin) | ~88.0 k | ~78.5 k | **~10.8 %** | warning |
| **Account Executive · Mid** (München) | ~66.0 k | ~58.0 k | **~12.1 %** | breach |
| All other (profile × level) cohorts | — | — | < 3 % | compliant |

These map to the EU 2023/970 Art. 10 trigger ("> 5 % unerklärt → Joint
Assessment innerhalb 6 Monaten"). In Basis we surface them as monitoring
flags — the formal Joint-Assessment workflow is a Professional feature.

---

## 5. Live-demo walkthrough (≈ 15 min)

> **Pitch:** "Wenn jemand morgen fragt oder klagt — Sie sind vorbereitet,
> und ein externer Rechtsberater hat es schon geprüft."
> Never say "rechtssicher" or "gesetzlich geprüft".

### 1. Login + Dashboard (1 min)
- Open https://app.klargehalt.de/sign-in
- Login as `demo@klargehalt.de`
- Land on `/dashboard` — show overview cards (employees, departments, decision count, gap status)

### 2. Comp Structure (3 min) — _"Wir haben das Fundament gebaut"_
- `/dashboard/departments` — 5 deutsche Abteilungen
- `/dashboard/job-levels` — Junior → Principal mit Ranking
- `/dashboard/job-profiles` — 10 Profile mit 4-Faktor-Bewertung (skills/effort/responsibility/conditions) → **das ist "gleichwertige Arbeit"**
- `/dashboard/pay-bands` — 15 Bands, EUR, gültig ab 01.01.2026

### 3. Employees (2 min) — _"30 Mitarbeitende, voll dokumentiert"_
- `/dashboard/employees` — Listenansicht, Filter nach Dept/Level
- Click **Anna Schulz** (Senior SWE, Gap A ♀) → Modal öffnet
  - Personal data, Job-Klassifikation, base_salary
  - **Tab "Entgeltentscheidungen"** → Hire-Decision sichtbar mit Begründung
  - Highlight: "Diese Begründung ist die Beweislastumkehr-Verteidigung."

### 4. Pay Equity HR (3 min) — _**die Demo-Pointe**_
- `/dashboard/pay-equity-hr`
- Company-level Gap zeigt sich
- Scroll → 2 Gruppen mit **warning** / **breach** Status:
  - **Software Engineer Senior**: 10,8 % (warning)
  - **Account Executive Mid**: 12,1 % (breach, würde Joint Assessment triggern)
- "Heute siehst du die Lücken intern. In der Professional-Stufe kommt der formale Joint-Assessment-Workflow dazu."

### 5. Info Requests (2 min) — _"Auskunftsanspruch nach §10 EntgTranspG"_
- `/dashboard/hr-requests`
- 3 Anfragen sichtbar:
  - **Sabrina Weber** (vor 2 Tagen) — open, demonstriere "Antworten"-Klick
  - **Marie Köhler** (vor 5 Tagen) — fulfilled, zeige `response_data` mit Gendered-Breakdown
  - **Anna Schulz** (vor 19 Tagen) — **überfällig** ⚠️ → "Genau hier entsteht Risiko ohne System"

### 6. Decision Trail + Audit (2 min)
- Zurück zu `/dashboard/employees` → klick **Lukas Wagner** (Senior SWE ♂)
  - Tab "Entgeltentscheidungen" zeigt: Hire 2020 → Raise 2024 (Marktanpassung)
- `/dashboard/audit` — append-only Logs, jede Aktion timestamped

### 7. Job Postings (1 min) — _"Recruiting-Transparenz Art. 5"_
- `/dashboard/job-postings`
- 1 veröffentlichte Anzeige: "Senior Backend Engineer 80–100k" mit `export_text`
- "Gehaltsspanne ist automatisch sichtbar — Pflicht aus Art. 5 der EU-Richtlinie."

### 8. Billing + Tier (1 min)
- `/dashboard/billing`
- Plan: Basis · 30/52 MA · 2 Sitze belegt (Owner + HR Manager)
- "Wenn Sie auf 51 MA wachsen, schaltet sich Professional frei — inkl. PDF-Berichte und Joint Assessment."

---

## 6. Reset between demos

If the data is altered during the demo (something added/edited):

```bash
npm run demo:reset
```

This wipes the org's Supabase rows and re-seeds from scratch. Logto users/org stay
intact. Takes ~5 seconds.

---

## 7. Demo hygiene

- **Don't commit `.env.demo`** — it's in `.gitignore` already.
- **Don't promise PDF reports** in Basis — they're Professional-tier.
- **Wording**: "von externem Rechtsberater geprüft" — never "rechtssicher" /
  "gesetzlich geprüft" (see `.claude/docs/law.md` §7).
- Lawyer add-on is one-time €799 / €399 renewal — works in any tier (Stripe flow
  not yet built, mention as roadmap).

---

## 8. File structure

```
demo-data/
  ├── README.md                       ← you are here
  └── mueller-schmidt-content.ts      ← canonical data design doc (reference only,
                                         not consumed by the seed script)
scripts/
  └── seed-demo.mjs                   ← the actual seed (inline data, idempotent)
```

`mueller-schmidt-content.ts` is kept as the **design document** with the full
45-employee company narrative and cross-reference notes. The shipped seed
(`seed-demo.mjs`) implements a tighter 30-employee subset for reliability — same
story arc, fewer edge cases.
