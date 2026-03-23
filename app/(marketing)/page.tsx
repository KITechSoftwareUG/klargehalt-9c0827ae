'use client';

import { ArrowRight, ArrowUpRight, Shield, Users, TrendingUp, Building2, Briefcase, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getMarketingUrl } from '@/utils/url';

const highlights = [
  {
    tag: 'Plattform',
    title: 'KI-gestuetzte Gehaltsanalyse',
    desc: 'Unsere KI erkennt Muster in Ihren Gehaltsdaten und liefert konkrete Handlungsempfehlungen fuer faire Verguetung.',
    color: 'bg-[var(--ep-teal)]',
    textColor: 'text-[var(--ep-teal-dark)]',
    bgColor: 'bg-[var(--ep-teal-light)]',
  },
  {
    tag: 'Compliance',
    title: 'EU-Richtlinie automatisiert',
    desc: 'Automatische Berichterstellung gemaess EU-Entgelttransparenzrichtlinie 2023/970. Immer aktuell, immer konform.',
    color: 'bg-[var(--ep-yellow)]',
    textColor: 'text-[var(--ep-yellow-dark)]',
    bgColor: 'bg-[var(--ep-yellow-light)]',
  },
  {
    tag: 'Sicherheit',
    title: 'Bankgrade Verschluesselung',
    desc: 'AES-256-Verschluesselung, Mandantentrennung und EU-Hosting. Ihre sensiblen Gehaltsdaten sind bei uns sicher.',
    color: 'bg-[var(--ep-purple)]',
    textColor: 'text-[var(--ep-purple-dark)]',
    bgColor: 'bg-[var(--ep-purple-light)]',
  },
];

