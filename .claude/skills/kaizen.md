---
description: Kaizen — systematic incremental code quality improvement
---

Apply the Kaizen (continuous improvement) mindset to recently changed files.

1. **Dead code sweep** — remove unused imports, deprecated exports, stale variables:
   ```
   grep -r "@deprecated" --include="*.ts" --include="*.tsx" hooks/ lib/ app/ -l
   ```

2. **Type safety** — replace all `any` types with specific types in changed files

3. **Empty handlers** — find and wire up empty callbacks:
   ```
   grep -r "onClick={() => {}}\|= () => {}" --include="*.tsx" app/ components/ -l
   ```

4. **Console.log audit** — remove debug `console.log` statements (keep `console.error`):
   ```
   grep -r "console\.log" --include="*.ts" --include="*.tsx" app/ hooks/ lib/ -l
   ```

5. **Consistency check** — ensure changed files follow codebase patterns:
   - Supabase: always use `supabase` from `useAuth()`, never manual token management
   - Loading states: always show a skeleton, not raw `null`
   - Errors: always use `toast()` for user-facing errors

6. Run `npx tsc --noEmit` after each batch to verify no regressions

7. Commit: `git commit -m "Kaizen: [what was improved]"`
