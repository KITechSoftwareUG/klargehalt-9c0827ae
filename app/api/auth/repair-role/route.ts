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
import { getServerAuthContext } from '@/lib/auth/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

export async function POST() {
  const context = await getServerAuthContext();

  if (!context.isAuthenticated || !context.user || !context.activeOrganizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminClient = createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Check again server-side to be idempotent
  const { data: existingRole } = await adminClient
    .from('user_roles')
    .select('id, role')
    .eq('user_id', context.user.id)
    .eq('organization_id', context.activeOrganizationId)
    .maybeSingle();

  if (existingRole) {
    return NextResponse.json({ role: existingRole.role, repaired: false });
  }

  const { error } = await adminClient.from('user_roles').insert({
    user_id: context.user.id,
    organization_id: context.activeOrganizationId,
    role: 'admin',
  });

  if (error) {
    console.error('repair-role: insert failed', error);
    return NextResponse.json({ error: 'Failed to repair role' }, { status: 500 });
  }

  return NextResponse.json({ role: 'admin', repaired: true });
}
