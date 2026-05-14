import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import type { SubscriptionTier } from '@/lib/subscription';
import { sendPaymentFailedEmail, sendSubscriptionConfirmedEmail } from '@/lib/email';
import { logSubscriptionChange } from '@/lib/subscription-audit';

const supabaseAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

class UnmappedPriceError extends Error {
  constructor(public priceId: string) {
    super(`Unmapped Stripe price ID: ${priceId}. Configure the matching STRIPE_PRICE_* env var.`);
    this.name = 'UnmappedPriceError';
  }
}

function mapPriceToTier(priceId: string): SubscriptionTier {
  const envPairs: [string, SubscriptionTier][] = [
    ['STRIPE_PRICE_BASIS_MONTHLY', 'basis'],
    ['STRIPE_PRICE_BASIS_YEARLY', 'basis'],
    ['STRIPE_PRICE_PROFESSIONAL_MONTHLY', 'professional'],
    ['STRIPE_PRICE_PROFESSIONAL_YEARLY', 'professional'],
    ['STRIPE_PRICE_ENTERPRISE_MONTHLY', 'enterprise'],
    ['STRIPE_PRICE_ENTERPRISE_YEARLY', 'enterprise'],
  ];

  for (const [envKey, tier] of envPairs) {
    if (process.env[envKey] === priceId) return tier;
  }

  throw new UnmappedPriceError(priceId);
}

type CompanyState = {
  id: string;
  name: string | null;
  organization_id: string | null;
  subscription_tier: SubscriptionTier;
  subscription_status: string;
};

async function fetchCompanyByCustomer(
  supabase: ReturnType<typeof supabaseAdmin>,
  customerId: string,
): Promise<CompanyState | null> {
  const { data } = await supabase
    .from('companies')
    .select('id, name, organization_id, subscription_tier, subscription_status')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  return (data as CompanyState | null) ?? null;
}

