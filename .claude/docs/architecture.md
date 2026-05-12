# Architecture & Auth Patterns

## Architecture

**Same build, two domains.** `middleware.ts` checks `host` header at the edge:
- `host.startsWith('app.')` → auth-enforced app (`/` → `/dashboard` redirect)
- everything else → marketing passthrough (`NextResponse.next()`)

**Auth-exempt on `app.*`:** `/auth/*`, `/callback`, `/api/auth/*`, `/api/webhooks/*`, `/api/healthz`

**Security model (3 layers):**
1. Edge (middleware): redirects unauthenticated users
2. API layer: `getServerAuthContext()` gates server-side logic
3. Database (RLS): final enforcement — `public.org_id()` extracts org from JWT `aud` claim (`urn:logto:organization:<id>`)

**JWT lag:** Logto refreshes `organizations` claim only on next login. Post-onboarding, `kg_active_org` cookie is sole org identity — `getServerAuthContext()` appends cookie org to JWT list. Real enforcement is always Supabase RLS.

> Full OIDC sign-up flow (11 steps), cookie lifecycle, plan intent gap → skill `klargehalt-auth-flow`
> Stripe checkout, webhooks, reconcile, email, cron, DNS → skill `klargehalt-billing`
> Coolify UUIDs, CLI deploy commands, Supabase link → skill `klargehalt-infra`

---

## Auth Patterns

```ts
// Client component — always from useAuth(), never instantiate directly
const { supabase, user, orgId, role } = useAuth()

// Server component / API route
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()       // reads kg_active_org, injects org JWT
const supabase = await createClient(orgId)  // explicit override
```

Server context: `getServerAuthContext()` from `lib/auth/server.ts`
Client context: `useAuth()` from `hooks/useAuth.tsx`
