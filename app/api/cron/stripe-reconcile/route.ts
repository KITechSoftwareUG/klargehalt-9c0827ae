import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';
import { applyReconciliation } from '@/lib/stripe-reconcile';

const supabaseAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error('[cron] CRON_SECRET not configured — rejecting all requests');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }
  const incoming = request.headers.get('x-cron-secret') ?? '';
  const a = Buffer.from(incoming);
  const b = Buffer.from(expected);
  const valid = a.length === b.length && timingSafeEqual(a, b);
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const stripe = getStripe();

  try {
    const summary = await applyReconciliation(supabase, stripe, null);

    if (summary.failed > 0) {
      const failed = summary.results.filter((r) => !r.success);
      Sentry.captureMessage('stripe-reconcile cron: failures', {
        level: 'warning',
        tags: { route: 'cron_stripe_reconcile' },
        extra: { failed },
      });
    }

    console.log(
      `[cron] stripe-reconcile: fixed=${summary.fixed} failed=${summary.failed}`,
    );

    return NextResponse.json({
      ranAt: new Date().toISOString(),
      fixed: summary.fixed,
      failed: summary.failed,
      results: summary.results,
    });
  } catch (error) {
    console.error('[cron] stripe-reconcile failed', error);
    Sentry.captureException(error, { tags: { route: 'cron_stripe_reconcile' } });
    return NextResponse.json({ error: 'Reconcile failed' }, { status: 500 });
  }
}
