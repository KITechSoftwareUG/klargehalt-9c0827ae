import { Shield, Server, Lock, Key, FileCheck, Globe } from "lucide-react";

const certifications = [
  { name: "ISO 27001", desc: "Informationssicherheit" },
  { name: "DSGVO", desc: "Datenschutz-Grundverordnung" },
  { name: "SOC 2 Type II", desc: "Sicherheitsaudit" },
];

const securityLayers = [
  {
    icon: Lock,
    title: "Verschluesselung",
    stat: "AES-256",
    description: "At rest und in transit. Feldweise Verschluesselung fuer Gehaltsdaten.",
  },
  {
    icon: Server,
    title: "EU-Hosting",
    stat: "Frankfurt",
    description: "Daten verlassen nie die EU. Kein US Cloud Act Risiko.",
  },
  {
    icon: Key,
    title: "Authentifizierung",
    stat: "2FA + SSO",
    description: "Verpflichtende Zwei-Faktor-Authentifizierung fuer alle Nutzer.",
  },
  {
    icon: Shield,
    title: "Mandantentrennung",
    stat: "RLS",
    description: "Row Level Security auf PostgreSQL-Ebene. Kein Tenant sieht fremde Daten.",
  },
  {
    icon: FileCheck,
    title: "Datenschutzrechte",
    stat: "Art. 15/17",
    description: "Auskunft und Loeschung vollautomatisiert. Compliance auf Knopfdruck.",
  },
  {
    icon: Globe,
    title: "Session-Kontrolle",
    stat: "Auto-Timeout",
    description: "Inaktive Sessions werden beendet. Jeder Zugriff wird protokolliert.",
  },
];

const SecuritySection = () => {
  return (
    <section id="security" className="py-32 lg:py-44 bg-primary relative overflow-hidden">
      {/* Decorative horizontal lines — Balken motif */}
      <div className="absolute inset-0 pointer-events-none">
        {[12, 28, 45, 62, 78, 91].map((top, i) => (
          <div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-primary-foreground/[0.04] to-transparent"
            style={{
              top: `${top}%`,
              left: i % 2 === 0 ? "0" : "20%",
              right: i % 2 === 0 ? "30%" : "0",
            }}
          />
        ))}
      </div>

      <div className="max-w-[1400px] relative mx-auto px-4 lg:px-8">
        {/* Top: Header + Certifications side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 lg:gap-20 mb-24 lg:mb-32">
          <div className="lg:col-span-3">
            <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-4">
              Sicherheitsarchitektur
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground tracking-tight leading-none mb-6">
              Mehrschichtige Sicherheit,
              <br />
              keine Kompromisse
            </h2>
            <p className="text-base text-primary-foreground/50 leading-relaxed max-w-[55ch]">
              Gehaltsdaten gehoeren zu den sensibelsten Informationen eines
              Unternehmens. Jede Schicht unserer Infrastruktur ist darauf
              ausgelegt, diese Daten zu schuetzen.
            </p>
          </div>

          {/* Certifications — stacked vertically */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {certifications.map((cert) => (
              <div
                key={cert.name}
                className="flex items-center gap-4 p-5 rounded-xl border border-primary-foreground/[0.06] bg-primary-foreground/[0.02]"
              >
                <Shield className="w-5 h-5 text-accent flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-primary-foreground">
                    {cert.name}
                  </p>
                  <p className="text-xs text-primary-foreground/40">
                    {cert.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Security layers — asymmetric 2-col grid (taste-skill) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-primary-foreground/[0.06] rounded-2xl overflow-hidden">
          {securityLayers.map((layer) => (
            <div
              key={layer.title}
              className="bg-primary p-8 lg:p-10 group hover:bg-primary-foreground/[0.03] transition-colors duration-500"
            >
              <div className="flex items-start justify-between mb-6">
                <layer.icon className="w-6 h-6 text-accent" />
                <span className="text-2xl font-bold text-primary-foreground/20 font-mono tracking-tighter">
                  {layer.stat}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-primary-foreground mb-2 tracking-tight">
                {layer.title}
              </h3>
              <p className="text-sm text-primary-foreground/40 leading-relaxed max-w-[40ch]">
                {layer.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
