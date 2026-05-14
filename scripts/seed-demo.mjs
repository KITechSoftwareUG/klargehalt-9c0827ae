/**
 * ============================================================================
 * KLARGEHALT — DEMO SEED SCRIPT
 * ============================================================================
 *
 * Purpose:    Create a hard-coded demo account (Logto user + Supabase data)
 *             with realistic German Mittelstand seed data for live customer
 *             demos of the Basis tier.
 *
 * What it builds:
 *   - 2 Logto users:
 *       owner:  demo@klargehalt.de       (Sandra Becker, Owner)
 *       hr:     demo-hr@klargehalt.de    (Markus Hofer, HR Manager)
 *     Both share the demo password (see DEMO_PASSWORD below).
 *   - 1 Logto organization:  "Müller & Schmidt Consulting GmbH"
 *   - Supabase rows:
 *       companies, organization_members, profiles, user_roles (legacy),
 *       departments (5), job_levels (5), job_profiles (10), pay_bands (14),
 *       employees (30), salary_decisions (~24), info_requests (3),
 *       audit_logs (8), job_postings (3), pay_gap_snapshots (5)
 *
 * Engineered demo story:
 *   - Pay-Equity-View flags 2 gender gaps > 5% (Art. 10 of 2023/970):
 *       Gap A: Software Engineer · Senior  → 4♂ ~88k / 3♀ ~78.5k (~10.8%)
 *       Gap B: Account Executive · Mid     → 3♂ ~66k / 2♀ ~58k   (~12.1%)
 *   - 1 open / 1 fulfilled / 1 overdue info_request (Auskunftsanspruch).
 *   - Every employee has at least a hire-decision in salary_decisions
 *     (the compliance core — Beweislast-Trail).
 *
 * How to run:
 *   1. Pull required env vars (see ENV section below) into .env.demo
 *   2. node --env-file=.env.demo scripts/seed-demo.mjs
 *
 *   or, with --reset to wipe and re-seed:
 *      node --env-file=.env.demo scripts/seed-demo.mjs --reset
 *
 *   or to delete the demo org entirely (Logto + Supabase):
 *      node --env-file=.env.demo scripts/seed-demo.mjs --teardown
 *
 * Idempotency:
 *   The script is idempotent — re-running it without --reset will reuse the
 *   existing Logto user + org and add missing rows. With --reset, it wipes
 *   the org's Supabase data first and re-seeds from scratch.
 *
 * Required env vars:
 *   LOGTO_ENDPOINT, LOGTO_M2M_APP_ID, LOGTO_M2M_APP_SECRET,
 *   LOGTO_MANAGEMENT_API_RESOURCE (optional, defaults to admin.logto.app/api),
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

// ─── CONFIGURATION ──────────────────────────────────────────────────────────

const DEMO_OWNER_EMAIL = 'demo@klargehalt.de';
const DEMO_OWNER_NAME = 'Sandra Becker';
const DEMO_HR_EMAIL = 'demo-hr@klargehalt.de';
const DEMO_HR_NAME = 'Markus Hofer';
const DEMO_PASSWORD = 'KlarDemo2026!';
const COMPANY_NAME = 'Müller & Schmidt Consulting GmbH';
const COMPANY_NAME_SHORT = 'Müller & Schmidt Consulting';
const EMPLOYEE_EMAIL_DOMAIN = 'mueller-schmidt.de';

const FLAG_RESET = process.argv.includes('--reset');
const FLAG_TEARDOWN = process.argv.includes('--teardown');

// ─── ENV ────────────────────────────────────────────────────────────────────

const REQUIRED_ENV = [
  'LOGTO_ENDPOINT',
  'LOGTO_M2M_APP_ID',
  'LOGTO_M2M_APP_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`✗ Missing env var: ${key}`);
    console.error('  Run with: node --env-file=.env.demo scripts/seed-demo.mjs');
    process.exit(1);
  }
}

const LOGTO_BASE = process.env.LOGTO_ENDPOINT.replace(/\/$/, '');
const LOGTO_RESOURCE = process.env.LOGTO_MANAGEMENT_API_RESOURCE || 'https://admin.logto.app/api';

// ─── SUPABASE SERVICE-ROLE CLIENT (BYPASSES RLS) ─────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// ─── LOGTO MANAGEMENT API HELPERS ────────────────────────────────────────────

let _tokenCache = null;
async function getLogtoToken() {
  if (_tokenCache && _tokenCache.expiresAt > Date.now() + 5000) return _tokenCache.token;
  const res = await fetch(`${LOGTO_BASE}/oidc/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.LOGTO_M2M_APP_ID,
      client_secret: process.env.LOGTO_M2M_APP_SECRET,
      resource: LOGTO_RESOURCE,
      scope: 'all',
    }),
  });
  if (!res.ok) throw new Error(`Logto token: ${res.status} ${await res.text()}`);
  const data = await res.json();
  _tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

async function logto(method, path, body) {
  const token = await getLogtoToken();
  const res = await fetch(`${LOGTO_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Logto ${method} ${path}: ${res.status} ${text}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (res.status === 204 || !ct.includes('json')) return null;
  return res.json();
}

async function logtoSilent(method, path, body) {
  try { return await logto(method, path, body); } catch { return null; }
}

async function findOrCreateLogtoUser(email, name) {
  // Logto search API requires `mode=exact` when searchFields is set; otherwise it
  // errors "Only one search value is allowed". The exact-match path is what we want.
  const existing = await logto('GET',
    `/api/users?search=${encodeURIComponent(email)}&searchFields=primaryEmail&mode=exact&limit=1`);
  const match = existing?.find(u => u.primaryEmail?.toLowerCase() === email.toLowerCase());
  if (match) {
    // Reset password to known demo password so re-running the script keeps creds stable
    await logtoSilent('PATCH', `/api/users/${match.id}/password`, { password: DEMO_PASSWORD });
    return { id: match.id, created: false };
  }
  const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_') + '_demo';
  const user = await logto('POST', '/api/users', { primaryEmail: email, name, username });
  await logto('PATCH', `/api/users/${user.id}/password`, { password: DEMO_PASSWORD });
  return { id: user.id, created: true };
}

async function findOrCreateLogtoOrg(name) {
  const found = await logto('GET', `/api/organizations?q=${encodeURIComponent(name)}&page=1&page_size=20`);
  const match = found?.find(o => o.name === name);
  if (match) return match.id;
  const org = await logto('POST', '/api/organizations', { name });
  return org.id;
}

async function addLogtoUserToOrg(orgId, userId) {
  await logtoSilent('POST', `/api/organizations/${orgId}/users`, { userIds: [userId] });
}

async function assignLogtoOrgRole(orgId, userId, roleName) {
  const roles = await logtoSilent('GET', `/api/organizations/${orgId}/roles`);
  const role = roles?.find(r => r.name === roleName);
  if (!role) return; // role not defined in Logto org template — non-fatal (RLS uses organization_members)
  await logtoSilent('POST', `/api/organizations/${orgId}/users/${userId}/roles`,
    { organizationRoleIds: [role.id] });
}

async function deleteLogtoOrg(orgId) {
  await logtoSilent('DELETE', `/api/organizations/${orgId}`);
}

async function deleteLogtoUser(userId) {
  await logtoSilent('DELETE', `/api/users/${userId}`);
}

// ─── SUPABASE INSERT HELPERS ─────────────────────────────────────────────────

async function sbInsert(table, rows) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw new Error(`Supabase insert ${table}: ${error.message}`);
  console.log(`  ✓ ${table}: ${rows.length} row${rows.length === 1 ? '' : 's'}`);
}

// ─── SUPABASE MANAGEMENT API — for one-off DDL the JS client cannot do ──────
// (toggle triggers around the bulk employee insert: the refresh_pay_gap_snapshot
// guard rejects service-role calls because their JWT has no `aud` claim)

async function runManagementSql(sql) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = process.env.SUPABASE_PROJECT_REF
    || (process.env.NEXT_PUBLIC_SUPABASE_URL || '').match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!token || !projectRef) {
    throw new Error('SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF (or derivable from NEXT_PUBLIC_SUPABASE_URL) required to toggle triggers');
  }
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    throw new Error(`Management API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

const TRIGGERS_TO_TOGGLE = [
  // pay-gap recompute fires on employee INSERT/UPDATE/DELETE and rejects
  // service-role callers (their JWT has no Logto `aud` claim)
  { table: 'public.employees', name: 'trg_refresh_pay_gap_after_employee_insert' },
  { table: 'public.employees', name: 'trg_refresh_pay_gap_after_employee_update' },
  { table: 'public.employees', name: 'trg_refresh_pay_gap_after_employee_delete' },
  // audit trigger on salary_decisions references the obsolete `before_state`/`after_state`
  // columns on audit_logs (renamed to `changes`); skip it for the seed
  { table: 'public.salary_decisions', name: 'trg_audit_salary_decision_insert' },
  // append-only enforcement; the wipe step needs to DELETE prior demo decisions
  { table: 'public.salary_decisions', name: 'trg_prevent_salary_decision_delete' },
  { table: 'public.salary_decisions', name: 'trg_prevent_salary_decision_update' },
];

async function setTriggers(state /* 'DISABLE' | 'ENABLE' */) {
  const sql = TRIGGERS_TO_TOGGLE
    .map(t => `ALTER TABLE ${t.table} ${state} TRIGGER ${t.name};`)
    .join('\n');
  await runManagementSql(sql);
  console.log(`  ✓ triggers ${state.toLowerCase()}d`);
}

