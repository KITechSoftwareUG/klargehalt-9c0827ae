// ============================================================================
// TYPES: Compliance Workflow
//
// Type definitions for the state-machine-driven compliance assessment
// workflow (EU Pay-Transparency Directive 2023/970).
// ============================================================================

// ─── Enums / Literal Unions ──────────────────────────────────────────────────

export type ComplianceAssessmentStatus =
  | 'DRAFT'
  | 'ANALYZED'
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'RESUBMITTED'
  | 'VALIDATED'
  | 'CERTIFIED_SNAPSHOT'
  | 'EXPIRED';

export type CommentSeverity = 'INFO' | 'WARNING' | 'BLOCKER';

export type ActorRole = 'admin' | 'hr_manager' | 'lawyer' | 'system';

// ─── Core Entities ───────────────────────────────────────────────────────────

export interface ComplianceAssessment {
  id: string;
  organization_id: string;
  created_at: string;
  period_from: string;        // ISO date string (DATE column)
  period_to: string;          // ISO date string (DATE column)
  status: ComplianceAssessmentStatus;
  risk_score: number | null;  // 0–100
  gap_flags: GapFlags | null;
  initiated_by: string | null;
  lawyer_id: string | null;
  expires_at: string | null;
  title: string | null;
}

export interface AssessmentTransition {
  id: string;
  assessment_id: string;
  from_status: ComplianceAssessmentStatus;
  to_status: ComplianceAssessmentStatus;
  actor_id: string | null;
  actor_role: ActorRole;
  note: string | null;
  created_at: string;
}

