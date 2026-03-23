import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'EU-Entgelttransparenzrichtlinie 2023/970',
    description: 'Was ist die EU-Entgelttransparenzrichtlinie? Wer ist betroffen? Welche Pflichten entstehen? Fristen, Anforderungen und Bussgelder einfach erklaert.',
};

const timeline = [
    { date: 'Juni 2023', event: 'Richtlinie 2023/970 in Kraft getreten', desc: 'Veroeffentlichung im Amtsblatt der Europaeischen Union. Mitgliedstaaten haben drei Jahre zur Umsetzung.' },
    { date: 'Juni 2026', event: 'Umsetzungsfrist fuer Mitgliedstaaten', desc: 'Bis zum 7. Juni 2026 muss die Richtlinie in nationales Recht umgesetzt sein. Deutschland arbeitet am Entgelttransparenzgesetz 2.0.' },
    { date: 'Juni 2027', event: 'Erster Berichtszeitraum (250+ MA)', desc: 'Unternehmen mit 250+ Mitarbeitern muessen ihren ersten Gender-Pay-Gap Bericht vorlegen. Danach jaehrlich.' },
    { date: 'Juni 2031', event: 'Erster Berichtszeitraum (100-249 MA)', desc: 'Unternehmen mit 100-249 Mitarbeitern muessen erstmals berichten. Danach alle drei Jahre.' },
];

const requirements = [
    {
        title: 'Entgelttransparenz bei der Einstellung',
        article: 'Art. 5',
        desc: 'Stellenausschreibungen muessen Gehaltsangaben oder Gehaltsspannen enthalten. Arbeitgeber duerfen Bewerber nicht nach ihrem aktuellen Gehalt fragen.',
        impact: 'HR-Abteilungen muessen Gehaltsbaender fuer jede offene Stelle definieren und in Stellenanzeigen veroeffentlichen.',
    },
    {
        title: 'Auskunftsrecht fuer Beschaeftigte',
        article: 'Art. 7',
        desc: 'Arbeitnehmer haben das Recht, die durchschnittliche Verguetung ihrer Vergleichsgruppe zu erfahren — aufgeschluesselt nach Geschlecht.',
        impact: 'Unternehmen brauchen ein System, das diese Daten auf Anfrage bereitstellen kann. Frist: 2 Monate nach Anfrage.',
    },
    {
        title: 'Gender-Pay-Gap Berichterstattung',
        article: 'Art. 9',
        desc: 'Unternehmen muessen den Gender Pay Gap nach verschiedenen Kriterien berechnen und veroeffentlichen: Median, Durchschnitt, nach Entgeltgruppen.',
        impact: 'Automatisierte Berechnung und Berichterstellung wird notwendig. Manuelle Excel-Berechnungen skalieren nicht.',
    },
    {
        title: 'Gemeinsame Entgeltbewertung',
        article: 'Art. 10',
        desc: 'Liegt der Pay Gap bei 5% oder mehr und kann nicht durch objektive Faktoren erklaert werden, muss eine gemeinsame Bewertung mit Arbeitnehmervertretern durchgefuehrt werden.',
        impact: 'Unternehmen muessen nicht nur den Gap berechnen, sondern auch dokumentieren, welche Faktoren ihn erklaeren — oder Massnahmen einleiten.',
    },
    {
        title: 'Recht auf Entschaedigung',
        article: 'Art. 16',
        desc: 'Arbeitnehmer, die aufgrund von Entgeltdiskriminierung benachteiligt wurden, haben Anspruch auf vollstaendige Entschaedigung — einschliesslich Nachzahlung und Schadensersatz.',
        impact: 'Die Beweislast liegt beim Arbeitgeber. Wer keine saubere Dokumentation hat, steht vor Gericht schlecht da.',
    },
    {
        title: 'Sanktionen',
        article: 'Art. 23',
        desc: 'Mitgliedstaaten muessen wirksame, verhaeltnismaessige und abschreckende Sanktionen festlegen. Dazu gehoeren Geldstrafen.',
        impact: 'Die genauen Bussgelder werden im nationalen Gesetz geregelt. Erfahrungsgemaess orientieren sie sich an der Unternehmensgroesse.',
    },
];

const whoIsAffected = [
    { size: '1 - 99 Mitarbeiter', obligation: 'Entgelttransparenz bei Einstellung + Auskunftsrecht', reporting: 'Keine regelmaessige Berichtspflicht', deadline: 'Ab Umsetzung (Juni 2026)' },
    { size: '100 - 149 Mitarbeiter', obligation: 'Alle Pflichten inkl. Berichterstattung', reporting: 'Alle 3 Jahre', deadline: 'Erster Bericht: Juni 2031' },
    { size: '150 - 249 Mitarbeiter', obligation: 'Alle Pflichten inkl. Berichterstattung', reporting: 'Alle 3 Jahre', deadline: 'Erster Bericht: Juni 2031' },
    { size: '250+ Mitarbeiter', obligation: 'Alle Pflichten inkl. Berichterstattung', reporting: 'Jaehrlich', deadline: 'Erster Bericht: Juni 2027' },
];

