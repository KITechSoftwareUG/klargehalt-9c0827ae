/**
 * Pay Equity Analysis Types
 * Typen für Vergleichsgruppen-Logik und Gender-Gap-Analysen
 */

// ============================================================================
// DATABASE TYPES
// ============================================================================

export interface PayGroup {
    id: string;
    company_id: string;
    job_family: string;
    job_level: string;
    location: string;
    employment_type: string;
    group_name: string;
    employee_count: number;
    male_count: number;
    female_count: number;
    other_count: number;
    created_at: string;
    updated_at: string;
}

export interface PayGroupStats {
    id: string;
    pay_group_id: string;
    company_id: string;

    // Gesamt-Statistiken
    avg_salary: number;
    median_salary: number;
    min_salary: number;
    max_salary: number;
    std_deviation: number;

    // Geschlechtsspezifische Statistiken
    avg_salary_male: number | null;
    avg_salary_female: number | null;
    avg_salary_other: number | null;

    median_salary_male: number | null;
    median_salary_female: number | null;
    median_salary_other: number | null;

    // Gender Gap
    gender_gap_percent: number | null;
    gender_gap_status: 'green' | 'yellow' | 'red' | 'unknown';

    calculation_date: string;
    created_at: string;
    updated_at: string;
}

export interface EmployeeComparison {
    id: string;
    employee_id: string;
    pay_group_id: string;
    company_id: string;

    // Vergleichsdaten
    employee_salary: number;
    group_avg_salary: number;
    group_median_salary: number;

    // Abweichungen
    deviation_from_avg_percent: number;
    deviation_from_median_percent: number;
    percentile_rank: number;

    // Kontext
    tenure_months: number;
    has_special_qualifications: boolean;

    // AI-Erklärung
    ai_explanation: string | null;
    explanation_generated_at: string | null;

    created_at: string;
    updated_at: string;
}

export interface GenderGapHistory {
    id: string;
    company_id: string;
    pay_group_id: string | null;

    gender_gap_percent: number;
    gap_status: 'green' | 'yellow' | 'red' | 'unknown';

    calculation_date: string;
    employee_count_male: number;
    employee_count_female: number;

    action_required: boolean;
    action_notes: string | null;

    created_at: string;
}

export interface SalarySimulation {
    id: string;
    company_id: string;
    pay_group_id: string | null;
    created_by: string | null;

    simulation_name: string;
    simulation_type: 'raise_to_median' | 'close_gap' | 'custom';

    current_gap_percent: number;
    simulated_gap_percent: number;
    estimated_annual_cost: number;
    affected_employees: number;

    simulation_details: Record<string, any>;

    created_at: string;
}

// ============================================================================
// EXTENDED TYPES (mit Relationen)
// ============================================================================

export interface PayGroupWithStats extends PayGroup {
    stats?: PayGroupStats;
}

export interface EmployeeComparisonWithGroup extends EmployeeComparison {
    pay_group?: PayGroup;
    employee_name?: string;
    employee_email?: string;
}

// ============================================================================
// UI/DISPLAY TYPES
// ============================================================================

export interface PayGroupTableRow {
    id: string;
    group_name: string;
    employee_count: number;
    avg_salary: number;
    median_salary: number;
    gender_gap_percent: number | null;
    gap_status: 'green' | 'yellow' | 'red' | 'unknown';
    male_count: number;
    female_count: number;
}

export interface ManagementKPIs {
    critical_groups_count: number; // Gap > 5%
    largest_gap_percent: number;
    largest_gap_group: string;
    estimated_closing_cost: number;
    total_groups: number;
    total_employees: number;
}

export interface EmployeeSalaryComparison {
    employee_salary: number;
    group_median: number;
    group_average: number;
    group_min: number;
    group_max: number;
    deviation_from_avg: number; // in %
    percentile: number;
    group_size: number;
    ai_explanation: string;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface HRDashboardFilters {
    job_family?: string;
    job_level?: string;
    location?: string;
    gender_gap_status?: 'green' | 'yellow' | 'red' | 'all';
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface UpdateStatsRequest {
    company_id: string;
}

export interface UpdateStatsResponse {
    success: boolean;
    groups_updated: number;
    error?: string;
}

export interface GenerateExplanationRequest {
    employee_id: string;
    comparison_id: string;
}

export interface GenerateExplanationResponse {
    success: boolean;
    explanation: string;
    error?: string;
}

export interface SimulationRequest {
    company_id: string;
    pay_group_id?: string;
    simulation_type: 'raise_to_median' | 'close_gap' | 'custom';
    target_gap_percent?: number;
}

export interface SimulationResponse {
    success: boolean;
    simulation: SalarySimulation;
    breakdown: {
        employees_affected: Array<{
            employee_id: string;
            current_salary: number;
            proposed_salary: number;
            increase: number;
        }>;
    };
    error?: string;
}

// ============================================================================
// CHART DATA TYPES
// ============================================================================

export interface SalaryDistributionPoint {
    salary: number;
    count: number;
    gender: 'male' | 'female' | 'other';
}

export interface GenderGapTrendPoint {
    date: string;
    gap_percent: number;
    gap_status: 'green' | 'yellow' | 'red';
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const GAP_THRESHOLDS = {
    GREEN: 3,  // < 3%
    YELLOW: 5, // 3-5%
    RED: Infinity, // > 5%
} as const;

export const GAP_STATUS_COLORS = {
    green: '#22c55e',
    yellow: '#eab308',
    red: '#ef4444',
    unknown: '#94a3b8',
} as const;

export const GAP_STATUS_LABELS = {
    green: 'Unkritisch',
    yellow: 'Beobachten',
    red: 'Handlungsbedarf',
    unknown: 'Unbekannt',
} as const;