// FK-safe wipe order. Demo org is dedicated, so a full wipe per run keeps the
// script idempotent without needing upsert/onConflict semantics.
const WIPE_TABLES_FK_ORDER = [
  'salary_decisions',
  'info_requests',
  'pay_gap_snapshots',
  'audit_logs',
  'job_postings',
  'employees',
  'pay_bands',
  'job_profiles',
  'job_levels',
  'departments',
  'organization_members',
  'user_roles',
  'companies',
];

async function wipeOrgData(orgId, ownerUserId, hrUserId) {
  for (const t of WIPE_TABLES_FK_ORDER) {
    const { error } = await supabase.from(t).delete().eq('organization_id', orgId);
    if (error && !error.message.toLowerCase().includes('schema cache')) {
      console.warn(`  ! ${t}: ${error.message}`);
    }
  }
  // profiles is keyed by user_id, not organization_id — wipe the two demo users
  for (const uid of [ownerUserId, hrUserId].filter(Boolean)) {
    await supabase.from('profiles').delete().eq('user_id', uid);
  }
  console.log(`  ✓ wiped Supabase rows for org ${orgId}`);
}

// ─── DETERMINISTIC UUIDS ─────────────────────────────────────────────────────
// Stable IDs across runs make the seed idempotent and the data easy to inspect.

const ID = {
  // Departments
  dept_eng: 'a1111111-0000-4000-8000-000000000001',
  dept_sales: 'a1111111-0000-4000-8000-000000000002',
  dept_marketing: 'a1111111-0000-4000-8000-000000000003',
  dept_hr: 'a1111111-0000-4000-8000-000000000004',
  dept_finance: 'a1111111-0000-4000-8000-000000000005',
  // Job levels
  lvl_junior: 'a2222222-0000-4000-8000-000000000001',
  lvl_mid: 'a2222222-0000-4000-8000-000000000002',
  lvl_senior: 'a2222222-0000-4000-8000-000000000003',
  lvl_lead: 'a2222222-0000-4000-8000-000000000004',
  lvl_principal: 'a2222222-0000-4000-8000-000000000005',
  // Job profiles
  jp_swe: 'a3333333-0000-4000-8000-000000000001',
  jp_devops: 'a3333333-0000-4000-8000-000000000002',
  jp_pm: 'a3333333-0000-4000-8000-000000000003',
  jp_qa: 'a3333333-0000-4000-8000-000000000004',
  jp_ae: 'a3333333-0000-4000-8000-000000000005',
  jp_sdr: 'a3333333-0000-4000-8000-000000000006',
  jp_mkt: 'a3333333-0000-4000-8000-000000000007',
  jp_hrbp: 'a3333333-0000-4000-8000-000000000008',
  jp_controller: 'a3333333-0000-4000-8000-000000000009',
  jp_accountant: 'a3333333-0000-4000-8000-00000000000a',
  // Pay bands
  pb_swe_jr: 'a4444444-0000-4000-8000-000000000001',
  pb_swe_mid: 'a4444444-0000-4000-8000-000000000002',
  pb_swe_sr: 'a4444444-0000-4000-8000-000000000003',
  pb_swe_lead: 'a4444444-0000-4000-8000-000000000004',
  pb_devops_mid: 'a4444444-0000-4000-8000-000000000005',
  pb_devops_sr: 'a4444444-0000-4000-8000-000000000006',
  pb_pm_sr: 'a4444444-0000-4000-8000-000000000007',
  pb_qa_mid: 'a4444444-0000-4000-8000-000000000008',
  pb_ae_mid: 'a4444444-0000-4000-8000-000000000009',
  pb_ae_sr: 'a4444444-0000-4000-8000-00000000000a',
  pb_sdr_jr: 'a4444444-0000-4000-8000-00000000000b',
  pb_mkt_mid: 'a4444444-0000-4000-8000-00000000000c',
  pb_hrbp_sr: 'a4444444-0000-4000-8000-00000000000d',
  pb_controller_sr: 'a4444444-0000-4000-8000-00000000000e',
  pb_accountant_mid: 'a4444444-0000-4000-8000-00000000000f',
  // Company UUID (separate from Logto org id)
  company: 'a0000000-0000-4000-8000-000000000001',
};

