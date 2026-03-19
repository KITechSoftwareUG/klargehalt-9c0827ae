import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="py-24 lg:py-36 bg-background relative">
      {/* Subtle top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-16 lg:gap-20 items-start max-w-6xl mx-auto">
          {/* Left Content — 2 cols */}
          <div className="lg:col-span-2 space-y-10">
            <div>
              <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-4">
                Kontakt
              </p>
              <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-6 tracking-tight leading-tight">
                Lassen Sie
                <br />
                uns sprechen
              </h2>
              <p className="text-base lg:text-lg text-muted-foreground leading-relaxed">
                Haben Sie Fragen zur Umsetzung der
                EU-Entgelttransparenzrichtlinie? Unsere Compliance-Experten
                beraten Sie gerne.
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              {[
                {
                  icon: Mail,
                  label: "E-Mail",
                  value: "kontakt@klargehalt.de",
                },
                {
                  icon: Phone,
                  label: "Telefon",
                  value: "+49 (0) 30 123 456 789",
                },
                {
                  icon: MapPin,
                  label: "Standort",
                  value: "Berlin, Deutschland",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border/40 hover:border-border/80 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/8 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium text-foreground">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Contact Form — 3 cols */}
          <div className="lg:col-span-3 bg-card p-8 lg:p-10 rounded-2xl border border-border/60">
            <h3 className="text-lg font-bold text-foreground mb-8">
              Demo anfragen
            </h3>
            <form className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Vorname
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all text-sm"
                    placeholder="Max"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Nachname
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all text-sm"
                    placeholder="Mustermann"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Geschaeftliche E-Mail
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all text-sm"
                  placeholder="max.mustermann@unternehmen.de"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="company"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Unternehmen
                  </label>
                  <input
                    type="text"
                    id="company"
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all text-sm"
                    placeholder="Unternehmen GmbH"
                  />
                </div>
                <div>
                  <label
                    htmlFor="employees"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Mitarbeiteranzahl
                  </label>
                  <select
                    id="employees"
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all text-sm"
                  >
                    <option value="">Bitte waehlen</option>
                    <option value="1-50">1–50</option>
                    <option value="51-250">51–250</option>
                    <option value="251-1000">251–1.000</option>
                    <option value="1000+">1.000+</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Nachricht (optional)
                </label>
                <textarea
                  id="message"
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all resize-none text-sm"
                  placeholder="Wie koennen wir Ihnen helfen?"
                />
              </div>

              <Button variant="hero" size="lg" className="w-full group">
                Demo anfragen
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>

              <p className="text-xs text-muted-foreground/60 text-center">
                Mit dem Absenden stimmen Sie unserer{" "}
                <a href="#" className="text-accent hover:underline">
                  Datenschutzerklaerung
                </a>{" "}
                zu.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
