import type { Metadata } from 'next';
import { ArrowRight, Check, Scale, ShieldCheck, FileCheck, UserCheck } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Für Anwälte & Rechtliche Absicherung — KlarGehalt',
    description: 'KlarGehalt verbindet Unternehmen mit unabhängigen Rechtsanwälten für die Prüfung ihrer Entgelttransparenz-Dokumentation. Rechtliche Absicherung, die im Ernstfall standhält.',
};

const reviewItems = [
    'Gehaltsstruktur und Eingruppierungskriterien auf Konformität mit der EU-Richtlinie 2023/970',
    'Dokumentation individueller Gehaltsentscheidungen auf Nachvollziehbarkeit',
    'Identifizierte Entgeltlücken und die hinterlegten Begründungen',
    'Auskunftsprozess für Mitarbeiter gemäß Auskunftsanspruch',
    'Gemeinsame Bewertung im Sinne des § 21 EntgTranspG',
];

const companyBenefits = [
    'Im Streitfall: dokumentierte externe Rechtsberatung als Nachweis sorgfältiger Prüfung',
    'Klares Feedback, wo Handlungsbedarf besteht — vor einer Behördenanfrage',
    'Keine Abhängigkeit von großen Beratungshäusern — unabhängiger Anwalt, fairer Preis',
    'Prüfung direkt auf Basis Ihrer KlarGehalt-Daten — kein doppelter Aufwand',
    'Optional als Einmal-Prüfung oder jährliche Erneuerung buchbar',
];

const lawyerBenefits = [
    'Zugang zu vollständig strukturierten Mandantendaten direkt in KlarGehalt',
    'Keine Vorbereitung und kein Datenchaos — alles ist aufgeräumt, wenn Sie starten',
    'Standardisierter Prüfprozess mit klaren Checkpoints und Dokumentationsvorlage',
    'Faire und transparente Vergütung pro Prüfauftrag',
    'Erweiterung Ihres Dienstleistungsportfolios im wachsenden Compliance-Markt',
    'Aufnahme in das KlarGehalt-Anwaltsnetzwerk mit Sichtbarkeit für potenzielle Mandanten',
];

