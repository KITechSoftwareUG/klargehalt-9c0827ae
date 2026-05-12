# Security

> **Wichtig:** klargehalt verarbeitet hochsensible Daten — Gehälter, Geschlecht/Schutzklassen-Merkmale, Mitarbeiter-PII, Compliance-Dokumentation, die in Rechtsstreitigkeiten verwendet wird. **Security-First ist nicht-verhandelbar.** Jede neue Funktion muss durch diese Checks.

---

## 1. Threat Model — was wir schützen

| Asset | Worst-Case-Szenario | Schutz |
|---|---|---|
| Salary-Daten (`employees.salary`, `salary_decisions`) | Lohn-Leak an andere Mitarbeiter / Konkurrenz | RLS auf `organization_id`, Role-Filtering |
| Cross-Tenant-Daten | Org A sieht Daten von Org B | RLS via `public.org_id()` aus JWT `aud` |
| `salary_decisions` Audit-Trail | Decision wird nachträglich manipuliert ("ich hatte einen Grund") | Append-only RLS: kein UPDATE/DELETE |
| Geschlecht/Schutzmerkmale (`employees.gender`) | DSGVO Art. 9 Verstoß, Diskriminierungs-Klage | RLS-strict, kein Logging, keine Sentry-Übertragung |
| Stripe Customer/Subscription | Billing-Manipulation, Trial-Missbrauch | Webhook-Signature, Service-Role-Only, Idempotency |
| Lawyer-Zugang | Externer Anwalt sieht Daten nach Vertragsende | `access_expires_at` + RLS `is_org_member()` |
| Super-Admin-Endpoints | Privilege Escalation auf alle Orgs | Hardcoded Logto User ID Check, keine DB-Rolle |
| Logto-Sessions | Account-Takeover, Session-Hijacking | HttpOnly+Secure Cookies, SameSite=Lax, M2M-getrennt |

---

## 2. Authentication (Logto)

**Regeln:**
- **Keine eigene Auth-Logik** — alles über Logto OIDC. Niemals Passwörter selbst hashen oder JWT selbst signieren.
- **M2M-Credentials sind getrennt:** `LOGTO_M2M_APP_ID/SECRET` ≠ `LOGTO_APP_ID/SECRET`. M2M nur in Server-Routes für Management-API-Calls (Org erstellen, User einladen).
- **Webhook-Signatur prüfen:** `/api/webhooks/logto` muss `LOGTO_WEBHOOK_SECRET` validieren — sonst kann jeder Welcome-Mails triggern oder DB-Zustand manipulieren.
- **Cookie-Sicherheit:** `LOGTO_COOKIE_SECRET` muss ≥ 32 Zeichen entropie haben, niemals in Code oder Logs.

**Session Cookies:**

| Cookie | Eigenschaften | Zweck |
|---|---|---|
| Logto session | `HttpOnly`, `Secure`, `SameSite=Lax` | Auth |
| `kg_active_org` | `HttpOnly`, `Secure`, `SameSite=Lax` | Aktive Org (JWT-Lag-Workaround) |

**JWT-Lag-Falle:** Nach Org-Wechsel ist die Logto-`organizations`-Claim noch alt. `getServerAuthContext()` fügt das Cookie-Org zur JWT-Liste hinzu. **Die echte Enforcement ist immer RLS** — das Cookie ist nur ein UX-Hinweis.

**MFA / SSO:**
- MFA wird in Logto pro Org-Tenant konfiguriert (Admin-Ebene)
- SSO ist `enterprise`-Feature → `hasFeature('sso')` Gate

---

## 3. Authorization — 3 Layer Defense in Depth

**KRITISCH:** Frontend-Gating ist **nur UX**. Echte Enforcement liegt immer in Supabase RLS.

