'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Printer,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Users,
  Wallet,
  TrendingDown,
  Scale as ScaleIcon,
  Info,
} from 'lucide-react';

type GapBlock = {
  male_count: number;
  female_count: number;
  male_mean: number | null;
  female_mean: number | null;
  male_median: number | null;
  female_median: number | null;
  mean_gap_pct: number | null;
  median_gap_pct: number | null;
  suppressed: boolean;
  gap_status: 'compliant' | 'warning' | 'breach' | 'suppressed';
};

type Department = GapBlock & { id: string; name: string; headcount: number };
type Cohort = GapBlock & {
  profile_id: string;
  level_id: string;
  profile_name: string;
  level_name: string;
  level_rank: number;
  headcount: number;
  band_min: number | null;
  band_max: number | null;
};
type Quartile = { q: 1 | 2 | 3 | 4; male: number; female: number; total: number; min: number; max: number };

type AuswertungData = {
  company: { name: string; legal_name: string | null; subscription_tier: string } | null;
  snapshot_date: string;
  kpis: {
    total_employees: number;
    active_employees: number;
    on_leave: number;
    male_count: number;
    female_count: number;
    avg_salary: number | null;
    median_salary: number | null;
    total_payroll: number;
  };
  companyGap: GapBlock;
  departmentGaps: Department[];
  cohortGaps: Cohort[];
  quartiles: Quartile[];
  payBandFit: { total: number; within: number; below: number; above: number };
  jobPostings: { total: number; published: number; draft: number; closed: number; disclosed: number };
  infoRequests: { total: number; open: number; overdue: number; completed: number };
  decisions: { total: number; hire: number; raise: number; promotion: number; band_change: number; correction: number };
};

const fmtEUR = (n: number | null) =>
  n === null
    ? '—'
    : new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

const fmtPct = (n: number | null) => (n === null ? '—' : `${n > 0 ? '+' : ''}${n.toFixed(2)} %`);

const statusBadge = (s: GapBlock['gap_status']) => {
  if (s === 'breach') return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Verstoß</Badge>;
  if (s === 'warning') return <Badge className="gap-1 bg-amber-500 hover:bg-amber-500"><AlertTriangle className="h-3 w-3" />Warnung</Badge>;
  if (s === 'suppressed') return <Badge variant="outline" className="gap-1">n &lt; 3</Badge>;
  return <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600"><CheckCircle2 className="h-3 w-3" />Konform</Badge>;
};

const gapColor = (s: GapBlock['gap_status']) =>
  s === 'breach' ? '#dc2626' : s === 'warning' ? '#f59e0b' : s === 'suppressed' ? '#94a3b8' : '#059669';

