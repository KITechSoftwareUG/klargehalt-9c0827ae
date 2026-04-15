import { ArrowRight, Check, Shield, Clock, FileText, BarChart2, Users, Lock, Scale, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getAppUrl } from '@/utils/url';
import DashboardMockup from '@/components/DashboardMockup';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';

// ─── Daten ───────────────────────────────────────────────────────────────────

const trustStats = [
  { value: '14 Tage', label: 'kostenlose Testphase' },
  { value: 'DSGVO', label: 'konform, Hosting Frankfurt' },
  { value: '< 1 Tag', label: 'Einrichtungszeit' },
  { value: 'June 7', label: 'EU-Frist 2026' },
];

const problemItems = [
  'Bußgelder bis zu 1 % der Jahresvergütungssumme bei Nichterfüllung',
  'Auskunftspflichten gegenüber Mitarbeitern ab Juni 2026',
  'Pflicht zur Veröffentlichung des Gender-Pay-Gaps für alle 100+ MA Unternehmen',
  'Excel-Lösungen erfüllen die Dokumentationspflichten nicht',
];

const steps = [
  {
    number: '01',
    title: 'Daten importieren',
    desc: 'Mitarbeiterdaten und Gehaltsstrukturen per CSV importieren oder manuell anlegen. Fertig in unter 30 Minuten.',
    color: '#52e0de',
  },
  {
    number: '02',
    title: 'Gap automatisch erkennen',
    desc: 'KlarGehalt berechnet Median und Durchschnitt nach Geschlecht pro Job-Profil — exakt wie die Richtlinie es verlangt.',
    color: '#946df7',
  },
  {
    number: '03',
    title: 'Bericht generieren',
    desc: 'EU-konformer PDF-Bericht auf Knopfdruck. Exportierbar für Behörden, Wirtschaftsprüfer und interne Revision.',
    color: '#fbcd56',
  },
];

const features = [
  {
    icon: BarChart2,
    title: 'Gender-Pay-Gap Analyse',
    desc: 'Median- und Durchschnittsvergleiche nach Geschlecht, aufgeschlüsselt nach Job-Profil und Abteilung. Abweichungen ab 5 % werden automatisch markiert.',
    color: '#52e0de',
    bg: '#bdf9f7',
  },
  {
    icon: Users,
    title: 'Mitarbeiter-Auskunft',
    desc: 'Self-Service-Portal für Mitarbeiter: Anonymisierte Gruppenstatistiken — kein Einzelgehalt sichtbar. DSGVO-konform nach Art. 15.',
    color: '#946df7',
    bg: '#e0d4fd',
  },
  {
    icon: FileText,
    title: 'Audit-Trail',
    desc: 'Jede Änderung wird protokolliert — Benutzer, Zeitstempel, Änderungsdetail. Unveränderbar und exportierbar für Prüfer.',
    color: '#fbcd56',
    bg: '#fef1c2',
  },
  {
    icon: Lock,
    title: 'RBAC auf Datenbankebene',
    desc: 'Admin, HR-Manager, Mitarbeiter. Zugriffskontrolle via Row Level Security in PostgreSQL — kein Frontend-Gating.',
    color: '#52e0de',
    bg: '#bdf9f7',
  },
  {
    icon: Shield,
    title: 'EU-Hosting Frankfurt',
    desc: 'Alle Daten in Frankfurt. AES-256 at rest, TLS 1.3 in transit. Kein Transfer in Drittländer, kein US Cloud Act.',
    color: '#946df7',
    bg: '#e0d4fd',
  },
  {
    icon: Scale,
    title: 'Compliance-Berichte',
    desc: 'PDF-Export der vollständigen Gehaltsstruktur und Pay-Gap-Analyse — formatkonform für EU-Behörden und Prüfer.',
    color: '#fbcd56',
    bg: '#fef1c2',
  },
];

