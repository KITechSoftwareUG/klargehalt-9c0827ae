import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
    const url = request.nextUrl;
    const hostname = request.headers.get("host") || "";
    const searchParams = request.nextUrl.searchParams.toString();
    const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ""}`;

    // 1. App Subdomain Logic (app.klargehalt.de)
    // We check for "app." or specialized dev hostnames if needed
    if (hostname.startsWith("app.") || hostname.includes("-app-")) {
        // Force authentication for the app subdomain (except public sign-in/up)
        if (!isPublicRoute(request)) {
            const authObj = await auth();
            const { userId, orgId } = authObj;

            // Redirect to sign-in if not authenticated
            if (!userId) {
                return authObj.redirectToSignIn();
            }

            // If user is logged in but has no orgId, and is NOT on onboarding, redirect to onboarding
            // Note: In an Organization-first model, we must have an orgId to access data
            if (!orgId && !url.pathname.startsWith('/onboarding')) {
                return NextResponse.redirect(new URL('/onboarding', request.url));
            }
        }

        // Redirect root "/ " on app subdomain to "/dashboard"
        if (url.pathname === "/") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        // Internal rewrite to the (app) route group folder
        return NextResponse.rewrite(new URL(`/(app)${path}`, request.url));
    }

    // 2. Marketing Domain Logic (klargehalt.de / localhost)
    // Internal rewrite to the (marketing) route group folder
    return NextResponse.rewrite(new URL(`/(marketing)${path}`, request.url));
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
