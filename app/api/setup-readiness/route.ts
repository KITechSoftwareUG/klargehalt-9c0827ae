import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardOrgMember } from '@/lib/auth/api-guard';

export async function GET() {
  const context = await getServerAuthContext();
  const guard = await guardOrgMember(context);
  if (guard instanceof NextResponse) return guard;

  const { orgId } = guard;
  const supabase = createServiceClient();

  const [deptResult, levelsResult, profilesResult, bandsResult, employeesResult] =
    await Promise.all([
      supabase.from('departments').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('job_levels').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('job_profiles').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('pay_bands').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('employees').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_active', true),
    ]);

  return NextResponse.json({
    departments: deptResult.count ?? 0,
    levels: levelsResult.count ?? 0,
    profiles: profilesResult.count ?? 0,
    bands: bandsResult.count ?? 0,
    employees: employeesResult.count ?? 0,
  });
}