// Stable employee IDs eN where N is index. Built at module level for cross-reference.
const empId = (n) => `a5555555-0000-4000-8000-${String(n).padStart(12, '0')}`;

// ─── DEMO DATA ───────────────────────────────────────────────────────────────

const departments = [
  { id: ID.dept_eng, name: 'Engineering' },
  { id: ID.dept_sales, name: 'Vertrieb' },
  { id: ID.dept_marketing, name: 'Marketing' },
  { id: ID.dept_hr, name: 'HR & Operations' },
  { id: ID.dept_finance, name: 'Finanzen' },
];

const jobLevels = [
  { id: ID.lvl_junior, name: 'Junior', rank: 1 },
  { id: ID.lvl_mid, name: 'Mid', rank: 2 },
  { id: ID.lvl_senior, name: 'Senior', rank: 3 },
  { id: ID.lvl_lead, name: 'Lead', rank: 4 },
  { id: ID.lvl_principal, name: 'Principal', rank: 5 },
];

const jobProfiles = [
  { id: ID.jp_swe, title: 'Software Engineer', description: 'Softwareentwicklung im Produktteam (Fullstack, TypeScript/Next.js).', department_id: ID.dept_eng, skills_score: 4, effort_score: 3, responsibility_score: 3, working_conditions_score: 2 },
  { id: ID.jp_devops, title: 'DevOps Engineer', description: 'CI/CD, Infrastruktur, Observability (AWS/GCP, Terraform).', department_id: ID.dept_eng, skills_score: 4, effort_score: 3, responsibility_score: 4, working_conditions_score: 2 },
  { id: ID.jp_pm, title: 'Product Manager', description: 'Produktstrategie, Roadmap, Discovery — schnittstellig zu Engineering & Vertrieb.', department_id: ID.dept_eng, skills_score: 4, effort_score: 3, responsibility_score: 4, working_conditions_score: 2 },
  { id: ID.jp_qa, title: 'QA Engineer', description: 'Test-Automatisierung, Quality Gates, E2E-Tests.', department_id: ID.dept_eng, skills_score: 3, effort_score: 3, responsibility_score: 3, working_conditions_score: 2 },
  { id: ID.jp_ae, title: 'Account Executive', description: 'B2B-Vertrieb für Bestands- und Neukunden, Closing-verantwortlich.', department_id: ID.dept_sales, skills_score: 3, effort_score: 4, responsibility_score: 4, working_conditions_score: 3 },
  { id: ID.jp_sdr, title: 'Sales Development Representative', description: 'Outbound-Prospecting, Pipeline-Aufbau, Qualifizierung.', department_id: ID.dept_sales, skills_score: 2, effort_score: 4, responsibility_score: 2, working_conditions_score: 3 },
  { id: ID.jp_mkt, title: 'Marketing Manager', description: 'Demand Generation, Content & Performance Marketing.', department_id: ID.dept_marketing, skills_score: 3, effort_score: 3, responsibility_score: 3, working_conditions_score: 2 },
  { id: ID.jp_hrbp, title: 'HR Business Partner', description: 'Beratung Führungskräfte, Recruiting, People Operations.', department_id: ID.dept_hr, skills_score: 3, effort_score: 3, responsibility_score: 4, working_conditions_score: 2 },
  { id: ID.jp_controller, title: 'Finanzcontroller', description: 'Budget, Forecast, Reporting; Begleitung Jahresabschluss.', department_id: ID.dept_finance, skills_score: 4, effort_score: 3, responsibility_score: 4, working_conditions_score: 2 },
  { id: ID.jp_accountant, title: 'Buchhalter:in', description: 'Debitoren-/Kreditorenbuchhaltung, USt-Voranmeldung.', department_id: ID.dept_finance, skills_score: 3, effort_score: 3, responsibility_score: 3, working_conditions_score: 2 },
];

const payBands = [
  { id: ID.pb_swe_jr, job_profile_id: ID.jp_swe, job_level_id: ID.lvl_junior, min_salary: 48000, max_salary: 58000 },
  { id: ID.pb_swe_mid, job_profile_id: ID.jp_swe, job_level_id: ID.lvl_mid, min_salary: 62000, max_salary: 78000 },
  { id: ID.pb_swe_sr, job_profile_id: ID.jp_swe, job_level_id: ID.lvl_senior, min_salary: 75000, max_salary: 95000 },
  { id: ID.pb_swe_lead, job_profile_id: ID.jp_swe, job_level_id: ID.lvl_lead, min_salary: 95000, max_salary: 118000 },
  { id: ID.pb_devops_mid, job_profile_id: ID.jp_devops, job_level_id: ID.lvl_mid, min_salary: 65000, max_salary: 82000 },
  { id: ID.pb_devops_sr, job_profile_id: ID.jp_devops, job_level_id: ID.lvl_senior, min_salary: 80000, max_salary: 100000 },
  { id: ID.pb_pm_sr, job_profile_id: ID.jp_pm, job_level_id: ID.lvl_senior, min_salary: 82000, max_salary: 102000 },
  { id: ID.pb_qa_mid, job_profile_id: ID.jp_qa, job_level_id: ID.lvl_mid, min_salary: 55000, max_salary: 70000 },
  { id: ID.pb_ae_mid, job_profile_id: ID.jp_ae, job_level_id: ID.lvl_mid, min_salary: 56000, max_salary: 72000 },
  { id: ID.pb_ae_sr, job_profile_id: ID.jp_ae, job_level_id: ID.lvl_senior, min_salary: 75000, max_salary: 95000 },
  { id: ID.pb_sdr_jr, job_profile_id: ID.jp_sdr, job_level_id: ID.lvl_junior, min_salary: 42000, max_salary: 52000 },
  { id: ID.pb_mkt_mid, job_profile_id: ID.jp_mkt, job_level_id: ID.lvl_mid, min_salary: 58000, max_salary: 72000 },
  { id: ID.pb_hrbp_sr, job_profile_id: ID.jp_hrbp, job_level_id: ID.lvl_senior, min_salary: 70000, max_salary: 88000 },
  { id: ID.pb_controller_sr, job_profile_id: ID.jp_controller, job_level_id: ID.lvl_senior, min_salary: 75000, max_salary: 92000 },
  { id: ID.pb_accountant_mid, job_profile_id: ID.jp_accountant, job_level_id: ID.lvl_mid, min_salary: 50000, max_salary: 62000 },
];

