import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const SUPER_ADMIN_USER_ID = 'zqf0ih9ji1m1'; // aalkh

const supabaseAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

interface DiscrepancyRecord {
  companyId: string;
  companyName: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripeStatus: string | null;
  stripeTier: string | null;
  appStatus: string;
  appTier: string;
  issue: string;
}

function mapPriceToTier(priceId: string): string {
  const mapping: Record<string, string> = {};
  const envPairs: [string, string][] = [
    ['STRIPE_PRICE_BASIS_MONTHLY', 'basis'],
    ['STRIPE_PRICE_BASIS_YEARLY', 'basis'],
    ['STRIPE_PRICE_PROFESSIONAL_MONTHLY', 'professional'],
    ['STRIPE_PRICE_PROFESSIONAL_YEARLY', 'professional'],
    ['STRIPE_PRICE_ENTERPRISE_MONTHLY', 'enterprise'],
    ['STRIPE_PRICE_ENTERPRISE_YEARLY', 'enterprise'],
  ];
  for (const [envKey, tier] of envPairs) {
    const val = process.env[envKey];
    if (val) mapping[val] = tier;
  }
  return mapping[priceId] ?? 'unknown';
}

export async function GET(request: NextRequest) {
  const auth = await getServerAuthContext();
  if (!auth?.user || auth.user.id !== SUPER_ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = supabaseAdmin();
  const stripe = getStripe();

  // Fetch all companies with a Stripe customer ID
  const { data: companies, error: dbError } = await supabase
    .from('companies')
    .select('id, name, stripe_customer_id, stripe_subscription_id, subscription_tier, subscription_status')
    .not('stripe_customer_id', 'is', null);

  if (dbError) {
    return NextResponse.json({ error: 'Database error', detail: dbError.message }, { status: 500 });
  }

  const discrepancies: DiscrepancyRecord[] = [];
  const ok: string[] = [];

  for (const company of companies ?? []) {
    const customerId = company.stripe_customer_id as string;

    let stripeSub: { id: string; status: string; tier: string } | null = null;

    try {
      // Check if we have a known subscription ID first
      if (company.stripe_subscription_id) {
        const sub = await stripe.subscriptions.retrieve(company.stripe_subscription_id as string);
        const priceId = sub.items.data[0]?.price?.id ?? '';
        stripeSub = {
          id: sub.id,
          status: sub.status,
          tier: mapPriceToTier(priceId),
        };
      } else {
        // Fall back to listing active subscriptions for the customer
        const subs = await stripe.subscriptions.list({ customer: customerId, limit: 1, status: 'all' });
        if (subs.data.length > 0) {
          const sub = subs.data[0];
          const priceId = sub.items.data[0]?.price?.id ?? '';
          stripeSub = {
            id: sub.id,
            status: sub.status,
            tier: mapPriceToTier(priceId),
          };
        }
      }
    } catch (err) {
      discrepancies.push({
        companyId: company.id as string,
        companyName: (company.name as string) ?? '(unknown)',
        stripeCustomerId: customerId,
        stripeSubscriptionId: null,
        stripeStatus: null,
        stripeTier: null,
        appStatus: company.subscription_status as string,
        appTier: company.subscription_tier as string,
        issue: `Stripe API error: ${err instanceof Error ? err.message : String(err)}`,
      });
      continue;
    }

    const appStatus = company.subscription_status as string;
    const appTier = company.subscription_tier as string;

    if (!stripeSub) {
      // No Stripe subscription — app should reflect this
      if (appStatus === 'active' || appStatus === 'past_due') {
        discrepancies.push({
          companyId: company.id as string,
          companyName: (company.name as string) ?? '(unknown)',
          stripeCustomerId: customerId,
          stripeSubscriptionId: null,
          stripeStatus: null,
          stripeTier: null,
          appStatus,
          appTier,
          issue: 'App shows active/past_due but no Stripe subscription found',
        });
      } else {
        ok.push(company.id as string);
      }
      continue;
    }

    const stripeStatusNorm = stripeSub.status === 'active' ? 'active'
      : stripeSub.status === 'past_due' ? 'past_due'
      : stripeSub.status === 'canceled' ? 'canceled'
      : stripeSub.status === 'trialing' ? 'trialing'
      : 'incomplete';

    const issues: string[] = [];
    if (stripeStatusNorm !== appStatus) {
      issues.push(`status mismatch: Stripe=${stripeStatusNorm} App=${appStatus}`);
    }
    if (stripeSub.tier !== 'unknown' && stripeSub.tier !== appTier) {
      issues.push(`tier mismatch: Stripe=${stripeSub.tier} App=${appTier}`);
    }

    if (issues.length > 0) {
      discrepancies.push({
        companyId: company.id as string,
        companyName: (company.name as string) ?? '(unknown)',
        stripeCustomerId: customerId,
        stripeSubscriptionId: stripeSub.id,
        stripeStatus: stripeSub.status,
        stripeTier: stripeSub.tier,
        appStatus,
        appTier,
        issue: issues.join('; '),
      });
    } else {
      ok.push(company.id as string);
    }
  }

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    total: (companies ?? []).length,
    ok: ok.length,
    discrepancyCount: discrepancies.length,
    discrepancies,
  });
}
