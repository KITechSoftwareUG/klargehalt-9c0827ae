---
description: Systematic debugging workflow - debug like a pro
---

Debug issues systematically, step by step. Don't guess. Gather evidence first.

## Phase 1: Reproduce & Isolate
1. Confirm the exact error message and where it appears (browser console, Supabase logs, terminal)
2. Identify the narrowest reproduction case: which page/action triggers it?
3. Check if it's consistent (always) or intermittent (sometimes)

## Phase 2: Instrument & Observe
1. Add targeted `console.log` at the suspected call site to see actual data:
   ```ts
   console.log('[DEBUG][ComponentName] data:', { user, orgId, token: !!token, result });
   ```
2. Check Supabase Dashboard → Logs → API for 401/403/400 errors
3. Check browser Network tab for the exact HTTP request/response

## Phase 3: Hypothesis & Test
1. Form ONE specific hypothesis about the root cause
2. Make ONE narrowly scoped change to test it
3. Run TypeScript check: `npx tsc --noEmit`
4. Test in browser, check if error is gone

## Phase 4: Verify & Clean Up
1. Confirm fix doesn't break other functionality (check adjacent features)
2. Remove all `console.log` debug statements added in Phase 2
3. Run `npx tsc --noEmit` one final time
4. Add a comment in the code explaining WHY the fix was needed if it's non-obvious

## Common Patterns in this Codebase
| Symptom | Likely Cause | Fix |
|---|---|---|
| 401 Unauthorized | JWT expired or wrong Supabase client used | Use `supabase` from `useAuth()` |
| Data not loading | RLS policy blocking | Check `user_id` / `organization_id` match |
| `null` role | `user_roles` row missing | Run default employee role upsert |
| Infinite loading | `isLoaded` never becomes true | Check `useAuth` loading chain |
