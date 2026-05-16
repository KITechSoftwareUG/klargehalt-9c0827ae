# Access & Deployments

> **Operative Single Source of Truth** für Coolify, Supabase, Logto, Sentry, Stripe und das GitHub-Repo. Tokens/Secrets sind hier **nie** im Klartext — sie liegen in `~/.bashrc` (CLI-Tools) bzw. in Coolify Env Vars (Runtime).

---

## 1. GitHub

- **Repo:** [KITechSoftwareUG/klargehalt-9c0827ae](https://github.com/KITechSoftwareUG/klargehalt-9c0827ae)
- **Default branch:** `main` (deploys to both `app.*` und Marketing — siehe §3)
- **CLI:** authentifiziert als `KITechSoftwareUG`, Token in `~/.config/gh/hosts.yml`
- **PR-Workflow:** jede Änderung über `feature/*`-Branch + PR, niemals direkt auf `main` pushen

---

## 2. Coolify (Self-hosted)

- **Console:** https://coolify.klargehalt.de
- **Server:** `85.215.219.202` (SSH-Key-only, kein Password-Login)
- **API-Token:** `~/.bashrc` als `$COOLIFY_TOKEN`

### 2.1 Projekte (4)

| Projekt | UUID | Inhalt |
|---|---|---|
| `klargehalt` | `cijcpjf9d94vrgyhkb1y6fvm` | Next.js App (`app.klargehalt.de`) |
| `klargehalt-landingpage` | `qqubklvo2plewcm3gx08ba13` | Marketing Next.js (`klargehalt.de` + `www.`) |
| `klargehalt-authentification` | `aeoj9el1f8g5gdvglanqmo07` | Logto (`auth.klargehalt.de`) |
| `klargehalt-db` | `scza7s6zfz6g0jtq31vu4wmo` | (intern — DB-/Service-Layer für Logto, falls vorhanden) |

### 2.2 Applications (für Deploy / Restart / Cron)

| App | UUID | FQDN |
|---|---|---|
| Logto | `ny3741zf7n7yun8fgpm2ihyt` | https://auth.klargehalt.de |
| Next.js App | `v5p64dvnh80subyrs1nbla9b` | https://app.klargehalt.de |
| Next.js Marketing | `arr98w1h25xc16wd35xuwcjn` | https://klargehalt.de · https://www.klargehalt.de |

**Deployment-Architektur:** Gleicher Repo-Build (`KITechSoftwareUG/klargehalt-9c0827ae:main`) läuft zweimal — als App (`v5p…`) und als Marketing (`arr98…`). `middleware.ts` routet per Host-Header.

### 2.3 Deploy / Restart Commands

> ⚠️ Footgun: `POST /applications/{uuid}/deploy` liefert **404**. Nur die Query-Param-Variante funktioniert.

```bash
# Deploy
curl -X POST -H "Authorization: Bearer $COOLIFY_TOKEN" \
  "https://coolify.klargehalt.de/api/v1/deploy?uuid={uuid}&force=false"

# Restart
curl -X POST -H "Authorization: Bearer $COOLIFY_TOKEN" \
  https://coolify.klargehalt.de/api/v1/applications/{uuid}/restart
```

**Webhooks sind unzuverlässig** → nach jedem `git push main` muss der Deploy explizit via API getriggert werden (sowohl für App als auch Marketing — beide UUIDs deployen).

### 2.4 Scheduled Tasks (Coolify Cron)

API-Pfad: `/api/v1/applications/{uuid}/scheduled-tasks`
Felder: `name`, `command`, `frequency` (cron), optional `container`, `timeout` (default 300s).
Commands laufen im App-Container → `$CRON_SECRET` und alle Env Vars sind verfügbar.

```bash
# List
curl -H "Authorization: Bearer $COOLIFY_TOKEN" \
  https://coolify.klargehalt.de/api/v1/applications/{uuid}/scheduled-tasks
# Create
curl -X POST -H "Authorization: Bearer $COOLIFY_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"...","command":"...","frequency":"0 3 * * *"}' \
  https://coolify.klargehalt.de/api/v1/applications/{uuid}/scheduled-tasks
# Delete
curl -X DELETE -H "Authorization: Bearer $COOLIFY_TOKEN" \
  https://coolify.klargehalt.de/api/v1/applications/{uuid}/scheduled-tasks/{task-uuid}
```

**Aktive Tasks auf Next.js App (`v5p64dvnh80subyrs1nbla9b`):**

| Name | Frequency | Command (kurz) |
|---|---|---|
| `stripe-reconcile-daily` | `0 3 * * *` UTC | `GET /api/cron/stripe-reconcile` |

> Cron für `trial-reminder` und `cleanup_expired_trial_accounts` (pg_cron) sind **noch nicht produktiv** — siehe `@.claude/docs/operations.md` Hard Failure Modes #3 und #9.

> **Bei Deploy von `feature/account-deletion` anzulegen** (nach `supabase db push` der Migration `20260516120000`): Scheduled Task `account-cleanup-daily`, `frequency: "0 4 * * *"` UTC, Command `curl -fsS -H "x-cron-secret: $CRON_SECRET" https://app.klargehalt.de/api/cron/account-cleanup` — pseudonymisiert Tenants nach Ablauf der 30-Tage-Löschfrist. Ohne diesen Task bleibt PII über die 30-Tage-Zusage hinaus erhalten (Operations #11).

---

## 3. Supabase

- **Project ref:** `btbucjkczpejplykyvkj` (Region: West EU / Ireland)
- **Dashboard:** https://supabase.com/dashboard/project/btbucjkczpejplykyvkj
- **CLI:** `/usr/local/bin/supabase` v2.90.0, Token in `~/.bashrc` als `$SUPABASE_ACCESS_TOKEN`

```bash
# Vor jedem db push erforderlich
supabase link --project-ref btbucjkczpejplykyvkj
supabase db push
```

**⚠️ Free-Tier-Pause:** Projekt pausiert nach Inaktivität. Wenn CLI-Calls 5xx zurückgeben → Dashboard öffnen, "Unpause" klicken. Backup-Policy: täglich, 7 Tage Retention; PITR wäre Pro-Plan.

**Verbindung zur App:**
- `NEXT_PUBLIC_SUPABASE_URL` — Public Edge-URL (in Coolify Env)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon Key (RLS-gegated, ok im Client)
- `SUPABASE_SERVICE_ROLE_KEY` — **bypasst RLS**, nur in Server-Code (`/api/webhooks/*`, `/api/cron/*`). Siehe `@.claude/docs/security.md` §3.

---

## 4. Logto (Auth)

- **Console:** https://auth.klargehalt.de (Logto Admin-UI)
- **Tenant-Selbsthosting:** läuft in Coolify-App `ny3741zf7n7yun8fgpm2ihyt`
- **OIDC-Endpoints:** Issuer = `https://auth.klargehalt.de`

**Env Vars (in Coolify gesetzt, niemals committen):**
- App-Credentials (User-Login-Flow): `LOGTO_APP_ID`, `LOGTO_APP_SECRET`, `LOGTO_COOKIE_SECRET`, `LOGTO_ENDPOINT`, `APP_BASE_URL`
- M2M-Credentials (Management-API): `LOGTO_M2M_APP_ID`, `LOGTO_M2M_APP_SECRET`, `LOGTO_MANAGEMENT_API_RESOURCE`
- Webhook-Verifikation: `LOGTO_WEBHOOK_SECRET`

**App vs. M2M streng getrennt** — siehe `@.claude/docs/security.md` §2. M2M nur in Server-Routes für Org/Member-Management.

---

## 5. Sentry

- **Org:** `kitech-software-ug-haftungsbes`
- **Project:** `klargehalt`
- **Dashboard:** https://kitech-software-ug-haftungsbes.sentry.io/projects/klargehalt/
- **PII-Scrubbing aktiv** für `email`, `name`, `salary`, `gender`, `ip` — siehe `@.claude/docs/security.md` §5
- **Release-Tracking:** via Coolify-Deploy (Source-Maps werden hochgeladen, sind privat)

CLI-Auth (falls verwendet): Sentry CLI via `~/.sentryclirc` oder `SENTRY_AUTH_TOKEN` Env.

---

## 6. Stripe

- **Dashboard:** https://dashboard.stripe.com (Account: KITech Software UG)
- **Mode:** Live + Test getrennt — Production läuft auf Live-Keys in Coolify Env
- **Webhook-Endpoint:** `https://app.klargehalt.de/api/webhooks/stripe` (Secret: `STRIPE_WEBHOOK_SECRET`)
- **Price-IDs in Env:** `STRIPE_PRICE_BASIS_MONTHLY/YEARLY`, `STRIPE_PRICE_PROFESSIONAL_MONTHLY/YEARLY`
- **Reconcile:** `GET/POST /api/stripe/reconcile` (siehe `@.claude/docs/operations.md` Failure Modes #1/#2)
- **Daily Cron:** `stripe-reconcile-daily` — siehe §2.4 oben

---

## 7. Sonstige Services

| Service | Verwendung | Zugang |
|---|---|---|
| **Resend** | Transactional Mails (`noreply@klargehalt.de`) | `RESEND_API_KEY` Env · Dashboard: https://resend.com/ |
| **Google Gemini** | AI-Features (Pay-Gap-Insights, etc.) | `GOOGLE_GEMINI_API_KEY` Env · Console: https://aistudio.google.com/ |
| **Cloudflare** | DNS + Proxy für `klargehalt.de` + Subdomains | Cloudflare Dashboard (Owner: Ayham) |
| **Microsoft 365** | Business-Mailboxen | https://admin.microsoft.com (Owner: Ayham) |

---

## 8. Standard-Deployment-Flow

```bash
# 1. Feature-Branch + PR + Merge auf main (siehe §1)

# 2. Lokal main pullen
git checkout main && git pull

# 3. Deploy beider Apps (Webhooks sind unzuverlässig!)
curl -X POST -H "Authorization: Bearer $COOLIFY_TOKEN" \
  "https://coolify.klargehalt.de/api/v1/deploy?uuid=v5p64dvnh80subyrs1nbla9b&force=false"   # App
curl -X POST -H "Authorization: Bearer $COOLIFY_TOKEN" \
  "https://coolify.klargehalt.de/api/v1/deploy?uuid=arr98w1h25xc16wd35xuwcjn&force=false"   # Marketing

# 4. Verifikation: Sentry-Dashboard + manuell https://app.klargehalt.de prüfen
```

Bei DB-Migrationen zusätzlich vor Schritt 3:
```bash
supabase link --project-ref btbucjkczpejplykyvkj
supabase db push
```
