'use client';

import { Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';

export function TrialBanner() {
  const { isTrialing, trialDaysRemaining, loading } = useSubscription();

  if (loading || !isTrialing || trialDaysRemaining === null) return null;

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
