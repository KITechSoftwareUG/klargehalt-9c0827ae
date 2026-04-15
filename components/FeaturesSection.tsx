import { BarChart2, Users, FileText, Lock, Shield, Scale } from 'lucide-react';

const features = [
  {
    icon: BarChart2,
    number: '01',
    title: 'Gehaltsstrukturen erfassen',
    description: 'Job-Profile, Gehaltsbänder und Mitarbeiterdaten an einem Ort. Import per CSV oder manuelle Erfassung.',
    color: '#52e0de',
    bg: '#bdf9f7',
  },
  {
    icon: BarChart2,
    number: '02',
    title: 'Pay-Gap automatisch berechnen',
    description: 'Median- und Durchschnittsvergleiche nach Geschlecht, pro Job-Profil. Genau so, wie die Richtlinie es verlangt.',
    color: '#946df7',
    bg: '#e0d4fd',
  },
  {
    icon: Lock,
    number: '03',
    title: 'Rollen und Zugriffsrechte',
    description: 'Admin, HR-Manager, Mitarbeiter — jede Rolle sieht nur das, was sie sehen darf. Durchgesetzt auf Datenbankebene, nicht nur im Frontend.',
    color: '#fbcd56',
    bg: '#fef1c2',
  },
  {
    icon: Users,
    number: '04',
    title: 'Mitarbeiter-Auskunft',
    description: 'Mitarbeiter sehen anonymisierte Gruppenstatistiken zu ihrer Vergütung. Keine Einzelgehälter. DSGVO-konform.',
    color: '#52e0de',
    bg: '#bdf9f7',
  },
  {
    icon: FileText,
    number: '05',
    title: 'Audit-Trail',
    description: 'Jede Änderung wird protokolliert. Wer hat wann was geändert — exportierbar für Prüfer und Behörden.',
    color: '#946df7',
    bg: '#e0d4fd',
  },
  {
    icon: Shield,
    number: '06',
    title: 'EU-Hosting',
    description: 'Daten liegen in Frankfurt. Kein Transfer in Drittländer. Verschlüsselung in Transit und at Rest.',
    color: '#fbcd56',
    bg: '#fef1c2',
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
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: f.bg }}
              >
                <f.icon className="w-4 h-4" style={{ color: f.color }} />
              </div>
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
