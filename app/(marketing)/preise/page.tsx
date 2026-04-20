'use client';

import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Minus, ChevronDown, Shield, Building2, Users, FileText, Scale } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { getAppUrl } from '@/utils/url';

type Interval = 'monthly' | 'yearly';

const plans = [
    {
        name: 'Basis',
        desc: 'Für kleine Unternehmen bis 50 Mitarbeiter',
        priceMonthly: 149,
        priceYearly: 124,
        yearlyTotal: 1490,
        yearlyLabel: '2 Monate gespart',
        cta: 'Kostenlos testen',
        href: getAppUrl('/sign-up?plan=basis'),
        featured: false,
        highlights: ['Gender-Pay-Gap-Analyse', '1 Admin + 1 HR-Manager', 'Bis 50 Mitarbeiter'],
    },
    {
        name: 'Professional',
        desc: 'Für wachsende Unternehmen mit EU-Berichtspflicht',
        priceMonthly: 299,
        priceYearly: 224,
        yearlyTotal: 2690,
        yearlyLabel: '3 Monate gespart',
        cta: '14 Tage kostenlos testen',
        href: getAppUrl('/sign-up?plan=professional'),
        featured: true,
        highlights: ['PDF-Berichte & Trendanalyse', '5 Admins, unbegrenzt HR', 'Bis 250 Mitarbeiter'],
    },
    {
        name: 'Enterprise',
        desc: 'Für Großunternehmen mit individuellen Anforderungen',
        priceMonthly: null,
        priceYearly: null,
        yearlyTotal: null,
        yearlyLabel: null,
        cta: 'Kontakt aufnehmen',
        href: '/kontakt',
        featured: false,
        highlights: ['Unbegrenzte Nutzer', '250+ Mitarbeiter', 'SLA & SSO'],
    },
];

type FeatureValue = boolean | string;

const comparisonFeatures: { category: string; features: { name: string; basis: FeatureValue; professional: FeatureValue; enterprise: FeatureValue }[] }[] = [
    {
        category: 'Kernfunktionen',
        features: [
            { name: 'Job-Profile & Gehaltsbänder', basis: true, professional: true, enterprise: true },
            { name: 'Mitarbeiterverwaltung', basis: 'Bis 50', professional: 'Bis 250', enterprise: 'Unbegrenzt' },
            { name: 'CSV/Excel-Import', basis: true, professional: true, enterprise: true },
            { name: 'Abteilungen & Karrierestufen', basis: true, professional: true, enterprise: true },
            { name: 'Gender-Pay-Gap Analyse', basis: true, professional: true, enterprise: true },
            { name: 'Pay-Gap Berichte (PDF)', basis: false, professional: true, enterprise: true },
            { name: 'Trendanalyse über Zeiträume', basis: false, professional: true, enterprise: true },
            { name: 'KI-gestützte Handlungsempfehlungen', basis: false, professional: true, enterprise: true },
        ],
    },
    {
        category: 'Zugriff & Rollen',
        features: [
            { name: 'Admin-Nutzer', basis: '1', professional: '5', enterprise: 'Unbegrenzt' },
            { name: 'HR-Manager', basis: '1', professional: 'Unbegrenzt', enterprise: 'Unbegrenzt' },
            { name: 'Mitarbeiter Self-Service (EntgTranspG)', basis: true, professional: true, enterprise: true },
            { name: 'Multi-Faktor-Authentifizierung (TOTP)', basis: true, professional: true, enterprise: true },
            { name: 'Single Sign-On (SSO/SAML)', basis: false, professional: false, enterprise: true },
            { name: 'Auditor-Zugang (read-only)', basis: false, professional: false, enterprise: true },
        ],
    },
    {
        category: 'Compliance & Audit',
        features: [
            { name: 'Basis Audit-Trail', basis: true, professional: true, enterprise: true },
            { name: 'Erweiterter Audit-Trail (IP, Timestamps)', basis: false, professional: true, enterprise: true },
            { name: 'Prüfer-Export (CSV/PDF)', basis: false, professional: true, enterprise: true },
            { name: 'DSGVO Auskunfts-Workflow (§ 10 EntgTranspG)', basis: true, professional: true, enterprise: true },
            { name: 'EU-Richtlinie 2023/970 Compliance-Report', basis: false, professional: true, enterprise: true },
        ],
    },
    {
        category: 'Datenschutz & Sicherheit',
        features: [
            { name: 'Ende-zu-Ende-Verschlüsselung', basis: true, professional: true, enterprise: true },
            { name: 'EU-Rechenzentrum (Frankfurt)', basis: true, professional: true, enterprise: true },
            { name: 'DSGVO-konforme Datenverarbeitung', basis: true, professional: true, enterprise: true },
            { name: 'AV-Vertrag (Art. 28 DSGVO)', basis: true, professional: true, enterprise: true },
            { name: 'BSI-konforme Passwortrichtlinie', basis: true, professional: true, enterprise: true },
            { name: 'Eigener Tenant (Datenisolierung)', basis: true, professional: true, enterprise: true },
        ],
    },
    {
        category: 'Support & Service',
        features: [
            { name: 'Dokumentation & Hilfe-Center', basis: true, professional: true, enterprise: true },
            { name: 'E-Mail Support', basis: true, professional: true, enterprise: true },
            { name: 'Prioritäts-Support (< 4h Reaktionszeit)', basis: false, professional: true, enterprise: true },
            { name: 'Onboarding-Begleitung', basis: false, professional: true, enterprise: true },
            { name: 'Dedizierter Ansprechpartner', basis: false, professional: false, enterprise: true },
            { name: 'SLA (99,9% Uptime)', basis: false, professional: false, enterprise: true },
            { name: 'Custom Integrationen (API)', basis: false, professional: false, enterprise: true },
        ],
    },
];

