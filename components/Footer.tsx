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
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-4 space-y-5">
            <a href={getMarketingUrl("/")} className="inline-flex items-center gap-2.5">
              <Image src="/brandname.svg" alt="KlarGehalt" width={120} height={18} className="h-4 w-auto invert" />
            </a>
            <p className="text-background/30 text-sm leading-relaxed max-w-[36ch]">
              B2B-Compliance-Plattform fuer die EU-Entgelttransparenzrichtlinie.
            </p>
            <div className="flex gap-2">
              {["ISO 27001", "DSGVO", "Made in EU"].map((c) => (
                <span
                  key={c}
                  className="px-2 py-1 border border-background/[0.06] rounded text-[10px] text-background/25 tracking-wider"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {Object.entries(links).map(([title, items]) => (
              <div key={title}>
                <p className="text-xs font-semibold text-background/50 mb-4 tracking-wide uppercase">
                  {title}
                </p>
                <ul className="space-y-2.5">
                  {items.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href.startsWith("/") ? getMarketingUrl(l.href) : l.href}
                        className="text-sm text-background/25 hover:text-background/50 transition-colors"
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

        <div className="pt-6 border-t border-background/[0.06] flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[11px] text-background/15">
            2026 KlarGehalt GmbH
          </p>
          <div className="flex gap-5">
            {["LinkedIn", "GitHub"].map((s) => (
              <a key={s} href="#" className="text-[11px] text-background/15 hover:text-background/30 transition-colors">
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
