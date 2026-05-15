'use client';

import { useSetupReadiness } from '@/hooks/useSetupReadiness';
import SetupAssistant from '@/components/dashboard/SetupAssistant';
import SetupProgressBanner from '@/components/dashboard/SetupProgressBanner';
import ComplianceCommandCenter from '@/components/dashboard/ComplianceCommandCenter';
import CompMatrixOverview from '@/components/dashboard/CompMatrixOverview';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const readiness = useSetupReadiness();

  if (readiness.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="space-y-3 mt-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!readiness.isMinimallyUsable) {
    return <SetupAssistant readiness={readiness} />;
  }

  return (
    <div className="space-y-8">
      {!readiness.isAnalysisReady && (
        <SetupProgressBanner readiness={readiness} />
      )}

      {/* Primary: compensation-matrix overview + KPIs + decision trail */}
      <CompMatrixOverview />

      {/* Secondary: compliance-obligation command center */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Rechtliche Pflichten
        </h2>
        <ComplianceCommandCenter />
      </div>
    </div>
  );
}
