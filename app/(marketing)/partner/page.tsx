import type { Metadata } from 'next';
import { ArrowRight, Check, HandshakeIcon, TrendingUp, Users, Zap } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Partner werden — KlarGehalt',
    description: 'Werden Sie KlarGehalt-Partner. Bieten Sie Ihren Kunden eine fertige EU-Entgelttransparenz-Lösung an und profitieren Sie von attraktiven Provisionen.',
};

const partnerTypes = [
    {
        title: 'HR-Berater & Personaldienstleister',
        desc: 'Sie beraten Unternehmen bei HR-Prozessen und Organisationsentwicklung. KlarGehalt ergänzt Ihr Portfolio mit einer schlüsselfertigen Compliance-Lösung.',
        color: '#946df7',
        bg: '#e0d4fd',
    },
    {
        title: 'Steuerberater & Lohnbüros',
        desc: 'Sie betreuen Unternehmen bei Lohn und Finanzen. Die EU-Entgelttransparenzpflicht betrifft Ihre Mandanten direkt — bieten Sie die passende Lösung gleich mit.',
        color: '#52e0de',
        bg: '#bdf9f7',
    },
    {
        title: 'Unternehmensberater & Consultants',
        desc: 'Sie begleiten Unternehmen bei Transformations- und Compliance-Projekten. KlarGehalt beschleunigt die Umsetzung der EU-Richtlinie bei Ihren Kunden erheblich.',
        color: '#fbcd56',
        bg: '#fef1c2',
    },
    {
        title: 'Rechtsanwaltskanzleien',
        desc: 'Sie beraten Unternehmen im Arbeits- und Gesellschaftsrecht. KlarGehalt liefert die technische Infrastruktur — Sie liefern die rechtliche Einordnung.',
        color: '#946df7',
        bg: '#e0d4fd',
    },
];

const benefits = [
    'Attraktive Umsatzprovision auf alle vermittelten Abschlüsse',
    'Co-Branding-Materialien und Vertriebsunterlagen',
    'Persönlicher Ansprechpartner und dedizierter Partner-Support',
    'Frühzeitiger Zugang zu neuen Features und Roadmap-Einblicken',
    'Gemeinsame Webinare und Schulungsangebote für Ihr Team',
    'Aufnahme in die offizielle KlarGehalt-Partnerliste',
    'Technische Schulung und Zertifizierung als KlarGehalt-Partner',
    'Demo-Zugang ohne zeitliche Begrenzung für Ihre Präsentationen',
];

const steps = [
    {
        number: '01',
        title: 'Kontakt aufnehmen',
        desc: 'Senden Sie uns eine kurze Anfrage über das Kontaktformular. Beschreiben Sie kurz, wer Sie sind und wie viele Kunden Sie betreuen.',
    },
    {
        number: '02',
        title: 'Kennenlerngespräch',
        desc: 'In einem 30-minütigen Gespräch besprechen wir das Partnermodell, die Provisionsstruktur und klären erste Fragen.',
    },
    {
        number: '03',
        title: 'Partnervertrag & Onboarding',
        desc: 'Nach Abschluss des Partnervertrags erhalten Sie Zugang zu allen Materialien, Demo-Account und Ihrem persönlichen Ansprechpartner.',
    },
];

