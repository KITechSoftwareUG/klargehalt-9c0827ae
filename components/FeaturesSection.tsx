const features = [
  {
    number: "01",
    title: "Gehaltsstrukturen erfassen",
    description: "Job-Profile, Gehaltsbänder und Mitarbeiterdaten an einem Ort. Import per CSV oder manuelle Erfassung.",
  },
  {
    number: "02",
    title: "Pay-Gap automatisch berechnen",
    description: "Median- und Durchschnittsvergleiche nach Geschlecht, pro Job-Profil. Genau so, wie die Richtlinie es verlangt.",
  },
  {
    number: "03",
    title: "Rollen und Zugriffsrechte",
    description: "Admin, HR-Manager, Mitarbeiter — jede Rolle sieht nur das, was sie sehen darf. Durchgesetzt auf Datenbankebene, nicht nur im Frontend.",
  },
  {
    number: "04",
    title: "Mitarbeiter-Auskunft",
    description: "Mitarbeiter sehen anonymisierte Gruppenstatistiken zu ihrer Verguetung. Keine Einzelgehaelter. DSGVO-konform.",
  },
  {
    number: "05",
    title: "Audit-Trail",
    description: "Jede Aenderung wird protokolliert. Wer hat wann was geaendert — exportierbar fuer Pruefer und Behoerden.",
  },
  {
    number: "06",
    title: "EU-Hosting",
    description: "Daten liegen in Frankfurt. Kein Transfer in Drittlaender. Verschluesselung in Transit und at Rest.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 lg:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl mb-14 lg:mb-20">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1E293B] tracking-tight leading-tight mb-4">
            Was KlarGehalt konkret macht.
          </h2>
          <p className="text-base text-slate-500 leading-relaxed">
            Sechs Module, die zusammen die EU-Richtlinie 2023/970 abdecken.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 lg:gap-y-14">
          {features.map((f) => (
            <div key={f.number} className="group">
              <span className="text-xs font-mono font-bold text-slate-300 mb-3 block">
                {f.number}
              </span>
              <h3 className="text-base font-bold text-[#1E293B] mb-2 tracking-tight">
                {f.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
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
