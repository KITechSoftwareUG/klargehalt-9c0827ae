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
      const { error } = await supabase
        .from('info_requests')
        .insert({
          organization_id: orgId,
          request_type: requestType,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Anfrage eingereicht',
        description: 'Ihre Auskunftsanfrage wird bearbeitet.',
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
  }, [isLoaded, user, orgId, toast, supabase, fetchRequests]);

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

  useEffect(() => {
    if (isLoaded && user && orgId) {
      fetchRequests();
    }
  }, [isLoaded, user, orgId, fetchRequests]);

  return { requests, loading, submitRequest, getResponse, fetchRequests };
}
