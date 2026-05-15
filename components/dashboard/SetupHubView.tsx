'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  ArrowRight,
  Shield,
  BarChart3,
  Lock,
  Building,
  Layers,
  Building2,
  Scale,
  Users,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { useSetupReadiness, type SetupPhase, type SetupStep } from '@/hooks/useSetupReadiness';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRoleAccess } from '@/components/RoleGuard';
import AccessDenied from '@/components/dashboard/AccessDenied';

const STEP_ICON: Record<SetupStep['id'], React.ElementType> = {
  departments: Building,
  levels: Layers,
  profiles: Building2,
  bands: Scale,
  employees: Users,
  decisions: FileCheck,
};

function StepRow({ step }: { step: SetupStep }) {
  const Icon = STEP_ICON[step.id];
  const countLabel =
    step.count === 0
      ? `0 ${step.label}`
      : step.done
        ? `${step.count} ${step.label}`
        : `${step.count} von mind. ${step.required}`;

  return (
    <div className="flex items-center gap-4 px-4 py-3 first:pt-4 last:pb-4 border-t border-slate-100 first:border-t-0">
      <div className="flex-shrink-0">
        {step.done ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{step.label}</p>
        <p className="mt-0.5 text-xs text-slate-500 leading-snug">{step.complianceReason}</p>
      </div>
      <div className="flex-shrink-0 hidden sm:block text-xs text-slate-500 tabular-nums">
        {countLabel}
      </div>
      <div className="flex-shrink-0">
        <Link href={step.href}>
          <Button variant={step.done ? 'ghost' : 'default'} size="sm">
            {step.done ? 'Bearbeiten' : 'Einrichten'}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function PhaseCard({ phase, locked }: { phase: SetupPhase; locked: boolean }) {
  const isAnalysisPhase = phase.id === 'analysis';
  const stateClass = phase.done
    ? 'border-emerald-200 bg-emerald-50/30'
    : locked
      ? 'border-slate-200 bg-slate-50/50 opacity-70'
      : 'border-slate-200 bg-white';

  return (
    <Card className={`overflow-hidden border ${stateClass}`}>
      <CardContent className="p-0">
        <div className="flex items-start gap-4 px-5 pt-5 pb-4">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
              phase.done
                ? 'bg-emerald-500 text-white'
                : locked
                  ? 'bg-slate-200 text-slate-500'
                  : 'bg-primary/10 text-primary'
            }`}
          >
            {phase.done ? <CheckCircle2 className="h-5 w-5" /> : locked ? <Lock className="h-4 w-4" /> : phase.number}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Phase {phase.number}
                </p>
                <h2 className="text-base font-semibold text-slate-900 mt-0.5">{phase.title}</h2>
              </div>
              {!isAnalysisPhase && phase.steps.length > 0 && (
                <div className="text-xs text-slate-500 tabular-nums flex-shrink-0">
                  {phase.steps.filter((s) => s.done).length} / {phase.steps.length}
                </div>
              )}
            </div>
            <p className="mt-1 text-sm font-medium text-slate-600">{phase.subtitle}</p>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">{phase.intent}</p>
          </div>
        </div>

        {!isAnalysisPhase && phase.id === 'structure' && (
          <div className="bg-white border-t border-slate-100 px-5 py-3 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Empfohlen: Abteilungen und Karrierestufen gemeinsam im geführten Workshop anlegen — inklusive
              Tech-Startup-Vorlage für einen schnellen Start.
            </p>
            <Link href="/einrichtung/struktur" className="flex-shrink-0">
              <Button variant="default" size="sm">
                Workshop öffnen
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        )}

        {!isAnalysisPhase && phase.steps.length > 0 && (
          <div className={`bg-white ${phase.id === 'structure' ? '' : 'border-t'} border-slate-100`}>
            {phase.steps.map((step) => (
              <StepRow key={step.id} step={step} />
            ))}
          </div>
        )}

        {isAnalysisPhase && (
          <div className="bg-white border-t border-slate-100 px-5 py-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              {phase.done
                ? 'Alle Voraussetzungen erfüllt. Compliance-Analyse, Pay-Gap-Report und Dashboard sind aktiv.'
                : 'Sobald die Bereiche aus Phase 1 bis 3 stehen, schaltet sich die Pay-Gap-Analyse automatisch frei.'}
            </p>
            <Link href="/dashboard">
              <Button variant={phase.done ? 'hero' : 'outline'} size="sm" disabled={!phase.done}>
                <BarChart3 className="mr-1.5 h-4 w-4" />
                {phase.done ? 'Analyse öffnen' : 'Noch gesperrt'}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function SetupHubView() {
  const canAccess = useRoleAccess('owner', 'admin', 'hr_manager');
  const readiness = useSetupReadiness();

  if (!canAccess) {
    return <AccessDenied />;
  }

  if (readiness.isLoading) {
    return <LoadingState />;
  }

  const totalSteps = readiness.steps.length;
  const doneSteps = readiness.steps.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Shield className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-900">Compliance-Einrichtung</h1>
          <p className="mt-1 text-sm text-slate-500 leading-relaxed max-w-2xl">
            Dein strukturierter Pfad zu einer sauberen Datengrundlage. Arbeite die Phasen der
            Reihe nach durch — sobald Phase 1 bis 3 stehen, schalten sich Pay-Gap-Analyse und
            Compliance-Dashboard automatisch frei. KI-gestützte Auswertungen folgen später,
            auf Basis dieser geprüften Struktur.
          </p>
        </div>
      </div>

      {/* Overall progress */}
      <Card className="border border-slate-200">
        <CardContent className="py-5">
          <div className="flex items-center justify-between mb-3 gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {doneSteps} von {totalSteps} Bausteinen abgeschlossen
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Kernanalyse {readiness.completedCount} / 5 ·{' '}
                {readiness.isAnalysisReady ? (
                  <span className="text-emerald-600 font-medium inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> freigeschaltet
                  </span>
                ) : (
                  <span className="text-slate-500">
                    noch {5 - readiness.completedCount} Schritt(e) für die Analyse
                  </span>
                )}
              </p>
            </div>
            <div className="text-2xl font-semibold text-slate-900 tabular-nums">
              {readiness.overallPercentage}%
            </div>
          </div>
          <Progress value={readiness.overallPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Phases */}
      <div className="space-y-4">
        {readiness.phases.map((phase) => {
          const locked = phase.id === 'analysis' && !readiness.isAnalysisReady;
          return <PhaseCard key={phase.id} phase={phase} locked={locked} />;
        })}
      </div>

      {/* Footer hint */}
      <p className="text-xs text-slate-400 text-center max-w-xl mx-auto pt-2">
        Schnellzugriff auf einzelne Bereiche findest du jederzeit in der Seitenleiste. Diese Seite
        bleibt dein zentraler Ausgangspunkt und zeigt dir, wo du stehst.
      </p>
    </div>
  );
}
