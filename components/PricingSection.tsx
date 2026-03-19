import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getAppUrl } from "@/utils/url";

const plans = [
  {
    name: "Starter",
    description: "Fuer kleine Unternehmen bis 50 Mitarbeiter",
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
    featured: false,
  },
  {
    name: "Business",
    description: "Fuer wachsende Unternehmen bis 250 Mitarbeiter",
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
    featured: true,
  },
  {
    name: "Enterprise",
    description: "Fuer Konzerne mit individuellen Anforderungen",
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
    featured: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-28 lg:py-36">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="max-w-xl mb-16 lg:mb-20">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-accent mb-3">
            Preise
          </p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground tracking-tight leading-tight">
            Transparente Preise fuer transparente Software.
          </h2>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 lg:p-10 flex flex-col ${
                plan.featured
                  ? "bg-foreground text-background ring-1 ring-foreground lg:-my-3"
                  : "bg-white border border-border/60"
              }`}
            >
              {plan.featured && (
                <span className="self-start px-2.5 py-1 bg-accent text-white text-[10px] font-semibold rounded-md mb-6 uppercase tracking-wider">
                  Empfohlen
                </span>
              )}

              <h3 className={`text-lg font-semibold tracking-tight mb-1 ${plan.featured ? "text-background" : "text-foreground"}`}>
                {plan.name}
              </h3>
              <p className={`text-xs mb-6 ${plan.featured ? "text-background/35" : "text-muted-foreground"}`}>
                {plan.description}
              </p>

              <div className="flex items-baseline gap-1 mb-8">
                {plan.price !== "Individuell" && (
                  <span className={`text-xs ${plan.featured ? "text-background/35" : "text-muted-foreground"}`}>EUR</span>
                )}
                <span className={`text-3xl font-semibold tracking-tighter ${plan.featured ? "text-background" : "text-foreground"}`}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span className={`text-xs ${plan.featured ? "text-background/25" : "text-muted-foreground/50"}`}>{plan.period}</span>
                )}
              </div>

              <div className={`h-px mb-8 ${plan.featured ? "bg-background/8" : "bg-border/50"}`} />

              <ul className="space-y-2.5 mb-10 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${plan.featured ? "text-accent" : "text-foreground/25"}`} />
                    <span className={`text-sm ${plan.featured ? "text-background/60" : "text-foreground/50"}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.featured ? getAppUrl(plan.href) : plan.href}>
                <Button
                  className={`w-full h-11 rounded-lg text-sm font-medium group ${
                    plan.featured
                      ? "bg-white text-foreground hover:bg-white/90"
                      : "bg-foreground/[0.04] text-foreground hover:bg-foreground/[0.08] border-0"
                  }`}
                  variant={plan.featured ? "default" : "ghost"}
                >
                  {plan.cta}
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground/30 text-center mt-8">
          Alle Preise zzgl. MwSt. Jaehrliche Abrechnung moeglich.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
