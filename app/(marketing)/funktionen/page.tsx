import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Funktionen',
    description: 'Alle Funktionen von KlarGehalt: Gehaltsstrukturen, Pay-Gap Analyse, Rollenbasierte Zugriffe, Mitarbeiter-Auskunft, Audit-Trail und EU-Hosting.',
};

const modules = [
    {
        number: '01',
        title: 'Gehaltsstrukturen erfassen',
        subtitle: 'Job-Profile & Gehaltsbaender',
        description: 'Definieren Sie Ihre Gehaltsstruktur zentral. Job-Profile mit Leveln, Abteilungen und Standorten anlegen. Gehaltsbaender mit Min/Max/Median hinterlegen. CSV-Import fuer bestehende Daten.',
        capabilities: [
            'Job-Profile mit Level, Abteilung und Standort',
            'Gehaltsbaender mit Min, Max und Median',
            'CSV-Import fuer bestehende Mitarbeiterdaten',
            'Flexible Gruppierung nach beliebigen Kriterien',
            'Historische Daten fuer Vergleichszeitraeume',
        ],
    },
    {
        number: '02',
        title: 'Pay-Gap automatisch berechnen',
        subtitle: 'Gender-Pay-Gap Analyse',
        description: 'Die EU-Richtlinie verlangt Median-Vergleiche nach Geschlecht, aufgeschluesselt nach Job-Profil. KlarGehalt berechnet diese automatisch und markiert Abweichungen ab 5%.',
        capabilities: [
            'Median- und Durchschnitts-Pay-Gap pro Job-Profil',
            'Automatische Abweichungsmarker (5% / 10% Schwellen)',
            'Aufschluesselung nach Geschlecht, Abteilung, Standort',
            'Trendanalyse ueber mehrere Zeitraeume',
            'Export als PDF-Bericht fuer Behoerden und Pruefer',
        ],
    },
    {
        number: '03',
        title: 'Rollen und Zugriffsrechte',
        subtitle: 'RBAC auf Datenbankebene',
        description: 'Drei Rollen — Admin, HR-Manager, Mitarbeiter. Jede Rolle sieht exakt das, was sie sehen darf. Die Zugriffskontrolle wird nicht im Frontend simuliert, sondern auf Datenbankebene mit Row Level Security durchgesetzt.',
        capabilities: [
            'Admin: Vollzugriff auf alle Daten und Einstellungen',
            'HR-Manager: Gehaltsstrukturen und Analysen verwalten',
            'Mitarbeiter: Nur eigene anonymisierte Gruppenstatistiken',
            'Row Level Security (RLS) auf PostgreSQL-Ebene',
            'Mandantentrennung — kein Tenant sieht Daten anderer Tenants',
        ],
    },
    {
        number: '04',
        title: 'Mitarbeiter-Auskunft',
        subtitle: 'DSGVO-konforme Gehaltsauskunft',
        description: 'Die Richtlinie gibt Mitarbeitern das Recht, die durchschnittliche Verguetung ihrer Vergleichsgruppe zu erfahren. KlarGehalt stellt das als Self-Service Portal bereit — anonymisiert und DSGVO-konform.',
        capabilities: [
            'Self-Service Portal fuer Mitarbeiter',
            'Anonymisierte Gruppenstatistiken — keine Einzelgehaelter',
            'Automatische Vergleichsgruppen-Zuordnung',
            'Auskunftsanfragen mit Audit-Trail',
            'Art. 15 DSGVO Auskunftsrecht integriert',
        ],
    },
    {
        number: '05',
        title: 'Audit-Trail',
        subtitle: 'Lueckenlose Protokollierung',
        description: 'Wer hat wann was geaendert? Jede Aktion wird protokolliert — von der Gehaltsaenderung bis zum Datenzugriff. Exportierbar fuer Wirtschaftspruefer, Behoerden und interne Revision.',
        capabilities: [
            'Automatische Protokollierung aller Aenderungen',
            'Benutzer, Zeitstempel und Aenderungsdetails',
            'Export als CSV oder PDF fuer Pruefer',
            'Unveraenderbare Eintraege (append-only)',
            'Filterbar nach Benutzer, Zeitraum und Aktion',
        ],
    },
    {
        number: '06',
        title: 'EU-Hosting & Verschluesselung',
        subtitle: 'Daten bleiben in der EU',
        description: 'Alle Daten liegen auf Servern in Frankfurt. Verschluesselung in Transit (TLS 1.3) und at Rest (AES-256). Kein Transfer in Drittlaender, kein US Cloud Act.',
        capabilities: [
            'Hosting in Frankfurt, Deutschland',
            'AES-256 Verschluesselung at rest',
            'TLS 1.3 Verschluesselung in transit',
            'Kein Datentransfer in Drittlaender',
            'Regelmaessige Sicherheitsaudits',
        ],
    },
];

export default function FunktionenPage() {
    return (
        <>
            {/* Hero */}
            <section className="pt-[72px] bg-white">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 lg:pt-36 pb-16">
                    <div className="max-w-3xl">
                        <p className="text-xs font-mono font-bold text-slate-400 mb-4">FUNKTIONEN</p>
                        <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-extrabold text-[#1E293B] tracking-tight leading-[1.1] mb-6">
                            Sechs Module. Ein Ziel:<br />
                            <span className="text-slate-400">Entgelttransparenz ohne Aufwand.</span>
                        </h1>
                        <p className="text-base lg:text-lg text-slate-500 leading-relaxed max-w-[55ch]">
                            KlarGehalt ist kein generisches HR-Tool. Jedes Modul wurde spezifisch fuer die
                            Anforderungen der EU-Entgelttransparenzrichtlinie 2023/970 entwickelt.
                        </p>
                    </div>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </section>

            {/* Modules */}
            <section className="py-20 lg:py-28">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-20 lg:space-y-28">
                    {modules.map((m, i) => (
                        <div
                            key={m.number}
                            className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start ${
                                i % 2 === 1 ? 'lg:direction-rtl' : ''
                            }`}
                        >
                            <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                                <span className="text-xs font-mono font-bold text-slate-300 mb-3 block">{m.number}</span>
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight mb-2">
                                    {m.title}
                                </h2>
                                <p className="text-sm font-medium text-slate-400 mb-5">{m.subtitle}</p>
                                <p className="text-sm text-slate-500 leading-relaxed mb-8">{m.description}</p>

                                <ul className="space-y-2.5">
                                    {m.capabilities.map((c) => (
                                        <li key={c} className="flex items-start gap-2.5">
                                            <Check className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm text-slate-600">{c}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Placeholder for future screenshots */}
                            <div className={`bg-slate-50 rounded-2xl border border-slate-200 aspect-[4/3] flex items-center justify-center ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                                <div className="text-center">
                                    <span className="text-4xl font-extrabold text-slate-200">{m.number}</span>
                                    <p className="text-xs text-slate-300 mt-2">Screenshot folgt</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 lg:py-24 bg-[#1E293B]">
                <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
                        Alle Funktionen live erleben.
                    </h2>
                    <p className="text-sm text-slate-400 mb-8 max-w-[45ch] mx-auto">
                        Wir zeigen Ihnen KlarGehalt mit Ihren eigenen Daten. 20 Minuten, unverbindlich.
                    </p>
                    <Link href="/kontakt">
                        <Button className="bg-white text-[#1E293B] hover:bg-slate-100 h-12 px-8 rounded-lg text-sm font-semibold cursor-pointer">
                            Demo anfragen <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </section>
        </>
    );
}
