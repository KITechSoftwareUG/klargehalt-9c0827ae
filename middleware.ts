import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
    '/',
    '/site(.*)',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
    const url = request.nextUrl;
    let hostname = request.headers.get("host")!.replace(".localhost:3000", `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`);

    // Special case for Vercel preview URLs
    if (hostname.includes("vercel.app")) {
        hostname = `${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`;
    }

    const searchParams = request.nextUrl.searchParams.toString();
    const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ""}`;

    // 1. App Subdomain Logic
    if (hostname === `app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`) {
        if (!isPublicRoute(request)) {
            await auth.protect();
        }
        return NextResponse.rewrite(new URL(`/(app)${path}`, request.url));
    }

    // 2. Marketing Domain Logic
    if (hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN || hostname === `www.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`) {
        return NextResponse.rewrite(new URL(`/(marketing)${path}`, request.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
