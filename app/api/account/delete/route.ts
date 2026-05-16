import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole } from '@/lib/auth/api-guard';
import { createServiceClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEntry } from '@/lib/audit-log';
import {
  ACCOUNT_DELETION_GRACE_DAYS,
  scheduleStripeCancellation,
} from '@/lib/account-deletion';
import { sendAccountDeletionScheduledEmail } from '@/lib/email';

/**
 * POST /api/account/delete — Owner schedules tenant deletion.
 *
 * Soft-delete: the tenant is locked immediately (api-guard) + Stripe canceled
 * at period end; irreversible pseudonymization runs via the cleanup cron after
 * ACCOUNT_DELETION_GRACE_DAYS. The compliance trail is retained per
 * EU 2023/970 — see docs/account-deletion-fk-map.md.
 *
 * Owner-only (a non-owner admin cannot close the tenant). Double confirmation:
 * exact company name + two explicit acknowledgements.
 */
const bodySchema = z.object({
  confirmCompanyName: z.string().min(1),
  ackDataLoss: z.literal(true),
  ackIrreversible: z.literal(true),
  reason: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  const context = await getServerAuthContext();
  // bypassDeletionLock: re-calling delete on an already-locked org must hit
  // the idempotent "alreadyScheduled" path below, not a generic 403 from the
  // lock itself. The conditional UPDATE (status='active') is the real guard.
  const guard = await guardRole(context, ['owner'], { bypassDeletionLock: true });
  if (guard instanceof NextResponse) return guard;

  if (!(await checkRateLimit(`account-delete:${guard.orgId}`, 3, 60 * 60 * 1000))) {
    return NextResponse.json({ error: 'Zu viele Anfragen.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Bitte bestätigen Sie alle Pflichtfelder.' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data: company } = await supabase
    .from('companies')
    .select('id, name, deletion_status, stripe_subscription_id')
    .eq('organization_id', guard.orgId)
    .maybeSingle();

  if (!company) {
    return NextResponse.json({ error: 'Unternehmen nicht gefunden.' }, { status: 404 });
  }

  // Exact company-name confirmation (case-insensitive, trimmed).
  const typed = parsed.data.confirmCompanyName.trim().toLowerCase();
  const actual = (company.name ?? '').trim().toLowerCase();
  if (!actual || typed !== actual) {
    return NextResponse.json(
      { error: 'Der eingegebene Firmenname stimmt nicht überein.' },
      { status: 400 }
    );
  }

  // Best-effort Stripe cancel (cancel_at_period_end). A Stripe failure must NOT
  // block the deletion request — the daily stripe-reconcile cron is the net.
  const stripeResult = await scheduleStripeCancellation(company.stripe_subscription_id);
  if (!stripeResult.ok) {
    console.error(
      '[account/delete] Stripe cancel failed (continuing):',
      guard.orgId,
      stripeResult.error?.slice(0, 120)
    );
  }

  const scheduledFor = new Date();
  scheduledFor.setDate(scheduledFor.getDate() + ACCOUNT_DELETION_GRACE_DAYS);

  // Conditional update — re-entrancy guard against double-submit / race.
  const { data: updated, error: updErr } = await supabase
    .from('companies')
    .update({
      deletion_status: 'deletion_scheduled',
      deletion_scheduled_at: scheduledFor.toISOString(),
      deletion_requested_by: guard.userId,
      deletion_reason: parsed.data.reason ?? null,
    })
    .eq('organization_id', guard.orgId)
    .eq('deletion_status', 'active')
    .select('id')
    .maybeSingle();

  if (updErr) {
    console.error('[account/delete] update failed:', guard.orgId, updErr.message);
    return NextResponse.json(
      { error: 'Löschung konnte nicht vorgemerkt werden.' },
      { status: 500 }
    );
  }
  if (!updated) {
    // Lost the race — already scheduled between our read and write.
    return NextResponse.json({ success: true, alreadyScheduled: true });
  }

  // Audit log (mandatory — itself part of the retained frozen trail).
  await logAuditEntry(supabase, {
    orgId: guard.orgId,
    companyId: company.id,
    userId: guard.userId,
    userEmail: context.user?.email ?? null,
    userRole: guard.role,
    action: 'delete',
    entityType: 'company',
    entityId: company.id,
    entityName: company.name,
    metadata: {
      kind: 'account_deletion_scheduled',
      scheduled_for: scheduledFor.toISOString(),
      stripe_cancel_ok: stripeResult.ok,
      reason: parsed.data.reason ?? null,
    },
  });

  // Confirmation email — recovery affordance + security signal if the owner
  // account was compromised. Best-effort.
  const ownerEmail = context.user?.email ?? null;
  if (ownerEmail) {
    try {
      await sendAccountDeletionScheduledEmail(
        ownerEmail,
        company.name ?? 'Ihr Unternehmen',
        scheduledFor.toLocaleDateString('de-DE', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      );
    } catch {
      console.error('[account/delete] confirmation email failed (non-fatal):', guard.orgId);
    }
  }

  return NextResponse.json({
    success: true,
    scheduledFor: scheduledFor.toISOString(),
  });
}
