'use client';

import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Minus, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { getAppUrl } from '@/utils/url';

const plans = [
    {
        name: 'Starter',
        desc: 'Bis 50 Mitarbeiter',
        price: '199',
        period: '/mo',
        cta: 'Demo anfragen',
        href: '/kontakt',
        featured: false,
    },
    {
        name: 'Business',
        desc: 'Bis 250 Mitarbeiter',
        price: '499',
        period: '/mo',
        cta: 'Demo anfragen',
        href: '/kontakt',
        featured: true,
    },
    {
        name: 'Enterprise',
        desc: 'Ab 250 Mitarbeiter',
        price: 'Auf Anfrage',
        period: '',
        cta: 'Kontakt aufnehmen',
        href: '/kontakt',
        featured: false,
    },
];

type FeatureValue = boolean | string;

const comparisonFeatures: { category: string; features: { name: string; starter: FeatureValue; business: FeatureValue; enterprise: FeatureValue }[] }[] = [
    {
        category: 'Kernfunktionen',
        features: [
            { name: 'Job-Profile & Gehaltsbaender', starter: true, business: true, enterprise: true },
            { name: 'Mitarbeiterverwaltung', starter: 'Bis 50', business: 'Bis 250', enterprise: 'Unbegrenzt' },
            { name: 'CSV-Import', starter: true, business: true, enterprise: true },
            { name: 'Gender-Pay-Gap Analyse', starter: false, business: true, enterprise: true },
            { name: 'Pay-Gap Berichte (PDF)', starter: false, business: true, enterprise: true },
            { name: 'Trendanalyse ueber Zeitraeume', starter: false, business: true, enterprise: true },
        ],
    },
    {
        category: 'Zugriff & Rollen',
        features: [
            { name: 'Admin-Nutzer', starter: '1', business: '5', enterprise: 'Unbegrenzt' },
            { name: 'HR-Manager Rolle', starter: true, business: true, enterprise: true },
            { name: 'Mitarbeiter Self-Service', starter: true, business: true, enterprise: true },
            { name: 'SSO Integration', starter: false, business: true, enterprise: true },
            { name: 'Pruefer-Zugaenge (read-only)', starter: false, business: false, enterprise: true },
        ],
    },
    {
        category: 'Compliance & Audit',
        features: [
            { name: 'Basis Audit-Trail', starter: true, business: true, enterprise: true },
            { name: 'Erweiterter Audit-Trail', starter: false, business: true, enterprise: true },
            { name: 'Export fuer Pruefer', starter: false, business: true, enterprise: true },
            { name: 'DSGVO Auskunfts-Workflow', starter: true, business: true, enterprise: true },
        ],
    },
    {
        category: 'Support & Service',
        features: [
            { name: 'E-Mail Support', starter: true, business: true, enterprise: true },
            { name: 'Priority Support', starter: false, business: true, enterprise: true },
            { name: 'Dedizierter Ansprechpartner', starter: false, business: false, enterprise: true },
            { name: 'Onboarding-Begleitung', starter: false, business: true, enterprise: true },
            { name: 'SLA', starter: false, business: false, enterprise: true },
            { name: 'Custom Integrationen', starter: false, business: false, enterprise: true },
        ],
    },
];

const faqs = [
    {
        q: 'Gibt es eine kostenlose Testphase?',
        a: 'Ja. Wir bieten eine 14-taegige kostenlose Testphase fuer alle Plaene an. Keine Kreditkarte noetig. Sprechen Sie uns an fuer den Zugang.',
    },
    {
        q: 'Was passiert, wenn wir mehr als 250 Mitarbeiter haben?',
        a: 'Ab 250 Mitarbeitern empfehlen wir den Enterprise-Plan. Dieser wird individuell auf Ihre Anforderungen zugeschnitten — inkl. SLA, dediziertem Ansprechpartner und Custom Integrationen.',
    },
    {
        q: 'Koennen wir spaeter upgraden?',
        a: 'Jederzeit. Ein Upgrade ist innerhalb weniger Minuten moeglich. Alle Daten bleiben erhalten. Downgrades sind zum naechsten Abrechnungszeitraum moeglich.',
    },
    {
        q: 'Wie wird abgerechnet?',
        a: 'Monatlich oder jaehrlich. Bei jaehrlicher Abrechnung sparen Sie zwei Monatsgebuehren. Alle Preise verstehen sich zzgl. MwSt.',
    },
    {
        q: 'Gibt es Rabatte fuer gemeinnuetzige Organisationen?',
        a: 'Ja. Kontaktieren Sie uns fuer ein individuelles Angebot.',
    },
    {
        q: 'Was ist im Onboarding enthalten?',
        a: 'Im Business- und Enterprise-Plan begleiten wir Sie beim Setup: Datenimport, Konfiguration der Gehaltsstruktur und Schulung Ihres HR-Teams. Beim Starter-Plan stehen Ihnen ausfuehrliche Dokumentation und E-Mail-Support zur Verfuegung.',
    },
];

function FeatureCell({ value }: { value: FeatureValue }) {
    if (typeof value === 'boolean') {
        return value ? (
            <Check className="w-4 h-4 text-[#071423]" />
        ) : (
            <Minus className="w-4 h-4 text-slate-200" />
        );
    }
    return <span className="text-sm font-medium text-[#071423]">{value}</span>;
}

