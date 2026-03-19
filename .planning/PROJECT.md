# KlarGehalt — App Inner Workings

## What This Is

KlarGehalt is a B2B SaaS for EU pay-transparency compliance (Entgelttransparenzrichtlinie 2023/970). It helps companies manage salary structures, enforce RBAC across employee roles, and produce gender pay gap analytics required by the directive. Three user types: HR managers handle day-to-day operations, executives view compliance reports, employees see their own salary context.

## Core Value

Automated gender pay gap reporting that satisfies EU directive requirements — if this doesn't work, nothing else matters.

## Requirements

### Validated

<!-- Inferred from existing codebase — these exist but many are broken/incomplete -->

- ~ Multi-tenant architecture with organization isolation — existing but RLS is broken (USING(true) on core tables)
- ~ RBAC system (admin, hr_manager, employee) — existing but upsert conflict target is wrong for multi-org
- ~ Dashboard shell with view switching — existing, SPA-style with activeView state
- ~ Employee management hooks/UI — existing but uses raw useEffect in places
- ~ Pay equity hooks and components — existing but creates unauthenticated Supabase client
- ~ Job profiles and pay bands tables — existing but schema needs rework
- ~ Onboarding flow — existing but fragile (no rollback on partial failure)
- ~ Marketing landing page — existing, redesigned with video background (uncommitted)

### Active

- [ ] Properly secured RLS policies using Logto org JWT (replace all USING(true))
- [ ] Reworked data model: pay bands, employee records, org/department hierarchy
- [ ] Gender pay gap % calculation per job category (overall and adjusted)
- [ ] Pay band distribution analysis (male/female across quartiles)
- [ ] Employee data import/upload for HR managers
- [ ] Pay gap analytics dashboard with Recharts visualizations
- [ ] Exportable compliance reports (PDF or CSV)
- [ ] Audit logging for compliance proof
- [ ] Role-appropriate views (HR: full management, Exec: reports, Employee: own salary)
- [ ] Proper pagination on employee lists and audit logs

### Out of Scope

- Authentication & onboarding — user building this separately with Logto
- AI pay gap explanations (Gemini) — removing to focus on core analytics
- AI chat feature — removing
- Real-time notifications — not needed for v1
- Booking/consulting feature — not core to compliance
- CI/CD pipeline — deployment handled via Coolify separately
- Mobile app — web-first

## Context

- **Deployment**: 4 Coolify projects — app.klargehalt.de (app), klargehalt.de (landing), auth.klargehalt.de (Logto self-hosted), db (Postgres for Logto auth)
- **Auth boundary**: User handles Logto auth + onboarding in parallel. This project starts after onboarding — assumes authenticated user with orgId and role available via `useAuth()`
- **Database**: Self-hosted Postgres via Supabase client library. RLS is the security boundary but currently broken (permissive policies everywhere)
- **Current state**: Dashboard is mostly broken. Auth migration from Clerk to Logto left many components in an inconsistent state. Data model needs significant rework for proper pay gap analytics
- **Migration mess**: supabase/migrations/ contains emergency patches (NUCLEAR_UUID_TO_TEXT_FIX, FIX_RLS_POLICIES, FINAL_DATABASE_FIX) that contradict each other. Need one authoritative schema
- **Codebase map**: Full analysis in `.planning/codebase/` (7 documents, 1261 lines)

## Constraints

- **Tech stack**: Next.js 15 App Router, TypeScript, Supabase (Postgres + RLS), shadcn/ui, TanStack Query, Recharts — no stack changes
- **Auth provider**: Logto (not Clerk) — user manages this, don't touch auth routes
- **Compliance**: Must map to EU Entgelttransparenzrichtlinie 2023/970 requirements — strict, not approximate
- **Security**: RLS must enforce tenant isolation at DB level — never trust frontend filtering
- **No AI**: Remove Gemini/Google AI dependency entirely
- **No tests**: Validation via `tsc --noEmit` + `npm run lint` (per existing convention)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Remove AI features (Gemini) | Focus on core pay gap analytics, reduce complexity and external dependencies | — Pending |
| Rework entire data model | Current schema has nullable org_ids, wrong conflict targets, emergency patches — not fit for compliance | — Pending |
| Strict EU directive compliance | Product's value proposition depends on regulatory trust | — Pending |
| Auth is out of scope | User building Logto integration in parallel — clear boundary at post-onboarding | — Pending |
| Single authoritative migration | Replace chaotic migration history with one clean schema | — Pending |

---
*Last updated: 2026-03-19 after initialization*
