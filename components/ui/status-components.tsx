import { ReactNode } from 'react';
import { Info, AlertTriangle, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// =====================================================
// AMPEL-KOMPONENTEN (Traffic Light System)
// =====================================================

export type StatusLevel = 'success' | 'warning' | 'danger' | 'neutral';

interface StatusConfig {
  bg: string;
  text: string;
  border: string;
  icon: React.ElementType;
  label: string;
}

const STATUS_CONFIGS: Record<StatusLevel, StatusConfig> = {
  success: {
    bg: 'bg-status-success-bg',
    text: 'text-status-success',
    border: 'border-status-success/30',
    icon: CheckCircle2,
    label: 'Konform'
  },
  warning: {
    bg: 'bg-status-warning-bg',
    text: 'text-status-warning',
    border: 'border-status-warning/30',
    icon: AlertTriangle,
    label: 'Prüfung empfohlen'
  },
  danger: {
    bg: 'bg-status-danger-bg',
    text: 'text-status-danger',
    border: 'border-status-danger/30',
    icon: XCircle,
    label: 'Handlungsbedarf'
  },
  neutral: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    icon: Info,
    label: 'Keine Daten'
  }
};

// Ampel-Badge
interface StatusBadgeProps {
  status: StatusLevel;
  label?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({ 
  status, 
  label, 
  showIcon = true, 
  size = 'md',
  className 
}: StatusBadgeProps) {
  const config = STATUS_CONFIGS[status];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2'
  };
  
  const iconSizes = { sm: 12, md: 14, lg: 16 };
  
  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium',
      config.bg,
      config.text,
      sizeClasses[size],
      className
    )}>
      {showIcon && <Icon size={iconSizes[size]} />}
      {label || config.label}
    </span>
  );
}

// Ampel-Indikator (nur Punkt)
interface StatusIndicatorProps {
  status: StatusLevel;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

export function StatusIndicator({ 
  status, 
  pulse = false, 
  size = 'md',
  tooltip 
}: StatusIndicatorProps) {
  const colors: Record<StatusLevel, string> = {
    success: 'bg-status-success',
    warning: 'bg-status-warning',
    danger: 'bg-status-danger',
    neutral: 'bg-muted-foreground'
  };
  
  const sizes = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3' };
  
  const indicator = (
    <span className={cn(
      'inline-block rounded-full',
      colors[status],
      sizes[size],
      pulse && 'animate-pulse'
    )} />
  );
  
  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{indicator}</TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return indicator;
}

// =====================================================
// KONTEXTUELLE HILFE-KOMPONENTEN
// =====================================================

interface ContextHelpProps {
  children: ReactNode;
  className?: string;
}

export function ContextHelp({ children, className }: ContextHelpProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className={cn(
            'inline-flex items-center justify-center w-4 h-4 rounded-full',
            'text-muted-foreground hover:text-foreground transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            className
          )}>
            <HelpCircle size={14} />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Info-Box mit Kontext
interface InfoBoxProps {
  title?: string;
  children: ReactNode;
  variant?: 'info' | 'legal' | 'tip';
  className?: string;
}

export function InfoBox({ 
  title, 
  children, 
  variant = 'info',
  className 
}: InfoBoxProps) {
  const variantStyles = {
    info: 'bg-accent/5 border-accent/20 text-foreground',
    legal: 'bg-muted border-border text-muted-foreground',
    tip: 'bg-status-success-bg border-status-success/20 text-foreground'
  };
  
  const icons = {
    info: Info,
    legal: AlertTriangle,
    tip: CheckCircle2
  };
  
  const Icon = icons[variant];
  
  return (
    <div className={cn(
      'rounded-lg border p-4',
      variantStyles[variant],
      className
    )}>
      <div className="flex gap-3">
        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5 opacity-70" />
        <div className="flex-1">
          {title && (
            <p className="font-medium text-sm mb-1">{title}</p>
          )}
          <div className="text-sm opacity-90">{children}</div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// JURISTISCH SICHERE TEXTBAUSTEINE
// =====================================================

export const LEGAL_TEXTS = {
  // Datenschutz
  dataPrivacy: {
    aggregation: 'Alle angezeigten Werte sind aggregiert und anonymisiert. Ein Rückschluss auf einzelne Personen ist nicht möglich.',
    minGroupSize: (size: number) => `Zur Wahrung des Datenschutzes werden Gruppen mit weniger als ${size} Personen nicht angezeigt.`,
    noExport: 'Der Export personenbezogener Daten ist für diese Rolle nicht freigegeben.',
    retention: 'Daten werden gemäß den gesetzlichen Aufbewahrungsfristen verarbeitet und nach Ablauf automatisch gelöscht.'
  },
  
  // EU-Richtlinie
  euDirective: {
    reference: 'Gemäß EU-Richtlinie 2023/970 zur Stärkung der Anwendung des Grundsatzes des gleichen Entgelts.',
    rightToInfo: 'Sie haben das Recht auf Auskunft über die Kriterien, die zur Festlegung Ihres Entgelts herangezogen werden.',
    payGap: 'Der Gender Pay Gap zeigt die prozentuale Differenz der Median-Gehälter zwischen Geschlechtern.',
    noDiscrimination: 'Unterschiede in der Vergütung müssen durch objektive, geschlechtsneutrale Kriterien gerechtfertigt sein.'
  },
  
  // Allgemeine Hinweise
  general: {
    noGuarantee: 'Die dargestellten Informationen dienen der Übersicht und ersetzen keine individuelle Beratung.',
    dataAsOf: (date: string) => `Stand der Daten: ${date}. Aktualisierungen erfolgen regelmäßig.`,
    contactHR: 'Bei Fragen wenden Sie sich bitte an Ihre HR-Abteilung.',
    auditTrail: 'Alle Zugriffe und Änderungen werden revisionssicher protokolliert.'
  },
  
  // Compliance
  compliance: {
    compliant: 'Ihr Unternehmen erfüllt die aktuellen Anforderungen der Entgelttransparenz.',
    actionRequired: 'Es wurden Abweichungen festgestellt, die einer Prüfung bedürfen.',
    deadline: (date: string) => `Die EU-Richtlinie muss bis ${date} umgesetzt werden.`,
    recommendation: 'Diese Empfehlung basiert auf automatisierter Analyse und ersetzt keine Rechtsberatung.'
  }
} as const;

// =====================================================
// LEERE ZUSTÄNDE (Empty States)
// =====================================================

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ 
  icon: Icon = Info, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-6 text-center',
      className
    )}>
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">{description}</p>
      {action}
    </div>
  );
}