```
Layer 1: Edge (middleware.ts)
  └─ Redirect unauthed → /sign-in (UX)

Layer 2: API Routes (getServerAuthContext)
  └─ Throw 401 wenn nicht eingeloggt (UX + Defense)

Layer 3: Supabase RLS Policies        ← die echte Wahrheit
  └─ Jeder SELECT/INSERT/UPDATE prüft public.org_id() + role helpers
```

**Bei jeder neuen Tabelle:**
1. `organization_id TEXT NOT NULL` Column
2. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
3. **Mindestens 4 Policies:** SELECT/INSERT/UPDATE/DELETE, jeweils mit `organization_id = public.org_id()` + Rollen-Helper
4. Default-deny: ohne explizite Policy ist nichts erlaubt

**RLS-Helpers (in `public` Schema):**
- `public.org_id()` — aus JWT `aud` (`urn:logto:organization:<id>`)
- `public.is_org_admin()` — `owner` OR `admin`, active, nicht expired
- `public.is_hr_or_admin()` — `owner`, `admin` OR `hr_manager`, active, nicht expired
- `public.is_org_member()` — irgendein active member mit gültigem `access_expires_at`

**Append-only Tabellen (Audit-Integrität):**
`salary_decisions`, `audit_logs`, `subscription_changes`, `processed_stripe_events` haben **kein UPDATE / kein DELETE per RLS-Policy** — selbst nicht für Admins. Korrekturen erfolgen durch neuen Record mit `decision_type = 'correction'`.

**Service-Role-Bypass:**
- `SUPABASE_SERVICE_ROLE_KEY` umgeht RLS komplett
- **Nur in Server-Code verwenden** (`/api/webhooks/*`, `/api/cron/*`)
- **Niemals** in Client-Bundle, niemals an Frontend-Code
- Wenn Service-Role nötig: schreibe explizite Permission-Checks oben in der Route

---

## 4. Multi-Tenant Isolation

**Cross-Tenant-Leak ist das schlimmste Bug-Szenario in einem B2B SaaS.**

Vor jedem Query / Mutation:
- ✅ Filtert RLS automatisch auf `organization_id`? (Default: ja, wenn Policy korrekt)
- ✅ Wird `organization_id` aus dem Server-Context geholt, **nicht** aus User-Input?
- ❌ Niemals `organization_id` aus Request-Body / URL-Param vertrauen
- ❌ Niemals Cross-Tenant-Joins (`.in('organization_id', [...])`) ohne explizite Super-Admin-Prüfung

**Stripe Customer Lookup:** `stripe_customer_id` ist ein Cross-Tenant-Risk-Vektor — wenn ein User es ändern könnte, bekommt er Zugriff auf fremde Subscription-Events. Daher: nur via Webhook (Server-Trust) oder Reconcile-Route (Service-Role).

---

## 5. Datenschutz / DSGVO (kritisch für DE/EU-Markt)

| DSGVO-Anforderung | Umsetzung |
|---|---|
| Art. 5 — Datenminimierung | Nur Felder erheben, die für Compliance nötig sind. Geburtsdatum nur wenn für Pay-Gap nötig. |
| Art. 9 — besondere Kategorien (Geschlecht) | Strict RLS, keine Übertragung an Sentry/Logs, kein Export ohne expliziten User-Consent |
| Art. 15 — Auskunftsrecht | `/dashboard/my-salary` zeigt Mitarbeitenden eigene Daten (Read-Only via `employees.user_id` Match) |
| Art. 17 — Recht auf Löschung | **Konflikt mit Audit-Trail:** salary_decisions bleiben (Compliance), aber `employees.name/email/external_id` werden pseudonymisiert. Implementierung: `POST /api/employees/[id]/anonymize` (post-MVP) |
| Art. 25 — Privacy by Design | Default-deny RLS, keine PII in URLs, keine PII in Error-Messages |
| Art. 28 — AVV / DPA | Mit Supabase, Logto, Resend, Stripe, Coolify, Sentry, Cloudflare abgeschlossen. Bei neuem Subprozessor: DPA prüfen + Datenschutzerklärung updaten |
| Art. 30 — Verarbeitungsverzeichnis | Liegt in internem Doc, bei neuer Datenkategorie ergänzen |
| Art. 32 — Stand der Technik | HTTPS, Verschlüsselung at-rest (Supabase), RLS, MFA optional, regelmäßige Updates |
| Art. 33/34 — Breach Notification | Bei Verdacht: `security@klargehalt.de` + 72h-Frist beachten, Sentry-Alert konfiguriert |

