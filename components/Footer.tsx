import { Logo } from "@/components/Logo";
import { BrandName } from "@/components/BrandName";
import { getMarketingUrl } from "@/utils/url";

const Footer = () => {
  const footerLinks = {
    Produkt: [
      { label: "Funktionen", href: getMarketingUrl("/#features") },
      { label: "Sicherheit", href: getMarketingUrl("/#security") },
      { label: "Preise", href: getMarketingUrl("/#pricing") },
      { label: "Roadmap", href: "#" },
    ],
    Unternehmen: [
      { label: "Ueber uns", href: "#" },
      { label: "Karriere", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Presse", href: "#" },
    ],
    Rechtliches: [
      { label: "Datenschutz", href: "#" },
      { label: "Impressum", href: "#" },
      { label: "AGB", href: "#" },
      { label: "Cookies", href: "#" },
    ],
    Support: [
      { label: "Hilfe-Center", href: "#" },
      { label: "Dokumentation", href: "#" },
      { label: "Status", href: "#" },
      { label: "Kontakt", href: getMarketingUrl("/#contact") },
    ],
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Top divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent" />

      <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-20">
        <div className="grid lg:grid-cols-6 gap-12 lg:gap-8 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-5">
            <a
              href={getMarketingUrl("/")}
              className="flex items-center gap-2.5"
            >
              <Logo className="w-8 h-8" variant="light" />
              <BrandName className="h-3.5" color="hsl(var(--primary-foreground))" />
            </a>
            <p className="text-primary-foreground/50 text-sm max-w-xs leading-relaxed">
              Die B2B-Compliance-Plattform fuer die
              EU-Entgelttransparenzrichtlinie. Schuetzen Sie Ihr Unternehmen
              rechtssicher.
            </p>
            <div className="flex items-center gap-3 pt-1">
              {["ISO 27001", "DSGVO", "Made in EU"].map((cert) => (
                <span
                  key={cert}
                  className="px-2.5 py-1 bg-primary-foreground/5 border border-primary-foreground/8 rounded text-xs font-medium text-primary-foreground/60"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-primary-foreground/80 text-sm mb-4 tracking-wide">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-primary-foreground/8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-primary-foreground/35">
            &copy; 2026 KlarGehalt GmbH. Alle Rechte vorbehalten.
          </p>
          <div className="flex items-center gap-6">
            {["LinkedIn", "Twitter", "GitHub"].map((social) => (
              <a
                key={social}
                href="#"
                className="text-xs text-primary-foreground/35 hover:text-primary-foreground/60 transition-colors"
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
