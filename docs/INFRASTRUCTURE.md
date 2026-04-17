# Infrastructure & Operations Runbook

## Service Topology

```
Internet → Cloudflare (DNS + SSL) → Hetzner VPS → Coolify (Traefik)
                                                      ├── Next.js App      (app.klargehalt.de)
                                                      ├── Next.js Marketing (klargehalt.de)
                                                      ├── Logto Auth       (auth.klargehalt.de)
                                                      └── Postgres 16      (Logto internal DB)

External: Supabase (managed, EU-West) — application database
External: Stripe — billing
External: Sentry — error tracking
```

## Coolify Application UUIDs

| App | UUID | Image/Repo |
|---|---|---|
| Next.js App | `v5p64dvnh80subyrs1nbla9b` | `klargehalt-9c0827ae:main` |
| Next.js Marketing | `arr98w1h25xc16wd35xuwcjn` | `klargehalt-9c0827ae:main` |
| Logto Auth | `ny3741zf7n7yun8fgpm2ihyt` | `svhd/logto:1` (pinned) |
| Logto Postgres | Container: `px04ph5sm4fbszjmylh0pz3i` | `postgres:16-alpine` |

## Container Resource Limits

| Container | CPU | Memory |
|---|---|---|
| Next.js App | 2 cores | 2048 MB |
| Next.js Marketing | 2 cores | 2048 MB |
| Logto Auth | 1 core | 1024 MB |

## Health Checks

Both Next.js containers: `GET /api/healthz` every 30s.
Returns 200 if all required env vars are present, 503 otherwise.
Response does NOT leak env var names (server-side logs only).

## Firewall (UFW)

```
22/tcp   ALLOW   SSH (key-only, password auth disabled)
80/tcp   ALLOW   HTTP (redirects to HTTPS)
443/tcp  ALLOW   HTTPS
Default: DENY incoming, ALLOW outgoing
```

## SSH Security

- Root login: **disabled** (`PermitRootLogin no`)
- Password authentication: **disabled** (`PasswordAuthentication no`)
- Only key-based auth via `deploy` user

## Backup Strategy

### Logto Database
- Script: `/home/deploy/backups/logto/backup-logto-db.sh`
- Schedule: Daily at 03:00 UTC via cron
- Retention: 14 days
- Location: `/home/deploy/backups/logto/logto_YYYYMMDD_HHMMSS.sql.gz`
- Log: `/home/deploy/backups/logto/backup.log`

### Restore Logto from Backup
```bash
gunzip -c /home/deploy/backups/logto/logto_XXXXXXXX_XXXXXX.sql.gz | \
  docker exec -i px04ph5sm4fbszjmylh0pz3i psql -U postgres postgres
```

### Supabase
Managed by Supabase (automated daily backups on paid plan).
Manual export: `supabase db dump --project-ref btbucjkczpejplykyvkj`

### VPS Snapshots
Configure Hetzner automated snapshots (daily) via Hetzner Cloud Console.

## Deployment Flow

```
git push origin main
  → Coolify webhook fires
  → Builds Docker image from repo
  → Deploys to app.klargehalt.de + klargehalt.de (same image, two containers)
  → Sentry source maps uploaded automatically
```

### Manual Redeploy
```bash
# App
curl -X POST -H "Authorization: Bearer $COOLIFY_TOKEN" \
  https://coolify.klargehalt.de/api/v1/applications/v5p64dvnh80subyrs1nbla9b/restart

# Marketing
curl -X POST -H "Authorization: Bearer $COOLIFY_TOKEN" \
  https://coolify.klargehalt.de/api/v1/applications/arr98w1h25xc16wd35xuwcjn/restart
```

## Security Architecture

### Auth Flow
```
Browser → middleware.ts (edge, Logto session check)
  → getServerAuthContext() (server, validates claims)
    → Supabase RLS (final enforcement via org JWT)
```

### Service Role Key Policy
`SUPABASE_SERVICE_ROLE_KEY` bypasses ALL RLS policies. Usage is restricted to:
- Webhook handlers (`/api/webhooks/stripe`, `/api/webhooks/logto`) — system-to-system, no user context
- Auth repair routes (`/api/auth/repair-role`, `/api/auth/organizations`) — chicken-and-egg bootstrapping only