export default function EuRichtliniePage() {
    return (
        <>
            {/* Hero */}
            <section className="pt-[72px] bg-[#071423]">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 lg:pt-36 pb-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <div>
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[var(--ep-yellow)]/20 text-[var(--ep-yellow)] mb-5">
                                Frist: 7. Juni 2026
                            </span>
                            <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-extrabold text-white tracking-tight leading-[1.1] mb-6">
                                Die EU-Entgelttransparenz&shy;richtlinie einfach erklaert.
                            </h1>
                            <p className="text-base lg:text-lg text-white/60 leading-relaxed max-w-[55ch]">
                                Was muessen Unternehmen tun? Bis wann? Und was passiert, wenn nicht?
                                Hier steht alles, was Sie wissen muessen — ohne Juristendeutsch.
                            </p>
                        </div>
                        <div className="bg-[var(--ep-yellow)]/10 border border-[var(--ep-yellow)]/20 rounded-2xl p-8">
                            <p className="text-[var(--ep-yellow)] text-xs font-bold uppercase tracking-wider mb-3">Countdown</p>
                            <p className="text-4xl font-extrabold text-white mb-1">~3 Monate</p>
                            <p className="text-sm text-white/50">bis zur Umsetzungsfrist der Richtlinie (EU) 2023/970</p>
                            <div className="mt-5 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--ep-yellow)] rounded-full" style={{ width: '92%' }} />
                            </div>
                            <p className="text-[10px] text-white/30 mt-2">92% der Frist verstrichen</p>
                        </div>
                    </div>
                </div>
                <div className="h-24 bg-gradient-to-b from-[#071423] to-white" />
            </section>

            {/* What is it */}
            <section className="py-20 lg:py-28">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-6">
                                Worum geht es?
                            </h2>
                            <div className="space-y-4 text-sm text-slate-500 leading-relaxed">
                                <p>
                                    Die <strong className="text-[#071423]">Richtlinie (EU) 2023/970</strong> verpflichtet Arbeitgeber in der gesamten EU,
                                    ihre Gehaltsstrukturen transparent zu machen. Ziel: Gleiche Bezahlung fuer gleiche oder gleichwertige Arbeit,
                                    unabhaengig vom Geschlecht.
                                </p>
                                <p>
                                    Das klingt nach einem Grundsatz, der laengst gelten sollte. In der Praxis zeigt sich aber:
                                    Der <strong className="text-[#071423]">Gender Pay Gap in Deutschland liegt bei 18%</strong> (Statistisches Bundesamt, 2024).
                                    Auch der bereinigte Gap — also nach Abzug struktureller Unterschiede — liegt bei 6%.
                                </p>
                                <p>
                                    Die Richtlinie will das aendern, indem sie Transparenz erzwingt. Nicht als Empfehlung, sondern als Pflicht.
                                    Mit Berichtspflichten, Auskunftsrechten und Sanktionen.
                                </p>
                            </div>
                        </div>
                        <div className="bg-[#071423] rounded-2xl p-8 lg:p-10 text-white">
                            <h3 className="text-sm font-bold text-white mb-6">Die drei Saeulen der Richtlinie</h3>
                            <div className="space-y-6">
                                {[
                                    { n: '1', title: 'Transparenz vor der Einstellung', desc: 'Gehaltsangaben in Stellenanzeigen. Kein Fragen nach dem Vorgehalt.' },
                                    { n: '2', title: 'Transparenz im Arbeitsverhaeltnis', desc: 'Auskunftsrecht fuer Mitarbeiter. Gender-Pay-Gap Berichtspflicht.' },
                                    { n: '3', title: 'Durchsetzung', desc: 'Beweislastumkehr. Entschaedigungsansprueche. Bussgelder bei Verstoss.' },
                                ].map((s) => (
                                    <div key={s.n} className="flex gap-4">
                                        <span className="text-2xl font-extrabold text-white/20 w-6 flex-shrink-0">{s.n}</span>
                                        <div>
                                            <h4 className="text-sm font-bold text-white mb-1">{s.title}</h4>
                                            <p className="text-xs text-slate-400">{s.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="py-20 lg:py-28 bg-slate-50">
                <div className="max-w-3xl mx-auto px-5 sm:px-8">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-12">
                        Zeitplan.
                    </h2>
                    <div className="space-y-0">
                        {timeline.map((t, i) => (
                            <div key={t.date} className="flex gap-6 py-8 border-b border-slate-200 last:border-0">
                                <div className="flex flex-col items-center">
                                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${i === 0 ? 'bg-[var(--ep-teal)]' : i === 1 ? 'bg-[var(--ep-yellow)]' : 'bg-[var(--ep-gray-3)]'}`} />
                                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-2" />}
                                </div>
                                <div className="-mt-1">
                                    <span className="text-xs font-mono font-bold text-slate-400 block mb-1">{t.date}</span>
                                    <h3 className="text-base font-bold text-[#071423] mb-2">{t.event}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{t.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Who is affected */}
            <section className="py-20 lg:py-28 bg-white">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-4">
                        Wer ist betroffen?
                    </h2>
                    <p className="text-base text-slate-500 mb-12 max-w-[55ch]">
                        Grundsaetzlich alle Arbeitgeber in der EU. Die Berichtspflicht haengt von der Unternehmensgroesse ab.
                    </p>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                            <thead>
                                <tr className="border-b-2 border-slate-200">
                                    <th className="text-left py-4 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Groesse</th>
                                    <th className="text-left py-4 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Pflichten</th>
                                    <th className="text-left py-4 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Berichtszyklus</th>
                                    <th className="text-left py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Erster Bericht</th>
                                </tr>
                            </thead>
                            <tbody>
                                {whoIsAffected.map((row) => (
                                    <tr key={row.size} className="border-b border-slate-100">
                                        <td className="py-4 pr-4 text-sm font-medium text-[#071423] whitespace-nowrap">{row.size}</td>
                                        <td className="py-4 pr-4 text-sm text-slate-500">{row.obligation}</td>
                                        <td className="py-4 pr-4 text-sm text-slate-500">{row.reporting}</td>
                                        <td className="py-4 text-sm text-slate-500">{row.deadline}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Requirements Detail */}
            <section className="py-20 lg:py-28 bg-slate-50">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-4">
                        Was muessen Unternehmen konkret tun?
                    </h2>
                    <p className="text-base text-slate-500 mb-12 max-w-[55ch]">
                        Die wichtigsten Anforderungen der Richtlinie — und was sie praktisch bedeuten.
                    </p>

                    <div className="space-y-6">
                        {requirements.map((r) => (
                            <div key={r.article} className="bg-white rounded-xl border border-slate-200 p-6 lg:p-8">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <h3 className="text-base font-bold text-[#071423]">{r.title}</h3>
                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold text-[var(--ep-purple)] bg-[var(--ep-purple-light)] flex-shrink-0">{r.article}</span>
                                </div>
                                <p className="text-sm text-slate-500 leading-relaxed mb-4">{r.desc}</p>
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Praktische Auswirkung</p>
                                    <p className="text-sm text-[#071423]">{r.impact}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How KlarGehalt helps */}
            <section className="py-20 lg:py-28 bg-white">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="max-w-3xl mx-auto text-center mb-14">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-4">
                            Wie KlarGehalt dabei hilft.
                        </h2>
                        <p className="text-base text-slate-500">
                            Jede Anforderung der Richtlinie ist ein Modul in KlarGehalt.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { req: 'Gehaltsangaben in Stellenanzeigen', solution: 'Gehaltsbaender pro Job-Profil definieren und als Vorlage fuer Stellenanzeigen exportieren.' },
                            { req: 'Auskunftsrecht der Mitarbeiter', solution: 'Self-Service Portal mit anonymisierten Gruppenstatistiken. Anfragen werden automatisch protokolliert.' },
                            { req: 'Gender-Pay-Gap Berechnung', solution: 'Automatische Median- und Durchschnittsberechnung nach Geschlecht und Job-Profil.' },
                            { req: 'Berichterstattung', solution: 'PDF-Berichte fuer Behoerden und Pruefer auf Knopfdruck generieren.' },
                            { req: 'Gemeinsame Entgeltbewertung', solution: 'Abweichungen ab 5% werden automatisch markiert. Dokumentation der Erklaerungsfaktoren.' },
                            { req: 'Nachweispflicht', solution: 'Lueckenloser Audit-Trail. Jede Aenderung, jeder Zugriff — beweissicher dokumentiert.' },
                        ].map((item) => (
                            <div key={item.req} className="bg-slate-50 rounded-xl p-6">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Anforderung</p>
                                <h3 className="text-sm font-bold text-[#071423] mb-2">{item.req}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{item.solution}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 lg:py-24 bg-[#071423]">
                <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
                        Die Frist laeuft. Handeln Sie jetzt.
                    </h2>
                    <p className="text-sm text-slate-400 mb-8 max-w-[50ch] mx-auto">
                        Je frueher Sie Gehaltsstrukturen erfassen, desto besser stehen Sie da — bei Behoerden, Pruefern und Ihren Mitarbeitern.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/kontakt">
                            <Button className="bg-white text-[#071423] hover:bg-slate-100 h-12 px-8 rounded-lg text-sm font-semibold cursor-pointer">
                                Demo anfragen <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                        <Link href="/funktionen">
                            <Button variant="outline" className="h-12 px-8 rounded-lg text-sm font-semibold border-white/20 text-white hover:bg-white/10 cursor-pointer">
                                Funktionen ansehen
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
