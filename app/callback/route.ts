import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { handleSignIn, getLogtoContext } from '@logto/next/server-actions';
import { ACTIVE_ORG_COOKIE, getLogtoConfig } from '@/lib/logto';

export async function GET(request: NextRequest) {
  const config = getLogtoConfig();
  await handleSignIn(config, request.nextUrl.searchParams);

  const context = await getLogtoContext(config, { fetchUserInfo: true });
  const organizations = context.claims?.organizations ?? [];
  const cookieStore = await cookies();

  if (organizations.length > 0) {
    cookieStore.set(ACTIVE_ORG_COOKIE, organizations[0], {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  cookieStore.delete(ACTIVE_ORG_COOKIE);
  return NextResponse.redirect(new URL('/onboarding', request.url));
}
