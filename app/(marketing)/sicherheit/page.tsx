import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Lock, Server } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Sicherheit & Datenschutz',
    description: 'Wie KlarGehalt Gehaltsdaten schuetzt: AES-256, Mandantentrennung, EU-Hosting in Frankfurt, DSGVO-Konformitaet und Audit-Trail.',
};

const layers = [
    {
        title: 'Verschluesselung',
        items: [
            { label: 'In Transit', value: 'TLS 1.3 fuer alle Verbindungen. Keine Ausnahmen. HSTS mit Preloading.' },
            { label: 'At Rest', value: 'AES-256 auf Datenbankebene. Gehaltsdaten sind auch bei physischem Zugriff unlesbar.' },
            { label: 'Schluessel-Management', value: 'Automatische Schluesselrotation. Schluessel werden getrennt von Daten gespeichert.' },
        ],
    },
    {
        title: 'Mandantentrennung',
        items: [
            { label: 'Row Level Security', value: 'Jede Datenbankabfrage wird auf Ebene der PostgreSQL-Engine gefiltert. Kein Tenant kann Daten eines anderen sehen — unabhaengig vom Anwendungscode.' },
            { label: 'Organization ID', value: 'Jede Zeile in jeder Tabelle ist einer Organisation zugeordnet. Queries ohne gueltige Organization-ID erhalten keine Daten.' },
            { label: 'Kein Shared-Schema-Risiko', value: 'Die Trennung liegt nicht im Anwendungscode (wo Bugs moeglich sind), sondern in der Datenbank selbst.' },
        ],
    },
    {
        title: 'Authentifizierung & Zugriff',
        items: [
            { label: 'Multi-Faktor', value: 'Optionale 2FA fuer alle Benutzer. SSO-Integration fuer Enterprise-Kunden.' },
            { label: 'Rollenmodell', value: 'Drei Rollen (Admin, HR-Manager, Mitarbeiter) mit klar definierten Rechten. Durchgesetzt auf Datenbankebene.' },
            { label: 'Session-Management', value: 'Automatische Session-Invalidierung. Kein persistentes Token-Caching im Browser.' },
        ],
    },
    {
        title: 'Infrastruktur',
        items: [
            { label: 'Standort', value: 'Frankfurt am Main, Deutschland. Alle Daten bleiben in der EU. Kein US Cloud Act.' },
            { label: 'Backup', value: 'Taegliche automatische Backups mit Point-in-Time Recovery. Getrennte Backup-Infrastruktur.' },
            { label: 'Monitoring', value: 'Echtzeit-Ueberwachung aller Systeme. Automatische Alarmierung bei Anomalien.' },
        ],
    },
];

const dsgvoArticles = [
    { article: 'Art. 5', title: 'Grundsaetze', desc: 'Datenminimierung, Zweckbindung und Speicherbegrenzung sind in der Architektur verankert, nicht nur in Richtlinien.' },
    { article: 'Art. 6', title: 'Rechtsgrundlage', desc: 'Verarbeitung auf Basis des berechtigten Interesses (Compliance-Pflicht) und Vertragsdurchfuehrung.' },
    { article: 'Art. 15', title: 'Auskunftsrecht', desc: 'Mitarbeiter koennen ihre Daten einsehen. Automatisierte Auskunftsfunktion im Self-Service Portal.' },
    { article: 'Art. 17', title: 'Recht auf Loeschung', desc: 'Datenloesch-Workflows sind implementiert. Aufbewahrungsfristen werden automatisch ueberwacht.' },
    { article: 'Art. 25', title: 'Privacy by Design', desc: 'Datenschutz ist in die Architektur eingebaut — nicht nachtraeglich ergaenzt.' },
    { article: 'Art. 32', title: 'Technische Massnahmen', desc: 'Verschluesselung, Zugriffskontrolle und regelmaessige Sicherheitsueberpruefungen.' },
];

