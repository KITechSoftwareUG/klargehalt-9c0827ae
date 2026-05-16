'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Check, LogOut, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

type Interval = 'monthly' | 'yearly';
type Tier = 'basis' | 'professional' | 'enterprise';

interface PlanCard {
    tier: Tier;
    name: string;
    desc: string;
    priceMonthly: number | null;
    priceYearlyPerMonth: number | null;
    yearlyTotal: number | null;
    yearlyLabel: string | null;
    highlights: string[];
    featured: boolean;
    cta: string;
}

const PLAN_CARDS: PlanCard[] = [
    {
        tier: 'basis',
        name: 'Basis',
        desc: 'Für kleine Unternehmen bis 50 Mitarbeiter',
        priceMonthly: 149,
        priceYearlyPerMonth: 124,
        yearlyTotal: 1490,
        yearlyLabel: '2 Monate gespart',
        highlights: ['Gender-Pay-Gap-Analyse', '1 Admin + 1 HR-Manager', 'Bis 50 Mitarbeiter'],
        featured: false,
        cta: 'Basis wählen',
    },
    {
        tier: 'professional',
        name: 'Professional',
        desc: 'Für wachsende Unternehmen mit EU-Berichtspflicht',
        priceMonthly: 299,
        priceYearlyPerMonth: 224,
        yearlyTotal: 2690,
        yearlyLabel: '3 Monate gespart',
        highlights: ['PDF-Berichte & Trendanalyse', '5 Admins, unbegrenzt HR', 'Bis 250 Mitarbeiter'],
        featured: true,
        cta: 'Professional wählen',
    },
    {
        tier: 'enterprise',
        name: 'Enterprise',
        desc: 'Für Großunternehmen mit individuellen Anforderungen',
        priceMonthly: null,
        priceYearlyPerMonth: null,
        yearlyTotal: null,
        yearlyLabel: null,
        highlights: ['Unbegrenzte Nutzer', '250+ Mitarbeiter', 'SLA & SSO'],
        featured: false,
        cta: 'Kontakt aufnehmen',
    },
];

export default function TrialExpiredOverlay() {
    const { signOut } = useAuth();
    const [interval, setInterval] = useState<Interval>('yearly');
    const [loadingTier, setLoadingTier] = useState<Tier | null>(null);

    const startCheckout = async (tier: Tier) => {
        if (tier === 'enterprise') {
            window.location.href = 'mailto:sales@klargehalt.de?subject=Enterprise-Plan%20Anfrage';
            return;
        }
        setLoadingTier(tier);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier, interval }),
            });
            const data = (await res.json()) as { url?: string; error?: string; code?: string; redirect?: string };
            if (res.status === 403 && data.code === 'CONTRACTS_NOT_ACCEPTED' && data.redirect) {
                window.location.href = data.redirect;
                return;
            }
            if (!res.ok) {
                toast.error(data.error || 'Checkout konnte nicht gestartet werden');
                return;
            }
            if (data.url) {
                window.location.href = data.url;
            }
        } catch {
            toast.error('Verbindungsfehler — bitte versuchen Sie es erneut');
        } finally {
            setLoadingTier(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-8 px-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-auto">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 sm:px-8 py-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Testphase abgelaufen</h2>
                            <p className="text-xs text-slate-500">Wählen Sie einen Plan, um fortzufahren</p>
                        </div>
                    </div>
                    <button
                        onClick={() => void signOut()}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Abmelden"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:inline">Abmelden</span>
                    </button>
                </div>

                <div className="px-6 sm:px-8 pt-6 pb-8">
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <button
                            onClick={() => setInterval('monthly')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                interval === 'monthly'
                                    ? 'bg-[#071423] text-white'
                                    : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                        >
                            Monatlich
                        </button>
                        <button
                            onClick={() => setInterval('yearly')}
                            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                interval === 'yearly'
                                    ? 'bg-[#071423] text-white'
                                    : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                        >
                            Jährlich
                            <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded-full">
                                bis -25%
                            </span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                        {PLAN_CARDS.map((p) => {
                            const price = interval === 'monthly' ? p.priceMonthly : p.priceYearlyPerMonth;
                            const isCustom = price === null;
                            const isLoading = loadingTier === p.tier;

                            return (
                                <div
                                    key={p.tier}
                                    className={`rounded-2xl p-6 flex flex-col ${
                                        p.featured
                                            ? 'bg-[#071423] text-white ring-2 ring-purple-500 shadow-[0_8px_32px_rgba(148,109,247,0.15)] lg:-my-2'
                                            : 'bg-white border border-slate-200'
                                    }`}
                                >
                                    {p.featured && (
                                        <span className="self-start px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-bold rounded-md mb-4 uppercase tracking-wider">
                                            Beliebteste Wahl
                                        </span>
                                    )}
                                    <h3 className={`text-lg font-bold tracking-tight mb-1 ${p.featured ? 'text-white' : 'text-[#071423]'}`}>
                                        {p.name}
                                    </h3>
                                    <p className="text-xs text-slate-400 mb-5">{p.desc}</p>

                                    <div className="flex items-baseline gap-1 mb-1">
                                        {!isCustom && <span className="text-xs text-slate-400">EUR</span>}
                                        <span className={`text-3xl font-extrabold tracking-tight ${p.featured ? 'text-white' : 'text-[#071423]'}`}>
                                            {isCustom ? 'Auf Anfrage' : price}
                                        </span>
                                        {!isCustom && <span className="text-xs text-slate-400">/mo</span>}
                                    </div>
                                    {!isCustom && interval === 'yearly' && p.yearlyTotal !== null && (
                                        <p className="text-xs text-slate-400 mb-4">
                                            EUR {p.yearlyTotal.toLocaleString('de-DE')}/Jahr ·{' '}
                                            <span className="text-green-500 font-medium">{p.yearlyLabel}</span>
                                        </p>
                                    )}
                                    {!isCustom && interval === 'monthly' && <p className="text-xs text-slate-400 mb-4">&nbsp;</p>}
                                    {isCustom && <p className="text-xs text-slate-400 mb-4">&nbsp;</p>}

                                    <div className={`h-px mb-5 ${p.featured ? 'bg-white/10' : 'bg-slate-100'}`} />

                                    <ul className="space-y-2 mb-6 flex-1">
                                        {p.highlights.map((h) => (
                                            <li key={h} className="flex items-start gap-2">
                                                <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${p.featured ? 'text-white/40' : 'text-slate-300'}`} />
                                                <span className={`text-sm ${p.featured ? 'text-slate-300' : 'text-slate-500'}`}>{h}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        onClick={() => void startCheckout(p.tier)}
                                        disabled={isLoading || loadingTier !== null}
                                        className={`w-full h-11 rounded-lg text-sm font-semibold group cursor-pointer ${
                                            p.featured
                                                ? 'bg-white text-[#071423] hover:bg-slate-100'
                                                : 'bg-slate-50 text-[#071423] hover:bg-slate-100 border border-slate-200'
                                        }`}
                                    >
                                        {isLoading ? 'Wird weitergeleitet...' : p.cta}
                                        {!isLoading && <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>

                    <p className="text-[11px] text-slate-400 text-center mt-6">
                        Alle Preise zzgl. MwSt. (19%). Ihre Daten bleiben 30 Tage nach Ablauf erhalten.
                    </p>
                </div>
            </div>
        </div>
    );
}
