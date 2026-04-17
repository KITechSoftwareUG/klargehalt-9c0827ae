/**
 * Salary Justification types for EU Pay Transparency Art. 16 compliance.
 * Structured justification of why an employee is positioned at a specific
 * point within their pay band.
 */

export type SalaryFactorType =
  | 'experience'
  | 'education'
  | 'performance'
  | 'market_rate'
  | 'seniority'
  | 'other';

export interface SalaryFactor {
  type: SalaryFactorType;
  score: number;  // 1-5
  weight: number; // 0.0-1.0
  note: string;
}

export interface SalaryJustification {
  factors: SalaryFactor[];
  summary: string;
  last_reviewed_at?: string;
  reviewed_by?: string;
}

/** German labels for factor types */
export const SALARY_FACTOR_LABELS: Record<SalaryFactorType, string> = {
  experience: 'Erfahrung',
  education: 'Ausbildung',
  performance: 'Leistung',
  market_rate: 'Marktrate',
  seniority: 'Betriebszugehoerigkeit',
  other: 'Sonstiges',
};

/** German display labels (with special characters) for UI rendering */
export const SALARY_FACTOR_DISPLAY_LABELS: Record<SalaryFactorType, string> = {
  experience: 'Erfahrung',
  education: 'Ausbildung',
  performance: 'Leistung',
  market_rate: 'Marktrate',
  seniority: 'Betriebszugehörigkeit',
  other: 'Sonstiges',
};

/** Score labels for display */
export const SALARY_SCORE_LABELS: Record<number, string> = {
  1: 'Gering',
  2: 'Unterdurchschnittlich',
  3: 'Durchschnittlich',
  4: 'Überdurchschnittlich',
  5: 'Herausragend',
};

/** Helper to create an empty justification */
export function createEmptyJustification(): SalaryJustification {
  return {
    factors: [],
    summary: '',
  };
}

/** Helper to create a default factor */
export function createDefaultFactor(): SalaryFactor {
  return {
    type: 'experience',
    score: 3,
    weight: 0.2,
    note: '',
  };
}

/** Check if a justification has meaningful content */
export function hasJustification(justification: SalaryJustification | null | undefined | Record<string, never>): boolean {
  if (!justification) return false;
  if (!('factors' in justification)) return false;
  return Array.isArray(justification.factors) && justification.factors.length > 0;
}

/** Calculate weighted total score (0-5 scale) */
export function calculateWeightedScore(factors: SalaryFactor[]): number {
  if (factors.length === 0) return 0;
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  if (totalWeight === 0) return 0;
  const weightedSum = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  return weightedSum / totalWeight;
}
