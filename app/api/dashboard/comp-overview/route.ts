/**
 * GET /api/dashboard/comp-overview
 *
 * Powers the Dashboard's compensation-matrix overview. Returns everything
 * the homepage needs in one round-trip:
 *   - departments (id, name)
 *   - levels (id, name, rank) — already sorted
 *   - profiles (id, title, department_id)
 *   - bands (job_profile_id × job_level_id → min/max)
 *   - kpis: headcount, gender split, mean gap %, flagged cohort count
 *   - cohortFlags: { profile_id, level_id, gap_status } for the cells we
 *     need to highlight on the matrix
 *   - recentDecisions: last 5 salary_decisions with employee names
 *
 * Service-role read — bypasses RLS so the dashboard renders reliably
 * regardless of JWT state.
 */

import { NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardOrgMember } from '@/lib/auth/api-guard';
import { createServiceClient } from '@/lib/supabase/server';

type Emp = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  base_salary: number | null;
  job_profile_id: string | null;
  job_level_id: string | null;
  is_active: boolean | null;
  on_leave: boolean | null;
};

type Decision = {
  id: string;
  decision_type: string;
  new_salary: number;
  old_salary: number | null;
  decided_at: string;
  justification_text: string;
  employee_id: string;
};

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round = (n: number, d = 2) => Math.round(n * Math.pow(10, d)) / Math.pow(10, d);

export async function GET() {
  const ctx = await getServerAuthContext();
  // Tenant-isolation gate (Risk #1): validate org membership before any
  // service-role read — the kg_active_org cookie is not JWT-verified.
  const guard = await guardOrgMember(ctx);
  if (guard instanceof NextResponse) return guard;
  const orgId = guard.orgId;
  const admin = createServiceClient();

  const [
    { data: departments },
    { data: levels },
    { data: profiles },
    { data: bands },
    { data: empsRaw },
    { data: decisionsRaw },
    { data: snapshots },
  ] = await Promise.all([
    admin.from('departments').select('id, name').eq('organization_id', orgId).order('name'),
    admin.from('job_levels').select('id, name, rank').eq('organization_id', orgId).order('rank', { ascending: true }),
    admin.from('job_profiles').select('id, title, department_id, is_active').eq('organization_id', orgId).eq('is_active', true),
    admin.from('pay_bands').select('id, job_profile_id, job_level_id, min_salary, max_salary, is_active').eq('organization_id', orgId).eq('is_active', true),
    admin.from('employees').select('id, first_name, last_name, gender, base_salary, job_profile_id, job_level_id, is_active, on_leave').eq('organization_id', orgId),
    admin.from('salary_decisions').select('id, decision_type, new_salary, old_salary, decided_at, justification_text, employee_id').eq('organization_id', orgId).order('decided_at', { ascending: false }).limit(5),
    admin.from('pay_gap_snapshots').select('scope, scope_id, gap_status, mean_gap_base_pct, male_count, female_count').eq('organization_id', orgId).order('snapshot_date', { ascending: false }),
  ]);

  const employees = (empsRaw ?? []) as Emp[];
  const active = employees.filter((e) => e.is_active && !e.on_leave);

  // Compute per-cohort gap status (profile × level) from active employees
  const cohortKey = (p: string, l: string) => `${p}::${l}`;
  const cohorts = new Map<string, { male: number[]; female: number[] }>();
  for (const e of active) {
    if (!e.job_profile_id || !e.job_level_id || !e.gender) continue;
    const k = cohortKey(e.job_profile_id, e.job_level_id);
    const c = cohorts.get(k) ?? { male: [], female: [] };
    if (e.gender === 'male') c.male.push(Number(e.base_salary));
    else if (e.gender === 'female') c.female.push(Number(e.base_salary));
    cohorts.set(k, c);
  }
  const cohortFlags: Array<{ profile_id: string; level_id: string; status: 'compliant' | 'warning' | 'breach'; headcount: number; gap: number | null }> = [];
  for (const [k, c] of cohorts) {
    const [profile_id, level_id] = k.split('::');
    const mM = mean(c.male);
    const mF = mean(c.female);
    let gap: number | null = null;
    if (mM !== null && mF !== null && mM > 0) gap = round(((mM - mF) / mM) * 100);
    const total = c.male.length + c.female.length;
    let status: 'compliant' | 'warning' | 'breach' = 'compliant';
    if (gap !== null) {
      const a = Math.abs(gap);
      if (a > 10) status = 'breach';
      else if (a > 5) status = 'warning';
    }
    cohortFlags.push({ profile_id, level_id, status, headcount: total, gap });
  }

  // KPIs
  const males = active.filter((e) => e.gender === 'male').map((e) => Number(e.base_salary)).filter(Number.isFinite);
  const females = active.filter((e) => e.gender === 'female').map((e) => Number(e.base_salary)).filter(Number.isFinite);
  const mMean = mean(males);
  const fMean = mean(females);
  const meanGapPct = mMean !== null && fMean !== null && mMean > 0 ? round(((mMean - fMean) / mMean) * 100) : null;
  const flaggedCount = cohortFlags.filter((c) => c.status !== 'compliant').length;
  const breachCount = cohortFlags.filter((c) => c.status === 'breach').length;

  // Resolve employee names for recent decisions
  const decisions = (decisionsRaw ?? []) as Decision[];
  const empIds = [...new Set(decisions.map((d) => d.employee_id))];
  const empNameMap = new Map<string, string>();
  for (const e of employees) {
    if (empIds.includes(e.id)) {
      empNameMap.set(e.id, `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim() || '—');
    }
  }

  return NextResponse.json({
    snapshot_date: new Date().toISOString().slice(0, 10),
    departments: departments ?? [],
    levels: levels ?? [],
    profiles: profiles ?? [],
    bands: bands ?? [],
    employeesByCohort: Object.fromEntries(
      [...cohorts].map(([k, c]) => [k, { male: c.male.length, female: c.female.length }])
    ),
    cohortFlags,
    kpis: {
      total_employees: employees.length,
      active_employees: active.length,
      male_count: active.filter((e) => e.gender === 'male').length,
      female_count: active.filter((e) => e.gender === 'female').length,
      avg_salary: active.length ? round(mean(active.map((e) => Number(e.base_salary)))!) : null,
      mean_gap_pct: meanGapPct,
      flagged_cohorts: flaggedCount,
      breach_cohorts: breachCount,
      total_bands: (bands ?? []).length,
      total_profiles: (profiles ?? []).length,
    },
    recentDecisions: decisions.map((d) => ({
      id: d.id,
      type: d.decision_type,
      new_salary: d.new_salary,
      old_salary: d.old_salary,
      decided_at: d.decided_at,
      justification: d.justification_text,
      employee_name: empNameMap.get(d.employee_id) ?? '—',
      delta: d.old_salary !== null ? d.new_salary - d.old_salary : null,
    })),
    companyGapStatus: snapshots?.find((s: { scope: string }) => s.scope === 'company')?.gap_status ?? null,
  });
}
