import { Shield, Server, Lock, Key, FileCheck, Globe } from "lucide-react";

const SecuritySection = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: "End-to-End Verschlüsselung",
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
      description: "Optional verpflichtende Zwei-Faktor-Authentifizierung",
    },
    {
      icon: Shield,
      title: "Row Level Security",
      description: "Strikte Mandantentrennung auf Datenbankebene",
    },
    {
      icon: FileCheck,
      title: "DSGVO Art. 15/17",
      description: "Auskunft & Löschung vollautomatisiert",
    },
    {
      icon: Globe,
      title: "Session Management",
      description: "Automatische Timeouts & IP-Logging",
    },
  ];

  return (
    <section id="security" className="py-24 lg:py-32 bg-primary relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container relative mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm font-semibold mb-4">
                Sicherheit
              </span>
              <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-primary-foreground mb-6 tracking-tight">
                Ihre Daten sind bei uns sicher
              </h2>
              <p className="text-lg text-primary-foreground/70 leading-relaxed">
                Gehaltsdaten gehören zu den sensibelsten Informationen eines Unternehmens. 
                Deshalb setzen wir auf mehrschichtige Sicherheit ohne Kompromisse.
              </p>
            </div>

            {/* Certifications */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary-foreground/10 rounded-lg">
                <Shield className="w-4 h-4 text-primary-foreground" />
                <span className="text-sm font-medium text-primary-foreground">ISO 27001</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-primary-foreground/10 rounded-lg">
                <Shield className="w-4 h-4 text-primary-foreground" />
                <span className="text-sm font-medium text-primary-foreground">DSGVO</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-primary-foreground/10 rounded-lg">
                <Shield className="w-4 h-4 text-primary-foreground" />
                <span className="text-sm font-medium text-primary-foreground">SOC 2</span>
              </div>
            </div>
          </div>

          {/* Right - Security Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {securityFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className="p-5 bg-primary-foreground/5 backdrop-blur-sm rounded-xl border border-primary-foreground/10 hover:bg-primary-foreground/10 transition-colors"
              >
                <feature.icon className="w-8 h-8 text-accent mb-4" />
                <h3 className="font-semibold text-primary-foreground mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-primary-foreground/60">
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
