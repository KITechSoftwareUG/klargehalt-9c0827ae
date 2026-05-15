import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole } from '@/lib/auth/api-guard';
import { createServiceClient } from '@/lib/supabase/server';
import puppeteer from 'puppeteer';

/**
 * Per-employee disclosure report (Auskunftsbericht) — EU 2023/970 Art. 7.
 *
 * When an employee exercises their statutory right to information ("Warum
 * verdiene ich das?"), HR hands them this PDF: their individual pay level,
 * the structured criteria behind it, the documented decision trail, and the
 * cohort context (gender-split averages, suppressed below k=5 for DSGVO Art. 9).
 *
 * Available in ALL tiers — the individual Auskunftsanspruch is a legal
 * obligation even below the reporting thresholds (see .claude/docs/law.md §2).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['admin', 'hr_manager']);
  if (guard instanceof NextResponse) return guard;

  const { orgId } = guard;
  const { id: employeeId } = await params;
  const supabase = createServiceClient();

  const { data: company } = await supabase
    .from('companies')
    .select('name, legal_name')
    .eq('organization_id', orgId)
    .maybeSingle();
  const companyName = (company?.legal_name as string) || (company?.name as string) || 'Ihr Unternehmen';

  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .eq('organization_id', orgId)
    .maybeSingle();

  if (!employee) {
    return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 });
  }

  // Resolve structural labels.
  const [{ data: dept }, { data: profile }, { data: level }, { data: band }] = await Promise.all([
    employee.department_id
      ? supabase.from('departments').select('name').eq('id', employee.department_id).maybeSingle()
      : Promise.resolve({ data: null }),
    employee.job_profile_id
      ? supabase.from('job_profiles').select('title').eq('id', employee.job_profile_id).maybeSingle()
      : Promise.resolve({ data: null }),
    employee.job_level_id
      ? supabase.from('job_levels').select('name').eq('id', employee.job_level_id).maybeSingle()
      : Promise.resolve({ data: null }),
    employee.pay_band_id
      ? supabase.from('pay_bands').select('name, min_salary, mid_salary, max_salary')
          .eq('id', employee.pay_band_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Decision trail (append-only) for this employee.
  const { data: decisions } = await supabase
    .from('salary_decisions')
    .select('decision_type, old_salary, new_salary, justification_text, decided_at, lawyer_review_id')
    .eq('organization_id', orgId)
    .eq('employee_id', employeeId)
    .order('decided_at', { ascending: false });

  // Optional external legal review linked to any of this employee's decisions.
  const reviewId = (decisions ?? []).map((d) => d.lawyer_review_id).find(Boolean) as string | undefined;
  let lawyerReview: { reviewed_by_name: string; verdict: string; signed_at: string } | null = null;
  if (reviewId) {
    const { data: lr } = await supabase
      .from('lawyer_reviews')
      .select('reviewed_by_name, verdict, signed_at')
      .eq('id', reviewId)
      .eq('organization_id', orgId)
      .maybeSingle();
    lawyerReview = (lr as typeof lawyerReview) ?? null;
  }

  // Cohort context for Art. 7(b): same job_profile + level, gender-split
  // averages with k-anonymity suppression (min 5 per group, DSGVO Art. 9).
  let cohort: CohortContext | null = null;
  if (employee.job_profile_id && employee.job_level_id) {
    const { data: peers } = await supabase
      .from('employees')
      .select('gender, base_salary')
      .eq('organization_id', orgId)
      .eq('job_profile_id', employee.job_profile_id)
      .eq('job_level_id', employee.job_level_id)
      .eq('is_active', true);

    const rows = (peers ?? []).filter((p) => typeof p.base_salary === 'number');
    const mean = (g: string) => {
      const vals = rows.filter((r) => r.gender === g).map((r) => r.base_salary as number);
      return vals.length >= 5
        ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
        : null;
    };
    const allVals = rows.map((r) => r.base_salary as number);
    cohort = {
      total: rows.length,
      groupMean: allVals.length >= 5
        ? Math.round(allVals.reduce((a, b) => a + b, 0) / allVals.length)
        : null,
      maleMean: mean('male'),
      femaleMean: mean('female'),
      suppressed: rows.length < 5,
    };
  }

  const html = renderHtml({
    companyName,
    generatedAt: new Date(),
    employee: employee as EmployeeRow,
    departmentName: (dept?.name as string) ?? null,
    jobProfileTitle: (profile?.title as string) ?? null,
    jobLevelName: (level?.name as string) ?? null,
    payBand: band
      ? {
          name: (band.name as string) ?? '',
          min: band.min_salary as number | null,
          mid: band.mid_salary as number | null,
          max: band.max_salary as number | null,
        }
      : null,
    decisions: (decisions ?? []) as DecisionRow[],
    cohort,
    lawyerReview,
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
      margin: { top: '18mm', bottom: '20mm', left: '16mm', right: '16mm' },
    });

    const safeName = `${employee.last_name ?? 'Mitarbeiter'}_${employee.first_name ?? ''}`
      .replace(/[^A-Za-z0-9_]/g, '_');

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="KlarGehalt_Auskunftsbericht_${safeName}.pdf"`,
      },
    });
  } finally {
    await browser?.close();
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface EmployeeRow {
  first_name: string;
  last_name: string;
  employee_number: string | null;
  email: string | null;
  gender: string;
  employment_type: string;
  hire_date: string | null;
  base_salary: number;
  variable_pay: number | null;
  weekly_hours: number | null;
  currency: string | null;
  location: string | null;
  salary_justification: unknown;
}

interface DecisionRow {
  decision_type: string;
  old_salary: number | null;
  new_salary: number;
  justification_text: string;
  decided_at: string;
  lawyer_review_id: string | null;
}

interface CohortContext {
  total: number;
  groupMean: number | null;
  maleMean: number | null;
  femaleMean: number | null;
  suppressed: boolean;
}

interface ReportParams {
  companyName: string;
  generatedAt: Date;
  employee: EmployeeRow;
  departmentName: string | null;
  jobProfileTitle: string | null;
  jobLevelName: string | null;
  payBand: { name: string; min: number | null; mid: number | null; max: number | null } | null;
  decisions: DecisionRow[];
  cohort: CohortContext | null;
  lawyerReview: { reviewed_by_name: string; verdict: string; signed_at: string } | null;
}

// ─── Labels ────────────────────────────────────────────────────────────────

const GENDER_LABELS: Record<string, string> = {
  male: 'Männlich',
  female: 'Weiblich',
  diverse: 'Divers',
  not_specified: 'Keine Angabe',
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: 'Vollzeit',
  part_time: 'Teilzeit',
  contract: 'Vertrag',
};

const DECISION_LABELS: Record<string, string> = {
  hire: 'Einstellung',
  raise: 'Gehaltserhöhung',
  promotion: 'Beförderung',
  band_change: 'Bandwechsel',
  correction: 'Korrektur',
};

const FACTOR_LABELS: Record<string, string> = {
  experience: 'Berufserfahrung',
  education: 'Ausbildung',
  performance: 'Leistung',
  market_rate: 'Marktgehalt',
  seniority: 'Betriebszugehörigkeit',
  other: 'Sonstiges',
};

const SCORE_LABELS: Record<number, string> = {
  1: 'Gering',
  2: 'Unterdurchschnittlich',
  3: 'Durchschnittlich',
  4: 'Überdurchschnittlich',
  5: 'Herausragend',
};

const VERDICT_LABELS: Record<string, string> = {
  approved: 'Freigegeben',
  compliant_with_notes: 'Konform mit Hinweisen',
  needs_remediation: 'Nachbesserung erforderlich',
  rejected: 'Nicht freigegeben',
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtCurrency(value: number | null | undefined, currency = 'EUR'): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function fmtDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ─── HTML template ─────────────────────────────────────────────────────────

function renderHtml(p: ReportParams): string {
  const currency = p.employee.currency ?? 'EUR';
  const gen = p.generatedAt.toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const justification = p.employee.salary_justification as
    | { factors?: Array<{ type: string; score: number; weight: number; note?: string }>; summary?: string }
    | null;
  const factors = Array.isArray(justification?.factors) ? justification!.factors : [];

  const factorRows = factors.length
    ? factors
        .map(
          (f) => `
        <tr>
          <td>${escapeHtml(FACTOR_LABELS[f.type] ?? f.type)}</td>
          <td>${escapeHtml(SCORE_LABELS[f.score] ?? f.score)} (${escapeHtml(f.score)}/5)</td>
          <td>${escapeHtml(Math.round((f.weight ?? 0) * 100))} %</td>
          <td>${escapeHtml(f.note || '—')}</td>
        </tr>`,
        )
        .join('')
    : `<tr><td colspan="4" class="muted">Noch keine strukturierten Bewertungsfaktoren hinterlegt.</td></tr>`;

  const decisionRows = p.decisions.length
    ? p.decisions
        .map(
          (d) => `
        <tr>
          <td>${escapeHtml(fmtDate(d.decided_at))}</td>
          <td>${escapeHtml(DECISION_LABELS[d.decision_type] ?? d.decision_type)}</td>
          <td>${escapeHtml(fmtCurrency(d.old_salary, currency))}</td>
          <td>${escapeHtml(fmtCurrency(d.new_salary, currency))}</td>
          <td>${escapeHtml(d.justification_text)}</td>
        </tr>`,
        )
        .join('')
    : `<tr><td colspan="5" class="muted">Für diese Person sind noch keine dokumentierten Entscheidungen erfasst.</td></tr>`;

  const cohortBlock = p.cohort
    ? p.cohort.suppressed
      ? `<p class="muted">Die Vergleichsgruppe (gleiche bzw. gleichwertige Tätigkeit) umfasst weniger
           als fünf Personen. Aus Datenschutzgründen (DSGVO Art. 9) werden hier keine
           Durchschnittswerte ausgewiesen.</p>`
      : `<table>
          <thead><tr><th>Vergleichsgruppe</th><th>Anzahl</th><th>Ø Grundgehalt</th></tr></thead>
          <tbody>
            <tr><td>Gesamt (gleiche/gleichwertige Tätigkeit)</td><td>${escapeHtml(p.cohort.total)}</td><td>${escapeHtml(fmtCurrency(p.cohort.groupMean, currency))}</td></tr>
            <tr><td>Frauen in der Gruppe</td><td>—</td><td>${escapeHtml(p.cohort.femaleMean != null ? fmtCurrency(p.cohort.femaleMean, currency) : 'unterdrückt (< 5)')}</td></tr>
            <tr><td>Männer in der Gruppe</td><td>—</td><td>${escapeHtml(p.cohort.maleMean != null ? fmtCurrency(p.cohort.maleMean, currency) : 'unterdrückt (< 5)')}</td></tr>
          </tbody>
        </table>
        <p class="footnote">Durchschnittswerte werden bei Gruppen unter fünf Personen je Geschlecht
          aus Datenschutzgründen nicht ausgewiesen (DSGVO Art. 9, Datenminimierung Art. 5).</p>`
    : `<p class="muted">Für diese Position ist noch keine Vergleichsgruppe (Job-Profil × Karrierestufe)
         hinterlegt. Sobald Struktur- und Vergütungsdaten vollständig sind, erscheinen hier die
         nach Geschlecht aufgeschlüsselten Durchschnittsentgelte gemäß Art. 7 Abs. 2 lit. b.</p>`;

  const lawyerBlock = p.lawyerReview
    ? `<p>Die Dokumentation der hier dargestellten Entgeltentscheidung wurde durch einen
         externen, von diesem Unternehmen unabhängigen Rechtsberater geprüft. Die Prüfung
         erfolgte durch <strong>${escapeHtml(p.lawyerReview.reviewed_by_name)}</strong> mit
         dem Ergebnis „${escapeHtml(VERDICT_LABELS[p.lawyerReview.verdict] ?? p.lawyerReview.verdict)}"
         (Datum der Prüfung: ${escapeHtml(fmtDate(p.lawyerReview.signed_at))}). Die externe
         Prüfung bezieht sich auf die Nachvollziehbarkeit und Vollständigkeit der
         Dokumentation; sie stellt keine Gewähr für ein bestimmtes Ergebnis eines etwaigen
         Rechtsstreits dar.</p>`
    : `<p>Für die hier dargestellte Entgeltentscheidung liegt zum Zeitpunkt der Erstellung
         dieses Dokuments keine Prüfung durch einen externen Rechtsberater vor. Die
         Dokumentation kann auf Wunsch durch einen unabhängigen Rechtsberater geprüft
         werden. Das Fehlen einer externen Prüfung bedeutet nicht, dass die
         Entgeltfestsetzung zu beanstanden ist; die zugrunde liegenden Kriterien und der
         Entscheidungsverlauf sind in den Abschnitten 3 und 4 dargelegt.</p>`;

  const docRef = `EA-${p.generatedAt.getFullYear()}-${String(p.generatedAt.getMonth() + 1).padStart(2, '0')}${String(p.generatedAt.getDate()).padStart(2, '0')}`;
  const employeeFullName = `${p.employee.first_name} ${p.employee.last_name}`.trim();
  const genStr = p.generatedAt.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: Georgia, 'Times New Roman', 'Liberation Serif', serif;
    color: #1a1a1a; font-size: 10.5pt; line-height: 1.6; margin: 0;
    -webkit-print-color-adjust: exact;
  }
  p { margin: 0 0 9px; text-align: justify; }
  h1 { font-size: 15pt; font-weight: 700; margin: 0 0 2px; letter-spacing: .01em; }
  h2 {
    font-size: 11.5pt; font-weight: 700; margin: 22px 0 7px;
    padding-bottom: 3px; border-bottom: 1px solid #999;
  }
  h3 { font-size: 10.5pt; font-weight: 700; margin: 14px 0 5px; }
  .letterhead {
    border-bottom: 1.5px solid #1a1a1a; padding-bottom: 10px;
    display: flex; justify-content: space-between; align-items: flex-end;
  }
  .org { font-size: 12pt; font-weight: 700; }
  .org-sub { font-size: 9pt; color: #555; margin-top: 2px; }
  .meta { font-size: 8.5pt; color: #555; text-align: right; line-height: 1.5; }
  .doctitle { margin: 24px 0 4px; }
  .subject { font-weight: 700; margin: 14px 0 16px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 6px; font-size: 9.5pt; }
  th, td { text-align: left; padding: 5px 8px; border: 1px solid #bbb; vertical-align: top; }
  th { background: #ededed; font-weight: 700; }
  .data-table td:first-child { width: 38%; color: #444; }
  .muted { color: #555; font-style: italic; }
  .footnote { color: #555; font-size: 8.5pt; margin-top: 4px; }
  .legal p { margin-bottom: 8px; }
  .legal-ref { font-variant: small-caps; font-weight: 700; }
  .signature { margin-top: 34px; }
  .sig-line { margin-top: 40px; border-top: 1px solid #1a1a1a; width: 58%; padding-top: 4px; font-size: 9pt; color: #444; }
  .page-break { page-break-before: always; }
  .closing-note {
    margin-top: 24px; padding-top: 10px; border-top: 1px solid #999;
    font-size: 8.5pt; color: #555;
  }
  .gen-note { margin-top: 18px; font-size: 8pt; color: #888; text-align: center; }
</style>
</head>
<body>

  <div class="letterhead">
    <div>
      <div class="org">${escapeHtml(p.companyName)}</div>
      <div class="org-sub">Personalwesen / Entgeltverwaltung</div>
    </div>
    <div class="meta">
      Dokument-Nr.: ${escapeHtml(docRef)}<br/>
      Ausstellungsdatum: ${escapeHtml(genStr)}<br/>
      Vertraulich — persönlich
    </div>
  </div>

  <h1 class="doctitle">Auskunft über das individuelle Entgelt</h1>
  <div class="org-sub">gemäß dem Auskunftsanspruch nach Artikel 7 der Richtlinie (EU) 2023/970
  (Entgelttransparenzrichtlinie)</div>

  <p class="subject">Betreff: Auskunft zur Höhe und zu den Kriterien Ihrer Vergütung
  — ${escapeHtml(employeeFullName)}</p>

  <p>Sehr geehrte/r ${escapeHtml(employeeFullName)},</p>

  <p>mit diesem Dokument kommen wir Ihrem gesetzlich verankerten Auskunftsanspruch nach.
  Nach Artikel 7 der Richtlinie (EU) 2023/970 hat jede beschäftigte Person das Recht, in
  klarer und verständlicher Form Auskunft zu verlangen über die Höhe des eigenen Entgelts
  sowie über die durchschnittlichen Entgeltniveaus — aufgeschlüsselt nach Geschlecht — für
  diejenigen Gruppen von Beschäftigten, die gleiche oder gleichwertige Arbeit verrichten.
  Ergänzend besteht nach Artikel 16 der Richtlinie ein Anspruch darauf, die objektiven und
  geschlechtsneutralen Kriterien zu erfahren, nach denen Entgelt und berufliche Entwicklung
  festgelegt werden.</p>

  <p>Die nachfolgenden Abschnitte stellen die zu Ihrer Person gespeicherten
  entgeltrelevanten Angaben, die Ihrer Vergütung zugrunde liegenden Kriterien sowie den
  dokumentierten Verlauf der Sie betreffenden Entgeltentscheidungen dar. Alle Angaben
  beziehen sich auf den Stand des oben genannten Ausstellungsdatums. Sollten einzelne
  Angaben aus Ihrer Sicht unrichtig oder unvollständig sein, können Sie deren Berichtigung
  verlangen; die hierfür zuständige Stelle ist am Ende dieses Dokuments genannt.</p>

  <h2>1. Angaben zu Ihrer Person und Tätigkeit</h2>
  <p>Die folgenden Stammdaten bilden die Grundlage für die Zuordnung zu einer Tätigkeits-
  und Vergleichsgruppe. Die Einordnung in Abteilung, Tätigkeitsprofil und Karrierestufe
  bestimmt, welche Beschäftigten im Sinne der Richtlinie „gleiche oder gleichwertige
  Arbeit" verrichten und damit als Vergleichsmaßstab herangezogen werden.</p>
  <table class="data-table">
    <tbody>
      <tr><td>Name</td><td>${escapeHtml(employeeFullName)}</td></tr>
      <tr><td>Personalnummer</td><td>${escapeHtml(p.employee.employee_number || '—')}</td></tr>
      <tr><td>Abteilung</td><td>${escapeHtml(p.departmentName || '—')}</td></tr>
      <tr><td>Tätigkeitsprofil</td><td>${escapeHtml(p.jobProfileTitle || '—')}</td></tr>
      <tr><td>Karrierestufe</td><td>${escapeHtml(p.jobLevelName || '—')}</td></tr>
      <tr><td>Beschäftigungsart</td><td>${escapeHtml(EMPLOYMENT_LABELS[p.employee.employment_type] ?? p.employee.employment_type)}</td></tr>
      <tr><td>Eintrittsdatum</td><td>${escapeHtml(fmtDate(p.employee.hire_date))}</td></tr>
      <tr><td>Standort</td><td>${escapeHtml(p.employee.location || '—')}</td></tr>
    </tbody>
  </table>
  <p class="footnote">Das Geschlechtsmerkmal
  (${escapeHtml(GENDER_LABELS[p.employee.gender] ?? p.employee.gender)}) wird ausschließlich
  zur Erfüllung der gesetzlichen Analyse- und Auskunftspflichten verarbeitet und nicht zu
  anderen Zwecken verwendet (Art. 9 Abs. 2 lit. b DSGVO i. V. m. Art. 7 der Richtlinie
  (EU) 2023/970).</p>

  <h2>2. Höhe Ihres Entgelts</h2>
  <p>Nachstehend ist die Höhe Ihres Entgelts zum Ausstellungsdatum aufgeführt. Das
  Grundentgelt bezeichnet die feste jährliche Vergütung; variable Bestandteile umfassen
  insbesondere leistungs- oder erfolgsabhängige Zahlungen, soweit solche vereinbart sind.</p>
  <table class="data-table">
    <tbody>
      <tr><td>Grundentgelt (jährlich)</td><td>${escapeHtml(fmtCurrency(p.employee.base_salary, currency))}</td></tr>
      <tr><td>Variable Bestandteile</td><td>${escapeHtml(fmtCurrency(p.employee.variable_pay ?? 0, currency))}</td></tr>
      <tr><td>Vereinbarte Wochenarbeitszeit</td><td>${escapeHtml(p.employee.weekly_hours ?? '—')} Stunden</td></tr>
      <tr><td>Währung</td><td>${escapeHtml(currency)}</td></tr>
    </tbody>
  </table>
  ${
    p.payBand
      ? `<p>Ihre Tätigkeit ist dem Entgeltband „${escapeHtml(p.payBand.name)}" zugeordnet.
         Ein Entgeltband legt für vergleichbare Tätigkeiten einen objektiv definierten
         Rahmen aus Unter-, Mittel- und Obergrenze fest. Die nachstehende Übersicht zeigt
         diesen Rahmen und Ihre derzeitige Einordnung darin:</p>
         <table>
           <thead><tr><th>Banduntergrenze</th><th>Bandmitte</th><th>Bandobergrenze</th><th>Ihre derzeitige Einordnung</th></tr></thead>
           <tbody><tr>
             <td>${escapeHtml(fmtCurrency(p.payBand.min, currency))}</td>
             <td>${escapeHtml(fmtCurrency(p.payBand.mid, currency))}</td>
             <td>${escapeHtml(fmtCurrency(p.payBand.max, currency))}</td>
             <td>${escapeHtml(fmtCurrency(p.employee.base_salary, currency))}</td>
           </tr></tbody>
         </table>`
      : `<p class="muted">Ihrer Tätigkeit ist derzeit kein formal definiertes Entgeltband
         zugeordnet. Die Vergütung wurde anhand der in Abschnitt 3 dargestellten Kriterien
         festgelegt.</p>`
  }

  <h2>3. Objektive Kriterien der Entgeltfestsetzung</h2>
  <p>Nach Artikel 16 der Richtlinie (EU) 2023/970 müssen die zur Festlegung des Entgelts
  herangezogenen Kriterien objektiv, geschlechtsneutral und nachvollziehbar sein. Ihre
  Einordnung innerhalb des Entgeltrahmens beruht auf den nachfolgend aufgeführten Faktoren.
  Die Spalte „Bewertung" gibt die Ausprägung des jeweiligen Faktors auf einer Skala von 1
  (gering) bis 5 (herausragend) an; die Spalte „Gewichtung" beschreibt, mit welchem Anteil
  der jeweilige Faktor in die Gesamtbeurteilung eingeflossen ist.</p>
  <table>
    <thead><tr><th>Kriterium</th><th>Bewertung</th><th>Gewichtung</th><th>Erläuterung</th></tr></thead>
    <tbody>${factorRows}</tbody>
  </table>
  ${
    justification?.summary
      ? `<h3>Zusammenfassende Begründung</h3><p>${escapeHtml(justification.summary)}</p>`
      : `<p class="muted">Eine zusammenfassende textliche Begründung wurde bislang nicht
         hinterlegt. Die maßgeblichen Kriterien ergeben sich aus der vorstehenden Tabelle
         sowie aus dem in Abschnitt 4 dargestellten Entscheidungsverlauf.</p>`
  }

  <h2>4. Verlauf der Entgeltentscheidungen</h2>
  <p>Die nachstehende Aufstellung dokumentiert die Sie betreffenden Entgeltentscheidungen
  in zeitlicher Reihenfolge. Jeder Eintrag ist unveränderlich erfasst; spätere Korrekturen
  erfolgen ausschließlich durch einen zusätzlichen, ergänzenden Eintrag und nicht durch
  Überschreiben. Diese lückenlose Dokumentation dient der Nachvollziehbarkeit der
  Entgeltgestaltung und bildet zugleich die Grundlage für die in Abschnitt 6 erläuterte
  gesetzliche Beweislastverteilung.</p>
  <table>
    <thead><tr><th>Datum</th><th>Anlass</th><th>Vorher</th><th>Nachher</th><th>Begründung</th></tr></thead>
    <tbody>${decisionRows}</tbody>
  </table>

  <h2>5. Vergleichsgruppe — durchschnittliche Entgeltniveaus nach Geschlecht</h2>
  <p>Nach Artikel 7 Absatz 2 Buchstabe b der Richtlinie (EU) 2023/970 umfasst Ihr
  Auskunftsanspruch auch die nach Geschlecht aufgeschlüsselten durchschnittlichen
  Entgeltniveaus derjenigen Beschäftigten, die gleiche oder gleichwertige Arbeit
  verrichten. Als Vergleichsgruppe wird die Gesamtheit der Beschäftigten mit demselben
  Tätigkeitsprofil und derselben Karrierestufe herangezogen. Zum Schutz der
  Persönlichkeitsrechte Dritter werden Durchschnittswerte nicht ausgewiesen, sofern eine
  Geschlechtergruppe innerhalb der Vergleichsgruppe weniger als fünf Personen umfasst
  (Grundsatz der Datenminimierung, Art. 5 DSGVO).</p>
  ${cohortBlock}

  <h2>6. Externe rechtliche Prüfung</h2>
  ${lawyerBlock}

  <div class="page-break"></div>
  <h2>7. Rechtlicher Rahmen und Hinweise</h2>
  <div class="legal">
    <p>Die folgende Darstellung erläutert die diesem Dokument zugrunde liegenden
    Rechtsgrundlagen. Sie dient Ihrer Information und ersetzt keine individuelle
    Rechtsberatung.</p>

    <h3>Richtlinie (EU) 2023/970 (Entgelttransparenzrichtlinie)</h3>
    <p><span class="legal-ref">Artikel 7 — Auskunftsanspruch.</span> Jede beschäftigte
    Person hat das Recht, Auskunft über das eigene Entgeltniveau sowie über die nach
    Geschlecht aufgeschlüsselten durchschnittlichen Entgeltniveaus der Gruppen zu
    verlangen, die gleiche oder gleichwertige Arbeit verrichten. Diesem Anspruch wird mit
    den Abschnitten 2 und 5 dieses Dokuments entsprochen.</p>
    <p><span class="legal-ref">Artikel 16 — Transparenz der Kriterien.</span> Die zur
    Festlegung von Entgelt und beruflicher Entwicklung herangezogenen Kriterien müssen
    objektiv und geschlechtsneutral sein. Abschnitt 3 legt diese Kriterien für Ihren Fall
    offen.</p>
    <p><span class="legal-ref">Artikel 18 — Beweislast.</span> Macht eine beschäftigte
    Person eine Entgeltdiskriminierung geltend, obliegt es grundsätzlich dem Arbeitgeber
    nachzuweisen, dass keine Diskriminierung vorlag. Der in Abschnitt 4 dokumentierte,
    unveränderliche Entscheidungsverlauf dient der Erfüllung dieser Nachweisobliegenheit.</p>

    <h3>Datenschutz-Grundverordnung (DSGVO)</h3>
    <p><span class="legal-ref">Artikel 15 — Auskunftsrecht.</span> Dieses Dokument umfasst
    die zu Ihrer Person verarbeiteten entgeltrelevanten Daten.
    <span class="legal-ref">Artikel 9 — besondere Datenkategorien.</span> Das
    Geschlechtsmerkmal wird ausschließlich zur Erfüllung der gesetzlichen Analyse- und
    Auskunftspflichten verarbeitet. <span class="legal-ref">Artikel 5 —
    Datenminimierung.</span> Vergleichswerte werden bei zu kleinen Geschlechtergruppen
    (weniger als fünf Personen) zum Schutz der betroffenen Personen nicht ausgewiesen.</p>

    <h3>Rechtlicher Charakter dieses Dokuments</h3>
    <p>Dieses Dokument wurde durch das oben genannte Unternehmen auf Grundlage der intern
    erfassten Daten erstellt. Es stellt eine strukturierte Auskunft und Dokumentation der
    Entgeltgestaltung dar und unterstützt bei der Erfüllung der Anforderungen der
    Richtlinie (EU) 2023/970. Es handelt sich weder um eine Rechtsberatung noch um ein
    amtliches Dokument einer Behörde oder eines Gerichts. Eine über die strukturierte
    Dokumentation hinausgehende rechtliche Bewertung erfolgt ausschließlich durch eine
    Prüfung durch einen externen Rechtsberater${p.lawyerReview ? '; für die hier dargestellte Entscheidung liegt eine solche Prüfung vor (siehe Abschnitt 6)' : ' (siehe Abschnitt 6)'}.</p>
  </div>

  <div class="signature">
    <p>Für Rückfragen, zur Geltendmachung einer Berichtigung oder für weitergehende
    Auskünfte wenden Sie sich bitte an die Personalabteilung des oben genannten
    Unternehmens.</p>
    <div class="sig-line">Ort, Datum — Personalabteilung ${escapeHtml(p.companyName)}</div>
  </div>

  <div class="closing-note">
    Dieses Dokument wurde am ${escapeHtml(gen)} maschinell erzeugt und ist ohne
    Unterschrift gültig. Maßgeblich ist der zum Ausstellungsdatum gespeicherte Datenstand.
  </div>

  <div class="gen-note">Technische Erstellung über die KlarGehalt-Plattform.</div>
</body>
</html>`;
}
