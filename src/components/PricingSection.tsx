import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

const PricingSection = () => {
  const plans = [
    {
      name: "Starter",
      description: "Für kleine Unternehmen",
      price: "199",
      period: "/ Monat",
      employees: "bis 50 Mitarbeiter",
      features: [
        "Entgeltstruktur-Management",
        "Mitarbeiter-Auskunftsportal",
        "Basis Audit-Logs",
        "E-Mail Support",
        "1 Admin-Nutzer",
      ],
      cta: "Jetzt starten",
      popular: false,
    },
    {
      name: "Business",
      description: "Für mittlere Unternehmen",
      price: "499",
      period: "/ Monat",
      employees: "bis 250 Mitarbeiter",
      features: [
        "Alles aus Starter",
        "Gender-Pay-Gap-Analyse",
        "Erweiterte Audit-Logs",
        "Priority Support",
        "5 Admin-Nutzer",
        "SSO Integration",
        "Beweissichere Exporte",
      ],
      cta: "Demo anfragen",
      popular: true,
    },
    {
      name: "Enterprise",
      description: "Für Großunternehmen",
      price: "Individuell",
      period: "",
      employees: "unbegrenzt",
      features: [
        "Alles aus Business",
        "Dedicated Account Manager",
        "Custom Integrationen",
        "On-Premise Option",
        "SLA 99.9%",
        "Unbegrenzte Nutzer",
        "Externe Prüfer-Zugänge",
        "White-Label Option",
      ],
      cta: "Kontakt aufnehmen",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 lg:py-32 bg-secondary/30 relative">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
            Preise
          </span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-6 tracking-tight">
            Transparente Preise für Ihr Unternehmen
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Keine versteckten Kosten. Kein Freemium. Wir bieten faire Preise für sensible Compliance-Software.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-8 rounded-2xl transition-all duration-300 ${
                plan.popular
                  ? "bg-primary text-primary-foreground shadow-xl scale-105"
                  : "bg-card border border-border hover:border-accent/30 hover:shadow-elegant"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 bg-accent text-accent-foreground text-sm font-semibold rounded-full shadow-lg">
                    Empfohlen
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-8">
                <h3 className={`text-xl font-bold mb-2 ${plan.popular ? "text-primary-foreground" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  {plan.price !== "Individuell" && (
                    <span className={`text-sm ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>€</span>
                  )}
                  <span className={`text-4xl font-bold ${plan.popular ? "text-primary-foreground" : "text-foreground"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {plan.employees}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? "text-accent" : "text-status-success"}`} />
                    <span className={`text-sm ${plan.popular ? "text-primary-foreground/90" : "text-foreground"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant={plan.popular ? "hero" : "outline"}
                className="w-full group"
                size="lg"
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Alle Preise zzgl. MwSt. • Setup-Fee auf Anfrage • Jährliche Abrechnung möglich (2 Monate gratis)
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
