import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// TYPES
// ============================================================================

export type AssessmentStatus =
  | 'initiated'
  | 'justifying'
  | 'reviewing'
  | 'agreed'
  | 'remediating'
  | 'closed'
  | 'dispute';

export type FactorType =
  | 'experience'
  | 'education'
  | 'performance'
  | 'market_rate'
  | 'seniority'
  | 'working_conditions'
  | 'role_scarcity'
  | 'other';

export interface JustificationFactor {
  id: string;
  assessment_id: string;
  factor_type: FactorType;
  description: string;
  estimated_gap_impact_pct: number | null;
  evidence_notes: string | null;
  created_by: string;
  created_at: string;
}

export interface JointAssessment {
  id: string;
  organization_id: string;
  snapshot_id: string | null;
  scope: string;
  scope_id: string | null;
  scope_label: string;
  gap_pct: number | null;
  status: AssessmentStatus;
  worker_rep_name: string | null;
  worker_rep_email: string | null;
  worker_rep_decision: 'approved' | 'disputed' | null;
  worker_rep_comment: string | null;
  worker_rep_reviewed_at: string | null;
  gap_justified_pct: number | null;
  gap_unjustified_pct: number | null;
  remediation_required: boolean;
  remediation_deadline: string | null;
  remediation_plan: string | null;
  remediation_closed_at: string | null;
  published_to_workers_at: string | null;
  submitted_to_authority_at: string | null;
  initiated_by: string;
  created_at: string;
  updated_at: string;
  justifications?: JustificationFactor[];
}

// ============================================================================
// HOOK
// ============================================================================

