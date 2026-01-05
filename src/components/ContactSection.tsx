import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="py-24 lg:py-32 bg-background relative">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start max-w-6xl mx-auto">
          {/* Left Content */}
          <div className="space-y-8">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
                Kontakt
              </span>
              <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-6 tracking-tight">
                Lassen Sie uns sprechen
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Haben Sie Fragen zur Umsetzung der EU-Entgelttransparenzrichtlinie? 
                Unsere Compliance-Experten beraten Sie gerne.
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">E-Mail</p>
                  <p className="font-medium text-foreground">kontakt@entgeltguard.de</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefon</p>
                  <p className="font-medium text-foreground">+49 (0) 30 123 456 789</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Standort</p>
                  <p className="font-medium text-foreground">Berlin, Deutschland (EU-Hosting)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Contact Form */}
          <div className="bg-card p-8 rounded-2xl border border-border shadow-elegant">
            <h3 className="text-xl font-bold text-foreground mb-6">
              Demo anfragen
            </h3>
            <form className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                    Vorname
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                    placeholder="Max"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                    Nachname
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                    placeholder="Mustermann"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Geschäftliche E-Mail
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  placeholder="max.mustermann@unternehmen.de"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
                  Unternehmen
                </label>
                <input
                  type="text"
                  id="company"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  placeholder="Unternehmen GmbH"
                />
              </div>

              <div>
                <label htmlFor="employees" className="block text-sm font-medium text-foreground mb-2">
                  Mitarbeiteranzahl
                </label>
                <select
                  id="employees"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                >
                  <option value="">Bitte wählen</option>
                  <option value="1-50">1-50 Mitarbeiter</option>
                  <option value="51-250">51-250 Mitarbeiter</option>
                  <option value="251-1000">251-1.000 Mitarbeiter</option>
                  <option value="1000+">Mehr als 1.000</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Nachricht (optional)
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none"
                  placeholder="Wie können wir Ihnen helfen?"
                />
              </div>

              <Button variant="hero" size="lg" className="w-full group">
                Demo anfragen
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Mit dem Absenden stimmen Sie unserer{" "}
                <a href="#" className="text-accent hover:underline">Datenschutzerklärung</a>{" "}
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
