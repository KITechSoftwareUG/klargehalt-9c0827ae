# Stack & Commands

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| Auth | Logto (self-hosted, OIDC) |
| Database | Supabase (PostgreSQL + RLS), ref `btbucjkczpejplykyvkj` |
| UI | shadcn/ui + Tailwind CSS |
| Data fetching | TanStack Query |
| Charts | Recharts |
| Billing | Stripe (Checkout + Customer Portal) |
| Error tracking | Sentry (org: `kitech-software-ug-haftungsbes`, project: `klargehalt`) |

---

## Commands

```bash
npm run dev        # Dev server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint via Next.js
npx tsc --noEmit   # TypeScript strict check (run after every change)
```

No test suite — validation is `tsc --noEmit` + `npm run lint`.

**Chrome Testing (MANDATORY):** After every UI change — use `chrome-devtools` MCP tools, test golden path, check browser console for errors. Do NOT mark complete without Chrome verification.
