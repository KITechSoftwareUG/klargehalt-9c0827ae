import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Über uns',
    description: 'Das Team hinter KlarGehalt. Unsere Mission: Entgelttransparenz für jedes Unternehmen zugänglich machen.',
};

const values = [
    {
        title: 'Ehrlichkeit vor Marketing',
        desc: 'Wir versprechen nichts, was wir nicht haben. Keine Fake-Zertifizierungen, keine erfundenen Kundenzahlen. Was auf unserer Website steht, stimmt.',
    },
    {
        title: 'Datenschutz ist kein Feature',
        desc: 'Datenschutz ist eine Grundvoraussetzung. Wir haben KlarGehalt von Tag eins für die DSGVO gebaut — nicht nachträglich angepasst.',
    },
    {
        title: 'Einfachheit gewinnt',
        desc: 'Compliance-Software muss nicht kompliziert sein. Wenn eine HR-Managerin das Tool nicht in 30 Minuten versteht, haben wir versagt.',
    },
    {
        title: 'Substanz vor Oberfläche',
        desc: 'Wir investieren in Sicherheit, Mandantentrennung und saubere Architektur. Nicht in Hochglanz-Demos, die in der Praxis nicht funktionieren.',
    },
];

const milestones = [
    { year: '2024', event: 'Idee', desc: 'Erkenntnis: Es gibt kein gutes Tool für die EU-Entgelttransparenzrichtlinie im deutschen Markt. Excel und Beratung skalieren nicht.' },
    { year: '2025', event: 'Entwicklungsstart', desc: 'Architektur, Security-Konzept, erste Module. Fokus auf Mandantentrennung und DSGVO-Konformität von Anfang an.' },
    { year: '2026', event: 'Launch', desc: 'KlarGehalt geht live — rechtzeitig vor der Umsetzungsfrist im Juni 2026. Erste Kunden im Onboarding.' },
];