// =====================================================
// DATEN-ANZEIGE MIT KONTEXT
// =====================================================

interface DataValueProps {
  label: string;
  value: string | number | null;
  context?: string;
  status?: StatusLevel;
  format?: 'text' | 'currency' | 'percent' | 'number';
  helpText?: string;
  className?: string;
}

export function DataValue({ 
  label, 
  value, 
  context,
  status,
  format = 'text',
  helpText,
  className 
}: DataValueProps) {
  const formatValue = () => {
    if (value === null || value === undefined) return '—';
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('de-DE', { 
          style: 'currency', 
          currency: 'EUR',
          maximumFractionDigits: 0 
        }).format(Number(value));
      case 'percent':
        return `${Number(value).toFixed(1)}%`;
      case 'number':
        return new Intl.NumberFormat('de-DE').format(Number(value));
      default:
        return String(value);
    }
  };
  
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground">{label}</span>
        {helpText && <ContextHelp>{helpText}</ContextHelp>}
      </div>
      <div className="flex items-center gap-2">
        {status && <StatusIndicator status={status} />}
        <span className="text-lg font-medium">{formatValue()}</span>
      </div>
      {context && (
        <p className="text-xs text-muted-foreground">{context}</p>
      )}
    </div>
  );
}

// =====================================================
// FORTSCHRITTS-INDIKATOR MIT KONTEXT
// =====================================================

interface ProgressWithContextProps {
  value: number;
  max?: number;
  label: string;
  context?: string;
  showPercent?: boolean;
  status?: StatusLevel;
  className?: string;
}

export function ProgressWithContext({
  value,
  max = 100,
  label,
  context,
  showPercent = true,
  status = 'neutral',
  className
}: ProgressWithContextProps) {
  const percent = Math.min(100, (value / max) * 100);
  
  const barColors: Record<StatusLevel, string> = {
    success: 'bg-status-success',
    warning: 'bg-status-warning',
    danger: 'bg-status-danger',
    neutral: 'bg-primary'
  };
  
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {showPercent && (
          <span className="text-sm text-muted-foreground">{percent.toFixed(0)}%</span>
        )}
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div 
          className={cn('h-full rounded-full transition-all duration-500', barColors[status])}
          style={{ width: `${percent}%` }}
        />
      </div>
      {context && (
        <p className="text-xs text-muted-foreground">{context}</p>
      )}
    </div>
  );
}
