import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useJobProfiles, usePayBands } from '@/hooks/useJobProfiles';
import { useEmployees } from '@/hooks/useEmployees';
import { usePermissions } from '@/hooks/usePermissions';
import { usePayGapStatistics } from '@/hooks/usePayGapStatistics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  StatusBadge,
  StatusIndicator,
  InfoBox,
  DataValue,
  LEGAL_TEXTS
} from '@/components/ui/status-components';
import {
  getWelcomeMessage,
  getNavigationForRole,
  ROLE_STYLES,
  RoleBadge
} from '@/components/ui/role-components';
import {
  Shield,
  Users,
  FileText,
  Building2,
  Scale,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
  Circle,
} from 'lucide-react';

interface DashboardOverviewProps {
  onNavigate: (view: string) => void;
}

const DashboardOverview = ({ onNavigate }: DashboardOverviewProps) => {
  const { role, profile } = useAuth();
  const { jobProfiles, loading: profilesLoading } = useJobProfiles();
  const { payBands, loading: bandsLoading } = usePayBands();
  const { employees, loading: employeesLoading } = useEmployees();
  const { hasPermission } = usePermissions();
  const { calculateGenderPayGap } = usePayGapStatistics();
  const [hasSnapshots, setHasSnapshots] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    calculateGenderPayGap().then((gaps) => setHasSnapshots(gaps.length > 0));
  }, [calculateGenderPayGap]);

  const welcome = getWelcomeMessage(role as any, profile?.full_name || undefined);
  const navItems = getNavigationForRole(role as any);
  const isLoading = profilesLoading || bandsLoading || employeesLoading;

  // Setup checklist steps
  const setupSteps = [
    {
      id: 'company',
      label: 'Unternehmen eingerichtet',
      done: true, // if they're here, company is set up
      view: 'settings' as const,
    },
    {
      id: 'job_profiles',
      label: `Job-Profile definiert (${jobProfiles.length})`,
      done: jobProfiles.length > 0,
      view: 'job-profiles' as const,
    },
    {
      id: 'pay_bands',
      label: `Entgeltbänder festgelegt (${payBands.length})`,
      done: payBands.length > 0,
      view: 'pay-bands' as const,
    },
    {
      id: 'employees',
      label: `Mitarbeiter erfasst (${employees.length})`,
      done: employees.length >= 5,
      subLabel: employees.length > 0 && employees.length < 5 ? `${employees.length}/5 — mind. 5 für anonymisierte Analysen` : undefined,
      view: 'employees' as const,
    },
    {
      id: 'analysis',
      label: 'Erste Pay-Gap-Analyse durchgeführt',
      done: hasSnapshots === true,
      view: 'reports' as const,
    },
  ];

  const completedCount = setupSteps.filter((s) => s.done).length;
  const progressPct = Math.round((completedCount / setupSteps.length) * 100);
  const isSetupComplete = completedCount === setupSteps.length;

  // Berechne Compliance-Status (kept for backwards compat)
  const getComplianceStatus = () => {
    if (isLoading) return { status: 'neutral' as const, label: 'Wird geprüft...' };
    if (isSetupComplete) return { status: 'success' as const, label: 'Vollständig eingerichtet' };
    if (completedCount >= 3) return { status: 'warning' as const, label: 'Setup unvollständig' };
    return { status: 'danger' as const, label: 'Ersteinrichtung erforderlich' };
  };

  const compliance = getComplianceStatus();

  return (
    <div className="space-y-6">
      {/* Willkommens-Header - sachlich, nicht übertrieben */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="py-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-tight">{welcome.greeting}</h2>
                {role && <RoleBadge role={role as any} size="sm" />}
              </div>
              <p className="text-muted-foreground max-w-2xl">{welcome.subtitle}</p>
              {welcome.tip && (
                <p className="text-sm text-muted-foreground/80 flex items-center gap-2 mt-3">
                  <Info size={14} />
                  {welcome.tip}
                </p>
              )}
            </div>
            <Shield className="h-16 w-16 text-primary/20 hidden md:block" />
          </div>
        </CardContent>
      </Card>

      {/* Setup-Checklist für Admin/HR */}
      {(role === 'admin' || role === 'hr_manager') && (
        <Card className={`border ${isSetupComplete ? 'border-green-200 bg-green-50/50' : 'border-border/50'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {isSetupComplete
                    ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                    : <Clock className="h-5 w-5 text-amber-500" />
                  }
                  Einrichtungs-Checkliste
                </CardTitle>
                <CardDescription className="mt-1">
                  {isSetupComplete
                    ? 'Ihr System ist vollständig eingerichtet und EU-konform.'
                    : `${completedCount} von ${setupSteps.length} Schritten abgeschlossen`}
                </CardDescription>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${isSetupComplete ? 'text-green-600' : 'text-amber-600'}`}>
                  {progressPct}%
                </span>
              </div>
            </div>
            <Progress value={progressPct} className="h-2 mt-2" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {setupSteps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    step.done ? 'bg-green-50/80' : 'bg-muted/40 cursor-pointer hover:bg-muted/60'
                  }`}
                  onClick={() => !step.done && onNavigate(step.view)}
                >
                  {step.done
                    ? <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    : <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${step.done ? 'text-green-800 line-through decoration-green-400/60' : 'text-foreground'}`}>
                      {step.label}
                    </p>
                    {step.subLabel && (
                      <p className="text-xs text-amber-600">{step.subLabel}</p>
                    )}
                  </div>
                  {!step.done && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


      {/* EU-Hinweis für Mitarbeiter - beruhigend, nicht bedrohlich */}
      {role === 'employee' && (
        <InfoBox variant="legal" title="Ihr Recht auf Transparenz">
          {LEGAL_TEXTS.euDirective.rightToInfo} Diese Plattform ermöglicht Ihnen, 
          die relevanten Informationen strukturiert und datenschutzkonform anzufragen.
        </InfoBox>
      )}

      {/* Aktionskarten - klar strukturiert */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Schnellzugriff</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {navItems.slice(1, 7).map((item) => (
            <ActionCard 
              key={item.view}
              title={item.label}
              description={item.description || ''}
              icon={item.icon}
              onClick={() => onNavigate(item.view)}
            />
          ))}
        </div>
      </div>

      {/* Rechtlicher Hinweis am Ende - immer sichtbar */}
      <Card className="border-border/30 bg-muted/30">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground text-center">
            {LEGAL_TEXTS.euDirective.reference} • {LEGAL_TEXTS.general.auditTrail}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick?: () => void;
}

const ActionCard = ({ title, description, icon: Icon, onClick }: ActionCardProps) => {
  return (
    <Card 
      className="group cursor-pointer border-border/50 hover:border-primary/30 hover:shadow-md transition-all"
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg p-2.5 bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardOverview;
