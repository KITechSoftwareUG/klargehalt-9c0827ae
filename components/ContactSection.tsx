import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, Phone, MapPin } from "lucide-react";

const contactDetails = [
  { icon: Mail, label: "E-Mail", value: "kontakt@klargehalt.de" },
  { icon: Phone, label: "Telefon", value: "+49 (0) 30 847 291 03" },
  { icon: MapPin, label: "Standort", value: "Berlin, Deutschland" },
];

const ContactSection = () => {
  return (
    <section id="contact" className="py-32 lg:py-44 relative">
      {/* Divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        {/* Asymmetric split — text left, form right (wider) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20">
          {/* Left — 5 cols */}
          <div className="lg:col-span-5 space-y-12">
            <div>
              <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-4">
                Kontakt
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-none mb-6">
                Lassen Sie
                <br />
                uns sprechen
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed max-w-[45ch]">
                Fragen zur EU-Entgelttransparenzrichtlinie? Unsere
                Compliance-Experten beraten Sie — unverbindlich und kostenfrei.
              </p>
            </div>

            {/* Contact details — stacked, no cards (taste-skill anti-card) */}
            <div className="space-y-6">
              {contactDetails.map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <item.icon className="w-5 h-5 text-accent flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {item.label}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust line */}
            <div className="flex items-center gap-4 pt-4 border-t border-border/40">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
              <span className="text-sm text-muted-foreground/60">
                Antwort innerhalb von 24 Stunden
              </span>
            </div>
          </div>

          {/* Right — 7 cols, form */}
          <div className="lg:col-span-7">
            <div className="bg-card rounded-2xl border border-border/40 p-8 lg:p-12">
              <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">
                Demo anfragen
              </h3>
              <p className="text-sm text-muted-foreground mb-8">
                Fuellen Sie das Formular aus und wir melden uns bei Ihnen.
              </p>

              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Vorname" id="firstName" placeholder="Max" />
                  <FormField
                    label="Nachname"
                    id="lastName"
                    placeholder="Mustermann"
                  />
                </div>

                <FormField
                  label="Geschaeftliche E-Mail"
                  id="email"
                  type="email"
                  placeholder="m.mustermann@unternehmen.de"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Unternehmen"
                    id="company"
                    placeholder="Unternehmen GmbH"
                  />
                  <div>
                    <label
                      htmlFor="employees"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Mitarbeiteranzahl
                    </label>
                    <select
                      id="employees"
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all"
                    >
                      <option value="">Bitte waehlen</option>
                      <option value="1-50">1 - 50</option>
                      <option value="51-250">51 - 250</option>
                      <option value="251-1000">251 - 1.000</option>
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
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground/40 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all resize-none"
                    placeholder="Wie koennen wir Ihnen helfen?"
                  />
                </div>

                <Button variant="hero" size="lg" className="w-full group">
                  Demo anfragen
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>

                <p className="text-xs text-muted-foreground/50 text-center">
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
      </div>
    </section>
  );
};

function FormField({
  label,
  id,
  type = "text",
  placeholder,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-foreground mb-2"
      >
        {label}
      </label>
      <input
        type={type}
        id={id}
        className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground/40 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all"
        placeholder={placeholder}
      />
    </div>
  );
}

export default ContactSection;
