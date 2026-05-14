import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import type { SubscriptionTier } from './subscription';
import { logSubscriptionChange } from './subscription-audit';

export interface DiscrepancyRecord {
  companyId: string;
  companyName: string;
  organizationId: string | null;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripeStatus: string | null;
  stripeTier: string | null;
  appStatus: string;
  appTier: string;
  issue: string;
}

export interface RepairResult {
  companyId: string;
  companyName: string;
  organizationId: string | null;
  action: string;
  success: boolean;
  error?: string;
}

export interface ReconcileSummary {
  total: number;
  ok: number;
  discrepancyCount: number;
  discrepancies: DiscrepancyRecord[];
}

export interface RepairSummary {
  fixed: number;
  failed: number;
  results: RepairResult[];
}

type StripeStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete';

function normalizeStatus(stripeStatus: string): StripeStatus {
  if (stripeStatus === 'active') return 'active';
  if (stripeStatus === 'past_due') return 'past_due';
  if (stripeStatus === 'canceled') return 'canceled';
  if (stripeStatus === 'trialing') return 'trialing';
  return 'incomplete';
}

export function mapPriceToTierLoose(priceId: string): SubscriptionTier | 'unknown' {
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
  return 'unknown';
}

interface CompanyRow {
  id: string;
  name: string | null;
  organization_id: string | null;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  subscription_tier: string;
  subscription_status: string;
}

interface StripeView {
  id: string;
  status: StripeStatus;
  tier: SubscriptionTier | 'unknown';
  periodEnd: string | null;
}

async function fetchStripeView(
  stripe: Stripe,
  company: CompanyRow,
): Promise<StripeView | null> {
  let sub: Stripe.Subscription | null = null;

  if (company.stripe_subscription_id) {
    sub = await stripe.subscriptions.retrieve(company.stripe_subscription_id);
  } else {
    const subs = await stripe.subscriptions.list({
      customer: company.stripe_customer_id,
      limit: 1,
      status: 'all',
    });
    sub = subs.data[0] ?? null;
  }

  if (!sub) return null;

  const item = sub.items.data[0];
  const priceId = item?.price?.id ?? '';
  // Stripe SDK v20: current_period_end lives on the subscription item, not the subscription.
  const rawPeriodEnd = (item as unknown as { current_period_end?: number | null })?.current_period_end ?? null;

  return {
    id: sub.id,
    status: normalizeStatus(sub.status),
    tier: mapPriceToTierLoose(priceId),
    periodEnd: rawPeriodEnd ? new Date(rawPeriodEnd * 1000).toISOString() : null,
  };
}

async function loadCompanies(supabase: SupabaseClient): Promise<CompanyRow[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, organization_id, stripe_customer_id, stripe_subscription_id, subscription_tier, subscription_status')
    .not('stripe_customer_id', 'is', null);

  if (error) throw new Error(`Database error: ${error.message}`);
  return (data ?? []) as CompanyRow[];
}

/**
 * Pure detection: compares each company row with its Stripe view, returns
 * discrepancies without making any changes.
 */
export async function detectDiscrepancies(
  supabase: SupabaseClient,
  stripe: Stripe,
): Promise<ReconcileSummary> {
  const companies = await loadCompanies(supabase);
  const discrepancies: DiscrepancyRecord[] = [];
  let okCount = 0;

  for (const company of companies) {
    let stripeView: StripeView | null = null;
    try {
      stripeView = await fetchStripeView(stripe, company);
    } catch (err) {
      discrepancies.push({
        companyId: company.id,
        companyName: company.name ?? '(unknown)',
        organizationId: company.organization_id,
        stripeCustomerId: company.stripe_customer_id,
        stripeSubscriptionId: null,
        stripeStatus: null,
        stripeTier: null,
        appStatus: company.subscription_status,
        appTier: company.subscription_tier,
        issue: `Stripe API error: ${err instanceof Error ? err.message : String(err)}`,
      });
      continue;
    }

    if (!stripeView) {
      if (company.subscription_status === 'active' || company.subscription_status === 'past_due') {
        discrepancies.push({
          companyId: company.id,
          companyName: company.name ?? '(unknown)',
          organizationId: company.organization_id,
          stripeCustomerId: company.stripe_customer_id,
          stripeSubscriptionId: null,
          stripeStatus: null,
          stripeTier: null,
          appStatus: company.subscription_status,
          appTier: company.subscription_tier,
          issue: 'App shows active/past_due but no Stripe subscription found',
        });
      } else {
        okCount++;
      }
      continue;
    }

    const issues: string[] = [];
    if (stripeView.status !== company.subscription_status) {
      issues.push(`status mismatch: Stripe=${stripeView.status} App=${company.subscription_status}`);
    }
    if (stripeView.tier !== 'unknown' && stripeView.tier !== company.subscription_tier) {
      issues.push(`tier mismatch: Stripe=${stripeView.tier} App=${company.subscription_tier}`);
    }

    if (issues.length > 0) {
      discrepancies.push({
        companyId: company.id,
        companyName: company.name ?? '(unknown)',
        organizationId: company.organization_id,
        stripeCustomerId: company.stripe_customer_id,
        stripeSubscriptionId: stripeView.id,
        stripeStatus: stripeView.status,
        stripeTier: stripeView.tier,
        appStatus: company.subscription_status,
        appTier: company.subscription_tier,
        issue: issues.join('; '),
      });
    } else {
      okCount++;
    }
  }

  return {
    total: companies.length,
    ok: okCount,
    discrepancyCount: discrepancies.length,
    discrepancies,
  };
}

