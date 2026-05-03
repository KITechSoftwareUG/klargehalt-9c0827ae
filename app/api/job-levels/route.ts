import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardOrgMember, guardRole, pickFields, JOB_LEVEL_WRITE_FIELDS } from '@/lib/auth/api-guard';

export async function GET() {
  const context = await getServerAuthContext();
  const guard = await guardOrgMember(context);
  if (guard instanceof NextResponse) return guard;

  const { orgId } = guard;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('job_levels')
    .select('id, organization_id, name, rank')
    .eq('organization_id', orgId)
    .order('rank');

  if (error) {
    console.error('job-levels GET error:', error);
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['admin', 'hr_manager']);
  if (guard instanceof NextResponse) return guard;

  const { orgId } = guard;
  const body = await request.json() as Record<string, unknown>;
  const safeBody = pickFields(body, JOB_LEVEL_WRITE_FIELDS);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('job_levels')
    .insert({ ...safeBody, organization_id: orgId })
    .select()
    .single();

  if (error) {
    console.error('job-levels POST error:', error);
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
