import { NextRequest, NextResponse } from 'next/server';
import { handleSignIn } from '@logto/next/server-actions';
import { getLogtoConfig } from '@/lib/logto';

export async function GET(request: NextRequest) {
  const config = getLogtoConfig();
  const baseUrl = config.baseUrl;

  try {
    await handleSignIn(config, request.nextUrl.searchParams);
  } catch (error) {
    const err = error as Error & { code?: string; digest?: string };

    // Next.js redirect() throws a special error with digest 'NEXT_REDIRECT'
    // This is expected behavior, not an actual error
    if (err.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }

    console.error('Callback error:', err.code, err.message);
    return NextResponse.redirect(new URL('/sign-in', baseUrl));
  }

  return NextResponse.redirect(new URL('/dashboard', baseUrl));
}
