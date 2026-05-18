import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardOrgMember } from '@/lib/auth/api-guard';

// Self-service notification preferences for the authenticated user.
// Scoped by user_id from the auth context (never the body). Only
// genuinely optional categories are exposed — critical/transactional
// mail is not gateable.

interface Preferences {
  product_updates: boolean;
}

const DEFAULT_PREFS: Preferences = {
  product_updates: true,
};

const patchSchema = z
  .object({
    product_updates: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Keine Änderung übergeben',
  });

export async function GET() {
  const context = await getServerAuthContext();
  const guard = await guardOrgMember(context);
  if (guard instanceof NextResponse) return guard;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('user_notification_preferences')
    .select('product_updates')
    .eq('user_id', guard.userId)
    .maybeSingle();

  if (error) {
    console.error('notifications GET error:', { code: error.code });
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
  }

  return NextResponse.json({
    product_updates:
      (data?.product_updates as boolean | undefined) ??
      DEFAULT_PREFS.product_updates,
  });
}

export async function PATCH(request: NextRequest) {
  const context = await getServerAuthContext();
  const guard = await guardOrgMember(context);
  if (guard instanceof NextResponse) return guard;

  const { orgId, userId } = guard;

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

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('user_notification_preferences')
    .upsert(
      {
        user_id: userId,
        organization_id: orgId,
        ...parsed.data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (error) {
    console.error('notifications PATCH error:', { code: error.code });
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
