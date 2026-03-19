"use client";

import {
  Shield,
  Users,
  Lock,
  BarChart3,
  FileCheck,
  Eye,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    label: "Analyse",
    title: "Gender-Pay-Gap auf Knopfdruck",
    description:
      "Median-Berechnung, Abweichungsmarker und EU-konforme Auswertungen. Vollautomatisch, ohne manuelles Rechnen.",
    detail: "EU-Richtlinie 2023/970 konform",
  },
  {
    icon: Users,
    label: "Zugriff",
    title: "Rollenbasierte Kontrolle",
    description:
      "Admin, HR-Manager, Mitarbeiter — jede Rolle sieht exakt das, was sie sehen darf. Nicht mehr, nicht weniger.",
    detail: "Row Level Security auf DB-Ebene",
  },
  {
    icon: Lock,
    label: "Verschluesselung",
    title: "AES-256 fuer jedes Feld",
    description:
      "Gehaltsdaten werden feldweise verschluesselt gespeichert. Selbst bei einem Breach bleiben die Daten unlesbar.",
    detail: "Ende-zu-Ende, TLS 1.3 in transit",
  },
  {
    icon: FileCheck,
    label: "Audit",
    title: "Lueckenlose Protokollierung",
    description:
      "Immutable Audit-Logs mit Hash-Signatur. Wer hat wann was geaendert — beweissicher fuer Behoerden und Pruefer.",
    detail: "PDF/CSV Export mit Zeitstempel",
  },
  {
    icon: Eye,
    label: "Transparenz",
    title: "Minimal-Auskunft, maximal compliant",
    description:
      "Mitarbeiter sehen nur Gruppenstatistiken. Keine Einzelgehaelter, keine direkten Vergleiche — DSGVO-konform.",
    detail: "Art. 15/17 DSGVO abgedeckt",
  },
  {
    icon: Shield,
    label: "Hosting",
    title: "EU-only, keine Kompromisse",
    description:
      "Ihre Daten verlassen nie die EU. Frankfurt-basiertes Hosting, ISO 27001 zertifiziert, SOC 2 geprueft.",
    detail: "Mandantentrennung auf Datenbankebene",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-32 lg:py-44 relative">
      {/* Subtle divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        {/* Section header — left aligned, taste-skill ANTI-CENTER BIAS */}
        <div className="max-w-xl mb-20 lg:mb-28">
          <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-4">
            Was KlarGehalt kann
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-none mb-6">
            Compliance ohne
            <br />
            Kompromisse
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-[50ch]">
            Sechs Kernmodule, die zusammen eine lueckenlose
            Entgelttransparenz-Loesung ergeben.
          </p>
        </div>

        {/* Zig-Zag feature blocks — taste-skill ANTI 3-COL CARD */}
        <div className="space-y-24 lg:space-y-32">
          {features.map((feature, i) => {
            const isEven = i % 2 === 0;
            return (
              <div
                key={feature.title}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-start ${
                  isEven ? "" : "lg:direction-rtl"
                }`}
                style={{
                  animationDelay: `${i * 80}ms`,
                }}
              >
                {/* Text side */}
                <div
                  className={`space-y-5 ${isEven ? "lg:order-1" : "lg:order-2"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                      {feature.label}
                    </span>
                  </div>

                  <h3 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight leading-tight">
                    {feature.title}
                  </h3>

                  <p className="text-base text-muted-foreground leading-relaxed max-w-[50ch]">
                    {feature.description}
                  </p>

                  <div className="pt-2">
                    <span className="inline-flex items-center gap-2 text-sm text-foreground/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                      {feature.detail}
                    </span>
                  </div>
                </div>

                {/* Visual side — abstract representation */}
                <div
                  className={`${isEven ? "lg:order-2" : "lg:order-1"}`}
                >
                  <div className="relative aspect-[4/3] rounded-2xl bg-card border border-border/40 overflow-hidden group">
                    {/* Abstract grid pattern representing the feature */}
                    <div className="absolute inset-0 p-8 flex flex-col justify-between">
                      {/* Decorative bars — echoing the video Balken motif */}
                      {Array.from({ length: 5 }).map((_, j) => (
                        <div
                          key={j}
                          className="h-2 rounded-full bg-accent/[0.06] group-hover:bg-accent/[0.12] transition-colors duration-700"
                          style={{
                            width: `${55 + Math.sin(i * 2.1 + j * 1.3) * 30}%`,
                            marginLeft: isEven
                              ? "0"
                              : `${15 + Math.cos(i + j) * 10}%`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Large feature number */}
                    <div className="absolute bottom-6 right-8 text-[120px] font-bold leading-none text-foreground/[0.03] select-none">
                      {String(i + 1).padStart(2, "0")}
                    </div>

                    {/* Icon watermark */}
                    <div className="absolute top-8 right-8">
                      <feature.icon className="w-8 h-8 text-accent/20" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
