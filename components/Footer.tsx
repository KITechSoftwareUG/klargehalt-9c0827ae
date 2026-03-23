import Link from 'next/link';
import { getMarketingUrl } from '@/utils/url';

const links = {
  Plattform: [
    { label: 'Funktionen', href: '/funktionen' },
    { label: 'Sicherheit', href: '/sicherheit' },
    { label: 'Preise', href: '/preise' },
    { label: 'Kontakt', href: '/kontakt' },
  ],
  Unternehmen: [
    { label: 'Ueber uns', href: '/ueber-uns' },
    { label: 'EU-Richtlinie', href: '/eu-richtlinie' },
    { label: 'Karriere', href: '/kontakt' },
  ],
  Rechtliches: [
    { label: 'Datenschutz', href: '#' },
    { label: 'Impressum', href: '#' },
    { label: 'AGB', href: '#' },
  ],
};

const Footer = () => {
  return (
    <footer className="bg-[#071423]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 mb-10">
          <div className="lg:col-span-4 space-y-4">
            <Link href={getMarketingUrl('/')} className="cursor-pointer">
              <span className="text-white/50 text-lg font-bold tracking-tight">europace</span>
            </Link>
            <p className="text-xs text-white/30 leading-relaxed max-w-[32ch]">
              Die Compliance-Plattform fuer Entgelttransparenz. EU-konform, sicher, einfach.
            </p>
          </div>

          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8 lg:justify-end">
            {Object.entries(links).map(([title, items]) => (
              <div key={title}>
                <p className="text-[10px] font-semibold text-white/30 mb-3 uppercase tracking-[0.15em]">{title}</p>
                <ul className="space-y-2">
                  {items.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href.startsWith('/') ? getMarketingUrl(l.href) : l.href}
                        className="text-xs text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[10px] text-white/30">2026 KlarGehalt GmbH. Alle Rechte vorbehalten.</p>
          <p className="text-[10px] text-white/30">Frankfurt, Deutschland</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
