import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Lock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// =====================================================
// ROLLEN-BASIERTE KOMPONENTEN
// =====================================================

type AppRole = 'admin' | 'hr_manager' | 'employee' | 'legal' | 'auditor';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  requiredPermissions?: string[];
  fallback?: ReactNode;
  showFallback?: boolean;
}

/**
 * Zeigt Inhalt nur für bestimmte Rollen/Berechtigungen
 */
export function RoleGuard({ 
  children, 
  allowedRoles, 
  requiredPermissions,
  fallback,
  showFallback = true
}: RoleGuardProps) {
  const { role } = useAuth();
  const { hasPermission, hasAnyPermission } = usePermissions();
  
  // Prüfe Rolle
  if (allowedRoles && role && !allowedRoles.includes(role as AppRole)) {
    return showFallback ? (fallback || <AccessDenied />) : null;
  }
  
  // Prüfe Berechtigungen
  if (requiredPermissions && !hasAnyPermission(requiredPermissions)) {
    return showFallback ? (fallback || <AccessDenied />) : null;
  }
  
  return <>{children}</>;
}

/**
 * Zeigt Inhalt nur wenn NICHT in bestimmter Rolle
 */
export function RoleExclude({ 
  children, 
  excludeRoles 
}: { 
  children: ReactNode; 
  excludeRoles: AppRole[] 
}) {
  const { role } = useAuth();
  
  if (role && excludeRoles.includes(role as AppRole)) {
    return null;
  }
  
  return <>{children}</>;
}

/**
 * Standard-Fallback für fehlenden Zugriff
 */
function AccessDenied() {
  return (
    <Card className="border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Lock className="h-10 w-10 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Zugriff eingeschränkt</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Sie verfügen nicht über die erforderlichen Berechtigungen für diesen Bereich.
          Wenden Sie sich bei Fragen an Ihre IT-Administration.
        </p>
      </CardContent>
    </Card>
  );
}

// =====================================================
// ROLLEN-SPEZIFISCHE STYLES
// =====================================================

export const ROLE_STYLES: Record<AppRole, {
  bg: string;
  text: string;
  border: string;
  label: string;
  description: string;
}> = {
  admin: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
    label: 'Administrator',
    description: 'Vollzugriff auf alle Bereiche und Einstellungen'
  },
  hr_manager: {
    bg: 'bg-accent/10',
    text: 'text-accent',
    border: 'border-accent/30',
    label: 'HR-Manager',
    description: 'Verwaltung von Mitarbeitern und Vergütungsstrukturen'
  },
  employee: {
    bg: 'bg-status-success/10',
    text: 'text-status-success',
    border: 'border-status-success/30',
    label: 'Mitarbeiter',
    description: 'Einsicht in eigene Daten und Auskunftsanfragen'
  },
  legal: {
    bg: 'bg-status-warning/10',
    text: 'text-status-warning',
    border: 'border-status-warning/30',
    label: 'Legal/Compliance',
    description: 'Zugriff auf Compliance-Berichte und Dokumentation'
  },
  auditor: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    label: 'Auditor',
    description: 'Zeitlich begrenzter Lesezugriff für Prüfungen'
  }
};

interface RoleBadgeProps {
  role: AppRole;
  size?: 'sm' | 'md';
  className?: string;
}

export function RoleBadge({ role, size = 'md', className }: RoleBadgeProps) {
  const style = ROLE_STYLES[role];
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  };
  
  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium',
      style.bg,
      style.text,
      sizeClasses[size],
      className
    )}>
      {style.label}
    </span>
  );
}

// =====================================================
// ROLLEN-ABHÄNGIGE NAVIGATION
// =====================================================

import { 
  BarChart3, 
  Users, 
  Building2, 
  Scale, 
  FileText, 
  TrendingUp, 
  Settings, 
  UserCircle,
  Shield,
  ClipboardList
} from 'lucide-react';

export interface NavItem {
  label: string;
  icon: React.ElementType;
  view: string;
  description?: string;
  badge?: string;
}

