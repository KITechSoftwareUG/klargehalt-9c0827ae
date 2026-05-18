import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardOrgMember } from '@/lib/auth/api-guard';
import { logAuditEntry } from '@/lib/audit-log';

// DSGVO Art. 15 / 20 — personal data export for the authenticated user.
// Returns ONLY the caller's own account-level data (scoped by user_id from
// the auth context, never the body). Employee salary self-data is a
// separate concern (/mein-gehalt) and intentionally out of scope here.

export async function GET() {
  const context = await getServerAuthContext();
  const guard = await guardOrgMember(context);
  if (guard instanceof NextResponse) return guard;

  const { orgId, userId, role } = guard;
  const supabase = createServiceClient();

  const [profileRes, membershipsRes, prefsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('user_id, organization_id, full_name, email, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('organization_members')
      .select('organization_id, role, status, joined_at, access_expires_at, created_at')
      .eq('user_id', userId),
    supabase
      .from('user_notification_preferences')
      .select('product_updates, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  if (profileRes.error || membershipsRes.error || prefsRes.error) {
    console.error('profiles/me/export error:', {
      profile: profileRes.error?.code,
      memberships: membershipsRes.error?.code,
      prefs: prefsRes.error?.code,
    });
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
  }

  const payload = {
    meta: {
      export_type: 'personal_account_data',
      legal_basis: 'DSGVO Art. 15 / Art. 20',
      exported_at: new Date().toISOString(),
      user_id: userId,
    },
    profile: profileRes.data ?? null,
    organization_memberships: membershipsRes.data ?? [],
    notification_preferences: prefsRes.data ?? { product_updates: true },
  };

  void logAuditEntry(supabase, {
    orgId,
    userId,
    userEmail: context.user?.email ?? null,
    userRole: role,
    action: 'export',
    entityType: 'user',
    entityId: userId,
    entityName: 'Persönlicher Datenexport (DSGVO Art. 15)',
  });

  const filename = `klargehalt-meine-daten-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
