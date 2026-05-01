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
  'CRON_SECRET',
  'SUPER_ADMIN_USER_ID',
] as const;

function validateRequiredEnvVars() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    const msg = `[startup] Missing required environment variables: ${missing.join(', ')}`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg);
    }
    console.error(msg);
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