**PII in Code:**
- ❌ `console.log(user)` mit vollem User-Objekt
- ❌ `Sentry.captureException(error, { extra: { employee } })`
- ✅ `console.log({ userId: user.id })` — nur ID, keine Email/Name
- ✅ Sentry-Scrubbing aktivieren für `email`, `name`, `salary`, `gender`

**Mitarbeiter-Sicht:**
- Mitarbeiter (`employees`) ohne Logto-Login sind reine Records, kein DSGVO-Risk für Login-Hijacking
- Mitarbeiter mit `user_id` (post-MVP) sehen nur eigenen Lohn — RLS via `employees.user_id = auth.uid()`

---

## 6. Input Validation

**An jeder Boundary validieren — niemals Internal-Code vertrauen reicht, wenn es User-Input ist.**

| Boundary | Tool |
|---|---|
| Form-Inputs | React Hook Form + Zod (`schema.parse()`) |
| API Route Body | `zod.parse(await request.json())` an Funktionsbeginn |
| URL Params | Zod-Schema oder explizites `z.string().uuid()` |
| Webhook-Bodies | Erst Signature prüfen, dann Zod-Schema |
| Supabase Queries | TypeScript Types aus `database.types.ts` |

**Common Pitfalls (was hier schon passiert ist oder leicht passieren kann):**
- ❌ `salary: req.body.salary` ohne Typ-Check → könnte String "1000000000" oder negativ sein
- ❌ `email: req.body.email` ohne Format-Check → könnte XSS-Vektor in Email-Templates sein
- ❌ Direktes Einfügen von User-Input in `dangerouslySetInnerHTML`
- ❌ `markdown` oder `html` Fields ohne Sanitizer (`isomorphic-dompurify`)

**SQL Injection:** Supabase JS Client parametrisiert automatisch — **außer** `rpc()` mit dynamischen Strings oder `.or()` mit String-Concat. Bei RPC: Server-Side die Parameter typisieren.

**XSS:** React escapet by default. Gefahrenzonen:
- `dangerouslySetInnerHTML` → DOMPurify davor
- `<a href={userInput}>` → `href` mit `safeUrl()` validieren (`https:` oder relative only)
- Markdown-Rendering → `rehype-sanitize`
- `target="_blank"` → immer `rel="noopener noreferrer"`

---

## 7. Secrets Management

**Goldene Regel:** Jeder String, der in einem Production-Env-Var stehen würde, gehört **nie** in den Code oder ein git-tracked File.

**Hierarchie:**
1. `.env.local` — lokal (in `.gitignore` ✅)
2. Coolify Environment Variables — Production
3. **Niemals:** committed `.env`, `.env.production`, hardcoded String

**Pre-Commit-Check (manuell oder per Hook):**
```bash
git diff --cached | grep -iE "(secret|key|password|token).*=.*['\"][A-Za-z0-9]{20,}"
```

**Bei versehentlich committed Secret:**
1. **SOFORT rotieren** (Logto-Secret, Stripe-Key, Service-Role-Key)
2. `git filter-repo` oder GitHub-Support für History-Bereinigung
3. **Nicht** vergessen: alte Commits sind weiter in geforkten Repos / Caches
4. Sentry/Logs nach Leak-Spuren durchsuchen
5. Incident in internem Log dokumentieren

