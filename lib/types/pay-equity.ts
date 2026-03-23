/**
 * Pay Equity Analysis Types
 * Aligned to canonical schema: pay_gap_snapshots table
 */

// ============================================================================
// DATABASE TYPES (canonical schema)
// ============================================================================

export interface PayGapSnapshot {
  id: string;
  organization_id: string;
  snapshot_date: string;
  scope: 'company' | 'department' | 'job_profile' | 'job_level';
  scope_id: string | null;
  scope_label: string | null;
  // Unadjusted gap (EU Article 9)
  male_count: number;
  female_count: number;
  male_mean_base: number | null;
  female_mean_base: number | null;
  male_median_base: number | null;
  female_median_base: number | null;
  mean_gap_base_pct: number | null;
  median_gap_base_pct: number | null;
  // Variable pay gap
  male_mean_variable: number | null;
  female_mean_variable: number | null;
  mean_gap_variable_pct: number | null;
  pct_male_receiving_variable: number | null;
  pct_female_receiving_variable: number | null;
  // Quartile distribution
  q1_male_pct: number | null;
  q1_female_pct: number | null;
  q2_male_pct: number | null;
  q2_female_pct: number | null;
  q3_male_pct: number | null;
  q3_female_pct: number | null;
  q4_male_pct: number | null;
  q4_female_pct: number | null;
  // Compliance
  gap_status: 'compliant' | 'warning' | 'breach' | null;
  requires_joint_assessment: boolean;
  is_suppressed: boolean;
  created_at: string;
}

export interface ComplianceReport {
  id: string;
  organization_id: string;
  report_year: number;
  reporting_period: string | null;
  status: 'draft' | 'finalized' | 'submitted';
  snapshot_ids: string[];
  generated_by: string;
  finalized_at: string | null;
  submitted_at: string | null;
  report_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// UI/DISPLAY TYPES
// ============================================================================

export interface ManagementKPIs {
  total_employees: number;
  mean_gap_pct: number | null;
  median_gap_pct: number | null;
  breach_count: number;
  warning_count: number;
  compliant_count: number;
  requires_joint_assessment: boolean;
}

export interface GapTrendPoint {
  date: string;
  mean_gap_pct: number | null;
  median_gap_pct: number | null;
  gap_status: 'compliant' | 'warning' | 'breach' | null;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface PayEquityFilters {
  scope?: 'company' | 'department' | 'job_profile' | 'job_level';
  scope_id?: string;
  gap_status?: 'compliant' | 'warning' | 'breach' | 'all';
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const GAP_THRESHOLDS = {
  COMPLIANT: 5,   // < 5% = compliant
  WARNING: 10,    // 5-10% = warning (joint assessment required > 5%)
  BREACH: Infinity, // > 10% = breach
} as const;

export const GAP_STATUS_COLORS = {
  compliant: '#22c55e',
  warning: '#eab308',
  breach: '#ef4444',
  null: '#94a3b8',
} as const;

export const GAP_STATUS_LABELS = {
  compliant: 'Konform',
  warning: 'Gemeinsame Bewertung erforderlich',
  breach: 'Handlungsbedarf',
  null: 'Nicht berechnet',
} as const;