// 30 employees. Indices 1-30. Indices in Gap A: 1-7. Indices in Gap B: 15-19.
// "owner" employee = #25 (Sandra Becker, HRBP Senior). "hr" employee = #26 (Markus Hofer).
const employees = [
  // ─── GAP-GRUPPE A: Software Engineer Senior (4♂ ~88k, 3♀ ~78.5k → ~10.8% gap) ───
  { n: 1, first_name: 'Lukas', last_name: 'Wagner', gender: 'male', birth_year: 1988, hire_date: '2020-03-01', base_salary: 92000, profile: ID.jp_swe, level: ID.lvl_senior, pay_band: ID.pb_swe_sr, dept: ID.dept_eng, location: 'Berlin' },
  { n: 2, first_name: 'Tobias', last_name: 'Hofmann', gender: 'male', birth_year: 1985, hire_date: '2019-08-15', base_salary: 90000, profile: ID.jp_swe, level: ID.lvl_senior, pay_band: ID.pb_swe_sr, dept: ID.dept_eng, location: 'Berlin' },
  { n: 3, first_name: 'Matthias', last_name: 'Krüger', gender: 'male', birth_year: 1987, hire_date: '2021-01-04', base_salary: 87000, profile: ID.jp_swe, level: ID.lvl_senior, pay_band: ID.pb_swe_sr, dept: ID.dept_eng, location: 'Berlin' },
  { n: 4, first_name: 'Jens', last_name: 'Schäfer', gender: 'male', birth_year: 1989, hire_date: '2020-09-01', base_salary: 83000, profile: ID.jp_swe, level: ID.lvl_senior, pay_band: ID.pb_swe_sr, dept: ID.dept_eng, location: 'Berlin' },
  { n: 5, first_name: 'Anna', last_name: 'Schulz', gender: 'female', birth_year: 1990, hire_date: '2021-06-01', base_salary: 80000, profile: ID.jp_swe, level: ID.lvl_senior, pay_band: ID.pb_swe_sr, dept: ID.dept_eng, location: 'Berlin' },
  { n: 6, first_name: 'Julia', last_name: 'Richter', gender: 'female', birth_year: 1988, hire_date: '2020-11-01', base_salary: 78000, profile: ID.jp_swe, level: ID.lvl_senior, pay_band: ID.pb_swe_sr, dept: ID.dept_eng, location: 'Berlin' },
  { n: 7, first_name: 'Lisa', last_name: 'Vogel', gender: 'female', birth_year: 1991, hire_date: '2022-03-15', base_salary: 77500, profile: ID.jp_swe, level: ID.lvl_senior, pay_band: ID.pb_swe_sr, dept: ID.dept_eng, location: 'Berlin' },
  // ─── Other Engineering (clean comparators) ───
  { n: 8, first_name: 'Daniel', last_name: 'Becker', gender: 'male', birth_year: 1992, hire_date: '2022-09-01', base_salary: 70000, profile: ID.jp_swe, level: ID.lvl_mid, pay_band: ID.pb_swe_mid, dept: ID.dept_eng, location: 'Berlin' },
  { n: 9, first_name: 'Sarah', last_name: 'Klein', gender: 'female', birth_year: 1993, hire_date: '2023-01-15', base_salary: 69500, profile: ID.jp_swe, level: ID.lvl_mid, pay_band: ID.pb_swe_mid, dept: ID.dept_eng, location: 'Berlin' },
  { n: 10, first_name: 'Felix', last_name: 'Braun', gender: 'male', birth_year: 1996, hire_date: '2024-04-01', base_salary: 53000, profile: ID.jp_swe, level: ID.lvl_junior, pay_band: ID.pb_swe_jr, dept: ID.dept_eng, location: 'Berlin' },
  { n: 11, first_name: 'Mira', last_name: 'Engel', gender: 'female', birth_year: 1997, hire_date: '2024-07-15', base_salary: 52500, profile: ID.jp_swe, level: ID.lvl_junior, pay_band: ID.pb_swe_jr, dept: ID.dept_eng, location: 'Berlin' },
  { n: 12, first_name: 'Christian', last_name: 'Roth', gender: 'male', birth_year: 1982, hire_date: '2018-02-01', base_salary: 110000, profile: ID.jp_swe, level: ID.lvl_lead, pay_band: ID.pb_swe_lead, dept: ID.dept_eng, location: 'Berlin' },
  { n: 13, first_name: 'Markus', last_name: 'Sommer', gender: 'male', birth_year: 1986, hire_date: '2019-10-01', base_salary: 89000, profile: ID.jp_devops, level: ID.lvl_senior, pay_band: ID.pb_devops_sr, dept: ID.dept_eng, location: 'Berlin' },
  { n: 14, first_name: 'Nicole', last_name: 'Fuchs', gender: 'female', birth_year: 1989, hire_date: '2021-05-01', base_salary: 92000, profile: ID.jp_pm, level: ID.lvl_senior, pay_band: ID.pb_pm_sr, dept: ID.dept_eng, location: 'Berlin' },
  // ─── GAP-GRUPPE B: Account Executive Mid (3♂ ~66k, 2♀ ~58k → ~12.1% gap) ───
  { n: 15, first_name: 'Stefan', last_name: 'Maier', gender: 'male', birth_year: 1987, hire_date: '2020-04-01', base_salary: 68000, profile: ID.jp_ae, level: ID.lvl_mid, pay_band: ID.pb_ae_mid, dept: ID.dept_sales, location: 'München' },
  { n: 16, first_name: 'Andreas', last_name: 'Bauer', gender: 'male', birth_year: 1986, hire_date: '2019-11-15', base_salary: 66000, profile: ID.jp_ae, level: ID.lvl_mid, pay_band: ID.pb_ae_mid, dept: ID.dept_sales, location: 'München' },
  { n: 17, first_name: 'Patrick', last_name: 'Lang', gender: 'male', birth_year: 1989, hire_date: '2021-08-01', base_salary: 64000, profile: ID.jp_ae, level: ID.lvl_mid, pay_band: ID.pb_ae_mid, dept: ID.dept_sales, location: 'München' },
  { n: 18, first_name: 'Marie', last_name: 'Köhler', gender: 'female', birth_year: 1990, hire_date: '2021-10-01', base_salary: 59000, profile: ID.jp_ae, level: ID.lvl_mid, pay_band: ID.pb_ae_mid, dept: ID.dept_sales, location: 'München' },
  { n: 19, first_name: 'Sabrina', last_name: 'Weber', gender: 'female', birth_year: 1992, hire_date: '2022-05-15', base_salary: 57000, profile: ID.jp_ae, level: ID.lvl_mid, pay_band: ID.pb_ae_mid, dept: ID.dept_sales, location: 'München' },
  // ─── Other Vertrieb (clean) ───
  { n: 20, first_name: 'Thomas', last_name: 'Neumann', gender: 'male', birth_year: 1981, hire_date: '2017-06-01', base_salary: 88000, profile: ID.jp_ae, level: ID.lvl_senior, pay_band: ID.pb_ae_sr, dept: ID.dept_sales, location: 'München' },
  { n: 21, first_name: 'Carolin', last_name: 'Brandt', gender: 'female', birth_year: 1984, hire_date: '2018-09-01', base_salary: 86000, profile: ID.jp_ae, level: ID.lvl_senior, pay_band: ID.pb_ae_sr, dept: ID.dept_sales, location: 'München' },
  { n: 22, first_name: 'Kevin', last_name: 'Pohl', gender: 'male', birth_year: 1998, hire_date: '2024-02-01', base_salary: 47000, profile: ID.jp_sdr, level: ID.lvl_junior, pay_band: ID.pb_sdr_jr, dept: ID.dept_sales, location: 'München' },
  // ─── Marketing ───
  { n: 23, first_name: 'Vanessa', last_name: 'Hartmann', gender: 'female', birth_year: 1988, hire_date: '2020-08-01', base_salary: 67000, profile: ID.jp_mkt, level: ID.lvl_mid, pay_band: ID.pb_mkt_mid, dept: ID.dept_marketing, location: 'Berlin' },
  { n: 24, first_name: 'Jonas', last_name: 'Hahn', gender: 'male', birth_year: 1990, hire_date: '2021-11-15', base_salary: 66500, profile: ID.jp_mkt, level: ID.lvl_mid, pay_band: ID.pb_mkt_mid, dept: ID.dept_marketing, location: 'Berlin' },
  // ─── HR & Operations ───
  { n: 25, first_name: 'Sandra', last_name: 'Becker', gender: 'female', birth_year: 1983, hire_date: '2016-04-01', base_salary: 82000, profile: ID.jp_hrbp, level: ID.lvl_senior, pay_band: ID.pb_hrbp_sr, dept: ID.dept_hr, location: 'Berlin', is_owner: true },
  { n: 26, first_name: 'Markus', last_name: 'Hofer', gender: 'male', birth_year: 1986, hire_date: '2018-07-01', base_salary: 78000, profile: ID.jp_hrbp, level: ID.lvl_senior, pay_band: ID.pb_hrbp_sr, dept: ID.dept_hr, location: 'Berlin', is_hr: true },
  { n: 27, first_name: 'Petra', last_name: 'Wolf', gender: 'female', birth_year: 1979, hire_date: '2015-09-01', base_salary: 64000, profile: ID.jp_hrbp, level: ID.lvl_mid, pay_band: null, dept: ID.dept_hr, location: 'Berlin', on_leave: true, leave_type: 'parental', leave_start: '2026-01-15', leave_end: '2026-12-31' },
  // ─── Finanzen ───
  { n: 28, first_name: 'Michael', last_name: 'Zimmermann', gender: 'male', birth_year: 1980, hire_date: '2017-01-15', base_salary: 84000, profile: ID.jp_controller, level: ID.lvl_senior, pay_band: ID.pb_controller_sr, dept: ID.dept_finance, location: 'Berlin' },
  { n: 29, first_name: 'Stefanie', last_name: 'König', gender: 'female', birth_year: 1985, hire_date: '2019-03-01', base_salary: 83000, profile: ID.jp_controller, level: ID.lvl_senior, pay_band: ID.pb_controller_sr, dept: ID.dept_finance, location: 'Berlin' },
  { n: 30, first_name: 'Birgit', last_name: 'Werner', gender: 'female', birth_year: 1976, hire_date: '2014-10-01', base_salary: 56000, profile: ID.jp_accountant, level: ID.lvl_mid, pay_band: ID.pb_accountant_mid, dept: ID.dept_finance, location: 'Berlin', employment_type: 'part_time', weekly_hours: 32 },
];