/**
 * Applies fixes for all detected discrepancies. Idempotent — safe to run
 * repeatedly. Writes an audit row to subscription_changes for each fix.
 */
export async function applyReconciliation(
  supabase: SupabaseClient,
  stripe: Stripe,
  initiatedByUserId: string | null,
): Promise<RepairSummary> {
  const companies = await loadCompanies(supabase);
  const results: RepairResult[] = [];

  for (const company of companies) {
    const orgId = company.organization_id;
    const oldTier = company.subscription_tier as SubscriptionTier;
    const oldStatus = company.subscription_status;

    try {
      const stripeView = await fetchStripeView(stripe, company);

      if (!stripeView) {
        if (oldStatus === 'active' || oldStatus === 'past_due') {
          const { error: fixErr } = await supabase
            .from('companies')
            .update({ subscription_status: 'canceled', stripe_subscription_id: null })
            .eq('id', company.id);

          if (!fixErr && orgId) {
            await logSubscriptionChange(supabase, {
              organizationId: orgId,
              oldTier,
              newTier: oldTier,
              oldStatus,
              newStatus: 'canceled',
              initiatedByUserId,
              notes: 'reconcile: no Stripe subscription found',
            }, 'canceled');
          }

          results.push({
            companyId: company.id,
            companyName: company.name ?? '(unknown)',
            organizationId: orgId,
            action: 'set canceled (no Stripe subscription found)',
            success: !fixErr,
            error: fixErr?.message,
          });
        }
        continue;
      }

      const needsTierFix = stripeView.tier !== 'unknown' && stripeView.tier !== oldTier;
      const needsStatusFix = stripeView.status !== oldStatus;
      const needsSubIdFix = !company.stripe_subscription_id;

      if (!needsTierFix && !needsStatusFix && !needsSubIdFix) continue;

      const patch: Record<string, unknown> = {};
      if (needsTierFix) patch.subscription_tier = stripeView.tier;
      if (needsStatusFix) patch.subscription_status = stripeView.status;
      if (needsSubIdFix) patch.stripe_subscription_id = stripeView.id;
      if (stripeView.periodEnd) patch.current_period_end = stripeView.periodEnd;

      const { error: fixErr } = await supabase
        .from('companies')
        .update(patch)
        .eq('id', company.id);

      if (!fixErr && orgId) {
        const newTier = (needsTierFix && stripeView.tier !== 'unknown'
          ? stripeView.tier
          : oldTier) as SubscriptionTier;
        await logSubscriptionChange(supabase, {
          organizationId: orgId,
          oldTier,
          newTier,
          oldStatus,
          newStatus: needsStatusFix ? stripeView.status : oldStatus,
          initiatedByUserId,
          notes: `reconcile: ${needsTierFix ? 'tier ' : ''}${needsStatusFix ? 'status ' : ''}${needsSubIdFix ? 'subId ' : ''}`.trim(),
        });
      }

      const description = [
        needsTierFix ? `tier: ${oldTier} → ${stripeView.tier}` : null,
        needsStatusFix ? `status: ${oldStatus} → ${stripeView.status}` : null,
        needsSubIdFix ? `linked subscription ${stripeView.id}` : null,
      ].filter(Boolean).join('; ');

      results.push({
        companyId: company.id,
        companyName: company.name ?? '(unknown)',
        organizationId: orgId,
        action: description,
        success: !fixErr,
        error: fixErr?.message,
      });
    } catch (err) {
      results.push({
        companyId: company.id,
        companyName: company.name ?? '(unknown)',
        organizationId: orgId,
        action: 'Stripe API error — skipped',
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    fixed: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}
