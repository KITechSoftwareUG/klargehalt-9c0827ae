import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { ACTIVE_ORG_COOKIE } from '@/lib/logto';
import { createOrganizationWithMembership } from '@/lib/logto-management';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { logAuditEntry } from '@/lib/audit-log';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const context = await getServerAuthContext();

  if (!context.isAuthenticated || !context.user) {
    return NextResponse.json(
      { error: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.' },
      { status: 401 }
    );
  }

  const rateLimitKey = `org-create:${context.user.id}`;
  if (!(await checkRateLimit(rateLimitKey, 5, 60 * 60 * 1000))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { name } = await request.json();

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  try {
    const organization = await createOrganizationWithMembership({
      name,
      userId: context.user.id,
    });

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_ORG_COOKIE, organization.id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    // Insert admin role for org creator using service role (bypasses RLS / JWT-lag)
    const adminClient = createSupabaseAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data: existingRole } = await adminClient
      .from('user_roles')
      .select('id')
      .eq('user_id', context.user.id)
      .eq('organization_id', organization.id)
      .maybeSingle();

    if (!existingRole) {
      const { error: roleError } = await adminClient.from('user_roles').insert({
        user_id: context.user.id,
        organization_id: organization.id,
        role: 'admin',
      });
      if (roleError) {
        console.error('Failed to insert admin role for new org creator:', roleError);
      } else {
        void logAuditEntry(adminClient, {
          orgId: organization.id,
          userId: context.user.id,
          action: 'create',
          entityType: 'user_roles',
          entityId: context.user.id,
          afterState: { user_id: context.user.id, organization_id: organization.id, role: 'admin' },
        });
      }
    }

    return NextResponse.json({ organization });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Organisation konnte nicht erstellt werden.';
    console.error('Organization creation error:', message);

    // If user doesn't exist, tell the client to re-authenticate
    if (message.includes('User not found')) {
      return NextResponse.json(
        { error: 'Ihre Sitzung ist ungültig. Bitte melden Sie sich erneut an.', reauth: true },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
