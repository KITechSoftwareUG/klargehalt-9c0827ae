import { useState, useCallback } from 'react';
import { createClientWithToken } from '@/utils/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@clerk/nextjs';

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string;
  user_email: string;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  old_values: any;
  new_values: any;
  metadata: any;
  created_at: string;
  record_hash: string;
  previous_hash: string | null;
  sequence_number: number | null;
  ip_address: string | null;
  user_agent: string | null;
}

export interface AuditStatistics {
  total_records: number;
  records_by_action: Record<string, number>;
  records_by_entity: Record<string, number>;
  records_by_user: Record<string, number>;
  top_users: Record<string, number>;
  daily_activity: Array<{ date: string; count: number }>;
}

export interface ChainVerification {
  is_valid: boolean;
  checked_records: number;
  first_invalid_sequence: number | null;
  first_invalid_id: string | null;
  error_message: string | null;
}

export interface AuditExport {
  export_id: string;
  record_count: number;
  data: {
    export_id: string;
    exported_at: string;
    file_hash: string;
    record_count: number;
    records: AuditLog[];
  };
}

export function useAuditSystem() {
  const { user, orgId, isLoaded } = useAuth();
  const { session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const getSupabase = async () => {
    const token = await session?.getToken({ template: 'supabase' });
    return createClientWithToken(token || null);
  };

  const getStatistics = useCallback(async (days: number = 30): Promise<AuditStatistics | null> => {
    if (!isLoaded || !user || !orgId) return null;

    setLoading(true);
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase.rpc('get_audit_statistics', {
        _organization_id: orgId, // Changed from _company_id
        _days: days
      });

      if (error) throw error;

      const result = (data as any[])?.[0];
      return result ? {
        total_records: result.total_records,
        records_by_action: result.records_by_action || {},
        records_by_entity: result.records_by_entity || {},
        records_by_user: result.records_by_user || {},
        top_users: result.top_users || {},
        daily_activity: result.daily_activity || []
      } : null;
    } catch (error: any) {
      console.error('Audit statistics error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, orgId, session]);

  const verifyChain = useCallback(async (
    fromSequence?: number,
    toSequence?: number
  ): Promise<ChainVerification | null> => {
    if (!isLoaded || !user || !orgId) return null;

    setLoading(true);
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase.rpc('verify_audit_chain', {
        _organization_id: orgId, // Changed from _company_id
        _from_sequence: fromSequence || null,
        _to_sequence: toSequence || null
      });

      if (error) throw error;
      const result = (data as any[])?.[0];

      if (result?.is_valid) {
        toast({
          title: 'Integrität bestätigt',
          description: `${result.checked_records} Einträge erfolgreich verifiziert.`,
        });
      } else if (result) {
        toast({
          title: 'Integritätsfehler',
          description: result.error_message || 'Hash-Kette ist inkonsistent.',
          variant: 'destructive'
        });
      }
      return result as ChainVerification;
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Verifizierung fehlgeschlagen',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, orgId, toast, session]);

  const createExport = useCallback(async (
    exportType: 'full' | 'date_range' | 'entity_type',
    format: 'json' | 'csv' = 'json',
    dateFrom?: string,
    dateTo?: string,
    entityTypes?: string[],
    actions?: string[]
  ): Promise<AuditExport | null> => {
    if (!isLoaded || !user || !orgId) return null;

    setLoading(true);
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase.rpc('create_audit_export', {
        // RPCS should be updated to use organization_id context automatically or explicitly
        _export_type: exportType,
        _format: format,
        _date_from: dateFrom || null,
        _date_to: dateTo || null,
        _entity_types: entityTypes || null,
        _actions: actions || null
      });

      if (error) throw error;
      const result = (data as any[])?.[0] as AuditExport;

      toast({
        title: 'Export erstellt',
        description: `${result.record_count} Einträge exportiert.`,
      });
      return result;
    } catch (error: any) {
      toast({
        title: 'Export fehlgeschlagen',
        description: error.message || 'Export konnte nicht erstellt werden',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, orgId, toast, session]);

  // downloadExport remains the same... (Skipping implementation details for brevity in this tool call)
  const downloadExport = useCallback((exportData: AuditExport, format: 'json' | 'csv') => {
    let content: string;
    let mimeType: string;
    let extension: string;

    if (format === 'json') {
      content = JSON.stringify(exportData.data, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else {
      const records = exportData.data.records || [];
      if (records.length === 0) {
        content = 'Keine Daten';
      } else {
        const headers = ['Zeitstempel', 'Benutzer', 'Rolle', 'Aktion', 'Entität', 'Name', 'Hash'];
        const rows = records.map(r => [
          r.created_at,
          r.user_email,
          r.user_role,
          r.action,
          r.entity_type,
          r.entity_name || '',
          r.record_hash?.substring(0, 16) + '...'
        ]);
        content = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
      }
      mimeType = 'text/csv';
      extension = 'csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_export_${new Date().toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return {
    loading,
    getStatistics,
    verifyChain,
    createExport,
    downloadExport
  };
}
