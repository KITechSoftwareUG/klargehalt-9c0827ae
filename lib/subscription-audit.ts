import type { SupabaseClient } from '@supabase/supabase-js';
import type { SubscriptionTier } from './subscription';

type AuditEventType =
  | 'upgraded'
  | 'downgraded'
  | 'canceled'
  | 'renewed'
  | 'trial_started'
  | 'trial_expired'
  | 'payment_failed'
  | 'reactivated';

const TIER_RANK: Record<SubscriptionTier, number> = {
  basis: 1,
  professional: 2,
  enterprise: 3,
};

export interface SubscriptionChangeInput {
  organizationId: string;
  oldTier: SubscriptionTier | null;
  newTier: SubscriptionTier | null;
  oldStatus: string | null;
  newStatus: string | null;
  stripeEventId?: string | null;
  stripeInvoiceId?: string | null;
  initiatedByUserId?: string | null;
  notes?: string | null;
}

/**
 * Derive the audit event_type from old/new tier and status. Returns null when
 * nothing meaningful changed (caller should skip the audit write).
 */
export function deriveEventType(input: SubscriptionChangeInput): AuditEventType | null {
  const { oldTier, newTier, oldStatus, newStatus } = input;

  const tierChanged = oldTier !== newTier;
  const statusChanged = oldStatus !== newStatus;

  if (!tierChanged && !statusChanged) return null;

  if (tierChanged && newTier && oldTier) {
    return TIER_RANK[newTier] > TIER_RANK[oldTier] ? 'upgraded' : 'downgraded';
  }

  // First-time activation: no old tier → new tier
  if (tierChanged && newTier && !oldTier) return 'upgraded';

  // Status-only transitions
  if (statusChanged) {
    if (newStatus === 'past_due') return 'payment_failed';
    if (newStatus === 'canceled') return 'canceled';
    if (newStatus === 'trialing') return 'trial_started';
    if ((oldStatus === 'past_due' || oldStatus === 'canceled') && newStatus === 'active') {
      return 'reactivated';
    }
    if (oldStatus === 'trialing' && newStatus === 'active') return 'renewed';
    return 'renewed';
  }

  return null;
}

/**
 * Append-only insert into subscription_changes. Service-role only.
 * Never throws — audit failures are logged but do not break the webhook flow.
 */
export async function logSubscriptionChange(
  supabase: SupabaseClient,
  input: SubscriptionChangeInput,
  forcedEventType?: AuditEventType,
): Promise<void> {
  const eventType = forcedEventType ?? deriveEventType(input);
  if (!eventType) return;

  const { error } = await supabase.from('subscription_changes').insert({
    organization_id: input.organizationId,
    event_type: eventType,
    old_plan_id: input.oldTier,
    new_plan_id: input.newTier,
    old_status: input.oldStatus,
    new_status: input.newStatus,
    stripe_event_id: input.stripeEventId ?? null,
    stripe_invoice_id: input.stripeInvoiceId ?? null,
    initiated_by_user_id: input.initiatedByUserId ?? null,
    notes: input.notes ?? null,
  });

  if (error) {
    console.error('subscription-audit: failed to write subscription_changes', {
      organizationId: input.organizationId,
      eventType,
      error: error.message,
    });
  }
}