export default function SicherheitPage() {
    return (
        <>
            {/* Hero */}
            <section className="pt-[72px] bg-[#071423]">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 lg:pt-36 pb-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <div>
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--ep-teal)]/20 text-[var(--ep-teal)] mb-5">
                                <Shield className="w-3.5 h-3.5" /> Security by Design
                            </span>
                            <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-extrabold text-white tracking-tight leading-[1.1] mb-6">
                                Gehaltsdaten sind sensibel.<br />
                                <span className="text-white/40">Wir behandeln sie auch so.</span>
                            </h1>
                            <p className="text-base lg:text-lg text-white/60 leading-relaxed max-w-[55ch]">
                                Keine Marketing-Versprechen. Hier steht, was wir technisch tun,
                                um Ihre Verguetungsdaten zu schuetzen.
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { icon: Lock, label: 'AES-256', sub: 'Verschluesselung' },
                                { icon: Server, label: 'Frankfurt', sub: 'EU-Hosting' },
                                { icon: Shield, label: 'RLS', sub: 'Mandantentrennung' },
                            ].map((badge) => (
                                <div key={badge.label} className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                                    <badge.icon className="w-6 h-6 text-[var(--ep-teal)] mx-auto mb-3" />
                                    <p className="text-sm font-bold text-white">{badge.label}</p>
                                    <p className="text-[10px] text-white/40 mt-0.5">{badge.sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="h-24 bg-gradient-to-b from-[#071423] to-white" />
            </section>

            {/* Security Layers */}
            <section className="py-20 lg:py-28">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-16 lg:space-y-24">
                    {layers.map((layer) => (
                        <div key={layer.title}>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[#071423] tracking-tight mb-8">
                                {layer.title}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {layer.items.map((item) => (
                                    <div key={item.label} className="bg-slate-50 rounded-xl p-6 lg:p-8">
                                        <h3 className="text-sm font-bold text-[#071423] mb-2">{item.label}</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* DSGVO Section */}
            <section className="py-20 lg:py-28 bg-[#071423]">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="max-w-2xl mb-14">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
                            DSGVO-Konformitaet im Detail.
                        </h2>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            KlarGehalt wurde von Anfang an fuer die DSGVO gebaut.
                            Hier ist, welche Artikel wir wie abdecken.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.06] rounded-xl overflow-hidden">
                        {dsgvoArticles.map((a) => (
                            <div key={a.article} className="bg-[#071423] p-7 lg:p-9 hover:bg-white/[0.03] transition-colors">
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold text-[var(--ep-teal)] bg-[var(--ep-teal)]/10 mb-3">{a.article}</span>
                                <h3 className="text-base font-bold text-white mb-2">{a.title}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">{a.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Architecture Overview */}
            <section className="py-20 lg:py-28 bg-white">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-8">
                            So fliesst Ihre Anfrage durch unser System.
                        </h2>
                        <div className="space-y-0">
                            {[
                                { step: '1', label: 'Authentifizierung', desc: 'Login ueber unseren Auth-Server (EU-gehostet). Multi-Faktor optional. JWT-Token mit Organisation-ID.' },
                                { step: '2', label: 'Autorisierung', desc: 'Jede Anfrage wird gegen das Rollenmodell geprueft. Nur berechtigte Rollen erhalten Zugriff.' },
                                { step: '3', label: 'Datenbank-Ebene', desc: 'Row Level Security filtert automatisch nach Organisation. Kein Code-Bug kann diese Schicht umgehen.' },
                                { step: '4', label: 'Antwort', desc: 'Nur die Daten, die der Benutzer sehen darf. Verschluesselt uebertragen. Kein Caching sensibler Daten.' },
                            ].map((s) => (
                                <div key={s.step} className="flex gap-6 py-6 border-b border-slate-100 last:border-0">
                                    <span className="text-2xl font-extrabold text-slate-200 w-8 flex-shrink-0">{s.step}</span>
                                    <div>
                                        <h3 className="text-sm font-bold text-[#071423] mb-1">{s.label}</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 lg:py-24 bg-slate-50">
                <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-4">
                        Fragen zur Sicherheit?
                    </h2>
                    <p className="text-sm text-slate-500 mb-8 max-w-[45ch] mx-auto">
                        Wir beantworten jede technische Frage. Sprechen Sie mit unserem Team.
                    </p>
                    <Link href="/kontakt">
                        <Button className="bg-[#071423] text-white hover:bg-[#0F172A] h-12 px-8 rounded-lg text-sm font-semibold cursor-pointer">
                            Kontakt aufnehmen <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </section>
        </>
    );
}
