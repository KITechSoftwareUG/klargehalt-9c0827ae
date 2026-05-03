import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { getServerAuthContext } from '@/lib/auth/server';
import type { SupabaseClient } from '@supabase/supabase-js';

type AuthContext = Awaited<ReturnType<typeof getServerAuthContext>>;

export type OrgRole = 'admin' | 'hr_manager' | 'employee' | 'lawyer';

export interface GuardedContext {
  orgId: string;
  userId: string;
  role: OrgRole;
}

/**
 * Verifies that the authenticated user is an actual member of the claimed org.
 * Guards against cookie-spoofing: the kg_active_org cookie is not JWT-verified,
 * so this DB check is the authoritative membership gate for service-role routes.
 *
 * Returns GuardedContext on success, NextResponse (403/401) on failure.
 */
export async function guardOrgMember(
  context: AuthContext
): Promise<GuardedContext | NextResponse> {
  if (!context.isAuthenticated || !context.user || !context.activeOrganizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orgId = context.activeOrganizationId;
  const userId = context.user.id;

  const supabase = createServiceClient();
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .maybeSingle();

  if (!userRole) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return { orgId, userId, role: userRole.role as OrgRole };
}

/**
 * Like guardOrgMember but additionally enforces that the caller has one of the
 * required roles. Returns 403 if the role is insufficient.
 */
export async function guardRole(
  context: AuthContext,
  allowedRoles: OrgRole[]
): Promise<GuardedContext | NextResponse> {
  const result = await guardOrgMember(context);
  if (result instanceof NextResponse) return result;

  if (!allowedRoles.includes(result.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return result;
}

/**
 * Picks only the explicitly allowed field names from an untrusted request body.
 * Prevents mass-assignment of protected columns (id, organization_id, created_by,
 * subscription_tier, stripe_customer_id, etc.).
 */
export function pickFields(
  body: Record<string, unknown>,
  allowlist: readonly string[]
): Record<string, unknown> {
  return Object.fromEntries(
    allowlist.filter((f) => f in body).map((f) => [f, body[f]])
  );
}

/**
 * Looks up the UUID of the companies row for an org.
 * Required for tables that have company_id NOT NULL (job_profiles, employees,
 * pay_bands, audit_logs).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCompanyId(orgId: string, supabase: SupabaseClient<any, any, any>): Promise<string | null> {
  const { data } = await supabase
    .from('companies')
    .select('id')
    .eq('organization_id', orgId)
    .maybeSingle();
  return data?.id ?? null;
}

// ── Per-entity write allowlists ───────────────────────────────────────────────

export const EMPLOYEE_WRITE_FIELDS = [
  'employee_number', 'first_name', 'last_name', 'email', 'gender', 'birth_year',
  'job_profile_id', 'job_level_id', 'department_id', 'employment_type', 'location',
  'hire_date', 'base_salary', 'variable_pay', 'weekly_hours', 'currency',
  'pay_band_id', 'on_leave', 'leave_type', 'leave_start', 'leave_end', 'user_id',
  'is_active', 'salary_justification', 'salary_justification_updated_at',
  'salary_justification_updated_by',
] as const;

export const DEPARTMENT_WRITE_FIELDS = ['name', 'parent_id'] as const;

export const JOB_PROFILE_WRITE_FIELDS = [
  'title', 'description', 'department_id', 'skills_score', 'effort_score',
  'responsibility_score', 'working_conditions_score', 'evaluation_method',
  'evaluation_method_notes', 'evaluated_by', 'evaluated_by_name',
  'last_evaluated_at', 'is_active',
] as const;

export const JOB_LEVEL_WRITE_FIELDS = ['name', 'rank'] as const;

export const PAY_BAND_WRITE_FIELDS = [
  'job_profile_id', 'job_level_id', 'min_salary', 'max_salary', 'currency',
  'is_active', 'effective_from', 'effective_to',
] as const;

export const COMPANY_WRITE_FIELDS = [
  'name', 'legal_name', 'country', 'industry', 'employee_size_band',
  'reporting_frequency',
] as const;