const testimonials = [
  {
    quote: 'Mit KlarGehalt haben wir unsere Gehaltsstrukturen in zwei Tagen erfasst und den ersten Pay-Gap-Bericht sofort generiert. Was wir mit Excel Wochen beschäftigt hätte, war innerhalb eines Nachmittags erledigt.',
    author: 'Sabine K.',
    role: 'HR-Leiterin · Maschinenbauunternehmen, 340 Mitarbeiter',
    gap: '4,1 %',
    gapLabel: 'bereinigter Pay-Gap nach Einführung',
  },
  {
    quote: 'Als CFO wollte ich klare Zahlen und rechtliche Sicherheit. KlarGehalt liefert beides — transparent, nachvollziehbar, audit-fähig. Unsere Betriebsprüfer waren beeindruckt.',
    author: 'Thomas M.',
    role: 'CFO · Logistikunternehmen, 720 Mitarbeiter',
    gap: '99,9 %',
    gapLabel: 'Uptime in den letzten 12 Monaten',
  },
];

const securityItems = [
  { value: 'AES-256', label: 'Verschlüsselung at rest und in transit' },
  { value: 'Frankfurt', label: 'EU-only Hosting, kein Transfer in Drittländer' },
  { value: 'TLS 1.3', label: 'Modernste Transportverschlüsselung' },
  { value: 'RLS', label: 'Mandantentrennung auf Datenbankebene' },
  { value: 'DSGVO', label: 'Art. 15 & 17 Auskunft und Löschung integriert' },
  { value: 'Audit-Log', label: 'Jede Änderung protokolliert und exportierbar' },
];

const faqs = [
  {
    q: 'Ab wann gilt die EU-Entgelttransparenzrichtlinie?',
    a: 'Ab Juni 2026 müssen Unternehmen mit mindestens 100 Mitarbeitern in der EU die Anforderungen der Richtlinie 2023/970 erfüllen. Dazu gehören Gehaltsstruktur-Offenlegung, Gender-Pay-Gap-Berichte und das Auskunftsrecht für Mitarbeiter.',
  },
  {
    q: 'Was passiert, wenn wir nicht compliant sind?',
    a: 'Die nationalen Aufsichtsbehörden können Bußgelder verhängen. Zusätzlich besteht das Risiko von Klagen betroffener Mitarbeiter sowie Reputationsschäden durch öffentliche Beanstandungen.',
  },
  {
    q: 'Wie lange dauert die Einrichtung?',
    a: 'Die meisten Kunden sind innerhalb eines Arbeitstages einsatzbereit. Sie importieren Ihre Mitarbeiterdaten per CSV, legen Gehaltsbänder an und können sofort den ersten Pay-Gap berechnen.',
  },
  {
    q: 'Werden unsere Gehaltsdaten sicher gespeichert?',
    a: 'Ja. Alle Daten liegen auf Servern in Frankfurt, verschlüsselt mit AES-256 at rest und TLS 1.3 in transit. Es gibt keinen Datentransfer in Drittländer. Mandantentrennung ist auf Datenbankebene (Row Level Security) durchgesetzt.',
  },
  {
    q: 'Können Mitarbeiter ihre Gehälter sehen?',
    a: 'Nein. Mitarbeiter sehen ausschließlich anonymisierte Gruppenstatistiken ihrer Vergleichsgruppe — keine Einzelgehälter. Dieses Design entspricht exakt den Anforderungen der EU-Richtlinie und der DSGVO.',
  },
  {
    q: 'Gibt es einen Vertrag mit Mindestlaufzeit?',
    a: 'Nein. Sie zahlen monatlich und können jederzeit kündigen. Wir verzichten bewusst auf lange Mindestlaufzeiten — unsere Kunden sollen bleiben, weil KlarGehalt Mehrwert liefert, nicht wegen Vertragsbindung.',
  },
];

// ─── Sektion-Komponenten ──────────────────────────────────────────────────────

