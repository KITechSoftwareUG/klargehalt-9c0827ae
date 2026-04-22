import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Trigger rebuild: 2026-04-22T00:00:00
  reactStrictMode: true,

  async redirects() {
    return [
      // Old /dashboard/* sub-routes → new clean German routes
      { source: '/dashboard/employees',          destination: '/mitarbeiter',    permanent: true },
      { source: '/dashboard/pay-bands',          destination: '/gehaltsbaender', permanent: true },
      { source: '/dashboard/job-profiles',       destination: '/jobprofile',     permanent: true },
      { source: '/dashboard/job-levels',         destination: '/karrierestufen', permanent: true },
      { source: '/dashboard/departments',        destination: '/abteilungen',    permanent: true },
      { source: '/dashboard/my-salary',          destination: '/mein-gehalt',    permanent: true },
      { source: '/dashboard/billing',            destination: '/abrechnung',     permanent: true },
      { source: '/dashboard/settings',           destination: '/einstellungen',  permanent: true },
      { source: '/dashboard/audit',              destination: '/audit',          permanent: true },
      { source: '/dashboard/admin',              destination: '/admin',          permanent: true },
      // Phase-2 routes → back to dashboard for now
      { source: '/dashboard/overview',           destination: '/dashboard',      permanent: false },
      { source: '/dashboard/pay-equity-hr',      destination: '/dashboard',      permanent: false },
      { source: '/dashboard/pay-equity-mgmt',    destination: '/dashboard',      permanent: false },
      { source: '/dashboard/reports',            destination: '/dashboard',      permanent: false },
      { source: '/dashboard/joint-assessment',   destination: '/dashboard',      permanent: false },
      { source: '/dashboard/job-postings',       destination: '/dashboard',      permanent: false },
      { source: '/dashboard/hr-requests',        destination: '/dashboard',      permanent: false },
      { source: '/dashboard/rights-notifications', destination: '/dashboard',    permanent: false },
      { source: '/dashboard/lawyer-reviews',     destination: '/dashboard',      permanent: false },
      { source: '/dashboard/requests',           destination: '/dashboard',      permanent: false },
    ];
  },

  // Expose non-secret env vars to Edge Runtime (middleware)
  env: {
    APP_BASE_URL: process.env.APP_BASE_URL,
    LOGTO_ENDPOINT: process.env.LOGTO_ENDPOINT,
    LOGTO_APP_ID: process.env.LOGTO_APP_ID,
  },

  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'btbucjkczpejplykyvkj.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "kitech-software-ug-haftungsbes",

  project: "klargehalt",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
