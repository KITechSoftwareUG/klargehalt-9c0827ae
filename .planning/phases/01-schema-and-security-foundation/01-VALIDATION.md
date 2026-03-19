---
phase: 1
slug: schema-and-security-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `npx tsc --noEmit` + `npm run lint` (no test runner) |
| **Config file** | `tsconfig.json`, `.eslintrc.json` |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npm run lint` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | FOUN-01 | manual-sql | `psql -f supabase/migrations/00000000000000_schema.sql` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | FOUN-02 | manual-sql | Verify tables have `organization_id TEXT NOT NULL` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | FOUN-03 | manual-sql | Query with wrong org JWT returns empty | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 1 | FOUN-04 | manual-sql | Employee-role query for other employee salary returns empty | ❌ W0 | ⬜ pending |
| 1-02-03 | 02 | 1 | FOUN-05 | typescript | `npx tsc --noEmit` passes after auth helper updates | ✅ | ⬜ pending |
| 1-02-04 | 02 | 1 | FOUN-06 | grep | `grep -r "@google/generative-ai\|svix" package.json` returns nothing | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers TypeScript and lint checks
- SQL validation is manual (run against Supabase instance)
- No additional test framework needed for Phase 1

*Existing infrastructure covers all phase requirements that can be automated. SQL/RLS validation requires manual verification against a Supabase instance.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Single migration initializes schema | FOUN-01 | Requires fresh Supabase instance | Reset local Supabase, apply single migration, verify all tables exist |
| Cross-tenant isolation | FOUN-03 | Requires two Logto orgs with JWTs | Query tenant-scoped table with org A JWT, verify org B rows not returned |
| Employee salary row isolation | FOUN-04 | Requires employee-role JWT | Query employees table as employee role, verify only own row returned |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
