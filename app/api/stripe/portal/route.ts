import { NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { getStripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { guardRole } from '@/lib/auth/api-guard';

export async function POST() {
  try {
	    const context = await getServerAuthContext();
	    const guard = await guardRole(context, ['admin']);
	    if (guard instanceof NextResponse) return guard;

    const supabase = createServiceClient();

	    const { data: company } = await supabase
	      .from('companies')
	      .select('stripe_customer_id')
	      .eq('organization_id', guard.orgId)
	      .single();

    if (!company?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
    }

    const baseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.klargehalt.de';

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: company.stripe_customer_id,
      return_url: `${baseUrl}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe portal: unexpected error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
