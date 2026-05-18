import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardOrgMember } from '@/lib/auth/api-guard';
import { logAuditEntry } from '@/lib/audit-log';

// Self-service profile update for the authenticated user.
// Any active org member may edit their OWN display name. Scoping is by
// user_id from the auth context (never from the body) — profiles.user_id is
// UNIQUE, so this cannot touch another user's row. Email stays owned by
// Logto (the IdP) and is intentionally not writable here.

const patchSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, 'Name darf nicht leer sein')
    .max(120, 'Name ist zu lang (max. 120 Zeichen)'),
});

export async function PATCH(request: NextRequest) {
  const context = await getServerAuthContext();
  const guard = await guardOrgMember(context);
  if (guard instanceof NextResponse) return guard;

  const { orgId, userId, role } = guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe' },
      { status: 400 },
    );
  }

  const fullName = parsed.data.full_name;
  const supabase = createServiceClient();

  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('user_id', userId)
    .maybeSingle();

  if (readError) {
    console.error('profiles/me PATCH read error:', {
      code: readError.code,
      message: readError.message,
    });
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
  }

  const previousName = (existing?.full_name as string | null) ?? null;

  if (existing) {
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) {
      console.error('profiles/me PATCH update error:', {
        code: error.code,
        message: error.message,
      });
      return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from('profiles').insert({
      user_id: userId,
      organization_id: orgId,
      email: context.user?.email ?? null,
      full_name: fullName,
    });

    if (error) {
      console.error('profiles/me PATCH insert error:', {
        code: error.code,
        message: error.message,
      });
      return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 });
    }
  }

  // Fire-and-forget audit entry — never blocks the response.
  void logAuditEntry(supabase, {
    orgId,
    userId,
    userEmail: context.user?.email ?? null,
    userRole: role,
    action: 'update',
    entityType: 'user',
    entityId: userId,
    entityName: fullName,
    beforeState: { full_name: previousName },
    afterState: { full_name: fullName },
  });

  return NextResponse.json({ success: true, full_name: fullName });
}
