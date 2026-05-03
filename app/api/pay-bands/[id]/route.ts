import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole, pickFields, getCompanyId, PAY_BAND_WRITE_FIELDS } from '@/lib/auth/api-guard';
import { logAuditEntry } from '@/lib/audit-log';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['admin', 'hr_manager']);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const { orgId, userId } = guard;
  const body = await request.json() as Record<string, unknown>;
  const safeBody = pickFields(body, PAY_BAND_WRITE_FIELDS);
  const supabase = createServiceClient();

  const { data: oldData } = await supabase
    .from('pay_bands')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .single();

  if (!oldData) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { error } = await supabase
    .from('pay_bands')
    .update(safeBody)
    .eq('id', id)
    .eq('organization_id', orgId);

  if (error) {
    console.error('pay-bands PATCH error:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 });
  }

  const companyId = await getCompanyId(orgId, supabase);
  if (companyId) {
    void logAuditEntry(supabase, {
      orgId, companyId, userId,
      action: 'update',
      entityType: 'pay_bands',
      entityId: id,
      beforeState: oldData,
      afterState: safeBody,
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['admin', 'hr_manager']);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const { orgId, userId } = guard;
  const supabase = createServiceClient();

  const { data: oldData } = await supabase
    .from('pay_bands')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .single();

  if (!oldData) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { error } = await supabase
    .from('pay_bands')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId);

  if (error) {
    console.error('pay-bands DELETE error:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 });
  }

  const companyId = await getCompanyId(orgId, supabase);
  if (companyId) {
    void logAuditEntry(supabase, {
      orgId, companyId, userId,
      action: 'delete',
      entityType: 'pay_bands',
      entityId: id,
      beforeState: oldData,
    });
  }

  return NextResponse.json({ success: true });
}
