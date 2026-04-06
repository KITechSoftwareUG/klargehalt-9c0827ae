'use client';

import { Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';

export function TrialBanner() {
  const { isTrialing, trialDaysRemaining, isExpired, isInGracePeriod, gracePeriodDaysRemaining, loading } = useSubscription();

  if (loading) return null;

  // Grace period: trial ended, but account not yet deleted
  if (isExpired && isInGracePeriod && gracePeriodDaysRemaining !== null) {
    const startCheckout = async () => {
      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: 'professional', interval: 'monthly' }),
        });
        const data = await res.json() as { url?: string };
        if (data.url) window.location.href = data.url;
      } catch {
        console.error('Failed to start checkout');
      }
    };

    return (
      <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm bg-red-50 border-b border-red-200 text-red-700">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>
            Ihre Testphase ist abgelaufen. Ihr Konto wird in{' '}
            <strong>{gracePeriodDaysRemaining} {gracePeriodDaysRemaining === 1 ? 'Tag' : 'Tagen'}</strong> gelöscht.
          </span>
        </div>
        <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={startCheckout}>
          Jetzt upgraden
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    );
  }

  // Active trial banner
  if (!isTrialing || trialDaysRemaining === null) return null;

  const isUrgent = trialDaysRemaining <= 3;

  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-2.5 text-sm ${
        isUrgent
          ? 'bg-destructive/10 border-b border-destructive/20 text-destructive'
          : 'bg-accent/5 border-b border-accent/20 text-muted-foreground'
      }`}
    >
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span>
          {trialDaysRemaining === 0
            ? 'Ihre Testphase endet heute.'
            : trialDaysRemaining === 1
            ? 'Ihre Testphase endet morgen.'
            : `Noch ${trialDaysRemaining} Tage in Ihrer kostenlosen Testphase.`}
        </span>
      </div>
      <Button size="sm" variant={isUrgent ? 'destructive' : 'outline'} className="h-7 text-xs" asChild>
        <a href="/api/stripe/checkout">
          Plan wählen
          <ArrowRight className="ml-1 h-3 w-3" />
        </a>
      </Button>
    </div>
  );
}
