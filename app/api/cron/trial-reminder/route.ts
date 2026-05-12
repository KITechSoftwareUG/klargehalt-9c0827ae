import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTrialEndingEmail, sendMidTrialEmail } from '@/lib/email';

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

  // Query companies expiring in the 3-day window (2.5–3.5 days) and 1-day window (0.5–1.5 days)
  const windows: Array<{ min: number; max: number; type: 'mid_trial' | 'ending' }> = [
    { min: 8.5, max: 9.5, type: 'mid_trial' },
    { min: 2.5, max: 3.5, type: 'ending' },
    { min: 0.5, max: 1.5, type: 'ending' },
  ];

  let totalSent = 0;
  let totalCompanies = 0;

  for (const window of windows) {
    const windowMin = new Date(Date.now() + window.min * 24 * 60 * 60 * 1000).toISOString();
    const windowMax = new Date(Date.now() + window.max * 24 * 60 * 60 * 1000).toISOString();

    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, organization_id, name, trial_ends_at')
      .eq('subscription_status', 'trialing')
      .gte('trial_ends_at', windowMin)
      .lte('trial_ends_at', windowMax);

    if (error) {
      console.error('Cron trial-reminder: Failed to fetch companies', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!companies || companies.length === 0) continue;

    totalCompanies += companies.length;

    for (const company of companies) {
      const trialEndsAt = new Date(company.trial_ends_at as string);
      const daysLeft = Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: adminRoles } = await (supabase as any)
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', company.organization_id)
        .eq('status', 'active')
        .in('role', ['owner', 'admin']);

      if (!adminRoles || adminRoles.length === 0) continue;

      const userIds = adminRoles.map((r) => r.user_id as string);
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('email, full_name')
        .in('user_id', userIds);

      if (!adminProfiles) continue;

      for (const profile of adminProfiles) {
        if (!profile.email) continue;
        try {
          if (window.type === 'mid_trial') {
            await sendMidTrialEmail(profile.email, profile.full_name as string, company.name as string);
          } else {
            await sendTrialEndingEmail(profile.email, profile.full_name as string, daysLeft, company.name as string);
          }
          totalSent++;
        } catch (emailError) {
          console.error(`Cron trial-reminder: Failed to send to ${profile.email}`, emailError);
        }
      }
    }
  }

  console.log(`Cron trial-reminder: Sent ${totalSent} emails for ${totalCompanies} expiring trials`);
  return NextResponse.json({ sent: totalSent, companies: totalCompanies });
}
