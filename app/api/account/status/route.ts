import { NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardOrgMember } from '@/lib/auth/api-guard';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/account/status — deletion-lifecycle state for the current org.
 *
 * Drives the /konto-gesperrt screen. Must bypass the deletion lock (the org IS
 * locked — this endpoint exists to explain that). Anonymized orgs have no
 * active members, so guardOrgMember naturally 403s — nothing left to show.
 */
export async function GET() {
  const context = await getServerAuthContext();
  const guard = await guardOrgMember(context, { bypassDeletionLock: true });
  if (guard instanceof NextResponse) return guard;

  const supabase = createServiceClient();
  const { data: company } = await supabase
    .from('companies')
    .select('name, deletion_status, deletion_scheduled_at')
    .eq('organization_id', guard.orgId)
    .maybeSingle();

  if (!company) {
    return NextResponse.json({ error: 'Unternehmen nicht gefunden.' }, { status: 404 });
  }

  return NextResponse.json({
    status: company.deletion_status ?? 'active',
    scheduledFor: company.deletion_scheduled_at ?? null,
    companyName: company.name ?? null,
    canRestore: guard.role === 'owner',
  });
}
