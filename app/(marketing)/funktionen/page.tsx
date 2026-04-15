import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Building2, Users, Briefcase, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const partners = [
    { name: 'SAP', icon: Building2 },
    { name: 'Personio', icon: Users },
    { name: 'Workday', icon: Briefcase },
    { name: 'DATEV', icon: TrendingUp },
];

export const metadata: Metadata = {
    title: 'Funktionen',
    description: 'Alle Funktionen von KlarGehalt: Gehaltsstrukturen, Pay-Gap Analyse, Rollenbasierte Zugriffe, Mitarbeiter-Auskunft, Audit-Trail und EU-Hosting.',
};

const moduleColors = [
    { accent: 'var(--ep-teal)', bg: 'var(--ep-teal-light)', text: 'var(--ep-teal-dark)' },
    { accent: 'var(--ep-purple)', bg: 'var(--ep-purple-light)', text: 'var(--ep-purple-dark)' },
    { accent: 'var(--ep-yellow)', bg: 'var(--ep-yellow-light)', text: 'var(--ep-yellow-dark)' },
    { accent: 'var(--ep-teal)', bg: 'var(--ep-teal-light)', text: 'var(--ep-teal-dark)' },
    { accent: 'var(--ep-purple)', bg: 'var(--ep-purple-light)', text: 'var(--ep-purple-dark)' },
    { accent: 'var(--ep-yellow)', bg: 'var(--ep-yellow-light)', text: 'var(--ep-yellow-dark)' },
];

