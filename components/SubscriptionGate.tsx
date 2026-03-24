'use client';

import { type ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { getRequiredTierForFeature } from '@/lib/subscription';

interface SubscriptionGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function SubscriptionGate({ feature, children, fallback }: SubscriptionGateProps) {
  const { hasFeature, loading } = useSubscription();

  if (loading) return null;

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  const requiredTier = getRequiredTierForFeature(feature);
  return <UpgradePrompt requiredTier={requiredTier} feature={feature} />;
}
