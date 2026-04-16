'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Shield,
  Clock,
  Info,
  BarChart3,
} from 'lucide-react';
import { useComplianceStatus, ComplianceObligation } from '@/hooks/useComplianceStatus';

// ---- Helpers ----------------------------------------------------------------

function daysUntil(isoDate: string): number {
  const ms = new Date(isoDate).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function formatDeadline(isoDate: string): { label: string; overdue: boolean } {
  const days = daysUntil(isoDate);
  if (days < 0) {
    return { label: 'ÜBERFÄLLIG', overdue: true };
  }
  if (days === 0) {
    return { label: 'Heute fällig', overdue: false };
  }
  return { label: `in ${days} Tag${days === 1 ? '' : 'en'}`, overdue: false };
}

function scoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-600';
  if (score >= 70) return 'text-amber-600';
  return 'text-red-600';
}

function scoreRingColor(score: number): string {
  if (score >= 90) return 'stroke-emerald-500';
  if (score >= 70) return 'stroke-amber-500';
  return 'stroke-red-500';
}

function scoreTrackColor(score: number): string {
  if (score >= 90) return 'bg-emerald-500';
  if (score >= 70) return 'bg-amber-500';
  return 'bg-red-500';
}

// ---- Status icon ------------------------------------------------------------

function StatusIcon({ status }: { status: ComplianceObligation['status'] }) {
  switch (status) {
    case 'pass':
      return <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />;
    case 'warn':
      return <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />;
    case 'fail':
      return <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />;
    default:
      return <Info className="h-5 w-5 text-muted-foreground flex-shrink-0" />;
  }
}

// ---- Obligation card classes by status --------------------------------------

function obligationCardClasses(status: ComplianceObligation['status']): string {
  const base = 'rounded-lg border p-4 transition-colors';
  switch (status) {
    case 'pass':
      return `${base} bg-emerald-50 border-emerald-200`;
    case 'warn':
      return `${base} bg-amber-50 border-amber-200`;
    case 'fail':
      return `${base} bg-red-50 border-red-200`;
    default:
      return `${base} bg-muted/30 border-border`;
  }
}

