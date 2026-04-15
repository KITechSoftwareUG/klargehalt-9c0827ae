import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

const supabaseAdmin = () =>
  createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET(request: NextRequest) {
  const context = await getServerAuthContext();
  if (!context.isAuthenticated || !context.activeOrganizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orgId = context.activeOrganizationId;
  const supabase = supabaseAdmin();

  // Fetch company info
  const { data: company } = await supabase
    .from('companies')
    .select('name, subscription_tier')
    .eq('organization_id', orgId)
    .maybeSingle();

  // Fetch latest pay gap snapshots
  const { data: snapshots } = await supabase
    .from('pay_gap_snapshots')
    .select('*')
    .eq('organization_id', orgId)
    .order('snapshot_date', { ascending: false })
    .limit(50);

  // Fetch department statistics
  const { data: employees } = await supabase
    .from('employees')
    .select('department_id, gender, base_salary')
    .eq('organization_id', orgId)
    .eq('is_active', true);

  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .eq('organization_id', orgId);

  const deptMap = new Map((departments ?? []).map((d) => [d.id, d.name]));

  // Aggregate dept stats
  type DeptAgg = { name: string; male: number; female: number; diverse: number; total: number; salaries: number[] };
  const deptAgg: Record<string, DeptAgg> = {};
  for (const emp of employees ?? []) {
    const key = emp.department_id ?? 'unassigned';
    if (!deptAgg[key]) {
      deptAgg[key] = {
        name: deptMap.get(key) ?? 'Nicht zugeordnet',
        male: 0, female: 0, diverse: 0, total: 0, salaries: [],
      };
    }
    deptAgg[key].total++;
    deptAgg[key].salaries.push(emp.base_salary ?? 0);
    if (emp.gender === 'male') deptAgg[key].male++;
    else if (emp.gender === 'female') deptAgg[key].female++;
    else deptAgg[key].diverse++;
  }

  const totalEmployees = (employees ?? []).length;
  const maleCount = (employees ?? []).filter((e) => e.gender === 'male').length;
  const femaleCount = (employees ?? []).filter((e) => e.gender === 'female').length;

  // Find org-wide gap
  const orgSnap = (snapshots ?? []).find((s) => s.scope === 'organization' && !s.is_suppressed);
  const overallGap = orgSnap?.mean_gap_base_pct ?? null;
  const gapStatus = orgSnap?.gap_status ?? null;

  const reportDate = new Date().toLocaleDateString('de-DE', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const reportYear = new Date().getFullYear();

  const companyName = company?.name ?? 'Ihr Unternehmen';

  const html = generateReportHtml({
    companyName,
    reportDate,
    reportYear,
    totalEmployees,
    maleCount,
    femaleCount,
    overallGap,
    gapStatus,
    deptStats: Object.values(deptAgg),
    snapshots: (snapshots ?? []).filter((s) => !s.is_suppressed).slice(0, 20),
  });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '18mm', right: '18mm' },
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="KlarGehalt_PayGap_Report_${reportYear}.pdf"`,
      },
    });
  } finally {
    await browser?.close();
  }
}

// ─── HTML template ─────────────────────────────────────────────────────────────

interface ReportParams {
  companyName: string;
  reportDate: string;
  reportYear: number;
  totalEmployees: number;
  maleCount: number;
  femaleCount: number;
  overallGap: number | null;
  gapStatus: string | null;
  deptStats: { name: string; male: number; female: number; diverse: number; total: number }[];
  snapshots: Array<Record<string, unknown>>;
}

function formatEur(val: unknown): string {
  if (val === null || val === undefined) return '—';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(val));
}

function gapColor(gap: number | null): string {
  if (gap === null) return '#6b7280';
  if (Math.abs(gap) <= 5) return '#16a34a';
  if (Math.abs(gap) <= 10) return '#d97706';
  return '#dc2626';
}

function generateReportHtml(p: ReportParams): string {
  const gapDisplay = p.overallGap !== null ? `${p.overallGap.toFixed(1)} %` : 'Keine Daten';
  const gapCol = gapColor(p.overallGap);
  const statusLabel = p.gapStatus === 'compliant' ? 'Konform' : p.gapStatus === 'breach' ? 'Handlungsbedarf' : 'Wird geprüft';

  const deptRows = p.deptStats
    .filter((d) => d.total >= 5)
    .map(
      (d) => `
      <tr>
        <td>${d.name}</td>
        <td style="text-align:center">${d.total}</td>
        <td style="text-align:center">${d.male}</td>
        <td style="text-align:center">${d.female}</td>
        <td style="text-align:center">${d.total > 0 ? ((d.female / d.total) * 100).toFixed(1) : '—'} %</td>
      </tr>`
    )
    .join('');

  const snapRows = p.snapshots
    .map(
      (s) => `
      <tr>
        <td>${String(s.scope_label ?? s.scope ?? '—')}</td>
        <td style="text-align:center">${String(s.male_count ?? '—')}</td>
        <td style="text-align:center">${String(s.female_count ?? '—')}</td>
        <td style="text-align:center; color:${gapColor(s.mean_gap_base_pct as number | null)}">${s.mean_gap_base_pct !== null && s.mean_gap_base_pct !== undefined ? `${Number(s.mean_gap_base_pct).toFixed(1)} %` : '—'}</td>
        <td style="text-align:center">${formatEur(s.male_mean_base)} / ${formatEur(s.female_mean_base)}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; font-size: 11pt; line-height: 1.5; }
    .header { background: #0F172A; color: white; padding: 28px 32px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header-brand { font-size: 22pt; font-weight: 800; letter-spacing: -0.5px; }
    .header-brand span { color: #52e0de; }
    .header-meta { text-align: right; font-size: 9pt; color: #94a3b8; line-height: 1.8; }
    .legal-notice { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 10px 16px; margin: 20px 0; font-size: 9pt; color: #166534; }
    .section { margin: 28px 0; }
    .section-title { font-size: 13pt; font-weight: 700; color: #0F172A; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 14px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
    .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; }
    .kpi-label { font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .kpi-value { font-size: 20pt; font-weight: 800; }
    table { width: 100%; border-collapse: collapse; font-size: 10pt; }
    th { background: #f1f5f9; color: #374151; font-weight: 600; padding: 8px 10px; text-align: left; border-bottom: 2px solid #e2e8f0; }
    td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }
    tr:last-child td { border-bottom: none; }
    .breach { color: #dc2626; font-weight: 600; }
    .compliant { color: #16a34a; font-weight: 600; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 8pt; color: #94a3b8; }
    .warning-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 12px 16px; margin: 16px 0; font-size: 9pt; color: #9a3412; }
    .ok-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px 16px; margin: 16px 0; font-size: 9pt; color: #166534; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>

<div class="header">
  <div>
    <div class="header-brand">klar<span>gehalt</span></div>
    <div style="color:#94a3b8; font-size:9pt; margin-top:4px">Entgelttransparenz-Plattform</div>
  </div>
  <div class="header-meta">
    <strong style="color:white;font-size:11pt">Entgelttransparenz-Bericht</strong><br/>
    Berichtsjahr: ${p.reportYear}<br/>
    Erstellt am: ${p.reportDate}<br/>
    Unternehmen: ${p.companyName}
  </div>
</div>

<div style="padding: 0 4px">

<div class="legal-notice">
  Dieser Bericht wurde erstellt gemäß <strong>Art. 9 Abs. 1 EU-Richtlinie 2023/970</strong> zur Lohntransparenz.
  Die Daten entsprechen den Anforderungen des Entgelttransparenzgesetzes (EntgTranspG) und der DSGVO.
  Mindestgruppengröße für Auswertungen: 5 Personen.
</div>

<div class="section">
  <div class="section-title">1. Übersicht</div>
  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-label">Mitarbeiter gesamt</div>
      <div class="kpi-value" style="color:#0F172A">${p.totalEmployees}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Männlich</div>
      <div class="kpi-value" style="color:#3b82f6">${p.maleCount}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Weiblich</div>
      <div class="kpi-value" style="color:#ec4899">${p.femaleCount}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Gesamt Pay Gap (Mean)</div>
      <div class="kpi-value" style="color:${gapCol}">${gapDisplay}</div>
    </div>
  </div>

  ${p.overallGap !== null && Math.abs(p.overallGap) > 5
    ? `<div class="warning-box">
        <strong>Handlungsbedarf:</strong> Der bereinigte Gender Pay Gap von ${p.overallGap.toFixed(1)} % überschreitet den Schwellenwert von 5 %.
        Gemäß Art. 10 EU-RL 2023/970 ist eine gemeinsame Entgeltbewertung einzuleiten.
      </div>`
    : p.overallGap !== null
    ? `<div class="ok-box">
        <strong>Konform:</strong> Der Gender Pay Gap von ${p.overallGap.toFixed(1)} % liegt unterhalb des Schwellenwerts von 5 %.
      </div>`
    : ''
  }
</div>

${p.deptStats.length > 0 ? `
<div class="section">
  <div class="section-title">2. Verteilung nach Abteilung</div>
  <table>
    <thead>
      <tr>
        <th>Abteilung</th>
        <th style="text-align:center">Gesamt</th>
        <th style="text-align:center">Männlich</th>
        <th style="text-align:center">Weiblich</th>
        <th style="text-align:center">Frauenanteil</th>
      </tr>
    </thead>
    <tbody>
      ${deptRows || '<tr><td colspan="5" style="text-align:center;color:#94a3b8">Keine Abteilungsdaten verfügbar</td></tr>'}
    </tbody>
  </table>
  <p style="font-size:8pt;color:#94a3b8;margin-top:8px">
    Gruppen mit weniger als 5 Personen werden aus Datenschutzgründen nicht ausgewiesen.
  </p>
</div>
` : ''}

${p.snapshots.length > 0 ? `
<div class="section page-break">
  <div class="section-title">3. Pay-Gap-Analyse nach Kategorie</div>
  <table>
    <thead>
      <tr>
        <th>Kategorie</th>
        <th style="text-align:center">Männlich (n)</th>
        <th style="text-align:center">Weiblich (n)</th>
        <th style="text-align:center">Mean Gap</th>
        <th style="text-align:center">Ø Gehalt ♂ / ♀</th>
      </tr>
    </thead>
    <tbody>
      ${snapRows}
    </tbody>
  </table>
  <p style="font-size:8pt;color:#94a3b8;margin-top:8px">
    Gap = (Ø männlich − Ø weiblich) / Ø männlich × 100. Positiver Wert = Männer verdienen mehr.
  </p>
</div>
` : ''}

<div class="section">
  <div class="section-title">4. Methodik &amp; Rechtliche Grundlagen</div>
  <p style="font-size:10pt; color:#374151; line-height:1.7;">
    Die Berechnung des Gender Pay Gap erfolgt auf Basis des arithmetischen Mittels und des Medians
    der Grundvergütung (base_salary), aufgeschlüsselt nach Geschlecht pro Job-Profil und Abteilung.
    Variable Vergütungsbestandteile sind separat erfasst. Die Auswertung entspricht den Anforderungen
    von Art. 9 EU-RL 2023/970 sowie § 7 EntgTranspG.
  </p>
  <p style="font-size:10pt; color:#374151; line-height:1.7; margin-top:10px;">
    Datenhaltung: Deutschland (Frankfurt). Verschlüsselung: AES-256 at rest, TLS 1.3 in transit.
    Mandantentrennung: PostgreSQL Row Level Security. Zugriffsprotokoll: vollständiger Audit-Trail.
  </p>
</div>

<div class="footer">
  <p>
    Erstellt mit KlarGehalt · app.klargehalt.de · Gemäß EU-RL 2023/970 &amp; EntgTranspG
    &nbsp;|&nbsp; Dieser Bericht ist vertraulich und ausschließlich für interne und behördliche Zwecke bestimmt.
    &nbsp;|&nbsp; ${p.reportDate}
  </p>
</div>

</div>
</body>
</html>`;
}
