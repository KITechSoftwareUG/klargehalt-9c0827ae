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

    // Normalize path to prevent double slashes
    const pathname = url.pathname;
    const searchParams = url.searchParams.toString();
    const fullPath = `${pathname}${searchParams ? `?${searchParams}` : ""}`;

    // 1. App Subdomain Logic (app.klargehalt.de)
    if (hostname.startsWith("app.") || hostname.includes("-app-")) {

        // Auth-Check für App-Subdomain
        if (!isPublicRoute(request)) {
            const authObj = await auth();
            if (!authObj.userId) {
                return authObj.redirectToSignIn();
            }
            if (!authObj.orgId && !pathname.startsWith('/onboarding')) {
                return NextResponse.redirect(new URL('/onboarding', request.url));
            }
        }

        // Redirect: app.klargehalt.de/ -> /dashboard
        if (pathname === "/") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        // Rewrite to (app) group folder
        // For /dashboard, this becomes /(app)/dashboard
        // We use the URL constructor properly to avoid slash issues
        url.pathname = `/(app)${pathname}`;
        return NextResponse.rewrite(url);
    }

    // 2. Marketing Domain Logic (klargehalt.de & others)
    // Avoid double slashes and rewrite to (marketing)
    url.pathname = `/(marketing)${pathname}`;
    return NextResponse.rewrite(url);
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
