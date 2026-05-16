import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardOrgMember } from '@/lib/auth/api-guard';

export async function GET(request: NextRequest) {
  const context = await getServerAuthContext();
  // Tenant-isolation gate (Risk #1): the org filter below runs on a
  // service-role client; validate membership before trusting the cookie org.
  const guard = await guardOrgMember(context);
  if (guard instanceof NextResponse) return guard;
  const orgId = guard.orgId;

  const { searchParams } = request.nextUrl;
  const jobProfileId = searchParams.get('job_profile_id');
  const jobLevelId = searchParams.get('job_level_id');

  if (!jobProfileId) {
    return NextResponse.json({ error: 'job_profile_id ist erforderlich' }, { status: 400 });
  }

  const supabase = createServiceClient();

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
