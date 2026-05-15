import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Canonical audit_logs columns only
export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_state: unknown;
  after_state: unknown;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogFilters {
  action?: string;
  entity_type?: string;
  user_id?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Audit reads go through the server route (service-role + RBAC) instead of a
// browser-direct Supabase query: the browser client authenticates with a Logto
// org token that Supabase has no integration to verify, so direct PostgREST
// calls are rejected. Every other data hook already uses /api/* for the same
// reason — this keeps audit consistent with that pattern.
export function useAuditLogs(filters?: AuditLogFilters) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { user, orgId, isLoaded } = useAuth();

  const fetchAuditLogs = async (page = 0, pageSize = 50) => {
    if (!isLoaded || !user || !orgId) {
      setAuditLogs([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (filters?.action) params.set('action', filters.action);
      if (filters?.entity_type) params.set('entity_type', filters.entity_type);
      if (filters?.user_id) params.set('user_id', filters.user_id);
      if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.set('dateTo', filters.dateTo);

      const res = await fetch(`/api/audit-logs?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const { data, count } = (await res.json()) as {
        data: AuditLog[];
        count: number;
      };
      setAuditLogs(data || []);
      setTotalCount(count || 0);
    } catch (error: unknown) {
      console.error('Error fetching audit logs:', error);
      toast.error('Fehler beim Laden der Audit-Logs');
    } finally {
      setLoading(false);
    }
  };

  const exportAuditLogs = async (format: 'csv' | 'json' = 'csv') => {
    if (!user || !orgId) return null;

    try {
      const res = await fetch('/api/audit-logs?full=1', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = (await res.json()) as { data: AuditLog[] };

      if (format === 'csv') {
        const headers = ['Datum', 'Benutzer-ID', 'Aktion', 'Entitätstyp', 'Entitäts-ID'];
        const rows = (data || []).map((log: AuditLog) => [
          new Date(log.created_at).toLocaleString('de-DE'),
          log.user_id,
          log.action,
          log.entity_type,
          log.entity_id || '',
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
        URL.revokeObjectURL(url);

        toast.success('Audit-Logs exportiert');
        return csvContent;
      }
      return data;
    } catch {
      toast.error('Fehler beim Exportieren der Audit-Logs');
      return null;
    }
  };

  useEffect(() => {
    if (isLoaded && user && orgId) {
      fetchAuditLogs();
    }
  }, [isLoaded, user, orgId, filters?.action, filters?.entity_type, filters?.user_id, filters?.dateFrom, filters?.dateTo]);

  const verifyChain = async (): Promise<boolean | null> => {
    if (!isLoaded || !user || !orgId) return null;

    try {
      const res = await fetch('/api/audit-logs/verify-chain', {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { valid } = (await res.json()) as { valid: boolean };
      return valid;
    } catch (error: unknown) {
      console.error('Error verifying audit chain:', error);
      toast.error('Fehler bei der Integritätsprüfung');
      return null;
    }
  };

  return {
    auditLogs,
    loading,
    totalCount,
    fetchAuditLogs,
    exportAuditLogs,
    verifyChain,
  };
}
