import { ArrowRight, Shield, BarChart3, Scale, Building2, Users, Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const pages = [
  {
    href: '/funktionen',
    icon: BarChart3,
    title: 'Funktionen',
    desc: 'Sechs Module für Gehaltsstrukturen, Pay-Gap Analyse, RBAC und Audit-Trail.',
    accent: '#52e0de',
    accentBg: '#bdf9f7',
  },
  {
    href: '/sicherheit',
    icon: Shield,
    title: 'Sicherheit',
    desc: 'AES-256, Mandantentrennung, EU-Hosting in Frankfurt. Security by Design.',
    accent: '#946df7',
    accentBg: '#e0d4fd',
  },
  {
    href: '/eu-richtlinie',
    icon: Scale,
    title: 'EU-Richtlinie',
    desc: 'Was die Entgelttransparenzrichtlinie 2023/970 für Ihr Unternehmen bedeutet.',
    accent: '#fbcd56',
    accentBg: '#fef1c2',
  },
  {
    href: '/preise',
    icon: Building2,
    title: 'Preise',
    desc: 'Transparente Preise ab 199 €/Monat. Starter, Business und Enterprise.',
    accent: '#52e0de',
    accentBg: '#bdf9f7',
  },
  {
    href: '/ueber-uns',
    icon: Users,
    title: 'Über uns',
    desc: 'Das Team, unsere Mission und warum wir KlarGehalt bauen.',
    accent: '#946df7',
    accentBg: '#e0d4fd',
  },
  {
    href: '/kontakt',
    icon: Mail,
    title: 'Kontakt',
    desc: 'Demo anfragen, Fragen stellen oder einfach hallo sagen.',
    accent: '#fbcd56',
    accentBg: '#fef1c2',
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-[#071423] pt-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 lg:pt-32 pb-16 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <p className="text-[#52e0de] text-sm font-semibold tracking-wide uppercase mb-4">
                Entgelttransparenz für Unternehmen
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-white tracking-tight leading-[1.08] mb-6">
                Faire Gehälter,
                <br />
                <span className="text-white/50">für jede Zeit.</span>
              </h1>
              <p className="text-base lg:text-lg text-white/60 leading-relaxed max-w-[48ch] mb-8">
                Die Plattform für Entgelttransparenz. Gehaltsstrukturen erfassen,
                Pay-Gaps erkennen und EU-konforme Berichte generieren — alles an einem Ort.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/kontakt"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-white text-[#071423] hover:bg-white/90 transition-colors cursor-pointer"
                >
                  Kostenlose Demo starten
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/funktionen"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold border border-white/20 text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Plattform entdecken
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-gradient-to-br from-[#946df7]/20 to-[#52e0de]/20">
                <div className="absolute inset-0 bg-gradient-to-t from-[#071423]/60 to-transparent z-10" />
                <Image
                  src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80"
                  alt="Professionelle Frau lächelt"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute bottom-6 left-6 right-6 z-20">
                  <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <p className="text-white text-sm font-medium">Pay-Gap Analyse</p>
                    <p className="text-white/60 text-xs mt-1">Bereinigter Gender-Pay-Gap: 3,2 %</p>
                    <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#52e0de] rounded-full" style={{ width: '68%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seitenübersicht */}
      <section className="bg-[#f9f9f9] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl mb-14">
            <p className="text-[#946df7] text-sm font-semibold tracking-wide uppercase mb-3">
              Entdecken
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#071423] tracking-tight leading-[1.1]">
              Alles auf einen Blick.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="group bg-white rounded-2xl p-8 border border-[#e0e0e2] hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: p.accent }} />
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: p.accentBg }}
                >
                  <p.icon className="w-5 h-5" style={{ color: p.accent }} />
                </div>
                <h3 className="text-lg font-bold text-[#071423] mb-2">{p.title}</h3>
                <p className="text-sm text-[#535a6b] leading-relaxed mb-6">{p.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#071423] group-hover:gap-2.5 transition-all">
                  Mehr erfahren <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
