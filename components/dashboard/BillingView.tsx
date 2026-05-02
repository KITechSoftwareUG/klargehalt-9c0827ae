'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS } from '@/lib/subscription';

export default function BillingView() {
    const sub = useSubscription();
    const [portalLoading, setPortalLoading] = useState(false);
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

    const openPortal = async () => {
        setPortalLoading(true);
        try {
            const res = await fetch('/api/stripe/portal', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Kundenportal konnte nicht geöffnet werden');
                return;
            }
            if (data.url) window.location.href = data.url;
        } catch {
            toast.error('Verbindungsfehler — bitte versuchen Sie es erneut');
        } finally {
            setPortalLoading(false);
        }
    };

    const startCheckout = async (tier: string) => {
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier, interval: billingInterval }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Checkout konnte nicht gestartet werden');
                return;
            }
            if (data.url) window.location.href = data.url;
        } catch {
            toast.error('Verbindungsfehler — bitte versuchen Sie es erneut');
        }
    };

    if (sub.loading) {
        return <div className="flex justify-center py-24"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
    }

    const basisMonthly = PLANS.basis.priceMonthly!;
    const basisYearly = PLANS.basis.priceYearly!;
    const proMonthly = PLANS.professional.priceMonthly!;
    const proYearly = PLANS.professional.priceYearly!;
    const maxYearlyDiscount = Math.round((1 - proYearly / (proMonthly * 12)) * 100);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold text-slate-900">Abrechnung & Plan</h2>
                <p className="text-sm text-slate-500">Verwalten Sie Ihren Plan und Ihre Zahlungsinformationen.</p>
            </div>

            {/* Current Plan */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-slate-900">Aktueller Plan: {sub.plan.nameDE}</h3>
                        <p className="text-sm text-slate-500">
                            {sub.isTrialing
                                ? `Testphase — noch ${sub.trialDaysRemaining} Tage`
                                : sub.status === 'active'
                                ? 'Aktives Abonnement'
                                : sub.status === 'past_due'
                                ? 'Zahlung ausstehend'
                                : sub.status === 'canceled'
                                ? 'Gekündigt'
                                : 'Inaktiv'}
                        </p>
                    </div>
                    <Badge variant="outline" className={
                        sub.status === 'active' ? 'border-green-200 text-green-700 bg-green-50' :
                        sub.isTrialing ? 'border-blue-200 text-blue-700 bg-blue-50' :
                        sub.status === 'past_due' ? 'border-amber-200 text-amber-700 bg-amber-50' :
                        'border-slate-200 text-slate-600'
                    }>
                        {sub.isTrialing ? 'Testphase' : sub.status === 'active' ? 'Aktiv' : sub.status === 'past_due' ? 'Überfällig' : sub.status}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-6">
                    <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-500 text-xs">Mitarbeiter-Limit</p>
                        <p className="font-semibold">{sub.limits.maxEmployees === -1 ? 'Unbegrenzt' : sub.limits.maxEmployees}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-500 text-xs">Admin-Nutzer</p>
                        <p className="font-semibold">{sub.limits.maxAdmins === -1 ? 'Unbegrenzt' : sub.limits.maxAdmins}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-slate-500 text-xs">HR-Manager</p>
                        <p className="font-semibold">{sub.limits.maxHRManagers === -1 ? 'Unbegrenzt' : sub.limits.maxHRManagers}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    {sub.stripeCustomerId ? (
                        <Button onClick={openPortal} disabled={portalLoading} variant="outline">
                            <CreditCard className="w-4 h-4 mr-2" />
                            {portalLoading ? 'Wird geöffnet...' : 'Rechnungen & Zahlungsmethoden'}
                        </Button>
                    ) : null}
                </div>
            </div>

            {/* Upgrade Options with billing interval toggle */}
            {sub.tier !== 'enterprise' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-900">Plan upgraden</h3>
                            <p className="text-sm text-slate-500">Jährliche Zahlung spart bis zu {maxYearlyDiscount}%</p>
                        </div>
                        {/* Billing interval toggle */}
                        <div className="flex items-center bg-slate-100 rounded-full p-1 gap-1">
                            <button
                                onClick={() => setBillingInterval('monthly')}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                    billingInterval === 'monthly'
                                        ? 'bg-white shadow-sm text-slate-900'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Monatlich
                            </button>
                            <button
                                onClick={() => setBillingInterval('yearly')}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                    billingInterval === 'yearly'
                                        ? 'bg-white shadow-sm text-slate-900'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Jährlich
                                <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">−{maxYearlyDiscount}%</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {sub.tier !== 'professional' && (
                            <>
                                <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                                    <div>
                                        <p className="font-semibold text-slate-900">Basis</p>
                                        <p className="text-2xl font-bold mt-1">
                                            {billingInterval === 'monthly' ? `€${basisMonthly}` : `€${Math.round(basisYearly / 12)}`}
                                            <span className="text-sm font-normal text-slate-500">/Monat</span>
                                        </p>
                                        {billingInterval === 'yearly' && (
                                            <p className="text-xs text-slate-500">€{basisYearly}/Jahr — eine Jahresrechnung</p>
                                        )}
                                    </div>
                                    <ul className="text-sm text-slate-600 space-y-1">
                                        <li>&#10003; Bis 50 Mitarbeiter</li>
                                        <li>&#10003; Gehaltsbänder & Job-Profile</li>
                                        <li>&#10003; CSV-Import</li>
                                    </ul>
                                    <Button variant="outline" className="w-full" onClick={() => startCheckout('basis')}>
                                        Basis wählen
                                    </Button>
                                </div>

                                <div className="border-2 border-primary rounded-xl p-5 space-y-3 relative">
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">Empfohlen</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">Professional</p>
                                        <p className="text-2xl font-bold mt-1">
                                            {billingInterval === 'monthly' ? `€${proMonthly}` : `€${Math.round(proYearly / 12)}`}
                                            <span className="text-sm font-normal text-slate-500">/Monat</span>
                                        </p>
                                        {billingInterval === 'yearly' && (
                                            <p className="text-xs text-slate-500">€{proYearly}/Jahr — eine Jahresrechnung</p>
                                        )}
                                    </div>
                                    <ul className="text-sm text-slate-600 space-y-1">
                                        <li>&#10003; Bis 250 Mitarbeiter</li>
                                        <li>&#10003; Gender-Pay-Gap Analyse</li>
                                        <li>&#10003; PDF-Berichte (EU-konform)</li>
                                        <li>&#10003; Unbegrenzte HR-Manager</li>
                                    </ul>
                                    <Button className="w-full" onClick={() => startCheckout('professional')}>
                                        Professional wählen
                                    </Button>
                                </div>
                            </>
                        )}

                        {sub.tier === 'professional' && (
                            <div className="border border-slate-200 rounded-xl p-5 space-y-3 col-span-2">
                                <p className="font-semibold text-slate-900">Enterprise — ab 250 Mitarbeiter</p>
                                <p className="text-sm text-slate-500">SSO, Auditor-Zugang, dedizierter Support, individuelle SLA. Preise auf Anfrage.</p>
                                <Button variant="outline" asChild>
                                    <a href="mailto:sales@klargehalt.de">Kontakt aufnehmen</a>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