**Required Env-Var Startup-Check:**
Jede neue kritische Env-Var (Stripe, Logto, Supabase, Resend) gehört in einen Startup-Validator (siehe Hard Failure Mode #7: `RESEND_API_KEY` Missing). Pattern in `lib/env.ts` (post-MVP).

---

## 8. API Security

**Jede API-Route:**
1. ✅ Auth-Check zuerst (`getServerAuthContext()` → 401)
2. ✅ Permission-Check (Role oder Feature-Flag → 403)
3. ✅ Input-Validation (Zod)
4. ✅ Business-Logic
5. ✅ Audit-Log Write (bei sensiblen Mutations)
6. ✅ Response ohne Internal-Errors (`error.message` leaken vermeiden)

**Rate Limiting (`rate_limit_entries` Tabelle existiert):**

| Endpoint | Limit |
|---|---|
| `/api/auth/*` | 10 req/min pro IP |
| `/api/members/invite` | 5 req/min pro Org |
| `/api/lawyer/request` | 3 req/h pro Org |
| `/api/stripe/checkout` | 5 req/min pro User |
| Public-facing Forms | 5 req/min pro IP |

Implementierung: `lib/rate-limit.ts` mit Supabase-Service-Role-Insert + 401/429-Response bei Überschreitung.

**Webhook Security:**

| Webhook | Signatur-Header | Secret |
|---|---|---|
| Stripe | `Stripe-Signature` | `STRIPE_WEBHOOK_SECRET` |
| Logto | `logto-signature-sha-256` | `LOGTO_WEBHOOK_SECRET` |

**KRITISCH:** Niemals Webhook-Body ohne Signatur-Verifikation verarbeiten. `request.text()` für raw body (nicht `json()`), erst nach Verifikation parsen.

**Idempotency:**
- Stripe-Events: `processed_stripe_events` Tabelle (Unique Index auf `event_id`)
- Logto-Events: `processed_logto_events` (P1, siehe Hard Failure Mode #4)
- POST-Endpoints mit Side-Effects: `Idempotency-Key` Header erwarten (bei kritischen Routes)

**CORS:**
- App ist Same-Origin → keine offene CORS-Policy
- Bei externer API in Zukunft: explizite Allow-List, niemals `*`

---

## 9. Audit-Trail & Integrität

**Was muss geloggt werden (`audit_logs`):**

| Event | Details |
|---|---|
| Auth: Login, Logout, MFA-Setup | user_id, ip, user_agent |
| RBAC: Role-Change, Member-Add/Remove | actor, target, old_role, new_role |
| Daten: `salary_decisions` Insert | bereits in Tabelle selbst |
| Daten: `employees` Update (Salary-Change) | redirect auf `salary_decisions` — keine direkten Salary-Updates |
| Settings: Subscription-Change | bereits in `subscription_changes` |
| Lawyer: Access granted/revoked | actor, lawyer_id, access_expires_at |
| Export: PDF/CSV-Download | wer, was, wann |
| Super-Admin-Aktionen | hardcoded user ID, alle Aktionen |

**Audit-Log-Schreibungen sind nicht löschbar.** RLS verhindert UPDATE/DELETE. Wenn ein Log falsch ist, wird ein Korrektur-Log geschrieben, der das Original referenziert.

**Logs müssen verifizierbar bleiben:**
- Timestamps ohne Client-Vertrauen (`now()` aus DB, nicht aus Request)
- `actor_user_id` aus Auth-Context, nicht aus Request-Body
- Bei externen Eingaben (Logto-Webhook): `webhook_source: 'logto'` markieren

---

## 10. Frontend Security

**TypeScript-Strict aktiv** — kein `any`, kein `// @ts-ignore` ohne Kommentar warum.

**Dependencies:**
- `npm audit` mindestens wöchentlich, vor jedem Release pflicht
- Dependabot/Renovate aktiviert für CRITICAL/HIGH Updates
- Supply-Chain: Vor jedem neuen Package: GitHub-Stars, last commit, weekly downloads prüfen

**React-spezifisch:**
- `dangerouslySetInnerHTML` → nur mit DOMPurify
- `target="_blank"` → immer `rel="noopener noreferrer"`
- User-controllable URLs in `<a href>` validieren
- File-Uploads (zukünftig): MIME-Type + Magic-Bytes prüfen, nicht nur Extension

**State-Leaks vermeiden:**
- Sentry: `beforeSend` Filter konfigurieren (siehe Sentry-Config), PII-Keys scrubben
- LocalStorage / SessionStorage: nichts Sensitives (kein JWT, kein Salary-Cache)
- React DevTools / Redux DevTools: in Production ausgeschaltet

**Content Security Policy (post-MVP):**
- `default-src 'self'`
- `script-src 'self' 'unsafe-inline'` (Next.js braucht inline für hydration, langfristig nonce)
- `connect-src 'self' *.supabase.co *.logto.dev *.stripe.com api.resend.com sentry.io`
- `frame-ancestors 'none'` — Clickjacking-Schutz

---

## 11. Infrastructure Security

**HTTPS überall:**
- Cloudflare Proxy für `klargehalt.de`, `app.`, `auth.`
- HSTS aktiviert (Cloudflare-Setting)
- Coolify-Backend nur intern, kein direkter Internet-Zugriff

**Coolify-Server (`85.215.219.202`):**
- SSH-Key-only, kein Password-Login
- Fail2Ban aktiv
- Firewall: nur 22 (SSH), 80, 443 offen
- Coolify-UI hinter Auth
- `coolify.klargehalt.de` ist DNS-only (nicht Proxied) — direkter IP-Zugriff aber nur intern via SSH-Tunnel

**Supabase:**
- Connection-Pooling über Supabase-Edge
- Backup-Policy: täglich, 7 Tage Retention (PITR optional ab Pro-Plan)
- Project-Pause-Lock: aktivieren, damit Project nicht versehentlich inactiv

**Sentry:**
- PII-Scrubbing aktiv (`email`, `ip`, `name`)
- Source-Maps hochgeladen aber privat
- Release-Tracking via Coolify-Deploy

**DNS:**
- DMARC `p=quarantine` (nicht `p=none` — sonst kann jeder im Namen senden)
- SPF strikt: nur M365 + Resend, alles andere `~all`
- DKIM für beide Sender (M365 + Resend) aktiv

---

## 12. Vulnerability Management & Incident Response

**Security-Disclosures:** `security@klargehalt.de` → erstellt Sentry-Issue + Slack-Notify (post-MVP)

**Incident-Response-Schritte:**

1. **Detect:** Sentry-Alert, User-Report, Security-Disclosure
2. **Triage:** Severity einschätzen (Cross-Tenant-Leak = P0, einzelner User-Bug = P2)
3. **Contain:** Bei P0/P1 — betroffene Route deaktivieren via Feature-Flag oder Maintenance-Mode
4. **Eradicate:** Root-Cause-Fix, **niemals nur Symptom**
5. **Recover:** Deploy, Reconcile-Skript falls Daten betroffen
6. **Notify:**
   - DSGVO: bei PII-Breach 72h-Frist → Aufsichtsbehörde + betroffene User
   - Cross-Tenant-Leak: betroffene Org-Owner informieren
   - Stripe-Issue: keine Pflicht zu User-Notify, aber Reconcile dokumentieren
7. **Post-Mortem:** Was lief schief, was hat Detection verzögert, welcher Check fehlt
8. **Document:** In internem Incident-Log, Sentry-Issue mit "incident:" Tag

**Severity-Definitionen:**

| Level | Beispiel | Response-Zeit |
|---|---|---|
| P0 — Critical | Cross-Tenant-Leak, Secret-Leak, RCE | < 1h Detection-to-Mitigation |
| P1 — High | Auth-Bypass für 1 Org, RLS-Hole | < 4h |
| P2 — Medium | XSS auf interner Page, Rate-Limit-Bypass | < 24h |
| P3 — Low | Theoretisches Risiko ohne Exploit | < 1 Woche |

---

## 13. Pre-Commit Security Checklist

Bei **jedem** Commit, der eines der folgenden ändert, durchgehen:

**Allgemein:**
- [ ] Keine Secrets im Diff (`grep -iE "secret|key|password|token"`)
- [ ] `npx tsc --noEmit` ohne Errors
- [ ] `npm run lint` ohne Errors
- [ ] Keine `console.log` mit PII
- [ ] Keine `// @ts-ignore` ohne Begründung

**Neue Tabelle:**
- [ ] `organization_id TEXT NOT NULL` Column
- [ ] `ENABLE ROW LEVEL SECURITY`
- [ ] RLS-Policies für SELECT/INSERT/UPDATE/DELETE
- [ ] Default-deny verified (in Supabase SQL Editor mit anderer Org testen)
- [ ] Migration in `supabase/migrations/` versioniert (Timestamp-Prefix)

**Neue API-Route:**
- [ ] `getServerAuthContext()` aufgerufen
- [ ] Role-Check vor Business-Logic
- [ ] Zod-Validation auf Body/Params/Query
- [ ] Rate-Limit erwogen (besonders bei externen Triggern)
- [ ] Audit-Log bei Mutations
- [ ] Error-Response leaked keine Internal-Details (`{ error: 'Invalid input' }` statt Stack-Trace)

**Neuer Webhook:**
- [ ] Signature-Verifikation als allererstes (vor JSON-Parse)
- [ ] Idempotency-Tabelle (event_id Unique-Index)
- [ ] Service-Role nur in diesem Code-Pfad
- [ ] Sentry-Logging bei Verarbeitungsfehler

**Neue Form / User-Input:**
- [ ] React Hook Form + Zod
- [ ] Server-seitige Re-Validation (niemals nur Client-Validation trauen)
- [ ] `toast()` für Error-Display, nicht `alert()`
- [ ] CSRF: Next.js Server Actions verwenden (CSRF-Token built-in)

**Neue Feature/Permission:**
- [ ] RBAC: `<RoleGuard>` UI + RLS-Policy DB
- [ ] Feature-Flag falls tier-gated
- [ ] Audit-Log bei sensiblen Aktionen
- [ ] Subscription-Gate falls Premium-Feature

**Neue Subdependency (`npm install`):**
- [ ] GitHub-Stars > 100 ODER offizielles Vendor-Package
- [ ] Letzter Commit < 6 Monate
- [ ] Keine bekannten CVEs (`npm audit`)
- [ ] Lizenz kompatibel (MIT/Apache-2/ISC ok, GPL kritisch prüfen)

---

## 14. Wenn unsicher — STOP

**Diese Situationen erfordern Pause und explizite User-Bestätigung, bevor weitergemacht wird:**

- Code, der `organization_id` aus User-Input liest
- Code, der `SUPABASE_SERVICE_ROLE_KEY` außerhalb von `/api/webhooks/*` oder `/api/cron/*` verwendet
- Neue Tabelle ohne RLS-Policy
- API-Route ohne Auth-Check
- Webhook ohne Signatur-Verifikation
- `dangerouslySetInnerHTML` mit User-Content
- `eval()`, `Function()`, dynamische `require()`
- File-Upload-Endpoint ohne MIME + Größe-Limit
- Cross-Origin-Request an externen Service mit User-Daten
- Bulk-Operation, die >1000 Rows in einer Org betrifft
- DSGVO-relevante Datenkategorie (Geschlecht, Gehalt) wird neu erhoben/exportiert

**Niemals selbst entscheiden — immer User fragen oder `security-reviewer`-Agent konsultieren.**
