import type { SupabaseClient } from '@supabase/supabase-js';

export type AuditAction = 'create' | 'update' | 'delete' | 'view' | 'export';

interface LogParams {
  orgId: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  beforeState?: unknown;
  afterState?: unknown;
}

/**
 * Fire-and-forget audit log insert. Never throws — main operation must not fail
 * because audit logging failed. Call with `void` prefix in non-async contexts.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function logAuditEntry(supabase: SupabaseClient<any, any, any>, params: LogParams): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    organization_id: params.orgId,
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    before_state: params.beforeState ?? null,
    after_state: params.afterState ?? null,
  });
  if (error) {
    console.error('[audit] insert failed:', params.entityType, params.action, error);
  }
}
