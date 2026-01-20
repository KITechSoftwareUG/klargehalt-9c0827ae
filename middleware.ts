import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
    const url = request.nextUrl;
    const hostname = request.headers.get("host") || "";
    const pathname = url.pathname;

    // 1. App Subdomain Logic (app.klargehalt.de)
    if (hostname.startsWith("app.") || hostname.includes("-app-")) {

        // Redirect: app.klargehalt.de/ -> /dashboard
        if (pathname === "/") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        // Auth-Check for App-Subdomain
        if (!isPublicRoute(request)) {
            const authObj = await auth();
            if (!authObj.userId) {
                return authObj.redirectToSignIn();
            }
            if (!authObj.orgId && !pathname.startsWith('/onboarding')) {
                return NextResponse.redirect(new URL('/onboarding', request.url));
            }
        }

        return NextResponse.next();
    }

    // 2. Marketing Domain / Localhost Logic
    // Next.js automatically finds files in (marketing) or (app) if they are uniquely defined
    return NextResponse.next();
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