const faqs = [
    {
        q: 'Gibt es eine kostenlose Testphase?',
        a: 'Ja — 14 Tage kostenlos mit allen Professional-Funktionen. Keine Kreditkarte nötig. Nach Ablauf der Testphase wählen Sie Ihren Plan oder nutzen den kostenlosen Basis-Funktionsumfang weiter.',
    },
    {
        q: 'Wie funktioniert die Abrechnung?',
        a: 'Monatlich oder jährlich per Kreditkarte, SEPA-Lastschrift oder Rechnung. Im Basis-Plan sparen Sie bei jährlicher Abrechnung 2 Monate, im Professional-Plan sogar 3 Monate. Alle Preise verstehen sich zzgl. der gesetzlichen MwSt. (19%). Sie erhalten eine ordnungsgemäße Rechnung mit ausgewiesener Umsatzsteuer.',
    },
    {
        q: 'Können wir jederzeit kündigen?',
        a: 'Ja. Bei monatlicher Abrechnung ist die Kündigung zum Ende des laufenden Monats möglich. Bei jährlicher Abrechnung zum Ende der Laufzeit. Ihre Daten bleiben nach Kündigung 90 Tage gespeichert, bevor sie unwiderruflich gelöscht werden.',
    },
    {
        q: 'Können wir später upgraden oder downgraden?',
        a: 'Jederzeit. Upgrades werden sofort wirksam, Sie zahlen nur den anteiligen Differenzbetrag. Downgrades werden zum nächsten Abrechnungszeitraum wirksam. Alle Daten bleiben bei einem Planwechsel vollständig erhalten.',
    },
    {
        q: 'Wo werden unsere Gehaltsdaten gespeichert?',
        a: 'Ausschließlich auf EU-Servern in Frankfurt am Main (AWS eu-central-1). Die Datenverarbeitung erfolgt vollständig DSGVO-konform. Jedes Unternehmen erhält einen eigenen, isolierten Tenant — Ihre Daten sind physisch von anderen Kunden getrennt.',
    },
    {
        q: 'Gibt es einen Auftragsverarbeitungsvertrag (AV-Vertrag)?',
        a: 'Ja. Einen AV-Vertrag gemäß Art. 28 DSGVO stellen wir allen Kunden kostenlos zur Verfügung. Für Enterprise-Kunden bieten wir individuelle Datenschutzvereinbarungen an.',
    },
    {
        q: 'Was ist im Onboarding enthalten?',
        a: 'Im Professional-Plan begleiten wir Sie beim Setup: Datenimport, Konfiguration der Gehaltsstruktur und Schulung Ihres HR-Teams (bis zu 2 Stunden). Im Enterprise-Plan erhalten Sie ein umfassendes Onboarding mit dediziertem Ansprechpartner.',
    },
    {
        q: 'Welche gesetzliche Grundlage deckt KlarGehalt ab?',
        a: 'KlarGehalt unterstützt die vollständige Umsetzung der EU-Entgelttransparenzrichtlinie 2023/970 (umzusetzen bis 7. Juni 2026) sowie des deutschen Entgelttransparenzgesetzes (EntgTranspG). Dies umfasst: Gehaltsbandtransparenz, Auskunftsansprüche nach § 10 EntgTranspG, Gender-Pay-Gap-Berichte und Dokumentationspflichten.',
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
    const [interval, setInterval] = useState<Interval>('yearly');

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
                            <span className="text-white/40">Keine Überraschungen.</span>
                        </h1>
                        <p className="text-base lg:text-lg text-white/60 leading-relaxed max-w-[55ch]">
                            14 Tage kostenlos testen — keine Kreditkarte nötig.
                            Wählen Sie den Plan, der zu Ihrer Unternehmensgröße passt.
                        </p>
                    </div>
                </div>
                <div className="h-24 bg-gradient-to-b from-[#071423] to-[var(--ep-gray-1)]" />
            </section>

            {/* Pricing Cards */}
            <section className="py-20 lg:py-28 bg-slate-50">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    {/* Interval Toggle */}
                    <div className="flex items-center justify-center gap-3 mb-12">
                        <button
                            onClick={() => setInterval('monthly')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                interval === 'monthly' ? 'bg-[#071423] text-white' : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                        >
                            Monatlich
                        </button>
                        <button
                            onClick={() => setInterval('yearly')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                                interval === 'yearly' ? 'bg-[#071423] text-white' : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                        >
                            Jährlich
                            <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded-full">
                                bis -25%
                            </span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {plans.map((p) => {
                            const price = interval === 'monthly' ? p.priceMonthly : p.priceYearly;
                            const isCustom = price === null;

                            return (
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

                                    <div className="flex items-baseline gap-1 mb-2">
                                        {!isCustom && <span className="text-xs text-slate-400">EUR</span>}
                                        <span className={`text-3xl font-extrabold tracking-tight ${p.featured ? 'text-white' : 'text-[#071423]'}`}>
                                            {isCustom ? 'Auf Anfrage' : price}
                                        </span>
                                        {!isCustom && <span className="text-xs text-slate-400">/mo</span>}
                                    </div>
                                    {!isCustom && interval === 'yearly' && (
                                        <p className="text-xs text-slate-400 mb-5">
                                            EUR {p.yearlyTotal?.toLocaleString('de-DE')}/Jahr · <span className="text-green-500 font-medium">{p.yearlyLabel}</span>
                                        </p>
                                    )}
                                    {!isCustom && interval === 'monthly' && (
                                        <p className="text-xs text-slate-400 mb-5">&nbsp;</p>
                                    )}
                                    {isCustom && <p className="text-xs text-slate-400 mb-5">&nbsp;</p>}

                                    <div className={`h-px mb-6 ${p.featured ? 'bg-white/10' : 'bg-slate-100'}`} />

                                    <ul className="space-y-2.5 mb-8 flex-1">
                                        {p.highlights.map((h) => (
                                            <li key={h} className="flex items-start gap-2.5">
                                                <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${p.featured ? 'text-white/40' : 'text-slate-300'}`} />
                                                <span className={`text-sm ${p.featured ? 'text-slate-300' : 'text-slate-500'}`}>{h}</span>
                                            </li>
                                        ))}
                                    </ul>

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
                            );
                        })}
                    </div>
                    <p className="text-[11px] text-slate-300 text-center mt-8">Alle Preise zzgl. der gesetzlichen MwSt. (19%). Zahlung per Kreditkarte, SEPA-Lastschrift oder Rechnung.</p>
                </div>
            </section>

            {/* Trust & Compliance Badges */}
            <section className="py-16 bg-white border-b border-slate-100">
                <div className="max-w-5xl mx-auto px-5 sm:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { icon: Shield, title: 'DSGVO-konform', desc: 'Vollständige Compliance nach EU-Datenschutzrecht' },
                            { icon: Building2, title: 'EU-Rechenzentrum', desc: 'Daten ausschließlich in Frankfurt (eu-central-1)' },
                            { icon: Scale, title: 'EU-Richtlinie 2023/970', desc: 'Entgelttransparenzrichtlinie vollständig abgedeckt' },
                            { icon: FileText, title: 'AV-Vertrag inklusive', desc: 'Auftragsverarbeitung nach Art. 28 DSGVO' },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="text-center">
                                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3">
                                    <Icon className="w-5 h-5 text-[#071423]" />
                                </div>
                                <h3 className="text-sm font-bold text-[#071423] mb-1">{title}</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Nutzungsrechte & Vertragsbedingungen */}
            <section className="py-20 lg:py-28 bg-slate-50">
                <div className="max-w-4xl mx-auto px-5 sm:px-8">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-4">
                        Nutzungsrechte & Vertragsbedingungen.
                    </h2>
                    <p className="text-sm text-slate-500 mb-12 max-w-[60ch]">
                        Transparente Konditionen — wie es sich für eine Transparenz-Software gehört.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                title: 'Lizenzmodell',
                                items: [
                                    'SaaS-Mietlizenz pro Organisation (Tenant)',
                                    'Nutzungsrecht für die Vertragslaufzeit',
                                    'Keine Einrichtungsgebühr oder versteckte Kosten',
                                    'Inklusive aller Updates und Wartung',
                                ],
                            },
                            {
                                title: 'Vertragslaufzeit',
                                items: [
                                    'Monatlich: Kündigung zum Monatsende',
                                    'Jährlich: Kündigung zum Laufzeitende',
                                    '14 Tage kostenlose Testphase',
                                    'Automatische Verlängerung (kündbar)',
                                ],
                            },
                            {
                                title: 'Datenhoheit',
                                items: [
                                    'Sie bleiben Eigentümer aller Ihrer Daten',
                                    'Vollständiger Datenexport jederzeit möglich (CSV/JSON)',
                                    'Datenlöschung 90 Tage nach Vertragsende',
                                    'Auf Wunsch sofortige Löschung nach Kündigung',
                                ],
                            },
                            {
                                title: 'Datenschutz & Sicherheit',
                                items: [
                                    'AV-Vertrag nach Art. 28 DSGVO inklusive',
                                    'Verarbeitung ausschließlich in der EU (Frankfurt)',
                                    'Verschlüsselung in Transit (TLS 1.3) und at Rest (AES-256)',
                                    'Regelmäßige Sicherheitsaudits und Penetrationstests',
                                ],
                            },
                        ].map((block) => (
                            <div key={block.title} className="bg-white rounded-xl border border-slate-200 p-6">
                                <h3 className="text-sm font-bold text-[#071423] mb-4">{block.title}</h3>
                                <ul className="space-y-2.5">
                                    {block.items.map((item) => (
                                        <li key={item} className="flex items-start gap-2.5">
                                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm text-slate-600">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <p className="text-xs text-slate-400 text-center mt-8">
                        Es gelten unsere <Link href="/agb" className="underline hover:text-slate-600">Allgemeinen Geschäftsbedingungen</Link> und die <Link href="/datenschutz" className="underline hover:text-slate-600">Datenschutzerklärung</Link>.
                    </p>
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
                                    <th className="text-center py-4 px-4 text-sm font-bold text-[#071423] w-[20%]">Basis</th>
                                    <th className="text-center py-4 px-4 text-sm font-bold text-[#071423] w-[20%] bg-slate-50 rounded-t-lg">Professional</th>
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
                                                <td className="py-3.5 px-4 text-center"><div className="flex justify-center"><FeatureCell value={f.basis} /></div></td>
                                                <td className="py-3.5 px-4 text-center bg-slate-50"><div className="flex justify-center"><FeatureCell value={f.professional} /></div></td>
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
                        Häufig gestellte Fragen.
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
                        Wir beraten Sie gerne. In 20 Minuten finden wir gemeinsam die richtige Lösung für Ihr Unternehmen.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/kontakt">
                            <Button className="bg-white text-[#071423] hover:bg-slate-100 h-12 px-8 rounded-lg text-sm font-semibold cursor-pointer">
                                Beratungsgespräch buchen <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                        <Link href={getAppUrl('/sign-up')}>
                            <Button variant="outline" className="h-12 px-8 rounded-lg text-sm font-semibold border-white/20 text-white hover:bg-white/10 cursor-pointer">
                                Direkt kostenlos starten
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
