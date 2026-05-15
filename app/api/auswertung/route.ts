/**
 * GET /api/auswertung
 *
 * Server-side analysis of the organization's pay structure for the
 * Auswertungs-page. Uses the service role so the response is consistent
 * regardless of JWT-lag, RLS quirks, or client-token availability.
 *
 * Returns a single JSON payload with every section the UI needs:
 *   - kpis (head-counts, average/median salary, flagged-cohort count)
 *   - companyGap (mean + median gender pay gap)
 *   - departmentGaps[] (per department)
 *   - cohortGaps[] (per job_profile × job_level, the legally relevant view)
 *   - quartiles (gender distribution across 4 salary quartiles)
 *   - jobPostings (active vs. closed)
 *   - infoRequests (open / completed / overdue counts)
 *   - decisions (count + per-type breakdown)
 *
 * Numbers are computed in-process so the page is fully deterministic.
 */

import { NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { createServiceClient } from '@/lib/supabase/server';

type EmpRow = {
  id: string;
  gender: string | null;
  base_salary: number | null;
  variable_pay: number | null;
  department_id: string | null;
  job_profile_id: string | null;
  job_level_id: string | null;
  is_active: boolean | null;
  on_leave: boolean | null;
};

const round = (n: number, d = 2) => Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const gapPct = (m: number | null, f: number | null) => {
  if (m === null || f === null || m === 0) return null;
  return round(((m - f) / m) * 100, 2);
};
const status = (gap: number | null, suppressed: boolean): 'compliant' | 'warning' | 'breach' | 'suppressed' => {
  if (suppressed) return 'suppressed';
  if (gap === null) return 'compliant';
  const a = Math.abs(gap);
  if (a <= 5) return 'compliant';
  if (a <= 10) return 'warning';
  return 'breach';
};

function buildGap(employees: EmpRow[], opts: { suppressBelow?: number } = {}) {
  const supBelow = opts.suppressBelow ?? 3;
  const males = employees.filter((e) => e.gender === 'male' && e.is_active && !e.on_leave);
  const females = employees.filter((e) => e.gender === 'female' && e.is_active && !e.on_leave);
  const mSalaries = males.map((e) => Number(e.base_salary)).filter((n) => Number.isFinite(n));
  const fSalaries = females.map((e) => Number(e.base_salary)).filter((n) => Number.isFinite(n));
  const meanM = mean(mSalaries);
  const meanF = mean(fSalaries);
  const medM = median(mSalaries);
  const medF = median(fSalaries);
  const meanGap = gapPct(meanM, meanF);
  const medGap = gapPct(medM, medF);
  const suppressed = males.length < supBelow || females.length < supBelow;
  return {
    male_count: males.length,
    female_count: females.length,
    male_mean: meanM !== null ? round(meanM) : null,
    female_mean: meanF !== null ? round(meanF) : null,
    male_median: medM !== null ? round(medM) : null,
    female_median: medF !== null ? round(medF) : null,
    mean_gap_pct: meanGap,
    median_gap_pct: medGap,
    suppressed,
    gap_status: status(meanGap, suppressed),
  };
}

export async function GET() {
  const ctx = await getServerAuthContext();
  if (!ctx.isAuthenticated || !ctx.activeOrganizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const orgId = ctx.activeOrganizationId;
  const admin = createServiceClient();

  const [
    { data: companyData },
    { data: employeesRaw },
    { data: depts },
    { data: levels },
    { data: profiles },
    { data: bands },
    { data: postings },
    { data: requests },
    { data: decisionsRaw },
  ] = await Promise.all([
    admin.from('companies').select('id, name, legal_name, subscription_tier').eq('organization_id', orgId).maybeSingle(),
    admin.from('employees').select('id, gender, base_salary, variable_pay, department_id, job_profile_id, job_level_id, is_active, on_leave').eq('organization_id', orgId),
    admin.from('departments').select('id, name').eq('organization_id', orgId),
    admin.from('job_levels').select('id, name, rank').eq('organization_id', orgId).order('rank', { ascending: true }),
    admin.from('job_profiles').select('id, title').eq('organization_id', orgId),
    admin.from('pay_bands').select('id, job_profile_id, job_level_id, min_salary, max_salary').eq('organization_id', orgId),
    admin.from('job_postings').select('id, title, status, salary_disclosed').eq('organization_id', orgId),
    admin.from('info_requests').select('id, status, created_at, deadline_at, processed_at').eq('organization_id', orgId),
    admin.from('salary_decisions').select('id, decision_type, decided_at').eq('organization_id', orgId),
  ]);

  const employees = (employeesRaw ?? []) as EmpRow[];
  const activeEmps = employees.filter((e) => e.is_active && !e.on_leave);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const activeSalaries = activeEmps.map((e) => Number(e.base_salary)).filter(Number.isFinite);
  const kpis = {
    total_employees: employees.length,
    active_employees: activeEmps.length,
    on_leave: employees.filter((e) => e.on_leave).length,
    male_count: activeEmps.filter((e) => e.gender === 'male').length,
    female_count: activeEmps.filter((e) => e.gender === 'female').length,
    avg_salary: activeSalaries.length ? round(mean(activeSalaries)!) : null,
    median_salary: activeSalaries.length ? round(median(activeSalaries)!) : null,
    total_payroll: activeSalaries.reduce((a, b) => a + b, 0),
  };

  // ── Company-wide gender pay gap ───────────────────────────────────────────
  const companyGap = buildGap(activeEmps, { suppressBelow: 5 });

  // ── Per-department breakdown ──────────────────────────────────────────────
  const departmentGaps = (depts ?? []).map((d: { id: string; name: string }) => {
    const emps = activeEmps.filter((e) => e.department_id === d.id);
    return {
      id: d.id,
      name: d.name,
      headcount: emps.length,
      ...buildGap(emps, { suppressBelow: 3 }),
    };
  });

  // ── Per cohort (job_profile × job_level) — the legally relevant view ──────
  const profileNameById = new Map((profiles ?? []).map((p: { id: string; title: string }) => [p.id, p.title]));
  const levelNameById = new Map((levels ?? []).map((l: { id: string; name: string; rank: number }) => [l.id, l.name]));
  const levelRankById = new Map((levels ?? []).map((l: { id: string; name: string; rank: number }) => [l.id, l.rank]));
  const cohortMap = new Map<string, EmpRow[]>();
  for (const e of activeEmps) {
    if (!e.job_profile_id || !e.job_level_id) continue;
    const k = `${e.job_profile_id}::${e.job_level_id}`;
    const arr = cohortMap.get(k) ?? [];
    arr.push(e);
    cohortMap.set(k, arr);
  }
  const cohortGaps = [...cohortMap.entries()]
    .map(([key, emps]) => {
      const [profileId, levelId] = key.split('::');
      const band = (bands ?? []).find((b: { job_profile_id: string; job_level_id: string }) => b.job_profile_id === profileId && b.job_level_id === levelId);
      return {
        profile_id: profileId,
        level_id: levelId,
        profile_name: profileNameById.get(profileId) ?? '—',
        level_name: levelNameById.get(levelId) ?? '—',
        level_rank: levelRankById.get(levelId) ?? 0,
        headcount: emps.length,
        band_min: band?.min_salary ? Number(band.min_salary) : null,
        band_max: band?.max_salary ? Number(band.max_salary) : null,
        ...buildGap(emps, { suppressBelow: 2 }),
      };
    })
    .sort((a, b) => {
      // Flagged cohorts first, then by headcount desc
      const sa = a.gap_status === 'breach' ? 0 : a.gap_status === 'warning' ? 1 : 2;
      const sb = b.gap_status === 'breach' ? 0 : b.gap_status === 'warning' ? 1 : 2;
      if (sa !== sb) return sa - sb;
      return b.headcount - a.headcount;
    });

  // ── Quartile analysis (Q1-Q4 gender split by base salary) ─────────────────
  const sortedAll = [...activeEmps]
    .filter((e) => Number.isFinite(Number(e.base_salary)))
    .sort((a, b) => Number(a.base_salary) - Number(b.base_salary));
  const qSize = Math.ceil(sortedAll.length / 4);
  const quartiles: Array<{ q: 1 | 2 | 3 | 4; male: number; female: number; total: number; min: number; max: number }> = [];
  for (let i = 0; i < 4; i++) {
    const slice = sortedAll.slice(i * qSize, (i + 1) * qSize);
    if (slice.length === 0) continue;
    quartiles.push({
      q: (i + 1) as 1 | 2 | 3 | 4,
      male: slice.filter((e) => e.gender === 'male').length,
      female: slice.filter((e) => e.gender === 'female').length,
      total: slice.length,
      min: Math.min(...slice.map((e) => Number(e.base_salary))),
      max: Math.max(...slice.map((e) => Number(e.base_salary))),
    });
  }

  // ── Pay-band fit (employees inside/outside their band) ───────────────────
  const empWithBand = activeEmps.filter((e) => e.job_profile_id && e.job_level_id);
  let withinBand = 0;
  let belowBand = 0;
  let aboveBand = 0;
  for (const e of empWithBand) {
    const band = (bands ?? []).find((b: { job_profile_id: string; job_level_id: string }) => b.job_profile_id === e.job_profile_id && b.job_level_id === e.job_level_id);
    if (!band) continue;
    const s = Number(e.base_salary);
    if (s < Number(band.min_salary)) belowBand++;
    else if (s > Number(band.max_salary)) aboveBand++;
    else withinBand++;
  }

  // ── Info requests posture ────────────────────────────────────────────────
  const now = Date.now();
  const open = (requests ?? []).filter((r: { status: string }) => r.status === 'pending');
  const overdue = open.filter((r: { deadline_at: string | null }) =>
    r.deadline_at ? new Date(r.deadline_at).getTime() < now : false
  );
  const completed = (requests ?? []).filter((r: { status: string }) => r.status === 'completed');

  // ── Decisions per type ───────────────────────────────────────────────────
  const decisionCounts = (decisionsRaw ?? []).reduce<Record<string, number>>((acc, d: { decision_type: string }) => {
    acc[d.decision_type] = (acc[d.decision_type] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    company: companyData,
    snapshot_date: new Date().toISOString().slice(0, 10),
    kpis,
    companyGap,
    departmentGaps,
    cohortGaps,
    quartiles,
    payBandFit: {
      total: empWithBand.length,
      within: withinBand,
      below: belowBand,
      above: aboveBand,
    },
    jobPostings: {
      total: (postings ?? []).length,
      published: (postings ?? []).filter((p: { status: string }) => p.status === 'published').length,
      draft: (postings ?? []).filter((p: { status: string }) => p.status === 'draft').length,
      closed: (postings ?? []).filter((p: { status: string }) => p.status === 'closed').length,
      disclosed: (postings ?? []).filter((p: { salary_disclosed: boolean }) => p.salary_disclosed).length,
    },
    infoRequests: {
      total: (requests ?? []).length,
      open: open.length,
      overdue: overdue.length,
      completed: completed.length,
    },
    decisions: {
      total: (decisionsRaw ?? []).length,
      hire: decisionCounts.hire ?? 0,
      raise: decisionCounts.raise ?? 0,
      promotion: decisionCounts.promotion ?? 0,
      band_change: decisionCounts.band_change ?? 0,
      correction: decisionCounts.correction ?? 0,
    },
  });
}