export default function AuswertungView() {
  const [data, setData] = useState<AuswertungData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auswertung', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => setData(d as AuswertungData))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Fehler beim Laden'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error || !data) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Auswertung konnte nicht geladen werden{error ? `: ${error}` : ''}.
      </div>
    );
  }

  const flaggedCohorts = data.cohortGaps.filter((c) => c.gap_status === 'breach' || c.gap_status === 'warning');
  const breachCohorts = data.cohortGaps.filter((c) => c.gap_status === 'breach');

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Print-only CSS — neutralises sidebar/header for clean PDF output */}
      <style jsx global>{`
        @media print {
          aside, header, [data-no-print], .print\\:hidden { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; }
          body { background: white !important; }
          .print\\:break-before-page { break-before: page; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-slate-300 { border-color: rgb(203 213 225) !important; }
        }
        @page { margin: 18mm 14mm; size: A4; }
      `}</style>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Auswertung Gehaltsstruktur</h1>
          <p className="text-sm text-slate-500">
            {data.company?.legal_name ?? data.company?.name ?? 'Ihr Unternehmen'} ·{' '}
            Stichtag {new Date(data.snapshot_date).toLocaleDateString('de-DE')}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Pay-Equity-Analyse gemäß EU-Richtlinie 2023/970 (Art. 4, 9, 10)
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" />
            Bericht drucken / PDF
          </Button>
        </div>
      </div>

      {/* ── KPI tiles ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={<Users className="h-4 w-4" />} label="Aktive Mitarbeitende" value={String(data.kpis.active_employees)}
             sub={`${data.kpis.male_count} ♂ · ${data.kpis.female_count} ♀${data.kpis.on_leave ? ` · ${data.kpis.on_leave} Abwesend` : ''}`} />
        <Kpi icon={<Wallet className="h-4 w-4" />} label="Ø-Bruttogehalt" value={fmtEUR(data.kpis.avg_salary)}
             sub={`Median ${fmtEUR(data.kpis.median_salary)}`} />
        <Kpi icon={<ScaleIcon className="h-4 w-4" />} label="Mean Gap (Unternehmen)" value={fmtPct(data.companyGap.mean_gap_pct)}
             sub={`Median Gap ${fmtPct(data.companyGap.median_gap_pct)}`}
             tone={data.companyGap.gap_status} />
        <Kpi icon={<TrendingDown className="h-4 w-4" />} label="Geflagged > 5 %" value={String(flaggedCohorts.length)}
             sub={`davon ${breachCohorts.length} Verstöße (> 10 %)`}
             tone={breachCohorts.length ? 'breach' : flaggedCohorts.length ? 'warning' : 'compliant'} />
      </div>

      {/* ── Company-wide gap ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gender Pay Gap — unternehmensweit</CardTitle>
              <CardDescription>Mean- und Median-Vergleich Bruttojahresgehalt, aktive Mitarbeitende</CardDescription>
            </div>
            {statusBadge(data.companyGap.gap_status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <CompanyGapTable g={data.companyGap} />
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={[
                  { name: 'Männer', mean: data.companyGap.male_mean ?? 0, median: data.companyGap.male_median ?? 0 },
                  { name: 'Frauen', mean: data.companyGap.female_mean ?? 0, median: data.companyGap.female_median ?? 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmtEUR(v)} />
                  <Legend />
                  <Bar dataKey="mean" name="Mittelwert" fill="#6366f1" />
                  <Bar dataKey="median" name="Median" fill="#a78bfa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Cohort breakdown (the legally relevant table) ────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vergleichsgruppen „gleiche / gleichwertige Arbeit"</CardTitle>
              <CardDescription>
                Job-Profil × Karrierestufe — nach Art. 4 EU-Richtlinie 2023/970.
                Diese Gruppen sind der rechtlich relevante Vergleichsmaßstab.
              </CardDescription>
            </div>
            {breachCohorts.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {breachCohorts.length} Cohort{breachCohorts.length === 1 ? '' : 's'} {'> '}10 %
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vergleichsgruppe</TableHead>
                <TableHead className="text-right">Headcount</TableHead>
                <TableHead className="text-right">♂ / ♀</TableHead>
                <TableHead className="text-right">Ø ♂</TableHead>
                <TableHead className="text-right">Ø ♀</TableHead>
                <TableHead className="text-right">Mean Gap</TableHead>
                <TableHead className="text-right">Median Gap</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.cohortGaps.map((c) => (
                <TableRow key={`${c.profile_id}-${c.level_id}`}
                          className={c.gap_status === 'breach' ? 'bg-red-50/50' : c.gap_status === 'warning' ? 'bg-amber-50/50' : ''}>
                  <TableCell className="font-medium">
                    {c.profile_name} · <span className="text-slate-500">{c.level_name}</span>
                    {c.band_min !== null && c.band_max !== null && (
                      <div className="text-xs text-slate-400">
                        Band {fmtEUR(c.band_min)} – {fmtEUR(c.band_max)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.headcount}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.male_count} / {c.female_count}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtEUR(c.male_mean)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtEUR(c.female_mean)}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold" style={{ color: gapColor(c.gap_status) }}>
                    {c.suppressed ? '—' : fmtPct(c.mean_gap_pct)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums" style={{ color: gapColor(c.gap_status) }}>
                    {c.suppressed ? '—' : fmtPct(c.median_gap_pct)}
                  </TableCell>
                  <TableCell>{statusBadge(c.gap_status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {breachCohorts.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              <p className="font-semibold flex items-center gap-1.5"><AlertCircle className="h-4 w-4" /> Art. 10 — Joint-Assessment-Trigger</p>
              <p className="mt-1">
                In {breachCohorts.length} Vergleichsgruppe{breachCohorts.length === 1 ? '' : 'n'} liegt der unbereinigte Gap über 10 %.
                Sofern kein objektiver, geschlechtsneutraler Grund dokumentiert ist und der Gap nicht innerhalb von 6 Monaten korrigiert wird,
                ist eine <strong>Gemeinsame Entgeltbewertung</strong> mit Arbeitnehmervertretung verpflichtend.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Department gap breakdown ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Abteilungs-Übersicht</CardTitle>
          <CardDescription>Pay-Gap pro Abteilung — Frühwarnsystem für Detail-Drill-Down</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Abteilung</TableHead>
                <TableHead className="text-right">Headcount</TableHead>
                <TableHead className="text-right">♂ / ♀</TableHead>
                <TableHead className="text-right">Ø ♂</TableHead>
                <TableHead className="text-right">Ø ♀</TableHead>
                <TableHead className="text-right">Mean Gap</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.departmentGaps.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.headcount}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.male_count} / {d.female_count}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtEUR(d.male_mean)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtEUR(d.female_mean)}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold" style={{ color: gapColor(d.gap_status) }}>
                    {d.suppressed ? '—' : fmtPct(d.mean_gap_pct)}
                  </TableCell>
                  <TableCell>{statusBadge(d.gap_status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Quartile distribution (Art. 9 reporting requirement) ─────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Verteilung in Lohn-Quartilen</CardTitle>
          <CardDescription>
            Geschlechteranteil pro Lohnviertel — Pflicht-Reporting-Element nach Art. 9 der Richtlinie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={data.quartiles.map((q) => ({
                name: `Q${q.q} (${fmtEUR(q.min)}–${fmtEUR(q.max)})`,
                Männer: q.total > 0 ? Math.round((q.male / q.total) * 100) : 0,
                Frauen: q.total > 0 ? Math.round((q.female / q.total) * 100) : 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v: number) => `${v} %`} />
                <Tooltip formatter={(v: number) => `${v} %`} />
                <Legend />
                <Bar dataKey="Männer" stackId="a" fill="#6366f1" />
                <Bar dataKey="Frauen" stackId="a" fill="#a78bfa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-slate-500">
            Lesart: Q1 = niedrigste 25 % der Gehälter, Q4 = oberste 25 %. Eine starke Über-/Unterrepräsentation
            eines Geschlechts in Q4 (Spitzenverdiener) gegenüber Q1 (Einsteiger) deutet auf strukturelle Ungleichheit hin —
            unabhängig davon, ob individuelle Gehälter pro Vergleichsgruppe konform sind.
          </div>
        </CardContent>
      </Card>

      {/* ── Pay-band fit + posture metrics (print-friendly grid) ─────────── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pay-Band-Fit</CardTitle>
            <CardDescription>Mitarbeitende inner-/außerhalb der definierten Spannen</CardDescription>
          </CardHeader>
          <CardContent>
            <BandFitRow label="Innerhalb der Band" value={data.payBandFit.within} total={data.payBandFit.total} tone="emerald" />
            <BandFitRow label="Unterhalb der Band" value={data.payBandFit.below} total={data.payBandFit.total} tone="red" />
            <BandFitRow label="Oberhalb der Band" value={data.payBandFit.above} total={data.payBandFit.total} tone="amber" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Auskunftsanfragen</CardTitle>
            <CardDescription>Art. 7 — Pflicht zur Beantwortung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Gesamt</span><span className="tabular-nums font-semibold">{data.infoRequests.total}</span></div>
            <div className="flex justify-between"><span>Offen</span><span className="tabular-nums">{data.infoRequests.open}</span></div>
            <div className="flex justify-between text-red-700">
              <span className="flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />Überfällig</span>
              <span className="tabular-nums font-semibold">{data.infoRequests.overdue}</span>
            </div>
            <div className="flex justify-between text-emerald-700"><span>Beantwortet</span><span className="tabular-nums">{data.infoRequests.completed}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entgeltentscheidungen</CardTitle>
            <CardDescription>Append-only Decision-Trail</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span>Einstellung</span><span className="tabular-nums">{data.decisions.hire}</span></div>
            <div className="flex justify-between"><span>Gehaltserhöhung</span><span className="tabular-nums">{data.decisions.raise}</span></div>
            <div className="flex justify-between"><span>Beförderung</span><span className="tabular-nums">{data.decisions.promotion}</span></div>
            <div className="flex justify-between"><span>Bandwechsel</span><span className="tabular-nums">{data.decisions.band_change}</span></div>
            <div className="flex justify-between"><span>Korrektur</span><span className="tabular-nums">{data.decisions.correction}</span></div>
            <div className="flex justify-between border-t pt-1.5 mt-1.5 font-semibold"><span>Summe dokumentiert</span><span className="tabular-nums">{data.decisions.total}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* ── Job postings (Art. 5 disclosure) ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stellenausschreibungs-Transparenz</CardTitle>
          <CardDescription>Art. 5 — Gehaltsspanne in Anzeigen pflicht (alle Arbeitgeber, jede Größe)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <Stat label="Aktiv (publiziert)" value={data.jobPostings.published} />
            <Stat label="Entwürfe" value={data.jobPostings.draft} />
            <Stat label="Geschlossen" value={data.jobPostings.closed} />
            <Stat label="Mit Gehaltsspanne" value={data.jobPostings.disclosed} />
            <Stat label="Compliance-Rate"
                  value={data.jobPostings.total > 0
                    ? `${Math.round((data.jobPostings.disclosed / data.jobPostings.total) * 100)} %`
                    : '—'} />
          </div>
        </CardContent>
      </Card>

      {/* ── Rechts-Hinweis + Disclaimer (print-friendly) ─────────────────── */}
      <Card className="border-slate-200 bg-slate-50/50 print:break-before-page">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Info className="h-4 w-4" />Methodik & rechtlicher Hinweis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-600">
          <p>
            <strong>Methodik:</strong> Pay-Gap-Werte sind <em>unbereinigt</em>. Sie berücksichtigen Geschlecht und Bruttojahresgehalt
            innerhalb der aufgeführten Vergleichsgruppen. Bereinigung um objektive Faktoren (Dienstalter, Qualifikation, Performance)
            erfolgt in der Beweisführung — nicht in dieser Anzeige.
          </p>
          <p>
            <strong>Suppression:</strong> Gruppen mit weniger als 3 Personen pro Geschlecht werden zum Schutz der Anonymität nicht ausgewertet.
            Auf Unternehmensebene gilt eine strengere Schwelle (n &lt; 5).
          </p>
          <p>
            <strong>Schwellenwerte:</strong> Bis 5 % Gap = konform · 5–10 % = Warnung · &gt; 10 % = Verstoß (Joint-Assessment-Trigger nach Art. 10).
          </p>
          <p>
            <strong>Disclaimer:</strong> Dieser Bericht ist eine Software-generierte Analyse zur Compliance-Unterstützung.
            Er ersetzt keine anwaltliche Bewertung. Für eine im Streitfall belastbare Stellungnahme empfehlen wir die optionale
            externe Rechtsberater-Prüfung (Add-on).
          </p>
          <p className="border-t pt-2 text-slate-500">
            Erstellt am {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })} · klargehalt · Datenstand: {new Date(data.snapshot_date).toLocaleDateString('de-DE')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ icon, label, value, sub, tone }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: GapBlock['gap_status'];
}) {
  const toneClass =
    tone === 'breach' ? 'border-red-200 bg-red-50' :
    tone === 'warning' ? 'border-amber-200 bg-amber-50' :
    tone === 'compliant' ? 'border-emerald-200 bg-emerald-50' :
    'border-slate-200 bg-white';
  return (
    <div className={`rounded-xl border ${toneClass} p-4 print:shadow-none`}>
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">{icon}{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function CompanyGapTable({ g }: { g: GapBlock }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kennzahl</TableHead>
          <TableHead className="text-right">Männer</TableHead>
          <TableHead className="text-right">Frauen</TableHead>
          <TableHead className="text-right">Gap</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Headcount</TableCell>
          <TableCell className="text-right tabular-nums">{g.male_count}</TableCell>
          <TableCell className="text-right tabular-nums">{g.female_count}</TableCell>
          <TableCell className="text-right">—</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Mittelwert Brutto</TableCell>
          <TableCell className="text-right tabular-nums">{fmtEUR(g.male_mean)}</TableCell>
          <TableCell className="text-right tabular-nums">{fmtEUR(g.female_mean)}</TableCell>
          <TableCell className="text-right tabular-nums font-semibold" style={{ color: gapColor(g.gap_status) }}>{fmtPct(g.mean_gap_pct)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Median Brutto</TableCell>
          <TableCell className="text-right tabular-nums">{fmtEUR(g.male_median)}</TableCell>
          <TableCell className="text-right tabular-nums">{fmtEUR(g.female_median)}</TableCell>
          <TableCell className="text-right tabular-nums font-semibold" style={{ color: gapColor(g.gap_status) }}>{fmtPct(g.median_gap_pct)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

function BandFitRow({ label, value, total, tone }: { label: string; value: number; total: number; tone: 'emerald' | 'red' | 'amber' }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const bg = tone === 'emerald' ? 'bg-emerald-500' : tone === 'red' ? 'bg-red-500' : 'bg-amber-500';
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-sm">
        <span className="text-slate-700">{label}</span>
        <span className="tabular-nums font-medium">{value} <span className="text-slate-400">/ {total}</span></span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full ${bg}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-72" />
      <div className="grid grid-cols-4 gap-3">
        <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
      </div>
      <Skeleton className="h-72" />
      <Skeleton className="h-96" />
    </div>
  );
}

// Re-export the lucide Scale icon under a distinct name to avoid clash with the Recharts default.
// (No-op alias kept for code clarity.)
export { ScaleIcon as ScaleAlias };