export interface LegalReviewComment {
  id: string;
  assessment_id: string;
  organization_id: string;
  lawyer_id: string;
  section: CommentSection;
  severity: CommentSeverity;
  comment_text: string;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export interface CertifiedSnapshot {
  id: string;
  assessment_id: string;
  organization_id: string;
  lawyer_id: string;
  certified_at: string;
  valid_until: string;
  snapshot_data: SnapshotData;
  lawyer_statement: string;
  pdf_url: string | null;
}

// ─── Supporting Shapes ───────────────────────────────────────────────────────

/** Section keys a lawyer may comment on */
export type CommentSection =
  | 'pay_bands'
  | 'gap_analysis'
  | 'job_profiles'
  | 'salary_decisions'
  | 'general';

/** Structured risk flags stored in compliance_assessments.gap_flags */
export interface GapFlags {
  gender_gap_exceeded: boolean;     // >5% gap detected
  missing_justifications: number;   // count of undocumented salary events
  bands_out_of_range: number;       // employees outside their pay band
  high_risk_departments: string[];  // department IDs with elevated risk
}

/** Point-in-time data snapshot stored in certified_snapshots.snapshot_data */
export interface SnapshotData {
  employees_count: number;
  pay_bands: unknown[];
  job_profiles: unknown[];
  gap_report: unknown;
  salary_decisions_count: number;
  snapshot_taken_at: string;
}

// ─── Input Types ─────────────────────────────────────────────────────────────

export interface CreateAssessmentInput {
  title: string;
  period_from: string;    // ISO date string
  period_to: string;      // ISO date string
  lawyer_id?: string;
}

export interface TransitionAssessmentInput {
  to: ComplianceAssessmentStatus;
  note?: string;
}

export interface CreateCommentInput {
  section: CommentSection;
  severity: CommentSeverity;
  comment_text: string;
}

export interface CertifyAssessmentInput {
  lawyer_statement: string;
  valid_months?: number;   // defaults to 12
}

// ─── Aggregated Detail View ──────────────────────────────────────────────────

export interface AssessmentDetail extends ComplianceAssessment {
  transitions: AssessmentTransition[];
  comments: LegalReviewComment[];
  snapshot: CertifiedSnapshot | null;
}

// ─── Status Labels & Colors (German UI) ─────────────────────────────────────

export const STATUS_LABELS: Record<ComplianceAssessmentStatus, string> = {
  DRAFT:               'Entwurf',
  ANALYZED:            'Analysiert',
  PENDING_REVIEW:      'Wartet auf Anwalt',
  UNDER_REVIEW:        'In Prüfung',
  CHANGES_REQUESTED:   'Korrekturen erforderlich',
  RESUBMITTED:         'Erneut eingereicht',
  VALIDATED:           'Freigegeben',
  CERTIFIED_SNAPSHOT:  'Zertifiziert',
  EXPIRED:             'Abgelaufen',
};

/** Tailwind badge classes per status */
export const STATUS_COLORS: Record<ComplianceAssessmentStatus, string> = {
  DRAFT:               'bg-slate-100 text-slate-700 border-slate-200',
  ANALYZED:            'bg-blue-100 text-blue-700 border-blue-200',
  PENDING_REVIEW:      'bg-amber-100 text-amber-700 border-amber-200',
  UNDER_REVIEW:        'bg-orange-100 text-orange-700 border-orange-200',
  CHANGES_REQUESTED:   'bg-red-100 text-red-700 border-red-200',
  RESUBMITTED:         'bg-purple-100 text-purple-700 border-purple-200',
  VALIDATED:           'bg-emerald-100 text-emerald-700 border-emerald-200',
  CERTIFIED_SNAPSHOT:  'bg-green-100 text-green-800 border-green-200',
  EXPIRED:             'bg-gray-100 text-gray-500 border-gray-200',
};

// ─── Comment Severity Labels & Colors ────────────────────────────────────────

export const SEVERITY_LABELS: Record<CommentSeverity, string> = {
  INFO:    'Hinweis',
  WARNING: 'Warnung',
  BLOCKER: 'Blockierend',
};

/** Tailwind badge classes per severity */
export const SEVERITY_COLORS: Record<CommentSeverity, string> = {
  INFO:    'bg-blue-50 text-blue-700 border-blue-200',
  WARNING: 'bg-amber-50 text-amber-700 border-amber-200',
  BLOCKER: 'bg-red-50 text-red-700 border-red-200',
};

// ─── State Machine: Valid Transitions ────────────────────────────────────────

/**
 * Defines all legal status transitions and which actor roles may trigger them.
 * Enforce this in both the API layer and UI to prevent invalid state changes.
 */
export const VALID_TRANSITIONS: Record<
  ComplianceAssessmentStatus,
  ReadonlyArray<{
    readonly to: ComplianceAssessmentStatus;
    readonly allowedRoles: ReadonlyArray<ActorRole>;
    readonly label: string;
  }>
> = {
  DRAFT: [
    {
      to: 'ANALYZED',
      allowedRoles: ['admin', 'hr_manager'],
      label: 'Analyse starten',
    },
  ],

  ANALYZED: [
    {
      to: 'PENDING_REVIEW',
      allowedRoles: ['admin', 'hr_manager'],
      label: 'Zur Anwaltsprüfung einreichen',
    },
  ],

  PENDING_REVIEW: [
    {
      to: 'UNDER_REVIEW',
      allowedRoles: ['lawyer'],
      label: 'Prüfung annehmen',
    },
  ],

  UNDER_REVIEW: [
    {
      to: 'CHANGES_REQUESTED',
      allowedRoles: ['lawyer'],
      label: 'Korrekturen anfordern',
    },
    {
      to: 'VALIDATED',
      allowedRoles: ['lawyer'],
      label: 'Prüfung freigeben',
    },
  ],

  CHANGES_REQUESTED: [
    {
      to: 'RESUBMITTED',
      allowedRoles: ['admin', 'hr_manager'],
      label: 'Erneut einreichen',
    },
  ],

  RESUBMITTED: [
    {
      to: 'UNDER_REVIEW',
      allowedRoles: ['lawyer'],
      label: 'Erneute Prüfung annehmen',
    },
  ],

  VALIDATED: [
    {
      to: 'CERTIFIED_SNAPSHOT',
      allowedRoles: ['system'],
      label: 'Snapshot zertifizieren',
    },
  ],

  CERTIFIED_SNAPSHOT: [
    {
      to: 'EXPIRED',
      allowedRoles: ['system'],
      label: 'Als abgelaufen markieren',
    },
  ],

  // Terminal state — no outgoing transitions
  EXPIRED: [],
} as const;
