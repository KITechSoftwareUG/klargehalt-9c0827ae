---
description: Lint, validate, and check code quality
---

// turbo-all
1. Run TypeScript strict check: `npx tsc --noEmit 2>&1`
2. Run ESLint: `npx next lint 2>&1 | Select-Object -First 80`
3. Search for dead imports: `grep -r "createClientWithToken\|useSession" hooks/ app/ --include="*.ts" --include="*.tsx" -l`
4. If errors found: fix them, then re-run step 1 to confirm clean build
