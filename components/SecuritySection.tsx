const layers = [
  { value: 'AES-256', label: 'Verschlüsselung at rest und in transit' },
  { value: 'Frankfurt', label: 'EU-only Hosting, kein Transfer in Drittländer' },
  { value: '2FA + SSO', label: 'Multi-Faktor-Authentifizierung' },
  { value: 'RLS', label: 'Mandantentrennung auf Datenbankebene' },
  { value: 'Art. 15/17', label: 'DSGVO-Auskunft und Löschung' },
  { value: 'Audit-Trail', label: 'Jede Änderung protokolliert und exportierbar' },
];

const SecuritySection = () => {
  return (
    <section id="security" className="py-24 lg:py-32 bg-[#1E293B]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-16 lg:mb-20">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Gehaltsdaten sind sensibel. Wir behandeln sie auch so.
            </h2>
          </div>
          <div className="flex items-end">
            <p className="text-sm text-slate-400 leading-relaxed max-w-[46ch]">
              Verschlüsselung, Mandantentrennung, EU-Hosting.
              Kein Marketing-Sprech — das ist die technische Realität.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.06] rounded-xl overflow-hidden">
          {layers.map((l) => (
            <div
              key={l.value}
              className="bg-[#1E293B] p-7 lg:p-9 hover:bg-white/[0.03] transition-colors duration-300"
            >
              <p className="text-xl font-bold text-white tracking-tight mb-1">
                {l.value}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                {l.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {['DSGVO', 'TLS 1.3', 'Mandantentrennung', 'Audit-Logs', 'EU-Hosting'].map((c) => (
            <span
              key={c}
              className="px-3 py-1.5 border border-white/[0.08] rounded-lg text-[11px] font-medium text-slate-500"
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
