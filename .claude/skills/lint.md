---
description: Run TypeScript check and ESLint, fix any errors found
---

1. Run TypeScript strict check: `npx tsc --noEmit 2>&1`
2. Run ESLint: `npx next lint 2>&1`
3. Search for dead/deprecated imports:
   ```
   grep -r "createClientWithToken\|useSession" hooks/ app/ --include="*.ts" --include="*.tsx" -l
   ```
4. If errors found: fix them, then re-run step 1 to confirm a clean build
5. Report: zero errors = ready to commit