const modules = [
    {
        number: '01',
        title: 'Gehaltsstrukturen erfassen',
        subtitle: 'Job-Profile & Gehaltsbänder',
        description: 'Definieren Sie Ihre Gehaltsstruktur zentral. Job-Profile mit Leveln, Abteilungen und Standorten anlegen. Gehaltsbänder mit Min/Max/Median hinterlegen. CSV-Import für bestehende Daten.',
        capabilities: [
            'Job-Profile mit Level, Abteilung und Standort',
            'Gehaltsbänder mit Min, Max und Median',
            'CSV-Import für bestehende Mitarbeiterdaten',
            'Flexible Gruppierung nach beliebigen Kriterien',
            'Historische Daten für Vergleichszeitraeume',
        ],
    },
    {
        number: '02',
        title: 'Pay-Gap automatisch berechnen',
        subtitle: 'Gender-Pay-Gap Analyse',
        description: 'Die EU-Richtlinie verlangt Median-Vergleiche nach Geschlecht, aufgeschlüsselt nach Job-Profil. KlarGehalt berechnet diese automatisch und markiert Abweichungen ab 5%.',
        capabilities: [
            'Median- und Durchschnitts-Pay-Gap pro Job-Profil',
            'Automatische Abweichungsmarker (5% / 10% Schwellen)',
            'Aufschluesselung nach Geschlecht, Abteilung, Standort',
            'Trendanalyse über mehrere Zeiträume',
            'Export als PDF-Bericht für Behörden und Prüfer',
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
        description: 'Die Richtlinie gibt Mitarbeitern das Recht, die durchschnittliche Vergütung ihrer Vergleichsgruppe zu erfahren. KlarGehalt stellt das als Self-Service Portal bereit — anonymisiert und DSGVO-konform.',
        capabilities: [
            'Self-Service Portal für Mitarbeiter',
            'Anonymisierte Gruppenstatistiken — keine Einzelgehaelter',
            'Automatische Vergleichsgruppen-Zuordnung',
            'Auskunftsanfragen mit Audit-Trail',
            'Art. 15 DSGVO Auskunftsrecht integriert',
        ],
    },
    {
        number: '05',
        title: 'Audit-Trail',
        subtitle: 'Lückenlose Protokollierung',
        description: 'Wer hat wann was geaendert? Jede Aktion wird protokolliert — von der Gehaltsänderung bis zum Datenzugriff. Exportierbar für Wirtschaftsprüfer, Behörden und interne Revision.',
        capabilities: [
            'Automatische Protokollierung aller Änderungen',
            'Benutzer, Zeitstempel und Änderungsdetails',
            'Export als CSV oder PDF für Prüfer',
            'Unveränderbare Eintraege (append-only)',
            'Filterbar nach Benutzer, Zeitraum und Aktion',
        ],
    },
    {
        number: '06',
        title: 'EU-Hosting & Verschlüsselung',
        subtitle: 'Daten bleiben in der EU',
        description: 'Alle Daten liegen auf Servern in Frankfurt. Verschlüsselung in Transit (TLS 1.3) und at Rest (AES-256). Kein Transfer in Drittlaender, kein US Cloud Act.',
        capabilities: [
            'Hosting in Frankfurt, Deutschland',
            'AES-256 Verschlüsselung at rest',
            'TLS 1.3 Verschlüsselung in transit',
            'Kein Datentransfer in Drittlaender',
            'Regelmäßige Sicherheitsaudits',
        ],
    },
];

export default function FunktionenPage() {
    return (
        <>
            {/* Hero */}
            <section className="pt-[72px] bg-[#071423]">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 lg:pt-36 pb-16">
                    <div className="max-w-3xl">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[var(--ep-teal)]/20 text-[var(--ep-teal)] mb-5">
                            6 Module
                        </span>
                        <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-extrabold text-white tracking-tight leading-[1.1] mb-6">
                            Sechs Module. Ein Ziel:<br />
                            <span className="text-white/40">Entgelttransparenz ohne Aufwand.</span>
                        </h1>
                        <p className="text-base lg:text-lg text-white/60 leading-relaxed max-w-[55ch]">
                            KlarGehalt ist kein generisches HR-Tool. Jedes Modul wurde spezifisch für die
                            Anforderungen der EU-Entgelttransparenzrichtlinie 2023/970 entwickelt.
                        </p>
                    </div>
                </div>
                <div className="h-24 bg-gradient-to-b from-[#071423] to-white" />
            </section>

            {/* Modules */}
            <section className="py-20 lg:py-28">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-20 lg:space-y-28">
                    {modules.map((m, i) => {
                        const color = moduleColors[i];
                        return (
                        <div
                            key={m.number}
                            className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start`}
                        >
                            <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                                <span
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold mb-4"
                                    style={{ backgroundColor: color.bg, color: color.text }}
                                >
                                    {m.number}
                                </span>
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight mb-2">
                                    {m.title}
                                </h2>
                                <p className="text-sm font-medium text-[var(--ep-gray-3)] mb-5">{m.subtitle}</p>
                                <p className="text-sm text-[var(--ep-gray-4)] leading-relaxed mb-8">{m.description}</p>

                                <ul className="space-y-2.5">
                                    {m.capabilities.map((c) => (
                                        <li key={c} className="flex items-start gap-2.5">
                                            <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: color.accent }} />
                                            <span className="text-sm text-[var(--ep-gray-4)]">{c}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div
                                className={`rounded-2xl aspect-[4/3] flex items-center justify-center relative overflow-hidden ${i % 2 === 1 ? 'lg:order-1' : ''}`}
                                style={{ backgroundColor: color.bg }}
                            >
                                <div className="text-center">
                                    <span className="text-6xl font-extrabold" style={{ color: color.accent, opacity: 0.3 }}>{m.number}</span>
                                    <p className="text-xs mt-2" style={{ color: color.text }}>Screenshot folgt</p>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
            </section>

            {/* Integrationen */}
            <section className="bg-[#071423] py-20 lg:py-28">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <div>
                            <p className="text-[var(--ep-teal)] text-sm font-semibold tracking-wide uppercase mb-3">
                                Integrationen
                            </p>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
                                Die klargehalt
                                <br />Plattform geht auch
                                <br />digital.
                            </h2>
                            <p className="text-base text-white/60 leading-relaxed mb-8 max-w-[48ch]">
                                Nahtlose Integration in Ihre bestehende HR-Landschaft.
                                Verbinden Sie klargehalt mit den Tools, die Sie bereits nutzen.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {partners.map((p) => (
                                <div
                                    key={p.name}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-colors"
                                >
                                    <p.icon className="w-8 h-8 text-white/60" />
                                    <p className="text-sm font-medium text-white/80">{p.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 lg:py-24 bg-[#071423]">
                <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
                        Alle Funktionen live erleben.
                    </h2>
                    <p className="text-sm text-white/50 mb-8 max-w-[45ch] mx-auto">
                        Wir zeigen Ihnen KlarGehalt mit Ihren eigenen Daten. 20 Minuten, unverbindlich.
                    </p>
                    <Link href="/kontakt">
                        <Button className="bg-[#52e0de] text-[#071423] hover:brightness-95 h-12 px-8 rounded-lg text-sm font-semibold cursor-pointer">
                            Demo anfragen <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </section>
        </>
    );
}
