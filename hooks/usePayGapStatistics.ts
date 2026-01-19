import { useState, useCallback } from 'react';
import { createClientWithToken } from '@/utils/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@clerk/nextjs';

// Typen für aggregierte Statistiken
export interface SalaryStatistic {
  statistic_type: string;
  value: number | null;
  group_size: number;
  is_suppressed: boolean;
  suppression_reason: string | null;
}

export interface GenderPayGap {
  category: string;
  male_median: number | null;
  female_median: number | null;
  gap_percent: number | null;
  male_count: number | null;
  female_count: number | null;
  is_reportable: boolean;
  suppression_reason: string | null;
}

export interface DeviationAnalysis {
  job_profile_id: string;
  job_profile_title: string;
  job_level_id: string;
  job_level_name: string;
  deviation_type: string;
  deviation_percent: number | null;
  affected_count: number;
  is_critical: boolean;
  recommendation: string;
}

export interface DepartmentStatistic {
  department: string;
  total_employees: number;
  gender_distribution: {
    male: number;
    female: number;
    other: number;
  } | null;
  avg_tenure_years: number | null;
  is_suppressed: boolean;
}

export interface PayEquityReport {
  generated_at: string;
  company_id: string;
  anonymization_threshold: number;
  overall_gap: {
    male_median: number | null;
    female_median: number | null;
    gap_percent: number | null;
    male_count: number | null;
    female_count: number | null;
    is_reportable: boolean;
  };
  by_department: Array<{
    department: string;
    male_median: number | null;
    female_median: number | null;
    gap_percent: number | null;
    is_reportable: boolean;
    reason: string | null;
  }>;
  by_level: Array<{
    level: string;
    level_id: string;
    gap_data: GenderPayGap | null;
  }>;
  critical_warnings: Array<{
    profile: string;
    level: string;
    deviation: number;
    recommendation: string;
  }>;
  eu_compliance_note: string;
}

export function usePayGapStatistics() {
  const { user } = useAuth();
  const { session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const getSupabase = async () => {
    let token = null;
    try {
      token = await session?.getToken({ template: 'supabase' });
    } catch (e) {
      console.error('Clerk Supabase Token Error:', e);
    }
    return createClientWithToken(token || null);
  };

  // Sichere Gehaltsstatistiken abrufen
  const getSalaryStatistics = useCallback(async (
    jobProfileId: string,
    jobLevelId?: string
  ): Promise<SalaryStatistic[]> => {
    if (!user) return [];

    setLoading(true);
    const supabase = await getSupabase();
    try {
      const { data, error } = await supabase
        .rpc('get_safe_salary_statistics', {
          _job_profile_id: jobProfileId,
          _job_level_id: jobLevelId || null
        });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Statistiken konnten nicht geladen werden',
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, toast, session]);

  // Gender Pay Gap berechnen
  const calculateGenderPayGap = useCallback(async (
    jobProfileId?: string,
    jobLevelId?: string,
    department?: string
  ): Promise<GenderPayGap[]> => {
    if (!user) return [];

    setLoading(true);
    const supabase = await getSupabase();
    try {
      const { data, error } = await supabase
        .rpc('calculate_gender_pay_gap', {
          _job_profile_id: jobProfileId || null,
          _job_level_id: jobLevelId || null,
          _department: department || null
        });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Pay Gap konnte nicht berechnet werden',
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, toast, session]);

  // Abweichungsanalyse
  const analyzeDeviations = useCallback(async (
    thresholdPercent: number = 20
  ): Promise<DeviationAnalysis[]> => {
    if (!user) return [];

    setLoading(true);
    const supabase = await getSupabase();
    try {
      const { data, error } = await supabase
        .rpc('analyze_salary_deviations', {
          _threshold_percent: thresholdPercent
        });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Abweichungsanalyse fehlgeschlagen',
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, toast, session]);

  // Abteilungsstatistiken
  const getDepartmentStatistics = useCallback(async (): Promise<DepartmentStatistic[]> => {
    if (!user) return [];

    setLoading(true);
    const supabase = await getSupabase();
    try {
      const { data, error } = await supabase
        .rpc('get_department_statistics');

      if (error) throw error;

      // Typ-Transformation für JSONB-Felder
      return (data || []).map((item: any) => ({
        department: item.department,
        total_employees: item.total_employees,
        gender_distribution: item.gender_distribution as DepartmentStatistic['gender_distribution'],
        avg_tenure_years: item.avg_tenure_years,
        is_suppressed: item.is_suppressed
      }));
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Abteilungsstatistiken konnten nicht geladen werden',
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, toast, session]);

  // Vollständiger Pay Equity Report
  const generatePayEquityReport = useCallback(async (): Promise<PayEquityReport | null> => {
    if (!user) return null;

    setLoading(true);
    const supabase = await getSupabase();
    try {
      const { data, error } = await supabase
        .rpc('generate_pay_equity_report');

      if (error) throw error;

      toast({
        title: 'Report generiert',
        description: 'Der Pay Equity Report wurde erfolgreich erstellt',
      });

      return data as unknown as PayEquityReport;
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Report konnte nicht erstellt werden',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast, session]);

  return {
    loading,
    getSalaryStatistics,
    calculateGenderPayGap,
    analyzeDeviations,
    getDepartmentStatistics,
    generatePayEquityReport
  };
}
