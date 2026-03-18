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

## Pending Work (as of 2026-03-18)

### Uncommitted Changes — Landing Page Redesign

The marketing landing page was redesigned using the [taste-skill](https://github.com/Leonxlnx/taste-skill) design system. These changes are staged but **not yet committed or pushed**.

**Modified files:**
- `components/HeroSection.tsx` — Complete rewrite:
  - Centered layout (was 2-column split)
  - `balken.mp4` video as fullscreen background with `mask-image` radial gradient for inward fade
  - `min-h-[100dvh]` instead of `min-h-screen`
  - Badge, headline, benefits, CTAs, trust indicators all centered
- `app/(marketing)/globals.css` — Added:
  - Concrete wall texture via two `body::before`/`body::after` SVG noise pseudo-elements (`mix-blend-mode: multiply/overlay`, `pointer-events: none`, `position: fixed`)
  - Background color adjusted to `220 10% 95%` (warm neutral grey)
- `app/(marketing)/page.tsx` — Wrapper changed to `relative z-10 bg-transparent` so content sits above the fixed concrete texture

**New files:**
- `public/balken.mp4` — Video asset for hero background (copied from `app/(marketing)/balken.mp4`)
- `app/(marketing)/balken.mp4` — Original video file (can be removed after commit, only `public/` copy is used)

### taste-skill Design Parameters Applied
- `DESIGN_VARIANCE: 8` — Asymmetric layouts, centered hero as exception for clean video showcase
- `MOTION_INTENSITY: 6` — CSS animations (fade-in, slide-up, pulse)
- `VISUAL_DENSITY: 4` — Generous whitespace, clean hierarchy

### Deployment
- Project was copied from `/root/app` to `/home/deploy/app` with `deploy:deploy` ownership
- Old version backed up at `/home/deploy/app.bak`
- **Coolify needs to be installed and configured** on this server to publish the site
- GitHub remote: `https://github.com/KITechSoftwareUG/klargehalt-9c0827ae.git`

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
