import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardOrgMember, guardRole, pickFields, COMPANY_WRITE_FIELDS } from '@/lib/auth/api-guard';

export async function GET() {
  const context = await getServerAuthContext();
  const guard = await guardOrgMember(context);
  if (guard instanceof NextResponse) return guard;

  const { orgId } = guard;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('companies')
    .select('id, organization_id, name, legal_name, country, industry, employee_size_band, reporting_frequency, created_at, updated_at')
    .eq('organization_id', orgId)
    .maybeSingle();

  if (error) {
    console.error('company GET error:', error);
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['admin']);
  if (guard instanceof NextResponse) return guard;

  const { orgId, userId } = guard;
  const body = await request.json() as Record<string, unknown>;
  const safeBody = pickFields(body, COMPANY_WRITE_FIELDS);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('companies')
    .insert({ ...safeBody, organization_id: orgId, created_by: userId, country: (safeBody.country as string) ?? 'DE' })
    .select()
    .single();

  if (error) {
    console.error('company POST error:', error);
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['admin']);
  if (guard instanceof NextResponse) return guard;

  const { orgId } = guard;
  const body = await request.json() as Record<string, unknown>;
  const safeBody = pickFields(body, COMPANY_WRITE_FIELDS);
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('companies')
    .update({ ...safeBody, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId);

  if (error) {
    console.error('company PATCH error:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
