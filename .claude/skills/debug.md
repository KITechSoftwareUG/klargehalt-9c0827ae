---
description: Systematic debugging — gather evidence before fixing
---

Debug issues step by step. Don't guess. Gather evidence first.

## Phase 1: Reproduce & Isolate
1. Confirm the exact error and where it appears (browser console, Supabase logs, terminal)
2. Find the narrowest reproduction: which page/action triggers it?
3. Is it consistent (always) or intermittent (sometimes)?

## Phase 2: Instrument & Observe
1. Add targeted logging at the suspected call site:
   ```ts
   console.log('[DEBUG][ComponentName]', { user, orgId, token: !!token, result })
   ```
2. Check Supabase Dashboard → Logs → API for 401/403/400 errors
3. Check browser Network tab for the exact HTTP request/response

## Phase 3: Hypothesis & Test
1. Form ONE specific hypothesis about the root cause
2. Make ONE narrowly scoped change to test it
3. Run `npx tsc --noEmit` — no new type errors?
4. Test in browser — is the error gone?

## Phase 4: Verify & Clean Up
1. Confirm fix doesn't break adjacent features
2. Remove all `console.log` debug statements added in Phase 2
3. Run `npx tsc --noEmit` one final time
4. Add a code comment explaining WHY the fix was needed (if non-obvious)

## Common Patterns in This Codebase

| Symptom | Likely Cause | Fix |
|---|---|---|
| 401 Unauthorized | Wrong Supabase client / expired JWT | Use `supabase` from `useAuth()` |
| Data not loading | RLS policy blocking | Check `organization_id` match |
| `null` role | `user_roles` row missing | Run default employee role upsert |
| Infinite loading | `isLoaded` never becomes `true` | Check `useAuth` loading chain |
| Type error on `any` | Missing type annotation | Add specific type, run `tsc --noEmit` |
