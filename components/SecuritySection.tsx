const stats = [
  { value: "AES-256", label: "Verschluesselung at rest und in transit" },
  { value: "99.9%", label: "SLA Verfuegbarkeit garantiert" },
  { value: "Frankfurt", label: "EU-only Hosting, kein US Cloud Act" },
  { value: "< 24h", label: "Incident Response Time" },
];

const SecuritySection = () => {
  return (
    <section id="security" className="py-28 lg:py-36 bg-foreground text-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 mb-20 lg:mb-24">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-accent mb-3">
              Sicherheit
            </p>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-background tracking-tight leading-tight">
              Ihre Gehaltsdaten verdienen den hoechsten Schutz.
            </h2>
          </div>
          <div className="flex items-end">
            <p className="text-sm text-background/40 leading-relaxed max-w-[44ch]">
              Jede Schicht unserer Infrastruktur ist auf den Schutz
              sensibler Vergutungsdaten ausgelegt. Zertifiziert nach
              ISO 27001, SOC 2 Type II und vollstaendig DSGVO-konform.
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-background/[0.06] rounded-xl overflow-hidden">
          {stats.map((s) => (
            <div key={s.value} className="bg-foreground p-8 lg:p-10">
              <p className="text-2xl lg:text-3xl font-semibold text-background tracking-tight mb-2">
                {s.value}
              </p>
              <p className="text-xs text-background/30 leading-relaxed max-w-[24ch]">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <div className="mt-12 flex flex-wrap gap-3">
          {["ISO 27001", "SOC 2 Type II", "DSGVO", "2FA + SSO", "Mandantentrennung", "Audit-Logs"].map((c) => (
            <span
              key={c}
              className="px-3 py-1.5 border border-background/[0.08] rounded-md text-xs text-background/30 font-medium"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
