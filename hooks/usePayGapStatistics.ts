import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface GenderPayGap {
  scope: string;
  scope_label: string | null;
  male_mean: number | null;
  female_mean: number | null;
  male_median: number | null;
  female_median: number | null;
  mean_gap_pct: number | null;
  median_gap_pct: number | null;
  male_count: number;
  female_count: number;
  gap_status: string | null;
  is_suppressed: boolean;
}

export interface DepartmentStatistic {
  department_id: string;
  department_name: string;
  total_employees: number;
  male_count: number;
  female_count: number;
  diverse_count: number;
  is_suppressed: boolean;
}

const MIN_GROUP_SIZE = 5;

export function usePayGapStatistics() {
  const { user, orgId, isLoaded, supabase } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Gender Pay Gap from snapshots
  const calculateGenderPayGap = useCallback(async (
    scope?: string,
    scopeId?: string,
  ): Promise<GenderPayGap[]> => {
    if (!isLoaded || !user || !orgId) return [];

    setLoading(true);
    try {
      let query = supabase
        .from('pay_gap_snapshots')
        .select('*')
        .eq('organization_id', orgId)
        .order('snapshot_date', { ascending: false });

      if (scope) query = query.eq('scope', scope);
      if (scopeId) query = query.eq('scope_id', scopeId);

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((s): GenderPayGap => ({
        scope: s.scope,
        scope_label: s.scope_label,
        male_mean: s.male_mean_base,
        female_mean: s.female_mean_base,
        male_median: s.male_median_base,
        female_median: s.female_median_base,
        mean_gap_pct: s.mean_gap_base_pct,
        median_gap_pct: s.median_gap_base_pct,
        male_count: s.male_count,
        female_count: s.female_count,
        gap_status: s.gap_status,
        is_suppressed: s.is_suppressed,
      }));
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Pay Gap konnte nicht berechnet werden';
      toast({ title: 'Fehler', description: msg, variant: 'destructive' });
      return [];
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, orgId, toast, supabase]);

  // Department statistics from employees table
  const getDepartmentStatistics = useCallback(async (): Promise<DepartmentStatistic[]> => {
    if (!isLoaded || !user || !orgId) return [];

    setLoading(true);
    try {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('department_id, gender')
        .eq('organization_id', orgId)
        .eq('is_active', true);

      if (error) throw error;

      const { data: departments } = await supabase
        .from('departments')
        .select('id, name')
        .eq('organization_id', orgId);

      const deptMap = new Map((departments || []).map(d => [d.id, d.name]));

      // Group by department
      const grouped: Record<string, { male: number; female: number; diverse: number; total: number }> = {};
      for (const emp of (employees || [])) {
        const deptId = emp.department_id || 'unassigned';
        if (!grouped[deptId]) grouped[deptId] = { male: 0, female: 0, diverse: 0, total: 0 };
        grouped[deptId].total++;
        if (emp.gender === 'male') grouped[deptId].male++;
        else if (emp.gender === 'female') grouped[deptId].female++;
        else grouped[deptId].diverse++;
      }

      return Object.entries(grouped).map(([deptId, counts]): DepartmentStatistic => ({
        department_id: deptId,
        department_name: deptMap.get(deptId) || 'Nicht zugeordnet',
        total_employees: counts.total,
        male_count: counts.male,
        female_count: counts.female,
        diverse_count: counts.diverse,
        is_suppressed: counts.total < MIN_GROUP_SIZE,
      }));
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Abteilungsstatistiken konnten nicht geladen werden';
      toast({ title: 'Fehler', description: msg, variant: 'destructive' });
      return [];
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, orgId, toast, supabase]);

  return {
    loading,
    calculateGenderPayGap,
    getDepartmentStatistics,
  };
}