function articleBadgeClasses(status: ComplianceObligation['status']): string {
  switch (status) {
    case 'pass':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'warn':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'fail':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function statusLabel(status: ComplianceObligation['status']): string {
  switch (status) {
    case 'pass':
      return 'Erfüllt';
    case 'warn':
      return 'Warnung';
    case 'fail':
      return 'Verstoß';
    default:
      return 'N/A';
  }
}

// ---- ScoreCircle ------------------------------------------------------------

function ScoreCircle({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
        {/* Track */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-muted-foreground/20"
        />
        {/* Progress */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={scoreRingColor(score)}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span
        className={`absolute text-2xl font-bold tabular-nums ${scoreColor(score)}`}
      >
        {score}%
      </span>
    </div>
  );
}

// ---- Skeleton ---------------------------------------------------------------

function ComplianceSkeleton() {
  return (
    <div className="space-y-6">
      {/* Score card skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-6">
          <Skeleton className="h-32 w-32 rounded-full" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-2 w-full max-w-xs" />
        </CardContent>
      </Card>

      {/* Obligation card skeletons */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-full" />
              </div>
              <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Obligation Card --------------------------------------------------------

function ObligationCard({ obligation }: { obligation: ComplianceObligation }) {
  const { status, article, title, description, deadline, actionRequired, detail } = obligation;

  const deadlineInfo = deadline ? formatDeadline(deadline) : null;

  return (
    <div className={obligationCardClasses(status)}>
      <div className="flex items-start gap-3">
        <StatusIcon status={status} />
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className={`text-xs font-semibold ${articleBadgeClasses(status)}`}
            >
              {article}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs ${articleBadgeClasses(status)}`}
            >
              {statusLabel(status)}
            </Badge>
          </div>

          {/* Title & description */}
          <p className="font-semibold text-sm leading-snug">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>

          {/* Detail */}
          {detail && (
            <p className="text-xs mt-1.5 text-foreground/70">{detail}</p>
          )}

          {/* Action required */}
          {actionRequired && (status === 'warn' || status === 'fail') && (
            <Alert
              className={`mt-2 py-2 px-3 ${
                status === 'fail'
                  ? 'bg-red-100/60 border-red-300 text-red-800'
                  : 'bg-amber-100/60 border-amber-300 text-amber-800'
              }`}
            >
              <AlertDescription className="text-xs leading-snug">
                {actionRequired}
              </AlertDescription>
            </Alert>
          )}

          {/* Deadline */}
          {deadlineInfo && (
            <div className="flex items-center gap-1 mt-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span
                className={`text-xs font-medium ${
                  deadlineInfo.overdue ? 'text-red-600' : 'text-muted-foreground'
                }`}
              >
                Frist:{' '}
                {deadlineInfo.overdue ? (
                  <span className="font-bold uppercase">{deadlineInfo.label}</span>
                ) : (
                  deadlineInfo.label
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Main component ---------------------------------------------------------

export default function ComplianceCommandCenter() {
  const { data, isLoading, refetch } = useComplianceStatus();

  if (isLoading) {
    return <ComplianceSkeleton />;
  }

  if (!data) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <BarChart3 className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="text-lg font-semibold">Keine Compliance-Daten verfügbar</p>
            <p className="text-sm text-muted-foreground mt-1">
              Starten Sie eine Pay-Gap-Analyse, um Ihren Compliance-Status zu ermitteln.
            </p>
          </div>
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Jetzt prüfen
          </Button>
        </div>
      </Card>
    );
  }

  const { score, obligations, totalObligations, passingCount, warningCount, failingCount, lastChecked } =
    data;

  const lastCheckedFormatted = new Date(lastChecked).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">Compliance Center</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              EU-Entgelttransparenzrichtlinie 2023/970 – Rechtliche Bereitschaft auf einen Blick
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                className="flex-shrink-0"
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Aktualisieren
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Letzte Aktualisierung: {lastCheckedFormatted}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Score card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Compliance-Score</CardTitle>
            <CardDescription>
              Letzte Prüfung: {lastCheckedFormatted}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Circle */}
              <div className="flex flex-col items-center gap-2">
                <ScoreCircle score={score} />
                <p className={`text-sm font-medium ${scoreColor(score)}`}>
                  {score >= 90
                    ? 'Sehr gut – Weiter so!'
                    : score >= 70
                    ? 'Verbesserungsbedarf'
                    : 'Dringender Handlungsbedarf'}
                </p>
              </div>

              {/* Stats */}
              <div className="flex-1 w-full space-y-3">
                <p className="text-sm font-medium text-center sm:text-left">
                  {passingCount} von {totalObligations} Pflichten erfüllt
                </p>

                {/* Progress bar */}
                <div className="relative w-full">
                  <Progress
                    value={score}
                    className={`h-3 ${scoreTrackColor(score)}`}
                  />
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-2">
                    <p className="text-lg font-bold text-emerald-700">{passingCount}</p>
                    <p className="text-xs text-emerald-600">Erfüllt</p>
                  </div>
                  <div className="rounded-md bg-amber-50 border border-amber-200 px-2 py-2">
                    <p className="text-lg font-bold text-amber-700">{warningCount}</p>
                    <p className="text-xs text-amber-600">Warnungen</p>
                  </div>
                  <div className="rounded-md bg-red-50 border border-red-200 px-2 py-2">
                    <p className="text-lg font-bold text-red-700">{failingCount}</p>
                    <p className="text-xs text-red-600">Verstöße</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Obligation cards */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Rechtliche Pflichten im Detail
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {obligations.map((obligation) => (
              <ObligationCard key={obligation.id} obligation={obligation} />
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground text-center pb-2">
          Basierend auf EU-Entgelttransparenzrichtlinie 2023/970. Kein Rechtsberatungsersatz.
        </p>
      </div>
    </TooltipProvider>
  );
}
