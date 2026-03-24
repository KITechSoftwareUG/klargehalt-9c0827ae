import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Allgemeine Geschäftsbedingungen',
    description: 'AGB der KITech Software UG (haftungsbeschränkt) für die Nutzung von KlarGehalt — SaaS-Plattform für EU-Entgelttransparenz.',
};

export default function AGBPage() {
    return (
        <>
            {/* Hero */}
            <section className="pt-[72px] bg-[#071423]">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 lg:pt-36 pb-16">
                    <div className="max-w-3xl">
                        <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-extrabold text-white tracking-tight leading-[1.1] mb-6">
                            Allgemeine Geschäftsbedingungen
                        </h1>
                        <p className="text-base text-white/50">
                            Stand: März 2026
                        </p>
                    </div>
                </div>
                <div className="h-24 bg-gradient-to-b from-[#071423] to-white" />
            </section>

            {/* Content */}
            <section className="py-16 lg:py-24">
                <div className="max-w-3xl mx-auto px-5 sm:px-8">

                    {/* §1 */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">§1 Geltungsbereich</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend &bdquo;AGB&ldquo;) gelten für alle Verträge zwischen der KITech Software UG (haftungsbeschränkt), Deutschland (nachfolgend &bdquo;Anbieter&ldquo;), und dem Kunden (nachfolgend &bdquo;Kunde&ldquo;) über die Nutzung der SaaS-Plattform &bdquo;KlarGehalt&ldquo; (nachfolgend &bdquo;Plattform&ldquo;), erreichbar unter klargehalt.de und app.klargehalt.de.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (2) Die Plattform richtet sich ausschließlich an Unternehmer im Sinne von §14 BGB (B2B). Die Nutzung durch Verbraucher im Sinne von §13 BGB ist ausgeschlossen.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (3) Abweichende, entgegenstehende oder ergänzende Geschäftsbedingungen des Kunden werden nur dann Vertragsbestandteil, wenn der Anbieter ihrer Geltung ausdrücklich schriftlich zugestimmt hat.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (4) Maßgeblich ist die zum Zeitpunkt des Vertragsschlusses gültige Fassung dieser AGB.
                    </p>

                    {/* §2 */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">§2 Vertragsgegenstand</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (1) Gegenstand des Vertrags ist die Bereitstellung der webbasierten SaaS-Plattform &bdquo;KlarGehalt&ldquo; zur Unterstützung des Kunden bei der Umsetzung der EU-Entgelttransparenzrichtlinie 2023/970. Die Plattform ermöglicht insbesondere:
                    </p>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li>Verwaltung von Gehaltsstrukturen, Gehaltsbändern und Jobprofilen</li>
                        <li>Analyse des geschlechtsspezifischen Entgeltgefälles (Gender Pay Gap)</li>
                        <li>Rollenbasierte Zugriffskontrolle (RBAC) für Mitarbeitende, HR-Manager und Administratoren</li>
                        <li>Audit-Trail zur Nachverfolgung aller relevanten Aktionen</li>
                        <li>Datenexport für Berichtspflichten gemäß der EU-Richtlinie</li>
                        <li>KI-gestützte Analyse und Erklärungen von Entgeltunterschieden</li>
                    </ul>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (2) Der Anbieter stellt die Plattform als Software-as-a-Service (SaaS) über das Internet bereit. Die Plattform wird auf Servern in der Europäischen Union (Frankfurt am Main, Deutschland) gehostet.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (3) Der Anbieter schuldet die Bereitstellung der Plattform in ihrer jeweils aktuellen Version. Ein Anspruch des Kunden auf Aufrechterhaltung eines bestimmten Funktionsumfangs besteht nicht, sofern der wesentliche Vertragsgegenstand gewahrt bleibt.
                    </p>

                    {/* §3 */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">§3 Registrierung und Konto</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (1) Die Nutzung der Plattform setzt eine Registrierung voraus. Bei der Registrierung wird eine Organisation (Mandant) angelegt, die als technische und datenseitige Trennungseinheit dient.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (2) Der Kunde ist verpflichtet, bei der Registrierung wahrheitsgemäße und vollständige Angaben zu machen und diese bei Änderungen unverzüglich zu aktualisieren.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (3) Der Kunde ist für die Sicherheit seiner Zugangsdaten verantwortlich. Er hat sicherzustellen, dass nur autorisierte Personen Zugang zu seinem Konto erhalten. Der Anbieter empfiehlt dringend die Aktivierung der Zwei-Faktor-Authentifizierung.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (4) Der Kunde benennt mindestens einen Administrator, der für die Verwaltung der Benutzerkonten und Rollenzuweisungen innerhalb seiner Organisation verantwortlich ist.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (5) Der Anbieter ist berechtigt, den Zugang zum Konto vorübergehend zu sperren, wenn ein begründeter Verdacht auf missbräuchliche Nutzung oder eine Verletzung dieser AGB besteht. Der Kunde wird hierüber unverzüglich informiert.
                    </p>

                    {/* §4 */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">§4 Leistungsbeschreibung</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (1) Die Plattform wird in folgenden Tarifen angeboten:
                    </p>
                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">a) Basis-Tarif</h3>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li>Verwaltung von bis zu 50 Mitarbeitenden</li>
                        <li>Grundlegende Gehaltsstruktur-Verwaltung</li>
                        <li>Gender-Pay-Gap-Basisanalyse</li>
                        <li>3 Benutzerkonten (1 Admin, 2 HR-Manager)</li>
                        <li>E-Mail-Support</li>
                    </ul>
                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">b) Professional-Tarif</h3>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li>Verwaltung von bis zu 500 Mitarbeitenden</li>
                        <li>Erweiterte Gehaltsstruktur-Verwaltung mit Gehaltsbändern</li>
                        <li>Detaillierte Gender-Pay-Gap-Analyse mit KI-gestützten Erklärungen</li>
                        <li>Unbegrenzte Benutzerkonten mit vollständigem Rollenmodell</li>
                        <li>Audit-Trail und Compliance-Berichte</li>
                        <li>Datenexport (CSV, PDF)</li>
                        <li>Prioritäts-Support (E-Mail und Video-Call)</li>
                    </ul>
                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">c) Enterprise-Tarif</h3>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li>Unbegrenzte Mitarbeitende</li>
                        <li>Alle Funktionen des Professional-Tarifs</li>
                        <li>SSO-Integration (SAML, OIDC)</li>
                        <li>Dedizierter Account-Manager</li>
                        <li>Individuelles Onboarding und Schulung</li>
                        <li>Benutzerdefinierte Integrationen (API-Zugang)</li>
                        <li>Service Level Agreement (SLA) mit garantierter Verfügbarkeit</li>
                        <li>Individuelle Vertragsgestaltung</li>
                    </ul>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (2) Der genaue Funktionsumfang des jeweiligen Tarifs ergibt sich aus der aktuellen Leistungsbeschreibung auf der Website des Anbieters unter klargehalt.de/preise.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (3) Der Anbieter ist berechtigt, die Plattform weiterzuentwickeln und den Funktionsumfang zu erweitern. Eine Reduzierung wesentlicher Funktionen innerhalb eines gebuchten Tarifs während der laufenden Vertragslaufzeit erfolgt nicht ohne vorherige Zustimmung des Kunden.
                    </p>

                    {/* §5 */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">§5 Testphase</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (1) Der Anbieter gewährt dem Kunden eine kostenlose Testphase von 14 Kalendertagen ab Registrierung (nachfolgend &bdquo;Trial&ldquo;). Während der Testphase stehen dem Kunden die Funktionen des Professional-Tarifs zur Verfügung.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (2) Die Testphase endet automatisch nach Ablauf der 14 Tage. Es erfolgt keine automatische Umwandlung in ein kostenpflichtiges Abonnement. Der Kunde muss aktiv einen Tarif wählen und die Zahlungsdaten hinterlegen, um die Plattform weiterhin nutzen zu können.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (3) Wählt der Kunde nach Ablauf der Testphase keinen kostenpflichtigen Tarif, wird der Zugang zur Plattform gesperrt. Die eingegebenen Daten werden für weitere 90 Kalendertage gespeichert und können bei Abschluss eines kostenpflichtigen Tarifs wiederhergestellt werden. Nach Ablauf der 90 Tage werden die Daten unwiderruflich gelöscht.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (4) Die Testphase kann pro Organisation nur einmal in Anspruch genommen werden.
                    </p>

                    {/* §6 */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">§6 Preise und Zahlung</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (1) Die monatlichen Preise für die einzelnen Tarife betragen:
                    </p>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li><strong>Basis-Tarif:</strong> 99,00 EUR pro Monat</li>
                        <li><strong>Professional-Tarif:</strong> 299,00 EUR pro Monat</li>
                        <li><strong>Enterprise-Tarif:</strong> Individuelles Angebot auf Anfrage</li>
                    </ul>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (2) Alle genannten Preise verstehen sich als Nettopreise zuzüglich der jeweils geltenden gesetzlichen Umsatzsteuer (derzeit 19 % MwSt.).
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (3) Bei jährlicher Zahlungsweise gewährt der Anbieter einen Rabatt, dessen Höhe der aktuellen Preisliste auf klargehalt.de/preise zu entnehmen ist.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (4) Die Zahlungsabwicklung erfolgt über den Zahlungsdienstleister Stripe, Inc. (nachfolgend &bdquo;Stripe&ldquo;). Der Kunde erklärt sich mit den Nutzungsbedingungen von Stripe einverstanden. Akzeptierte Zahlungsmethoden sind Kreditkarte und SEPA-Lastschrift.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (5) Die Abrechnung erfolgt im Voraus zu Beginn jeder Abrechnungsperiode (monatlich oder jährlich). Bei monatlicher Zahlungsweise ist der Betrag jeweils zum Monatsersten fällig, bei jährlicher Zahlungsweise zum Jahrestag des Vertragsbeginns.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (6) Gerät der Kunde mit der Zahlung in Verzug, ist der Anbieter berechtigt, den Zugang zur Plattform nach vorheriger Mahnung und Ablauf einer angemessenen Nachfrist (mindestens 14 Tage) vorübergehend zu sperren. Die Pflicht zur Zahlung der vereinbarten Vergütung bleibt hiervon unberührt.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (7) Der Anbieter ist berechtigt, die Preise mit einer Ankündigungsfrist von 30 Tagen zum Ende der jeweiligen Vertragslaufzeit anzupassen. Der Kunde hat in diesem Fall ein Sonderkündigungsrecht zum Zeitpunkt des Inkrafttretens der Preisanpassung.
                    </p>

                    {/* §7 */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">§7 Vertragslaufzeit und Kündigung</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (1) Der Vertrag wird auf unbestimmte Zeit geschlossen und kann je nach gewähltem Abrechnungsintervall wie folgt gekündigt werden:
                    </p>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li><strong>Monatliche Abrechnung:</strong> Kündigung jederzeit zum Ende des laufenden Abrechnungsmonats möglich.</li>
                        <li><strong>Jährliche Abrechnung:</strong> Kündigung mit einer Frist von 30 Tagen zum Ende der laufenden Vertragsjahresperiode möglich.</li>
                    </ul>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (2) Die Kündigung kann über die Kontoeinstellungen in der Plattform, per E-Mail an support@klargehalt.de oder in Textform erfolgen.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (3) Das Recht zur fristlosen Kündigung aus wichtigem Grund bleibt für beide Vertragsparteien unberührt. Ein wichtiger Grund liegt für den Anbieter insbesondere vor, wenn der Kunde:
                    </p>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li>gegen wesentliche Bestimmungen dieser AGB verstößt und den Verstoß trotz Abmahnung nicht innerhalb einer angemessenen Frist abstellt,</li>
                        <li>mit der Zahlung von mehr als zwei Monatsbeträgen in Verzug ist,</li>
                        <li>die Plattform in einer Weise nutzt, die den Betrieb für andere Kunden beeinträchtigt.</li>
                    </ul>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (4) Nach Beendigung des Vertrags hat der Kunde die Möglichkeit, seine Daten innerhalb von 30 Tagen zu exportieren (vgl. §13). Nach Ablauf von 90 Tagen nach Vertragsende werden alle Kundendaten unwiderruflich gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (5) Bereits gezahlte Beträge für die laufende Abrechnungsperiode werden bei ordentlicher Kündigung nicht erstattet. Bei jährlicher Abrechnung wird der anteilige Betrag für nicht genutzte volle Monate nur bei außerordentlicher Kündigung durch den Kunden aus einem vom Anbieter zu vertretenden wichtigen Grund erstattet.
                    </p>

                    {/* §8 */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">§8 Nutzungsrechte und -pflichten</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (1) Der Anbieter räumt dem Kunden für die Dauer des Vertrags ein nicht-exklusives, nicht übertragbares, nicht unterlizenzierbares Recht ein, die Plattform im Rahmen dieser AGB bestimmungsgemäß zu nutzen.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (2) Der Kunde darf die Plattform ausschließlich für seine eigene betriebliche Entgelttransparenz-Compliance nutzen. Eine Nutzung zugunsten Dritter, eine Weiterveräußerung oder ein Weitervertrieb der Plattform oder ihrer Funktionen ist untersagt.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (3) Der Kunde verpflichtet sich insbesondere:
                    </p>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li>die Plattform nicht für rechtswidrige Zwecke zu nutzen,</li>
                        <li>keine Maßnahmen zu ergreifen, die die Sicherheit, Integrität oder Verfügbarkeit der Plattform gefährden,</li>
                        <li>keine automatisierten Zugriffe (Scraping, Bots) auf die Plattform durchzuführen, sofern nicht ausdrücklich über die bereitgestellte API gestattet,</li>
                        <li>keine Reverse-Engineering-, Dekompilierungs- oder Disassemblierungsversuche der Plattform vorzunehmen,</li>
                        <li>die in der Plattform eingegebenen Daten in seiner Verantwortung auf Richtigkeit zu prüfen.</li>
                    </ul>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (4) Der Kunde ist allein verantwortlich für die Rechtmäßigkeit der von ihm in die Plattform eingegebenen Daten, insbesondere im Hinblick auf datenschutzrechtliche Anforderungen gegenüber seinen Mitarbeitenden.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (5) Alle Rechte an der Plattform, einschließlich des Quellcodes, der Algorithmen, der Datenmodelle und des Designs, verbleiben beim Anbieter. Der Kunde erwirbt durch diesen Vertrag keinerlei geistige Eigentumsrechte an der Plattform.
                    </p>

                    {/* §9 */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">§9 Datenschutz</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (1) Der Anbieter verarbeitet personenbezogene Daten im Einklang mit der Datenschutz-Grundverordnung (DSGVO) und dem Bundesdatenschutzgesetz (BDSG). Die Einzelheiten der Datenverarbeitung ergeben sich aus der{' '}
                        <Link href="/datenschutz" className="text-[#071423] font-medium underline underline-offset-2 hover:text-[#071423]/70">
                            Datenschutzerklärung
                        </Link>.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (2) Soweit der Anbieter personenbezogene Daten im Auftrag des Kunden verarbeitet, schließen die Parteien einen Auftragsverarbeitungsvertrag gemäß Art. 28 DSGVO (nachfolgend &bdquo;AV-Vertrag&ldquo;). Der AV-Vertrag wird dem Kunden bei Vertragsschluss bereitgestellt und ist Bestandteil dieses Vertrags.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (3) Der Kunde bleibt im Verhältnis zu seinen Mitarbeitenden Verantwortlicher im Sinne der DSGVO für die in die Plattform eingegebenen personenbezogenen Daten (insbesondere Gehaltsdaten). Der Kunde stellt sicher, dass er über die erforderlichen Rechtsgrundlagen für die Datenverarbeitung verfügt.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (4) Der Anbieter setzt ausschließlich Unterauftragsverarbeiter ein, die ihren Sitz in der Europäischen Union haben oder bei denen ein angemessenes Datenschutzniveau durch geeignete Garantien (insbesondere Standardvertragsklauseln gemäß Art. 46 Abs. 2 lit. c DSGVO) sichergestellt ist.
                    </p>

                    {/* §10 */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">§10 Verfügbarkeit und SLA</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (1) Der Anbieter ist bemüht, eine Verfügbarkeit der Plattform von 99,5 % im Jahresmittel zu gewährleisten. Die Verfügbarkeit berechnet sich auf Basis der Gesamtstunden eines Kalenderjahres abzüglich geplanter Wartungszeiten.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (2) Geplante Wartungsarbeiten werden nach Möglichkeit außerhalb der üblichen Geschäftszeiten (Montag bis Freitag, 8:00 bis 18:00 Uhr MEZ) durchgeführt und mindestens 48 Stunden im Voraus angekündigt.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (3) Die Verfügbarkeitsgarantie umfasst nicht:
                    </p>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li>Ausfälle, die auf höhere Gewalt, Netzwerkstörungen des Internets oder sonstigen Umständen außerhalb des Einflussbereichs des Anbieters beruhen,</li>
                        <li>Ausfälle, die durch den Kunden oder seine Nutzer verursacht werden,</li>
                        <li>geplante Wartungsarbeiten gemäß Abs. 2.</li>
                    </ul>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (4) Für Kunden des Enterprise-Tarifs kann ein individuelles Service Level Agreement (SLA) mit erweiterten Verfügbarkeitsgarantien und definierten Reaktionszeiten vereinbart werden.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (5) Der Anbieter führt regelmäßige Datensicherungen durch. Eine Garantie für die Wiederherstellung einzelner Datensätze wird hierdurch nicht begründet. Der Kunde wird angehalten, regelmäßig eigene Sicherungskopien seiner Daten über die Exportfunktion der Plattform anzufertigen.
                    </p>

                    {/* §11 */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">§11 Haftung und Gewährleistung</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (1) Der Anbieter haftet unbeschränkt für Schäden, die auf einer vorsätzlichen oder grob fahrlässigen Pflichtverletzung des Anbieters, seiner gesetzlichen Vertreter oder Erfüllungsgehilfen beruhen.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (2) Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten). In diesem Fall ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (3) Die Haftung des Anbieters für leichte Fahrlässigkeit ist der Höhe nach begrenzt auf den Gesamtbetrag der vom Kunden in den letzten 12 Monaten vor dem schadensauslösenden Ereignis gezahlten Vergütung, maximal jedoch auf 50.000 EUR.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (4) Die vorstehenden Haftungsbeschränkungen gelten nicht für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit, für Ansprüche nach dem Produkthaftungsgesetz sowie für Schäden, die auf einer Verletzung einer Garantie beruhen.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (5) Die Plattform stellt ein technisches Werkzeug zur Unterstützung der Entgelttransparenz-Compliance dar. Die von der Plattform generierten Analysen und Berichte stellen keine Rechtsberatung dar. Der Anbieter haftet nicht für die Richtigkeit der vom Kunden eingegebenen Daten oder für die auf Basis dieser Daten generierten Ergebnisse.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (6) Der Anbieter haftet nicht für die Erfüllung der Compliance-Pflichten des Kunden. Die Verantwortung für die Einhaltung der EU-Entgelttransparenzrichtlinie 2023/970 und der entsprechenden nationalen Umsetzungsgesetze verbleibt beim Kunden.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (7) KI-gestützte Erklärungen und Analysen werden unter Einsatz von Sprachmodellen generiert und können fehlerhaft oder unvollständig sein. Der Kunde ist verpflichtet, diese Ergebnisse eigenständig zu prüfen, bevor er darauf basierende Entscheidungen trifft.
                    </p>

                    {/* §12 */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">§12 Vertraulichkeit</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (1) Beide Vertragsparteien verpflichten sich, alle im Rahmen der Vertragsbeziehung erlangten vertraulichen Informationen der jeweils anderen Partei streng vertraulich zu behandeln und ausschließlich für die Zwecke dieses Vertrags zu verwenden.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (2) Als vertraulich gelten insbesondere:
                    </p>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li>Gehaltsdaten und Vergütungsstrukturen des Kunden,</li>
                        <li>personenbezogene Daten der Mitarbeitenden des Kunden,</li>
                        <li>Gender-Pay-Gap-Analysen und Compliance-Berichte,</li>
                        <li>technische Informationen über die Plattform des Anbieters.</li>
                    </ul>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (3) Die Vertraulichkeitsverpflichtung gilt nicht für Informationen, die:
                    </p>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li>öffentlich bekannt sind oder werden, ohne dass dies auf einer Verletzung dieser Klausel beruht,</li>
                        <li>der empfangenden Partei bereits vor Offenlegung rechtmäßig bekannt waren,</li>
                        <li>von einem Dritten rechtmäßig und ohne Vertraulichkeitsverpflichtung offengelegt wurden,</li>
                        <li>aufgrund gesetzlicher Vorschriften, gerichtlicher Anordnung oder behördlicher Verfügung offengelegt werden müssen.</li>
                    </ul>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (4) Der Anbieter stellt durch technische und organisatorische Maßnahmen sicher, dass Gehaltsdaten verschiedener Kunden strikt voneinander getrennt sind (Mandantentrennung). Die Trennung erfolgt auf Datenbankebene mittels Row Level Security (RLS).
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (5) Die Vertraulichkeitsverpflichtung besteht über das Ende des Vertrags hinaus für einen Zeitraum von drei (3) Jahren fort.
                    </p>

                    {/* §13 */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">§13 Datenportabilität</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (1) Der Kunde kann seine Daten jederzeit während der Vertragslaufzeit über die in der Plattform bereitgestellte Exportfunktion in maschinenlesbaren Formaten (CSV, JSON) exportieren.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (2) Nach Beendigung des Vertrags hat der Kunde innerhalb von 30 Kalendertagen die Möglichkeit, seine Daten zu exportieren. Der Anbieter unterstützt den Kunden auf Anfrage beim Datenexport.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (3) Nach Ablauf von 90 Kalendertagen nach Vertragsende werden alle kundenbezogenen Daten einschließlich Backups unwiderruflich gelöscht. Ausgenommen sind Daten, deren Aufbewahrung aufgrund gesetzlicher Vorgaben (insbesondere handels- und steuerrechtlicher Aufbewahrungspflichten) erforderlich ist. Diese werden nach Ablauf der gesetzlichen Frist gelöscht und sind in der Zwischenzeit für den regulären Zugriff gesperrt.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (4) Der Anbieter bestätigt dem Kunden auf Anfrage die vollständige Löschung der Daten schriftlich.
                    </p>

                    {/* §14 */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">§14 Änderungen der AGB</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (1) Der Anbieter behält sich das Recht vor, diese AGB mit Wirkung für die Zukunft zu ändern, sofern die Änderung unter Berücksichtigung der Interessen des Anbieters für den Kunden zumutbar ist. Dies ist insbesondere der Fall bei:
                    </p>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li>Anpassungen an geänderte gesetzliche Rahmenbedingungen oder Rechtsprechung,</li>
                        <li>Anpassungen aufgrund technischer Entwicklungen,</li>
                        <li>Einführung neuer Funktionen oder Dienste,</li>
                        <li>Schließung von Regelungslücken.</li>
                    </ul>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (2) Der Anbieter wird den Kunden über Änderungen mindestens 30 Kalendertage vor deren Inkrafttreten per E-Mail an die hinterlegte Kontaktadresse informieren. Die Mitteilung enthält die geänderten Bestimmungen und den Zeitpunkt des Inkrafttretens.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (3) Widerspricht der Kunde den geänderten AGB nicht innerhalb von 30 Kalendertagen nach Zugang der Änderungsmitteilung in Textform, gelten die geänderten AGB als genehmigt. Der Anbieter weist den Kunden in der Änderungsmitteilung auf diese Rechtsfolge hin.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (4) Widerspricht der Kunde den geänderten AGB, hat der Anbieter das Recht, den Vertrag mit einer Frist von 30 Tagen zum Zeitpunkt des geplanten Inkrafttretens der Änderung zu kündigen.
                    </p>

                    {/* §15 */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">§15 Schlussbestimmungen</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG) und der kollisionsrechtlichen Verweisungsnormen.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (2) Ausschließlicher Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesem Vertrag ist der Sitz des Anbieters, sofern der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (3) Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise unwirksam sein oder werden, so wird hierdurch die Wirksamkeit der übrigen Bestimmungen nicht berührt. Anstelle der unwirksamen Bestimmung gilt diejenige wirksame Bestimmung als vereinbart, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten kommt.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (4) Änderungen und Ergänzungen dieses Vertrags bedürfen der Textform (§126b BGB). Dies gilt auch für die Aufhebung dieses Textformerfordernisses.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (5) Der Kunde darf Rechte und Pflichten aus diesem Vertrag nur mit vorheriger schriftlicher Zustimmung des Anbieters auf Dritte übertragen.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        (6) Vertragssprache ist Deutsch. Im Falle von Widersprüchen zwischen verschiedenen Sprachfassungen ist die deutsche Fassung maßgeblich.
                    </p>

                    <div className="mt-16 pt-8 border-t border-slate-200">
                        <p className="text-xs text-slate-400">
                            KITech Software UG (haftungsbeschränkt) -- Stand: März 2026
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
}
