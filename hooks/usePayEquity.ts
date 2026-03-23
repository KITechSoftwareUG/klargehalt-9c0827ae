/**
 * Custom Hook: usePayEquity
 * Pay-Equity-Analysen basierend auf pay_gap_snapshots (kanonisches Schema)
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import type {
  PayGapSnapshot,
  ManagementKPIs,
  GapTrendPoint,
  PayEquityFilters,
} from '@/lib/types/pay-equity';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hole alle Pay-Gap-Snapshots (latest per scope)
 */
export function usePayGapSnapshots(filters?: PayEquityFilters) {
  const { orgId, supabase, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['pay-gap-snapshots', orgId, filters],
    queryFn: async () => {
      let query = supabase
        .from('pay_gap_snapshots')
        .select('*')
        .eq('organization_id', orgId!)
        .order('snapshot_date', { ascending: false });

      if (filters?.scope && filters.scope !== 'company') {
        query = query.eq('scope', filters.scope);
      }
      if (filters?.scope_id) {
        query = query.eq('scope_id', filters.scope_id);
      }
      if (filters?.gap_status && filters.gap_status !== 'all') {
        query = query.eq('gap_status', filters.gap_status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PayGapSnapshot[];
    },
    enabled: !!orgId && isSignedIn,
  });
}

/**
 * Hole den neuesten Company-weiten Snapshot für KPI-Übersicht
 */
export function usePayGapOverview() {
  const { orgId, supabase, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['pay-gap-overview', orgId],
    queryFn: async () => {
      // Latest company-wide snapshot
      const { data: companySnapshot, error: companyErr } = await supabase
        .from('pay_gap_snapshots')
        .select('*')
        .eq('organization_id', orgId!)
        .eq('scope', 'company')
        .is('scope_id', null)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (companyErr) throw companyErr;

      // All latest snapshots for breakdown counts
      const { data: allSnapshots, error: allErr } = await supabase
        .from('pay_gap_snapshots')
        .select('gap_status, requires_joint_assessment, male_count, female_count')
        .eq('organization_id', orgId!)
        .order('snapshot_date', { ascending: false });

      if (allErr) throw allErr;

      const snapshots = allSnapshots || [];
      const totalEmployees = companySnapshot
        ? (companySnapshot.male_count || 0) + (companySnapshot.female_count || 0)
        : 0;

      const kpis: ManagementKPIs = {
        total_employees: totalEmployees,
        mean_gap_pct: companySnapshot?.mean_gap_base_pct ?? null,
        median_gap_pct: companySnapshot?.median_gap_base_pct ?? null,
        breach_count: snapshots.filter(s => s.gap_status === 'breach').length,
        warning_count: snapshots.filter(s => s.gap_status === 'warning').length,
        compliant_count: snapshots.filter(s => s.gap_status === 'compliant').length,
        requires_joint_assessment: snapshots.some(s => s.requires_joint_assessment),
      };

      return { snapshot: companySnapshot as PayGapSnapshot | null, kpis };
    },
    enabled: !!orgId && isSignedIn,
  });
}

/**
 * Hole Gap-Trend über Zeit (für Charts)
 */
export function usePayGapTrend(scope: string = 'company', scopeId?: string) {
  const { orgId, supabase, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['pay-gap-trend', orgId, scope, scopeId],
    queryFn: async () => {
      let query = supabase
        .from('pay_gap_snapshots')
        .select('snapshot_date, mean_gap_base_pct, median_gap_base_pct, gap_status')
        .eq('organization_id', orgId!)
        .eq('scope', scope)
        .order('snapshot_date', { ascending: true })
        .limit(30);

      if (scopeId) {
        query = query.eq('scope_id', scopeId);
      } else {
        query = query.is('scope_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row): GapTrendPoint => ({
        date: row.snapshot_date,
        mean_gap_pct: row.mean_gap_base_pct,
        median_gap_pct: row.median_gap_base_pct,
        gap_status: row.gap_status,
      }));
    },
    enabled: !!orgId && isSignedIn,
  });
}
