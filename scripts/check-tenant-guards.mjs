#!/usr/bin/env node
/**
 * Static tenant-isolation guardrail (Risk #1 — cross-tenant data exposure).
 *
 * The architecture review found API routes that ran service-role (RLS-bypassing)
 * queries filtered only by `context.activeOrganizationId` — a value derived from
 * the UNVERIFIED `kg_active_org` cookie. Any authenticated user could spoof the
 * cookie and read another tenant's salary/gender data.
 *
 * Invariant this script enforces:
 *   A route under app/api that uses a service-role Supabase client AND filters
 *   by `organization_id` MUST first establish org membership via
 *   guardOrgMember()/guardRole() (lib/auth/api-guard.ts).
 *
 * Exemptions:
 *   - /api/webhooks/* and /api/cron/*  — authenticate via signature / cron
 *     secret, not per-user membership (verified upstream).
 *   - ALLOWLIST below — routes that perform an equivalent inline
 *     organization_members membership+role check, or legitimately run BEFORE
 *     membership exists (org/membership bootstrap & self-heal). Each entry has
 *     a reason and was manually verified during the Phase 0 hardening pass.
 *
 * No network, no deps — safe to run in CI (wired into .github/workflows/ci.yml).
 * Exit code 1 on any violation.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const API_DIR = join(ROOT, 'app', 'api');

/**
 * Verified-safe routes that trip the heuristic but are NOT vulnerable.
 * Removing a guard/inline-check from any of these MUST also remove it here.
 */
const ALLOWLIST = new Map([
  ['app/api/auth/organizations/route.ts',
    'Creates a new organization (pre-membership by design); Logto-authoritative + rate-limited.'],
  ['app/api/auth/repair-role/route.ts',
    'Self-heals a missing organization_members row; proves membership via Logto org token before INSERT.'],
  ['app/api/onboarding/complete/route.ts',
    'Bootstraps org + company + first member (pre-membership by design); identity from auth context.'],
  ['app/api/employees/invite/route.ts',
    'Inline organization_members membership+role check (owner/admin/hr_manager) before any org use.'],
  ['app/api/compliance/lawyer-lookup/route.ts',
    'Inline organization_members membership+role check (owner/admin/hr_manager) before any org use.'],
]);

const SERVICE_ROLE = /createServiceClient|supabaseAdmin\s*\(|SUPABASE_SERVICE_ROLE_KEY/;
const ORG_FILTER = /\.eq\(\s*['"]organization_id['"]/;
const GUARD = /guardOrgMember|guardRole/;

/** @returns {string[]} absolute paths of every route.ts under app/api */
function findRoutes(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...findRoutes(full));
    else if (entry === 'route.ts' || entry === 'route.tsx') out.push(full);
  }
  return out;
}

const violations = [];
const allowlisted = [];

for (const file of findRoutes(API_DIR)) {
  const rel = relative(ROOT, file);
  if (rel.includes('/webhooks/') || rel.includes('/cron/')) continue;

  const src = readFileSync(file, 'utf8');
  if (!SERVICE_ROLE.test(src) || !ORG_FILTER.test(src)) continue;
  if (GUARD.test(src)) continue;

  if (ALLOWLIST.has(rel)) {
    allowlisted.push(rel);
    continue;
  }
  violations.push(rel);
}

// Detect stale allowlist entries (route now guarded or gone) so the list
// cannot silently rot into a blanket bypass.
const present = new Set(findRoutes(API_DIR).map((f) => relative(ROOT, f)));
const stale = [...ALLOWLIST.keys()].filter(
  (k) => !present.has(k) || GUARD.test(readFileSync(join(ROOT, k), 'utf8')),
);

if (allowlisted.length) {
  console.log(`tenant-guard: ${allowlisted.length} allowlisted route(s) skipped (verified-safe).`);
}
if (stale.length) {
  console.log('tenant-guard: NOTE — allowlist entries no longer matching the heuristic (clean these up):');
  for (const s of stale) console.log(`  - ${s}`);
}

if (violations.length) {
  console.error('\n❌ tenant-guard FAILED — service-role route filters by organization_id without guardOrgMember/guardRole:');
  for (const v of violations) console.error(`  - ${v}`);
  console.error('\nFix: call guardOrgMember(context) (or guardRole(...)) and use guard.orgId as the');
  console.error('org filter — never context.activeOrganizationId (unverified cookie). Risk #1.');
  console.error('If the route is genuinely pre-membership, add it to ALLOWLIST with a reason.\n');
  process.exit(1);
}

console.log('✅ tenant-guard PASSED — no unguarded service-role org-filtered routes.');
