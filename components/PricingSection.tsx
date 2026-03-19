import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getAppUrl } from "@/utils/url";

const plans = [
  {
    name: "Starter",
    desc: "Bis 50 Mitarbeiter",
    price: "199",
    period: "/mo",
    features: ["Gehaltsstruktur-Verwaltung", "Mitarbeiter-Auskunftsportal", "Basis Audit-Trail", "E-Mail Support", "1 Admin-Nutzer"],
    cta: "Demo anfragen",
    href: "#contact",
    featured: false,
  },
  {
    name: "Business",
    desc: "Bis 250 Mitarbeiter",
    price: "499",
    period: "/mo",
    features: ["Alles aus Starter", "Gender-Pay-Gap Berichte", "Erweiterter Audit-Trail", "Priority Support", "5 Admin-Nutzer", "SSO Integration", "Export fuer Pruefer"],
    cta: "Demo anfragen",
    href: "/sign-up",
    featured: true,
  },
  {
    name: "Enterprise",
    desc: "Ab 250 Mitarbeiter",
    price: "Auf Anfrage",
    period: "",
    features: ["Alles aus Business", "Dedizierter Ansprechpartner", "Custom Integrationen", "Unbegrenzte Nutzer", "Pruefer-Zugaenge", "SLA"],
    cta: "Kontakt aufnehmen",
    href: "#contact",
    featured: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl mb-14 lg:mb-20">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1E293B] tracking-tight leading-tight mb-4">
            Klare Preise. Keine Ueberraschungen.
          </h2>
          <p className="text-base text-slate-500 leading-relaxed">
            Compliance-Software sollte selbst transparent sein.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-7 lg:p-9 flex flex-col ${
                p.featured
                  ? "bg-[#1E293B] text-white ring-1 ring-[#1E293B] shadow-[0_8px_32px_rgba(30,41,59,0.18)] lg:-my-3"
                  : "bg-white border border-slate-200"
              }`}
            >
              {p.featured && (
                <span className="self-start px-2.5 py-1 bg-white/10 text-white text-[10px] font-bold rounded-md mb-5 uppercase tracking-wider">
                  Beliebteste Wahl
                </span>
              )}
              <h3 className={`text-lg font-bold tracking-tight mb-1 ${p.featured ? "text-white" : "text-[#1E293B]"}`}>{p.name}</h3>
              <p className={`text-xs mb-6 text-slate-400`}>{p.desc}</p>

              <div className="flex items-baseline gap-1 mb-7">
                {p.price !== "Auf Anfrage" && <span className="text-xs text-slate-400">EUR</span>}
                <span className={`text-3xl font-extrabold tracking-tight ${p.featured ? "text-white" : "text-[#1E293B]"}`}>{p.price}</span>
                {p.period && <span className="text-xs text-slate-400">{p.period}</span>}
              </div>

              <div className={`h-px mb-7 ${p.featured ? "bg-white/10" : "bg-slate-100"}`} />

              <ul className="space-y-2.5 mb-9 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${p.featured ? "text-white/40" : "text-slate-300"}`} />
                    <span className={`text-sm ${p.featured ? "text-slate-300" : "text-slate-500"}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link href={p.featured ? getAppUrl(p.href) : p.href}>
                <Button
                  className={`w-full h-11 rounded-lg text-sm font-semibold group cursor-pointer ${
                    p.featured
                      ? "bg-white text-[#1E293B] hover:bg-slate-100"
                      : "bg-slate-50 text-[#1E293B] hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {p.cta}
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-300 text-center mt-8">Alle Preise zzgl. MwSt. Jaehrliche Abrechnung moeglich.</p>
      </div>
    </section>
  );
};

export default PricingSection;