function TrustBar() {
  return (
    <div className="border-y border-[#e0e0e2] bg-white py-5">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-wrap justify-center sm:justify-between items-center gap-6">
          {trustStats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <span className="text-[13px] font-extrabold text-[#071423]">{stat.value}</span>
              <span className="text-[12px] text-[#aaacb5]">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProblemSection() {
  return (
    <section className="py-24 lg:py-32 bg-[#f9f9f9]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <FadeIn>
            <p className="text-[#fbcd56] text-sm font-semibold tracking-wide uppercase mb-4">
              Das Problem
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#071423] tracking-tight leading-[1.1] mb-6">
              Ab Juni 2026 gibt es
              <br />keine Ausrede mehr.
            </h2>
            <p className="text-base text-[#535a6b] leading-relaxed mb-8 max-w-[48ch]">
              Die EU-Entgelttransparenzrichtlinie 2023/970 ist verbindlich. Wer bis zur
              Umsetzungsfrist keine dokumentierten Gehaltsstrukturen vorweisen kann,
              riskiert Bußgelder, Klagen und öffentliche Beanstandungen.
            </p>
            <Link
              href="/eu-richtlinie"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#071423] hover:text-[#946df7] transition-colors"
            >
              Was die Richtlinie konkret verlangt <ChevronRight className="w-4 h-4" />
            </Link>
          </FadeIn>

          <FadeIn delay={0.15} direction="left">
            <div className="bg-white rounded-2xl border border-[#e0e0e2] p-8 shadow-sm">
              <p className="text-xs font-bold text-[#aaacb5] uppercase tracking-widest mb-6">
                Was ohne Compliance droht
              </p>
              <ul className="space-y-4">
                {problemItems.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#fef1c2] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#62421d] text-[10px] font-bold">!</span>
                    </span>
                    <span className="text-sm text-[#535a6b] leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <FadeIn className="max-w-2xl mb-16 lg:mb-20">
          <p className="text-[#52e0de] text-sm font-semibold tracking-wide uppercase mb-4">
            So funktioniert es
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#071423] tracking-tight leading-[1.1]">
            In drei Schritten
            <br />
            <span className="text-[#aaacb5]">compliance-konform.</span>
          </h2>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {steps.map((step, i) => (
            <StaggerItem key={step.number}>
              <div className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-full w-full h-px border-t border-dashed border-[#e0e0e2] z-0 -translate-x-1/2" />
                )}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold mb-6 relative z-10"
                  style={{ backgroundColor: step.color + '20', color: step.color }}
                >
                  {step.number}
                </div>
                <h3 className="text-lg font-extrabold text-[#071423] tracking-tight mb-3">{step.title}</h3>
                <p className="text-sm text-[#535a6b] leading-relaxed">{step.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeIn delay={0.3} className="mt-12">
          <Link
            href={getAppUrl('/sign-up')}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-[#071423] text-white hover:bg-[#0d1f33] transition-colors"
          >
            Kostenlos starten — 14 Tage gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="py-24 lg:py-32 bg-[#f9f9f9]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <FadeIn className="max-w-2xl mb-16 lg:mb-20">
          <p className="text-[#946df7] text-sm font-semibold tracking-wide uppercase mb-4">
            Funktionen
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#071423] tracking-tight leading-[1.1]">
            Sechs Module.
            <br />Ein Ziel: Compliance.
          </h2>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <StaggerItem key={f.title}>
              <div className="group bg-white rounded-2xl border border-[#e0e0e2] p-7 hover:border-[#aaacb5] hover:shadow-md transition-all duration-300">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: f.bg }}
                >
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="text-base font-bold text-[#071423] tracking-tight mb-2">{f.title}</h3>
                <p className="text-sm text-[#535a6b] leading-relaxed">{f.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeIn delay={0.2} className="mt-10">
          <Link
            href="/funktionen"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#071423] hover:text-[#946df7] transition-colors"
          >
            Alle Funktionen im Detail ansehen <ChevronRight className="w-4 h-4" />
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-24 lg:py-32 bg-[#071423]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <FadeIn className="max-w-2xl mb-16">
          <p className="text-[#52e0de] text-sm font-semibold tracking-wide uppercase mb-4">
            Kundenstimmen
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Was unsere Kunden sagen.
          </h2>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <StaggerItem key={i}>
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 lg:p-10 flex flex-col justify-between h-full">
                <blockquote className="text-sm text-white/70 leading-relaxed mb-8 italic">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div>
                  <div className="h-px bg-white/[0.06] mb-6" />
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{t.author}</p>
                      <p className="text-xs text-white/40 mt-0.5">{t.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-[#52e0de]">{t.gap}</p>
                      <p className="text-[10px] text-white/30 max-w-[18ch] text-right">{t.gapLabel}</p>
                    </div>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

function SecuritySection() {
  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start mb-16">
          <FadeIn>
            <p className="text-[#946df7] text-sm font-semibold tracking-wide uppercase mb-4">
              Sicherheit & Datenschutz
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#071423] tracking-tight leading-tight mb-4">
              Gehaltsdaten sind sensibel.
              <br />
              <span className="text-[#aaacb5]">Wir behandeln sie auch so.</span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-sm text-[#535a6b] leading-relaxed mt-2 lg:mt-10 max-w-[48ch]">
              Keine Marketing-Versprechen — das sind die technischen Realitäten.
              Verschlüsselung, Mandantentrennung und EU-Hosting sind keine optionalen
              Features, sondern Grundvoraussetzungen.
            </p>
          </FadeIn>
        </div>

        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {securityItems.map((item) => (
            <StaggerItem key={item.value}>
              <div className="bg-[#f9f9f9] rounded-xl border border-[#e0e0e2] p-5 hover:border-[#aaacb5] transition-colors">
                <p className="text-lg font-extrabold text-[#071423] tracking-tight mb-1">{item.value}</p>
                <p className="text-xs text-[#535a6b] leading-relaxed">{item.label}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeIn delay={0.2} className="mt-8 flex flex-wrap gap-2">
          {['DSGVO-konform', 'Art. 15 & 17', 'ISO 27001 angestrebt', 'EU-RL 2023/970', 'TLS 1.3', 'AES-256'].map((badge) => (
            <span
              key={badge}
              className="px-3 py-1.5 rounded-lg border border-[#e0e0e2] text-[11px] font-medium text-[#535a6b]"
            >
              {badge}
            </span>
          ))}
        </FadeIn>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="py-24 lg:py-32 bg-[#f9f9f9]">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <FadeIn className="mb-14">
          <p className="text-[#52e0de] text-sm font-semibold tracking-wide uppercase mb-4">
            Häufige Fragen
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#071423] tracking-tight leading-tight">
            Fragen & Antworten.
          </h2>
        </FadeIn>

        <StaggerContainer className="space-y-0 divide-y divide-[#e0e0e2]">
          {faqs.map((faq) => (
            <StaggerItem key={faq.q}>
              <div className="py-6">
                <h3 className="text-sm font-bold text-[#071423] mb-2">{faq.q}</h3>
                <p className="text-sm text-[#535a6b] leading-relaxed">{faq.a}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="py-24 lg:py-32 bg-[#071423] relative overflow-hidden">
      {/* Subtle gradient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#946df7]/10 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-4xl mx-auto px-5 sm:px-8 text-center">
        <FadeIn>
          <p className="text-[#52e0de] text-sm font-semibold tracking-wide uppercase mb-5">
            Bereit?
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-[52px] font-extrabold text-white tracking-tight leading-[1.08] mb-6">
            Compliance beginnt heute.
            <br />
            <span className="text-white/30">Nicht im Mai 2026.</span>
          </h2>
          <p className="text-base text-white/50 leading-relaxed max-w-[50ch] mx-auto mb-10">
            Starten Sie kostenlos. Keine Kreditkarte, kein Risiko.
            In 30 Minuten wissen Sie, wo Ihr Unternehmen steht.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link
              href={getAppUrl('/sign-up')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-semibold bg-[#52e0de] text-[#071423] hover:brightness-95 transition-all"
            >
              14 Tage kostenlos testen
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/kontakt"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-semibold border border-white/20 text-white hover:bg-white/5 transition-colors"
            >
              Demo anfragen — 20 min, unverbindlich
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              'Keine Kreditkarte nötig',
              'DSGVO-konform',
              'Hosting in Frankfurt',
              'Kündigung jederzeit',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#52e0de]" />
                <span className="text-xs text-white/40">{item}</span>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Hauptseite ───────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative bg-[#071423] pt-16 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[700px] h-[700px] bg-[#52e0de]/[0.04] rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-[400px] h-[400px] bg-[#946df7]/[0.05] rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 lg:pt-32 pb-16 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — Message */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fbcd56]/10 border border-[#fbcd56]/20 mb-6">
                <Clock className="w-3 h-3 text-[#fbcd56]" />
                <span className="text-[#fbcd56] text-xs font-semibold">EU-Frist: Juni 2026</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-white tracking-tight leading-[1.06] mb-6">
                Entgelttransparenz.
                <br />
                <span className="text-white/30">Compliance-konform.</span>
                <br />
                <span className="text-[#52e0de]">Ohne Aufwand.</span>
              </h1>

              <p className="text-base lg:text-lg text-white/55 leading-relaxed max-w-[48ch] mb-8">
                Die einzige Plattform für die EU-Entgelttransparenzrichtlinie —
                speziell für den deutschen Mittelstand. Gehaltsstrukturen erfassen,
                Gender-Pay-Gap berechnen, EU-konform berichten.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link
                  href={getAppUrl('/sign-up')}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-[#52e0de] text-[#071423] hover:brightness-95 transition-all cursor-pointer"
                >
                  14 Tage kostenlos testen
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/kontakt"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold border border-white/20 text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Demo in 20 min ansehen
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {[
                  'Keine Kreditkarte',
                  'DSGVO-konform',
                  'Hosting in Frankfurt',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#52e0de]" />
                    <span className="text-xs text-white/40">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Dashboard mockup */}
            <div className="relative lg:pl-6">
              <DashboardMockup />
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      {/* ── TRUST BAR ───────────────────────────────────────────── */}
      <TrustBar />

      {/* ── PROBLEM ─────────────────────────────────────────────── */}
      <ProblemSection />

      {/* ── WIE ES FUNKTIONIERT ─────────────────────────────────── */}
      <HowItWorksSection />

      {/* ── FEATURES ────────────────────────────────────────────── */}
      <FeaturesSection />

      {/* ── TESTIMONIALS ────────────────────────────────────────── */}
      <TestimonialsSection />

      {/* ── SECURITY ────────────────────────────────────────────── */}
      <SecuritySection />

      {/* ── PRICING TEASER ──────────────────────────────────────── */}
      <section className="py-20 bg-white border-y border-[#e0e0e2]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <FadeIn className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-[#946df7] text-sm font-semibold tracking-wide uppercase mb-2">Preise</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071423] tracking-tight">
                Ab EUR 99 / Monat. Transparent.
              </h2>
              <p className="text-sm text-[#535a6b] mt-2">Kein Setup-Fee. Keine versteckten Kosten. 14 Tage kostenlos testen.</p>
            </div>
            <Link
              href="/preise"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-[#071423] text-white hover:bg-[#0d1f33] transition-colors whitespace-nowrap flex-shrink-0"
            >
              Alle Pakete ansehen <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <FaqSection />

      {/* ── FINAL CTA ───────────────────────────────────────────── */}
      <FinalCta />
    </>
  );
}
