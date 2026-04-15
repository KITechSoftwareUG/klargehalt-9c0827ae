import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationToken } from '@logto/next/server-actions';
import { getServerAuthContext } from '@/lib/auth/server';
import { ACTIVE_ORG_COOKIE, getLogtoConfig } from '@/lib/logto';

export async function POST(request: NextRequest) {
  const context = await getServerAuthContext();

  if (!context.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = await request.json();

  if (!organizationId) {
    return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
  }

  // Fast path: org is already confirmed in JWT claims.
  const isOrgInJwt = context.organizations.some((org) => org.id === organizationId);

  if (!isOrgInJwt) {
    // Slow path: JWT may lag after org creation (Logto only refreshes claims on next login).
    // Ask Logto directly — if it can issue an org token the user is a legitimate member.
    const token = await getOrganizationToken(getLogtoConfig(), organizationId).catch(() => null);
    if (!token) {
      return NextResponse.json(
        { error: 'Forbidden: not a member of this organization' },
        { status: 403 }
      );
    }
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  return NextResponse.json({ success: true });
}
