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
  pathname.startsWith('/api/auth/') ||
  pathname.startsWith('/api/healthz') ||
  pathname.startsWith('/api/webhooks/');

/**
 * Prevent the browser from serving cached authenticated pages when the user
 * navigates back after signing out. Without this header, Next.js HTML can be
 * replayed from the bfcache / disk cache showing stale dashboard state.
 */
const applyNoStore = (response: NextResponse): NextResponse => {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
};

export default async function middleware(request: Request) {
  const client = new LogtoClient(getLogtoConfig());
  const nextRequest = request as Parameters<typeof client.getLogtoContext>[0];
  const url = nextRequest.nextUrl;
  const hostname = nextRequest.headers.get('host') || '';
  const pathname = url.pathname;

  if (hostname.startsWith('app.') || hostname.includes('.app.') || hostname.includes('-app-')) {
    if (pathname === '/') {
      return applyNoStore(NextResponse.redirect(new URL('/dashboard', nextRequest.url)));
    }

    // Skip auth check for auth flow routes (callback, sign-out, sign-in, sign-up, etc.)
    // Auth routes are always accessible — the server-side auth context (/api/auth/me)
    // is the source of truth, not the edge middleware's cookie check.
    if (isSkipAuthCheck(pathname) || isAuthRoute(pathname)) {
      return applyNoStore(NextResponse.next());
    }

    const context = await client.getLogtoContext(nextRequest);

    // Protected routes: require authentication
    if (!context.isAuthenticated) {
      return applyNoStore(NextResponse.redirect(new URL('/sign-in', nextRequest.url)));
    }

    const jwtOrganizations = context.claims?.organizations ?? [];
    const activeOrganizationId = nextRequest.cookies.get(ACTIVE_ORG_COOKIE)?.value;

    // Trust the cookie if it exists — the org was set by our server-side API
    // (JWT may lag behind after org creation since Logto only updates it on re-login)
    // Real security enforcement happens via Supabase RLS, not middleware
    if (activeOrganizationId) {
      return applyNoStore(NextResponse.next());
    }

    // No cookie but JWT has orgs → set cookie to first org
    if (jwtOrganizations.length > 0) {
      const response = NextResponse.next();
      response.cookies.set(ACTIVE_ORG_COOKIE, jwtOrganizations[0], {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
      return applyNoStore(response);
    }

    // No org cookie AND no JWT orgs → onboarding required
    if (pathname.startsWith('/onboarding')) {
      return applyNoStore(NextResponse.next());
    }

    return applyNoStore(NextResponse.redirect(new URL('/onboarding', nextRequest.url)));
  }

  return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
