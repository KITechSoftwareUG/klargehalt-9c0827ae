import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type {
  ComplianceAssessment,
  AssessmentDetail,
  LegalReviewComment,
  CertifiedSnapshot,
  CreateAssessmentInput,
  CreateCommentInput,
  CertifyAssessmentInput,
  ComplianceAssessmentStatus,
} from '@/lib/types/compliance-workflow';

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unbekannter Fehler';
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !result.success) {
    throw new Error(result.error ?? `HTTP ${response.status}`);
  }

  if (result.data === undefined) {
    throw new Error('Keine Daten in der Antwort');
  }

  return result.data;
}

// ============================================================================
// HOOK: useComplianceAssessments
// ============================================================================

export interface UseComplianceAssessmentsOptions {
  /** When provided the hook also fetches the full AssessmentDetail for this ID. */
  assessmentId?: string;
}

export interface UseComplianceAssessmentsReturn {
  assessments: ComplianceAssessment[];
  currentAssessment: AssessmentDetail | null;
  loading: boolean;
  error: string | null;
  createAssessment: (input: CreateAssessmentInput) => Promise<ComplianceAssessment | null>;
  transitionStatus: (
    id: string,
    to: ComplianceAssessmentStatus,
    note?: string,
  ) => Promise<boolean>;
  addComment: (
    id: string,
    input: CreateCommentInput,
  ) => Promise<LegalReviewComment | null>;
  resolveComment: (assessmentId: string, commentId: string) => Promise<boolean>;
  certifyAssessment: (
    id: string,
    input: CertifyAssessmentInput,
  ) => Promise<CertifiedSnapshot | null>;
  refetch: () => void;
}

