import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { Button } from '@/components/ui/button';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import JobProfilesView from '@/components/dashboard/JobProfilesView';
import PayBandsView from '@/components/dashboard/PayBandsView';
import EmployeesView from '@/components/dashboard/EmployeesView';
import AuditLogsView from '@/components/dashboard/AuditLogsView';
import CompanySetup from '@/components/dashboard/CompanySetup';
import { PayGapReportView } from '@/components/dashboard/PayGapReportView';
import { InfoRequestsView } from '@/components/dashboard/InfoRequestsView';
import { EmployeeSalaryComparisonView } from '@/components/dashboard/EmployeeSalaryComparisonView';
import { getNavigationForRole } from '@/components/ui/role-components';
import { 
  Shield, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  BarChart3,
  Building2,
  UserCircle,
  Scale,
  TrendingUp
} from 'lucide-react';

type DashboardView = 'overview' | 'users' | 'job-profiles' | 'pay-bands' | 'employees' | 'audit' | 'reports' | 'settings' | 'my-data' | 'comparison' | 'requests';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, role, loading, signOut } = useAuth();
  const { company, loading: companyLoading, fetchCompany } = useCompany();
  const [activeView, setActiveView] = useState<DashboardView>('overview');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleCompanySetupComplete = () => {
    fetchCompany();
  };

  if (loading || companyLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show company setup if admin/hr_manager without company
  if ((role === 'admin' || role === 'hr_manager') && !company) {
    return (
      <>
        <Helmet>
          <title>Firma einrichten - KlarGehalt</title>
        </Helmet>
        <div className="min-h-screen bg-background p-8">
          <div className="flex items-center gap-2 mb-8">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">KlarGehalt</span>
          </div>
          <CompanySetup onComplete={handleCompanySetupComplete} />
        </div>
      </>
    );
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

  // Role-specific navigation items
  const getNavItemsForRole = (): { label: string; icon: React.ElementType; view: DashboardView }[] => {
    const baseItems = [
      { label: 'Dashboard', icon: BarChart3, view: 'overview' as const },
    ];

    if (role === 'admin') {
      return [
        ...baseItems,
        { label: 'Mitarbeiter', icon: Users, view: 'employees' as const },
        { label: 'Job-Profile', icon: Building2, view: 'job-profiles' as const },
        { label: 'Gehaltsbänder', icon: Scale, view: 'pay-bands' as const },
        { label: 'Audit-Logs', icon: FileText, view: 'audit' as const },
        { label: 'Berichte', icon: TrendingUp, view: 'reports' as const },
        { label: 'Einstellungen', icon: Settings, view: 'settings' as const },
      ];
    } else if (role === 'hr_manager') {
      return [
        ...baseItems,
        { label: 'Mitarbeiter', icon: Users, view: 'employees' as const },
        { label: 'Job-Profile', icon: Building2, view: 'job-profiles' as const },
        { label: 'Gehaltsbänder', icon: Scale, view: 'pay-bands' as const },
        { label: 'Anfragen', icon: FileText, view: 'requests' as const },
      ];
    } else {
      return [
        ...baseItems,
        { label: 'Meine Daten', icon: UserCircle, view: 'my-data' as const },
        { label: 'Gehaltsvergleich', icon: Scale, view: 'comparison' as const },
        { label: 'Auskunftsanfrage', icon: FileText, view: 'requests' as const },
      ];
    }
  };

  const navItems = getNavItemsForRole();

  const renderContent = () => {
    switch (activeView) {
      case 'job-profiles':
        return <JobProfilesView />;
      case 'pay-bands':
        return <PayBandsView />;
      case 'employees':
        return <EmployeesView />;
      case 'audit':
        return <AuditLogsView />;
      case 'reports':
        return <PayGapReportView />;
      case 'requests':
        return <InfoRequestsView />;
      case 'comparison':
        return <EmployeeSalaryComparisonView />;
      case 'overview':
      default:
        return <DashboardOverview onNavigate={(view) => setActiveView(view as DashboardView)} />;
    }
  };

  const getPageTitle = () => {
    switch (activeView) {
      case 'job-profiles':
        return 'Job-Profile';
      case 'pay-bands':
        return 'Gehaltsbänder';
      case 'employees':
        return 'Mitarbeiter';
      case 'audit':
        return 'Audit-Logs';
      case 'reports':
        return 'Berichte';
      case 'settings':
        return 'Einstellungen';
      case 'my-data':
        return 'Meine Daten';
      case 'comparison':
        return 'Gehaltsvergleich';
      case 'requests':
        return 'Anfragen';
      default:
        return 'Dashboard';
    }
  };

  return (
    <>
      <Helmet>
        <title>{getPageTitle()} - KlarGehalt</title>
        <meta name="description" content="KlarGehalt Dashboard - Verwalten Sie Ihre Entgelttransparenz-Compliance" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex items-center gap-2 border-b border-border px-6 py-4">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-primary">KlarGehalt</span>
            </div>

            {/* Company info */}
            {company && (
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs text-muted-foreground">Firma</p>
                <p className="font-medium text-foreground truncate">{company.name}</p>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
              {navItems.map((item) => (
                <button
                  key={item.view}
                  onClick={() => setActiveView(item.view)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    activeView === item.view
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
                <h1 className="text-2xl font-bold text-foreground">{getPageTitle()}</h1>
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
            {renderContent()}
          </div>
        </main>
      </div>
    </>
  );
};

export default Dashboard;
