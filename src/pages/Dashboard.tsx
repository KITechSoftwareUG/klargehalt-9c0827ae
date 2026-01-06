import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
  UserCircle,
  Scale,
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, role, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    hr_manager: 'HR-Manager',
    employee: 'Mitarbeiter',
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-status-action/10 text-status-action',
    hr_manager: 'bg-status-warning/10 text-status-warning',
    employee: 'bg-status-ok/10 text-status-ok',
  };

  // Role-specific stats
  const getStatsForRole = () => {
    if (role === 'admin') {
      return [
        { label: 'Mitarbeiter gesamt', value: '247', icon: Users, color: 'text-primary' },
        { label: 'Compliance-Status', value: '94%', icon: CheckCircle, color: 'text-status-ok' },
        { label: 'Offene Anfragen', value: '12', icon: Clock, color: 'text-status-warning' },
        { label: 'Audit-Einträge', value: '1.842', icon: FileText, color: 'text-muted-foreground' },
      ];
    } else if (role === 'hr_manager') {
      return [
        { label: 'Zugewiesene Mitarbeiter', value: '63', icon: Users, color: 'text-primary' },
        { label: 'Gehaltsbänder', value: '8', icon: BarChart3, color: 'text-status-ok' },
        { label: 'Zu prüfen', value: '5', icon: AlertTriangle, color: 'text-status-warning' },
        { label: 'Abgeschlossen', value: '28', icon: CheckCircle, color: 'text-status-ok' },
      ];
    } else {
      return [
        { label: 'Meine Gehaltsgruppe', value: 'Band 4', icon: Scale, color: 'text-primary' },
        { label: 'Median-Vergleich', value: '+3%', icon: TrendingUp, color: 'text-status-ok' },
        { label: 'Letzte Anfrage', value: '15.12.', icon: Clock, color: 'text-muted-foreground' },
        { label: 'Status', value: 'Konform', icon: CheckCircle, color: 'text-status-ok' },
      ];
    }
  };

  // Role-specific navigation items
  const getNavItemsForRole = () => {
    const baseItems = [
      { label: 'Dashboard', icon: BarChart3, active: true as const },
    ];

    if (role === 'admin') {
      return [
        ...baseItems,
        { label: 'Benutzerverwaltung', icon: Users },
        { label: 'Entgeltstrukturen', icon: Scale },
        { label: 'Audit-Logs', icon: FileText },
        { label: 'Berichte', icon: TrendingUp },
        { label: 'Einstellungen', icon: Settings },
      ];
    } else if (role === 'hr_manager') {
      return [
        ...baseItems,
        { label: 'Mitarbeiter', icon: Users },
        { label: 'Gehaltsbänder', icon: Scale },
        { label: 'Job-Profile', icon: Building2 },
        { label: 'Anfragen', icon: FileText },
      ];
    } else {
      return [
        ...baseItems,
        { label: 'Meine Daten', icon: UserCircle },
        { label: 'Gehaltsvergleich', icon: Scale },
        { label: 'Auskunftsanfrage', icon: FileText },
      ];
    }
  };

  const stats = getStatsForRole();
  const navItems = getNavItemsForRole();

  return (
    <>
      <Helmet>
        <title>Dashboard - EntgeltGuard</title>
        <meta name="description" content="EntgeltGuard Dashboard - Verwalten Sie Ihre Entgelttransparenz-Compliance" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex items-center gap-2 border-b border-border px-6 py-4">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-primary">EntgeltGuard</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
              {navItems.map((item, index) => (
                <button
                  key={index}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    'active' in item && item.active 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* User section */}
            <div className="border-t border-border p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {profile?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {profile?.full_name || user.email}
                  </p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[role || 'employee']}`}>
                    {roleLabels[role || 'employee']}
                  </span>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="pl-64">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
            <div className="flex items-center justify-between px-8 py-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Willkommen zurück, {profile?.full_name || user.email}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-status-ok/10 border border-status-ok/20">
                  <div className="w-2 h-2 rounded-full bg-status-ok animate-pulse"></div>
                  <span className="text-sm font-medium text-status-ok">System konform</span>
                </div>
              </div>
            </div>
          </header>

          {/* Dashboard content */}
          <div className="p-8">
            {/* Welcome card */}
            <div className="mb-8 rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-8 text-white">
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
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
              {role === 'admin' && (
                <>
                  <ActionCard 
                    title="Benutzer verwalten"
                    description="Fügen Sie neue Benutzer hinzu und verwalten Sie Rollen und Berechtigungen."
                    icon={Users}
                    status="ok"
                  />
                  <ActionCard 
                    title="Entgeltstrukturen"
                    description="Definieren Sie Gehaltsbänder und Job-Profile für Ihr Unternehmen."
                    icon={Scale}
                    status="warning"
                    badge="3 zu prüfen"
                  />
                  <ActionCard 
                    title="Compliance-Bericht"
                    description="Generieren Sie revisionssichere Berichte für Behörden."
                    icon={FileText}
                    status="ok"
                  />
                </>
              )}
              {role === 'hr_manager' && (
                <>
                  <ActionCard 
                    title="Gehaltsdaten pflegen"
                    description="Aktualisieren Sie Gehaltsinformationen für Ihre Mitarbeiter."
                    icon={BarChart3}
                    status="ok"
                  />
                  <ActionCard 
                    title="Job-Profile"
                    description="Verwalten Sie Job-Level und Qualifikationskriterien."
                    icon={Building2}
                    status="ok"
                  />
                  <ActionCard 
                    title="Offene Anfragen"
                    description="Bearbeiten Sie Mitarbeiter-Auskunftsanfragen."
                    icon={Clock}
                    status="warning"
                    badge="5 offen"
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
        </main>
      </div>
    </>
  );
};

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'ok' | 'warning' | 'action';
  badge?: string;
}

const ActionCard = ({ title, description, icon: Icon, status, badge }: ActionCardProps) => {
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
    <div className={`group cursor-pointer rounded-xl border-2 bg-card p-6 transition-all hover:shadow-lg ${statusColors[status]}`}>
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

export default Dashboard;
