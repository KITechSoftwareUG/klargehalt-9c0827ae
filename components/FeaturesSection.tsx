"use client";

import {
  Shield,
  Users,
  FileText,
  Lock,
  BarChart3,
  FileCheck,
  Eye,
  History,
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Users,
      title: "Rollenbasiertes Zugriffsmodell",
      description:
        "Striktes RBAC mit Admin, HR-Manager und Mitarbeiter. Niemand sieht mehr als erlaubt.",
    },
    {
      icon: Lock,
      title: "Verschluesselte Gehaltsdaten",
      description:
        "AES-256 Verschluesselung aller sensiblen Daten. Feldweise Verschluesselung fuer maximale Sicherheit.",
    },
    {
      icon: BarChart3,
      title: "Automatische Berechnungen",
      description:
        "Median-Berechnung, Gender-Pay-Gap-Analyse und Abweichungsmarker – vollautomatisch und EU-konform.",
    },
    {
      icon: FileText,
      title: "Mitarbeiter-Auskunft",
      description:
        "Rechtssichere Auskunftsanfragen mit versionierter Dokumentation. Nur anonymisierte Vergleichswerte.",
    },
    {
      icon: History,
      title: "Immutable Audit-Logs",
      description:
        "Wer hat wann was geaendert? Lueckenlose Protokollierung mit Hash-Signatur fuer Behoerden und Pruefer.",
    },
    {
      icon: FileCheck,
      title: "Beweissichere Exporte",
      description:
        "PDF und CSV Exporte mit Zeitstempel und Hash-Signatur. Auf Knopfdruck beweisfaehig.",
    },
    {
      icon: Shield,
      title: "DSGVO-Konformitaet",
      description:
        "Mandantenfaehigkeit, Row Level Security, EU-Hosting only. Art. 15/17 DSGVO vollstaendig abgedeckt.",
    },
    {
      icon: Eye,
      title: "Minimal-Transparenz",
      description:
        "Mitarbeiter sehen nur eigene Gruppe und statistische Werte. Keine Einzelgehaelter, keine Vergleiche.",
    },
  ];

  // Split into two rows for desktop
  const topRow = features.slice(0, 4);
  const bottomRow = features.slice(4);

  return (
    <section id="features" className="py-24 lg:py-36 bg-background relative">
      {/* Subtle horizontal line accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-16 lg:mb-24">
          <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-4">
            Funktionen
          </p>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-6 tracking-tight leading-tight">
            Alles fuer Ihre
            <br />
            Compliance
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            KlarGehalt vereint alle Werkzeuge, die Sie fuer die rechtssichere
            Umsetzung der EU-Entgelttransparenzrichtlinie benoetigen.
          </p>
        </div>

        {/* Features Grid — 2 rows of 4 */}
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topRow.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bottomRow.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index + 4} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

function FeatureCard({
  feature,
  index,
}: {
  feature: { icon: React.ElementType; title: string; description: string };
  index: number;
}) {
  return (
    <div
      className="group relative p-6 lg:p-8 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm hover:border-accent/30 hover:bg-card transition-all duration-500"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Number */}
      <span className="absolute top-6 right-6 lg:top-8 lg:right-8 text-xs font-mono text-muted-foreground/40">
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-accent/8 flex items-center justify-center mb-6 group-hover:bg-accent/15 transition-colors duration-300">
        <feature.icon className="w-5 h-5 text-accent" />
      </div>

      {/* Content */}
      <h3 className="text-base font-semibold text-foreground mb-2 tracking-tight">
        {feature.title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {feature.description}
      </p>

      {/* Bottom accent line on hover */}
      <div className="absolute bottom-0 left-6 right-6 lg:left-8 lg:right-8 h-px bg-accent/0 group-hover:bg-accent/20 transition-colors duration-500" />
    </div>
  );
}

export default FeaturesSection;
