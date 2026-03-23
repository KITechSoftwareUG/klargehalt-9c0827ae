import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Ueber uns',
    description: 'Das Team hinter KlarGehalt. Unsere Mission: Entgelttransparenz fuer jedes Unternehmen zugaenglich machen.',
};

const values = [
    {
        title: 'Ehrlichkeit vor Marketing',
        desc: 'Wir versprechen nichts, was wir nicht haben. Keine Fake-Zertifizierungen, keine erfundenen Kundenzahlen. Was auf unserer Website steht, stimmt.',
    },
    {
        title: 'Datenschutz ist kein Feature',
        desc: 'Datenschutz ist eine Grundvoraussetzung. Wir haben KlarGehalt von Tag eins fuer die DSGVO gebaut — nicht nachtraeglich angepasst.',
    },
    {
        title: 'Einfachheit gewinnt',
        desc: 'Compliance-Software muss nicht kompliziert sein. Wenn eine HR-Managerin das Tool nicht in 30 Minuten versteht, haben wir versagt.',
    },
    {
        title: 'Substanz vor Oberflaeche',
        desc: 'Wir investieren in Sicherheit, Mandantentrennung und saubere Architektur. Nicht in Hochglanz-Demos, die in der Praxis nicht funktionieren.',
    },
];

const milestones = [
    { year: '2024', event: 'Idee', desc: 'Erkenntnis: Es gibt kein gutes Tool fuer die EU-Entgelttransparenzrichtlinie im deutschen Markt. Excel und Beratung skalieren nicht.' },
    { year: '2025', event: 'Entwicklungsstart', desc: 'Architektur, Security-Konzept, erste Module. Fokus auf Mandantentrennung und DSGVO-Konformitaet von Anfang an.' },
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
                            <span className="text-white/40">das wir selbst gebraucht haetten.</span>
                        </h1>
                        <p className="text-base lg:text-lg text-white/60 leading-relaxed max-w-[55ch]">
                            KlarGehalt entsteht aus einer einfachen Beobachtung: Die EU-Entgelttransparenzrichtlinie
                            kommt, aber es gibt kein gutes Tool dafuer. Wir aendern das.
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
                                    koennen sich Beratungshaeuser und Custom-Entwicklungen leisten. Mittelstaendler nicht.
                                </p>
                                <p>
                                    Wir glauben, dass jedes Unternehmen — ob 50 oder 5.000 Mitarbeiter — Zugang
                                    zu einem professionellen Tool haben sollte, das die EU-Richtlinie abdeckt.
                                    Ohne monatelanges Implementierungsprojekt. Ohne sechsstelliges Budget.
                                </p>
                                <p>
                                    KlarGehalt ist Software, keine Beratung. Das heisst: Sie koennen sofort starten,
                                    Ihre Daten gehoeren Ihnen, und Sie sind nicht von externen Dienstleistern abhaengig.
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

            {/* Team Placeholder */}
            <section className="py-20 lg:py-28 bg-slate-50">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-4">
                        Das Team.
                    </h2>
                    <p className="text-base text-slate-500 mb-12 max-w-[50ch]">
                        KlarGehalt wird von einem kleinen Team in Berlin entwickelt.
                        Wir sind Entwickler, keine Berater.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { name: 'Gruender & Entwicklung', desc: 'Architektur, Backend, Security. Verantwortlich fuer die technische Vision und Umsetzung.' },
                            { name: 'Product & UX', desc: 'Nutzererfahrung, Interviews, Feature-Priorisierung. Stellt sicher, dass das Tool im Alltag funktioniert.' },
                            { name: 'Compliance & Recht', desc: 'EU-Richtlinie, DSGVO, Arbeitsrecht. Uebersetzt juristische Anforderungen in Produktfeatures.' },
                        ].map((member) => (
                            <div key={member.name} className="bg-white rounded-xl border border-slate-200 p-6">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                    <span className="text-lg font-bold text-slate-300">{member.name.charAt(0)}</span>
                                </div>
                                <h3 className="text-sm font-bold text-[#071423] mb-2">{member.name}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{member.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 lg:py-24 bg-[#071423]">
                <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
                        Lernen Sie uns kennen.
                    </h2>
                    <p className="text-sm text-slate-400 mb-8 max-w-[45ch] mx-auto">
                        Wir freuen uns, von Ihnen zu hoeren — ob als potenzieller Kunde, Partner oder einfach Interessierter.
                    </p>
                    <Link href="/kontakt">
                        <Button className="bg-white text-[#071423] hover:bg-slate-100 h-12 px-8 rounded-lg text-sm font-semibold cursor-pointer">
                            Kontakt aufnehmen <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </section>
        </>
    );
}
