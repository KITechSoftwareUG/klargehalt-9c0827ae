import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getAppUrl } from "@/utils/url";

const plans = [
  {
    name: "Starter",
    audience: "Bis 50 Mitarbeiter",
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
    highlight: false,
  },
  {
    name: "Business",
    audience: "Bis 250 Mitarbeiter",
    price: "499",
    period: "/mo",
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
    highlight: true,
  },
  {
    name: "Enterprise",
    audience: "Unbegrenzt",
    price: "Individuell",
    period: "",
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
    highlight: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-32 lg:py-44 relative">
      {/* Divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        {/* Header — left aligned, taste-skill */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20 lg:mb-28">
          <div>
            <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-4">
              Preise
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-none">
              Transparente Preise
              <br />
              fuer sensible Software
            </h2>
          </div>
          <div className="flex items-end">
            <p className="text-base text-muted-foreground leading-relaxed max-w-[45ch]">
              Keine versteckten Kosten, kein Freemium-Modell.
              Compliance-Software verdient faire, nachvollziehbare Preise.
            </p>
          </div>
        </div>

        {/* Pricing — asymmetric layout: featured plan large, others stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-0">
          {/* Starter — left */}
          <div className="lg:col-span-3 border border-border/40 rounded-2xl lg:rounded-r-none p-8 lg:p-10 flex flex-col bg-card/50">
            <PlanContent plan={plans[0]} />
          </div>

          {/* Business — center, elevated */}
          <div className="lg:col-span-6 bg-primary text-primary-foreground rounded-2xl p-8 lg:p-12 flex flex-col relative z-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)]">
            <div className="absolute -top-3 left-8">
              <span className="px-4 py-1.5 bg-accent text-accent-foreground text-xs font-semibold rounded-full tracking-wide uppercase">
                Empfohlen
              </span>
            </div>
            <PlanContent plan={plans[1]} dark />
          </div>

          {/* Enterprise — right */}
          <div className="lg:col-span-3 border border-border/40 rounded-2xl lg:rounded-l-none p-8 lg:p-10 flex flex-col bg-card/50">
            <PlanContent plan={plans[2]} />
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground/60">
            Alle Preise zzgl. MwSt. · Jaehrliche Abrechnung moeglich (2 Monate gratis)
          </p>
        </div>
      </div>
    </section>
  );
};

function PlanContent({
  plan,
  dark = false,
}: {
  plan: (typeof plans)[number];
  dark?: boolean;
}) {
  return (
    <>
      <div className="mb-8">
        <h3
          className={`text-xl font-bold mb-1 tracking-tight ${
            dark ? "text-primary-foreground" : "text-foreground"
          }`}
        >
          {plan.name}
        </h3>
        <p
          className={`text-sm ${
            dark ? "text-primary-foreground/50" : "text-muted-foreground"
          }`}
        >
          {plan.audience}
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          {plan.price !== "Individuell" && (
            <span
              className={`text-sm ${
                dark ? "text-primary-foreground/50" : "text-muted-foreground"
              }`}
            >
              EUR
            </span>
          )}
          <span
            className={`text-4xl lg:text-5xl font-bold tracking-tighter ${
              dark ? "text-primary-foreground" : "text-foreground"
            }`}
          >
            {plan.price}
          </span>
          {plan.period && (
            <span
              className={`text-sm ${
                dark ? "text-primary-foreground/40" : "text-muted-foreground/60"
              }`}
            >
              {plan.period}
            </span>
          )}
        </div>
      </div>

      <div
        className={`h-px mb-8 ${
          dark ? "bg-primary-foreground/10" : "bg-border/60"
        }`}
      />

      <ul className="space-y-3 mb-10 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check
              className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                dark ? "text-accent" : "text-status-success"
              }`}
            />
            <span
              className={`text-sm ${
                dark ? "text-primary-foreground/80" : "text-foreground/70"
              }`}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <Link href={plan.highlight ? getAppUrl("/sign-up") : "#contact"}>
        <Button
          variant={dark ? "hero" : "outline"}
          className="w-full group"
          size="lg"
        >
          {plan.cta}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </Link>
    </>
  );
}

export default PricingSection;
