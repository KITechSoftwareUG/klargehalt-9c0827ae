import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTrialEndingEmail } from '@/lib/email';

const supabaseAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = supabaseAdmin();

  // Query companies expiring in the 3-day window (2.5–3.5 days) and 1-day window (0.5–1.5 days)
  const windows = [
    { min: 2.5, max: 3.5 },
    { min: 0.5, max: 1.5 },
  ];

  let totalSent = 0;
  let totalCompanies = 0;

  for (const window of windows) {
    const windowMin = new Date(Date.now() + window.min * 24 * 60 * 60 * 1000).toISOString();
    const windowMax = new Date(Date.now() + window.max * 24 * 60 * 60 * 1000).toISOString();

    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, trial_ends_at')
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

      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id, profiles!inner(email, full_name)')
        .eq('organization_id', company.id)
        .eq('role', 'admin');

      if (!admins) continue;

      for (const admin of admins) {
        const profileRaw = admin.profiles as unknown;
        const profile = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as { email: string; full_name: string } | null;
        if (!profile?.email) continue;

        try {
          await sendTrialEndingEmail(profile.email, profile.full_name, daysLeft, company.name as string);
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
