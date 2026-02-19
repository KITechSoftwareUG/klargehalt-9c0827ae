/**
 * Custom Hook: usePayEquity
 * Zentrale Logik für Pay-Equity-Analysen
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type {
    PayGroup,
    PayGroupStats,
    EmployeeComparison,
    ManagementKPIs,
    HRDashboardFilters,
} from '@/lib/types/pay-equity';

const supabase = createClient();

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hole alle PayGroups einer Firma
 */
export function usePayGroups(companyId: string, filters?: HRDashboardFilters) {
    return useQuery({
        queryKey: ['pay-groups', companyId, filters],
        queryFn: async () => {
            let query = supabase
                .from('pay_groups')
                .select(`
          *,
          stats:pay_group_stats(*)
        `)
                .eq('company_id', companyId)
                .order('employee_count', { ascending: false });

            // Filter anwenden
            if (filters?.job_family) {
                query = query.eq('job_family', filters.job_family);
            }
            if (filters?.job_level) {
                query = query.eq('job_level', filters.job_level);
            }
            if (filters?.location) {
                query = query.eq('location', filters.location);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Filter nach Gap-Status (client-side, da in stats-Tabelle)
            let filteredData = data;
            if (filters?.gender_gap_status && filters.gender_gap_status !== 'all') {
                filteredData = data.filter((group: any) =>
                    group.stats?.[0]?.gender_gap_status === filters.gender_gap_status
                );
            }

            return filteredData as (PayGroup & { stats: PayGroupStats[] })[];
        },
        enabled: !!companyId,
    });
}

/**
 * Hole Vergleichsdaten eines Mitarbeiters
 */
export function useEmployeeComparison(employeeId: string) {
    return useQuery({
        queryKey: ['employee-comparison', employeeId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('employee_comparisons')
                .select(`
          *,
          pay_group:pay_groups(*),
          employee:employees(first_name, last_name, current_salary)
        `)
                .eq('employee_id', employeeId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;
            return data as EmployeeComparison;
        },
        enabled: !!employeeId,
    });
}

/**
 * Hole Management-KPIs
 */
export function useManagementKPIs(companyId: string) {
    return useQuery({
        queryKey: ['management-kpis', companyId],
        queryFn: async () => {
            // Hole alle Gruppen mit Stats
            const { data: groups, error } = await supabase
                .from('pay_groups')
                .select(`
          *,
          stats:pay_group_stats(*)
        `)
                .eq('company_id', companyId);

            if (error) throw error;

            // Berechne KPIs
            const criticalGroups = groups.filter((g: any) =>
                g.stats?.[0]?.gender_gap_status === 'red'
            );

            const largestGap = groups.reduce((max: any, current: any) => {
                const currentGap = Math.abs(current.stats?.[0]?.gender_gap_percent || 0);
                const maxGap = Math.abs(max?.stats?.[0]?.gender_gap_percent || 0);
                return currentGap > maxGap ? current : max;
            }, groups[0]);

            const totalEmployees = groups.reduce(
                (sum: number, g: any) => sum + (g.employee_count || 0),
                0
            );

            // Schätze Kosten (vereinfacht)
            const estimatedCost = criticalGroups.reduce((sum: number, group: any) => {
                const stats = group.stats?.[0];
                if (!stats) return sum;

                const gapAmount = (stats.avg_salary_male || 0) - (stats.avg_salary_female || 0);
                const femaleCount = group.female_count || 0;
                return sum + (gapAmount * femaleCount);
            }, 0);

            return {
                critical_groups_count: criticalGroups.length,
                largest_gap_percent: Math.abs(largestGap?.stats?.[0]?.gender_gap_percent || 0),
                largest_gap_group: largestGap?.group_name || 'N/A',
                estimated_closing_cost: estimatedCost,
                total_groups: groups.length,
                total_employees: totalEmployees,
            } as ManagementKPIs;
        },
        enabled: !!companyId,
    });
}

/**
 * Hole Gender-Gap-Verlauf
 */
export function useGenderGapHistory(companyId: string, payGroupId?: string) {
    return useQuery({
        queryKey: ['gender-gap-history', companyId, payGroupId],
        queryFn: async () => {
            let query = supabase
                .from('gender_gap_history')
                .select('*')
                .eq('company_id', companyId)
                .order('calculation_date', { ascending: true })
                .limit(30);

            if (payGroupId) {
                query = query.eq('pay_group_id', payGroupId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        },
        enabled: !!companyId,
    });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Aktualisiere PayGroup-Statistiken
 */
export function useUpdatePayGroupStats() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (companyId: string) => {
            const response = await fetch('/api/pay-equity/update-stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company_id: companyId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update stats');
            }

            return response.json();
        },
        onSuccess: (_, companyId) => {
            // Invalidate alle relevanten Queries
            queryClient.invalidateQueries({ queryKey: ['pay-groups', companyId] });
            queryClient.invalidateQueries({ queryKey: ['management-kpis', companyId] });
        },
    });
}

/**
 * Generiere AI-Erklärung für Mitarbeiter
 */
export function useGenerateExplanation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (employeeId: string) => {
            const response = await fetch('/api/pay-equity/generate-explanation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee_id: employeeId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate explanation');
            }

            return response.json();
        },
        onSuccess: (_, employeeId) => {
            queryClient.invalidateQueries({ queryKey: ['employee-comparison', employeeId] });
        },
    });
}

/**
 * Führe Gehalts-Simulation durch
 */
export function useSalarySimulation() {
    return useMutation({
        mutationFn: async (params: {
            company_id: string;
            pay_group_id?: string;
            simulation_type: 'raise_to_median' | 'close_gap' | 'custom';
            target_gap_percent?: number;
        }) => {
            const response = await fetch('/api/pay-equity/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Simulation failed');
            }

            return response.json();
        },
    });
}
