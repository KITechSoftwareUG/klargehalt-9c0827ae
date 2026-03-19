import { Shield, Server, Lock, Key, FileCheck, Globe } from "lucide-react";

const layers = [
  { icon: Lock, label: "AES-256", desc: "Feldweise Verschluesselung at rest und in transit" },
  { icon: Server, label: "Frankfurt", desc: "EU-only Hosting, kein US Cloud Act" },
  { icon: Key, label: "2FA + SSO", desc: "Verpflichtende Zwei-Faktor-Authentifizierung" },
  { icon: Shield, label: "RLS", desc: "Row Level Security — Mandantentrennung auf DB-Ebene" },
  { icon: FileCheck, label: "Art. 15/17", desc: "Automatisierte Auskunft und Loeschung" },
  { icon: Globe, label: "Auto-Timeout", desc: "Inaktive Sessions werden beendet und geloggt" },
];

const SecuritySection = () => {
  return (
    <section id="security" className="relative overflow-hidden">
      {/* Dark band */}
      <div className="bg-foreground text-background py-32 lg:py-40">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          {/* Header — asymmetric 7/5 split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-20 lg:mb-28">
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-4">
                Sicherheit
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter leading-none text-background">
                Gehaltsdaten gehoeren
                <br />
                zu den sensibelsten
                <br />
                Daten eines Unternehmens.
              </h2>
            </div>
            <div className="lg:col-span-5 flex items-end">
              <div className="space-y-6">
                <p className="text-sm text-background/50 leading-relaxed max-w-[40ch]">
                  Jede Schicht unserer Infrastruktur ist darauf ausgelegt,
                  diese Daten zu schuetzen — nicht als Feature, sondern als Grundprinzip.
                </p>
                {/* Certifications inline */}
                <div className="flex flex-wrap gap-3">
                  {["ISO 27001", "SOC 2", "DSGVO"].map((c) => (
                    <span
                      key={c}
                      className="px-3 py-1.5 border border-background/10 rounded-lg text-xs font-medium text-background/40"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Security layers — 3x2 grid with dividers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-background/[0.06] rounded-xl overflow-hidden">
            {layers.map((l) => (
              <div
                key={l.label}
                className="bg-foreground p-8 lg:p-10 hover:bg-background/[0.03] transition-colors duration-500"
              >
                <l.icon className="w-5 h-5 text-accent mb-5" />
                <p className="text-lg font-bold text-background tracking-tight mb-1.5">
                  {l.label}
                </p>
                <p className="text-sm text-background/35 leading-relaxed max-w-[30ch]">
                  {l.desc}
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
