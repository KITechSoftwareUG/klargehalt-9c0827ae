import { getStripe } from '@/lib/stripe';

/**
 * Soft-delete grace window. The tenant is locked + Stripe canceled immediately
 * on request; irreversible pseudonymization runs via the cleanup cron only
 * after this many days, leaving a recovery window (Sub-decision ③).
 */
export const ACCOUNT_DELETION_GRACE_DAYS = 30;

export type DeletionStatus = 'active' | 'deletion_scheduled' | 'anonymized';

/**
 * Schedule the Stripe subscription to end at the current period (Sub-decision ①
 * `cancel_at_period_end=true`) so reactivation within the grace window is a
 * clean un-cancel rather than a re-checkout. Best-effort: a Stripe failure must
 * NOT block the deletion request — the daily stripe-reconcile cron is the net.
 */
export async function scheduleStripeCancellation(
  stripeSubscriptionId: string | null | undefined,
): Promise<{ ok: boolean; error?: string }> {
  if (!stripeSubscriptionId) return { ok: true };
  try {
    await getStripe().subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    return { ok: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Stripe error';
    return { ok: false, error: message };
  }
}

/**
 * Undo a pending period-end cancellation on reactivation. Best-effort: if the
 * subscription already lapsed, Stripe throws — the user is told to re-subscribe.
 */
export async function reactivateStripeSubscription(
  stripeSubscriptionId: string | null | undefined,
): Promise<{ ok: boolean; error?: string }> {
  if (!stripeSubscriptionId) return { ok: true };
  try {
    await getStripe().subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
    return { ok: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Stripe error';
    return { ok: false, error: message };
  }
}
