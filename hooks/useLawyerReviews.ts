import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { logAuditEntry } from '@/lib/audit-log';

// ============================================================================
// TYPES
// ============================================================================

export type ReviewScopeType =
  | 'pay_gap_report'
  | 'joint_assessment'
  | 'compliance_report'
  | 'full_audit'
  | 'salary_structure';

export type ReviewVerdict =
  | 'approved'
  | 'needs_remediation'
  | 'compliant_with_notes'
  | 'rejected';

export interface LawyerReview {
  id: string;
  organization_id: string;
  reviewed_by: string;
  reviewed_by_name: string;
  scope_type: ReviewScopeType;
  scope_id: string | null;
  scope_label: string | null;
  verdict: ReviewVerdict;
  notes: string | null;
  recommendations: string | null;
  document_hash: string | null;
  review_period_start: string | null;
  review_period_end: string | null;
  signed_at: string;
  created_at: string;
}

export interface CreateLawyerReviewInput {
  scope_type: ReviewScopeType;
  scope_id?: string;
  scope_label?: string;
  verdict: ReviewVerdict;
  notes?: string;
  recommendations?: string;
  document_hash?: string;
  review_period_start?: string;
  review_period_end?: string;
}

// ============================================================================
// LABELS (German)
// ============================================================================

export const SCOPE_TYPE_LABELS: Record<ReviewScopeType, string> = {
  pay_gap_report: 'Pay-Gap-Bericht',
  joint_assessment: 'Gem. Bewertung',
  compliance_report: 'Compliance-Bericht',
  full_audit: 'Gesamtaudit',
  salary_structure: 'Gehaltsstruktur',
};

export const VERDICT_LABELS: Record<ReviewVerdict, string> = {
  approved: 'Genehmigt',
  needs_remediation: 'Nachbesserung erforderlich',
  compliant_with_notes: 'Konform mit Anmerkungen',
  rejected: 'Abgelehnt',
};

export const VERDICT_COLORS: Record<ReviewVerdict, string> = {
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  needs_remediation: 'bg-amber-100 text-amber-800 border-amber-200',
  compliant_with_notes: 'bg-blue-100 text-blue-800 border-blue-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

// ============================================================================
// HOOK: useLawyerReviews
// ============================================================================

export function useLawyerReviews() {
  const { user, orgId, isLoaded, supabase } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<LawyerReview[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!isLoaded || !user || !orgId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lawyer_reviews')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews((data || []) as LawyerReview[]);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Rechtliche Bewertungen konnten nicht geladen werden';
      toast({ title: 'Fehler', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, orgId, supabase, toast]);

  useEffect(() => {
    if (isLoaded && user && orgId) {
      void fetchReviews();
    }
  }, [isLoaded, user, orgId, fetchReviews]);

  const createReview = useCallback(
    async (input: CreateLawyerReviewInput): Promise<LawyerReview | null> => {
      if (!isLoaded || !user || !orgId) return null;
      try {
        const payload = {
          organization_id: orgId,
          reviewed_by: user.id,
          reviewed_by_name: user.fullName || user.firstName || user.email || 'Anwalt',
          scope_type: input.scope_type,
          scope_id: input.scope_id ?? null,
          scope_label: input.scope_label ?? null,
          verdict: input.verdict,
          notes: input.notes ?? null,
          recommendations: input.recommendations ?? null,
          document_hash: input.document_hash ?? null,
          review_period_start: input.review_period_start ?? null,
          review_period_end: input.review_period_end ?? null,
        };

        const { data, error } = await supabase
          .from('lawyer_reviews')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        const created = data as LawyerReview;
        setReviews((prev) => [created, ...prev]);

        void logAuditEntry(supabase, {
          orgId,
          userId: user.id,
          action: 'create',
          entityType: 'lawyer_reviews',
          entityId: created.id,
          afterState: created,
        });

        toast({
          title: 'Bewertung erstellt',
          description: `Rechtliche Bewertung "${SCOPE_TYPE_LABELS[created.scope_type]}" wurde erfasst.`,
        });
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

  return {
    reviews,
    loading,
    createReview,
    refetch: fetchReviews,
  };
}

// ============================================================================
// HOOK: useLawyerReviewsByScope
// ============================================================================

export function useLawyerReviewsByScope(scopeType?: ReviewScopeType, scopeId?: string) {
  const { user, orgId, isLoaded, supabase } = useAuth();
  const [reviews, setReviews] = useState<LawyerReview[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!isLoaded || !user || !orgId || !scopeType) return;
    setLoading(true);
    try {
      let query = supabase
        .from('lawyer_reviews')
        .select('*')
        .eq('organization_id', orgId)
        .eq('scope_type', scopeType);

      if (scopeId) {
        query = query.eq('scope_id', scopeId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setReviews((data || []) as LawyerReview[]);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, orgId, scopeType, scopeId, supabase]);

  useEffect(() => {
    if (isLoaded && user && orgId && scopeType) {
      void fetchReviews();
    }
  }, [isLoaded, user, orgId, scopeType, scopeId, fetchReviews]);

  return {
    reviews,
    loading,
    refetch: fetchReviews,
  };
}