export default function PreisePage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <>
            {/* Hero */}
            <section className="pt-[72px] bg-[#071423]">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 lg:pt-36 pb-16">
                    <div className="max-w-3xl">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[var(--ep-yellow)]/20 text-[var(--ep-yellow)] mb-5">
                            Transparente Preise
                        </span>
                        <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-extrabold text-white tracking-tight leading-[1.1] mb-6">
                            Klare Preise.<br />
                            <span className="text-white/40">Keine Ueberraschungen.</span>
                        </h1>
                        <p className="text-base lg:text-lg text-white/60 leading-relaxed max-w-[55ch]">
                            Compliance-Software sollte selbst transparent sein.
                            Waehlen Sie den Plan, der zu Ihrer Unternehmensgroesse passt.
                        </p>
                    </div>
                </div>
                <div className="h-24 bg-gradient-to-b from-[#071423] to-[var(--ep-gray-1)]" />
            </section>

            {/* Pricing Cards */}
            <section className="py-20 lg:py-28 bg-slate-50">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {plans.map((p) => (
                            <div
                                key={p.name}
                                className={`rounded-2xl p-7 lg:p-9 flex flex-col ${
                                    p.featured
                                        ? 'bg-[#071423] text-white ring-2 ring-[var(--ep-purple)] shadow-[0_8px_32px_rgba(148,109,247,0.15)] lg:-my-3'
                                        : 'bg-white border border-slate-200'
                                }`}
                            >
                                {p.featured && (
                                    <span className="self-start px-2.5 py-1 bg-[var(--ep-purple)]/20 text-[var(--ep-purple-light)] text-[10px] font-bold rounded-md mb-5 uppercase tracking-wider">
                                        Beliebteste Wahl
                                    </span>
                                )}
                                <h3 className={`text-lg font-bold tracking-tight mb-1 ${p.featured ? 'text-white' : 'text-[#071423]'}`}>{p.name}</h3>
                                <p className="text-xs text-slate-400 mb-6">{p.desc}</p>

                                <div className="flex items-baseline gap-1 mb-7">
                                    {p.price !== 'Auf Anfrage' && <span className="text-xs text-slate-400">EUR</span>}
                                    <span className={`text-3xl font-extrabold tracking-tight ${p.featured ? 'text-white' : 'text-[#071423]'}`}>{p.price}</span>
                                    {p.period && <span className="text-xs text-slate-400">{p.period}</span>}
                                </div>

                                <Link href={p.href}>
                                    <Button
                                        className={`w-full h-11 rounded-lg text-sm font-semibold group cursor-pointer ${
                                            p.featured
                                                ? 'bg-white text-[#071423] hover:bg-slate-100'
                                                : 'bg-slate-50 text-[#071423] hover:bg-slate-100 border border-slate-200'
                                        }`}
                                    >
                                        {p.cta}
                                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                    <p className="text-[11px] text-slate-300 text-center mt-8">Alle Preise zzgl. MwSt. Jaehrliche Abrechnung moeglich.</p>
                </div>
            </section>

            {/* Comparison Table */}
            <section className="py-20 lg:py-28 bg-white">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-12">
                        Feature-Vergleich im Detail.
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-4 pr-4 text-sm font-medium text-slate-400 w-[40%]">Funktion</th>
                                    <th className="text-center py-4 px-4 text-sm font-bold text-[#071423] w-[20%]">Starter</th>
                                    <th className="text-center py-4 px-4 text-sm font-bold text-[#071423] w-[20%] bg-slate-50 rounded-t-lg">Business</th>
                                    <th className="text-center py-4 px-4 text-sm font-bold text-[#071423] w-[20%]">Enterprise</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonFeatures.map((cat) => (
                                    <>
                                        <tr key={cat.category}>
                                            <td colSpan={4} className="pt-8 pb-3">
                                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-[0.15em]">{cat.category}</span>
                                            </td>
                                        </tr>
                                        {cat.features.map((f) => (
                                            <tr key={f.name} className="border-b border-slate-100">
                                                <td className="py-3.5 pr-4 text-sm text-slate-600">{f.name}</td>
                                                <td className="py-3.5 px-4 text-center"><div className="flex justify-center"><FeatureCell value={f.starter} /></div></td>
                                                <td className="py-3.5 px-4 text-center bg-slate-50"><div className="flex justify-center"><FeatureCell value={f.business} /></div></td>
                                                <td className="py-3.5 px-4 text-center"><div className="flex justify-center"><FeatureCell value={f.enterprise} /></div></td>
                                            </tr>
                                        ))}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 lg:py-28 bg-slate-50">
                <div className="max-w-3xl mx-auto px-5 sm:px-8">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-12">
                        Haeufig gestellte Fragen.
                    </h2>

                    <div className="space-y-0">
                        {faqs.map((faq, i) => (
                            <div key={i} className="border-b border-slate-200">
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="flex items-center justify-between w-full py-5 text-left cursor-pointer"
                                >
                                    <span className="text-sm font-semibold text-[#071423] pr-4">{faq.q}</span>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                                </button>
                                {openFaq === i && (
                                    <p className="text-sm text-slate-500 leading-relaxed pb-5 -mt-1">{faq.a}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 lg:py-24 bg-[#071423]">
                <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
                        Nicht sicher, welcher Plan passt?
                    </h2>
                    <p className="text-sm text-slate-400 mb-8 max-w-[45ch] mx-auto">
                        Wir beraten Sie gerne. In 20 Minuten finden wir gemeinsam die richtige Loesung.
                    </p>
                    <Link href="/kontakt">
                        <Button className="bg-white text-[#071423] hover:bg-slate-100 h-12 px-8 rounded-lg text-sm font-semibold cursor-pointer">
                            Beratungsgespraech buchen <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </section>
        </>
    );
}
