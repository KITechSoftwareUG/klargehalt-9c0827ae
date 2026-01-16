import { 
  Shield, 
  Users, 
  FileText, 
  Lock, 
  BarChart3, 
  FileCheck,
  Eye,
  History
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Users,
      title: "Rollenbasiertes Zugriffsmodell",
      description: "Striktes RBAC mit Admin, HR-Manager, Legal, Mitarbeiter und externen Prüfern. Niemand sieht mehr als erlaubt.",
      status: "success" as const,
    },
    {
      icon: Lock,
      title: "Verschlüsselte Gehaltsdaten",
      description: "AES-256 Verschlüsselung aller sensiblen Daten. Feldweise Verschlüsselung für maximale Sicherheit.",
      status: "success" as const,
    },
    {
      icon: BarChart3,
      title: "Automatische Berechnungen",
      description: "Median-Berechnung, Gender-Pay-Gap-Analyse und Abweichungsmarker – vollautomatisch und EU-konform.",
      status: "success" as const,
    },
    {
      icon: FileText,
      title: "Mitarbeiter-Auskunft",
      description: "Rechtssichere Auskunftsanfragen mit versionierter Dokumentation. Nur anonymisierte Vergleichswerte.",
      status: "success" as const,
    },
    {
      icon: History,
      title: "Immutable Audit-Logs",
      description: "Wer hat wann was geändert? Lückenlose Protokollierung mit Hash-Signatur für Behörden und Prüfer.",
      status: "success" as const,
    },
    {
      icon: FileCheck,
      title: "Beweissichere Exporte",
      description: "PDF und CSV Exporte mit Zeitstempel und Hash-Signatur. Auf Knopfdruck beweisfähig.",
      status: "success" as const,
    },
    {
      icon: Shield,
      title: "DSGVO-Konformität",
      description: "Mandantenfähigkeit, Row Level Security, EU-Hosting only. Art. 15/17 DSGVO vollständig abgedeckt.",
      status: "success" as const,
    },
    {
      icon: Eye,
      title: "Minimal-Transparenz",
      description: "Mitarbeiter sehen nur eigene Gruppe und statistische Werte. Keine Einzelgehälter, keine Vergleiche.",
      status: "success" as const,
    },
  ];

  return (
    <section id="features" className="py-24 lg:py-32 bg-background relative">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
            Funktionen
          </span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-6 tracking-tight">
            Alles für Ihre Compliance
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            EntgeltGuard vereint alle Werkzeuge, die Sie für die rechtssichere Umsetzung 
            der EU-Entgelttransparenzrichtlinie benötigen – in einer Plattform.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-6 bg-card rounded-2xl border border-border hover:border-accent/30 hover:shadow-elegant transition-all duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                <feature.icon className="w-6 h-6 text-accent" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Status Indicator */}
              <div className="mt-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-success" />
                <span className="text-xs font-medium text-status-success">
                  Implementiert
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-6">
            Haben Sie spezifische Anforderungen?
          </p>
          <a 
            href="#contact" 
            className="inline-flex items-center gap-2 text-accent font-semibold hover:underline underline-offset-4"
          >
            Sprechen Sie mit unseren Experten
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
