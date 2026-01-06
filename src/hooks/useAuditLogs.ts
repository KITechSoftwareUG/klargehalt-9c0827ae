import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface AuditLog {
  id: string;
  company_id: string;
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
  const { user } = useAuth();

  const fetchAuditLogs = async (page = 0, pageSize = 50) => {
    if (!user) return;
    
    setLoading(true);
    
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (filters?.action) {
      query = query.eq('action', filters.action as 'create' | 'update' | 'delete' | 'view' | 'export' | 'login' | 'logout' | 'request_info');
    }
    if (filters?.entity_type) {
      query = query.eq('entity_type', filters.entity_type as 'job_profile' | 'pay_band' | 'salary_component' | 'employee' | 'salary_info' | 'info_request' | 'user' | 'company' | 'report');
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

    if (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Fehler beim Laden der Audit-Logs');
    } else {
      setAuditLogs((data || []) as AuditLog[]);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const exportAuditLogs = async (format: 'csv' | 'json' = 'csv') => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Fehler beim Exportieren der Audit-Logs');
      return null;
    }

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
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [user, filters?.action, filters?.entity_type, filters?.user_email, filters?.dateFrom, filters?.dateTo]);

  return {
    auditLogs,
    loading,
    totalCount,
    fetchAuditLogs,
    exportAuditLogs,
  };
}
