import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="py-28 lg:py-36 bg-muted/30">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20">
          {/* Left */}
          <div className="lg:col-span-5 space-y-10">
            <div>
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-accent mb-3">
                Kontakt
              </p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground tracking-tight leading-tight mb-4">
                Bereit fuer konforme Gehaltstransparenz?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[40ch]">
                Unsere Compliance-Experten beraten Sie unverbindlich
                zur EU-Entgelttransparenzrichtlinie.
              </p>
            </div>

            <div className="space-y-4">
              <ContactLine label="E-Mail" value="kontakt@klargehalt.de" />
              <ContactLine label="Telefon" value="+49 (0) 30 847 291 03" />
              <ContactLine label="Standort" value="Berlin, Deutschland" />
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-border/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground/40">Antwort innerhalb von 24h</span>
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-border/50 p-8 lg:p-10 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <h3 className="text-base font-semibold text-foreground tracking-tight mb-1">
                Demo anfragen
              </h3>
              <p className="text-xs text-muted-foreground mb-8">
                Wir melden uns innerhalb eines Werktags.
              </p>

              <form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Vorname" id="fn" placeholder="Max" />
                  <Field label="Nachname" id="ln" placeholder="Mustermann" />
                </div>
                <Field label="Geschaeftliche E-Mail" id="email" type="email" placeholder="m.mustermann@firma.de" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Unternehmen" id="co" placeholder="Unternehmen GmbH" />
                  <div>
                    <label htmlFor="size" className="block text-xs font-medium text-foreground/70 mb-1.5">
                      Mitarbeiteranzahl
                    </label>
                    <select
                      id="size"
                      className="w-full h-10 px-3 rounded-lg border border-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
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
                  <label htmlFor="msg" className="block text-xs font-medium text-foreground/70 mb-1.5">
                    Nachricht (optional)
                  </label>
                  <textarea
                    id="msg"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground/30 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all resize-none"
                    placeholder="Wie koennen wir helfen?"
                  />
                </div>
                <Button className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 rounded-lg text-sm font-medium group">
                  Demo anfragen
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
                <p className="text-[10px] text-muted-foreground/25 text-center">
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

function ContactLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.15em] mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function Field({ label, id, type = "text", placeholder }: { label: string; id: string; type?: string; placeholder: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-foreground/70 mb-1.5">{label}</label>
      <input
        type={type}
        id={id}
        className="w-full h-10 px-3 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground/30 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
        placeholder={placeholder}
      />
    </div>
  );
}

export default ContactSection;
