import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { getServerAuthContext } from '@/lib/auth/server';
import type { SupabaseClient } from '@supabase/supabase-js';

type AuthContext = Awaited<ReturnType<typeof getServerAuthContext>>;

export type OrgRole = 'owner' | 'admin' | 'hr_manager' | 'employee' | 'lawyer' | 'auditor';

export interface GuardedContext {
  orgId: string;
  userId: string;
  role: OrgRole;
}

/** Response code the client uses to redirect a locked tenant to /konto-gesperrt. */
export const ACCOUNT_DELETION_SCHEDULED = 'ACCOUNT_DELETION_SCHEDULED';

export interface GuardOptions {
  /**
   * Skip the account-deletion lock. ONLY the account lifecycle routes
   * (/api/account/restore, /api/account/status) may set this — every other
   * route must stay locked once the tenant is in deletion_scheduled/anonymized.
   */
  bypassDeletionLock?: boolean;
}

/**
 * Verifies that the authenticated user is an actual member of the claimed org,
 * and that the org is not locked for deletion. This is the single chokepoint
 * all /api/* data routes pass through — the real enforcement of the
 * account-deletion soft-lock (frontend gating is UX only).
 *
 * Guards against cookie-spoofing: the kg_active_org cookie is not JWT-verified,
 * so this DB check is the authoritative membership gate for service-role routes.
 *
 * Returns GuardedContext on success, NextResponse (401/403) on failure.
 */
export async function guardOrgMember(
  context: AuthContext,
  options: GuardOptions = {}
): Promise<GuardedContext | NextResponse> {
  if (!context.isAuthenticated || !context.user || !context.activeOrganizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orgId = context.activeOrganizationId;
  const userId = context.user.id;

  const supabase = createServiceClient();
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Account-deletion soft-lock. A second indexed lookup (companies by
  // organization_id) — cheap and correctness-critical: once a tenant is
  // scheduled for deletion every data route must 403 until restore/cleanup.
  if (!options.bypassDeletionLock) {
    const { data: company } = await supabase
      .from('companies')
      .select('deletion_status')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (company && company.deletion_status && company.deletion_status !== 'active') {
      return NextResponse.json(
        {
          error: 'Dieses Konto ist zur Löschung vorgemerkt.',
          code: ACCOUNT_DELETION_SCHEDULED,
        },
        { status: 403 }
      );
    }
  }

  return { orgId, userId, role: member.role as OrgRole };
}

/**
 * Like guardOrgMember but additionally enforces that the caller has one of the
 * required roles. Returns 403 if the role is insufficient.
 */
export async function guardRole(
  context: AuthContext,
  allowedRoles: OrgRole[],
  options: GuardOptions = {}
): Promise<GuardedContext | NextResponse> {
  const result = await guardOrgMember(context, options);
  if (result instanceof NextResponse) return result;

  // owner has all admin privileges — treat it as admin for role checks
  const effectiveRole: OrgRole = result.role === 'owner' ? 'admin' : result.role;
  if (!allowedRoles.includes(effectiveRole) && !allowedRoles.includes(result.role)) {
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
  'name', 'job_profile_id', 'job_level_id', 'min_salary', 'max_salary', 'mid_salary',
  'currency', 'description', 'is_active', 'effective_from', 'effective_to',
] as const;

export const COMPANY_WRITE_FIELDS = [
  'name', 'legal_name', 'country', 'industry', 'employee_size_band',
  'reporting_frequency',
  'logo_url', 'default_currency', 'default_locale', 'default_timezone',
  'address', 'vat_id', 'billing_email',
] as const;
