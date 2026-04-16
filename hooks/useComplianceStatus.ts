'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

export interface ComplianceObligation {
  id: string;
  article: string;
  title: string;
  description: string;
  status: 'pass' | 'warn' | 'fail' | 'na';
  deadline: string | null;
  actionRequired: string | null;
  detail: string | null;
}

export interface ComplianceStatusData {
  score: number;
  obligations: ComplianceObligation[];
  totalObligations: number;
  passingCount: number;
  warningCount: number;
  failingCount: number;
  lastChecked: string;
}

// ---- helpers ----------------------------------------------------------------

function daysSince(isoDate: string): number {
  const ms = Date.now() - new Date(isoDate).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function computeScore(obligations: ComplianceObligation[]): number {
  const scorable = obligations.filter((o) => o.status !== 'na');
  if (scorable.length === 0) return 100;
  const passing = scorable.filter((o) => o.status === 'pass').length;
  const warning = scorable.filter((o) => o.status === 'warn').length;
  // pass = full point, warn = half point, fail = 0
  const achieved = passing + warning * 0.5;
  return Math.round((achieved / scorable.length) * 100);
}

// ---- types for raw Supabase rows --------------------------------------------

interface CompanyRow {
  employee_size_band: '1-50' | '51-250' | '251+' | null;
  reporting_frequency: 'annual' | 'triennial' | null;
}

interface JobPostingRow {
  status: string;
  salary_disclosed: boolean | null;
}

interface RightsNotificationRow {
  notification_year: number;
  sent_at: string;
}

interface InfoRequestRow {
  status: string;
  deadline_at: string | null;
  created_at: string;
}

interface PayGapSnapshotRow {
  gap_status: string;
  requires_joint_assessment: boolean;
  snapshot_date: string;
}

interface JointAssessmentRow {
  status: string;
  scope_label: string | null;
  gap_pct: number | null;
  created_at: string;
}

interface EmployeeRow {
  job_profile_id: string | null;
  pay_band_id: string | null;
}

// ---- fetcher ----------------------------------------------------------------

async function fetchComplianceData(
  orgId: string,
  supabase: ReturnType<typeof useAuth>['supabase'],
): Promise<ComplianceStatusData> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();

  const [
    companyRes,
    jobPostingsRes,
    rightsNotificationsRes,
    infoRequestsRes,
    payGapSnapshotsRes,
    jointAssessmentsRes,
    employeesRes,
  ] = await Promise.all([
    supabase
      .from('companies')
      .select('employee_size_band, reporting_frequency')
      .eq('organization_id', orgId)
      .maybeSingle(),
    supabase
      .from('job_postings')
      .select('status, salary_disclosed')
      .eq('organization_id', orgId),
    supabase
      .from('rights_notifications')
      .select('notification_year, sent_at')
      .eq('organization_id', orgId)
      .order('notification_year', { ascending: false }),
    supabase
      .from('info_requests')
      .select('status, deadline_at, created_at')
      .eq('organization_id', orgId)
      .eq('status', 'pending'),
    supabase
      .from('pay_gap_snapshots')
      .select('gap_status, requires_joint_assessment, snapshot_date')
      .eq('organization_id', orgId)
      .order('snapshot_date', { ascending: false }),
    supabase
      .from('joint_assessments')
      .select('status, scope_label, gap_pct, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false }),
    supabase
      .from('employees')
      .select('job_profile_id, pay_band_id')
      .eq('organization_id', orgId)
      .eq('is_active', true),
  ]);

  const company = companyRes.data as CompanyRow | null;
  const jobPostings = (jobPostingsRes.data ?? []) as JobPostingRow[];
  const rightsNotifications = (rightsNotificationsRes.data ?? []) as RightsNotificationRow[];
  const pendingInfoRequests = (infoRequestsRes.data ?? []) as InfoRequestRow[];
  const payGapSnapshots = (payGapSnapshotsRes.data ?? []) as PayGapSnapshotRow[];
  const jointAssessments = (jointAssessmentsRes.data ?? []) as JointAssessmentRow[];
  const employees = (employeesRes.data ?? []) as EmployeeRow[];

  // ---- Art. 5 — Stellenausschreibungen ----------------------------------------

  const publishedPostings = jobPostings.filter((p) => p.status === 'published');
  const undisclosedPostings = publishedPostings.filter((p) => p.salary_disclosed === false);

  let art5Status: ComplianceObligation['status'];
  let art5Action: string | null = null;
  let art5Detail: string | null = null;

  if (publishedPostings.length === 0) {
    art5Status = 'pass';
    art5Detail = 'Keine aktiven Stellenausschreibungen vorhanden.';
  } else if (undisclosedPostings.length > 0) {
    art5Status = 'fail';
    art5Action = `${undisclosedPostings.length} Stellenausschreibung(en) enthalten keine Gehaltsangabe. Bitte sofort ergänzen.`;
    art5Detail = `${undisclosedPostings.length} von ${publishedPostings.length} veröffentlichten Ausschreibungen fehlt die Gehaltsangabe.`;
  } else {
    art5Status = 'warn';
    art5Action = 'Bitte prüfen Sie, ob alle Gehaltsangaben den gesetzlichen Anforderungen entsprechen.';
    art5Detail = `${publishedPostings.length} aktive Ausschreibung(en) – Gehaltsangaben vorhanden, aber Konformität prüfen.`;
  }

  const art5: ComplianceObligation = {
    id: 'art5-stellenausschreibungen',
    article: 'Art. 5',
    title: 'Stellenausschreibungen',
    description: 'Gehaltsangaben in Stellenausschreibungen offenlegen',
    status: art5Status,
    deadline: '2026-06-07',
    actionRequired: art5Action,
    detail: art5Detail,
  };

  // ---- Art. 7 — Mitarbeiterinformation ----------------------------------------

  const thisYearNotification = rightsNotifications.find(
    (n) => n.notification_year === currentYear,
  );
  const hasAnyNotification = rightsNotifications.length > 0;

  let art7InfoStatus: ComplianceObligation['status'];
  let art7InfoAction: string | null = null;
  let art7InfoDetail: string | null = null;

  if (thisYearNotification) {
    art7InfoStatus = 'pass';
    art7InfoDetail = `Informationspflicht für ${currentYear} erfüllt am ${new Date(thisYearNotification.sent_at).toLocaleDateString('de-DE')}.`;
  } else if (hasAnyNotification) {
    art7InfoStatus = 'warn';
    art7InfoAction = `Jährliche Mitarbeiterinformation für ${currentYear} noch nicht versendet.`;
    const lastYear = rightsNotifications[0].notification_year;
    art7InfoDetail = `Letzte Benachrichtigung war für das Jahr ${lastYear}.`;
  } else {
    art7InfoStatus = 'fail';
    art7InfoAction = 'Mitarbeiterinformation über Auskunftsrechte wurde noch nie versendet. Sofort nachholen!';
    art7InfoDetail = 'Keine Benachrichtigungen in der Datenbank gefunden.';
  }

  const art7Info: ComplianceObligation = {
    id: 'art7-mitarbeiterinformation',
    article: 'Art. 7',
    title: 'Mitarbeiterinformation',
    description: 'Jährliche Information der Mitarbeiter über Auskunftsrechte',
    status: art7InfoStatus,
    deadline: `${currentYear}-12-31`,
    actionRequired: art7InfoAction,
    detail: art7InfoDetail,
  };

  // ---- Art. 7 — Auskunftsanfragen (SLA) ---------------------------------------

  const overdueRequests = pendingInfoRequests.filter(
    (r) => daysSince(r.created_at) > 60,
  );
  const warningRequests = pendingInfoRequests.filter(
    (r) => daysSince(r.created_at) >= 45 && daysSince(r.created_at) <= 60,
  );

  let art7SlaStatus: ComplianceObligation['status'];
  let art7SlaAction: string | null = null;
  let art7SlaDetail: string | null = null;

  if (overdueRequests.length > 0) {
    art7SlaStatus = 'fail';
    art7SlaAction = `${overdueRequests.length} Auskunftsanfrage(n) sind überfällig (>60 Tage). Sofortige Bearbeitung erforderlich!`;
    art7SlaDetail = `${pendingInfoRequests.length} offene Anfragen insgesamt, davon ${overdueRequests.length} überfällig.`;
  } else if (warningRequests.length > 0) {
    art7SlaStatus = 'warn';
    art7SlaAction = `${warningRequests.length} Anfrage(n) nähern sich der 60-Tage-Frist. Bitte priorisieren.`;
    art7SlaDetail = `${warningRequests.length} Anfrage(n) sind zwischen 45 und 60 Tage alt.`;
  } else {
    art7SlaStatus = 'pass';
    art7SlaDetail =
      pendingInfoRequests.length === 0
        ? 'Keine offenen Auskunftsanfragen.'
        : `${pendingInfoRequests.length} offene Anfrage(n), alle innerhalb der SLA-Frist.`;
  }

  const art7Sla: ComplianceObligation = {
    id: 'art7-auskunftsanfragen',
    article: 'Art. 7',
    title: 'Auskunftsanfragen (SLA)',
    description: 'Auskunftsanfragen innerhalb von 60 Tagen beantworten',
    status: art7SlaStatus,
    deadline: null,
    actionRequired: art7SlaAction,
    detail: art7SlaDetail,
  };

  // ---- Art. 9 — Pay Gap Report ------------------------------------------------

  const latestSnapshot = payGapSnapshots[0] ?? null;
  const recentSnapshot = payGapSnapshots.find(
    (s) => s.snapshot_date >= twelveMonthsAgo,
  ) ?? null;

  const sizeBand = company?.employee_size_band ?? null;
  let art9Deadline: string | null = null;
  if (sizeBand === '251+') {
    art9Deadline = '2027-06-01';
  } else if (sizeBand === '51-250') {
    art9Deadline = '2031-06-01';
  }

  let art9Status: ComplianceObligation['status'];
  let art9Action: string | null = null;
  let art9Detail: string | null = null;

  if (!latestSnapshot) {
    art9Status = 'fail';
    art9Action = 'Noch keine Pay-Gap-Analyse vorhanden. Führen Sie jetzt eine Analyse durch.';
    art9Detail = 'Kein Entgeltgefälle-Snapshot in der Datenbank.';
  } else if (latestSnapshot.gap_status === 'breach') {
    art9Status = 'fail';
    art9Action = 'Entgeltgefälle überschreitet den zulässigen Schwellenwert. Sofortmaßnahmen einleiten.';
    art9Detail = `Letzter Snapshot: ${new Date(latestSnapshot.snapshot_date).toLocaleDateString('de-DE')} – Status: Verstoß.`;
  } else if (latestSnapshot.gap_status === 'warning' || !recentSnapshot) {
    art9Status = 'warn';
    art9Action = !recentSnapshot
      ? 'Letzter Snapshot ist älter als 12 Monate. Bitte aktualisieren.'
      : 'Entgeltgefälle nähert sich dem Schwellenwert. Ursachenanalyse empfohlen.';
    art9Detail = `Letzter Snapshot: ${new Date(latestSnapshot.snapshot_date).toLocaleDateString('de-DE')}.`;
  } else {
    art9Status = 'pass';
    art9Detail = `Entgeltgefälle im zulässigen Bereich. Letzter Snapshot: ${new Date(latestSnapshot.snapshot_date).toLocaleDateString('de-DE')}.`;
  }

  const art9: ComplianceObligation = {
    id: 'art9-pay-gap-report',
    article: 'Art. 9',
    title: 'Entgeltgefälle-Bericht',
    description: 'Regelmäßige Berichterstattung über den Gender Pay Gap',
    status: art9Status,
    deadline: art9Deadline,
    actionRequired: art9Action,
    detail: art9Detail,
  };

  // ---- Art. 10 — Gemeinsame Bewertung -----------------------------------------

  const requiresAssessmentSnapshots = payGapSnapshots.filter(
    (s) => s.requires_joint_assessment,
  );

  const activeAssessmentStatuses: ReadonlyArray<string> = ['initiated', 'justifying', 'reviewing'];

  const activeAssessments = jointAssessments.filter((a) =>
    activeAssessmentStatuses.includes(a.status),
  );

  const overdueAssessments = activeAssessments.filter(
    (a) => daysSince(a.created_at) > 60,
  );
  const recentAssessments = activeAssessments.filter(
    (a) => daysSince(a.created_at) <= 30,
  );

  let art10Status: ComplianceObligation['status'];
  let art10Action: string | null = null;
  let art10Detail: string | null = null;

  if (requiresAssessmentSnapshots.length === 0 && activeAssessments.length === 0) {
    art10Status = 'pass';
    art10Detail = 'Keine gemeinsame Bewertung erforderlich.';
  } else if (overdueAssessments.length > 0) {
    art10Status = 'fail';
    art10Action = `${overdueAssessments.length} gemeinsame Bewertung(en) sind seit über 60 Tagen offen. Sofortige Eskalation erforderlich.`;
    art10Detail = `${overdueAssessments.length} überfällige Bewertung(en) ohne Abschluss.`;
  } else if (requiresAssessmentSnapshots.length > 0 && activeAssessments.length === 0) {
    art10Status = 'fail';
    art10Action = 'Entgeltgefälle erfordert eine gemeinsame Bewertung – bitte umgehend einleiten.';
    art10Detail = `${requiresAssessmentSnapshots.length} Snapshot(s) erfordern eine gemeinsame Bewertung.`;
  } else if (recentAssessments.length > 0) {
    art10Status = 'warn';
    art10Action = 'Gemeinsame Bewertung läuft. Fortschritt überwachen und Fristen einhalten.';
    art10Detail = `${recentAssessments.length} laufende Bewertung(en) (< 30 Tage).`;
  } else {
    art10Status = 'warn';
    art10Action = 'Gemeinsame Bewertung läuft. Auf Abschluss hinwirken.';
    art10Detail = `${activeAssessments.length} aktive Bewertung(en).`;
  }

  const art10: ComplianceObligation = {
    id: 'art10-gemeinsame-bewertung',
    article: 'Art. 10',
    title: 'Gemeinsame Bewertung',
    description: 'Gemeinsame Bewertung bei erheblichem Entgeltgefälle',
    status: art10Status,
    deadline: null,
    actionRequired: art10Action,
    detail: art10Detail,
  };

  // ---- Data Completeness (internal) -------------------------------------------

  const totalEmployees = employees.length;
  const incompleteEmployees = employees.filter(
    (e) => !e.job_profile_id || !e.pay_band_id,
  ).length;

  let dataStatus: ComplianceObligation['status'];
  let dataAction: string | null = null;
  let dataDetail: string | null = null;

  if (totalEmployees === 0) {
    dataStatus = 'na';
    dataDetail = 'Keine aktiven Mitarbeiter in der Datenbank.';
  } else {
    const incompleteRatio = incompleteEmployees / totalEmployees;
    if (incompleteRatio === 0) {
      dataStatus = 'pass';
      dataDetail = `Alle ${totalEmployees} Mitarbeiter sind vollständig erfasst.`;
    } else if (incompleteRatio < 0.1) {
      dataStatus = 'warn';
      dataAction = `${incompleteEmployees} Mitarbeiter ohne vollständige Jobprofil- oder Gehaltsbandzuweisung. Bitte ergänzen.`;
      dataDetail = `${incompleteEmployees} von ${totalEmployees} Mitarbeitern unvollständig (${Math.round(incompleteRatio * 100)} %).`;
    } else {
      dataStatus = 'fail';
      dataAction = `${incompleteEmployees} Mitarbeiter ohne Jobprofil oder Gehaltsband – Analysequalität stark beeinträchtigt.`;
      dataDetail = `${incompleteEmployees} von ${totalEmployees} Mitarbeitern unvollständig (${Math.round(incompleteRatio * 100)} %).`;
    }
  }

  const dataCompleteness: ComplianceObligation = {
    id: 'data-completeness',
    article: 'Intern',
    title: 'Datenvollständigkeit',
    description: 'Mitarbeiterdaten vollständig und analysierbar',
    status: dataStatus,
    deadline: null,
    actionRequired: dataAction,
    detail: dataDetail,
  };

  // ---- Assemble result --------------------------------------------------------

  const obligations: ComplianceObligation[] = [
    art5,
    art7Info,
    art7Sla,
    art9,
    art10,
    dataCompleteness,
  ];

  const scorableObligations = obligations.filter((o) => o.status !== 'na');
  const passingCount = scorableObligations.filter((o) => o.status === 'pass').length;
  const warningCount = scorableObligations.filter((o) => o.status === 'warn').length;
  const failingCount = scorableObligations.filter((o) => o.status === 'fail').length;

  return {
    score: computeScore(obligations),
    obligations,
    totalObligations: scorableObligations.length,
    passingCount,
    warningCount,
    failingCount,
    lastChecked: new Date().toISOString(),
  };
}

// ---- Hook -------------------------------------------------------------------

export function useComplianceStatus(): {
  data: ComplianceStatusData | null;
  isLoading: boolean;
  refetch: () => void;
} {
  const { orgId, supabase, isSignedIn } = useAuth();

  const { data, isLoading, refetch } = useQuery<ComplianceStatusData>({
    queryKey: ['compliance-status', orgId],
    queryFn: () => {
      if (!orgId) throw new Error('Keine aktive Organisation');
      return fetchComplianceData(orgId, supabase);
    },
    enabled: isSignedIn && !!orgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  return {
    data: data ?? null,
    isLoading,
    refetch,
  };
}
