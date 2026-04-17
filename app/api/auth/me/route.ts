import { NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { hasUserMfaEnrolled } from '@/lib/logto-management';

export async function GET() {
  const context = await getServerAuthContext();

  // Check MFA enrollment via Logto Management API (not via claims —
  // Logto does not include 'amr' in the ID token).
  // Only queried when authenticated; false otherwise.
  const mfaEnabled = context.isAuthenticated && context.user
    ? await hasUserMfaEnrolled(context.user.id)
    : false;

  return NextResponse.json({
    isAuthenticated: context.isAuthenticated,
    user: context.user,
    organizations: context.organizations,
    activeOrganizationId: context.activeOrganizationId,
    mfaEnabled,
  });
}