export function useJointAssessments() {
  const { user, orgId, isLoaded, supabase } = useAuth();
  const { toast } = useToast();
  const [assessments, setAssessments] = useState<JointAssessment[]>([]);
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------------------------------
  // Fetch all assessments for the org
  // --------------------------------------------------------------------------
  const fetchAssessments = useCallback(async () => {
    if (!isLoaded || !user || !orgId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('joint_assessments')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments((data || []) as JointAssessment[]);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Bewertungen konnten nicht geladen werden';
      toast({ title: 'Fehler', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, orgId, supabase, toast]);

  useEffect(() => {
    if (isLoaded && user && orgId) {
      void fetchAssessments();
    }
  }, [isLoaded, user, orgId, fetchAssessments]);

  // --------------------------------------------------------------------------
  // Create a new assessment
  // --------------------------------------------------------------------------
  const createAssessment = useCallback(
    async (input: {
      snapshot_id?: string;
      scope: string;
      scope_id?: string;
      scope_label: string;
      gap_pct: number;
    }): Promise<JointAssessment | null> => {
      if (!isLoaded || !user || !orgId) return null;
      try {
        const payload = {
          organization_id: orgId,
          snapshot_id: input.snapshot_id ?? null,
          scope: input.scope,
          scope_id: input.scope_id ?? null,
          scope_label: input.scope_label,
          gap_pct: input.gap_pct,
          status: 'initiated' as AssessmentStatus,
          initiated_by: user.id,
          remediation_required: false,
        };

        const { data, error } = await supabase
          .from('joint_assessments')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        const created = data as JointAssessment;
        setAssessments((prev) => [created, ...prev]);
        toast({ title: 'Bewertung erstellt', description: `"${created.scope_label}" wurde initiiert.` });
        return created;
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : 'Bewertung konnte nicht erstellt werden';
        toast({ title: 'Fehler', description: msg, variant: 'destructive' });
        return null;
      }
    },
    [isLoaded, user, orgId, supabase, toast],
  );

  // --------------------------------------------------------------------------
  // Update assessment status (+ optional extra fields)
  // --------------------------------------------------------------------------
  const updateStatus = useCallback(
    async (
      id: string,
      status: AssessmentStatus,
      extra?: Partial<JointAssessment>,
    ): Promise<boolean> => {
      if (!isLoaded || !user || !orgId) return false;
      try {
        const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString(), ...extra };

        const { data, error } = await supabase
          .from('joint_assessments')
          .update(patch)
          .eq('id', id)
          .eq('organization_id', orgId)
          .select()
          .single();

        if (error) throw error;

        setAssessments((prev) =>
          prev.map((a) => (a.id === id ? (data as JointAssessment) : a)),
        );
        return true;
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : 'Status konnte nicht aktualisiert werden';
        toast({ title: 'Fehler', description: msg, variant: 'destructive' });
        return false;
      }
    },
    [isLoaded, user, orgId, supabase, toast],
  );

  // --------------------------------------------------------------------------
  // Fetch justifications for a single assessment
  // --------------------------------------------------------------------------
  const fetchJustifications = useCallback(
    async (assessmentId: string): Promise<JustificationFactor[]> => {
      if (!isLoaded || !user || !orgId) return [];
      try {
        const { data, error } = await supabase
          .from('joint_assessment_justifications')
          .select('*')
          .eq('assessment_id', assessmentId)
          .eq('organization_id', orgId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        return (data || []) as JustificationFactor[];
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : 'Begründungen konnten nicht geladen werden';
        toast({ title: 'Fehler', description: msg, variant: 'destructive' });
        return [];
      }
    },
    [isLoaded, user, orgId, supabase, toast],
  );

  // --------------------------------------------------------------------------
  // Add a justification factor
  // --------------------------------------------------------------------------
  const addJustification = useCallback(
    async (
      assessmentId: string,
      input: {
        factor_type: FactorType;
        description: string;
        estimated_gap_impact_pct?: number;
        evidence_notes?: string;
      },
    ): Promise<boolean> => {
      if (!isLoaded || !user || !orgId) return false;
      try {
        const payload = {
          organization_id: orgId,
          assessment_id: assessmentId,
          factor_type: input.factor_type,
          description: input.description,
          estimated_gap_impact_pct: input.estimated_gap_impact_pct ?? null,
          evidence_notes: input.evidence_notes ?? null,
          created_by: user.id,
        };

        const { error } = await supabase
          .from('joint_assessment_justifications')
          .insert(payload);

        if (error) throw error;

        toast({ title: 'Faktor hinzugefügt' });
        return true;
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : 'Faktor konnte nicht hinzugefügt werden';
        toast({ title: 'Fehler', description: msg, variant: 'destructive' });
        return false;
      }
    },
    [isLoaded, user, orgId, supabase, toast],
  );

  // --------------------------------------------------------------------------
  // Delete a justification factor
  // --------------------------------------------------------------------------
  const deleteJustification = useCallback(
    async (justificationId: string): Promise<boolean> => {
      if (!isLoaded || !user || !orgId) return false;
      try {
        const { error } = await supabase
          .from('joint_assessment_justifications')
          .delete()
          .eq('id', justificationId)
          .eq('organization_id', orgId);

        if (error) throw error;

        toast({ title: 'Faktor entfernt' });
        return true;
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : 'Faktor konnte nicht entfernt werden';
        toast({ title: 'Fehler', description: msg, variant: 'destructive' });
        return false;
      }
    },
    [isLoaded, user, orgId, supabase, toast],
  );

  // --------------------------------------------------------------------------
  // Set worker representative
  // --------------------------------------------------------------------------
  const setWorkerRep = useCallback(
    async (assessmentId: string, name: string, email: string): Promise<boolean> => {
      return updateStatus(assessmentId, 'reviewing', {
        worker_rep_name: name,
        worker_rep_email: email,
      });
    },
    [updateStatus],
  );

  // --------------------------------------------------------------------------
  // Record worker representative decision
  // --------------------------------------------------------------------------
  const recordWorkerDecision = useCallback(
    async (
      assessmentId: string,
      decision: 'approved' | 'disputed',
      comment: string,
    ): Promise<boolean> => {
      const nextStatus: AssessmentStatus = decision === 'approved' ? 'agreed' : 'dispute';
      return updateStatus(assessmentId, nextStatus, {
        worker_rep_decision: decision,
        worker_rep_comment: comment,
        worker_rep_reviewed_at: new Date().toISOString(),
      });
    },
    [updateStatus],
  );

  // --------------------------------------------------------------------------
  // Set remediation plan
  // --------------------------------------------------------------------------
  const setRemediationPlan = useCallback(
    async (assessmentId: string, plan: string, deadline: string): Promise<boolean> => {
      return updateStatus(assessmentId, 'remediating', {
        remediation_plan: plan,
        remediation_deadline: deadline,
        remediation_required: true,
      });
    },
    [updateStatus],
  );

  // --------------------------------------------------------------------------
  // Close an assessment
  // --------------------------------------------------------------------------
  const closeAssessment = useCallback(
    async (assessmentId: string): Promise<boolean> => {
      return updateStatus(assessmentId, 'closed', {
        remediation_closed_at: new Date().toISOString(),
      });
    },
    [updateStatus],
  );

  return {
    assessments,
    loading,
    createAssessment,
    updateStatus,
    addJustification,
    deleteJustification,
    setWorkerRep,
    recordWorkerDecision,
    setRemediationPlan,
    closeAssessment,
    fetchJustifications,
    refetch: fetchAssessments,
  };
}
