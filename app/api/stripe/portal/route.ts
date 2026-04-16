import { NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST() {
  try {
    const context = await getServerAuthContext();
    if (!context.isAuthenticated || !context.activeOrganizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can manage billing
    const { data: userRole } = await supabaseAdmin()
      .from('user_roles')
      .select('role')
      .eq('user_id', context.user!.id)
      .eq('organization_id', context.activeOrganizationId)
      .maybeSingle();

    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can manage billing' }, { status: 403 });
    }

    const supabase = supabaseAdmin();
    const { data: company } = await supabase
      .from('companies')
      .select('stripe_customer_id')
      .eq('organization_id', context.activeOrganizationId)
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
