'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Wallet,
  Scale as ScaleIcon,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  History,
} from 'lucide-react';

type Department = { id: string; name: string };
type Level = { id: string; name: string; rank: number };
type Profile = { id: string; title: string; department_id: string | null };
type Band = { id: string; job_profile_id: string; job_level_id: string; min_salary: number; max_salary: number };
type CohortFlag = { profile_id: string; level_id: string; status: 'compliant' | 'warning' | 'breach'; headcount: number; gap: number | null };

type Data = {
  snapshot_date: string;
  departments: Department[];
  levels: Level[];
  profiles: Profile[];
  bands: Band[];
  employeesByCohort: Record<string, { male: number; female: number }>;
  cohortFlags: CohortFlag[];
  kpis: {
    total_employees: number;
    active_employees: number;
    male_count: number;
    female_count: number;
    avg_salary: number | null;
    mean_gap_pct: number | null;
    flagged_cohorts: number;
    breach_cohorts: number;
    total_bands: number;
    total_profiles: number;
  };
  recentDecisions: Array<{
    id: string;
    type: string;
    new_salary: number;
    old_salary: number | null;
    decided_at: string;
    justification: string;
    employee_name: string;
    delta: number | null;
  }>;
  companyGapStatus: 'compliant' | 'warning' | 'breach' | null;
};

const fmtEUR = (n: number | null) =>
  n === null
    ? '—'
    : new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

const fmtPct = (n: number | null) => (n === null ? '—' : `${n > 0 ? '+' : ''}${n.toFixed(2)} %`);

const decisionLabel: Record<string, string> = {
  hire: 'Einstellung',
  raise: 'Gehaltserhöhung',
  promotion: 'Beförderung',
  band_change: 'Bandwechsel',
  correction: 'Korrektur',
};

const decisionTone: Record<string, string> = {
  hire: 'bg-sky-100 text-sky-800',
  raise: 'bg-emerald-100 text-emerald-800',
  promotion: 'bg-purple-100 text-purple-800',
  band_change: 'bg-amber-100 text-amber-800',
  correction: 'bg-red-100 text-red-800',
};

