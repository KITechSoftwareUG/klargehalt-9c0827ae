# Technology Stack

**Analysis Date:** 2026-03-19

## Languages & Runtime

**Primary:**
- TypeScript 5.8 - All source files (`**/*.ts`, `**/*.tsx`)
- TSConfig target: `ES2017`, strict mode OFF (`strict: false` in `tsconfig.json`)
- Path alias: `@/*` maps to project root

**Runtime:**
- Node.js 18.x (v18.19.1 active on server)
- No `.nvmrc` present — version is implicit

**Package Manager:**
- npm (lockfile: `package-lock.json` present)

## Frameworks

**Core:**
- Next.js 15.1.6 — App Router, `reactStrictMode: true`, configured in `next.config.ts`
- React 18.3.1 — UI rendering
- React DOM 18.3.1

**State / Data Fetching:**
- TanStack Query 5.83.0 — client-side async data fetching (replaces raw `useEffect` for fetching)

**Forms:**
- React Hook Form 7.61.1 — all form handling
- `@hookform/resolvers` 3.10.0 — Zod adapter
- Zod 3.25.76 — schema validation at input boundaries

**UI Component System:**
- shadcn/ui (not a package — component source lives in `components/ui/`)
- All Radix UI primitives installed individually (accordion, dialog, dropdown, select, tabs, tooltip, etc.)
- Tailwind CSS 3.4.17 — styling
- `tailwindcss-animate` 1.0.7 — animation utilities
- `class-variance-authority` 0.7.1 — variant-based component styling
- `clsx` 2.1.1 + `tailwind-merge` 2.6.0 — conditional class merging
- Lucide React 0.462.0 — icons
- DM Sans font via `@fontsource/dm-sans` 5.2.8

**Charts & Visualization:**
- Recharts 2.15.4 — all analytics charts

**Notifications:**
- Sonner 1.7.4 — toast notifications (use `toast()`, never `alert()`)

**Other UI:**
- `next-themes` 0.3.0 — dark mode support
- `embla-carousel-react` 8.6.0 — carousel component
- `react-day-picker` 8.10.1 — date picker
- `react-resizable-panels` 2.1.9 — resizable panel layouts
- `vaul` 0.9.9 — drawer component
- `cmdk` 1.1.1 — command palette
- `input-otp` 1.4.2 — OTP input
- `date-fns` 3.6.0 — date formatting/manipulation

## Key Dependencies (with versions)

**Authentication:**
- `@logto/next` 4.2.9 — OIDC-based auth provider (replaced Clerk; see INTEGRATIONS.md)

**Database:**
- `@supabase/supabase-js` 2.89.0 — Supabase JS client
- `@supabase/ssr` 0.5.2 — server-side Supabase client with cookie handling

**AI:**
- `@google/generative-ai` 0.24.1 — Google Gemini AI SDK

**Error Tracking:**
- `@sentry/nextjs` 10.34.0 — Sentry SDK, configured via `withSentryConfig` in `next.config.ts`

**Webhook Handling:**
- `svix` 1.84.1 — present in dependencies (Svix webhook signature verification)

## Configuration Files

| File | Purpose |
|---|---|
| `next.config.ts` | Next.js config, wrapped with `withSentryConfig` |
| `tsconfig.json` | TypeScript compiler options, `@/*` path alias |
| `tailwind.config.ts` | Tailwind theme (CSS vars for colors, DM Sans font, custom animations) |
| `postcss.config.js` | PostCSS for Tailwind |
| `eslint.config.mjs` | ESLint with TypeScript-ESLint, react-hooks, react-refresh plugins |
| `sentry.server.config.ts` | Sentry server-side init (DSN, tracing, PII) |
| `sentry.edge.config.ts` | Sentry edge runtime init (middleware, edge routes) |
| `.env` | Active environment variables (never commit) |
| `.env.example` | Template with all required variable names |
| `supabase/config.toml` | Supabase project config (`project_id = "btbucjkczpejplykyvkj"`) |

## Build & Dev Tools

**Commands:**
```bash
npm run dev       # Next.js dev server (localhost:3000)
npm run build     # Production build (runs withSentryConfig)
npm run lint      # ESLint via next lint
npx tsc --noEmit  # TypeScript type check (run after every change)
```

**Build pipeline:**
- Sentry source maps uploaded during `npm run build` when `CI=true`
- `automaticVercelMonitors: true` in Sentry webpack config (Vercel Cron integration)
- Package import optimization: `lucide-react` and `@radix-ui/react-icons` via `optimizePackageImports`
- Remote image hostname allowlisted: `btbucjkczpejplykyvkj.supabase.co`

**Dev Dependencies:**
- `@tailwindcss/typography` 0.5.16
- `autoprefixer` 10.4.21
- `typescript-eslint` 8.53.0
- `eslint` 9.32.0, `eslint-config-next` 15.1.6
- `eslint-plugin-react-refresh` 0.4.26

**ESLint notable disabled rules:**
- `@typescript-eslint/no-unused-vars`: off
- `@typescript-eslint/no-explicit-any`: off
- `react-hooks/exhaustive-deps`: off

---

*Stack analysis: 2026-03-19*
