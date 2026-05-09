import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Canonical audit_logs columns only
export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name?: string | null;
  old_values?: unknown;
  new_values?: unknown;
  metadata?: unknown;
  before_state: unknown;
  after_state: unknown;
  ip_address: string | null;
  created_at: string;
  sequence_number?: number | null;
  previous_hash?: string | null;
  record_hash?: string | null;
}

export interface AuditStatistics {
  total_records: number;
  records_by_action: Record<string, number>;
  records_by_entity: Record<string, number>;
  records_by_user: Record<string, number>;
  top_users: Record<string, number>;
  daily_activity: Array<{ date: string; count: number }>;
}

export interface AuditExport {
  export_id: string;
  record_count: number;
  data: {
    exported_at: string;
    record_count: number;
    hash_chain_valid: boolean | null;
    records: AuditLog[];
  };
}

export function useAuditSystem() {
  const { user, orgId, isLoaded, supabase } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const getStatistics = useCallback(async (days: number = 30): Promise<AuditStatistics | null> => {
    if (!isLoaded || !user || !orgId) return null;

    setLoading(true);
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const { data, error } = await supabase
        .from('audit_logs')
        .select('action, entity_type, user_id, created_at')
        .eq('organization_id', orgId)
        .gte('created_at', cutoff.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const logs = data || [];

      // Client-side aggregation
      const records_by_action: Record<string, number> = {};
      const records_by_entity: Record<string, number> = {};
      const records_by_user: Record<string, number> = {};
      const daily_map: Record<string, number> = {};

      for (const log of logs) {
        records_by_action[log.action] = (records_by_action[log.action] || 0) + 1;
        records_by_entity[log.entity_type] = (records_by_entity[log.entity_type] || 0) + 1;
        records_by_user[log.user_id] = (records_by_user[log.user_id] || 0) + 1;
        const day = log.created_at.split('T')[0];
        daily_map[day] = (daily_map[day] || 0) + 1;
      }

      // Top users: sort by count descending, take top 10
      const sortedUsers = Object.entries(records_by_user)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);
      const top_users = Object.fromEntries(sortedUsers);

      const daily_activity = Object.entries(daily_map)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }));

      return {
        total_records: logs.length,
        records_by_action,
        records_by_entity,
        records_by_user,
        top_users,
        daily_activity,
      };
    } catch (error: unknown) {
      console.error('Audit statistics error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, orgId, supabase]);

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
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (dateFrom) query = query.gte('created_at', dateFrom);
      if (dateTo) query = query.lte('created_at', dateTo);
      if (entityTypes?.length) query = query.in('entity_type', entityTypes);
      if (actions?.length) query = query.in('action', actions);

      const { data, error } = await query;
      if (error) throw error;

      const records = (data || []) as AuditLog[];
      const { data: chainValid, error: chainError } = await supabase.rpc('verify_audit_chain', {
        _org_id: orgId,
      });
      const result: AuditExport = {
        export_id: crypto.randomUUID(),
        record_count: records.length,
        data: {
          exported_at: new Date().toISOString(),
          record_count: records.length,
          hash_chain_valid: chainError ? null : (chainValid as boolean),
          records,
        },
      };

      toast({ title: 'Export erstellt', description: `${result.record_count} Einträge exportiert.` });
      return result;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Export konnte nicht erstellt werden';
      toast({ title: 'Export fehlgeschlagen', description: msg, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, orgId, supabase, toast]);

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
        const headers = [
          'Zeitstempel',
          'Sequenz',
          'Benutzer-ID',
          'Aktion',
          'Entitätstyp',
          'Entitäts-ID',
          'Entitätsname',
          'Vorher',
          'Nachher',
          'Metadaten',
          'Vorheriger Hash',
          'Datensatz-Hash',
        ];
        const rows = records.map(r => [
          r.created_at,
          r.sequence_number ?? '',
          r.user_id,
          r.action,
          r.entity_type,
          r.entity_id || '',
          r.entity_name || '',
          JSON.stringify(r.before_state ?? r.old_values ?? ''),
          JSON.stringify(r.after_state ?? r.new_values ?? ''),
          JSON.stringify(r.metadata ?? {}),
          r.previous_hash || '',
          r.record_hash || '',
        ]);
        const escapeCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        content = [
          [`Export-ID: ${exportData.export_id}`],
          [`Exportiert am: ${exportData.data.exported_at}`],
          [`Anzahl Eintraege: ${exportData.data.record_count}`],
          [`Hash-Kette gueltig: ${exportData.data.hash_chain_valid === null ? 'nicht geprueft' : exportData.data.hash_chain_valid ? 'ja' : 'nein'}`],
          [],
          headers,
          ...rows,
        ].map(r => r.map(escapeCell).join(';')).join('\n');
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

  return { loading, getStatistics, createExport, downloadExport };
}
