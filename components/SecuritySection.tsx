import { Shield, Server, Lock, Key, FileCheck, Globe } from "lucide-react";

const SecuritySection = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: "End-to-End Verschluesselung",
      description: "AES-256 at rest, TLS 1.3 in transit",
    },
    {
      icon: Server,
      title: "EU-Hosting only",
      description: "Daten bleiben in der EU (Frankfurt)",
    },
    {
      icon: Key,
      title: "2FA & SSO",
      description: "Verpflichtende Zwei-Faktor-Authentifizierung",
    },
    {
      icon: Shield,
      title: "Row Level Security",
      description: "Strikte Mandantentrennung auf Datenbankebene",
    },
    {
      icon: FileCheck,
      title: "DSGVO Art. 15/17",
      description: "Auskunft & Loeschung vollautomatisiert",
    },
    {
      icon: Globe,
      title: "Session Management",
      description: "Automatische Timeouts & IP-Logging",
    },
  ];

  const certifications = ["ISO 27001", "DSGVO", "SOC 2"];

  return (
    <section id="security" className="py-24 lg:py-36 bg-primary relative overflow-hidden">
      {/* Decorative horizontal bars — echoing the video's Balken motif */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] -left-[10%] w-[60%] h-[1px] bg-gradient-to-r from-transparent via-primary-foreground/8 to-transparent" />
        <div className="absolute top-[35%] -right-[5%] w-[45%] h-[1px] bg-gradient-to-r from-transparent via-primary-foreground/6 to-transparent" />
        <div className="absolute bottom-[25%] -left-[8%] w-[50%] h-[1px] bg-gradient-to-r from-transparent via-primary-foreground/5 to-transparent" />
        <div className="absolute bottom-[12%] -right-[3%] w-[35%] h-[1px] bg-gradient-to-r from-transparent via-primary-foreground/4 to-transparent" />
      </div>

      <div className="container relative mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-16 lg:gap-20 items-start">
          {/* Left Content — 2 cols */}
          <div className="lg:col-span-2 space-y-10">
            <div>
              <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-4">
                Sicherheit
              </p>
              <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-primary-foreground mb-6 tracking-tight leading-tight">
                Ihre Daten
                <br />
                sind sicher
              </h2>
              <p className="text-base lg:text-lg text-primary-foreground/60 leading-relaxed">
                Gehaltsdaten gehoeren zu den sensibelsten Informationen eines
                Unternehmens. Deshalb setzen wir auf mehrschichtige Sicherheit
                ohne Kompromisse.
              </p>
            </div>

            {/* Certifications */}
            <div className="flex flex-wrap gap-3">
              {certifications.map((cert) => (
                <div
                  key={cert}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary-foreground/5 border border-primary-foreground/10 rounded-lg"
                >
                  <Shield className="w-3.5 h-3.5 text-accent" />
                  <span className="text-sm font-medium text-primary-foreground/80">
                    {cert}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Security Grid — 3 cols */}
          <div className="lg:col-span-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {securityFeatures.map((feature) => (
              <div
                key={feature.title}
                className="group p-5 lg:p-6 bg-primary-foreground/[0.03] backdrop-blur-sm rounded-xl border border-primary-foreground/[0.06] hover:bg-primary-foreground/[0.07] hover:border-primary-foreground/10 transition-all duration-300"
              >
                <feature.icon className="w-6 h-6 text-accent mb-4 group-hover:text-accent/80 transition-colors" />
                <h3 className="font-semibold text-primary-foreground text-sm mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-xs text-primary-foreground/45 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
