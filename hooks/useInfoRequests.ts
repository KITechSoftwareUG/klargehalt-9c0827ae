import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Canonical info_requests.request_type values
export const REQUEST_TYPES = {
  avg_pay_category: {
    label: 'Durchschnittsvergütung meiner Kategorie',
    description: 'Anonymisierter Durchschnitt Ihrer Vergleichsgruppe',
    icon: 'BarChart3',
  },
  pay_band: {
    label: 'Position im Entgeltband',
    description: 'Erfahren Sie, wo Ihr Gehalt im Band liegt',
    icon: 'FileText',
  },
  gap_explanation: {
    label: 'Pay Gap Erklärung',
    description: 'Anonymisierter Gender Pay Gap für Ihre Position',
    icon: 'Users',
  },
} as const;

export type InfoRequestType = keyof typeof REQUEST_TYPES;

// Canonical info_requests columns
export interface InfoRequest {
  id: string;
  organization_id: string;
  employee_id: string | null;
  request_type: InfoRequestType;
  status: 'pending' | 'fulfilled' | 'declined';
  job_profile_id: string | null;
  response_data: unknown;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  deadline_at: string | null;
  decline_reason: string | null;
}

// Returns days until deadline (negative = overdue). Returns null if no deadline.
export function getDaysUntilDeadline(deadline_at: string | null): number | null {
  if (!deadline_at) return null;
  const now = new Date();
  const deadline = new Date(deadline_at);
  const diffMs = deadline.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// Returns the SLA status of a deadline.
export function getDeadlineStatus(deadline_at: string | null): 'ok' | 'warning' | 'overdue' {
  const days = getDaysUntilDeadline(deadline_at);
  if (days === null) return 'ok';
  if (days < 0) return 'overdue';
  if (days <= 14) return 'warning';
  return 'ok';
}

export function useInfoRequests() {
  const { user, orgId, isLoaded, supabase } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<InfoRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!isLoaded || !user || !orgId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('info_requests')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data || []) as InfoRequest[]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Anfragen konnten nicht geladen werden';
      toast({ title: 'Fehler', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, orgId, toast, supabase]);

  const submitRequest = useCallback(async (requestType: InfoRequestType): Promise<boolean> => {
    if (!isLoaded || !user || !orgId) return false;
    setLoading(true);
    try {
      const res = await fetch('/api/info-requests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_type: requestType }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Anfrage fehlgeschlagen');
      }

      const result = await res.json() as { status: string };
      toast({
        title: 'Anfrage eingereicht',
        description: result.status === 'fulfilled'
          ? 'Ihre Auskunft wurde sofort berechnet und steht bereit.'
          : 'Ihre Anfrage wurde eingereicht und wird bearbeitet.',
      });
      await fetchRequests();
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Anfrage konnte nicht eingereicht werden';
      toast({ title: 'Fehler', description: msg, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, orgId, toast, fetchRequests]);

  const getResponse = useCallback(async (requestId: string): Promise<InfoRequest | null> => {
    if (!isLoaded || !user || !orgId) return null;
    try {
      const { data, error } = await supabase
        .from('info_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) throw error;
      return data as InfoRequest;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Antwort konnte nicht geladen werden';
      toast({ title: 'Fehler', description: msg, variant: 'destructive' });
      return null;
    }
  }, [isLoaded, user, orgId, toast, supabase]);

  const fetchPendingForHR = useCallback(async (): Promise<InfoRequest[]> => {
    if (!isLoaded || !user || !orgId) return [];
    try {
      const { data, error } = await supabase
        .from('info_requests')
        .select('*')
        .eq('organization_id', orgId)
        .eq('status', 'pending')
        .order('deadline_at', { ascending: true });

      if (error) throw error;
      return (data || []) as InfoRequest[];
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Anfragen konnten nicht geladen werden';
      toast({ title: 'Fehler', description: msg, variant: 'destructive' });
      return [];
    }
  }, [isLoaded, user, orgId, toast, supabase]);

  const declineRequest = useCallback(async (id: string, reason: string): Promise<boolean> => {
    if (!isLoaded || !user || !orgId) return false;
    try {
      const { error } = await supabase
        .from('info_requests')
        .update({
          status: 'declined',
          decline_reason: reason,
          processed_by: user.id,
          processed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('organization_id', orgId);

      if (error) throw error;
      toast({ title: 'Anfrage abgelehnt', description: 'Die Anfrage wurde abgelehnt.' });
      await fetchRequests();
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Anfrage konnte nicht abgelehnt werden';
      toast({ title: 'Fehler', description: msg, variant: 'destructive' });
      return false;
    }
  }, [isLoaded, user, orgId, toast, fetchRequests, supabase]);

  const fulfillRequest = useCallback(async (id: string, responseData: Record<string, unknown>): Promise<boolean> => {
    if (!isLoaded || !user || !orgId) return false;
    try {
      const { error } = await supabase
        .from('info_requests')
        .update({
          status: 'fulfilled',
          response_data: responseData,
          processed_by: user.id,
          processed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('organization_id', orgId);

      if (error) throw error;
      toast({ title: 'Anfrage beantwortet', description: 'Die Antwort wurde erfolgreich übermittelt.' });
      await fetchRequests();
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Anfrage konnte nicht beantwortet werden';
      toast({ title: 'Fehler', description: msg, variant: 'destructive' });
      return false;
    }
  }, [isLoaded, user, orgId, toast, fetchRequests, supabase]);

  useEffect(() => {
    if (isLoaded && user && orgId) {
      fetchRequests();
    }
  }, [isLoaded, user, orgId, fetchRequests]);

  return { requests, loading, submitRequest, getResponse, fetchRequests, fetchPendingForHR, declineRequest, fulfillRequest };
}
