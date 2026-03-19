import { Logo } from "@/components/Logo";
import { BrandName } from "@/components/BrandName";
import { getMarketingUrl } from "@/utils/url";

const footerLinks = {
  Produkt: [
    { label: "Funktionen", href: getMarketingUrl("/#features") },
    { label: "Sicherheit", href: getMarketingUrl("/#security") },
    { label: "Preise", href: getMarketingUrl("/#pricing") },
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
    { label: "Kontakt", href: getMarketingUrl("/#contact") },
  ],
};

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="h-px bg-gradient-to-r from-transparent via-primary-foreground/[0.06] to-transparent" />

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-20 lg:py-24">
        {/* Top — brand + links in asymmetric grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 mb-16">
          {/* Brand — 5 cols */}
          <div className="lg:col-span-5 space-y-6">
            <a
              href={getMarketingUrl("/")}
              className="inline-flex items-center gap-2.5"
            >
              <Logo className="w-8 h-8" variant="light" />
              <BrandName
                className="h-3.5"
                color="hsl(var(--primary-foreground))"
              />
            </a>
            <p className="text-primary-foreground/40 text-sm leading-relaxed max-w-[40ch]">
              Die B2B-Compliance-Plattform fuer die
              EU-Entgelttransparenzrichtlinie. Schuetzen Sie Ihr Unternehmen
              rechtssicher.
            </p>
            <div className="flex items-center gap-3">
              {["ISO 27001", "DSGVO", "Made in EU"].map((cert) => (
                <span
                  key={cert}
                  className="px-2.5 py-1 border border-primary-foreground/[0.06] rounded text-xs text-primary-foreground/40"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>

          {/* Links — 7 cols, distributed */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="text-sm font-semibold text-primary-foreground/70 mb-4 tracking-wide">
                  {title}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-primary-foreground/30 hover:text-primary-foreground/60 transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-primary-foreground/[0.06] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-primary-foreground/25">
            &copy; 2026 KlarGehalt GmbH. Alle Rechte vorbehalten.
          </p>
          <div className="flex items-center gap-6">
            {["LinkedIn", "GitHub"].map((social) => (
              <a
                key={social}
                href="#"
                className="text-xs text-primary-foreground/25 hover:text-primary-foreground/50 transition-colors"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
