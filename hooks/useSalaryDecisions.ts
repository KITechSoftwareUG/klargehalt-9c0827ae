import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface SalaryDecision {
  id: string;
  organization_id: string;
  employee_id: string;
  decision_type: 'hire' | 'raise' | 'promotion' | 'band_change' | 'correction';
  old_salary: number | null;
  new_salary: number;
  justification_text: string;
  justification_factors: JustificationFactor[];
  decided_by_user_id: string;
  decided_at: string;
  pay_band_id: string | null;
  comparator_data: ComparatorSnapshot;
  lawyer_review_id: string | null;
  created_at: string;
}

export interface JustificationFactor {
  type: 'experience' | 'education' | 'performance' | 'market_rate' | 'seniority' | 'other';
  weight: number;
  score: number;
  note?: string;
}

export interface ComparatorSnapshot {
  peer_count?: number;
  peer_mean_salary?: number;
  peer_median_salary?: number;
  band_min?: number;
  band_max?: number;
  band_mid?: number;
  job_profile_title?: string;
  job_level_name?: string;
  snapshot_date?: string;
}

export interface SalaryDecisionFormData {
  employee_id: string;
  decision_type: SalaryDecision['decision_type'];
  old_salary?: number | null;
  new_salary: number;
  justification_text: string;
  justification_factors?: JustificationFactor[];
  decided_at?: string;
  pay_band_id?: string | null;
  comparator_data?: ComparatorSnapshot;
  lawyer_review_id?: string | null;
}

export function useSalaryDecisions(employeeId?: string) {
  const [decisions, setDecisions] = useState<SalaryDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, orgId, isLoaded, supabase } = useAuth();

  const fetchDecisions = async () => {
    if (!isLoaded || !user || !orgId) {
      setDecisions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('salary_decisions')
        .select('*')
        .eq('organization_id', orgId)
        .order('decided_at', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDecisions((data || []) as SalaryDecision[]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error('Error fetching salary decisions:', error);
      toast.error(`Fehler beim Laden der Gehaltsentscheidungen: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const createDecision = async (formData: SalaryDecisionFormData): Promise<SalaryDecision | null> => {
    if (!user || !orgId) {
      toast.error('Keine Organisation zugeordnet');
      return null;
    }

    try {
      const response = await fetch('/api/salary-decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          justification_factors: formData.justification_factors ?? [],
          comparator_data: formData.comparator_data ?? {},
        }),
      });

      const result = await response.json() as { success?: boolean; data?: SalaryDecision; error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? `HTTP ${response.status}`);
      }

      toast.success('Gehaltsentscheidung dokumentiert');
      await fetchDecisions();
      return result.data ?? null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error('Error creating salary decision:', error);
      toast.error(`Fehler beim Dokumentieren der Entscheidung: ${message}`);
      return null;
    }
  };

  useEffect(() => {
    if (isLoaded && user && orgId) {
      fetchDecisions();
    }
  }, [isLoaded, user, orgId, employeeId]);

  return {
    decisions,
    loading,
    fetchDecisions,
    createDecision,
  };
}
