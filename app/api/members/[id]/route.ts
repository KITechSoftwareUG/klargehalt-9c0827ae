import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole } from '@/lib/auth/api-guard';
import { createServiceClient } from '@/lib/supabase/server';
import { removeMemberFromOrg } from '@/lib/logto-management';

const patchSchema = z.object({
  role: z.enum(['admin', 'hr_manager']),
});

interface MemberRow {
  id: string;
  user_id: string;
  role: string;
  status: string;
}

async function loadMember(orgId: string, memberId: string): Promise<MemberRow | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('organization_members')
    .select('id, user_id, role, status')
    .eq('id', memberId)
    .eq('organization_id', orgId)
    .maybeSingle();
  return (data as MemberRow | null) ?? null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['admin']);
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Rolle — admin oder hr_manager erlaubt.' },
      { status: 400 }
    );
  }

  const member = await loadMember(guard.orgId, id);
  if (!member) {
    return NextResponse.json({ error: 'Mitglied nicht gefunden.' }, { status: 404 });
  }

  if (member.role === 'owner') {
    return NextResponse.json(
      { error: 'Die Owner-Rolle kann nicht geändert werden.' },
      { status: 403 }
    );
  }

  if (member.user_id === guard.userId) {
    return NextResponse.json(
      { error: 'Du kannst deine eigene Rolle nicht ändern.' },
      { status: 403 }
    );
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('organization_members')
    .update({ role: parsed.data.role })
    .eq('id', id)
    .eq('organization_id', guard.orgId);

  if (error) {
    const friendly = error.message.includes('seat limit')
      ? error.message
      : `Rolle konnte nicht geändert werden: ${error.message}`;
    return NextResponse.json({ error: friendly }, { status: 400 });
  }

  // Mirror legacy user_roles (post-MVP cleanup)
  try {
    await supabase
      .from('user_roles')
      .upsert(
        {
          user_id: member.user_id,
          organization_id: guard.orgId,
          role: parsed.data.role,
        },
        { onConflict: 'user_id,organization_id' }
      );
  } catch {
    // best-effort
  }

  return NextResponse.json({ success: true, role: parsed.data.role });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['admin']);
  if (guard instanceof NextResponse) return guard;

  const member = await loadMember(guard.orgId, id);
  if (!member) {
    return NextResponse.json({ error: 'Mitglied nicht gefunden.' }, { status: 404 });
  }

  if (member.role === 'owner') {
    return NextResponse.json(
      { error: 'Der Owner kann nicht entfernt werden.' },
      { status: 403 }
    );
  }

  if (member.user_id === guard.userId) {
    return NextResponse.json(
      { error: 'Du kannst dich nicht selbst entfernen.' },
      { status: 403 }
    );
  }

  const supabase = createServiceClient();

  // Soft-delete: keep row for audit, mark removed
  const { error } = await supabase
    .from('organization_members')
    .update({ status: 'removed' })
    .eq('id', id)
    .eq('organization_id', guard.orgId);

  if (error) {
    return NextResponse.json(
      { error: `Mitglied konnte nicht entfernt werden: ${error.message}` },
      { status: 500 }
    );
  }

  // Drop legacy user_roles row (best-effort)
  try {
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', member.user_id)
      .eq('organization_id', guard.orgId);
  } catch {
    // best-effort
  }

  // Best-effort: remove from Logto org so the JWT loses the org claim on next login
  try {
    await removeMemberFromOrg({ userId: member.user_id, orgId: guard.orgId });
  } catch {
    // non-fatal — DB row already marked removed, RLS will deny access
  }

  return NextResponse.json({ success: true });
}
