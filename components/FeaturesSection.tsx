import { BarChart3, Users, Lock, FileCheck, Eye, Shield } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Pay-Gap Analyse",
    description:
      "Automatische Median-Berechnung, Abweichungsmarker und EU-konforme Auswertungen. Kein manuelles Rechnen.",
  },
  {
    icon: Users,
    title: "Rollenbasierte Zugriffe",
    description:
      "Admin, HR-Manager, Mitarbeiter — jede Rolle sieht exakt das, was sie sehen darf. Row Level Security auf Datenbankebene.",
  },
  {
    icon: Lock,
    title: "AES-256 Verschluesselung",
    description:
      "Gehaltsdaten werden feldweise verschluesselt gespeichert. Selbst bei einem Breach bleiben Daten unlesbar.",
  },
  {
    icon: FileCheck,
    title: "Immutable Audit-Logs",
    description:
      "Wer hat wann was geaendert — lueckenlos protokolliert, hash-signiert und beweissicher exportierbar.",
  },
  {
    icon: Eye,
    title: "Datenschutz-konforme Auskunft",
    description:
      "Mitarbeiter sehen nur Gruppenstatistiken. Keine Einzelgehaelter, keine direkten Vergleiche.",
  },
  {
    icon: Shield,
    title: "EU-only Infrastruktur",
    description:
      "Frankfurt-basiertes Hosting. ISO 27001 zertifiziert. Ihre Daten verlassen nie die EU.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-28 lg:py-36 bg-muted/30">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="max-w-xl mb-16 lg:mb-20">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-accent mb-3">
            Plattform
          </p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground tracking-tight leading-tight">
            Alles, was Sie fuer die Entgelttransparenz brauchen.
          </h2>
        </div>

        {/* 2x3 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 lg:gap-y-16">
          {features.map((f) => (
            <div key={f.title} className="group">
              <div className="w-9 h-9 rounded-lg bg-foreground/[0.04] flex items-center justify-center mb-4 group-hover:bg-accent/[0.08] transition-colors">
                <f.icon className="w-[18px] h-[18px] text-foreground/40 group-hover:text-accent transition-colors" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2 tracking-tight">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[38ch]">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
