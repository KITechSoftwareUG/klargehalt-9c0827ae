import { NextRequest, NextResponse } from 'next/server';
import { handleSignIn, getLogtoContext } from '@logto/next/server-actions';
import { getLogtoConfig } from '@/lib/logto';

export async function GET(request: NextRequest) {
  const config = getLogtoConfig();
  const baseUrl = config.baseUrl;

  try {
    await handleSignIn(config, request.nextUrl.searchParams);

    const context = await getLogtoContext(config);

    if (!context.isAuthenticated) {
      return NextResponse.redirect(new URL('/sign-in', baseUrl));
    }

    const organizations = context.claims?.organizations ?? [];
    const destination = organizations.length > 0 ? '/dashboard' : '/onboarding';

    return NextResponse.redirect(new URL(destination, baseUrl));
  } catch (error) {
    const err = error as Error & { code?: string; digest?: string };

    if (err.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }

    console.error('Callback error:', err.code, err.message);
    return NextResponse.redirect(new URL('/sign-in', baseUrl));
  }
}
