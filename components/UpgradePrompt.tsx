'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type SubscriptionTier, PLANS } from '@/lib/subscription';

const FEATURE_LABELS: Record<string, string> = {
  pay_gap_analysis: 'Gender-Pay-Gap-Analyse',
  pdf_reports: 'PDF-Berichte & Export',
  trend_analysis: 'Trend-Analyse über Zeit',
  priority_support: 'Prioritäts-Support',
  advanced_audit: 'Erweitertes Audit-Log',
  sso: 'Single Sign-On (SSO)',
  auditor_access: 'Auditor-Zugang',
  custom_integrations: 'Custom Integrationen',
};

interface UpgradePromptProps {
  feature?: string | null;
  requiredTier?: SubscriptionTier | null;
  variant?: 'inline' | 'banner';
}

export function UpgradePrompt({ feature, requiredTier, variant = 'inline' }: UpgradePromptProps) {
  const tierName = requiredTier ? PLANS[requiredTier].nameDE : 'Professional';
  const featureLabel = feature ? (FEATURE_LABELS[feature] ?? feature) : null;
  const price = requiredTier ? PLANS[requiredTier].priceMonthly : 299;

  if (variant === 'banner') {
    return (
      <div className="flex items-center justify-between gap-4 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-accent" />
          <span>
            {featureLabel
              ? `${featureLabel} ist im ${tierName}-Plan verfügbar.`
              : `Upgrade auf ${tierName} für erweiterte Funktionen.`}
          </span>
        </div>
        <Button size="sm" variant="default" asChild>
          <a href="/api/stripe/checkout">
            Upgrade
            <ArrowRight className="ml-1 h-3 w-3" />
          </a>
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-dashed border-accent/30 bg-accent/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <CardTitle className="text-lg">
            {featureLabel ?? 'Erweiterte Funktion'}
          </CardTitle>
        </div>
        <CardDescription>
          {featureLabel
            ? `${featureLabel} ist ab dem ${tierName}-Plan verfügbar.`
            : `Diese Funktion erfordert den ${tierName}-Plan.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {price && (
          <p className="text-sm text-muted-foreground">
            Ab <span className="font-semibold text-foreground">€{price}/Monat</span> · 14 Tage kostenlos testen
          </p>
        )}
        <Button asChild>
          <a href="/api/stripe/checkout">
            Jetzt upgraden
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
