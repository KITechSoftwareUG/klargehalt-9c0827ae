import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

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
  old_values: unknown;
  new_values: unknown;
  metadata: unknown;
  created_at: string;
  record_hash: string;
}

export interface AuditLogFilters {
  action?: string;
  entity_type?: string;
  user_email?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useAuditLogs(filters?: AuditLogFilters) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { user, orgId, isLoaded, supabase } = useAuth();

  const fetchAuditLogs = async (page = 0, pageSize = 50) => {
    if (!isLoaded || !user || !orgId) {
      setAuditLogs([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
      }
      if (filters?.user_email) {
        query = query.ilike('user_email', `%${filters.user_email}%`);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setAuditLogs((data || []) as AuditLog[]);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      toast.error('Fehler beim Laden der Audit-Logs');
    } finally {
      setLoading(false);
    }
  };

  const exportAuditLogs = async (format: 'csv' | 'json' = 'csv') => {
    if (!user || !orgId) return null;

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (format === 'csv') {
        const headers = ['Datum', 'Benutzer', 'Rolle', 'Aktion', 'Entität', 'Name', 'Hash'];
        const rows = (data || []).map(log => [
          new Date(log.created_at).toLocaleString('de-DE'),
          log.user_email,
          log.user_role,
          log.action,
          log.entity_type,
          log.entity_name || '',
          log.record_hash
        ]);

        const csvContent = [headers, ...rows]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        toast.success('Audit-Logs exportiert');
        return csvContent;
      }
      return data;
    } catch (error: any) {
      toast.error('Fehler beim Exportieren der Audit-Logs');
      return null;
    }
  };

  useEffect(() => {
    if (isLoaded && user && orgId) {
      fetchAuditLogs();
    }
  }, [isLoaded, user, orgId, filters?.action, filters?.entity_type, filters?.user_email, filters?.dateFrom, filters?.dateTo]);

  return {
    auditLogs,
    loading,
    totalCount,
    fetchAuditLogs,
    exportAuditLogs,
  };
}
