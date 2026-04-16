import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServerAuthContext } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  const context = await getServerAuthContext();

  if (!context.isAuthenticated || !context.user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  const orgId = context.activeOrganizationId;
  if (!orgId) {
    return NextResponse.json({ error: 'Keine aktive Organisation' }, { status: 400 });
  }

  const { searchParams } = request.nextUrl;
  const jobProfileId = searchParams.get('job_profile_id');
  const jobLevelId = searchParams.get('job_level_id');

  if (!jobProfileId) {
    return NextResponse.json({ error: 'job_profile_id ist erforderlich' }, { status: 400 });
  }

  const supabase = await createClient(orgId);

  let query = supabase
    .from('pay_bands')
    .select('min_salary, max_salary, currency')
    .eq('organization_id', orgId)
    .eq('job_profile_id', jobProfileId)
    .eq('is_active', true);

  if (jobLevelId) {
    query = query.eq('job_level_id', jobLevelId);
  }

  const { data, error } = await query.limit(1).single();

  if (error || !data) {
    return NextResponse.json({ error: 'Kein passendes Gehaltsband gefunden' }, { status: 404 });
  }

  return NextResponse.json({
    min: data.min_salary,
    max: data.max_salary,
    currency: data.currency,
  });
}
