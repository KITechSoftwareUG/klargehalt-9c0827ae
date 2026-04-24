'use client';

import { useSetupReadiness } from '@/hooks/useSetupReadiness';
import SetupAssistant from '@/components/dashboard/SetupAssistant';
import SetupProgressBanner from '@/components/dashboard/SetupProgressBanner';
import ComplianceCommandCenter from '@/components/dashboard/ComplianceCommandCenter';
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
    <>
      {!readiness.isAnalysisReady && (
        <div className="mb-6">
          <SetupProgressBanner readiness={readiness} />
        </div>
      )}
      <ComplianceCommandCenter />
    </>
  );
}
