import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Vordefinierte Anfrage-Typen (keine Freitextfelder)
export const REQUEST_TYPES = {
  salary_band_position: {
    label: 'Position im Entgeltband',
    description: 'Erfahren Sie, in welchem Quartil des Entgeltbands Sie sich befinden',
    icon: 'BarChart3'
  },
  salary_criteria: {
    label: 'Kriterien der Gehaltsfestlegung',
    description: 'Transparente Darstellung der Faktoren für Ihre Gehaltseinstufung',
    icon: 'FileText'
  },
  career_progression: {
    label: 'Aufstiegsmöglichkeiten',
    description: 'Übersicht über nächste Karrierestufen und deren Anforderungen',
    icon: 'TrendingUp'
  },
  pay_gap_category: {
    label: 'Pay Gap in meiner Kategorie',
    description: 'Anonymisierter Gender Pay Gap für Ihre Position',
    icon: 'Users'
  },
  qualification_requirements: {
    label: 'Qualifikationsanforderungen',
    description: 'Anforderungen für den Aufstieg in höhere Levels',
    icon: 'GraduationCap'
  }
} as const;

export type InfoRequestType = keyof typeof REQUEST_TYPES;

export interface InfoRequest {
  id: string;
  request_type: InfoRequestType;
  request_type_label: string;
  status: string;
  status_label: string;
  submitted_at: string;
  processed_at: string | null;
  expires_at: string | null;
  has_response: boolean;
  rejection_reason: string | null;
}

export interface RateLimitInfo {
  allowed: boolean;
  current_count: number;
  max_allowed: number;
  next_reset: string;
}

export interface InfoRequestResponse {
  request_type: InfoRequestType;
  request_type_label: string;
  response_data: any;
  generated_at: string;
  expires_at: string;
  anonymization_note: string;
}

export function useInfoRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<InfoRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [rateLimits, setRateLimits] = useState<Record<InfoRequestType, RateLimitInfo>>({} as any);

  // Anfragen laden
  const fetchRequests = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase.rpc('get_my_info_requests');

      if (error) throw error;
      setRequests((data || []) as InfoRequest[]);
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Anfragen konnten nicht geladen werden',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Rate-Limit für einen Typ prüfen
  const checkRateLimit = useCallback(async (requestType: InfoRequestType): Promise<RateLimitInfo | null> => {
    if (!user) return null;

    const supabase = createClient();
    try {
      const { data, error } = await supabase.rpc('check_request_rate_limit', {
        _request_type: requestType
      });

      if (error) throw error;

      const limitInfo = (data as any[])?.[0] as RateLimitInfo;
      setRateLimits(prev => ({ ...prev, [requestType]: limitInfo }));
      return limitInfo;
    } catch (error: any) {
      console.error('Rate limit check failed:', error);
      return null;
    }
  }, [user]);

  // Alle Rate-Limits laden
  const fetchAllRateLimits = useCallback(async () => {
    if (!user) return;

    const types = Object.keys(REQUEST_TYPES) as InfoRequestType[];
    await Promise.all(types.map(type => checkRateLimit(type)));
  }, [user, checkRateLimit]);

  // Anfrage einreichen
  const submitRequest = useCallback(async (requestType: InfoRequestType): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase.rpc('submit_info_request', {
        _request_type: requestType
      });

      if (error) throw error;

      const result = (data as any[])?.[0];

      if (!result?.success) {
        toast({
          title: 'Anfrage nicht möglich',
          description: result?.error_message || 'Unbekannter Fehler',
          variant: 'destructive'
        });
        return false;
      }

      toast({
        title: 'Anfrage eingereicht',
        description: 'Ihre Auskunftsanfrage wird bearbeitet. Sie erhalten die Antwort in Kürze.',
      });

      // Aktualisiere Listen
      await Promise.all([fetchRequests(), checkRateLimit(requestType)]);

      return true;
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Anfrage konnte nicht eingereicht werden',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast, fetchRequests, checkRateLimit]);

  // Antwort abrufen
  const getResponse = useCallback(async (requestId: string): Promise<InfoRequestResponse | null> => {
    if (!user) return null;

    const supabase = createClient();
    try {
      const { data, error } = await supabase.rpc('get_info_request_response', {
        _request_id: requestId
      });

      if (error) throw error;

      const response = (data as any[])?.[0] as InfoRequestResponse;

      // Aktualisiere lokalen Status
      setRequests(prev => prev.map(req =>
        req.id === requestId ? { ...req, status: 'viewed', status_label: 'Eingesehen' } : req
      ));

      return response;
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Antwort konnte nicht geladen werden',
        variant: 'destructive'
      });
      return null;
    }
  }, [user, toast]);

  // Initial laden
  useEffect(() => {
    if (user) {
      fetchRequests();
      fetchAllRateLimits();
    }
  }, [user, fetchRequests, fetchAllRateLimits]);

  return {
    requests,
    loading,
    rateLimits,
    submitRequest,
    getResponse,
    fetchRequests,
    checkRateLimit
  };
}
