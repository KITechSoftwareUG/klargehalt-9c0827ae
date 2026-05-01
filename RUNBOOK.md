# KlarGehalt Operations Runbook

## Einmalige manuelle Schritte vor Production-Launch

### 1. Supabase pg_cron Extension aktivieren

Im Supabase Dashboard (project: btbucjkczpejplykyvkj):
1. Database → Extensions → `pg_cron` aktivieren
2. Danach Migration `20260423000000_schedule_pg_cron_jobs.sql` ist bereits applied — Jobs sind aktiv.

Verifizieren:
```sql
SELECT jobname, schedule, active FROM cron.job;
```
Erwartete Jobs: `cleanup-expired-trials` (täglich 02:00 UTC), `expire-ended-trials` (stündlich)

---

### 2. P0: Logto JWT ↔ Supabase 3rd-Party-Auth konfigurieren

**Problem:** Supabase vertraut Logto-JWTs nicht (Logto: RS256/JWKS, Supabase erwartet HS256).
Client-seitige Supabase-Reads auf RLS-Tabellen geben leere Daten zurück (anon-JWT ohne Org).
Alle kritischen Writes laufen korrekt über `/api/*` Routen mit Service-Role-Client.

**Fix (Supabase Dashboard, einmalig):**
1. Supabase Dashboard → Project Settings → Authentication → JWT Settings
2. "Add a new JWT secret" oder 3rd-Party-Provider konfigurieren
3. Logto JWKS URL: `${LOGTO_ENDPOINT}/.well-known/jwks.json`
4. Nach Konfiguration: alle clientseitigen Reads auf RLS-Tabellen testen

**Workaround bis Fix:** Alle Reads/Writes auf protected tables laufen über `/api/*` Routen
mit `createClient()` server-side (Service-Role oder User-JWT über Logto-Cookie).

**Betroffene Dateien:**
- `utils/supabase/client.ts`:21,48 — `createBrowserClient` Singleton ohne Auth-Override
- `hooks/useAuth.tsx`:127-133 — `useMemo` Race Condition mit JWT-Interceptor

---

### 3. Coolify Cron-Job einrichten

Trial-Reminder Emails:
- URL: `https://app.klargehalt.de/api/cron/trial-reminder`
- Header: `x-cron-secret: [CRON_SECRET aus .env]`
- Schedule: täglich 09:00 UTC (`0 9 * * *`)

---

### 4. Stripe Live-Keys setzen (vor Go-Live)

In Coolify alle `STRIPE_*` Variablen von Test- auf Live-Keys umstellen:
- `STRIPE_SECRET_KEY` → `sk_live_...`
- `STRIPE_WEBHOOK_SECRET` → neues Webhook-Secret aus Stripe Dashboard
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
- Stripe Webhook-Endpoint registrieren: `https://app.klargehalt.de/api/webhooks/stripe`
- Events: `customer.subscription.created/updated/deleted`, `invoice.payment_succeeded/failed`

---

## Pflicht-Umgebungsvariablen (Coolify)

Alle müssen gesetzt sein — fehlt eine, crasht der betroffene Feature-Pfad:

| Variable | Zweck |
|---|---|
| `RESEND_API_KEY` | Transaktionale Emails |
| `STRIPE_SECRET_KEY` | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook-Signatur |
| `STRIPE_PRICE_*` (4x) | Preis-IDs für Checkout |
| `GOOGLE_GEMINI_API_KEY` | AI-Features |
| `CRON_SECRET` | Cron-Endpoint Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-seitige DB-Operationen |
| `LOGTO_APP_SECRET` | Logto OIDC |
| `LOGTO_COOKIE_SECRET` | Session-Cookie |
| `LOGTO_M2M_APP_SECRET` | Management API |
| `LOGTO_WEBHOOK_SECRET` | Webhook-Signatur |

---

## Historische Fixes

### "Allow All" RLS-Policies entfernt (2026-05-01)

**Was war kaputt:** `profiles` und `user_roles` hatten je eine `policyname='Allow All'` Policy
mit `cmd=ALL`, `permissive=PERMISSIVE`, `qual=true`. Da PERMISSIVE-Policies per OR kombiniert
werden, machte `qual=true` alle anderen org-/rollen-scoped Policies wirkungslos — effektiv
gab es keinen RLS-Schutz auf diesen beiden Tabellen.

**Fix:** Migration `20260501220000_drop_allow_all_policies.sql` droppt beide Policies.
Die verbleibenden Policies (`profiles_hr_admin_all`, `profiles_own`, `profiles_self_read_update`,
`user_roles_admin_*`, `user_roles_hr_*`, `user_roles_self_*`) erzwingen org + role scoping korrekt.

**Verifikation:**
```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'user_roles')
ORDER BY tablename, policyname;
-- Erwartet: keine Zeile mit policyname='Allow All'.
```

---

## Laufende Operationen

### Stripe Reconciliation (bei Datenmismatch)

```bash
# Prüfen
GET https://app.klargehalt.de/api/stripe/reconcile

# Fixen
POST https://app.klargehalt.de/api/stripe/reconcile
```

### Health Check

```bash
GET https://app.klargehalt.de/api/healthz
# Erwartet: {"status":"ok","timestamp":"..."}
```

### Trial manuell zurücksetzen (für Tests)

```sql
UPDATE companies
SET trial_ends_at = now() + interval '14 days',
    subscription_status = 'trialing'
WHERE id = '[COMPANY_ID]';
```
