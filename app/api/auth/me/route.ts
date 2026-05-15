import { NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { hasUserMfaEnrolled } from '@/lib/logto-management';
import { createServiceClient } from '@/lib/supabase/server';
import { isSuperAdminUserId } from '@/lib/auth/super-admin';

export async function GET() {
  const context = await getServerAuthContext();

  // Fetch profile full_name server-side via service role so the display name is
  // always available — regardless of org-JWT state, JWT lag, or private-window
  // fresh sessions where the client-side Supabase client has no org token yet.
  let profileFullName: string | null = null;
  if (context.isAuthenticated && context.user?.id) {
    const admin = createServiceClient();
    const { data } = await admin
      .from('profiles')
      .select('full_name')
      .eq('user_id', context.user.id)
      .maybeSingle();
    profileFullName = (data?.full_name as string | null) || null;
  }

  // Check MFA enrollment via Logto Management API (not via claims —
  // Logto does not include 'amr' in the ID token).
  // Only queried when authenticated; false otherwise.
  const mfaEnabled = process.env.NODE_ENV !== 'production' && process.env.KLARGEHALT_E2E_AUTH === '1'
    ? false
    : context.isAuthenticated && context.user
    ? await hasUserMfaEnrolled(context.user.id)
    : false;

  const user = context.user
    ? { ...context.user, fullName: profileFullName || context.user.fullName }
    : null;

  return NextResponse.json({
    isAuthenticated: context.isAuthenticated,
    user,
    organizations: context.organizations,
    activeOrganizationId: context.activeOrganizationId,
    mfaEnabled,
    isSuperAdmin: isSuperAdminUserId(context.user?.id),
  });
}
