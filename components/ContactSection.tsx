import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="py-32 lg:py-40 relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        {/* Asymmetric split 5/7 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20">
          {/* Left */}
          <div className="lg:col-span-5 space-y-10">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-4">
                Kontakt
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tighter leading-none mb-5">
                Lassen Sie
                <br />
                uns sprechen.
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed max-w-[40ch]">
                Fragen zur EU-Entgelttransparenzrichtlinie? Unsere
                Compliance-Experten beraten Sie unverbindlich.
              </p>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground/40 text-xs uppercase tracking-wider mb-1">E-Mail</p>
                <p className="text-foreground font-medium">kontakt@klargehalt.de</p>
              </div>
              <div>
                <p className="text-muted-foreground/40 text-xs uppercase tracking-wider mb-1">Telefon</p>
                <p className="text-foreground font-medium">+49 (0) 30 847 291 03</p>
              </div>
              <div>
                <p className="text-muted-foreground/40 text-xs uppercase tracking-wider mb-1">Standort</p>
                <p className="text-foreground font-medium">Berlin, Deutschland</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-border/40">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
              <span className="text-xs text-muted-foreground/50">
                Antwort innerhalb von 24h
              </span>
            </div>
          </div>

          {/* Right — form */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-border/40 bg-card p-8 lg:p-12">
              <h3 className="text-lg font-bold text-foreground tracking-tight mb-1">
                Demo anfragen
              </h3>
              <p className="text-sm text-muted-foreground mb-8">
                Wir melden uns innerhalb eines Werktags.
              </p>

              <form className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Vorname" id="fn" placeholder="Max" />
                  <InputField label="Nachname" id="ln" placeholder="Mustermann" />
                </div>
                <InputField
                  label="Geschaeftliche E-Mail"
                  id="email"
                  type="email"
                  placeholder="m.mustermann@unternehmen.de"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Unternehmen" id="co" placeholder="Unternehmen GmbH" />
                  <div>
                    <label htmlFor="size" className="block text-sm font-medium text-foreground mb-2">
                      Mitarbeiteranzahl
                    </label>
                    <select
                      id="size"
                      className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
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
                  <label htmlFor="msg" className="block text-sm font-medium text-foreground mb-2">
                    Nachricht (optional)
                  </label>
                  <textarea
                    id="msg"
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground/30 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all resize-none"
                    placeholder="Wie koennen wir helfen?"
                  />
                </div>
                <Button variant="hero" size="lg" className="w-full group">
                  Demo anfragen
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <p className="text-[11px] text-muted-foreground/30 text-center">
                  Mit dem Absenden stimmen Sie unserer Datenschutzerklaerung zu.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

function InputField({
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
      <label htmlFor={id} className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>
      <input
        type={type}
        id={id}
        className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground/30 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
        placeholder={placeholder}
      />
    </div>
  );
}

export default ContactSection;
