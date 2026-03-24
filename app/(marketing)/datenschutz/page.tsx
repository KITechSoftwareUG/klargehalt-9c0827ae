import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Datenschutzerklärung',
    description: 'Datenschutzerklärung der KITech Software UG (haftungsbeschränkt) für KlarGehalt — DSGVO-konforme Verarbeitung von Gehaltsdaten.',
};

export default function DatenschutzPage() {
    return (
        <>
            {/* Hero */}
            <section className="pt-[72px] bg-[#071423]">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 lg:pt-36 pb-16">
                    <div className="max-w-3xl">
                        <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-extrabold text-white tracking-tight leading-[1.1] mb-6">
                            Datenschutzerklärung
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

                    {/* 1. Verantwortlicher */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">1. Verantwortlicher</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) und anderer nationaler Datenschutzgesetze der EU-Mitgliedstaaten sowie sonstiger datenschutzrechtlicher Bestimmungen ist:
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        KITech Software UG (haftungsbeschränkt)<br />
                        Deutschland<br />
                        E-Mail: datenschutz@klargehalt.de<br />
                        Website: klargehalt.de
                    </p>

                    {/* 2. Übersicht */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">2. Übersicht der Verarbeitungen</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Die nachfolgende Übersicht fasst die Arten der verarbeiteten Daten und die Zwecke ihrer Verarbeitung zusammen und verweist auf die betroffenen Personen.
                    </p>
                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">Arten der verarbeiteten Daten</h3>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li><strong>Bestandsdaten:</strong> Name, E-Mail-Adresse, Unternehmensinformationen, Rolle im Unternehmen</li>
                        <li><strong>Gehaltsdaten:</strong> Vergütungsstrukturen, Gehaltsbänder, individuelle Gehälter, Jobprofile, Abteilungszuordnungen</li>
                        <li><strong>Nutzungsdaten:</strong> Zugriffszeiten, genutzte Funktionen, Seitenaufrufe innerhalb der Plattform</li>
                        <li><strong>Vertragsdaten:</strong> Vertragsgegenstand, Laufzeit, gewählter Tarif</li>
                        <li><strong>Zahlungsdaten:</strong> Rechnungsadresse, Zahlungsmittelinformationen (verarbeitet durch Stripe)</li>
                        <li><strong>Protokolldaten:</strong> IP-Adressen, Browsertyp, Betriebssystem, Referrer-URL, Zeitpunkt des Zugriffs</li>
                        <li><strong>Audit-Daten:</strong> Protokollierung aller sicherheitsrelevanten Aktionen (Login, Datenänderungen, Rollenzuweisungen)</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">Kategorien betroffener Personen</h3>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li>Kunden und deren Mitarbeitende (Administratoren, HR-Manager, Angestellte)</li>
                        <li>Interessenten und Besucher der Website</li>
                        <li>Kontaktpersonen bei Kunden</li>
                    </ul>

                    {/* 3. Rechtsgrundlagen */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">3. Rechtsgrundlagen der Verarbeitung</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Im Folgenden erhalten Sie eine Übersicht der Rechtsgrundlagen der DSGVO, auf deren Basis wir personenbezogene Daten verarbeiten:
                    </p>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li><strong>Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO):</strong> Die Verarbeitung ist für die Erfüllung des Vertrags über die Nutzung der Plattform KlarGehalt oder zur Durchführung vorvertraglicher Maßnahmen erforderlich. Dies umfasst die Bereitstellung der SaaS-Funktionalitäten, die Kontoverwaltung und die Zahlungsabwicklung.</li>
                        <li><strong>Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO):</strong> Die Verarbeitung ist zur Wahrung der berechtigten Interessen des Anbieters erforderlich, sofern nicht die Interessen oder Grundrechte und Grundfreiheiten der betroffenen Person überwiegen. Berechtigte Interessen sind insbesondere: Gewährleistung der IT-Sicherheit, Betrugsprävention, Verbesserung der Plattform, Fehleranalyse.</li>
                        <li><strong>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO):</strong> Soweit wir die Einwilligung der betroffenen Person für bestimmte Verarbeitungszwecke einholen (z.B. Newsletter), ist die Einwilligung die Rechtsgrundlage. Eine erteilte Einwilligung kann jederzeit mit Wirkung für die Zukunft widerrufen werden.</li>
                        <li><strong>Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO):</strong> Die Verarbeitung ist zur Erfüllung einer rechtlichen Verpflichtung erforderlich (z.B. steuerrechtliche Aufbewahrungspflichten, Handelsrecht).</li>
                    </ul>

                    {/* 4. Gehaltsdaten */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">4. Verarbeitung von Gehaltsdaten</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Gehaltsdaten nehmen in unserer Plattform eine besondere Stellung ein. Obwohl Gehaltsdaten nicht unmittelbar unter Art. 9 DSGVO (besondere Kategorien personenbezogener Daten) fallen, handelt es sich um hochsensible personenbezogene Daten, die eines besonderen Schutzes bedürfen.
                    </p>
                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">Zweck der Verarbeitung</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Gehaltsdaten werden ausschließlich für folgende Zwecke verarbeitet:
                    </p>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li>Verwaltung von Gehaltsstrukturen und Gehaltsbändern gemäß der EU-Entgelttransparenzrichtlinie 2023/970</li>
                        <li>Berechnung und Analyse des geschlechtsspezifischen Entgeltgefälles (Gender Pay Gap)</li>
                        <li>Erstellung von Compliance-Berichten zur Erfüllung der Berichtspflichten</li>
                        <li>KI-gestützte Analyse von Entgeltunterschieden (auf Anforderung des Kunden)</li>
                    </ul>
                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">Technische Schutzmaßnahmen für Gehaltsdaten</h3>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li><strong>Verschlüsselung:</strong> Alle Gehaltsdaten werden mit AES-256 verschlüsselt gespeichert (Encryption at Rest) und ausschließlich über TLS 1.3 übertragen (Encryption in Transit).</li>
                        <li><strong>Mandantentrennung:</strong> Die strikte Trennung der Daten verschiedener Organisationen erfolgt auf Datenbankebene mittels Row Level Security (RLS). Ein Zugriff auf Gehaltsdaten anderer Organisationen ist technisch ausgeschlossen.</li>
                        <li><strong>Rollenbasierte Zugriffskontrolle:</strong> Innerhalb einer Organisation bestimmt das dreistufige Rollenmodell (Administrator, HR-Manager, Mitarbeiter), wer welche Gehaltsdaten einsehen kann. Die Durchsetzung erfolgt auf Datenbankebene.</li>
                        <li><strong>Audit-Trail:</strong> Jeder Zugriff auf und jede Änderung an Gehaltsdaten wird protokolliert und ist nachvollziehbar.</li>
                        <li><strong>Minimierung:</strong> Es werden nur die Gehaltsdaten erhoben und verarbeitet, die für die Zwecke der Entgelttransparenz-Compliance erforderlich sind.</li>
                    </ul>
                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">Verarbeitung durch KI-Systeme</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Zur Analyse von Entgeltunterschieden setzt die Plattform optional KI-gestützte Sprachmodelle ein. Dabei gilt:
                    </p>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li>Die Verarbeitung erfolgt nur auf ausdrückliche Anforderung des Kunden.</li>
                        <li>An das Sprachmodell werden ausschließlich aggregierte und anonymisierte Daten übermittelt, keine individuellen Gehaltsdaten.</li>
                        <li>Die Ergebnisse sind als Unterstützung gedacht und ersetzen keine fachliche Bewertung.</li>
                    </ul>

                    {/* 5. Datenverarbeitung im Detail */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">5. Datenverarbeitung im Detail</h2>

                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">5.1 Hosting und Infrastruktur</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        <strong>Supabase (Datenbank):</strong> Die Plattform nutzt Supabase als Datenbankinfrastruktur. Alle Daten werden auf Servern in Frankfurt am Main, Deutschland (AWS eu-central-1) gespeichert. Supabase bietet PostgreSQL-Datenbanken mit integrierter Row Level Security, automatischen Backups und Verschlüsselung. Die Datenverarbeitung erfolgt ausschließlich innerhalb der Europäischen Union.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        <strong>Vercel / Coolify (Webhosting):</strong> Die Webanwendung wird über eine Hosting-Infrastruktur bereitgestellt. Statische Assets können über ein Content Delivery Network (CDN) ausgeliefert werden. Es werden dabei keine personenbezogenen Daten dauerhaft auf dem Webserver gespeichert; die Datenhaltung erfolgt ausschließlich in der Supabase-Datenbank.
                    </p>

                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">5.2 Authentifizierung</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        <strong>Logto (self-hosted):</strong> Für die Benutzerauthentifizierung und Kontoverwaltung setzen wir Logto ein, eine self-hosted Open-Source-Lösung für Identity und Access Management. Die Logto-Instanz wird auf einem EU-Server betrieben. Verarbeitete Daten umfassen: E-Mail-Adresse, Passwort-Hash (bcrypt), Session-Token, Login-Zeitpunkt, IP-Adresse bei Anmeldung. Da Logto self-hosted betrieben wird, verlassen die Authentifizierungsdaten zu keinem Zeitpunkt die EU-Infrastruktur.
                    </p>

                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">5.3 Zahlungsabwicklung</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        <strong>Stripe:</strong> Für die Abwicklung von Zahlungen nutzen wir den Dienst Stripe, Inc. (510 Townsend Street, San Francisco, CA 94103, USA). Stripe ist nach PCI DSS Level 1 zertifiziert (höchste Sicherheitsstufe für Zahlungsdatenverarbeitung). Für die Übermittlung personenbezogener Daten in die USA bestehen Standardvertragsklauseln (SCC) gemäß Art. 46 Abs. 2 lit. c DSGVO. Stripe verarbeitet: Zahlungsmittelinformationen (Kreditkartennummer, SEPA-Mandatsreferenz), Rechnungsadresse, Transaktionsbeträge. Der Anbieter hat keinen Zugriff auf vollständige Zahlungsmittelinformationen (z.B. vollständige Kreditkartennummer). Datenschutzerklärung von Stripe: <a href="https://stripe.com/de/privacy" className="text-[#071423] font-medium underline underline-offset-2 hover:text-[#071423]/70" target="_blank" rel="noopener noreferrer">stripe.com/de/privacy</a>.
                    </p>

                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">5.4 E-Mail-Versand</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        <strong>Resend:</strong> Für den Versand transaktionaler E-Mails (z.B. Passwort-Zurücksetzung, Kontoverifizierung, Benachrichtigungen) nutzen wir den Dienst Resend. Es werden ausschließlich transaktionale E-Mails versendet; ein Newsletter-Versand erfolgt nicht ohne gesonderte Einwilligung. Verarbeitete Daten: E-Mail-Adresse des Empfängers, E-Mail-Inhalt, Versand- und Zustellstatus.
                    </p>

                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">5.5 Fehlertracking</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        <strong>Sentry:</strong> Zur Erkennung und Behebung technischer Fehler setzen wir Sentry ein (Functional Software, Inc., San Francisco, USA). Sentry erfasst bei Auftreten eines Fehlers: Fehlermeldung und Stack-Trace, Browsertyp und -version, Betriebssystem, URL der betroffenen Seite, anonymisierte IP-Adresse (letztes Oktett wird entfernt). Es werden keine Gehaltsdaten oder andere Inhaltsdaten an Sentry übermittelt. Die Verarbeitung dient dem berechtigten Interesse an der Aufrechterhaltung der Betriebssicherheit und Fehlerbehebung (Art. 6 Abs. 1 lit. f DSGVO). Datenschutzerklärung von Sentry: <a href="https://sentry.io/privacy/" className="text-[#071423] font-medium underline underline-offset-2 hover:text-[#071423]/70" target="_blank" rel="noopener noreferrer">sentry.io/privacy</a>.
                    </p>

                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">5.6 Analyse und Tracking</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Wir setzen <strong>keine Tracking-Cookies</strong> und <strong>kein Google Analytics</strong> oder vergleichbare Analyse-Dienste ein. Es erfolgt keine Weitergabe von Nutzungsdaten an Dritte zu Werbezwecken. Eine Analyse des Nutzungsverhaltens erfolgt ausschließlich serverseitig und anonymisiert zur Verbesserung der Plattform.
                    </p>

                    {/* 6. Betroffenenrechte */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">6. Rechte der betroffenen Personen</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Als betroffene Person stehen Ihnen gemäß DSGVO die folgenden Rechte zu:
                    </p>

                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">6.1 Auskunftsrecht (Art. 15 DSGVO)</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Sie haben das Recht, von uns eine Bestätigung darüber zu verlangen, ob wir personenbezogene Daten verarbeiten, die Sie betreffen. Ist dies der Fall, haben Sie ein Recht auf Auskunft über diese personenbezogenen Daten sowie auf die in Art. 15 DSGVO im Einzelnen aufgeführten Informationen.
                    </p>

                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">6.2 Recht auf Berichtigung (Art. 16 DSGVO)</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Sie haben das Recht, unverzüglich die Berichtigung unrichtiger personenbezogener Daten und unter Berücksichtigung der Verarbeitungszwecke die Vervollständigung unvollständiger personenbezogener Daten zu verlangen.
                    </p>

                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">6.3 Recht auf Löschung (Art. 17 DSGVO)</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Sie haben das Recht, die unverzügliche Löschung Ihrer personenbezogenen Daten zu verlangen, sofern einer der in Art. 17 DSGVO genannten Gründe vorliegt. Das Recht auf Löschung besteht nicht, soweit die Verarbeitung zur Erfüllung einer rechtlichen Verpflichtung oder zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen erforderlich ist.
                    </p>

                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">6.4 Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Sie haben das Recht, die Einschränkung der Verarbeitung zu verlangen, wenn eine der in Art. 18 DSGVO genannten Voraussetzungen vorliegt, insbesondere wenn Sie die Richtigkeit der Daten bestreiten oder die Verarbeitung unrechtmäßig ist.
                    </p>

                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">6.5 Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Sie haben das Recht, die Sie betreffenden personenbezogenen Daten, die Sie uns bereitgestellt haben, in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten. Die Plattform bietet hierfür eine integrierte Exportfunktion (CSV, JSON).
                    </p>

                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">6.6 Widerspruchsrecht (Art. 21 DSGVO)</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit gegen die Verarbeitung Sie betreffender personenbezogener Daten, die auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO erfolgt, Widerspruch einzulegen. Der Verantwortliche verarbeitet die personenbezogenen Daten dann nicht mehr, es sei denn, er kann zwingende schutzwürdige Gründe für die Verarbeitung nachweisen, die die Interessen, Rechte und Freiheiten der betroffenen Person überwiegen.
                    </p>

                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">6.7 Recht auf Widerruf erteilter Einwilligungen (Art. 7 Abs. 3 DSGVO)</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Sie haben das Recht, eine einmal erteilte Einwilligung jederzeit mit Wirkung für die Zukunft zu widerrufen. Die Rechtmäßigkeit der aufgrund der Einwilligung bis zum Widerruf erfolgten Verarbeitung wird hierdurch nicht berührt.
                    </p>

                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Zur Ausübung Ihrer Rechte wenden Sie sich bitte an: <strong>datenschutz@klargehalt.de</strong>. Wir werden Ihre Anfrage unverzüglich, spätestens jedoch innerhalb eines Monats nach Eingang bearbeiten.
                    </p>

                    {/* 7. Auftragsverarbeitung */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">7. Auftragsverarbeitung</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Soweit wir personenbezogene Daten im Auftrag unserer Kunden verarbeiten, erfolgt dies auf Grundlage eines Auftragsverarbeitungsvertrags (AV-Vertrag) gemäß Art. 28 DSGVO. Der AV-Vertrag regelt insbesondere:
                    </p>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li>Gegenstand und Dauer der Verarbeitung</li>
                        <li>Art und Zweck der Verarbeitung</li>
                        <li>Art der personenbezogenen Daten und Kategorien betroffener Personen</li>
                        <li>Pflichten und Rechte des Verantwortlichen (Kunden)</li>
                        <li>Technische und organisatorische Maßnahmen (Art. 32 DSGVO)</li>
                        <li>Einsatz von Unterauftragsverarbeitern</li>
                        <li>Unterstützungspflichten bei Betroffenenrechten</li>
                        <li>Löschung und Rückgabe von Daten nach Vertragsende</li>
                    </ul>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Der AV-Vertrag wird Kunden bei Vertragsabschluss bereitgestellt. Eine Kopie kann jederzeit unter datenschutz@klargehalt.de angefordert werden.
                    </p>

                    <h3 className="text-lg font-semibold text-[#071423] mt-8 mb-3">Unterauftragsverarbeiter</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Folgende Unterauftragsverarbeiter werden von uns eingesetzt:
                    </p>
                    <div className="overflow-x-auto mb-4">
                        <table className="text-sm text-slate-600 w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-2 pr-4 font-semibold text-[#071423]">Dienstleister</th>
                                    <th className="text-left py-2 pr-4 font-semibold text-[#071423]">Zweck</th>
                                    <th className="text-left py-2 pr-4 font-semibold text-[#071423]">Standort</th>
                                    <th className="text-left py-2 font-semibold text-[#071423]">Garantien</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-slate-100">
                                    <td className="py-2 pr-4">Supabase Inc.</td>
                                    <td className="py-2 pr-4">Datenbank, Speicherung</td>
                                    <td className="py-2 pr-4">Frankfurt, DE (EU)</td>
                                    <td className="py-2">AV-Vertrag, DSGVO-konform</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                    <td className="py-2 pr-4">Logto (self-hosted)</td>
                                    <td className="py-2 pr-4">Authentifizierung</td>
                                    <td className="py-2 pr-4">EU-Server</td>
                                    <td className="py-2">Self-hosted, keine Drittübermittlung</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                    <td className="py-2 pr-4">Stripe Inc.</td>
                                    <td className="py-2 pr-4">Zahlungsabwicklung</td>
                                    <td className="py-2 pr-4">USA</td>
                                    <td className="py-2">SCC, PCI DSS Level 1</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                    <td className="py-2 pr-4">Resend Inc.</td>
                                    <td className="py-2 pr-4">Transaktionale E-Mails</td>
                                    <td className="py-2 pr-4">USA</td>
                                    <td className="py-2">SCC, AV-Vertrag</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                    <td className="py-2 pr-4">Functional Software (Sentry)</td>
                                    <td className="py-2 pr-4">Fehlertracking</td>
                                    <td className="py-2 pr-4">USA</td>
                                    <td className="py-2">SCC, Datenminimierung</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 8. Datensicherheit */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">8. Datensicherheit</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Wir treffen nach Maßgabe der gesetzlichen Vorgaben unter Berücksichtigung des Stands der Technik, der Implementierungskosten und der Art, des Umfangs, der Umstände und der Zwecke der Verarbeitung sowie der unterschiedlichen Eintrittswahrscheinlichkeit und Schwere des Risikos für die Rechte und Freiheiten natürlicher Personen geeignete technische und organisatorische Maßnahmen gemäß Art. 32 DSGVO.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Zu den Maßnahmen gehören insbesondere:
                    </p>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li><strong>Verschlüsselung in Transit:</strong> Sämtliche Datenübertragungen erfolgen ausschließlich über TLS 1.3 mit HSTS-Preloading. Unverschlüsselte Verbindungen werden automatisch abgelehnt.</li>
                        <li><strong>Verschlüsselung at Rest:</strong> Alle gespeicherten Daten werden mit AES-256 auf Datenbankebene verschlüsselt. Automatische Schlüsselrotation ist aktiviert.</li>
                        <li><strong>Multi-Faktor-Authentifizierung (MFA):</strong> Für alle Benutzerkonten wird die Aktivierung von MFA dringend empfohlen und kann vom Administrator verpflichtend gemacht werden.</li>
                        <li><strong>Row Level Security (RLS):</strong> Die Mandantentrennung ist auf PostgreSQL-Datenbankebene implementiert. Jede Datenbankabfrage wird automatisch auf die Organisation des authentifizierten Benutzers gefiltert, unabhängig vom Anwendungscode.</li>
                        <li><strong>Rollenbasierte Zugriffskontrolle (RBAC):</strong> Drei klar definierte Rollen (Administrator, HR-Manager, Mitarbeiter) mit unterschiedlichen Zugriffsberechtigungen, durchgesetzt auf Datenbankebene.</li>
                        <li><strong>Audit-Trail:</strong> Alle sicherheitsrelevanten Aktionen (Anmeldungen, Datenänderungen, Rollenzuweisungen, Exporte) werden vollständig protokolliert und sind nicht manipulierbar.</li>
                        <li><strong>Automatische Backups:</strong> Tägliche automatische Backups mit Point-in-Time Recovery. Backup-Infrastruktur ist vom Produktivsystem getrennt.</li>
                        <li><strong>Session-Management:</strong> Automatische Session-Invalidierung bei Inaktivität. Kein persistentes Token-Caching im Browser.</li>
                    </ul>

                    {/* 9. Speicherdauer */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">9. Speicherdauer</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Wir speichern personenbezogene Daten nur so lange, wie dies für die jeweiligen Verarbeitungszwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen:
                    </p>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li><strong>Vertragsdaten und Gehaltsdaten:</strong> Für die Dauer der Vertragsbeziehung zuzüglich 90 Kalendertage nach Vertragsende (Exportzeitraum). Anschließend unwiderrufliche Löschung einschließlich Backups.</li>
                        <li><strong>Rechnungsdaten:</strong> 10 Jahre gemäß handels- und steuerrechtlichen Aufbewahrungspflichten (§257 HGB, §147 AO).</li>
                        <li><strong>Audit-Logs:</strong> Für die Dauer der Vertragsbeziehung zuzüglich 1 Jahr nach Vertragsende zur Nachvollziehbarkeit.</li>
                        <li><strong>Serverprotokolle:</strong> 30 Tage, danach automatische Löschung.</li>
                        <li><strong>Fehlerberichte (Sentry):</strong> 90 Tage, danach automatische Löschung.</li>
                        <li><strong>Daten nach Testphase ohne Konvertierung:</strong> 90 Kalendertage nach Ablauf der Testphase, danach unwiderrufliche Löschung.</li>
                    </ul>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Nach Ablauf der jeweiligen Speicherdauer werden die Daten automatisch und unwiderruflich gelöscht. Daten, die aufgrund gesetzlicher Aufbewahrungspflichten länger gespeichert werden müssen, sind für den regulären Zugriff gesperrt und werden nach Ablauf der gesetzlichen Frist gelöscht.
                    </p>

                    {/* 10. Cookies */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">10. Cookies und lokale Speicherung</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Wir verwenden ausschließlich technisch notwendige Cookies, die für den Betrieb der Plattform unerlässlich sind:
                    </p>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1 mb-4">
                        <li><strong>Session-Cookie:</strong> Zur Aufrechterhaltung der authentifizierten Sitzung. Wird beim Schließen des Browsers oder nach Ablauf der Session gelöscht.</li>
                        <li><strong>CSRF-Token:</strong> Zum Schutz vor Cross-Site-Request-Forgery-Angriffen.</li>
                    </ul>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Es werden <strong>keine Tracking-Cookies, keine Werbe-Cookies und keine Analyse-Cookies</strong> eingesetzt. Ein Cookie-Banner ist daher nicht erforderlich, da ausschließlich technisch notwendige Cookies verwendet werden, die nach Art. 5 Abs. 3 der ePrivacy-Richtlinie (2002/58/EG) von der Einwilligungspflicht ausgenommen sind.
                    </p>

                    {/* 11. Datenschutzbeauftragter */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">11. Datenschutzbeauftragter</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Für Fragen zum Datenschutz und zur Ausübung Ihrer Rechte als betroffene Person wenden Sie sich bitte an:
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        KITech Software UG (haftungsbeschränkt)<br />
                        Datenschutzbeauftragter<br />
                        E-Mail: datenschutz@klargehalt.de
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Wir beantworten Anfragen zum Datenschutz in der Regel innerhalb von 72 Stunden und stellen die Erfüllung Ihrer Betroffenenrechte innerhalb der gesetzlichen Frist von einem Monat sicher.
                    </p>

                    {/* 12. Beschwerderecht */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">12. Beschwerderecht bei einer Aufsichtsbehörde</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Unbeschadet eines anderweitigen verwaltungsrechtlichen oder gerichtlichen Rechtsbehelfs steht Ihnen das Recht auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde zu, wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten gegen die DSGVO verstößt (Art. 77 DSGVO).
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Die zuständige Aufsichtsbehörde richtet sich nach dem Bundesland, in dem der Anbieter seinen Sitz hat. Eine Liste der Datenschutzbeauftragten sowie deren Kontaktdaten finden Sie unter:{' '}
                        <a
                            href="https://www.bfdi.bund.de/DE/Service/Anschriften/Laender/Laender-node.html"
                            className="text-[#071423] font-medium underline underline-offset-2 hover:text-[#071423]/70"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            bfdi.bund.de
                        </a>.
                    </p>

                    {/* 13. Änderungen */}
                    <h2 className="text-xl font-bold text-[#071423] mt-12 mb-4">13. Änderungen dieser Datenschutzerklärung</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen, um sie stets den aktuellen rechtlichen Anforderungen anzupassen oder Änderungen unserer Leistungen in der Datenschutzerklärung umzusetzen. Für Ihren erneuten Besuch gilt dann die aktualisierte Datenschutzerklärung.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Wesentliche Änderungen dieser Datenschutzerklärung werden registrierten Kunden per E-Mail mitgeteilt. Die jeweils aktuelle Version ist unter{' '}
                        <Link href="/datenschutz" className="text-[#071423] font-medium underline underline-offset-2 hover:text-[#071423]/70">
                            klargehalt.de/datenschutz
                        </Link>{' '}
                        abrufbar.
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