export function useComplianceAssessments(
  options: UseComplianceAssessmentsOptions = {},
): UseComplianceAssessmentsReturn {
  const { assessmentId } = options;
  const { user, orgId, isLoaded } = useAuth();
  const { toast } = useToast();

  const [assessments, setAssessments] = useState<ComplianceAssessment[]>([]);
  const [currentAssessment, setCurrentAssessment] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch all assessments for the org ──────────────────────────────────────
  const fetchAssessments = useCallback(async () => {
    if (!isLoaded || !user || !orgId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest<ComplianceAssessment[]>(
        '/api/compliance/assessments',
      );
      setAssessments(data);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast({
        title: 'Fehler',
        description: `Compliance-Prüfungen konnten nicht geladen werden: ${msg}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, orgId, toast]);

  // ── Fetch single assessment detail ─────────────────────────────────────────
  const fetchAssessmentDetail = useCallback(async (id: string) => {
    if (!isLoaded || !user || !orgId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest<AssessmentDetail>(
        `/api/compliance/assessments/${id}`,
      );
      setCurrentAssessment(data);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast({
        title: 'Fehler',
        description: `Prüfungsdetails konnten nicht geladen werden: ${msg}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, orgId, toast]);

  // ── Combined refetch ───────────────────────────────────────────────────────
  const refetch = useCallback(() => {
    void fetchAssessments();
    if (assessmentId) {
      void fetchAssessmentDetail(assessmentId);
    }
  }, [fetchAssessments, fetchAssessmentDetail, assessmentId]);

  useEffect(() => {
    if (isLoaded && user && orgId) {
      void fetchAssessments();
    }
  }, [isLoaded, user, orgId, fetchAssessments]);

  useEffect(() => {
    if (isLoaded && user && orgId && assessmentId) {
      void fetchAssessmentDetail(assessmentId);
    }
  }, [isLoaded, user, orgId, assessmentId, fetchAssessmentDetail]);

  // ── Create assessment ──────────────────────────────────────────────────────
  const createAssessment = useCallback(
    async (input: CreateAssessmentInput): Promise<ComplianceAssessment | null> => {
      if (!isLoaded || !user || !orgId) return null;

      try {
        const created = await apiRequest<ComplianceAssessment>(
          '/api/compliance/assessments',
          {
            method: 'POST',
            body: JSON.stringify(input),
          },
        );

        setAssessments((prev) => [created, ...prev]);

        toast({
          title: 'Prüfung erstellt',
          description: `"${created.title ?? 'Neue Prüfung'}" wurde angelegt.`,
        });

        return created;
      } catch (err: unknown) {
        const msg = getErrorMessage(err);
        toast({
          title: 'Fehler',
          description: `Prüfung konnte nicht erstellt werden: ${msg}`,
          variant: 'destructive',
        });
        return null;
      }
    },
    [isLoaded, user, orgId, toast],
  );

  // ── Transition status ──────────────────────────────────────────────────────
  const transitionStatus = useCallback(
    async (
      id: string,
      to: ComplianceAssessmentStatus,
      note?: string,
    ): Promise<boolean> => {
      if (!isLoaded || !user || !orgId) return false;

      try {
        await apiRequest<{ id: string }>(
          `/api/compliance/assessments/${id}/transitions`,
          {
            method: 'POST',
            body: JSON.stringify({ to, note: note ?? null }),
          },
        );

        // Update local state optimistically
        setAssessments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: to } : a)),
        );
        setCurrentAssessment((prev) =>
          prev?.id === id ? { ...prev, status: to } : prev,
        );

        toast({
          title: 'Status aktualisiert',
          description: `Prüfung wurde auf "${to}" gesetzt.`,
        });

        return true;
      } catch (err: unknown) {
        const msg = getErrorMessage(err);
        toast({
          title: 'Fehler',
          description: `Statuswechsel fehlgeschlagen: ${msg}`,
          variant: 'destructive',
        });
        return false;
      }
    },
    [isLoaded, user, orgId, toast],
  );

  // ── Add comment ────────────────────────────────────────────────────────────
  const addComment = useCallback(
    async (
      id: string,
      input: CreateCommentInput,
    ): Promise<LegalReviewComment | null> => {
      if (!isLoaded || !user || !orgId) return null;

      try {
        const created = await apiRequest<LegalReviewComment>(
          `/api/compliance/assessments/${id}/comments`,
          {
            method: 'POST',
            body: JSON.stringify(input),
          },
        );

        setCurrentAssessment((prev) => {
          if (!prev || prev.id !== id) return prev;
          return { ...prev, comments: [created, ...prev.comments] };
        });

        toast({
          title: 'Kommentar hinzugefügt',
          description: 'Ihr rechtlicher Kommentar wurde gespeichert.',
        });

        return created;
      } catch (err: unknown) {
        const msg = getErrorMessage(err);
        toast({
          title: 'Fehler',
          description: `Kommentar konnte nicht gespeichert werden: ${msg}`,
          variant: 'destructive',
        });
        return null;
      }
    },
    [isLoaded, user, orgId, toast],
  );

  // ── Resolve comment ────────────────────────────────────────────────────────
  const resolveComment = useCallback(
    async (targetAssessmentId: string, commentId: string): Promise<boolean> => {
      if (!isLoaded || !user || !orgId) return false;

      try {
        await apiRequest<{ id: string }>(
          `/api/compliance/assessments/${targetAssessmentId}/comments/${commentId}/resolve`,
          { method: 'PATCH' },
        );

        const resolvedAt = new Date().toISOString();

        setCurrentAssessment((prev) => {
          if (!prev || prev.id !== targetAssessmentId) return prev;
          return {
            ...prev,
            comments: prev.comments.map((c) =>
              c.id === commentId
                ? { ...c, resolved: true, resolved_at: resolvedAt }
                : c,
            ),
          };
        });

        toast({
          title: 'Kommentar aufgelöst',
          description: 'Der Kommentar wurde als erledigt markiert.',
        });

        return true;
      } catch (err: unknown) {
        const msg = getErrorMessage(err);
        toast({
          title: 'Fehler',
          description: `Kommentar konnte nicht aufgelöst werden: ${msg}`,
          variant: 'destructive',
        });
        return false;
      }
    },
    [isLoaded, user, orgId, toast],
  );

  // ── Certify assessment ─────────────────────────────────────────────────────
  const certifyAssessment = useCallback(
    async (
      id: string,
      input: CertifyAssessmentInput,
    ): Promise<CertifiedSnapshot | null> => {
      if (!isLoaded || !user || !orgId) return null;

      try {
        const snapshot = await apiRequest<CertifiedSnapshot>(
          `/api/compliance/assessments/${id}/certify`,
          {
            method: 'POST',
            body: JSON.stringify(input),
          },
        );

        // Reflect the CERTIFIED_SNAPSHOT status immediately
        setAssessments((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, status: 'CERTIFIED_SNAPSHOT' } : a,
          ),
        );
        setCurrentAssessment((prev) => {
          if (!prev || prev.id !== id) return prev;
          return { ...prev, status: 'CERTIFIED_SNAPSHOT', snapshot };
        });

        toast({
          title: 'Prüfung zertifiziert',
          description: 'Der zertifizierte Snapshot wurde erfolgreich erstellt.',
        });

        return snapshot;
      } catch (err: unknown) {
        const msg = getErrorMessage(err);
        toast({
          title: 'Fehler',
          description: `Zertifizierung fehlgeschlagen: ${msg}`,
          variant: 'destructive',
        });
        return null;
      }
    },
    [isLoaded, user, orgId, toast],
  );

  return {
    assessments,
    currentAssessment,
    loading,
    error,
    createAssessment,
    transitionStatus,
    addComment,
    resolveComment,
    certifyAssessment,
    refetch,
  };
}
