'use client';

import { Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';

async function startCheckout(tier: 'professional' | 'basis' = 'professional') {
  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier, interval: 'monthly' }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { url?: string };
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('Keine Checkout-URL erhalten');
    }
  } catch (err) {
    console.error('Failed to start checkout', err);
    toast.error('Checkout konnte nicht gestartet werden. Bitte versuchen Sie es erneut.');
  }
}

export function TrialHeaderBadge(): JSX.Element | null {
  const { isTrialing, trialDaysRemaining, loading } = useSubscription();

  if (loading || !isTrialing || trialDaysRemaining === null || trialDaysRemaining < 10) {
    return null;
  }

  return (
    <Link
      href="/abrechnung"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors"
    >
      <Clock className="h-3 w-3" />
      {trialDaysRemaining} Tage Test
    </Link>
  );
}

export function TrialBanner() {
  const { isTrialing, trialDaysRemaining, isExpired, isInGracePeriod, gracePeriodDaysRemaining, loading } = useSubscription();

  if (loading) return null;

  // Grace period: trial ended, but account not yet deleted
  if (isExpired && isInGracePeriod && gracePeriodDaysRemaining !== null) {
    return (
      <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm bg-red-50 border-b border-red-200 text-red-700">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>
            Ihre Testphase ist abgelaufen. Ihr Konto wird in{' '}
            <strong>{gracePeriodDaysRemaining} {gracePeriodDaysRemaining === 1 ? 'Tag' : 'Tagen'}</strong> gelöscht.
          </span>
        </div>
        <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => startCheckout()}>
          Jetzt upgraden
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    );
  }

  // Active trial banner — full banner only for days 9 and below; days 10+ use TrialHeaderBadge
  if (!isTrialing || trialDaysRemaining === null || trialDaysRemaining >= 10) return null;

  const isHard = trialDaysRemaining <= 4;
  const isSoft = trialDaysRemaining >= 5 && trialDaysRemaining <= 9;

  const getMessage = () => {
    if (trialDaysRemaining === 0) return 'Ihre Professional-Testphase endet heute.';
    if (trialDaysRemaining === 1) return 'Ihre Professional-Testphase endet morgen.';
    if (isHard) return `Noch ${trialDaysRemaining} Tage — danach kehren Sie zu Basis zurück.`;
    if (isSoft) return `In ${trialDaysRemaining} Tagen endet Ihre Professional-Testphase. Danach wechseln Sie automatisch zum Basis-Plan.`;
    return `Professional-Test aktiv — noch ${trialDaysRemaining} Tage kostenlos.`;
  };

  const bannerClass = isHard
    ? 'bg-destructive/10 border-b border-destructive/20 text-destructive'
    : isSoft
    ? 'bg-amber-50 border-b border-amber-200 text-amber-800'
    : 'bg-accent/5 border-b border-accent/20 text-muted-foreground';

  const buttonVariant = isHard ? 'destructive' : isSoft ? 'default' : 'outline';

  return (
    <div className={`flex items-center justify-between gap-4 px-4 py-2.5 text-sm ${bannerClass}`}>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span>{getMessage()}</span>
      </div>
      <Button size="sm" variant={buttonVariant} className="h-7 text-xs" onClick={() => startCheckout()}>
        {isHard || isSoft ? 'Jetzt upgraden' : 'Plan wählen'}
        <ArrowRight className="ml-1 h-3 w-3" />
      </Button>
    </div>
  );
}
