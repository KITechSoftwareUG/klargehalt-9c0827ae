import { NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { createServiceClient } from '@/lib/supabase/server';
import { guardOrgMember } from '@/lib/auth/api-guard';

export async function GET() {
  try {
    const context = await getServerAuthContext();
    const guard = await guardOrgMember(context);
    if (guard instanceof NextResponse) return guard;

    const { orgId } = guard;

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('companies')
      .select(
        'subscription_tier, subscription_status, trial_ends_at, current_period_end, stripe_customer_id, stripe_subscription_id'
      )
      .eq('organization_id', orgId)
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