export default function AnwaltPage() {
    return (
        <>
            {/* Hero */}
            <section className="pt-[72px] bg-[#071423]">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 lg:pt-36 pb-16">
                    <div className="max-w-3xl">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#fbcd56]/20 text-[#fbcd56] mb-5">
                            Recht & Anwaltsnetzwerk
                        </span>
                        <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-extrabold text-white tracking-tight leading-[1.1] mb-6">
                            Rechtliche Absicherung.<br />
                            <span className="text-white/40">Von echten Anwälten.</span>
                        </h1>
                        <p className="text-base lg:text-lg text-white/60 leading-relaxed max-w-[55ch] mb-10">
                            KlarGehalt verbindet Unternehmen mit unabhängigen Rechtsanwälten.
                            Eine externe Prüfung Ihrer Entgelttransparenz-Dokumentation — damit Sie im
                            Ernstfall nicht allein dastehen.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/kontakt"
                                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-[#52e0de] text-[#071423] hover:opacity-90 transition-opacity cursor-pointer"
                            >
                                Anwaltsprüfung anfragen <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="#fuer-anwaelte"
                                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium text-white/70 border border-white/20 hover:border-white/40 hover:text-white transition-colors cursor-pointer"
                            >
                                Als Anwalt beitreten
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="h-24 bg-gradient-to-b from-[#071423] to-white" />
            </section>

            {/* Important disclaimer */}
            <section className="py-12 bg-white">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="bg-[#fef1c2] border border-[#fbcd56]/40 rounded-2xl p-6 lg:p-8">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#fbcd56]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Scale className="w-5 h-5 text-[#7a5c00]" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-[#071423] mb-2">Wichtiger Hinweis zur Terminologie</h3>
                                <p className="text-sm text-slate-600 leading-relaxed max-w-[80ch]">
                                    KlarGehalt verspricht keine &ldquo;Rechtssicherheit&rdquo; und kein
                                    &ldquo;gesetzlich geprüftes&rdquo; Ergebnis — das kann keine Software
                                    der Welt garantieren. Was wir bieten: eine Prüfung{' '}
                                    <strong>von externem Rechtsberater geprüft</strong> — ein unabhängiger
                                    Anwalt sichtet Ihre Dokumentation und gibt schriftliches Feedback.
                                    Das ist im Streitfall ein relevantes Argument — und ein ehrlicheres
                                    Versprechen als jedes Zertifikat.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* What gets reviewed */}
            <section className="py-20 lg:py-28 bg-slate-50">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-6">
                                Was der Anwalt prüft.
                            </h2>
                            <p className="text-sm text-slate-500 leading-relaxed mb-8">
                                Der unabhängige Rechtsanwalt erhält Leserecht auf Ihre KlarGehalt-Daten
                                und prüft Ihre Compliance-Dokumentation anhand der EU-Richtlinie 2023/970
                                und dem deutschen Entgelttransparenzgesetz.
                            </p>
                            <ul className="space-y-3">
                                {reviewItems.map((item) => (
                                    <li key={item} className="flex items-start gap-3">
                                        <div className="mt-0.5 w-5 h-5 rounded-full bg-[#52e0de]/20 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-[#19514a]" />
                                        </div>
                                        <span className="text-sm text-slate-600 leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-[#071423] rounded-2xl p-8 text-white">
                                <h3 className="text-sm font-bold mb-4">Ergebnis der Prüfung</h3>
                                <div className="space-y-4">
                                    {[
                                        { icon: FileCheck, label: 'Schriftliches Prüfprotokoll', desc: 'Der Anwalt dokumentiert seine Einschätzung — nachvollziehbar und archiviert.' },
                                        { icon: ShieldCheck, label: 'Konkrete Handlungsempfehlungen', desc: 'Nicht nur Fehler aufzeigen — sondern erklären, was zu tun ist.' },
                                        { icon: UserCheck, label: 'Anwaltsbadge in KlarGehalt', desc: 'Sichtbarer Hinweis im System: „von externem Rechtsberater geprüft".' },
                                    ].map(({ icon: Icon, label, desc }) => (
                                        <div key={label} className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Icon className="w-4 h-4 text-[#52e0de]" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold mb-0.5">{label}</p>
                                                <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Preismodell</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600">Erstprüfung</span>
                                        <span className="text-base font-extrabold text-[#071423]">€799</span>
                                    </div>
                                    <div className="h-px bg-slate-100" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600">Jährliche Erneuerung</span>
                                        <span className="text-base font-extrabold text-[#071423]">€399</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                                    Einmalige Zahlung. Verfügbar ab dem Professional-Tarif. Der Anwalt ist
                                    unabhängig — kein KlarGehalt-Mitarbeiter.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* For companies */}
            <section className="py-20 lg:py-28 bg-white">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="max-w-2xl mb-12">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-4">
                            Für Unternehmen: Warum eine externe Prüfung?
                        </h2>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Wenn ein Mitarbeiter klagt oder eine Behörde prüft, zählt vor allem eines:
                            Konnten Sie zeigen, dass Sie die Thematik ernst genommen haben? Eine externe
                            Anwaltsprüfung ist Ihr Nachweis.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {companyBenefits.map((benefit) => (
                            <div key={benefit} className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 w-5 h-5 rounded-full bg-[#52e0de]/20 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3 h-3 text-[#19514a]" />
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed">{benefit}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-10 text-center">
                        <Link
                            href="/kontakt"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-semibold bg-[#071423] text-white hover:bg-[#0d1f33] transition-colors cursor-pointer"
                        >
                            Anwaltsprüfung jetzt anfragen <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* For lawyers */}
            <section id="fuer-anwaelte" className="py-20 lg:py-28 bg-slate-50">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                        <div>
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#946df7]/20 text-[#946df7] mb-5">
                                Für Rechtsanwälte
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-6">
                                Werden Sie Teil des Anwaltsnetzwerks.
                            </h2>
                            <p className="text-sm text-slate-500 leading-relaxed mb-8">
                                Als Anwalt im KlarGehalt-Netzwerk prüfen Sie Compliance-Dokumentationen
                                direkt in der Plattform — strukturiert, standardisiert und ohne
                                chaotische E-Mail-Anhänge. Ideal für Kanzleien mit Schwerpunkt
                                Arbeitsrecht oder EU-Compliance.
                            </p>
                            <ul className="space-y-3 mb-8">
                                {lawyerBenefits.map((benefit) => (
                                    <li key={benefit} className="flex items-start gap-3">
                                        <div className="mt-0.5 w-5 h-5 rounded-full bg-[#946df7]/20 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-[#946df7]" />
                                        </div>
                                        <span className="text-sm text-slate-600 leading-relaxed">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href="/kontakt"
                                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-[#071423] text-white hover:bg-[#0d1f33] transition-colors cursor-pointer"
                            >
                                Als Anwalt bewerben <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="bg-[#071423] rounded-2xl p-8 lg:p-10 text-white h-fit">
                            <h3 className="text-base font-bold mb-6">Wie die Zusammenarbeit läuft</h3>
                            <div className="space-y-6">
                                {[
                                    { step: '01', title: 'Aufnahme ins Netzwerk', desc: 'Nach einem kurzen Kennenlerngespräch und Vertragsabschluss erhalten Sie Ihren Anwalts-Account in KlarGehalt.' },
                                    { step: '02', title: 'Prüfauftrag annehmen', desc: 'Wenn ein Unternehmen eine Prüfung beauftragt, werden Sie benachrichtigt. Sie entscheiden, ob Sie den Auftrag annehmen.' },
                                    { step: '03', title: 'Prüfung durchführen', desc: 'Sie erhalten befristeten Lesezugang zu den relevanten Daten des Mandanten — direkt in KlarGehalt.' },
                                    { step: '04', title: 'Bericht und Badge', desc: 'Nach Ihrer Prüfung hinterlegen Sie das Feedback im System. Der Mandant erhält das Anwaltsbadge in seiner Ansicht.' },
                                ].map((item) => (
                                    <div key={item.step} className="flex gap-4">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-white/60">{item.step}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold mb-1">{item.title}</p>
                                            <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="relative bg-[#51398e] py-20 lg:py-28 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#51398e] via-[#51398e] to-[#946df7]/30" />
                <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                            <Scale className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                        Haben Sie Fragen?
                    </h2>
                    <p className="text-base text-white/60 leading-relaxed mb-8 max-w-[44ch] mx-auto">
                        Ob als Unternehmen mit Bedarf oder als Anwalt mit Interesse —
                        schreiben Sie uns, wir antworten innerhalb von 24 Stunden.
                    </p>
                    <Link
                        href="/kontakt"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-semibold bg-white text-[#51398e] hover:bg-white/90 transition-colors cursor-pointer"
                    >
                        Kontakt aufnehmen <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>
        </>
    );
}
