import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { ACTIVE_ORG_COOKIE } from '@/lib/logto';
import { createOrganizationWithMembership } from '@/lib/logto-management';

export async function POST(request: NextRequest) {
  const context = await getServerAuthContext();

  if (!context.isAuthenticated || !context.user) {
    return NextResponse.json(
      { error: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.' },
      { status: 401 }
    );
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
