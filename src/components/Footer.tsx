import { Shield } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    produkt: [
      { label: "Funktionen", href: "#features" },
      { label: "Sicherheit", href: "#security" },
      { label: "Preise", href: "#pricing" },
      { label: "Roadmap", href: "#" },
    ],
    unternehmen: [
      { label: "Über uns", href: "#" },
      { label: "Karriere", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Presse", href: "#" },
    ],
    rechtliches: [
      { label: "Datenschutz", href: "#" },
      { label: "Impressum", href: "#" },
      { label: "AGB", href: "#" },
      { label: "Cookies", href: "#" },
    ],
    support: [
      { label: "Hilfe-Center", href: "#" },
      { label: "Dokumentation", href: "#" },
      { label: "Status", href: "#" },
      { label: "Kontakt", href: "#contact" },
    ],
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid lg:grid-cols-6 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-xl font-bold text-primary-foreground tracking-tight">
                EntgeltGuard
              </span>
            </a>
            <p className="text-primary-foreground/60 text-sm max-w-xs leading-relaxed">
              Die B2B-Compliance-Plattform für die EU-Entgelttransparenzrichtlinie. 
              Schützen Sie Ihr Unternehmen rechtssicher.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="px-3 py-1 bg-primary-foreground/10 rounded text-xs font-medium">
                ISO 27001
              </span>
              <span className="px-3 py-1 bg-primary-foreground/10 rounded text-xs font-medium">
                DSGVO
              </span>
              <span className="px-3 py-1 bg-primary-foreground/10 rounded text-xs font-medium">
                Made in EU
              </span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-primary-foreground mb-4 capitalize">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
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
        <div className="pt-8 border-t border-primary-foreground/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/50">
            © 2026 EntgeltGuard GmbH. Alle Rechte vorbehalten.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-primary-foreground/50 hover:text-primary-foreground transition-colors">
              LinkedIn
            </a>
            <a href="#" className="text-sm text-primary-foreground/50 hover:text-primary-foreground transition-colors">
              Twitter
            </a>
            <a href="#" className="text-sm text-primary-foreground/50 hover:text-primary-foreground transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
