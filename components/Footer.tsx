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
    <footer className="bg-foreground text-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-12">
          <div className="lg:col-span-4 space-y-4">
            <a href={getMarketingUrl("/")}>
              <Image src="/brandname.svg" alt="KlarGehalt" width={140} height={20} className="h-5 w-auto invert opacity-60" />
            </a>
            <p className="text-xs text-background/20 leading-relaxed max-w-[32ch]">
              Compliance-Plattform fuer die EU-Entgelttransparenzrichtlinie.
            </p>
          </div>

          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {Object.entries(links).map(([title, items]) => (
              <div key={title}>
                <p className="text-[10px] font-medium text-background/30 mb-3 uppercase tracking-[0.15em]">{title}</p>
                <ul className="space-y-2">
                  {items.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href.startsWith("/") ? getMarketingUrl(l.href) : l.href}
                        className="text-xs text-background/20 hover:text-background/40 transition-colors"
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

        <div className="pt-6 border-t border-background/[0.05] flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[10px] text-background/10">2026 KlarGehalt GmbH</p>
          <div className="flex gap-4">
            {["LinkedIn", "GitHub"].map((s) => (
              <a key={s} href="#" className="text-[10px] text-background/10 hover:text-background/25 transition-colors">{s}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