export function getNavigationForRole(role: AppRole | null): NavItem[] {
  const baseItems: NavItem[] = [
    { 
      label: 'Übersicht', 
      icon: BarChart3, 
      view: 'overview',
      description: 'Dashboard und Schnellzugriff'
    },
  ];

  switch (role) {
    case 'admin':
      return [
        ...baseItems,
        { 
          label: 'Mitarbeiter', 
          icon: Users, 
          view: 'employees',
          description: 'Mitarbeiterverwaltung'
        },
        { 
          label: 'Job-Profile', 
          icon: Building2, 
          view: 'job-profiles',
          description: 'Stellenprofile und Anforderungen'
        },
        { 
          label: 'Entgeltbänder', 
          icon: Scale, 
          view: 'pay-bands',
          description: 'Vergütungsstrukturen'
        },
        { 
          label: 'Berichte', 
          icon: TrendingUp, 
          view: 'reports',
          description: 'Pay Equity Analysen'
        },
        { 
          label: 'Audit-Logs', 
          icon: Shield, 
          view: 'audit',
          description: 'Protokollierung und Compliance'
        },
        { 
          label: 'Einstellungen', 
          icon: Settings, 
          view: 'settings',
          description: 'Systemkonfiguration'
        },
      ];
      
    case 'hr_manager':
      return [
        ...baseItems,
        { 
          label: 'Mitarbeiter', 
          icon: Users, 
          view: 'employees',
          description: 'Mitarbeiterverwaltung'
        },
        { 
          label: 'Job-Profile', 
          icon: Building2, 
          view: 'job-profiles',
          description: 'Stellenprofile'
        },
        { 
          label: 'Entgeltbänder', 
          icon: Scale, 
          view: 'pay-bands',
          description: 'Vergütungsstrukturen'
        },
        { 
          label: 'Anfragen', 
          icon: ClipboardList, 
          view: 'requests',
          description: 'Auskunftsanfragen bearbeiten'
        },
        { 
          label: 'Berichte', 
          icon: TrendingUp, 
          view: 'reports',
          description: 'Pay Equity Analysen'
        },
      ];
      
    case 'employee':
      return [
        ...baseItems,
        { 
          label: 'Meine Daten', 
          icon: UserCircle, 
          view: 'my-data',
          description: 'Ihre persönlichen Informationen'
        },
        { 
          label: 'Gehaltsvergleich', 
          icon: Scale, 
          view: 'comparison',
          description: 'Anonymisierte Einordnung'
        },
        { 
          label: 'Auskunftsanfragen', 
          icon: FileText, 
          view: 'requests',
          description: 'Informationen anfordern'
        },
      ];
      
    case 'legal':
      return [
        ...baseItems,
        { 
          label: 'Berichte', 
          icon: TrendingUp, 
          view: 'reports',
          description: 'Pay Equity Analysen'
        },
        { 
          label: 'Audit-Logs', 
          icon: Shield, 
          view: 'audit',
          description: 'Compliance-Protokolle'
        },
        { 
          label: 'Anfragen', 
          icon: ClipboardList, 
          view: 'requests',
          description: 'Auskunftsanfragen einsehen'
        },
      ];
      
    case 'auditor':
      return [
        ...baseItems,
        { 
          label: 'Audit-Logs', 
          icon: Shield, 
          view: 'audit',
          description: 'Vollständige Protokolle'
        },
        { 
          label: 'Berichte', 
          icon: TrendingUp, 
          view: 'reports',
          description: 'Pay Equity Berichte'
        },
      ];
      
    default:
      return baseItems;
  }
}

// =====================================================
// ROLLEN-ABHÄNGIGE WILLKOMMENSNACHRICHTEN
// =====================================================

export function getWelcomeMessage(role: AppRole | null, name?: string): {
  greeting: string;
  subtitle: string;
  tip?: string;
} {
  const displayName = name || 'Benutzer';
  
  switch (role) {
    case 'admin':
      return {
        greeting: `Willkommen, ${displayName}`,
        subtitle: 'Sie haben vollen Zugriff auf alle Bereiche des Entgelttransparenz-Systems.',
        tip: 'Prüfen Sie regelmäßig die Pay Equity Berichte und Audit-Logs.'
      };
      
    case 'hr_manager':
      return {
        greeting: `Willkommen, ${displayName}`,
        subtitle: 'Verwalten Sie Mitarbeiter, Stellenprofile und Vergütungsstrukturen.',
        tip: 'Neue Auskunftsanfragen sollten zeitnah bearbeitet werden.'
      };
      
    case 'employee':
      return {
        greeting: `Guten Tag, ${displayName}`,
        subtitle: 'Sie können hier Informationen zu Ihrer Vergütung einsehen und Anfragen stellen.',
        tip: 'Gemäß EU-Richtlinie haben Sie Anspruch auf transparente Gehaltsinformationen.'
      };
      
    case 'legal':
      return {
        greeting: `Willkommen, ${displayName}`,
        subtitle: 'Zugriff auf Compliance-Berichte und rechtliche Dokumentation.',
        tip: 'Die EU-Richtlinie 2023/970 erfordert regelmäßige Pay Gap Analysen.'
      };
      
    case 'auditor':
      return {
        greeting: `Willkommen, ${displayName}`,
        subtitle: 'Zeitlich begrenzter Lesezugriff für Ihre Prüfung.',
        tip: 'Alle Ihre Zugriffe werden protokolliert und sind revisionssicher.'
      };
      
    default:
      return {
        greeting: `Willkommen, ${displayName}`,
        subtitle: 'Laden Sie die Seite neu oder kontaktieren Sie den Support.',
      };
  }
}
