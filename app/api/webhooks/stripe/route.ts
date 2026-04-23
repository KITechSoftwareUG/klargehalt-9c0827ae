import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import type { SubscriptionTier } from '@/lib/subscription';
import { sendPaymentFailedEmail, sendSubscriptionConfirmedEmail } from '@/lib/email';

const supabaseAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function mapPriceToTier(priceId: string): SubscriptionTier {
  const mapping: Record<string, SubscriptionTier> = {};

  const envPairs: [string, SubscriptionTier][] = [
    ['STRIPE_PRICE_BASIS_MONTHLY', 'basis'],
    ['STRIPE_PRICE_BASIS_YEARLY', 'basis'],
    ['STRIPE_PRICE_PROFESSIONAL_MONTHLY', 'professional'],
    ['STRIPE_PRICE_PROFESSIONAL_YEARLY', 'professional'],
    ['STRIPE_PRICE_ENTERPRISE_MONTHLY', 'enterprise'],
    ['STRIPE_PRICE_ENTERPRISE_YEARLY', 'enterprise'],
  ];

  for (const [envKey, tier] of envPairs) {
    const val = process.env[envKey];
    if (val) mapping[val] = tier;
  }

  const tier = mapping[priceId];
  if (!tier) {
    console.error(`Stripe webhook: UNMAPPED price ID "${priceId}" — defaulting to 'basis'. Check STRIPE_PRICE_* env vars.`);
    return 'basis';
  }
  return tier;
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

        const { data: updated1, error: err1 } = await supabase
          .from('companies')
          .update({
            stripe_subscription_id: subscriptionId,
            subscription_tier: tier,
            subscription_status: 'active',
            trial_ends_at: null,
          })
          .eq('stripe_customer_id', customerId)
          .select('id');

        if (err1) throw err1;
        if (!updated1 || updated1.length === 0) {
          console.warn(`Stripe webhook: no company found for customer ${customerId} on event ${event.type}`);
        }

        // Send subscription confirmed email to all admins
        if (updated1 && updated1.length > 0) {
          const companyId = updated1[0].id as string;
          const { data: company } = await supabase
            .from('companies')
            .select('name')
            .eq('id', companyId)
            .single();
          const companyName = (company?.name as string) || 'Ihr Unternehmen';

          const { data: admins } = await supabase
            .from('user_roles')
            .select('user_id, profiles!inner(email, full_name)')
            .eq('organization_id', companyId)
            .eq('role', 'admin');

          if (admins) {
            for (const admin of admins) {
              const profileRaw = admin.profiles as unknown;
              const profile = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as { email: string; full_name: string } | null;
              if (profile?.email) {
                try {
                  await sendSubscriptionConfirmedEmail(profile.email, profile.full_name, companyName, tier);
                } catch (emailError) {
                  console.error('Stripe webhook: Failed to send confirmation email', emailError);
                }
              }
            }
          }
        }

        console.log(`Stripe webhook: checkout.session.completed for ${customerId}, tier=${tier}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price?.id;
        const tier = priceId ? mapPriceToTier(priceId) : 'basis';
        const status = subscription.status === 'active' ? 'active'
          : subscription.status === 'past_due' ? 'past_due'
          : subscription.status === 'trialing' ? 'trialing'
          : 'incomplete';

        const periodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        // Build the update query. When periodEnd is non-null, guard against
        // out-of-order events by only applying the update when the stored
        // period end is null or earlier than the incoming event's period end.
        // When periodEnd is null (e.g. immediate cancellation), apply unconditionally.
        let updateQuery = supabase
          .from('companies')
          .update({
            subscription_tier: tier,
            subscription_status: status,
            current_period_end: periodEnd,
          })
          .eq('stripe_customer_id', customerId);

        if (periodEnd !== null) {
          updateQuery = updateQuery.or(`current_period_end.is.null,current_period_end.lte.${periodEnd}`);
        }

        const { data: updated2, error: err2 } = await updateQuery.select('id');

        if (err2) throw err2;
        if (!updated2 || updated2.length === 0) {
          console.warn(`Stripe webhook: no company found for customer ${customerId} on event ${event.type}`);
        }

        console.log(`Stripe webhook: subscription.updated for ${customerId}, tier=${tier}, status=${status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const { data: updated3, error: err3 } = await supabase
          .from('companies')
          .update({
            subscription_tier: 'basis',
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            current_period_end: null,
          })
          .eq('stripe_customer_id', customerId)
          .select('id');

        if (err3) throw err3;
        if (!updated3 || updated3.length === 0) {
          console.warn(`Stripe webhook: no company found for customer ${customerId} on event ${event.type}`);
        }

        console.log(`Stripe webhook: subscription.deleted for ${customerId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        const { data: updated4, error: err4 } = await supabase
          .from('companies')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId)
          .select('id, name');

        if (err4) throw err4;
        if (!updated4 || updated4.length === 0) {
          console.warn(`Stripe webhook: no company found for customer ${customerId} on event ${event.type}`);
        }

        // Send payment failed email to all admins of the company
        if (updated4 && updated4.length > 0) {
          const companyId = updated4[0].id as string;
          const companyName = (updated4[0].name as string) || 'Ihr Unternehmen';
          const { data: admins } = await supabase
            .from('user_roles')
            .select('user_id, profiles!inner(email, full_name)')
            .eq('organization_id', companyId)
            .eq('role', 'admin');

          if (admins) {
            for (const admin of admins) {
              const profileRaw = admin.profiles as unknown;
              const profile = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as { email: string; full_name: string } | null;
              if (profile?.email) {
                try {
                  await sendPaymentFailedEmail(profile.email, profile.full_name, companyName);
                } catch (emailError) {
                  console.error('Stripe webhook: Failed to send payment failed email', emailError);
                }
              }
            }
          }
        }

        console.log(`Stripe webhook: invoice.payment_failed for ${customerId}`);
        break;
      }

      default:
        console.log(`Stripe webhook: unhandled event ${event.type}`);
    }
    // Mark as processed after successful execution (if processing fails, Stripe will retry)
    await supabase
      .from('processed_stripe_events')
      .insert({ event_id: event.id });
  } catch (error) {
    console.error(`Stripe webhook: error processing ${event.type}`, error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
