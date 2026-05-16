import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { getStripe } from '@/lib/stripe';
import { createClient as createSupabaseServiceClient } from '@supabase/supabase-js';
import { type SubscriptionTier, getStripePriceId, PLANS } from '@/lib/subscription';
import { checkRateLimit } from '@/lib/rate-limit';
import { guardRole } from '@/lib/auth/api-guard';
import { checkContractsAccepted } from '@/lib/contracts';

export async function POST(request: NextRequest) {
  try {
	    const context = await getServerAuthContext();
	    const guard = await guardRole(context, ['admin']);
	    if (guard instanceof NextResponse) return guard;

	    const rateLimitKey = `stripe-checkout:${guard.orgId}`;
	    if (!(await checkRateLimit(rateLimitKey, 10, 60 * 60 * 1000))) {
	      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
	    }

    // Use service role client to bypass RLS for the admin check.
    // The org token may not be available in API route context (Logto fetch),
    // which would cause org_id() to return NULL and block the RLS query.
    const serviceClient = createSupabaseServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

	    const { tier = 'professional', interval = 'monthly' } = (await request.json().catch(() => ({}))) as {
      tier?: SubscriptionTier;
      interval?: 'monthly' | 'yearly';
    };

    if (!PLANS[tier] || PLANS[tier].priceMonthly === null) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const priceId = getStripePriceId(tier, interval);
    if (!priceId) {
      return NextResponse.json({ error: 'Stripe price not configured for this plan' }, { status: 500 });
    }

    // Legal gate (BGB §305): no binding paid subscription may be created
    // without prior AGB/Datenschutz/AVV acceptance. This is the real,
    // non-bypassable enforcement — frontend gating is UX only.
    if (!(await checkContractsAccepted(guard.orgId, serviceClient))) {
      return NextResponse.json(
        {
          error: 'Bitte akzeptieren Sie zuerst die Vertragsbedingungen.',
          code: 'CONTRACTS_NOT_ACCEPTED',
          redirect: `/onboarding/contracts?checkout=${encodeURIComponent(tier)}&interval=${encodeURIComponent(interval)}&next=${encodeURIComponent('/abrechnung')}`,
        },
        { status: 403 },
      );
    }

    // Use service client — org JWT may lag after onboarding, causing RLS to block the query
    const { data: company } = await serviceClient
	      .from('companies')
	      .select('id, name, stripe_customer_id, stripe_subscription_id, subscription_status, organization_id')
	      .eq('organization_id', guard.orgId)
	      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

	    const stripe = getStripe();
	    let customerId = company.stripe_customer_id;

	    if (company.stripe_subscription_id && ['active', 'trialing', 'past_due'].includes(company.subscription_status ?? '')) {
	      return NextResponse.json(
	        { error: 'An active subscription already exists. Use the billing portal to change plans.' },
	        { status: 409 },
	      );
	    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: context.user?.email ?? undefined,
        name: company.name ?? undefined,
	        metadata: {
	          organization_id: guard.orgId,
	          company_id: company.id,
	        },
      });
      customerId = customer.id;

      await serviceClient
        .from('companies')
        .update({ stripe_customer_id: customerId })
        .eq('id', company.id);
    }

    const baseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.klargehalt.de';

    const session = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        mode: 'subscription',
        currency: 'eur',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${baseUrl}/dashboard?checkout=success`,
        cancel_url: `${baseUrl}/dashboard?checkout=canceled`,
	        metadata: {
	          organization_id: guard.orgId,
	          company_id: company.id,
	          tier,
        },
        locale: 'de',
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        tax_id_collection: { enabled: true },
        customer_update: { name: 'auto', address: 'auto' },
      },
	      { idempotencyKey: `checkout_${guard.orgId}_${tier}_${interval}_${Math.floor(Date.now() / (5 * 60 * 1000))}` }
	    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout: unexpected error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
