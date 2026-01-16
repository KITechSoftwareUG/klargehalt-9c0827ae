import { useAuth } from '@/hooks/useAuth';
import { useJobProfiles, usePayBands } from '@/hooks/useJobProfiles';
import { useEmployees } from '@/hooks/useEmployees';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Info
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

  const welcome = getWelcomeMessage(role as any, profile?.full_name || undefined);
  const navItems = getNavigationForRole(role as any);
  const isLoading = profilesLoading || bandsLoading || employeesLoading;

  // Berechne Compliance-Status
  const getComplianceStatus = () => {
    if (isLoading) return { status: 'neutral' as const, label: 'Wird geprüft...' };
    
    const hasProfiles = jobProfiles.length > 0;
    const hasBands = payBands.length > 0;
    const hasEmployees = employees.length > 0;
    
    if (hasProfiles && hasBands && hasEmployees) {
      return { status: 'success' as const, label: 'Grundstruktur vollständig' };
    } else if (hasProfiles || hasBands) {
      return { status: 'warning' as const, label: 'Setup unvollständig' };
    }
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

      {/* Compliance-Status für Admin/HR - mit Kontext */}
      {(role === 'admin' || role === 'hr_manager') && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <DataValue 
                label="Mitarbeiter"
                value={employees.length}
                format="number"
                status={employees.length > 0 ? 'success' : 'warning'}
                context={employees.length === 0 ? 'Noch keine Mitarbeiter erfasst' : undefined}
              />
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <DataValue 
                label="Job-Profile"
                value={jobProfiles.length}
                format="number"
                status={jobProfiles.length > 0 ? 'success' : 'warning'}
                helpText="Stellenprofile definieren die Anforderungen und Qualifikationen für Positionen."
              />
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <DataValue 
                label="Entgeltbänder"
                value={payBands.length}
                format="number"
                status={payBands.length > 0 ? 'success' : 'warning'}
                helpText="Entgeltbänder legen Gehaltsspannen pro Job-Profil und Level fest."
              />
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Compliance-Status</span>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status={compliance.status} label={compliance.label} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Kontextuelle Hinweise - keine Angst erzeugen */}
      {(role === 'admin' || role === 'hr_manager') && compliance.status !== 'success' && (
        <InfoBox variant="info" title="Nächste Schritte">
          <p>
            Zur vollständigen Einrichtung des Entgelttransparenz-Systems empfehlen wir:
          </p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            {employees.length === 0 && <li>Mitarbeiter im System erfassen</li>}
            {jobProfiles.length === 0 && <li>Job-Profile mit Anforderungen definieren</li>}
            {payBands.length === 0 && <li>Entgeltbänder pro Job-Profil festlegen</li>}
          </ul>
        </InfoBox>
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