const partners = [
  { name: 'SAP', icon: Building2 },
  { name: 'Personio', icon: Users },
  { name: 'Workday', icon: Briefcase },
  { name: 'DATEV', icon: TrendingUp },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-[#071423] pt-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 lg:pt-32 pb-16 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="animate-fade-in">
              <p className="text-[var(--ep-teal)] text-sm font-semibold tracking-wide uppercase mb-4">
                Entgelttransparenz fuer Unternehmen
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-white tracking-tight leading-[1.08] mb-6">
                Faire Gehaelter,
                <br />
                <span className="text-white/50">fuer jede Zeit.</span>
              </h1>
              <p className="text-base lg:text-lg text-white/60 leading-relaxed max-w-[48ch] mb-8">
                Die Plattform fuer Entgelttransparenz. Gehaltsstrukturen erfassen,
                Pay-Gaps erkennen und EU-konforme Berichte generieren — alles an einem Ort.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={getMarketingUrl('/kontakt')}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-white text-[#071423] hover:bg-white/90 transition-colors cursor-pointer"
                >
                  Kostenlose Demo starten
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={getMarketingUrl('/funktionen')}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold border border-white/20 text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Plattform entdecken
                </Link>
              </div>
            </div>

            <div className="relative animate-slide-in-right animation-delay-200">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-gradient-to-br from-[var(--ep-purple)]/20 to-[var(--ep-teal)]/20">
                <div className="absolute inset-0 bg-gradient-to-t from-[#071423]/60 to-transparent z-10" />
                <Image
                  src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80"
                  alt="Professionelle Frau laechelt"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute bottom-6 left-6 right-6 z-20">
                  <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <p className="text-white text-sm font-medium">Pay-Gap Analyse</p>
                    <p className="text-white/60 text-xs mt-1">Bereinigter Gender-Pay-Gap: 3.2%</p>
                    <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--ep-teal)] rounded-full" style={{ width: '68%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative gradient transition */}
        <div className="h-24 bg-gradient-to-b from-[#071423] to-[var(--ep-gray-1)]" />
      </section>

      {/* Why KlarGehalt */}
      <section className="bg-[var(--ep-gray-1)] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl mb-14">
            <p className="text-[var(--ep-purple)] text-sm font-semibold tracking-wide uppercase mb-3">
              Warum KlarGehalt
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#071423] tracking-tight leading-[1.1] mb-4">
              Gebaut fuer eine
              <br />neue Pflicht.
            </h2>
            <p className="text-base text-[var(--ep-gray-4)] leading-relaxed">
              Ab Juni 2026 muessen Unternehmen in der EU Gehaelter offenlegen. KlarGehalt wurde
              spezifisch fuer diese Anforderung entwickelt — kein umgebautes HR-Tool.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { accent: 'var(--ep-teal)', title: 'Sofort einsatzbereit', desc: 'Kein monatelanges Implementierungsprojekt. Daten importieren, Struktur anlegen, Berichte generieren.' },
              { accent: 'var(--ep-purple)', title: 'Sicherheit eingebaut', desc: 'Row Level Security, Mandantentrennung, EU-Hosting. Ihre Gehaltsdaten sind auf Datenbankebene geschuetzt.' },
              { accent: 'var(--ep-yellow)', title: 'Fuer den Mittelstand', desc: 'Enterprise-Features ohne Enterprise-Budget. Ab 199 EUR/Monat fuer bis zu 50 Mitarbeiter.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-8 border border-[var(--ep-gray-2)] relative overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: item.accent }} />
                <h3 className="text-lg font-bold text-[#071423] mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--ep-gray-4)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / Security */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl mb-14">
            <p className="text-[var(--ep-teal)] text-sm font-semibold tracking-wide uppercase mb-3">
              Vertrauen & Sicherheit
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#071423] tracking-tight leading-[1.1] mb-4">
              Darueber heisst
              <br />Sicherheit.
            </h2>
            <p className="text-base text-[var(--ep-gray-4)] leading-relaxed">
              Gehaltsdaten gehoeren zu den sensibelsten Informationen Ihres Unternehmens.
              Unsere Plattform schuetzt sie mit bankgrade Sicherheitsstandards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'DSGVO-konform',
                desc: 'Vollstaendige Compliance mit der EU-Datenschutzgrundverordnung. Regelmaessige Audits und Zertifizierungen.',
              },
              {
                icon: Building2,
                title: 'EU-Hosting',
                desc: 'Alle Daten werden ausschliesslich in deutschen Rechenzentren gespeichert. Frankfurt am Main.',
              },
              {
                icon: Users,
                title: 'Mandantentrennung',
                desc: 'Strikte Datenisolierung zwischen Mandanten auf Datenbankebene. Row Level Security.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-[var(--ep-gray-1)] rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >
                <item.icon className="w-8 h-8 text-[var(--ep-purple)] mb-5" />
                <h3 className="text-lg font-bold text-[#071423] mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--ep-gray-4)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="bg-[var(--ep-gray-1)] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
            <div>
              <p className="text-[var(--ep-purple)] text-sm font-semibold tracking-wide uppercase mb-3">
                Features
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#071423] tracking-tight leading-[1.1]">
                Was euch inspiriert:
                <br />Unsere Highlights.
              </h2>
            </div>
            <Link
              href={getMarketingUrl('/funktionen')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ep-purple-dark)] hover:gap-2.5 transition-all cursor-pointer"
            >
              Alle Features <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {highlights.map((h) => (
              <div
                key={h.title}
                className={`${h.bgColor} rounded-2xl p-8 hover:shadow-lg transition-all group cursor-pointer`}
              >
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${h.textColor} ${h.color}/20 mb-5`}>
                  {h.tag}
                </span>
                <h3 className={`text-xl font-bold ${h.textColor} mb-3`}>{h.title}</h3>
                <p className={`text-sm ${h.textColor}/70 leading-relaxed mb-6`}>{h.desc}</p>
                <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${h.textColor} group-hover:gap-2.5 transition-all`}>
                  Mehr erfahren <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Digital / Integration */}
      <section className="bg-[#071423] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-[var(--ep-teal)] text-sm font-semibold tracking-wide uppercase mb-3">
                Integrationen
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
                Die KlarGehalt
                <br />Plattform geht auch
                <br />digital.
              </h2>
              <p className="text-base text-white/60 leading-relaxed mb-8 max-w-[48ch]">
                Nahtlose Integration in Ihre bestehende HR-Landschaft.
                Verbinden Sie KlarGehalt mit den Tools, die Sie bereits nutzen.
              </p>
              <Link
                href={getMarketingUrl('/funktionen')}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-white text-[#071423] hover:bg-white/90 transition-colors cursor-pointer"
              >
                Integrationen entdecken <ArrowRight className="w-4 h-4" />
              </Link>
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

      {/* Career / CTA */}
      <section className="relative bg-[var(--ep-purple-dark)] py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--ep-purple-dark)] via-[var(--ep-purple-dark)] to-[var(--ep-purple)]/30" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <p className="text-[var(--ep-purple-light)] text-sm font-semibold tracking-wide uppercase mb-3">
                Karriere
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
                Neue Rolle?
                <br />Take it, and
                <br />make it.
              </h2>
              <p className="text-base text-white/60 leading-relaxed mb-8 max-w-[44ch]">
                Wir suchen Menschen, die mit uns die Zukunft der Entgelttransparenz gestalten.
                Faire Bezahlung faengt bei uns selbst an.
              </p>
              <Link
                href={getMarketingUrl('/kontakt')}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-white text-[var(--ep-purple-dark)] hover:bg-white/90 transition-colors cursor-pointer"
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
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--ep-purple-dark)]/40 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <Heart className="w-8 h-8 text-[var(--ep-purple)] mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#071423] tracking-tight mb-4">
            Bereit fuer faire Gehaelter?
          </h2>
          <p className="text-base text-[var(--ep-gray-4)] mb-8 max-w-[45ch] mx-auto">
            In 20 Minuten zeigen wir Ihnen, wie KlarGehalt Ihr Unternehmen EU-konform macht. Unverbindlich.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={getMarketingUrl('/kontakt')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-[#071423] text-white hover:bg-[#0d1f33] transition-colors cursor-pointer"
            >
              Demo anfragen <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={getMarketingUrl('/preise')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold border border-[var(--ep-gray-2)] text-[#071423] hover:bg-[var(--ep-gray-1)] transition-colors cursor-pointer"
            >
              Preise ansehen
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
