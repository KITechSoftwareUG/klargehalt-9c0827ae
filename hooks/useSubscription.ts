'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  type SubscriptionTier,
  type SubscriptionStatus,
  type PlanLimits,
  hasFeature,
  getPlanLimits,
  getEffectiveTier,
  getTrialDaysRemaining,
  PLANS,
} from '@/lib/subscription';

interface SubscriptionState {
  tier: SubscriptionTier;
  rawTier: SubscriptionTier;
  status: SubscriptionStatus;
  isTrialing: boolean;
  trialEndsAt: Date | null;
  trialDaysRemaining: number | null;
  currentPeriodEnd: Date | null;
  stripeCustomerId: string | null;
  limits: PlanLimits;
  plan: typeof PLANS[SubscriptionTier];
  loading: boolean;
}

export interface UseSubscriptionReturn extends SubscriptionState {
  hasFeature: (feature: string) => boolean;
  canAddEmployee: (currentCount: number) => boolean;
  canAddAdmin: (currentCount: number) => boolean;
  canAddHRManager: (currentCount: number) => boolean;
  refresh: () => Promise<void>;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const { supabase, orgId, loading: authLoading } = useAuth();
  const [rawTier, setRawTier] = useState<SubscriptionTier>('basis');
  const [status, setStatus] = useState<SubscriptionStatus>('trialing');
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<Date | null>(null);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('companies')
        .select('subscription_tier, subscription_status, trial_ends_at, current_period_end, stripe_customer_id')
        .eq('organization_id', orgId)
        .maybeSingle();

      if (data) {
        setRawTier((data.subscription_tier as SubscriptionTier) || 'basis');
        setStatus((data.subscription_status as SubscriptionStatus) || 'trialing');
        setTrialEndsAt(data.trial_ends_at ? new Date(data.trial_ends_at) : null);
        setCurrentPeriodEnd(data.current_period_end ? new Date(data.current_period_end) : null);
        setStripeCustomerId(data.stripe_customer_id || null);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, orgId]);

  useEffect(() => {
    if (!authLoading) {
      void fetchSubscription();
    }
  }, [authLoading, fetchSubscription]);

  const tier = useMemo(
    () => getEffectiveTier(rawTier, status, trialEndsAt?.toISOString() ?? null),
    [rawTier, status, trialEndsAt]
  );

  const isTrialing = status === 'trialing' && trialEndsAt !== null && trialEndsAt > new Date();
  const trialDaysRemaining = getTrialDaysRemaining(trialEndsAt?.toISOString() ?? null);
  const limits = getPlanLimits(tier);
  const plan = PLANS[tier];

  const checkFeature = useCallback((feature: string) => hasFeature(tier, feature), [tier]);

  const canAddEmployee = useCallback(
    (currentCount: number) => limits.maxEmployees === -1 || currentCount < limits.maxEmployees,
    [limits.maxEmployees]
  );

  const canAddAdmin = useCallback(
    (currentCount: number) => limits.maxAdmins === -1 || currentCount < limits.maxAdmins,
    [limits.maxAdmins]
  );

  const canAddHRManager = useCallback(
    (currentCount: number) => limits.maxHRManagers === -1 || currentCount < limits.maxHRManagers,
    [limits.maxHRManagers]
  );

  return {
    tier,
    rawTier,
    status,
    isTrialing,
    trialEndsAt,
    trialDaysRemaining,
    currentPeriodEnd,
    stripeCustomerId,
    limits,
    plan,
    loading,
    hasFeature: checkFeature,
    canAddEmployee,
    canAddAdmin,
    canAddHRManager,
    refresh: fetchSubscription,
  };
};
