/**
 * POST /api/auth/repair-role
 *
 * Self-healing endpoint: called by useAuth when a user has an active org
 * but no user_roles entry (can happen when onboarding's client-side insert
 * fails due to JWT-lag after org creation).
 *
 * Uses the service role key to bypass RLS and ensure the org creator always
 * gets an 'admin' role. Idempotent — safe to call multiple times.
 */

import { NextResponse } from 'next/server';
import { getOrganizationToken } from '@logto/next/server-actions';
import { getServerAuthContext } from '@/lib/auth/server';
import { getLogtoConfig } from '@/lib/logto';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { logAuditEntry } from '@/lib/audit-log';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST() {
  const context = await getServerAuthContext();

  if (!context.isAuthenticated || !context.user || !context.activeOrganizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: max 5 repair attempts per user per hour to prevent DB write abuse.
  const rateLimitKey = `repair-role:${context.user.id}`;
  if (!(await checkRateLimit(rateLimitKey, 5, 60 * 60 * 1000))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Verify against Logto directly. The active-org cookie is only a selector and
  // can lag JWT claims after onboarding, so claims alone cannot be the authority.
  const organizationToken = await getOrganizationToken(
    getLogtoConfig(),
    context.activeOrganizationId,
  ).catch(() => null);
  if (!organizationToken) {
    return NextResponse.json(
      { error: 'Forbidden: not a member of this organization' },
      { status: 403 }
    );
  }

  const adminClient = createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Check again server-side to be idempotent
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingRole } = await (adminClient as any)
    .from('organization_members')
    .select('id, role')
    .eq('user_id', context.user.id)
    .eq('organization_id', context.activeOrganizationId)
    .eq('status', 'active')
    .maybeSingle();

  if (existingRole) {
    return NextResponse.json({ role: existingRole.role, repaired: false });
  }

  // Determine the correct role: only the org creator gets 'admin'.
  // Check if this user created the company for this org; if not, default to 'employee'
  // to prevent privilege escalation for invited users whose role insert failed.
  const { data: company } = await adminClient
    .from('companies')
    .select('created_by')
    .eq('organization_id', context.activeOrganizationId)
    .maybeSingle();

  const isOrgCreator = company?.created_by === context.user.id;
  const assignedRole = isOrgCreator ? 'admin' : 'employee';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient as any).from('organization_members').insert({
    user_id: context.user.id,
    organization_id: context.activeOrganizationId,
    role: assignedRole,
    status: 'active',
  });

  if (error) {
    console.error('repair-role: insert failed', error);
    return NextResponse.json({ error: 'Failed to repair role' }, { status: 500 });
  }

  void logAuditEntry(adminClient, {
    orgId: context.activeOrganizationId,
    userId: context.user.id,
    action: 'create',
    entityType: 'organization_members',
    entityId: context.user.id,
    afterState: { user_id: context.user.id, organization_id: context.activeOrganizationId, role: assignedRole, repaired: true },
  });

  return NextResponse.json({ role: assignedRole, repaired: true });
}
