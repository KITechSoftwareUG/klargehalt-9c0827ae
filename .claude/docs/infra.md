# Environment, Mail & DNS

## Environment Variables

```bash
# Logto
LOGTO_ENDPOINT  LOGTO_APP_ID  LOGTO_APP_SECRET  LOGTO_COOKIE_SECRET  APP_BASE_URL
LOGTO_M2M_APP_ID  LOGTO_M2M_APP_SECRET  LOGTO_MANAGEMENT_API_RESOURCE  LOGTO_WEBHOOK_SECRET
# Supabase
NEXT_PUBLIC_SUPABASE_URL  NEXT_PUBLIC_SUPABASE_ANON_KEY  SUPABASE_SERVICE_ROLE_KEY
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  STRIPE_SECRET_KEY  STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_BASIS_MONTHLY  STRIPE_PRICE_BASIS_YEARLY
STRIPE_PRICE_PROFESSIONAL_MONTHLY  STRIPE_PRICE_PROFESSIONAL_YEARLY
# Other
GOOGLE_GEMINI_API_KEY  RESEND_API_KEY  CRON_SECRET
NEXT_PUBLIC_ROOT_DOMAIN  NEXT_PUBLIC_APP_URL
```

---

## Mail-Infrastruktur & DNS

**Architektur:** Zwei parallele Mail-Systeme auf einer Domain.

| System | Zweck | Sending domain |
|---|---|---|
| Microsoft 365 | Business-Kommunikation (Outlook, Teams) | `klargehalt.de` via M365 SMTP |
| Resend | Transactional / System-Mails | `klargehalt.de` via Resend API |

**DNS-Status (Cloudflare, Stand 2026-05-11):**

| Record | Wert | Status |
|---|---|---|
| MX `@` | `klargehalt-de.mail.protection.outlook.com` (Prio 0) | ✅ |
| CNAME `autodiscover` | `autodiscover.outlook.com` | ✅ |
| CNAME `selector1._domainkey` | `selector1-klargehalt-de._domainkey.kitechsoftwareug.p-v1.dkim.mail.microsoft` | ✅ |
| CNAME `selector2._domainkey` | `selector2-klargehalt-de._domainkey.kitechsoftwareug.p-v1.dkim.mail.microsoft` | ✅ |
| TXT `@` SPF | `v=spf1 include:spf.protection.outlook.com include:spf.resend.com ~all` | ✅ |
| TXT `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:aalkh@klargehalt.de` | ✅ |
| TXT `resend._domainkey` | Resend DKIM Public Key | ✅ |
| TXT `@` | `MS=ms45156943` (M365-Verifizierung) | ✅ |

**VPS-Subdomains (unberührt):**

| Record | Wert |
|---|---|
| A `klargehalt.de` | 85.215.219.202 (Proxied via Cloudflare) |
| CNAME `app` | klargehalt.de → VPS |
| CNAME `auth` | klargehalt.de → VPS |
| A `coolify` | 85.215.219.202 (DNS only) |

**Wichtig:** DKIM in M365 Defender muss nach DNS-Propagation aktiviert werden:
`Microsoft Defender → E-Mail & Zusammenarbeit → DKIM → klargehalt.de → Aktivieren`

---

## Team Emails

**Microsoft 365 Postfächer (alle Aliases → `aalkh@klargehalt.de`):**

| Address | Owner | Purpose |
|---|---|---|
| `aalkh@klargehalt.de` | Ayham Alkhalil | Personal / intern — primäres M365-Konto |
| `lbatt@klargehalt.de` | Leon Battel | Personal / intern (Alias: `leon.battel@klargehalt.de`) |

**Aliases auf `aalkh@klargehalt.de` (alle in Microsoft 365):**

| Alias | Verwendung (Landingpage / Code) |
|---|---|
| `info@klargehalt.de` | Impressum, allgemeiner Kontakt, Marketing-Kontaktformular |
| `kontakt@klargehalt.de` | Alternative Kontaktadresse (DE-Publikum) |
| `support@klargehalt.de` | Support-Kommunikation, Kundenservice |
| `sales@klargehalt.de` | Sales-Anfragen, Lawyer-CTA, Enterprise-Anfragen |
| `billing@klargehalt.de` | Billing-Bestätigungen, Zahlungsfehler |
| `datenschutz@klargehalt.de` | Datenschutz-/DSGVO-Seiten, Privacy-Kontakt |
| `legal@klargehalt.de` | Rechtliche Anfragen |
| `security@klargehalt.de` | Security-Disclosures |

**Email routing in code (`lib/email.ts`):**
- Transactional (welcome, trial) → `noreply@klargehalt.de` *(Resend — nicht M365)*
- Support comms → `support@klargehalt.de`
- Billing confirmations & payment failures → `billing@klargehalt.de`
- Privacy/DSGVO pages → `datenschutz@klargehalt.de`
- Marketing contact form + Impressum → `info@klargehalt.de`
- Sales inquiries (lawyer CTA, enterprise) → `sales@klargehalt.de`
- Legal matters → `legal@klargehalt.de`
- Security disclosures → `security@klargehalt.de`

**Landingpage-Zuordnung:**
- Impressum → `info@klargehalt.de`
- Datenschutzerklärung → `datenschutz@klargehalt.de`
- Kontaktformular → `kontakt@klargehalt.de` oder `info@klargehalt.de`
- Pricing CTA / Sales → `sales@klargehalt.de`
- Support-Link → `support@klargehalt.de`