async function notifyAdmins(
  supabase: ReturnType<typeof supabaseAdmin>,
  organizationId: string,
  send: (email: string, fullName: string) => Promise<void>,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: admins } = await (supabase as any)
    .from('organization_members')
    .select('user_id, profiles!inner(email, full_name)')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .in('role', ['owner', 'admin']);

  for (const admin of admins ?? []) {
    const profileRaw = admin.profiles as unknown;
    const profile = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as
      | { email: string; full_name: string }
      | null;
    if (!profile?.email) continue;
    try {
      await send(profile.email, profile.full_name);
    } catch (emailError) {
      console.error('Stripe webhook: admin notification failed', emailError);
    }
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Stripe webhook: STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const stripe = getStripe();
  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook: Signature verification failed', err);
    Sentry.captureException(err, { tags: { route: 'webhook_stripe', stage: 'signature_verify' } });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  try {
    // Idempotency: skip already-processed events
    const { data: alreadyProcessed } = await supabase
      .from('processed_stripe_events')
      .select('event_id')
      .eq('event_id', event.id)
      .maybeSingle();

    if (alreadyProcessed) {
      console.log(`Stripe webhook: duplicate event ${event.id}, skipping`);
      return NextResponse.json({ received: true });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const tier = (session.metadata?.tier as SubscriptionTier) ?? 'basis';

        const previous = await fetchCompanyByCustomer(supabase, customerId);

        const { data: updated, error: errUpdate } = await supabase
          .from('companies')
          .update({
            stripe_subscription_id: subscriptionId,
            subscription_tier: tier,
            subscription_status: 'active',
            trial_ends_at: null,
          })
          .eq('stripe_customer_id', customerId)
          .select('id, name, organization_id');

        if (errUpdate) throw errUpdate;
        if (!updated || updated.length === 0) {
          console.warn(`Stripe webhook: no company found for customer ${customerId} on event ${event.type}`);
          break;
        }

        const orgId = (updated[0].organization_id as string | null) ?? previous?.organization_id ?? null;
        const companyName = (updated[0].name as string) || 'Ihr Unternehmen';

        if (orgId) {
          await logSubscriptionChange(supabase, {
            organizationId: orgId,
            oldTier: previous?.subscription_tier ?? null,
            newTier: tier,
            oldStatus: previous?.subscription_status ?? null,
            newStatus: 'active',
            stripeEventId: event.id,
          });

          await notifyAdmins(supabase, orgId, (email, fullName) =>
            sendSubscriptionConfirmedEmail(email, fullName, companyName, tier),
          );
        }

        console.log(`Stripe webhook: checkout.session.completed for ${customerId}, tier=${tier}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        const item = subscription.items.data[0];
        const priceId = item?.price?.id;
        if (!priceId) throw new Error('subscription.updated event missing price ID');
        const tier = mapPriceToTier(priceId);
        const status = subscription.status === 'active' ? 'active'
          : subscription.status === 'past_due' ? 'past_due'
          : subscription.status === 'trialing' ? 'trialing'
          : subscription.status === 'canceled' ? 'canceled'
          : 'incomplete';

        const rawPeriodEnd = item?.current_period_end ?? null;
        const periodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000).toISOString() : null;

        const cancelAt = subscription.cancel_at
          ? new Date(subscription.cancel_at * 1000).toISOString()
          : null;
        const canceledAt = subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000).toISOString()
          : null;
        const cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);

        // Trial reset: clear trial_ends_at once Stripe transitions out of `trialing`.
        // Setting null means UI no longer shows the trial banner after upgrade or trial end.
        const trialEndsAt =
          status === 'trialing' && subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : status === 'trialing'
              ? undefined // keep existing
              : null;

        const previous = await fetchCompanyByCustomer(supabase, customerId);

        const updatePayload: Record<string, unknown> = {
          subscription_tier: tier,
          subscription_status: status,
          current_period_end: periodEnd,
          cancel_at_period_end: cancelAtPeriodEnd,
          cancel_at: cancelAt,
          canceled_at: canceledAt,
        };
        if (trialEndsAt !== undefined) {
          updatePayload.trial_ends_at = trialEndsAt;
        }

        // Stale-write protection: if periodEnd is set, only overwrite when the
        // existing value is null or older than the incoming one.
        let updated: Array<{ id: string }> | null = null;
        let errUpdate: unknown = null;

        if (periodEnd === null) {
          const r = await supabase
            .from('companies')
            .update(updatePayload)
            .eq('stripe_customer_id', customerId)
            .select('id');
          updated = r.data;
          errUpdate = r.error;
        } else {
          const nullR = await supabase
            .from('companies')
            .update(updatePayload)
            .eq('stripe_customer_id', customerId)
            .is('current_period_end', null)
            .select('id');
          if (nullR.error) {
            errUpdate = nullR.error;
          } else if (nullR.data && nullR.data.length > 0) {
            updated = nullR.data;
          } else {
            const lteR = await supabase
              .from('companies')
              .update(updatePayload)
              .eq('stripe_customer_id', customerId)
              .lte('current_period_end', periodEnd)
              .select('id');
            updated = lteR.data;
            errUpdate = lteR.error;
          }
        }

        if (errUpdate) throw errUpdate;
        if (!updated || updated.length === 0) {
          console.warn(`Stripe webhook: stale or missing row for ${customerId} on ${event.type}`);
          break;
        }

        const orgId = previous?.organization_id ?? null;
        if (orgId) {
          await logSubscriptionChange(supabase, {
            organizationId: orgId,
            oldTier: previous?.subscription_tier ?? null,
            newTier: tier,
            oldStatus: previous?.subscription_status ?? null,
            newStatus: status,
            stripeEventId: event.id,
          });
        }

        console.log(`Stripe webhook: subscription.updated for ${customerId}, tier=${tier}, status=${status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const previous = await fetchCompanyByCustomer(supabase, customerId);

        const { data: updated, error: errUpdate } = await supabase
          .from('companies')
          .update({
            subscription_tier: 'basis',
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            current_period_end: null,
            cancel_at_period_end: false,
            cancel_at: null,
            canceled_at: subscription.canceled_at
              ? new Date(subscription.canceled_at * 1000).toISOString()
              : new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)
          .select('id');

        if (errUpdate) throw errUpdate;
        if (!updated || updated.length === 0) {
          console.warn(`Stripe webhook: no company found for customer ${customerId} on event ${event.type}`);
          break;
        }

        if (previous?.organization_id) {
          await logSubscriptionChange(supabase, {
            organizationId: previous.organization_id,
            oldTier: previous.subscription_tier,
            newTier: 'basis',
            oldStatus: previous.subscription_status,
            newStatus: 'canceled',
            stripeEventId: event.id,
          }, 'canceled');
        }

        console.log(`Stripe webhook: subscription.deleted for ${customerId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        const previous = await fetchCompanyByCustomer(supabase, customerId);

        const { data: updated, error: errUpdate } = await supabase
          .from('companies')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId)
          .select('id, name, organization_id');

        if (errUpdate) throw errUpdate;
        if (!updated || updated.length === 0) {
          console.warn(`Stripe webhook: no company found for customer ${customerId} on event ${event.type}`);
          break;
        }

        const orgId = (updated[0].organization_id as string | null) ?? null;
        const companyName = (updated[0].name as string) || 'Ihr Unternehmen';

        if (orgId) {
          await logSubscriptionChange(supabase, {
            organizationId: orgId,
            oldTier: previous?.subscription_tier ?? null,
            newTier: previous?.subscription_tier ?? null,
            oldStatus: previous?.subscription_status ?? null,
            newStatus: 'past_due',
            stripeEventId: event.id,
            stripeInvoiceId: invoice.id ?? null,
          }, 'payment_failed');

          await notifyAdmins(supabase, orgId, (email, fullName) =>
            sendPaymentFailedEmail(email, fullName, companyName),
          );
        }

        console.log(`Stripe webhook: invoice.payment_failed for ${customerId}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        // Recovery signal: when a previously past_due subscription gets paid,
        // Stripe sometimes only emits this event before the next subscription.updated
        // tick. Flip past_due → active here so the lockout banner clears immediately.
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        const previous = await fetchCompanyByCustomer(supabase, customerId);
        if (!previous) {
          console.warn(`Stripe webhook: no company found for customer ${customerId} on event ${event.type}`);
          break;
        }

        if (previous.subscription_status === 'past_due') {
          const { error: errUpdate } = await supabase
            .from('companies')
            .update({ subscription_status: 'active', payment_issue: null })
            .eq('stripe_customer_id', customerId);

          if (errUpdate) throw errUpdate;

          if (previous.organization_id) {
            await logSubscriptionChange(supabase, {
              organizationId: previous.organization_id,
              oldTier: previous.subscription_tier,
              newTier: previous.subscription_tier,
              oldStatus: previous.subscription_status,
              newStatus: 'active',
              stripeEventId: event.id,
              stripeInvoiceId: invoice.id ?? null,
            }, 'reactivated');
          }

          console.log(`Stripe webhook: invoice.payment_succeeded recovered past_due for ${customerId}`);
        } else {
          console.log(`Stripe webhook: invoice.payment_succeeded (no-op, status=${previous.subscription_status}) for ${customerId}`);
        }
        break;
      }

      case 'charge.refunded': {
        // Refund — flag the company for ops review but don't auto-cancel the sub.
        // Stripe also fires invoice.payment_failed if the refund triggers a balance issue.
        const charge = event.data.object;
        const customerId = charge.customer as string | null;
        if (!customerId) {
          console.warn(`Stripe webhook: charge.refunded without customer (event ${event.id})`);
          break;
        }

        const { error: errUpdate } = await supabase
          .from('companies')
          .update({ payment_issue: 'refunded' })
          .eq('stripe_customer_id', customerId);

        if (errUpdate) throw errUpdate;

        Sentry.captureMessage('Stripe charge refunded — manual review required', {
          level: 'warning',
          tags: { route: 'webhook_stripe', event: 'charge.refunded' },
          extra: {
            customer_id: customerId,
            charge_id: charge.id,
            amount_refunded: charge.amount_refunded,
            event_id: event.id,
          },
        });

        console.log(`Stripe webhook: charge.refunded for ${customerId}, amount=${charge.amount_refunded}`);
        break;
      }

      case 'charge.dispute.created': {
        // Chargeback — high-severity. Mark and alert; Stripe-side dunning still runs.
        const dispute = event.data.object;
        const chargeId = dispute.charge as string;

        // Look up customer via the charge object
        let customerId: string | null = null;
        try {
          const charge = await stripe.charges.retrieve(chargeId);
          customerId = (charge.customer as string | null) ?? null;
        } catch (lookupErr) {
          console.error(`Stripe webhook: dispute charge lookup failed for ${chargeId}`, lookupErr);
        }

        if (customerId) {
          const { error: errUpdate } = await supabase
            .from('companies')
            .update({ payment_issue: 'disputed' })
            .eq('stripe_customer_id', customerId);
          if (errUpdate) throw errUpdate;
        }

        Sentry.captureMessage('Stripe chargeback / dispute created — immediate review required', {
          level: 'error',
          tags: { route: 'webhook_stripe', event: 'charge.dispute.created' },
          extra: {
            customer_id: customerId,
            charge_id: chargeId,
            dispute_id: dispute.id,
            reason: dispute.reason,
            amount: dispute.amount,
            event_id: event.id,
          },
        });

        console.log(`Stripe webhook: charge.dispute.created for ${customerId}, reason=${dispute.reason}`);
        break;
      }

      default:
        console.log(`Stripe webhook: unhandled event ${event.type}`);
    }

    // Mark as processed after successful execution. If processing failed
    // (threw above), Stripe will retry — and we want it to.
    await supabase
      .from('processed_stripe_events')
      .insert({ event_id: event.id });
  } catch (error) {
    const isUnmappedPrice = error instanceof UnmappedPriceError;
    console.error(`Stripe webhook: error processing ${event.type}`, error);
    Sentry.captureException(error, {
      level: isUnmappedPrice ? 'error' : 'error',
      tags: {
        route: 'webhook_stripe',
        event_type: event.type,
        ...(isUnmappedPrice ? { failure: 'unmapped_price' } : {}),
      },
      extra: {
        event_id: event.id,
        ...(isUnmappedPrice ? { price_id: (error as UnmappedPriceError).priceId } : {}),
      },
    });
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
