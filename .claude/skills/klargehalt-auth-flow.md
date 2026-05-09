# KlarGehalt — Auth Flow Detail

## Full OIDC Sign-Up Flow (11 steps)

```
1. /preise → "Kostenlos testen" → href: getAppUrl('/sign-up?plan=professional')
2. AuthLauncher renders at /sign-up?plan=professional
3. User clicks CTA → handleSignUpClick():
     a. document.cookie = kg_intent_plan=professional; max-age=3600; samesite=lax
     b. router.push('/auth/sign-up')
4. /auth/sign-up/route.ts → Logto signIn(..., { interactionMode: 'signUp' })
   → HTTP 302 → auth.klargehalt.de OIDC authorization endpoint
5. User completes Logto registration (email verify, password)
6. Logto 302 → /callback?code=...&state=...
7. /callback/route.ts: handleSignIn(config, searchParams) → exchange code for tokens
   → getLogtoContext() → isAuthenticated = true
   → orgs = context.claims.organizations (empty for new user)
   → redirect to /onboarding
8. /onboarding page reads kg_intent_plan cookie → sets selectedPlan
9. POST /api/onboarding/complete:
     a. createOrganizationWithMembership() → Logto M2M API creates org
     b. Supabase: INSERT companies (subscription_status='trialing', trial_ends_at=+14d)
     c. Supabase: UPSERT profiles
     d. Supabase: INSERT user_roles (role='admin')
     e. Supabase: UPSERT onboarding_data
     f. Set kg_active_org cookie (httpOnly, samesite=lax, secure=prod)
10. Client: setActiveOrganization() → POST /api/auth/active-org → refresh /api/auth/me
11. router.push('/dashboard')
```

## JWT Lag (Critical)

Logto only refreshes `organizations` claim in the JWT **on next login**. Immediately after onboarding:
- `kg_active_org` cookie is the **only** source of org identity
- `getServerAuthContext()` in `lib/auth/server.ts` appends the cookie org to the JWT org list even if the JWT doesn't contain it yet
- **Real enforcement is Supabase RLS only** — never trust JWT org list alone post-signup

## `kg_active_org` Cookie Lifecycle

| Event | Action |
|---|---|
| Onboarding complete | Written by `/api/onboarding/complete` |
| Org switch | Written by `/api/auth/active-org` |
| Read | `getActiveOrganizationIdFromCookies()` in `lib/auth/server.ts` + middleware |
| Deleted | Sign-out route |

Attributes: `httpOnly`, `samesite=lax`, `secure` (prod). Scoped to `app.klargehalt.de`.

## Plan Intent Cookie (`kg_intent_plan`)

- Set by JavaScript in `handleSignUpClick()` — NOT `httpOnly` (intentional, non-security cookie)
- `samesite=lax`, `max-age=3600` — survives OIDC top-level redirect
- **Gap:** If user arrives at `/sign-in?plan=...` (not `/sign-up?plan=...`), cookie is never set. Sign-in mode in `AuthLauncher` does not call `handleSignUpClick`. Fix: route sign-in `?plan=` to cookie same as sign-up path.

## Logto Auth Emails (Separate Path)

Signup verification and password reset emails are sent by Logto directly via its own SMTP — **not Resend**. Configure in Logto admin UI at `https://auth.klargehalt.de`.