export default function CompMatrixOverview() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/comp-overview', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => setData(d as Data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (!data) return null;

  const { kpis, levels, profiles, bands, departments, cohortFlags, employeesByCohort } = data;
  const sortedLevels = [...levels].sort((a, b) => a.rank - b.rank);

  // Build the band lookup map and cohort-flag map
  const bandMap = new Map<string, Band>();
  for (const b of bands) bandMap.set(`${b.job_profile_id}::${b.job_level_id}`, b);
  const flagMap = new Map<string, CohortFlag>();
  for (const f of cohortFlags) flagMap.set(`${f.profile_id}::${f.level_id}`, f);

  // Group profiles by department, in department-name order
  const groupedProfiles = new Map<string, { name: string; profiles: Profile[] }>();
  for (const d of departments) groupedProfiles.set(d.id, { name: d.name, profiles: [] });
  for (const p of profiles) {
    const k = p.department_id ?? '__none__';
    if (!groupedProfiles.has(k)) groupedProfiles.set(k, { name: 'Ohne Abteilung', profiles: [] });
    groupedProfiles.get(k)!.profiles.push(p);
  }

  return (
    <div className="space-y-6">
      {/* ─── KPI tiles ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile icon={<Users className="h-4 w-4" />} label="Mitarbeitende" value={String(kpis.active_employees)}
                 sub={`${kpis.male_count} ♂ · ${kpis.female_count} ♀`} />
        <KpiTile icon={<Wallet className="h-4 w-4" />} label="Ø-Bruttogehalt" value={fmtEUR(kpis.avg_salary)}
                 sub={`${kpis.total_profiles} Profile · ${kpis.total_bands} Bands`} />
        <KpiTile icon={<ScaleIcon className="h-4 w-4" />} label="Mean Pay Gap" value={fmtPct(kpis.mean_gap_pct)}
                 sub={`Unternehmensweit`}
                 tone={data.companyGapStatus ?? 'compliant'} />
        <KpiTile icon={<AlertTriangle className="h-4 w-4" />} label="Geflagged > 5 %"
                 value={String(kpis.flagged_cohorts)}
                 sub={`davon ${kpis.breach_cohorts} Verstöße (> 10 %)`}
                 tone={kpis.breach_cohorts ? 'breach' : kpis.flagged_cohorts ? 'warning' : 'compliant'} />
      </div>

      {/* ─── Vergütungsmatrix ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ScaleIcon className="h-5 w-5 text-primary" />
                Vergütungsmatrix
              </CardTitle>
              <CardDescription>
                Job-Profile × Karrierestufen — Pay Bands &amp; Headcount, Status nach unbereinigtem Pay-Gap
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/auswertung">
                Detail-Auswertung
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="text-left font-medium text-slate-500 py-2 px-3 border-b border-slate-200 min-w-[180px]">
                    Job-Profil
                  </th>
                  {sortedLevels.map((l) => (
                    <th key={l.id} className="text-left font-medium text-slate-500 py-2 px-3 border-b border-slate-200 min-w-[140px]">
                      {l.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...groupedProfiles.entries()]
                  .filter(([, group]) => group.profiles.length > 0)
                  .map(([deptId, group]) => (
                    <Fragment key={deptId}>
                      <tr>
                        <td colSpan={sortedLevels.length + 1} className="bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                          {group.name} · {group.profiles.length} Profil{group.profiles.length === 1 ? '' : 'e'}
                        </td>
                      </tr>
                      {group.profiles.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 border-b border-slate-100 font-medium text-slate-700">{p.title}</td>
                          {sortedLevels.map((l) => {
                            const k = `${p.id}::${l.id}`;
                            const band = bandMap.get(k);
                            const flag = flagMap.get(k);
                            const cohort = employeesByCohort[k];
                            const status = flag?.status;
                            const tone =
                              status === 'breach' ? 'bg-red-50 border-red-200' :
                              status === 'warning' ? 'bg-amber-50 border-amber-200' :
                              band ? 'bg-white border-slate-200' :
                              'bg-slate-50 border-slate-100';
                            return (
                              <td key={l.id} className={`align-top py-2 px-3 border ${tone} border-b border-r border-slate-100`}>
                                {band ? (
                                  <div className="space-y-1">
                                    <div className="font-medium text-slate-900 tabular-nums text-[13px]">
                                      {fmtEUR(band.min_salary)} – {fmtEUR(band.max_salary)}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                      {cohort && (cohort.male + cohort.female) > 0 ? (
                                        <span className="tabular-nums">{cohort.male}♂ · {cohort.female}♀</span>
                                      ) : (
                                        <span>—</span>
                                      )}
                                      {flag && (cohort?.male ?? 0) + (cohort?.female ?? 0) > 0 && (
                                        <FlagBadge status={flag.status} gap={flag.gap} />
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-300 text-xs">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-white border border-slate-300" />Konform</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-amber-200 border border-amber-300" />Warnung (5–10 %)</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-red-200 border border-red-300" />Verstoß (&gt; 10 %)</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-slate-100" />Kein Band definiert</span>
          </div>
        </CardContent>
      </Card>

      {/* ─── Recent salary decisions ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Aktuelle Entgeltentscheidungen
              </CardTitle>
              <CardDescription>
                Append-only Decision-Trail — Grundlage der Beweislast-Verteidigung (Art. 18)
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link href="/mitarbeiter">
                Alle ansehen
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.recentDecisions.length === 0 && (
              <li className="text-sm text-slate-500">Noch keine Entscheidungen dokumentiert.</li>
            )}
            {data.recentDecisions.map((d) => (
              <li key={d.id} className="flex items-start gap-3 border-l-4 border-slate-200 bg-slate-50/50 py-2 px-3 rounded-r-md">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${decisionTone[d.type] ?? 'bg-slate-100'}`}>
                      {decisionLabel[d.type] ?? d.type}
                    </span>
                    <span className="text-sm font-medium text-slate-800">{d.employee_name}</span>
                    <span className="text-xs text-slate-500 tabular-nums">
                      {fmtEUR(d.new_salary)}
                      {d.delta !== null && d.delta !== 0 && (
                        <span className={d.delta > 0 ? 'text-emerald-600 ml-1.5' : 'text-red-600 ml-1.5'}>
                          ({d.delta > 0 ? '+' : ''}{fmtEUR(d.delta)})
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-slate-400 ml-auto tabular-nums">
                      {new Date(d.decided_at).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">{d.justification}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiTile({ icon, label, value, sub, tone }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: 'compliant' | 'warning' | 'breach';
}) {
  const cls =
    tone === 'breach' ? 'border-red-200 bg-red-50' :
    tone === 'warning' ? 'border-amber-200 bg-amber-50' :
    tone === 'compliant' ? 'border-emerald-200 bg-emerald-50' :
    'border-slate-200 bg-white';
  return (
    <div className={`rounded-xl border ${cls} p-4`}>
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">{icon}{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function FlagBadge({ status, gap }: { status: 'compliant' | 'warning' | 'breach'; gap: number | null }) {
  if (status === 'compliant') {
    return <span className="inline-flex items-center gap-0.5 text-emerald-700"><CheckCircle2 className="h-2.5 w-2.5" />{gap !== null ? `${gap.toFixed(1)}%` : ''}</span>;
  }
  if (status === 'warning') {
    return <span className="inline-flex items-center gap-0.5 text-amber-700 font-medium"><AlertTriangle className="h-2.5 w-2.5" />{gap !== null ? `${gap.toFixed(1)}%` : ''}</span>;
  }
  return <span className="inline-flex items-center gap-0.5 text-red-700 font-semibold"><AlertCircle className="h-2.5 w-2.5" />{gap !== null ? `${gap.toFixed(1)}%` : ''}</span>;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
      </div>
      <Skeleton className="h-96" />
      <Skeleton className="h-48" />
    </div>
  );
}

