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
    ? `<div class="badge-ok">
         Eine externe rechtliche Bewertung liegt vor — geprüft durch
         <strong>${escapeHtml(p.lawyerReview.reviewed_by_name)}</strong>
         (${escapeHtml(VERDICT_LABELS[p.lawyerReview.verdict] ?? p.lawyerReview.verdict)},
         ${escapeHtml(fmtDate(p.lawyerReview.signed_at))}). Die Dokumentation dieser
         Entgeltentscheidung wurde von einem externen Rechtsberater geprüft.
       </div>`
    : `<div class="badge-info">
         Für diese Entgeltentscheidung liegt aktuell keine externe anwaltliche Prüfung vor.
         Die Dokumentation kann auf Wunsch durch einen unabhängigen Rechtsberater geprüft werden.
       </div>`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; font-size: 11px; line-height: 1.55; margin: 0; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 13px; margin: 26px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #2563eb; color: #1e3a8a; }
  h3 { font-size: 12px; margin: 16px 0 6px; color: #1e40af; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #071423; padding-bottom: 14px; }
  .brand { font-size: 22px; font-weight: 700; color: #071423; }
  .sub { color: #475569; font-size: 10px; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0 4px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  th { background: #f1f5f9; font-size: 9.5px; text-transform: uppercase; letter-spacing: .04em; color: #475569; }
  .kv { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-top: 6px; }
  .kv div { display: flex; justify-content: space-between; border-bottom: 1px dotted #cbd5e1; padding: 3px 0; }
  .kv span:first-child { color: #64748b; }
  .kv span:last-child { font-weight: 600; }
  .muted { color: #64748b; font-style: italic; }
  .footnote { color: #64748b; font-size: 9px; margin-top: 4px; }
  .badge-ok { background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46; padding: 10px 12px; border-radius: 6px; margin: 8px 0; }
  .badge-info { background: #eff6ff; border: 1px solid #93c5fd; color: #1e40af; padding: 10px 12px; border-radius: 6px; margin: 8px 0; }
  .legal { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-top: 10px; font-size: 10px; }
  .legal h3 { margin-top: 12px; }
  .legal h3:first-child { margin-top: 0; }
  .disclaimer { margin-top: 22px; padding: 12px 14px; border: 1px dashed #94a3b8; border-radius: 6px; color: #475569; font-size: 9.5px; page-break-inside: avoid; }
  .page-break { page-break-before: always; }
  .footer { margin-top: 26px; border-top: 1px solid #e2e8f0; padding-top: 8px; color: #94a3b8; font-size: 9px; display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">KlarGehalt</div>
      <div class="sub">Auskunftsbericht gemäß EU-Entgelttransparenzrichtlinie (EU) 2023/970</div>
    </div>
    <div class="sub" style="text-align:right;">
      ${escapeHtml(p.companyName)}<br/>
      Erstellt am ${escapeHtml(gen)}
    </div>
  </div>

  <h1>Auskunftsbericht zur Entgeltgestaltung</h1>
  <p class="sub">
    Dieses Dokument fasst die für diese Person erfassten Entgeltdaten, die zugrunde
    liegenden objektiven Kriterien und den dokumentierten Entscheidungsverlauf zusammen.
    Es dient der Erfüllung des individuellen Auskunftsanspruchs nach Art. 7 der
    Richtlinie (EU) 2023/970.
  </p>

  <h2>1. Person</h2>
  <div class="kv">
    <div><span>Name</span><span>${escapeHtml(p.employee.first_name)} ${escapeHtml(p.employee.last_name)}</span></div>
    <div><span>Personalnummer</span><span>${escapeHtml(p.employee.employee_number || '—')}</span></div>
    <div><span>Abteilung</span><span>${escapeHtml(p.departmentName || '—')}</span></div>
    <div><span>Job-Profil</span><span>${escapeHtml(p.jobProfileTitle || '—')}</span></div>
    <div><span>Karrierestufe</span><span>${escapeHtml(p.jobLevelName || '—')}</span></div>
    <div><span>Beschäftigungsart</span><span>${escapeHtml(EMPLOYMENT_LABELS[p.employee.employment_type] ?? p.employee.employment_type)}</span></div>
    <div><span>Eintrittsdatum</span><span>${escapeHtml(fmtDate(p.employee.hire_date))}</span></div>
    <div><span>Standort</span><span>${escapeHtml(p.employee.location || '—')}</span></div>
  </div>
  <p class="footnote">
    Hinweis: Das Geschlechtsmerkmal (${escapeHtml(GENDER_LABELS[p.employee.gender] ?? p.employee.gender)})
    wird ausschließlich zur Erfüllung der gesetzlichen Analyse- und Auskunftspflichten
    verarbeitet (DSGVO Art. 9 Abs. 2 lit. b).
  </p>

  <h2>2. Aktuelle Vergütung</h2>
  <div class="kv">
    <div><span>Grundgehalt (jährlich)</span><span>${escapeHtml(fmtCurrency(p.employee.base_salary, currency))}</span></div>
    <div><span>Variable Vergütung</span><span>${escapeHtml(fmtCurrency(p.employee.variable_pay ?? 0, currency))}</span></div>
    <div><span>Wochenstunden</span><span>${escapeHtml(p.employee.weekly_hours ?? '—')}</span></div>
    <div><span>Währung</span><span>${escapeHtml(currency)}</span></div>
  </div>
  ${
    p.payBand
      ? `<h3>Eingruppierung in das Gehaltsband „${escapeHtml(p.payBand.name)}"</h3>
         <table>
           <thead><tr><th>Banduntergrenze</th><th>Bandmitte</th><th>Bandobergrenze</th><th>Aktuelle Position</th></tr></thead>
           <tbody><tr>
             <td>${escapeHtml(fmtCurrency(p.payBand.min, currency))}</td>
             <td>${escapeHtml(fmtCurrency(p.payBand.mid, currency))}</td>
             <td>${escapeHtml(fmtCurrency(p.payBand.max, currency))}</td>
             <td>${escapeHtml(fmtCurrency(p.employee.base_salary, currency))}</td>
           </tr></tbody>
         </table>`
      : `<p class="muted">Dieser Position ist derzeit kein Gehaltsband zugeordnet.</p>`
  }

  <h2>3. Objektive Kriterien der Entgeltfestsetzung (Art. 16)</h2>
  <p class="sub">
    Die Positionierung innerhalb des Gehaltsbands beruht auf den folgenden
    geschlechtsneutralen, objektiven Faktoren:
  </p>
  <table>
    <thead><tr><th>Faktor</th><th>Bewertung</th><th>Gewichtung</th><th>Anmerkung</th></tr></thead>
    <tbody>${factorRows}</tbody>
  </table>
  ${
    justification?.summary
      ? `<h3>Zusammenfassende Begründung</h3><p>${escapeHtml(justification.summary)}</p>`
      : ''
  }

  <h2>4. Dokumentierter Entscheidungsverlauf</h2>
  <p class="sub">
    Append-only Entscheidungsprotokoll. Einmal erfasste Einträge sind unveränderlich
    und bilden den Nachweis-Trail im Sinne der Beweislastregel des Art. 18.
  </p>
  <table>
    <thead><tr><th>Datum</th><th>Art</th><th>Vorher</th><th>Nachher</th><th>Begründung</th></tr></thead>
    <tbody>${decisionRows}</tbody>
  </table>

  <h2>5. Vergleichsgruppen-Kontext (Art. 7 Abs. 2 lit. b)</h2>
  <p class="sub">
    Durchschnittliche Entgeltniveaus für Beschäftigte, die gleiche oder gleichwertige
    Arbeit verrichten, aufgeschlüsselt nach Geschlecht:
  </p>
  ${cohortBlock}

  <h2>6. Externe rechtliche Prüfung</h2>
  ${lawyerBlock}

  <div class="page-break"></div>
  <h2>7. Rechtlicher Rahmen</h2>
  <div class="legal">
    <h3>Richtlinie (EU) 2023/970 — Entgelttransparenz</h3>
    <p><strong>Art. 7 — Auskunftsanspruch:</strong> Jede beschäftigte Person hat das Recht,
    schriftlich Auskunft über ihr individuelles Entgeltniveau sowie über die nach
    Geschlecht aufgeschlüsselten durchschnittlichen Entgeltniveaus der Personengruppen
    zu verlangen, die gleiche oder gleichwertige Arbeit verrichten.</p>
    <p><strong>Art. 16 — Transparenz der Kriterien:</strong> Die zur Festlegung von Entgelt
    und beruflicher Entwicklung herangezogenen Kriterien müssen objektiv,
    geschlechtsneutral und nachvollziehbar sein. Die obenstehende Faktorentabelle
    dokumentiert diese Kriterien.</p>
    <p><strong>Art. 18 — Beweislastumkehr:</strong> Macht eine beschäftigte Person eine
    Entgeltdiskriminierung geltend, obliegt es dem Arbeitgeber nachzuweisen, dass
    keine Diskriminierung vorlag. Der dokumentierte, unveränderliche Entscheidungs-Trail
    in Abschnitt 4 dient genau diesem Nachweiszweck.</p>

    <h3>Datenschutz (DSGVO)</h3>
    <p><strong>Art. 15 — Auskunftsrecht:</strong> Dieses Dokument umfasst die zu Ihrer Person
    gespeicherten entgeltrelevanten Daten. <strong>Art. 9:</strong> Geschlechtsbezogene
    Merkmale werden ausschließlich zur Erfüllung gesetzlicher Analyse- und
    Auskunftspflichten verarbeitet; Vergleichswerte werden bei Gruppen unter fünf
    Personen je Geschlecht zum Schutz der Betroffenen nicht ausgewiesen.</p>
  </div>

  <div class="disclaimer">
    <strong>Wichtiger Hinweis:</strong> Dieses Dokument wurde automatisiert durch die
    KlarGehalt-Plattform auf Basis der vom Unternehmen erfassten Daten erstellt. Es
    stellt eine strukturierte Dokumentation der Entgeltentscheidungen dar und unterstützt
    Sie bei der Erfüllung der Anforderungen der Richtlinie (EU) 2023/970. Es handelt sich
    nicht um eine Rechtsberatung und nicht um ein amtliches Dokument. Eine belastbare
    rechtliche Absicherung entsteht erst durch die Prüfung durch einen externen
    Rechtsberater${p.lawyerReview ? ' (für diese Entscheidung liegt eine solche Prüfung vor — siehe Abschnitt 6)' : ''}.
  </div>

  <div class="footer">
    <span>KlarGehalt · Auskunftsbericht · ${escapeHtml(p.companyName)}</span>
    <span>Erstellt am ${escapeHtml(gen)}</span>
  </div>
</body>
</html>`;
}
