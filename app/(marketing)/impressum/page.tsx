import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Impressum',
    description: 'Impressum und Angaben gemäß § 5 TMG der KITech Software UG (haftungsbeschränkt).',
};

export default function ImpressumPage() {
    return (
        <>
            <section className="pt-[72px] bg-[#071423]">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 lg:pt-36 pb-16">
                    <div className="max-w-3xl">
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-[1.1] mb-4">
                            Impressum
                        </h1>
                        <p className="text-sm text-white/40">Angaben gemäß § 5 TMG</p>
                    </div>
                </div>
                <div className="h-24 bg-gradient-to-b from-[#071423] to-white" />
            </section>

            <section className="py-16 lg:py-24">
                <div className="max-w-3xl mx-auto px-5 sm:px-8">
                    <h2 className="text-xl font-bold text-[#071423] mb-4">Diensteanbieter</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-2">
                        KITech Software UG (haftungsbeschränkt)
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-8">
                        Eingetragen im Handelsregister.<br />
                        Registergericht: [Amtsgericht eintragen]<br />
                        Registernummer: [HRB-Nummer eintragen]
                    </p>

                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">Vertreten durch</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-8">
                        Geschäftsführer: [Name des Geschäftsführers eintragen]
                    </p>

                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">Kontakt</h2>
                    <ul className="text-sm text-slate-600 list-none space-y-1 mb-8">
                        <li>E-Mail: kontakt@klargehalt.de</li>
                        <li>Telefon: [Telefonnummer eintragen]</li>
                        <li>Adresse: [Straße, PLZ, Ort eintragen]</li>
                    </ul>

                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">Umsatzsteuer-ID</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-8">
                        Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:<br />
                        [USt-IdNr. eintragen, z.B. DE123456789]
                    </p>

                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-8">
                        [Name und Anschrift des inhaltlich Verantwortlichen eintragen]
                    </p>

                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">EU-Streitschlichtung</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
                        <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                            https://ec.europa.eu/consumers/odr/
                        </a>
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-8">
                        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
                        Verbraucherschlichtungsstelle teilzunehmen.
                    </p>

                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">Haftung für Inhalte</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach
                        den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter
                        jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen
                        oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-8">
                        Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
                        allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst
                        ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden
                        von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
                    </p>

                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">Haftung für Links</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-8">
                        Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss
                        haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die
                        Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten
                        verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche
                        Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht
                        erkennbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
                    </p>

                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">Urheberrecht</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-8">
                        Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem
                        deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
                        Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung
                        des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den
                        privaten, nicht kommerziellen Gebrauch gestattet.
                    </p>

                    <div className="mt-16 pt-8 border-t border-slate-200">
                        <p className="text-xs text-slate-400">
                            Weitere rechtliche Informationen finden Sie in unseren{' '}
                            <Link href="/agb" className="underline hover:text-slate-600">Allgemeinen Geschäftsbedingungen</Link> und der{' '}
                            <Link href="/datenschutz" className="underline hover:text-slate-600">Datenschutzerklärung</Link>.
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
}
