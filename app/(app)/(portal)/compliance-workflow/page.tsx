'use client';

import { useAuth } from '@/hooks/useAuth';
import ComplianceWorkflowView from '@/components/dashboard/ComplianceWorkflowView';
import LawyerAssessmentPanel from '@/components/dashboard/LawyerAssessmentPanel';
import { Skeleton } from '@/components/ui/skeleton';

export default function ComplianceWorkflowPage() {
  const { role, isLoaded } = useAuth();

  if (!isLoaded) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-32 w-full" />
    </div>
  );

  if (role === 'lawyer') return <LawyerAssessmentPanel />;
  return <ComplianceWorkflowView />;
}
