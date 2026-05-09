# KlarGehalt — Infrastructure & Deploy

## CLI Tools (on this server)

| Tool | Auth |
|---|---|
| `gh` (GitHub CLI) | as `KITechSoftwareUG`, token in `~/.config/gh/hosts.yml` |
| `supabase` CLI | `SUPABASE_ACCESS_TOKEN` in `~/.bashrc` |
| `docker` | `deploy` user in docker group |
| `git` | SSH key → `git@github.com:KITechSoftwareUG/klargehalt-9c0827ae.git` |

GitHub repo: `KITechSoftwareUG/klargehalt-9c0827ae`

## Coolify

URL: `https://coolify.klargehalt.de` | API key: `$COOLIFY_TOKEN` in `~/.bashrc`

```bash
curl -H "Authorization: Bearer $COOLIFY_TOKEN" https://coolify.klargehalt.de/api/v1/...
```

### Projects

| Project | UUID |
|---|---|
| `klargehalt` (main app) | `cijcpjf9d94vrgyhkb1y6fvm` |
| `klargehalt-landingpage` | `qqubklvo2plewcm3gx08ba13` |
| `klargehalt-authentification` | `aeoj9el1f8g5gdvglanqmo07` |
| `klargehalt-db` | `scza7s6zfz6g0jtq31vu4wmo` |

### Running Applications

| App | URL | UUID |
|---|---|---|
| Logto Auth | `https://auth.klargehalt.de` | `ny3741zf7n7yun8fgpm2ihyt` |
| Next.js App | `https://app.klargehalt.de` | `v5p64dvnh80subyrs1nbla9b` |
| Next.js Marketing | `https://klargehalt.de` / `https://www.klargehalt.de` | `arr98w1h25xc16wd35xuwcjn` |

**App + Marketing = same repo deployed twice.** `middleware.ts` routes by `host`.

### Trigger Redeploy

```bash
# Next.js App
curl -X POST -H "Authorization: Bearer $COOLIFY_TOKEN" \
  https://coolify.klargehalt.de/api/v1/applications/v5p64dvnh80subyrs1nbla9b/restart

# Marketing
curl -X POST -H "Authorization: Bearer $COOLIFY_TOKEN" \
  https://coolify.klargehalt.de/api/v1/applications/arr98w1h25xc16wd35xuwcjn/restart
```

### Deployment Flow

```
git push origin main
  → Coolify webhook → builds + deploys app.klargehalt.de + klargehalt.de (same image)
  → Sentry source maps upload (automatic via next.config.ts)
```

## Supabase

Project ref: `btbucjkczpejplykyvkj` | Region: West EU (Ireland)

```bash
# Link project (once, requires DB password)
supabase link --project-ref btbucjkczpejplykyvkj

# Apply migrations
supabase db push
```

> If project is paused: unpause at https://supabase.com/dashboard/project/btbucjkczpejplykyvkj

## What Claude Cannot Access Directly

| Service | URL |
|---|---|
| Coolify UI | `https://coolify.klargehalt.de` |
| Supabase dashboard | `https://supabase.com/dashboard/project/btbucjkczpejplykyvkj` |
| Logto admin | `https://auth.klargehalt.de` (admin UI) |
| Stripe | `https://dashboard.stripe.com` |
| Sentry | `https://sentry.io` (org: `kitech-software-ug-haftungsbes`, project: `klargehalt`) |