export default function PartnerPage() {
    return (
        <>
            {/* Hero */}
            <section className="pt-[72px] bg-[#071423]">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 lg:pt-36 pb-16">
                    <div className="max-w-3xl">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[var(--ep-purple)]/20 text-[var(--ep-purple-light)] mb-5">
                            Partnerprogramm
                        </span>
                        <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-extrabold text-white tracking-tight leading-[1.1] mb-6">
                            Partner werden.<br />
                            <span className="text-white/40">Gemeinsam compliant.</span>
                        </h1>
                        <p className="text-base lg:text-lg text-white/60 leading-relaxed max-w-[55ch] mb-10">
                            Bieten Sie Ihren Kunden eine fertige Lösung für die EU-Entgelttransparenzpflicht —
                            ohne eigene Entwicklung. Wir liefern die Plattform, Sie liefern die Beziehung.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/kontakt"
                                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-[#52e0de] text-[#071423] hover:opacity-90 transition-opacity cursor-pointer"
                            >
                                Partner werden <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/funktionen"
                                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium text-white/70 border border-white/20 hover:border-white/40 hover:text-white transition-colors cursor-pointer"
                            >
                                Plattform ansehen
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="h-24 bg-gradient-to-b from-[#071423] to-white" />
            </section>

            {/* Stats */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                        {[
                            { value: '800.000+', label: 'betroffene Unternehmen in DE' },
                            { value: 'Juni 2026', label: 'EU-Frist nähert sich' },
                            { value: '14 Tage', label: 'kostenlose Testphase für Kunden' },
                            { value: '< 1 Tag', label: 'durchschnittliche Einrichtungszeit' },
                        ].map((stat) => (
                            <div key={stat.label} className="text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                <p className="text-2xl lg:text-3xl font-extrabold text-[#071423] mb-1">{stat.value}</p>
                                <p className="text-xs text-slate-500">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* For whom */}
            <section className="py-20 lg:py-28 bg-slate-50">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="max-w-2xl mb-12">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-4">
                            Für wen ist das Partnerprogramm?
                        </h2>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            KlarGehalt-Partner sind Dienstleister, die Unternehmen bei HR, Recht oder
                            Unternehmensführung begleiten — und ihren Kunden jetzt auch bei der
                            EU-Entgelttransparenz helfen wollen.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {partnerTypes.map((type) => (
                            <div key={type.title} className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8">
                                <div
                                    className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center"
                                    style={{ backgroundColor: type.bg }}
                                >
                                    <HandshakeIcon className="w-5 h-5" style={{ color: type.color }} />
                                </div>
                                <h3 className="text-base font-bold text-[#071423] mb-2">{type.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{type.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-20 lg:py-28 bg-white">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-6">
                                Was Sie als Partner erhalten.
                            </h2>
                            <ul className="space-y-3">
                                {benefits.map((b) => (
                                    <li key={b} className="flex items-start gap-3">
                                        <div className="mt-0.5 w-5 h-5 rounded-full bg-[#52e0de]/20 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-[#19514a]" />
                                        </div>
                                        <span className="text-sm text-slate-600 leading-relaxed">{b}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-[#071423] rounded-2xl p-8 text-white">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#52e0de]/20 flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-[#52e0de]" />
                                    </div>
                                    <h3 className="text-base font-bold">Wachsender Markt</h3>
                                </div>
                                <p className="text-sm text-white/60 leading-relaxed">
                                    Die EU-Richtlinie betrifft ab Juni 2026 alle Unternehmen mit mehr als
                                    100 Mitarbeitern — und schrittweise auch kleinere. Das ist ein enormes
                                    Marktpotenzial für alle, die frühzeitig positioniert sind.
                                </p>
                            </div>
                            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#946df7]/20 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-[#946df7]" />
                                    </div>
                                    <h3 className="text-base font-bold text-[#071423]">Schneller Einstieg</h3>
                                </div>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Von der ersten Anfrage bis zum aktiven Partner vergehen in der Regel
                                    weniger als zwei Wochen. Ihr Demo-Zugang ist sofort einsatzbereit.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-20 lg:py-28 bg-slate-50">
                <div className="max-w-3xl mx-auto px-5 sm:px-8">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-12 text-center">
                        So werden Sie Partner.
                    </h2>
                    <div className="space-y-0">
                        {steps.map((step, i) => (
                            <div key={step.number} className="flex gap-6 py-8 border-b border-slate-200 last:border-0">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-[#071423] flex items-center justify-center flex-shrink-0">
                                        <span className="text-[10px] font-bold text-white">{step.number}</span>
                                    </div>
                                    {i < steps.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-2" />}
                                </div>
                                <div className="-mt-1 pb-2">
                                    <h3 className="text-base font-bold text-[#071423] mb-2">{step.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="relative bg-[#51398e] py-20 lg:py-28 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#51398e] via-[#51398e] to-[#946df7]/30" />
                <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                            <Users className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                        Bereit, Partner zu werden?
                    </h2>
                    <p className="text-base text-white/60 leading-relaxed mb-8 max-w-[44ch] mx-auto">
                        Schreiben Sie uns — wir melden uns innerhalb von 24 Stunden mit allen Details
                        zum Partnerprogramm.
                    </p>
                    <Link
                        href="/kontakt"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-semibold bg-white text-[#51398e] hover:bg-white/90 transition-colors cursor-pointer"
                    >
                        Jetzt Partner-Anfrage stellen <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>
        </>
    );
}
