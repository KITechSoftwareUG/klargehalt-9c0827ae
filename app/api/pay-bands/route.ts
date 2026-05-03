import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardOrgMember, guardRole, pickFields, PAY_BAND_WRITE_FIELDS } from '@/lib/auth/api-guard';
import { logAuditEntry } from '@/lib/audit-log';

export async function GET(request: NextRequest) {
  const context = await getServerAuthContext();
  const guard = await guardOrgMember(context);
  if (guard instanceof NextResponse) return guard;

  const { orgId } = guard;
  const { searchParams } = request.nextUrl;
  const jobProfileId = searchParams.get('job_profile_id');
  const supabase = createServiceClient();

  let query = supabase
    .from('pay_bands')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at');

  if (jobProfileId) {
    query = query.eq('job_profile_id', jobProfileId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('pay-bands GET error:', error);
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['admin', 'hr_manager']);
  if (guard instanceof NextResponse) return guard;

  const { orgId, userId } = guard;
  const body = await request.json() as Record<string, unknown>;
  const safeBody = pickFields(body, PAY_BAND_WRITE_FIELDS);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('pay_bands')
    .insert({ ...safeBody, organization_id: orgId })
    .select()
    .single();

  if (error) {
    console.error('pay-bands POST error:', error);
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 });
  }

  void logAuditEntry(supabase, {
    orgId,
    userId,
    action: 'create',
    entityType: 'pay_bands',
    entityId: data.id,
    afterState: data,
  });

  return NextResponse.json(data, { status: 201 });
}
