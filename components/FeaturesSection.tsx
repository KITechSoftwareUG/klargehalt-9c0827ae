import { BarChart3, Users, Lock, FileCheck, Eye, Shield } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Pay-Gap Analyse",
    description: "Automatische Median-Berechnung und Abweichungsmarker. EU-konforme Auswertungen auf Knopfdruck.",
  },
  {
    icon: Users,
    title: "Rollenbasierte Zugriffe",
    description: "Admin, HR-Manager, Mitarbeiter — jede Rolle sieht exakt das, was sie sehen darf. RLS auf Datenbankebene.",
  },
  {
    icon: Lock,
    title: "AES-256 Verschluesselung",
    description: "Gehaltsdaten werden feldweise verschluesselt. Selbst bei einem Breach bleiben Daten unlesbar.",
  },
  {
    icon: FileCheck,
    title: "Immutable Audit-Logs",
    description: "Wer hat wann was geaendert — lueckenlos protokolliert, hash-signiert und beweissicher exportierbar.",
  },
  {
    icon: Eye,
    title: "Datenschutz-konforme Auskunft",
    description: "Mitarbeiter sehen nur Gruppenstatistiken. Keine Einzelgehaelter. Art. 15/17 DSGVO abgedeckt.",
  },
  {
    icon: Shield,
    title: "EU-only Infrastruktur",
    description: "Frankfurt-basiertes Hosting. ISO 27001 zertifiziert. Ihre Daten verlassen nie die EU.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="max-w-2xl mb-14 lg:mb-20">
          <p className="text-xs font-semibold text-[#2563EB] uppercase tracking-[0.2em] mb-3">
            Funktionen
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1E293B] tracking-tight leading-tight mb-4">
            Alles, was Sie fuer die Entgelttransparenz brauchen.
          </h2>
          <p className="text-base text-slate-500 leading-relaxed">
            Sechs Kernmodule, die zusammen die komplette EU-Richtlinie 2023/970 abdecken.
          </p>
        </div>

        {/* 2x3 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 lg:gap-y-14">
          {features.map((f) => (
            <div key={f.title} className="group">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB]/[0.07] flex items-center justify-center mb-4 group-hover:bg-[#2563EB]/[0.12] transition-colors duration-200">
                <f.icon className="w-5 h-5 text-[#2563EB]" />
              </div>
              <h3 className="text-base font-bold text-[#1E293B] mb-2 tracking-tight">
                {f.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
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
