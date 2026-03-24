import { createClient } from '@supabase/supabase-js';
import {
  type SubscriptionTier,
  type SubscriptionStatus,
  getEffectiveTier,
  hasFeature,
  getPlanLimits,
} from '@/lib/subscription';

const supabaseAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export interface CompanySubscription {
  tier: SubscriptionTier;
  effectiveTier: SubscriptionTier;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
}

export async function getCompanySubscription(organizationId: string): Promise<CompanySubscription | null> {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from('companies')
    .select('subscription_tier, subscription_status, trial_ends_at, current_period_end')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (!data) return null;

  const tier = (data.subscription_tier as SubscriptionTier) || 'basis';
  const status = (data.subscription_status as SubscriptionStatus) || 'trialing';

  return {
    tier,
    effectiveTier: getEffectiveTier(tier, status, data.trial_ends_at),
    status,
    trialEndsAt: data.trial_ends_at,
    currentPeriodEnd: data.current_period_end,
  };
}

export function assertFeatureAccess(subscription: CompanySubscription, feature: string): void {
  if (!hasFeature(subscription.effectiveTier, feature)) {
    throw new Error(`Feature "${feature}" requires a higher subscription tier`);
  }
}

export function assertEmployeeLimit(subscription: CompanySubscription, currentCount: number): void {
  const limits = getPlanLimits(subscription.effectiveTier);
  if (limits.maxEmployees !== -1 && currentCount >= limits.maxEmployees) {
    throw new Error(
      `Employee limit reached (${limits.maxEmployees}). Upgrade to add more employees.`
    );
  }
}
