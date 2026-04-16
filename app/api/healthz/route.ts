import { NextResponse } from 'next/server';

/**
 * GET /api/healthz
 *
 * Health check endpoint for Coolify. Validates that all required environment
 * variables are present at runtime. Returns 200 if healthy, 503 if misconfigured.
 *
 * Coolify health check URL should point to: https://app.klargehalt.de/api/healthz
 */

const REQUIRED_ENV_VARS = [
  'LOGTO_ENDPOINT',
  'LOGTO_APP_ID',
  'LOGTO_APP_SECRET',
  'LOGTO_COOKIE_SECRET',
  'LOGTO_M2M_APP_ID',
  'LOGTO_M2M_APP_SECRET',
  'APP_BASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_PRICE_BASIS_MONTHLY',
  'STRIPE_PRICE_BASIS_YEARLY',
  'STRIPE_PRICE_PROFESSIONAL_MONTHLY',
  'STRIPE_PRICE_PROFESSIONAL_YEARLY',
] as const;

export async function GET() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('Health check failed — missing env vars:', missing);
    return NextResponse.json(
      {
        status: 'unhealthy',
        missing_env_vars: missing,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
