import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole, pickFields, DEPARTMENT_WRITE_FIELDS } from '@/lib/auth/api-guard';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['admin', 'hr_manager']);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const { orgId } = guard;
  const body = await request.json() as Record<string, unknown>;
  const safeBody = pickFields(body, DEPARTMENT_WRITE_FIELDS);
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('departments')
    .update(safeBody)
    .eq('id', id)
    .eq('organization_id', orgId);

  if (error) {
    console.error('departments PATCH error:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['admin', 'hr_manager']);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const { orgId } = guard;
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('departments')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId);

  if (error) {
    console.error('departments DELETE error:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
