import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getAppUrl } from "@/utils/url";

const plans = [
  {
    name: "Starter",
    for: "Bis 50 Mitarbeiter",
    price: "199",
    period: "/mo",
    features: [
      "Entgeltstruktur-Management",
      "Mitarbeiter-Auskunftsportal",
      "Basis Audit-Logs",
      "E-Mail Support",
      "1 Admin-Nutzer",
    ],
    cta: "Jetzt starten",
    href: "#contact",
    highlighted: false,
  },
  {
    name: "Business",
    for: "Bis 250 Mitarbeiter",
    price: "499",
    period: "/mo",
    features: [
      "Alles aus Starter",
      "Gender-Pay-Gap Analyse",
      "Erweiterte Audit-Logs",
      "Priority Support",
      "5 Admin-Nutzer",
      "SSO Integration",
      "Beweissichere Exporte",
    ],
    cta: "Demo anfragen",
    href: "/sign-up",
    highlighted: true,
  },
  {
    name: "Enterprise",
    for: "Unbegrenzt",
    price: "Individuell",
    period: "",
    features: [
      "Alles aus Business",
      "Dedicated Account Manager",
      "Custom Integrationen",
      "On-Premise Option",
      "SLA 99.9%",
      "Unbegrenzte Nutzer",
      "Pruefer-Zugaenge",
      "White-Label",
    ],
    cta: "Kontakt aufnehmen",
    href: "#contact",
    highlighted: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-32 lg:py-40 relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mb-20 lg:mb-24">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-4">
            Preise
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tighter leading-none mb-5">
            Faire Preise fuer
            <br />
            sensible Software.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-[48ch]">
            Keine versteckten Kosten. Compliance-Software verdient
            nachvollziehbare Preise.
          </p>
        </div>

        {/* Plans — 3 cols but center one is elevated */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 lg:p-10 flex flex-col ${
                plan.highlighted
                  ? "bg-foreground text-background ring-1 ring-foreground shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] lg:-my-4"
                  : "bg-card border border-border/50"
              }`}
            >
              {plan.highlighted && (
                <span className="inline-block self-start px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full mb-6 tracking-wide">
                  Empfohlen
                </span>
              )}

              <h3
                className={`text-xl font-bold tracking-tight mb-1 ${
                  plan.highlighted ? "text-background" : "text-foreground"
                }`}
              >
                {plan.name}
              </h3>
              <p
                className={`text-sm mb-6 ${
                  plan.highlighted ? "text-background/40" : "text-muted-foreground"
                }`}
              >
                {plan.for}
              </p>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-8">
                {plan.price !== "Individuell" && (
                  <span
                    className={`text-sm ${
                      plan.highlighted ? "text-background/40" : "text-muted-foreground"
                    }`}
                  >
                    EUR
                  </span>
                )}
                <span
                  className={`text-4xl font-bold tracking-tighter ${
                    plan.highlighted ? "text-background" : "text-foreground"
                  }`}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span
                    className={`text-sm ${
                      plan.highlighted ? "text-background/30" : "text-muted-foreground/50"
                    }`}
                  >
                    {plan.period}
                  </span>
                )}
              </div>

              <div
                className={`h-px mb-8 ${
                  plan.highlighted ? "bg-background/10" : "bg-border/50"
                }`}
              />

              {/* Features */}
              <ul className="space-y-3 mb-10 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        plan.highlighted ? "text-accent" : "text-status-success"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        plan.highlighted ? "text-background/70" : "text-foreground/60"
                      }`}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={
                  plan.highlighted ? getAppUrl(plan.href) : plan.href
                }
              >
                <Button
                  variant={plan.highlighted ? "hero" : "outline"}
                  size="lg"
                  className="w-full group"
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground/40 text-center mt-10">
          Alle Preise zzgl. MwSt. Jaehrliche Abrechnung moeglich (2 Monate gratis).
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
