import type { SupabaseClient } from '@supabase/supabase-js';

export type AuditAction = 'create' | 'update' | 'delete' | 'view' | 'export';
type AuditEntity =
  | 'job_profile'
  | 'pay_band'
  | 'salary_component'
  | 'employee'
  | 'salary_info'
  | 'info_request'
  | 'user'
  | 'company'
  | 'report'
  | 'salary_decision'
  | 'lawyer_review';

interface LogParams {
  orgId: string;
  companyId?: string;
  userId: string;
  userEmail?: string | null;
  userRole?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  entityName?: string | null;
  beforeState?: unknown;
  afterState?: unknown;
  metadata?: Record<string, unknown>;
}

const ENTITY_TYPE_MAP: Record<string, AuditEntity> = {
  job_profiles: 'job_profile',
  job_profile: 'job_profile',
  pay_bands: 'pay_band',
  pay_band: 'pay_band',
  salary_components: 'salary_component',
  salary_component: 'salary_component',
  employees: 'employee',
  employee: 'employee',
  salary_info: 'salary_info',
  info_requests: 'info_request',
  info_request: 'info_request',
  users: 'user',
  user: 'user',
  companies: 'company',
  company: 'company',
  reports: 'report',
  report: 'report',
  salary_decisions: 'salary_decision',
  salary_decision: 'salary_decision',
  lawyer_reviews: 'lawyer_review',
  lawyer_review: 'lawyer_review',
};

async function resolveCompanyId(
  supabase: SupabaseClient,
  orgId: string,
  providedCompanyId?: string,
): Promise<string | null> {
  if (providedCompanyId) return providedCompanyId;

  const { data, error } = await supabase
    .from('companies')
    .select('id')
    .eq('organization_id', orgId)
    .maybeSingle();

  if (error) {
    console.error('[audit] company lookup failed:', orgId, error);
    return null;
  }

  return typeof data?.id === 'string' ? data.id : null;
}

/**
 * Fire-and-forget audit log insert. Never throws — main operation must not fail
 * because audit logging failed. Call with `void` prefix in non-async contexts.
 */
export async function logAuditEntry(supabase: SupabaseClient, params: LogParams): Promise<void> {
  const entityType = ENTITY_TYPE_MAP[params.entityType] ?? null;
  if (!entityType) {
    console.error('[audit] unsupported entity type:', params.entityType);
    return;
  }

  const companyId = await resolveCompanyId(supabase, params.orgId, params.companyId);
  if (!companyId) {
    console.error('[audit] missing company id:', params.entityType, params.action);
    return;
  }

  const { error } = await supabase.from('audit_logs').insert({
    organization_id: params.orgId,
    company_id: companyId,
    user_id: params.userId,
    user_email: params.userEmail ?? null,
    user_role: params.userRole ?? 'system',
    action: params.action,
    entity_type: entityType,
    entity_id: params.entityId ?? null,
    entity_name: params.entityName ?? null,
    old_values: params.beforeState ?? null,
    new_values: params.afterState ?? null,
    before_state: params.beforeState ?? null,
    after_state: params.afterState ?? null,
    metadata: params.metadata ?? {},
  });
  if (error) {
    console.error('[audit] insert failed:', params.entityType, params.action, error);
  }
}
