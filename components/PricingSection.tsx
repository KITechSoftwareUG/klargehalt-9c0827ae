import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

const PricingSection = () => {
  const plans = [
    {
      name: "Starter",
      description: "Kleine Unternehmen",
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
      description: "Mittlere Unternehmen",
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
      description: "Grossunternehmen",
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
        "Externe Pruefer-Zugaenge",
        "White-Label Option",
      ],
      cta: "Kontakt aufnehmen",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 lg:py-36 bg-background relative">
      {/* Subtle top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header — left aligned */}
        <div className="max-w-2xl mb-16 lg:mb-24">
          <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-4">
            Preise
          </p>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-6 tracking-tight leading-tight">
            Transparente Preise
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Keine versteckten Kosten. Faire Preise fuer sensible
            Compliance-Software.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-0">
          {plans.map((plan, idx) => (
            <div
              key={plan.name}
              className={`relative flex flex-col p-8 lg:p-10 transition-all duration-300 ${
                plan.popular
                  ? "bg-primary text-primary-foreground rounded-2xl shadow-xl lg:scale-[1.03] lg:-mx-1 z-10"
                  : `bg-card border border-border/60 hover:border-border ${
                      idx === 0 ? "rounded-2xl lg:rounded-r-none" : "rounded-2xl lg:rounded-l-none"
                    }`
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 bg-accent text-accent-foreground text-xs font-semibold rounded-full shadow-lg tracking-wide uppercase">
                    Empfohlen
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-8">
                <h3
                  className={`text-lg font-bold mb-1 ${
                    plan.popular ? "text-primary-foreground" : "text-foreground"
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm ${
                    plan.popular
                      ? "text-primary-foreground/60"
                      : "text-muted-foreground"
                  }`}
                >
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  {plan.price !== "Individuell" && (
                    <span
                      className={`text-sm ${
                        plan.popular
                          ? "text-primary-foreground/60"
                          : "text-muted-foreground"
                      }`}
                    >
                      €
                    </span>
                  )}
                  <span
                    className={`text-4xl font-bold tracking-tight ${
                      plan.popular
                        ? "text-primary-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm ${
                      plan.popular
                        ? "text-primary-foreground/60"
                        : "text-muted-foreground"
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>
                <p
                  className={`text-sm mt-1 ${
                    plan.popular
                      ? "text-primary-foreground/50"
                      : "text-muted-foreground"
                  }`}
                >
                  {plan.employees}
                </p>
              </div>

              {/* Divider */}
              <div
                className={`h-px mb-8 ${
                  plan.popular
                    ? "bg-primary-foreground/10"
                    : "bg-border/60"
                }`}
              />

              {/* Features */}
              <ul className="space-y-3 mb-10 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        plan.popular ? "text-accent" : "text-status-success"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        plan.popular
                          ? "text-primary-foreground/85"
                          : "text-foreground/80"
                      }`}
                    >
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
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground/70">
            Alle Preise zzgl. MwSt. · Jaehrliche Abrechnung moeglich (2 Monate
            gratis)
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
