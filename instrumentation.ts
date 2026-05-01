import * as Sentry from "@sentry/nextjs";

const REQUIRED_ENV_VARS = [
  'RESEND_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'LOGTO_ENDPOINT',
  'LOGTO_APP_ID',
  'LOGTO_APP_SECRET',
  'LOGTO_COOKIE_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
] as const;

function validateRequiredEnvVars() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // Log but don't throw — a missing optional service key shouldn't crash the app;
    // individual service modules (email.ts, stripe, etc.) throw at call time.
    console.error(`[startup] Missing required environment variables: ${missing.join(', ')}`);
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
    validateRequiredEnvVars();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
