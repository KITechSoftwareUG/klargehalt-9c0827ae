# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start development server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint via Next.js
npx tsc --noEmit   # TypeScript strict check (run after every change)
```

No automated test suite — validation is done via `tsc --noEmit` + `npm run lint`.

## Architecture Overview

**KlarGehalt** is a B2B SaaS for EU pay-transparency compliance (Entgelttransparenzrichtlinie 2023/970). It manages salary structures, RBAC for employees, and provides gender pay gap analytics.

### Stack
- **Next.js 15** (App Router) + **TypeScript**
- **Clerk** for authentication and organizations (multi-tenant identity provider)
- **Supabase** (PostgreSQL) for data, using **RLS as the primary security layer**
- **shadcn/ui** + Tailwind CSS for UI
- **TanStack Query** for client-side data fetching
- **Recharts** for analytics charts
- **Google Gemini** (`@google/generative-ai`) for AI pay-gap explanations
- **Sentry** for error tracking

### Route Groups

| Group | Purpose | Layout |
|---|---|---|
| `(marketing)` | Public landing page (`/`) | Marketing layout |
| `(app)` | Authenticated app (`/dashboard`, `/onboarding`, `/book-consulting`, `/sign-in`, `/sign-up`) | App layout with `AuthProvider` |

### Authentication & Multi-Tenancy

**Clerk** is the identity provider. Every authenticated user belongs to a Clerk **Organization** (`orgId`). The `middleware.ts` enforces:
- Unauthenticated users on the `app.` subdomain are redirected to sign-in
- Authenticated users without an org are redirected to `/onboarding`

**Supabase RLS** is the actual security boundary — all tenant isolation is enforced at the DB level via `organization_id` columns and the `auth.get_user_org_id()` helper function.

### RBAC

Three roles: `admin` | `hr_manager` | `employee`, stored in the `user_roles` table.
See `.claude/rules/code-style.md` for usage patterns.

### Database Schema (key tables)

`profiles`, `companies`, `user_roles`, `job_profiles`, `pay_bands`, `employees`, `info_requests`, `audit_logs`, `onboarding_data`, `consultation_bookings`

Every tenant-scoped table has an `organization_id TEXT NOT NULL` column. Migrations live in `supabase/migrations/`.

## Claude Code Structure

```
.claude/
├── settings.json          # Team permissions & hooks (committed)
├── settings.local.json    # Personal overrides (gitignored)
├── agents/                # Project subagents
│   ├── rls-auditor.md
│   └── pay-gap-analyst.md
├── skills/                # Slash commands (/commit, /lint, /kaizen, /debug)
│   ├── commit.md
│   ├── lint.md
│   ├── kaizen.md
│   └── debug.md
└── rules/                 # Auto-loaded modular instructions
    ├── code-style.md
    └── frontend/react.md
CLAUDE.md                  # This file (committed)
CLAUDE.local.md            # Personal notes (gitignored)
.mcp.json                  # MCP server config (committed)
```
