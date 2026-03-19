import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { handleSignIn } from '@logto/next/server-actions';
import { ACTIVE_ORG_COOKIE, getLogtoConfig } from '@/lib/logto';

export async function GET(request: NextRequest) {
  const config = getLogtoConfig();

  try {
    await handleSignIn(config, request.nextUrl.searchParams);
  } catch (error) {
    console.error('Callback handleSignIn error:', error);
    // If sign-in session is lost, redirect to sign-in to start fresh
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // After successful sign-in, check organizations via /api/auth/me
  // We can't call getLogtoContext here reliably, so redirect and let
  // the client-side AuthProvider handle org detection
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
