import { NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole } from '@/lib/auth/api-guard';
import { createServiceClient } from '@/lib/supabase/server';
import { logAuditEntry } from '@/lib/audit-log';
import { reactivateStripeSubscription } from '@/lib/account-deletion';
import { sendAccountRestoredEmail } from '@/lib/email';

/**
 * POST /api/account/restore — Owner reactivates a tenant within the grace
 * window. Bypasses the deletion lock (the org is intentionally locked).
 * Irreversible once anonymized by the cleanup cron.
 */
export async function POST() {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['owner'], { bypassDeletionLock: true });
  if (guard instanceof NextResponse) return guard;

  const supabase = createServiceClient();
  const { data: company } = await supabase
    .from('companies')
    .select('id, name, deletion_status, stripe_subscription_id')
    .eq('organization_id', guard.orgId)
    .maybeSingle();

  if (!company) {
    return NextResponse.json({ error: 'Unternehmen nicht gefunden.' }, { status: 404 });
  }

  if (company.deletion_status === 'active' || !company.deletion_status) {
    return NextResponse.json({ success: true, alreadyActive: true });
  }
  if (company.deletion_status === 'anonymized') {
    return NextResponse.json(
      {
        error:
          'Dieses Konto wurde bereits endgültig gelöscht und kann nicht wiederhergestellt werden.',
      },
      { status: 410 }
    );
  }

  // status === 'deletion_scheduled' → recoverable.
  const stripeResult = await reactivateStripeSubscription(company.stripe_subscription_id);
  if (!stripeResult.ok) {
    console.error(
      '[account/restore] Stripe reactivate failed (continuing):',
      guard.orgId,
      stripeResult.error
    );
  }

  const { data: updated, error: updErr } = await supabase
    .from('companies')
    .update({
      deletion_status: 'active',
      deletion_scheduled_at: null,
      deletion_requested_by: null,
      deletion_reason: null,
    })
    .eq('organization_id', guard.orgId)
    .eq('deletion_status', 'deletion_scheduled')
    .select('id')
    .maybeSingle();

  if (updErr) {
    console.error('[account/restore] update failed:', guard.orgId, updErr.message);
    return NextResponse.json(
      { error: 'Reaktivierung fehlgeschlagen.' },
      { status: 500 }
    );
  }
  if (!updated) {
    // Lost the race (cron anonymized it in the meantime).
    return NextResponse.json(
      {
        error:
          'Dieses Konto wurde zwischenzeitlich endgültig gelöscht und kann nicht wiederhergestellt werden.',
      },
      { status: 410 }
    );
  }

  await logAuditEntry(supabase, {
    orgId: guard.orgId,
    companyId: company.id,
    userId: guard.userId,
    userEmail: context.user?.email ?? null,
    userRole: guard.role,
    action: 'update',
    entityType: 'company',
    entityId: company.id,
    entityName: company.name,
    metadata: {
      kind: 'account_deletion_restored',
      stripe_reactivate_ok: stripeResult.ok,
    },
  });

  const ownerEmail = context.user?.email ?? null;
  if (ownerEmail) {
    try {
      await sendAccountRestoredEmail(ownerEmail, company.name ?? 'Ihr Unternehmen');
    } catch {
      console.error('[account/restore] email failed (non-fatal):', guard.orgId);
    }
  }

  return NextResponse.json({ success: true, stripeReactivated: stripeResult.ok });
}