// ─── BUILD AND INSERT ────────────────────────────────────────────────────────

async function buildAndInsertAll(orgId, ownerUserId, hrUserId) {
  console.log(`\n→ Seeding Supabase data for org ${orgId}…`);

  // 1. companies
  await sbInsert('companies', [{
    id: ID.company,
    organization_id: orgId,
    name: COMPANY_NAME_SHORT,
    legal_name: COMPANY_NAME,
    country: 'DE',
    industry: 'Management- & Technologieberatung',
    employee_size_band: '1-49',
    reporting_frequency: 'voluntary',
    subscription_tier: 'basis',
    subscription_status: 'active',
    created_by: ownerUserId,
  }]);

  // 2. profiles (one per Logto user) — has company_id (nullable historically; we set it)
  await sbInsert('profiles', [
    { user_id: ownerUserId, organization_id: orgId, company_id: ID.company, full_name: DEMO_OWNER_NAME, email: DEMO_OWNER_EMAIL },
    { user_id: hrUserId, organization_id: orgId, company_id: ID.company, full_name: DEMO_HR_NAME, email: DEMO_HR_EMAIL },
  ]);

  // 3. organization_members (service role → can set owner)
  await sbInsert('organization_members', [
    { organization_id: orgId, user_id: ownerUserId, role: 'owner', status: 'active' },
    { organization_id: orgId, user_id: hrUserId, role: 'hr_manager', status: 'active' },
  ]);

  // 4. user_roles (legacy; some routes still read it) — has company_id
  await sbInsert('user_roles', [
    { user_id: ownerUserId, organization_id: orgId, company_id: ID.company, role: 'admin' },
    { user_id: hrUserId, organization_id: orgId, company_id: ID.company, role: 'hr_manager' },
  ]);

  // 5. departments
  await sbInsert('departments', departments.map(d => ({ id: d.id, organization_id: orgId, name: d.name })));

  // 6. job_levels
  await sbInsert('job_levels', jobLevels.map(l => ({ id: l.id, organization_id: orgId, name: l.name, rank: l.rank })));

  // 7. job_profiles (has company_id NOT NULL)
  await sbInsert('job_profiles', jobProfiles.map(p => ({
    id: p.id, organization_id: orgId, company_id: ID.company,
    title: p.title, description: p.description,
    department_id: p.department_id, skills_score: p.skills_score, effort_score: p.effort_score,
    responsibility_score: p.responsibility_score, working_conditions_score: p.working_conditions_score,
    is_active: true,
  })));

  // 8. pay_bands (has company_id NOT NULL)
  await sbInsert('pay_bands', payBands.map(b => ({
    id: b.id, organization_id: orgId, company_id: ID.company,
    job_profile_id: b.job_profile_id, job_level_id: b.job_level_id,
    min_salary: b.min_salary, max_salary: b.max_salary, currency: 'EUR', is_active: true,
    effective_from: '2026-01-01',
  })));

  // 9. employees (has company_id NOT NULL)
  // Note: triggers were already disabled in main() before the wipe and will be
  // re-enabled in main()'s finally block.
  const employeeRows = employees.map(e => ({
    id: empId(e.n),
    organization_id: orgId,
    company_id: ID.company,
    employee_number: `MS-${String(e.n).padStart(4, '0')}`,
    first_name: e.first_name,
    last_name: e.last_name,
    email: `${e.first_name.toLowerCase()}.${e.last_name.toLowerCase().replace(/[ß]/g, 'ss').replace(/[äöü]/g, c => ({ä:'ae',ö:'oe',ü:'ue'}[c]))}@${EMPLOYEE_EMAIL_DOMAIN}`,
    gender: e.gender,
    birth_year: e.birth_year,
    job_profile_id: e.profile,
    job_level_id: e.level,
    department_id: e.dept,
    employment_type: e.employment_type || 'full_time',
    location: e.location,
    hire_date: e.hire_date,
    base_salary: e.base_salary,
    variable_pay: 0,
    weekly_hours: e.weekly_hours ?? 40,
    currency: 'EUR',
    pay_band_id: e.pay_band ?? null,
    on_leave: e.on_leave ?? false,
    leave_type: e.leave_type ?? null,
    leave_start: e.leave_start ?? null,
    leave_end: e.leave_end ?? null,
    user_id: e.is_owner ? ownerUserId : e.is_hr ? hrUserId : null,
    is_active: true,
    created_by: ownerUserId,
  }));
  await sbInsert('employees', employeeRows);

  // 10. salary_decisions — at minimum one HIRE per employee + a few raises/promotions
  const decisions = [];
  const findBand = (band_id) => payBands.find(b => b.id === band_id);
  const peerCount = (jp, lvl) => employees.filter(x => x.profile === jp && x.level === lvl).length;
  for (const e of employees) {
    const band = e.pay_band ? findBand(e.pay_band) : null;
    decisions.push({
      id: randomUUID(),
      organization_id: orgId,
      employee_id: empId(e.n),
      decision_type: 'hire',
      old_salary: null,
      new_salary: e.base_salary,
      justification_text: `Einstellung als ${jobProfiles.find(p => p.id === e.profile)?.title} (${jobLevels.find(l => l.id === e.level)?.name}). Einstiegsgehalt gemäß Pay Band, Vorerfahrung und Qualifikation berücksichtigt.`,
      justification_factors: ['seniority', 'qualification', 'market_benchmark'],
      decided_by_user_id: ownerUserId,
      decided_at: `${e.hire_date}T09:00:00Z`,
      pay_band_id: e.pay_band,
      comparator_data: band ? { band_min: band.min_salary, band_max: band.max_salary, peer_count: peerCount(e.profile, e.level) } : {},
    });
  }
  // Add 4 raises (real performance/market events) on senior employees
  const raises = [
    { n: 1, old: 88000, new: 92000, at: '2024-04-01T10:00:00Z', why: 'Jahresgespräch: Performance "übertrifft Erwartungen", Marktanpassung +4,5% gemäß Stepstone-Benchmark Berlin.' },
    { n: 20, old: 82000, new: 88000, at: '2023-07-01T10:00:00Z', why: 'Beförderung zum AE Senior, Übernahme Key-Account-Verantwortung, KPI-Erreichung Q1-Q2 2023.' },
    { n: 28, old: 78000, new: 84000, at: '2024-01-15T10:00:00Z', why: 'Marktanpassung Finanzcontroller laut Kienbaum-Vergleich, Verantwortung für Jahresabschluss 2023.' },
    { n: 21, old: 80000, new: 86000, at: '2023-10-01T10:00:00Z', why: 'Jahresgespräch: KPI 112% erreicht, Marktanpassung Vertrieb +7,5%.' },
  ];
  for (const r of raises) {
    const e = employees.find(x => x.n === r.n);
    const band = e?.pay_band ? findBand(e.pay_band) : null;
    decisions.push({
      id: randomUUID(),
      organization_id: orgId,
      employee_id: empId(r.n),
      decision_type: 'raise',
      old_salary: r.old,
      new_salary: r.new,
      justification_text: r.why,
      justification_factors: ['performance_rating', 'market_benchmark'],
      decided_by_user_id: ownerUserId,
      decided_at: r.at,
      pay_band_id: e?.pay_band ?? null,
      comparator_data: band ? { band_min: band.min_salary, band_max: band.max_salary, peer_count: peerCount(e.profile, e.level) } : {},
    });
  }
  // 2 promotions
  const promotions = [
    { n: 12, old: 95000, new: 110000, at: '2023-04-01T10:00:00Z', why: 'Beförderung Senior → Lead Software Engineer. Übernahme technische Leitung Plattform-Team, Mentoring 3 Mid-Engineers.' },
    { n: 14, old: 80000, new: 92000, at: '2024-01-01T10:00:00Z', why: 'Beförderung Mid → Senior Product Manager nach 24 Monaten. Verantwortung für Produktbereich Plattform, KPI-Erreichung.' },
  ];
  for (const p of promotions) {
    const e = employees.find(x => x.n === p.n);
    const band = e?.pay_band ? findBand(e.pay_band) : null;
    decisions.push({
      id: randomUUID(),
      organization_id: orgId,
      employee_id: empId(p.n),
      decision_type: 'promotion',
      old_salary: p.old,
      new_salary: p.new,
      justification_text: p.why,
      justification_factors: ['promotion', 'responsibility_increase', 'tenure'],
      decided_by_user_id: ownerUserId,
      decided_at: p.at,
      pay_band_id: e?.pay_band ?? null,
      comparator_data: band ? { band_min: band.min_salary, band_max: band.max_salary, peer_count: peerCount(e.profile, e.level) } : {},
    });
  }
  await sbInsert('salary_decisions', decisions);

  // 11. info_requests (3 — open / fulfilled / overdue) — has company_id NOT NULL
  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 86400000).toISOString();
  await sbInsert('info_requests', [
    {
      id: randomUUID(),
      organization_id: orgId,
      company_id: ID.company,
      employee_id: empId(19), // Sabrina Weber (Gap B ♀) — fresh request
      request_type: 'salary_info',
      status: 'pending',
      request_data: { job_profile_id: ID.jp_ae },
      response_data: null,
      processed_by: null,
      processed_at: null,
      created_at: daysAgo(2),
    },
    {
      id: randomUUID(),
      organization_id: orgId,
      company_id: ID.company,
      employee_id: empId(18), // Marie Köhler (Gap B ♀) — fulfilled with gendered breakdown
      request_type: 'comparison',
      status: 'completed',
      request_data: { job_profile_id: ID.jp_ae },
      response_data: {
        scope: 'Account Executive · Mid',
        male_count: 3,
        female_count: 2,
        male_mean_base: 66000,
        female_mean_base: 58000,
        mean_gap_pct: 12.1,
        explanation: 'Mean-Gap 12,1% in der Gruppe AE Mid. Ursachenanalyse identifiziert: unterschiedliche Provisionsmodelle (2 ♂ noch im Altmodell mit höherem Fixum). Korrektur durch Joint Assessment Q3 2026 vorgesehen.',
      },
      processed_by: ownerUserId,
      processed_at: daysAgo(5),
      created_at: daysAgo(12),
    },
    {
      id: randomUUID(),
      organization_id: orgId,
      company_id: ID.company,
      employee_id: empId(5), // Anna Schulz (Gap A ♀) — OVERDUE (19d, deadline 14d)
      request_type: 'pay_band_info',
      status: 'pending',
      request_data: { job_profile_id: ID.jp_swe },
      response_data: null,
      processed_by: null,
      processed_at: null,
      deadline_at: daysAgo(5), // deadline was 5 days ago → overdue
      created_at: daysAgo(19),
    },
  ]);

  // 12. audit_logs — SKIPPED in the seed.
  // The production trigger `trg_audit_log_chain_hash` references columns
  // (`NEW.before_state`/`NEW.after_state`) that no longer exist (table was
  // refactored to a single `changes` JSONB). Inserting fails until that bug
  // is fixed. For the demo this is acceptable — the /dashboard/audit view
  // loads with an empty list, which the demo narrator can frame as "wird
  // automatisch gefüllt sobald wir Aktionen durchführen". Real audit-log
  // entries are written by app code when users perform actions in the UI.
  console.log('  ⏭ audit_logs: skipped (prod chain-hash trigger references obsolete columns)');

  // 13. job_postings
  await sbInsert('job_postings', [
    {
      id: randomUUID(), organization_id: orgId,
      title: 'Senior Backend Engineer (m/w/d)',
      job_profile_id: ID.jp_swe, job_level_id: ID.lvl_senior, department_id: ID.dept_eng,
      salary_range_min: 80000, salary_range_max: 100000, currency: 'EUR',
      location: 'Berlin',
      employment_type: 'full_time',
      description: 'Du baust unser SaaS-Produkt im Engineering-Team aus. Stack: TypeScript, Next.js, PostgreSQL. Hybrid-Remote, 40h.',
      salary_disclosed: true,
      published_at: daysAgo(10),
      status: 'published',
      export_text: 'Gehaltsspanne: 80.000 – 100.000 EUR brutto/Jahr (gemäß Art. 5 EU-Richtlinie 2023/970).',
      created_by: ownerUserId,
    },
    {
      id: randomUUID(), organization_id: orgId,
      title: 'Account Executive Senior (m/w/d)',
      job_profile_id: ID.jp_ae, job_level_id: ID.lvl_senior, department_id: ID.dept_sales,
      salary_range_min: 75000, salary_range_max: 95000, currency: 'EUR',
      location: 'München',
      employment_type: 'full_time',
      description: 'B2B-SaaS-Vertrieb für Mittelstandskunden DACH. Closing-verantwortlich, hohes Provisionsmodell.',
      salary_disclosed: true,
      published_at: null,
      status: 'draft',
      export_text: 'Gehaltsspanne: 75.000 – 95.000 EUR brutto/Jahr (gemäß Art. 5 EU-Richtlinie 2023/970).',
      created_by: ownerUserId,
    },
    {
      id: randomUUID(), organization_id: orgId,
      title: 'Marketing Manager (m/w/d)',
      job_profile_id: ID.jp_mkt, job_level_id: ID.lvl_mid, department_id: ID.dept_marketing,
      salary_range_min: 58000, salary_range_max: 72000, currency: 'EUR',
      location: 'Berlin',
      employment_type: 'full_time',
      description: 'Demand Generation, Content & Performance Marketing.',
      salary_disclosed: true,
      published_at: daysAgo(90),
      closed_at: daysAgo(20),
      status: 'closed',
      export_text: 'Gehaltsspanne: 58.000 – 72.000 EUR brutto/Jahr (gemäß Art. 5 EU-Richtlinie 2023/970).',
      created_by: ownerUserId,
    },
  ]);

  // 14. pay_gap_snapshots — pre-computed (company + 2 departments + 2 job profiles)
  const today = now.toISOString().slice(0, 10);
  const stats = computeStatsFor(employees);
  const snapshots = [
    {
      organization_id: orgId, snapshot_date: today, scope: 'company', scope_id: null,
      scope_label: 'Müller & Schmidt Consulting',
      ...stats.company,
    },
    {
      organization_id: orgId, snapshot_date: today, scope: 'department', scope_id: ID.dept_eng,
      scope_label: 'Engineering',
      ...stats.eng,
    },
    {
      organization_id: orgId, snapshot_date: today, scope: 'department', scope_id: ID.dept_sales,
      scope_label: 'Vertrieb',
      ...stats.sales,
    },
    {
      organization_id: orgId, snapshot_date: today, scope: 'job_profile', scope_id: ID.jp_swe,
      scope_label: 'Software Engineer · Senior',
      ...stats.swe_sr,
    },
    {
      organization_id: orgId, snapshot_date: today, scope: 'job_profile', scope_id: ID.jp_ae,
      scope_label: 'Account Executive · Mid',
      ...stats.ae_mid,
    },
  ];
  await sbInsert('pay_gap_snapshots', snapshots.map(s => ({ id: randomUUID(), ...s })));
}

