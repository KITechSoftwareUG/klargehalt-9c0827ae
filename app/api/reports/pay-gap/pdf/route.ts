import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole } from '@/lib/auth/api-guard';
import { createServiceClient } from '@/lib/supabase/server';
import { getEffectiveTier, hasFeature, type SubscriptionStatus, type SubscriptionTier } from '@/lib/subscription';
import puppeteer from 'puppeteer';

export async function GET(request: NextRequest) {
  const context = await getServerAuthContext();
  // Tenant-isolation + RBAC gate (Risk #1): membership + role validated against
  // organization_members before any service-role read. Replaces the prior
  // user_roles lookup that was filtered by the attacker-supplied cookie org
  // (degenerate when the victim org had no user_roles row).
  const guard = await guardRole(context, ['admin', 'hr_manager']);
  if (guard instanceof NextResponse) return guard;

  const orgId = guard.orgId;
  const supabase = createServiceClient();

  // Fetch company info
	  const { data: company } = await supabase
	    .from('companies')
	    .select('name, subscription_tier, subscription_status, trial_ends_at')
	    .eq('organization_id', orgId)
	    .maybeSingle();

	  const effectiveTier = getEffectiveTier(
	    (company?.subscription_tier as SubscriptionTier | null) ?? 'basis',
	    (company?.subscription_status as SubscriptionStatus | null) ?? 'canceled',
	    company?.trial_ends_at ?? null,
	  );
	  if (!hasFeature(effectiveTier, 'pdf_reports')) {
	    return NextResponse.json({ error: 'Professional plan required for PDF reports' }, { status: 402 });
	  }

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

  // Find company-wide gap (canonical scope is 'company', not 'organization')
  const companySnap = (snapshots ?? []).find((s) => s.scope === 'company' && !s.is_suppressed);
  const overallGap = companySnap?.mean_gap_base_pct ?? null;
  const gapStatus = companySnap?.gap_status ?? null;

  // Art. 9 Abs. 1b/d — Variable pay gap data
  const variableGapPct = companySnap?.mean_gap_variable_pct != null
    ? Number(companySnap.mean_gap_variable_pct)
    : null;
  const pctMaleVariable = companySnap?.pct_male_receiving_variable != null
    ? Number(companySnap.pct_male_receiving_variable)
    : null;
  const pctFemaleVariable = companySnap?.pct_female_receiving_variable != null
    ? Number(companySnap.pct_female_receiving_variable)
    : null;

  // Art. 9 Abs. 1e — Quartile distribution
  const quartiles: { q: string; malePct: number | null; femalePct: number | null }[] = [
    { q: 'Q1 (unteres Viertel)', malePct: companySnap?.q1_male_pct != null ? Number(companySnap.q1_male_pct) : null, femalePct: companySnap?.q1_female_pct != null ? Number(companySnap.q1_female_pct) : null },
    { q: 'Q2', malePct: companySnap?.q2_male_pct != null ? Number(companySnap.q2_male_pct) : null, femalePct: companySnap?.q2_female_pct != null ? Number(companySnap.q2_female_pct) : null },
    { q: 'Q3', malePct: companySnap?.q3_male_pct != null ? Number(companySnap.q3_male_pct) : null, femalePct: companySnap?.q3_female_pct != null ? Number(companySnap.q3_female_pct) : null },
    { q: 'Q4 (oberes Viertel)', malePct: companySnap?.q4_male_pct != null ? Number(companySnap.q4_male_pct) : null, femalePct: companySnap?.q4_female_pct != null ? Number(companySnap.q4_female_pct) : null },
  ];

  const reportDate = new Date().toLocaleDateString('de-DE', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const reportYear = new Date().getFullYear();

  const companyName = company?.name ?? 'Ihr Unternehmen';

  const filteredSnapshots = (snapshots ?? []).filter((s) => !s.is_suppressed).slice(0, 20);

  const { data: latestLawyerReview } = await supabase
    .from('lawyer_reviews')
    .select('id, reviewed_by_name, scope_id, scope_label, verdict, notes, recommendations, document_hash, review_period_start, review_period_end, signed_at')
    .eq('organization_id', orgId)
    .eq('scope_type', 'pay_gap_report')
    .order('signed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const html = generateReportHtml({
    companyName,
    reportDate,
    reportYear,
    totalEmployees,
    maleCount,
    femaleCount,
    overallGap,
    gapStatus,
    variableGapPct,
    pctMaleVariable,
    pctFemaleVariable,
    quartiles,
    deptStats: Object.values(deptAgg),
    snapshots: filteredSnapshots,
    lawyerReview: latestLawyerReview
      ? {
          id: latestLawyerReview.id as string,
          reviewedByName: latestLawyerReview.reviewed_by_name as string,
          scopeId: latestLawyerReview.scope_id as string | null,
          scopeLabel: latestLawyerReview.scope_label as string | null,
          verdict: latestLawyerReview.verdict as string,
          notes: latestLawyerReview.notes as string | null,
          recommendations: latestLawyerReview.recommendations as string | null,
          documentHash: latestLawyerReview.document_hash as string | null,
          reviewPeriodStart: latestLawyerReview.review_period_start as string | null,
          reviewPeriodEnd: latestLawyerReview.review_period_end as string | null,
          signedAt: latestLawyerReview.signed_at as string,
        }
      : null,
  });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '18mm', right: '18mm' },
    });

    // Track report generation in compliance_reports
    const userId = context.claims?.sub ?? 'unknown';
    await supabase.from('compliance_reports').insert({
      organization_id: orgId,
      report_year: reportYear,
      reporting_period: 'annual',
      status: 'draft',
      generated_by: userId,
      report_data: {
        snapshot_count: filteredSnapshots.length,
        total_employees: totalEmployees,
        overall_gap: overallGap,
        variable_gap_pct: variableGapPct,
        quartiles,
        lawyer_review_id: latestLawyerReview?.id ?? null,
        lawyer_review_signed_at: latestLawyerReview?.signed_at ?? null,
        lawyer_review_verdict: latestLawyerReview?.verdict ?? null,
      },
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
  variableGapPct: number | null;
  pctMaleVariable: number | null;
  pctFemaleVariable: number | null;
  quartiles: { q: string; malePct: number | null; femalePct: number | null }[];
  deptStats: { name: string; male: number; female: number; diverse: number; total: number }[];
  snapshots: Array<Record<string, unknown>>;
  lawyerReview: LawyerReviewProof | null;
}

interface LawyerReviewProof {
  id: string;
  reviewedByName: string;
  scopeId: string | null;
  scopeLabel: string | null;
  verdict: string;
  notes: string | null;
  recommendations: string | null;
  documentHash: string | null;
  reviewPeriodStart: string | null;
  reviewPeriodEnd: string | null;
  signedAt: string;
}

const LAWYER_VERDICT_LABELS: Record<string, string> = {
  approved: 'Freigegeben',
  compliant_with_notes: 'Konform mit Hinweisen',
  needs_remediation: 'Nachbesserung erforderlich',
  rejected: 'Nicht freigegeben',
};

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

function quartileColor(pct: number | null): string {
  if (pct === null) return '#6b7280';
  if (pct >= 40 && pct <= 60) return '#16a34a'; // balanced
  if (pct >= 30 && pct <= 70) return '#d97706'; // skewed
  return '#dc2626'; // very skewed
}

function formatReportDate(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.klargehalt.de';
}

function generateLawyerReviewSection(review: LawyerReviewProof | null): string {
  if (!review) {
    return `
<div class="section">
  <div class="section-title">7. Anwaltliche Prüfung</div>
  <div class="warning-box">
    <strong>Nicht geprüft:</strong> Für diesen Pay-Gap-Bericht liegt noch keine datierte anwaltliche Prüfung vor.
    Für externe Verwendung sollte eine Prüfung im Compliance-Workflow eingeholt werden.
  </div>
</div>`;
  }

  const label = LAWYER_VERDICT_LABELS[review.verdict] ?? review.verdict;
  const period = review.reviewPeriodStart || review.reviewPeriodEnd
    ? `${formatReportDate(review.reviewPeriodStart)} bis ${formatReportDate(review.reviewPeriodEnd)}`
    : 'Nicht angegeben';
  const documentUrl = review.scopeId
    ? `${getAppUrl()}/compliance-workflow/certificate/${encodeURIComponent(review.scopeId)}`
    : null;

  return `
<div class="section">
  <div class="section-title">7. Anwaltliche Prüfung</div>
  <div class="lawyer-proof">
    <div class="lawyer-proof-header">
      <div>
        <div class="lawyer-proof-badge">Anwaltlich geprüft</div>
        <div class="lawyer-proof-title">${escapeHtml(label)}</div>
      </div>
      <div class="lawyer-proof-date">${formatReportDate(review.signedAt)}</div>
    </div>
    <table style="margin-top:12px">
      <tbody>
        <tr><th>Geprüft von</th><td>${escapeHtml(review.reviewedByName)}</td></tr>
        <tr><th>Prüfgegenstand</th><td>${escapeHtml(review.scopeLabel ?? 'Pay-Gap-Bericht')}</td></tr>
        <tr><th>Prüfzeitraum</th><td>${escapeHtml(period)}</td></tr>
        ${documentUrl ? `<tr><th>Gutachten</th><td><a href="${escapeHtml(documentUrl)}">${escapeHtml(documentUrl)}</a></td></tr>` : ''}
        ${review.documentHash ? `<tr><th>Dokument-Hash</th><td style="font-family:monospace;font-size:8pt">${escapeHtml(review.documentHash)}</td></tr>` : ''}
      </tbody>
    </table>
    ${review.notes ? `<p class="lawyer-proof-text"><strong>Hinweis:</strong> ${escapeHtml(review.notes)}</p>` : ''}
    ${review.recommendations ? `<p class="lawyer-proof-text"><strong>Empfehlung:</strong> ${escapeHtml(review.recommendations)}</p>` : ''}
  </div>
</div>`;
}

function generateVariablePaySection(p: ReportParams): string {
  const hasData = p.variableGapPct !== null || p.pctMaleVariable !== null || p.pctFemaleVariable !== null;
  if (!hasData) {
    return `
<div class="section">
  <div class="section-title">4. Variable Vergütung — Gender Pay Gap (Art. 9 Abs. 1b/d)</div>
  <p style="font-size:10pt; color:#94a3b8;">Keine Daten zur variablen Vergütung verfügbar.</p>
</div>`;
  }

  const variableGapDisplay = p.variableGapPct !== null ? `${p.variableGapPct.toFixed(1)} %` : 'Keine Daten';
  const variableGapCol = gapColor(p.variableGapPct);
  const maleVarDisplay = p.pctMaleVariable !== null ? `${p.pctMaleVariable.toFixed(1)} %` : '—';
  const femaleVarDisplay = p.pctFemaleVariable !== null ? `${p.pctFemaleVariable.toFixed(1)} %` : '—';

  // Build variable pay rows from snapshots
  const variableSnapRows = p.snapshots
    .filter((s) => s.mean_gap_variable_pct !== null && s.mean_gap_variable_pct !== undefined)
    .map(
      (s) => `
      <tr>
        <td>${String(s.scope_label ?? s.scope ?? '—')}</td>
        <td style="text-align:center">${String(s.male_count ?? '—')}</td>
        <td style="text-align:center">${String(s.female_count ?? '—')}</td>
        <td style="text-align:center; color:${gapColor(s.mean_gap_variable_pct as number | null)}">${Number(s.mean_gap_variable_pct).toFixed(1)} %</td>
        <td style="text-align:center">${formatEur(s.male_mean_variable)} / ${formatEur(s.female_mean_variable)}</td>
      </tr>`
    )
    .join('');

  return `
<div class="section">
  <div class="section-title">4. Variable Vergütung — Gender Pay Gap (Art. 9 Abs. 1b/d)</div>
  <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr);">
    <div class="kpi">
      <div class="kpi-label">Variable Pay Gap (Mean)</div>
      <div class="kpi-value" style="color:${variableGapCol}">${variableGapDisplay}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Anteil Männer mit variabler Vergütung</div>
      <div class="kpi-value" style="color:#3b82f6">${maleVarDisplay}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Anteil Frauen mit variabler Vergütung</div>
      <div class="kpi-value" style="color:#ec4899">${femaleVarDisplay}</div>
    </div>
  </div>
  ${variableSnapRows ? `
  <table style="margin-top:16px;">
    <thead>
      <tr>
        <th>Kategorie</th>
        <th style="text-align:center">Männlich (n)</th>
        <th style="text-align:center">Weiblich (n)</th>
        <th style="text-align:center">Variable Pay Gap</th>
        <th style="text-align:center">Ø Variable ♂ / ♀</th>
      </tr>
    </thead>
    <tbody>
      ${variableSnapRows}
    </tbody>
  </table>
  <p style="font-size:8pt;color:#94a3b8;margin-top:8px">
    Gap = (Ø männlich − Ø weiblich) / Ø männlich × 100. Bezogen auf variable Vergütungsbestandteile.
  </p>` : ''}
</div>`;
}

function generateQuartileSection(p: ReportParams): string {
  const hasQuartileData = p.quartiles.some((q) => q.malePct !== null || q.femalePct !== null);
  if (!hasQuartileData) {
    return `
<div class="section page-break">
  <div class="section-title">5. Quartilverteilung der Vergütung (Art. 9 Abs. 1e)</div>
  <p style="font-size:10pt; color:#94a3b8;">Keine Quartildaten verfügbar.</p>
</div>`;
  }

  const quartileRows = p.quartiles
    .map((q) => {
      const maleDisplay = q.malePct !== null ? `${q.malePct.toFixed(1)} %` : '—';
      const femaleDisplay = q.femalePct !== null ? `${q.femalePct.toFixed(1)} %` : '—';
      const maleCol = quartileColor(q.malePct);
      const femaleCol = quartileColor(q.femalePct);
      return `
      <tr>
        <td>${q.q}</td>
        <td style="text-align:center; color:${maleCol}; font-weight:600">${maleDisplay}</td>
        <td style="text-align:center; color:${femaleCol}; font-weight:600">${femaleDisplay}</td>
      </tr>`;
    })
    .join('');

  return `
<div class="section page-break">
  <div class="section-title">5. Quartilverteilung der Vergütung (Art. 9 Abs. 1e)</div>
  <p style="font-size:10pt; color:#374151; margin-bottom:12px;">
    Verteilung der Beschäftigten nach Geschlecht in den vier Entgeltquartilen.
    Ein ausgewogenes Verhältnis liegt bei 40–60 % vor.
  </p>
  <table>
    <thead>
      <tr>
        <th>Quartil</th>
        <th style="text-align:center">Männeranteil</th>
        <th style="text-align:center">Frauenanteil</th>
      </tr>
    </thead>
    <tbody>
      ${quartileRows}
    </tbody>
  </table>
  <p style="font-size:8pt;color:#94a3b8;margin-top:8px">
    <span style="color:#16a34a">■</span> Ausgewogen (40–60 %)&nbsp;&nbsp;
    <span style="color:#d97706">■</span> Leichte Abweichung (30–70 %)&nbsp;&nbsp;
    <span style="color:#dc2626">■</span> Starke Abweichung (&lt;30 % oder &gt;70 %)
  </p>
</div>`;
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
    .lawyer-proof { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 16px; }
    .lawyer-proof-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
    .lawyer-proof-badge { display: inline-block; background: #dcfce7; color: #166534; border: 1px solid #86efac; border-radius: 999px; padding: 3px 8px; font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
    .lawyer-proof-title { font-size: 14pt; font-weight: 800; color: #0f172a; margin-top: 6px; }
    .lawyer-proof-date { font-size: 10pt; font-weight: 700; color: #334155; white-space: nowrap; }
    .lawyer-proof-text { margin-top: 10px; font-size: 9pt; color: #334155; line-height: 1.6; }
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

${generateVariablePaySection(p)}

${generateQuartileSection(p)}

<div class="section">
  <div class="section-title">6. Methodik &amp; Rechtliche Grundlagen</div>
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

${generateLawyerReviewSection(p.lawyerReview)}

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
