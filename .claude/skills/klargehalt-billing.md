# KlarGehalt — Billing & Email Detail

## Stripe Checkout Flow

```
POST /api/stripe/checkout
  → admin auth check (service role, bypasses RLS)
  → get/create Stripe customer (stored as companies.stripe_customer_id)
  → stripe.checkout.sessions.create({
       metadata: { organization_id, company_id, tier },
       success_url: APP_BASE_URL + '/dashboard?checkout=success',
       cancel_url: APP_BASE_URL + '/dashboard?checkout=canceled',
    })
  → return { url: session.url }
Client: window.location.href = session.url
```

## Webhook Events (`/api/webhooks/stripe`)

| Event | Action |
|---|---|
| `checkout.session.completed` | Set `subscription_status='active'`, `subscription_tier`, clear `trial_ends_at` |
| `customer.subscription.updated` | Update tier/status/`current_period_end` (ordering guard via `.or()` clause) |
| `customer.subscription.deleted` | Downgrade to `basis`, clear `stripe_subscription_id` |
| `invoice.payment_failed` | Set `subscription_status='past_due'` + send `paymentFailed` email |

**Idempotency:** `processed_stripe_events (event_id PK, processed_at)` — checked at entry, written AFTER successful DB update. RLS-blocked; service role only.

## Subscription State Machine

```
signup → trialing (14d, professional)
       → [upgrade] → active
       → [trial expires, no upgrade] → trialing (expired) → TrialExpiredOverlay
       → [payment fails] → past_due → basis access
       → [canceled] → canceled → basis access
```

`getEffectiveTier()`: `active`/`trialing (valid)` → full tier | `past_due`/`canceled` → `basis`

## Reconcile Routes

- `GET /api/stripe/reconcile` — detects all Stripe/DB mismatches (super-admin)
- `POST /api/stripe/reconcile` — applies automatic fixes

**Partial-write scenarios:**
- Checkout: Stripe customer created → Supabase `stripe_customer_id` write fails → duplicate customer on next attempt. Reconcile detects.
- Webhook: Supabase write fails → 500 → Stripe retries up to 3 days. Idempotency table not written on failure, so retries work.

## Email Triggers (Resend, `lib/email.ts`)

| Trigger | Function | When |
|---|---|---|
| User registers | `sendWelcomeEmail` | Logto webhook `User.Created` |
| Trial ending (3d + 1d before) | `sendTrialEndingEmail` | Cron: `GET /api/cron/trial-reminder` |
| Payment confirmed | `sendSubscriptionConfirmedEmail` | `checkout.session.completed` |
| Payment failed | `sendPaymentFailedEmail` | `invoice.payment_failed` |

Sending addresses: `noreply@klargehalt.de` (all except payment failure) / `support@klargehalt.de` (payment failure).

Resend is lazy-initialized — throws at request time if `RESEND_API_KEY` missing. No startup validation yet (known gap).

## Cron: Trial Reminder

- Endpoint: `GET /api/cron/trial-reminder`
- Auth: `x-cron-secret` header (NOT `Authorization: Bearer`) matching `CRON_SECRET` env var
- Triggers: 3 days before expiry + 1 day before expiry (window-based)
- External trigger required: Coolify scheduled task, server cron, or external service

## Required DNS Records (Resend, `klargehalt.de`)

```
TXT   @              "v=spf1 include:amazonses.com ~all"
CNAME resend._domainkey → resend._domainkey.klargehalt.de.dkim.resend.com
TXT   _dmarc         "v=DMARC1; p=none; rua=mailto:support@klargehalt.de"
```
