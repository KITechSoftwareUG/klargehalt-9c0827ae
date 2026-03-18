---
description: Kaizen - continuous improvement mindset for code quality
---

Apply the Kaizen (continuous improvement) mindset to the codebase. Systematically review recently
changed files and apply incremental improvements:

1. **Dead code sweep** — Search for unused imports, deprecated exports, and stale variables:
   - `grep -r "@deprecated" --include="*.ts" --include="*.tsx" src/ utils/ hooks/ lib/ -l`
   - Remove or replace anything marked deprecated

2. **Type safety** — Replace all `any` types with specific types where possible in changed files

3. **Empty handlers** — Search for empty callbacks `onClick={() => {}}` or `() => {}` and wire them up

4. **Console.log audit** — Remove `console.log` debug statements (keep intentional `console.error`)

5. **Consistency check** — Ensure changed files follow the same patterns as the rest of the codebase:
   - Supabase: always use `supabase` from `useAuth()`, never manual token management
   - Loading states: always show a loading skeleton, not raw null
   - Error handling: always use `toast()` for user-facing errors

6. Run `npx tsc --noEmit` after each batch of changes to verify no regressions

7. Commit with message: `git commit -m "Kaizen: [what was improved]"`