**Never use service role in user-facing routes.** Always use `createClient()` from `lib/supabase/server.ts`.

### Webhook Security
- Stripe: HMAC signature verified via `stripe.webhooks.constructEvent()` with raw body
- Logto: HMAC-SHA256 signature verified via `logto-signature-sha-256` header (with backwards-compatible shared-secret fallback during migration)

## Secret Rotation

| Secret | Rotation frequency | How to rotate |
|---|---|---|
| `LOGTO_COOKIE_SECRET` | Quarterly | Update in Coolify env → redeploy → existing sessions invalidated |
| `STRIPE_WEBHOOK_SECRET` | Quarterly | Regenerate in Stripe Dashboard → update Coolify env → redeploy |
| `LOGTO_WEBHOOK_SECRET` | Quarterly | Update in Logto admin + Coolify env → redeploy |
| `SUPABASE_SERVICE_ROLE_KEY` | On compromise only | Regenerate in Supabase Dashboard → update Coolify env → redeploy |

## Monitoring

- **Sentry**: Error tracking (org: `kitech-software-ug-haftungsbes`, project: `klargehalt`). Traces sampled at 20%. Environment tag set from `NODE_ENV`.
- **Uptime monitor**: `/home/deploy/scripts/uptime-monitor.sh` runs every 5 min via cron. Checks app healthz, marketing, and auth OIDC endpoints. Status written to `/home/deploy/scripts/uptime-status.json`.
- **Health check**: `/api/healthz` endpoint validates all required env vars. Does NOT leak var names in responses.
- **Coolify dashboard**: `https://coolify.klargehalt.de` — container status, build logs
- **Secret rotation**: Quarterly reminder cron (Jan/Apr/Jul/Oct). Log at `/home/deploy/scripts/rotation-reminders.log`.

## Logto Webhook Signing

Logto auto-generates a unique `signingKey` per webhook. The handler accepts multiple keys:
- `LOGTO_WEBHOOK_SECRET` — shared secret (backwards compat)
- `LOGTO_WEBHOOK_SIGNING_KEY_1` — HMAC key for "Supabase Org Sync" webhook
- `LOGTO_WEBHOOK_SIGNING_KEY_2` — HMAC key for "Supabase User Sync" webhook

The handler tries HMAC-SHA256 (`logto-signature-sha-256` header) first, falls back to shared-secret.

## Cron Jobs

| Schedule | Script | Purpose |
|---|---|---|
| `0 3 * * *` | `/home/deploy/backups/logto/backup-logto-db.sh` | Daily Logto DB backup |
| `*/5 * * * *` | `/home/deploy/scripts/uptime-monitor.sh` | Uptime checks (app, marketing, auth) |
| `0 9 1 1,4,7,10 *` | `/home/deploy/scripts/secret-rotation-reminder.sh` | Quarterly rotation reminder |

## Provisioning a New VPS from Scratch

1. Provision Hetzner VPS (CX31+), Ubuntu 24.04
2. Create `deploy` user, add SSH key, disable root/password login
3. Enable UFW: allow 22, 80, 443
4. Install Coolify: `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash`
5. Configure Coolify projects (4 projects — see CLAUDE.md)
6. Add all environment variables from `.env` template
7. Connect GitHub repo webhook
8. Deploy Logto (`svhd/logto:1`) with Postgres 16
9. Deploy Next.js app + marketing containers
10. Set up Logto backup cron
11. Enable Hetzner automated snapshots
12. Verify: health check, auth flow, Stripe webhook, Sentry

## Remaining Manual Actions

These require browser access to external dashboards and cannot be automated from the CLI:

1. **Restrict Logto admin console** — Coolify's basic auth is domain-wide and would break OIDC. Use Cloudflare Access with a path rule for `/console/*` instead, or set up a VPN/WireGuard for admin access.
2. **Restrict Coolify dashboard** — Same: Cloudflare Access tunnel or IP allowlist via Cloudflare WAF rules for `coolify.klargehalt.de`.
3. **Enable Hetzner daily snapshots** — Via Hetzner Cloud Console > Server > Snapshots > Enable automated backups.
4. **External uptime alerting** — The local cron script monitors uptime but cannot send push notifications. Register `https://app.klargehalt.de/api/healthz` with UptimeRobot or Betterstack for SMS/email alerts.
