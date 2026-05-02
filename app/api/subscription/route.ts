import { NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { isAuthenticated, user, activeOrganizationId } = await getServerAuthContext();

    if (!isAuthenticated || !user || !activeOrganizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient(activeOrganizationId);

    const { data, error } = await supabase
      .from('companies')
      .select(
        'subscription_tier, subscription_status, trial_ends_at, current_period_end, stripe_customer_id, stripe_subscription_id'
      )
      .eq('organization_id', activeOrganizationId)
      .maybeSingle();

    if (error) {
      console.error('subscription GET error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('subscription GET unexpected:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
