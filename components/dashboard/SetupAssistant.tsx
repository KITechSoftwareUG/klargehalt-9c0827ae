'use client';

import Link from 'next/link';
import { CheckCircle2, ArrowRight, Shield, BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { SetupReadiness, SetupStep } from '@/hooks/useSetupReadiness';

interface SetupAssistantProps {
  readiness: SetupReadiness;
}

function StepCard({ step, index }: { step: SetupStep; index: number }) {
  const countLabel =
    step.count === 0
      ? `0 ${step.label}`
      : step.done
        ? `${step.count} ${step.label}`
        : `${step.count} / mind. ${step.required} benötigt`;

  return (
    <Card className="border border-slate-200">
      <CardContent className="flex items-center gap-4 py-3 px-4">
        {/* Status circle */}
        <div className="flex-shrink-0">
          {step.done ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-300 text-xs font-semibold text-slate-500">
              {index + 1}
            </div>
          )}
        </div>

        {/* Label + compliance reason */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900">{step.label}</p>
          <p className="mt-0.5 text-xs text-slate-500 leading-snug">{step.complianceReason}</p>
        </div>

        {/* Count badge */}
        <div className="flex-shrink-0 text-xs text-slate-500 hidden sm:block">{countLabel}</div>

        {/* Action button */}
        <div className="flex-shrink-0">
          {step.done ? (
            <Link href={step.href}>
              <Button variant="ghost" size="sm">
                Bearbeiten
              </Button>
            </Link>
          ) : (
            <Link href={step.href}>
              <Button variant="default" size="sm">
                Jetzt einrichten
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SetupAssistant({ readiness }: SetupAssistantProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Einrichtung vorbereiten</h1>
          <p className="mt-1 text-sm text-slate-500">
            Richten Sie die folgenden Bereiche ein, um Ihre Compliance-Analyse zu starten und die
            EU-Entgelttransparenzrichtlinie zu erfüllen.
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 font-medium">
            {readiness.completedCount} von 5 Schritten abgeschlossen
          </span>
          <span className="text-slate-400">{readiness.percentage}%</span>
        </div>
        <Progress value={readiness.percentage} className="h-2" />
      </div>

      {/* Steps list */}
      <div className="space-y-3">
        {readiness.steps.map((step, index) => (
          <StepCard key={step.id} step={step} index={index} />
        ))}
      </div>

      {/* CTA */}
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="hero"
                  disabled={!readiness.isAnalysisReady}
                  onClick={() => window.location.reload()}
                  className="w-full sm:w-auto"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Erste Compliance-Analyse starten
                </Button>
              </span>
            </TooltipTrigger>
            {!readiness.isAnalysisReady && (
              <TooltipContent>
                <p>Bitte richten Sie zunächst alle 5 Bereiche ein.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {readiness.completedCount > 0 && !readiness.isAnalysisReady && (
          <p className="text-xs text-slate-400">
            Noch {5 - readiness.completedCount}{' '}
            {5 - readiness.completedCount === 1 ? 'Schritt' : 'Schritte'} ausstehend
          </p>
        )}
      </div>
    </div>
  );
}
