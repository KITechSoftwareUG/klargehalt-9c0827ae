import LogtoClient from '@logto/next/edge';
import { NextResponse } from 'next/server';
import { ACTIVE_ORG_COOKIE, getLogtoConfig } from '@/lib/logto';

const isAuthRoute = (pathname: string) =>
  pathname.startsWith('/sign-in') ||
  pathname.startsWith('/sign-up');

const isSkipAuthCheck = (pathname: string) =>
  pathname === '/' ||
  pathname.startsWith('/auth/') ||
  pathname.startsWith('/callback') ||
  pathname.startsWith('/api/auth/');

export default async function middleware(request: Request) {
  const client = new LogtoClient(getLogtoConfig());
  const nextRequest = request as Parameters<typeof client.getLogtoContext>[0];
  const url = nextRequest.nextUrl;
  const hostname = nextRequest.headers.get('host') || '';
  const pathname = url.pathname;

  if (hostname.startsWith('app.') || hostname.includes('-app-')) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', nextRequest.url));
    }

    // Skip auth check for auth flow routes (callback, sign-out, etc.)
    if (isSkipAuthCheck(pathname)) {
      return NextResponse.next();
    }

    const context = await client.getLogtoContext(nextRequest);

    // Authenticated user on sign-in/sign-up → redirect to dashboard
    if (isAuthRoute(pathname)) {
      if (context.isAuthenticated) {
        return NextResponse.redirect(new URL('/dashboard', nextRequest.url));
      }
      return NextResponse.next();
    }

    // Protected routes: require authentication
    if (!context.isAuthenticated) {
      return NextResponse.redirect(new URL('/sign-in', nextRequest.url));
    }

    const organizations = context.claims?.organizations ?? [];
    const activeOrganizationId = nextRequest.cookies.get(ACTIVE_ORG_COOKIE)?.value;

    // Validate cookie: if the stored org is not in the user's actual orgs, clear it
    const isValidOrg = activeOrganizationId && organizations.includes(activeOrganizationId);

    if (isValidOrg) {
      return NextResponse.next();
    }

    // User has orgs but no (valid) cookie → set cookie to first org
    if (organizations.length > 0) {
      const response = NextResponse.next();
      response.cookies.set(ACTIVE_ORG_COOKIE, organizations[0], {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
      // Clear stale cookie if it was invalid
      if (activeOrganizationId && !isValidOrg) {
        response.cookies.set(ACTIVE_ORG_COOKIE, organizations[0], {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        });
      }
      return response;
    }

    // No orgs at all → must go through onboarding
    if (pathname.startsWith('/onboarding')) {
      return NextResponse.next();
    }

    // Clear any stale cookie and redirect to onboarding
    const response = NextResponse.redirect(new URL('/onboarding', nextRequest.url));
    if (activeOrganizationId) {
      response.cookies.delete(ACTIVE_ORG_COOKIE);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
