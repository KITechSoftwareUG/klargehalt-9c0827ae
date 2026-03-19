"use client";

import { BarChart3, Users, Lock, FileCheck, Eye, Shield } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Gender-Pay-Gap Analyse",
    description:
      "Median-Berechnung, Abweichungsmarker und EU-konforme Auswertungen — vollautomatisch, ohne Spreadsheets.",
    stat: "2023/970",
    statLabel: "EU-Richtlinie",
  },
  {
    icon: Users,
    title: "Rollenbasierte Zugriffe",
    description:
      "Admin, HR-Manager, Mitarbeiter — jede Rolle sieht exakt das, was sie sehen darf. Row Level Security auf Datenbankebene.",
    stat: "RLS",
    statLabel: "Zugriffskontrolle",
  },
  {
    icon: Lock,
    title: "AES-256 Verschluesselung",
    description:
      "Gehaltsdaten werden feldweise verschluesselt. Selbst bei einem Breach bleiben Daten unlesbar. TLS 1.3 in transit.",
    stat: "256-bit",
    statLabel: "Verschluesselung",
  },
  {
    icon: FileCheck,
    title: "Immutable Audit-Logs",
    description:
      "Wer hat wann was geaendert — lueckenlos protokolliert, hash-signiert und beweissicher fuer Behoerden exportierbar.",
    stat: "100%",
    statLabel: "Nachvollziehbar",
  },
  {
    icon: Eye,
    title: "Datenschutz-konforme Auskunft",
    description:
      "Mitarbeiter sehen nur Gruppenstatistiken. Keine Einzelgehaelter, keine direkten Vergleiche. Art. 15/17 DSGVO abgedeckt.",
    stat: "DSGVO",
    statLabel: "Konform",
  },
  {
    icon: Shield,
    title: "EU-only Hosting",
    description:
      "Frankfurt-basiert, ISO 27001 zertifiziert. Ihre Daten verlassen nie die EU. Kein US Cloud Act Risiko.",
    stat: "DE",
    statLabel: "Standort",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-32 lg:py-40 relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        {/* Header — left-aligned per taste-skill ANTI-CENTER */}
        <div className="max-w-2xl mb-20 lg:mb-28">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-4">
            Plattform
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tighter leading-none mb-5">
            Sechs Module.
            <br />
            Null Luecken.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-[52ch]">
            Jedes Modul loest ein konkretes Compliance-Problem.
            Zusammen decken sie die komplette EU-Entgelttransparenzrichtlinie ab.
          </p>
        </div>

        {/* Feature grid — 2-col asymmetric, NOT 3-col cards (taste-skill) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/50 rounded-2xl overflow-hidden">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="bg-background p-8 lg:p-12 group hover:bg-card transition-colors duration-500 relative"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Top row: icon + stat */}
              <div className="flex items-start justify-between mb-8">
                <div className="w-10 h-10 rounded-xl bg-accent/[0.08] flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-accent" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground/10 tracking-tighter font-mono leading-none">
                    {f.stat}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 mt-1">
                    {f.statLabel}
                  </p>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-foreground tracking-tight mb-3">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[42ch]">
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
