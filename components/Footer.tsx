import Image from "next/image";
import { getMarketingUrl } from "@/utils/url";

const links = {
  Produkt: [
    { label: "Funktionen", href: "/#features" },
    { label: "Sicherheit", href: "/#security" },
    { label: "Preise", href: "/#pricing" },
  ],
  Unternehmen: [
    { label: "Ueber uns", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Karriere", href: "#" },
  ],
  Rechtliches: [
    { label: "Datenschutz", href: "#" },
    { label: "Impressum", href: "#" },
    { label: "AGB", href: "#" },
  ],
  Support: [
    { label: "Dokumentation", href: "#" },
    { label: "Status", href: "#" },
    { label: "Kontakt", href: "/#contact" },
  ],
};

const Footer = () => {
  return (
    <footer className="bg-[#1E293B]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 mb-10">
          <div className="lg:col-span-4 space-y-4">
            <a href={getMarketingUrl("/")} className="cursor-pointer">
              <Image src="/brandname.svg" alt="KlarGehalt" width={130} height={20} className="h-5 w-auto invert opacity-50" />
            </a>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[32ch]">
              Compliance-Plattform fuer die EU-Entgelttransparenzrichtlinie.
            </p>
          </div>

          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {Object.entries(links).map(([title, items]) => (
              <div key={title}>
                <p className="text-[10px] font-semibold text-slate-500 mb-3 uppercase tracking-[0.15em]">{title}</p>
                <ul className="space-y-2">
                  {items.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href.startsWith("/") ? getMarketingUrl(l.href) : l.href}
                        className="text-xs text-slate-600 hover:text-slate-400 transition-colors cursor-pointer"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[10px] text-slate-600">2026 KlarGehalt GmbH. Alle Rechte vorbehalten.</p>
          <div className="flex gap-5">
            {["LinkedIn", "GitHub"].map((s) => (
              <a key={s} href="#" className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors cursor-pointer">{s}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
