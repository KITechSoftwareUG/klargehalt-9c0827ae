'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SetupReadiness } from '@/hooks/useSetupReadiness';

interface SetupProgressBannerProps {
  readiness: SetupReadiness;
}

export default function SetupProgressBanner({ readiness }: SetupProgressBannerProps) {
  if (readiness.isAnalysisReady || !readiness.isMinimallyUsable) {
    return null;
  }

  const missingSteps = readiness.steps.filter((s) => !s.done);
  const firstMissing = missingSteps[0];

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm bg-amber-50 border-b border-amber-200 text-amber-800">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>
          Einrichtung {readiness.completedCount}/5 — Noch fehlend:{' '}
          <strong>{missingSteps.map((s) => s.label).join(', ')}</strong>
        </span>
      </div>
      {firstMissing && (
        <Link href={firstMissing.href}>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-amber-300 text-amber-800 hover:bg-amber-100"
          >
            {firstMissing.label} einrichten
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      )}
    </div>
  );
}
