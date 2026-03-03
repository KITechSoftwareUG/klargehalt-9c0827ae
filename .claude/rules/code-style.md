# Code Style & Conventions

## TypeScript
- No `any` types — always use specific types
- Run `npx tsc --noEmit` after every change to catch regressions

## Error Handling
- User-facing errors: always use `toast()` (sonner) — never `alert()` or silent fails
- Server errors: log with `console.error`, surface friendly message via toast

## Loading States
- Always show a skeleton component while loading — never render `null` or nothing
- Pattern: `if (loading) return <Skeleton />`

## Forms
- React Hook Form + Zod for all forms
- Validate at the boundary (user input) — trust internal code and Supabase guarantees

## Supabase Client (Critical)
- **Client components**: always use `supabase` from `useAuth()` — never create your own client
- **Server components / Server Actions**: use `createClient()` from `lib/supabase/server.ts`
- Never manually manage Clerk JWT — the fetch interceptor in `AuthProvider` handles it

## RBAC / Security
- UI gating: `<RoleGuard roles={[...]}>` or `useRoleAccess(...roles)`
- Real enforcement is always in Supabase RLS — never rely on frontend filtering alone
- Every tenant-scoped table has `organization_id TEXT NOT NULL` — always filter by it

## Commit Messages
- Format: `Deployment V[version]: [description]` for releases
- Format: `Kaizen: [what improved]` for code quality commits
