import { useAuth } from '@/hooks/useAuth';
import { useJobProfiles, usePayBands } from '@/hooks/useJobProfiles';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Users, 
  FileText, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
  UserCircle,
  Scale,
  TrendingUp
} from 'lucide-react';

interface DashboardOverviewProps {
  onNavigate: (view: string) => void;
}

const DashboardOverview = ({ onNavigate }: DashboardOverviewProps) => {
  const { user, profile, role } = useAuth();
  const { jobProfiles } = useJobProfiles();
  const { payBands } = usePayBands();

  // Role-specific stats with real data
  const getStatsForRole = () => {
    if (role === 'admin' || role === 'hr_manager') {
      return [
        { label: 'Job-Profile', value: jobProfiles.length.toString(), icon: Building2, color: 'text-primary' },
        { label: 'Gehaltsbänder', value: payBands.length.toString(), icon: Scale, color: 'text-status-ok' },
        { label: 'Offene Anfragen', value: '0', icon: Clock, color: 'text-status-warning' },
        { label: 'Compliance-Status', value: jobProfiles.length > 0 && payBands.length > 0 ? 'OK' : 'Offen', icon: CheckCircle, color: 'text-status-ok' },
      ];
    } else {
      return [
        { label: 'Meine Gehaltsgruppe', value: '—', icon: Scale, color: 'text-primary' },
        { label: 'Median-Vergleich', value: '—', icon: TrendingUp, color: 'text-status-ok' },
        { label: 'Letzte Anfrage', value: '—', icon: Clock, color: 'text-muted-foreground' },
        { label: 'Status', value: 'Aktiv', icon: CheckCircle, color: 'text-status-ok' },
      ];
    }
  };

  const stats = getStatsForRole();

  return (
    <div className="space-y-8">
      {/* Welcome card */}
      <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {role === 'admin' && 'Unternehmens-Übersicht'}
              {role === 'hr_manager' && 'HR-Manager Portal'}
              {role === 'employee' && 'Mitarbeiter-Portal'}
            </h2>
            <p className="text-white/80 max-w-xl">
              {role === 'admin' && 'Verwalten Sie Benutzer, Entgeltstrukturen und überwachen Sie die Compliance Ihres Unternehmens.'}
              {role === 'hr_manager' && 'Pflegen Sie Gehaltsdaten, Job-Level und Kriterien für Ihre zugewiesenen Mitarbeiter.'}
              {role === 'employee' && 'Sehen Sie Ihre Gehaltsgruppe ein und stellen Sie Auskunftsanfragen gemäß EU-Richtlinie.'}
            </p>
          </div>
          <Shield className="h-24 w-24 text-white/20" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Action cards based on role */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(role === 'admin' || role === 'hr_manager') && (
          <>
            <ActionCard 
              title="Job-Profile verwalten"
              description="Erstellen und bearbeiten Sie Stellenprofile für Ihre Entgeltstruktur."
              icon={Building2}
              status={jobProfiles.length > 0 ? 'ok' : 'warning'}
              badge={jobProfiles.length === 0 ? 'Neu anlegen' : undefined}
              onClick={() => onNavigate('job-profiles')}
            />
            <ActionCard 
              title="Gehaltsbänder definieren"
              description="Legen Sie Gehaltsspannen pro Job-Profil und Karrierestufe fest."
              icon={Scale}
              status={payBands.length > 0 ? 'ok' : 'warning'}
              badge={payBands.length === 0 ? 'Neu anlegen' : undefined}
              onClick={() => onNavigate('pay-bands')}
            />
            <ActionCard 
              title="Compliance-Bericht"
              description="Generieren Sie revisionssichere Berichte für Behörden."
              icon={FileText}
              status="ok"
            />
          </>
        )}
        {role === 'employee' && (
          <>
            <ActionCard 
              title="Gehaltsvergleich"
              description="Sehen Sie anonymisierte Vergleichswerte Ihrer Gehaltsgruppe."
              icon={Scale}
              status="ok"
            />
            <ActionCard 
              title="Auskunftsanfrage stellen"
              description="Stellen Sie eine rechtssichere Anfrage gemäß EU-Richtlinie."
              icon={FileText}
              status="ok"
            />
            <ActionCard 
              title="Meine Historie"
              description="Sehen Sie Ihre bisherigen Anfragen und deren Status."
              icon={Clock}
              status="ok"
            />
          </>
        )}
      </div>
    </div>
  );
};

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'ok' | 'warning' | 'action';
  badge?: string;
  onClick?: () => void;
}

const ActionCard = ({ title, description, icon: Icon, status, badge, onClick }: ActionCardProps) => {
  const statusColors = {
    ok: 'border-status-ok/20 hover:border-status-ok/40',
    warning: 'border-status-warning/20 hover:border-status-warning/40',
    action: 'border-status-action/20 hover:border-status-action/40',
  };

  const iconColors = {
    ok: 'text-status-ok bg-status-ok/10',
    warning: 'text-status-warning bg-status-warning/10',
    action: 'text-status-action bg-status-action/10',
  };

  return (
    <div 
      className={`group cursor-pointer rounded-xl border-2 bg-card p-6 transition-all hover:shadow-lg ${statusColors[status]}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`rounded-lg p-3 ${iconColors[status]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {badge && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-status-warning/10 text-status-warning">
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

export default DashboardOverview;
