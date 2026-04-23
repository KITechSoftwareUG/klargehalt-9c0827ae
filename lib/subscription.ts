export type SubscriptionTier = 'basis' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';

export const TRIAL_DURATION_DAYS = 14;
export const TRIAL_TIER: SubscriptionTier = 'professional';

export interface PlanLimits {
  maxEmployees: number;
  maxAdmins: number;
  maxHRManagers: number;
}

export interface PlanDefinition {
  tier: SubscriptionTier;
  name: string;
  nameDE: string;
  priceMonthly: number | null;
  priceYearly: number | null;
  limits: PlanLimits;
  features: string[];
  description: string;
}

export const FEATURE_FLAGS: Record<string, SubscriptionTier[]> = {
  pay_gap_analysis: ['basis', 'professional', 'enterprise'],
  pdf_reports: ['professional', 'enterprise'],
  trend_analysis: ['professional', 'enterprise'],
  decision_documentation: ['professional', 'enterprise'],
  lawyer_review: ['professional', 'enterprise'],
  priority_support: ['professional', 'enterprise'],
  advanced_audit: ['professional', 'enterprise'],
  sso: ['enterprise'],
  auditor_access: ['enterprise'],
  custom_integrations: ['enterprise'],
};

export const PLANS: Record<SubscriptionTier, PlanDefinition> = {
  basis: {
    tier: 'basis',
    name: 'Basis',
    nameDE: 'Basis',
    priceMonthly: 149,
    priceYearly: 1490,
    limits: { maxEmployees: 50, maxAdmins: 1, maxHRManagers: 1 },
    features: [
      'Gehaltsbänder & Job-Profile',
      'Gender-Pay-Gap-Analyse',
      'CSV-Import',
      'Basis-Audit-Trail',
      '1 Admin + 1 HR-Manager',
      'Mitarbeiter-Selbstauskunft',
    ],
    description: 'Für kleine Unternehmen bis 50 Mitarbeiter',
  },
  professional: {
    tier: 'professional',
    name: 'Professional',
    nameDE: 'Professional',
    priceMonthly: 299,
    priceYearly: 2690,
    limits: { maxEmployees: 250, maxAdmins: 5, maxHRManagers: -1 },
    features: [
      'Alles aus Basis',
      'Gender-Pay-Gap-Analyse',
      'PDF-Berichte & Export',
      'Trend-Analyse über Zeit',
      'Bis zu 5 Admins',
      'Unbegrenzte HR-Manager',
      'Prioritäts-Support',
      'Onboarding-Begleitung',
    ],
    description: 'Für wachsende Unternehmen mit EU-Berichtspflicht',
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    nameDE: 'Enterprise',
    priceMonthly: null,
    priceYearly: null,
    limits: { maxEmployees: -1, maxAdmins: -1, maxHRManagers: -1 },
    features: [
      'Alles aus Professional',
      'Single Sign-On (SSO)',
      'Auditor-Zugang (read-only)',
      'Custom Integrationen',
      'SLA & dedizierter Ansprechpartner',
      'Unbegrenzte Nutzer',
    ],
    description: 'Für Großunternehmen mit individuellen Anforderungen',
  },
};

export function hasFeature(tier: SubscriptionTier, feature: string): boolean {
  const allowedTiers = FEATURE_FLAGS[feature];
  if (!allowedTiers) return false;
  return allowedTiers.includes(tier);
}

export function getPlanLimits(tier: SubscriptionTier): PlanLimits {
  return PLANS[tier].limits;
}

export function isTrialExpired(trialEndsAt: string | Date | null): boolean {
  if (!trialEndsAt) return true;
  return new Date(trialEndsAt) < new Date();
}

export function getTrialDaysRemaining(trialEndsAt: string | Date | null): number | null {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function getEffectiveTier(
  tier: SubscriptionTier,
  status: SubscriptionStatus,
  trialEndsAt: string | Date | null
): SubscriptionTier {
  if (status === 'active') return tier;
  if (status === 'trialing' && !isTrialExpired(trialEndsAt)) return tier;
  return 'basis';
}

export function getRequiredTierForFeature(feature: string): SubscriptionTier | null {
  const tiers = FEATURE_FLAGS[feature];
  if (!tiers || tiers.length === 0) return null;
  if (tiers.includes('basis')) return 'basis';
  if (tiers.includes('professional')) return 'professional';
  return 'enterprise';
}

export function getStripePriceId(tier: SubscriptionTier, interval: 'monthly' | 'yearly'): string | null {
  const envKey = `STRIPE_PRICE_${tier.toUpperCase()}_${interval.toUpperCase()}`;
  return process.env[envKey] ?? null;
}

// Returns days since trial ended (positive = trial is over)
export function getDaysSinceTrialExpired(trialEndsAt: string | Date | null): number {
  if (!trialEndsAt) return 999;
  const end = new Date(trialEndsAt);
  const now = new Date();
  const diff = Math.floor((now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

// Hard delete threshold: 30 days after trial ends
export const GRACE_PERIOD_DAYS = 30;