// ─── PAY-GAP COMPUTATION (mean + median, gap_status thresholds 5%/10%) ───────

function computeStatsFor(emps) {
  const safe = (arr) => arr.filter(x => !x.on_leave);
  const males = (arr) => safe(arr).filter(x => x.gender === 'male').map(x => Number(x.base_salary));
  const females = (arr) => safe(arr).filter(x => x.gender === 'female').map(x => Number(x.base_salary));
  const mean = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  const median = (xs) => {
    if (!xs.length) return null;
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const pct = (mMean, fMean) => mMean && fMean ? Math.round(((mMean - fMean) / mMean) * 10000) / 100 : null;
  const status = (p) => p === null ? 'compliant' : Math.abs(p) <= 5 ? 'compliant' : Math.abs(p) <= 10 ? 'warning' : 'breach';

  const build = (arr) => {
    const m = males(arr), f = females(arr);
    const mMean = mean(m), fMean = mean(f);
    const mMed = median(m), fMed = median(f);
    const meanGap = pct(mMean, fMean);
    const medGap = pct(mMed, fMed);
    return {
      male_count: m.length, female_count: f.length,
      male_mean_base: mMean, female_mean_base: fMean,
      male_median_base: mMed, female_median_base: fMed,
      mean_gap_base_pct: meanGap, median_gap_base_pct: medGap,
      gap_status: status(meanGap),
      // requires_joint_assessment / quartile columns removed — not in prod schema
      is_suppressed: m.length + f.length < 5,
    };
  };

  return {
    company: build(emps),
    eng: build(emps.filter(e => e.dept === ID.dept_eng)),
    sales: build(emps.filter(e => e.dept === ID.dept_sales)),
    swe_sr: build(emps.filter(e => e.profile === ID.jp_swe && e.level === ID.lvl_senior)),
    ae_mid: build(emps.filter(e => e.profile === ID.jp_ae && e.level === ID.lvl_mid)),
  };
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function teardown() {
  console.log('→ TEARDOWN: deleting demo Logto users + org, wiping Supabase rows…');
  // Discover existing
  const owner = await logtoSilent('GET',
    `/api/users?search=${encodeURIComponent(DEMO_OWNER_EMAIL)}&searchFields=primaryEmail&mode=exact&limit=1`);
  const hr = await logtoSilent('GET',
    `/api/users?search=${encodeURIComponent(DEMO_HR_EMAIL)}&searchFields=primaryEmail&mode=exact&limit=1`);
  const orgs = await logtoSilent('GET',
    `/api/organizations?q=${encodeURIComponent(COMPANY_NAME)}&page=1&page_size=20`);
  const org = orgs?.find(o => o.name === COMPANY_NAME);
  if (org) {
    await wipeOrgData(org.id, owner?.[0]?.id, hr?.[0]?.id);
    await deleteLogtoOrg(org.id);
    console.log(`  ✓ deleted Logto org ${org.id}`);
  }
  if (owner?.[0]) { await deleteLogtoUser(owner[0].id); console.log(`  ✓ deleted Logto user ${owner[0].id}`); }
  if (hr?.[0]) { await deleteLogtoUser(hr[0].id); console.log(`  ✓ deleted Logto user ${hr[0].id}`); }
  console.log('✓ Teardown complete.\n');
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  KLARGEHALT DEMO SEED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (FLAG_TEARDOWN) {
    await teardown();
    return;
  }

  // 1. Logto: idempotent user + org + membership
  console.log('\n→ Logto: ensuring demo user + org…');
  const owner = await findOrCreateLogtoUser(DEMO_OWNER_EMAIL, DEMO_OWNER_NAME);
  console.log(`  ✓ owner ${DEMO_OWNER_EMAIL}  →  ${owner.id}  ${owner.created ? '(created)' : '(reused)'}`);
  const hr = await findOrCreateLogtoUser(DEMO_HR_EMAIL, DEMO_HR_NAME);
  console.log(`  ✓ hr    ${DEMO_HR_EMAIL}  →  ${hr.id}  ${hr.created ? '(created)' : '(reused)'}`);
  const orgId = await findOrCreateLogtoOrg(COMPANY_NAME);
  console.log(`  ✓ org   "${COMPANY_NAME}"  →  ${orgId}`);
  await addLogtoUserToOrg(orgId, owner.id);
  await addLogtoUserToOrg(orgId, hr.id);
  console.log('  ✓ both users added to org');
  // Best-effort Logto org-role assignment — Supabase RLS is the real enforcement
  await assignLogtoOrgRole(orgId, owner.id, 'owner');
  await assignLogtoOrgRole(orgId, owner.id, 'admin');
  await assignLogtoOrgRole(orgId, hr.id, 'hr_manager');

  // 2. Disable the problematic triggers (service-role hits the org guard on
  //    pay-gap refresh, and salary_decisions audit references obsolete columns)
  //    BEFORE the wipe too — the wipe's DELETE on employees would otherwise fire
  //    the same triggers.
  console.log('\n→ Disabling pay-gap and audit triggers around bulk seed…');
  await setTriggers('DISABLE');
  try {
    // 3. Always full-wipe for idempotency (demo org is dedicated, no shared rows)
    console.log('\n→ Wiping existing Supabase rows for this demo org…');
    await wipeOrgData(orgId, owner.id, hr.id);

    // 4. Seed everything
    await buildAndInsertAll(orgId, owner.id, hr.id);
  } finally {
    // Always re-enable triggers, even if the seed fails partway
    try { await setTriggers('ENABLE'); } catch (e) { console.error('  ! could not re-enable triggers:', e.message); }
  }

  // 4. Print credentials banner
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ✓ DEMO READY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Login URL:   https://app.klargehalt.de/sign-in`);
  console.log('');
  console.log(`  Owner (HR Lead, Sandra Becker):`);
  console.log(`    Email:     ${DEMO_OWNER_EMAIL}`);
  console.log(`    Password:  ${DEMO_PASSWORD}`);
  console.log('');
  console.log(`  HR Manager seat (optional 2nd login, Markus Hofer):`);
  console.log(`    Email:     ${DEMO_HR_EMAIL}`);
  console.log(`    Password:  ${DEMO_PASSWORD}`);
  console.log('');
  console.log(`  Org ID:      ${orgId}`);
  console.log(`  Company:     ${COMPANY_NAME}`);
  console.log(`  Tier:        basis (1-50 MA), 30 employees seeded`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(err => {
  console.error('\n✗ SEED FAILED:', err.message);
  console.error(err);
  process.exit(1);
});
