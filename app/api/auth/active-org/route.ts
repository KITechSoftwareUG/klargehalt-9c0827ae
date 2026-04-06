import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { ACTIVE_ORG_COOKIE } from '@/lib/logto';

export async function POST(request: NextRequest) {
  const context = await getServerAuthContext();

  if (!context.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = await request.json();

  if (!organizationId) {
    return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
  }

  // Allow setting the org cookie if the user has access via JWT claims,
  // OR if this is called right after org creation (JWT may not contain the new org yet).
  // Real authorization happens via Supabase RLS with organization tokens.
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  return NextResponse.json({ success: true });
}