export default function UeberUnsPage() {
    return (
        <>
            {/* Hero */}
            <section className="pt-[72px] bg-[#071423]">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 lg:pt-36 pb-16">
                    <div className="max-w-3xl">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[var(--ep-purple)]/20 text-[var(--ep-purple-light)] mb-5">
                            Unser Team
                        </span>
                        <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-extrabold text-white tracking-tight leading-[1.1] mb-6">
                            Wir bauen das Tool,<br />
                            <span className="text-white/40">das wir selbst gebraucht hätten.</span>
                        </h1>
                        <p className="text-base lg:text-lg text-white/60 leading-relaxed max-w-[55ch]">
                            KlarGehalt entsteht aus einer einfachen Beobachtung: Die EU-Entgelttransparenzrichtlinie
                            kommt, aber es gibt kein gutes Tool dafür. Wir ändern das.
                        </p>
                    </div>
                </div>
                <div className="h-24 bg-gradient-to-b from-[#071423] to-white" />
            </section>

            {/* Mission */}
            <section className="py-20 lg:py-28">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-6">
                                Unsere Mission.
                            </h2>
                            <div className="space-y-4 text-sm text-slate-500 leading-relaxed">
                                <p>
                                    <strong className="text-[#071423]">Entgelttransparenz darf kein Luxus sein.</strong> Grosse Konzerne
                                    können sich Beratungshäuser und Custom-Entwicklungen leisten. Mittelständler nicht.
                                </p>
                                <p>
                                    Wir glauben, dass jedes Unternehmen — ob 50 oder 5.000 Mitarbeiter — Zugang
                                    zu einem professionellen Tool haben sollte, das die EU-Richtlinie abdeckt.
                                    Ohne monatelanges Implementierungsprojekt. Ohne sechsstelliges Budget.
                                </p>
                                <p>
                                    KlarGehalt ist Software, keine Beratung. Das heißt: Sie können sofort starten,
                                    Ihre Daten gehören Ihnen, und Sie sind nicht von externen Dienstleistern abhängig.
                                </p>
                            </div>
                        </div>
                        <div className="bg-[#071423] rounded-2xl p-8 lg:p-10 text-white">
                            <h3 className="text-sm font-bold text-white mb-6">Was uns antreibt</h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-3xl font-extrabold tracking-tight mb-1">18%</p>
                                    <p className="text-xs text-slate-400">Gender Pay Gap in Deutschland (2024, unbereinigt)</p>
                                </div>
                                <div className="h-px bg-white/10" />
                                <div>
                                    <p className="text-3xl font-extrabold tracking-tight mb-1">6%</p>
                                    <p className="text-xs text-slate-400">Bereinigter Gender Pay Gap — nach Abzug struktureller Unterschiede</p>
                                </div>
                                <div className="h-px bg-white/10" />
                                <div>
                                    <p className="text-3xl font-extrabold tracking-tight mb-1">~800.000</p>
                                    <p className="text-xs text-slate-400">Unternehmen in Deutschland mit 10+ Mitarbeitern, die die Richtlinie betrifft</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 lg:py-28 bg-slate-50">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-12">
                        Woran wir uns messen.
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {values.map((v) => (
                            <div key={v.title} className="bg-white rounded-xl border border-slate-200 p-6 lg:p-8">
                                <h3 className="text-base font-bold text-[#071423] mb-2">{v.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="py-20 lg:py-28 bg-white">
                <div className="max-w-3xl mx-auto px-5 sm:px-8">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-12">
                        Unsere Geschichte.
                    </h2>
                    <div className="space-y-0">
                        {milestones.map((m, i) => (
                            <div key={m.year} className="flex gap-6 py-8 border-b border-slate-200 last:border-0">
                                <div className="flex flex-col items-center">
                                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${i === 0 ? 'bg-[var(--ep-gray-3)]' : i === 1 ? 'bg-[var(--ep-purple)]' : 'bg-[var(--ep-teal)]'}`} />
                                    {i < milestones.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-2" />}
                                </div>
                                <div className="-mt-1">
                                    <span className="text-xs font-mono font-bold text-slate-400 block mb-1">{m.year}</span>
                                    <h3 className="text-base font-bold text-[#071423] mb-2">{m.event}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{m.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team — KI-Agenten */}
            <section className="py-20 lg:py-28 bg-slate-50">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-4">
                        Das Team.
                    </h2>
                    <p className="text-base text-slate-500 mb-3 max-w-[55ch]">
                        KlarGehalt wird von einem menschlichen Gründer und einem Team aus
                        spezialisierten KI-Agenten entwickelt.
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#52e0de]/10 border border-[#52e0de]/20 mb-12">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#52e0de] animate-pulse" />
                        <span className="text-[#19514a] text-xs font-semibold">
                            Offen kommuniziert: Diese Software wurde zu großen Teilen von KI-Agenten gebaut.
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[
                            {
                                role: 'Gründer & Produktvision',
                                type: 'Mensch',
                                desc: 'Strategische Entscheidungen, Produktrichtung, Kundenbeziehungen und die Verantwortung für das Gesamtprodukt.',
                                color: '#946df7',
                                bg: '#e0d4fd',
                                badge: '👤 Human',
                            },
                            {
                                role: 'Software-Architekt Agent',
                                type: 'KI-Agent',
                                desc: 'Systemarchitektur, Datenbankdesign, API-Struktur, Sicherheitskonzept und technische Entscheidungen.',
                                color: '#52e0de',
                                bg: '#bdf9f7',
                                badge: '🤖 Claude Sonnet',
                            },
                            {
                                role: 'Frontend-Entwicklung Agent',
                                type: 'KI-Agent',
                                desc: 'React-Komponenten, UI-Design, Tailwind-Styles, Barrierefreiheit und alle sichtbaren Nutzerinterfaces.',
                                color: '#52e0de',
                                bg: '#bdf9f7',
                                badge: '🤖 Claude Sonnet',
                            },
                            {
                                role: 'Security-Reviewer Agent',
                                type: 'KI-Agent',
                                desc: 'Code-Reviews auf Sicherheitslücken, OWASP-Checks, DSGVO-Compliance-Prüfung und RLS-Audit.',
                                color: '#fbcd56',
                                bg: '#fef1c2',
                                badge: '🤖 Claude Opus',
                            },
                            {
                                role: 'Compliance & Recht',
                                type: 'KI-Agent + Review',
                                desc: 'Interpretation der EU-Richtlinie 2023/970, DSGVO-Anforderungen und Umsetzung in Produktfeatures. Menschlich gegengecheckt.',
                                color: '#fbcd56',
                                bg: '#fef1c2',
                                badge: '🤖 + 👤 Review',
                            },
                            {
                                role: 'QA & Testing Agent',
                                type: 'KI-Agent',
                                desc: 'TypeScript-Typchecks, Lint-Validierung, End-to-End-Testszenarien und Regressionsverhinderung.',
                                color: '#946df7',
                                bg: '#e0d4fd',
                                badge: '🤖 Claude Haiku',
                            },
                        ].map((member) => (
                            <div key={member.role} className="bg-white rounded-2xl border border-slate-200 p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                        style={{ backgroundColor: member.bg }}
                                    >
                                        {member.badge.startsWith('👤') ? '👤' : '🤖'}
                                    </div>
                                    <span
                                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{ backgroundColor: member.bg, color: member.color }}
                                    >
                                        {member.badge}
                                    </span>
                                </div>
                                <h3 className="text-sm font-bold text-[#071423] mb-2">{member.role}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{member.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 bg-white rounded-2xl border border-slate-200 p-6 lg:p-8">
                        <h3 className="text-sm font-bold text-[#071423] mb-3">Warum wir das offen kommunizieren</h3>
                        <p className="text-sm text-slate-500 leading-relaxed max-w-[70ch]">
                            Wir glauben an Ehrlichkeit vor Marketing. KI-Agenten ermöglichen uns, ein
                            hochwertiges Compliance-Tool zu bauen, das für den Mittelstand erschwinglich bleibt.
                            Die Architektur, die Sicherheitskonzepte und alle kritischen Entscheidungen
                            werden menschlich geprüft. Das Ergebnis spricht für sich.
                        </p>
                    </div>
                </div>
            </section>

            {/* Karriere */}
            <section className="relative bg-[#51398e] py-20 lg:py-28 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#51398e] via-[#51398e] to-[#946df7]/30" />
                <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <div>
                            <p className="text-[#e0d4fd] text-sm font-semibold tracking-wide uppercase mb-3">
                                Karriere
                            </p>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
                                Neue Rolle?
                                <br />Take it, and
                                <br />make it.
                            </h2>
                            <p className="text-base text-white/60 leading-relaxed mb-8 max-w-[44ch]">
                                Wir suchen Menschen, die mit uns die Zukunft der Entgelttransparenz gestalten.
                                Faire Bezahlung fängt bei uns selbst an.
                            </p>
                            <Link
                                href="/karriere"
                                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-white text-[#51398e] hover:bg-white/90 transition-colors cursor-pointer"
                            >
                                Offene Stellen ansehen <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                            <Image
                                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                                alt="Team arbeitet zusammen"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#51398e]/40 to-transparent" />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 lg:py-24 bg-white">
                <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-4">
                        Lernen Sie uns kennen.
                    </h2>
                    <p className="text-sm text-[#535a6b] mb-8 max-w-[45ch] mx-auto">
                        Wir freuen uns, von Ihnen zu hören — ob als potenzieller Kunde, Partner oder einfach Interessierter.
                    </p>
                    <Link href="/kontakt">
                        <Button className="bg-[#071423] text-white hover:bg-[#0d1f33] h-12 px-8 rounded-lg text-sm font-semibold cursor-pointer">
                            Kontakt aufnehmen <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </section>
        </>
    );
}
